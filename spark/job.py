import os
import uuid
from pyspark.sql import SparkSession
from consumer  import read_stream, read_stream_app
from processor import aggregate_app, aggregate_raw, aggregate_edge
from writer    import write_batch, write_batch_app
from listener  import MetricsListener


# ─── Configuração via variáveis de ambiente ───────────────
KAFKA_BROKER         = os.environ["KAFKA_BROKER"]
KAFKA_TOPIC          = os.environ["KAFKA_TOPIC"]
KAFKA_APP_TOPIC      = os.environ["KAFKA_APP_TOPIC"]
TRIGGER_INTERVAL     = os.environ.get("TRIGGER_INTERVAL", "5 seconds")
CHECKPOINT_INTERVAL  = os.environ.get("CHECKPOINT_INTERVAL", "30 seconds")
CHECKPOINT_DIR       = os.environ.get("CHECKPOINT_DIR", "/checkpoint")
SPARK_CPUS           = int(os.environ.get("SPARK_MASTER_CPUS", 2))
EDGE_COMPUTING       = os.environ.get("EDGE_COMPUTING", "false").lower() == "true"
WINDOW_DURATION      = os.environ.get("WINDOW_DURATION", "30 seconds")
WATERMARK            = os.environ.get("WATERMARK", "1 minute")

PG_HOST     = os.environ.get("DB_HOST", "postgres")
PG_PORT     = os.environ.get("DB_PORT", "5432")
PG_DB       = os.environ.get("DB_NAME", "noisedb")
PG_USER     = os.environ.get("DB_USER", "noise")
PG_PASSWORD = os.environ.get("DB_PASSWORD", "noise")

REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = int(os.environ.get("REDIS_PORT", "6379"))

POSTGRES_URL = f"jdbc:postgresql://{PG_HOST}:{PG_PORT}/{PG_DB}"
POSTGRES_PROPS = {
    "user":     PG_USER,
    "password": PG_PASSWORD,
    "driver":   "org.postgresql.Driver",
    "pg_dsn":   f"host={PG_HOST} port={PG_PORT} dbname={PG_DB} "
                f"user={PG_USER} password={PG_PASSWORD}",
}

# identificador único da execução experimental
RUN_ID = str(uuid.uuid4())[:8]

def _parse_interval_ms(interval: str) -> int:
    s = interval.strip()
    if s.endswith("ms"):
        return int(s[:-2])
    if "seconds" in s:
        return int(s.replace(" seconds", "").replace("seconds", "")) * 1000
    if "minutes" in s:
        return int(s.replace(" minutes", "").replace("minutes", "")) * 60_000
    return int(s)

TRIGGER_INTERVAL_MS     = _parse_interval_ms(TRIGGER_INTERVAL)
CHECKPOINT_INTERVAL_MS  = _parse_interval_ms(CHECKPOINT_INTERVAL)

RUN_CONFIG = {
    "run_id":                 RUN_ID,
    "trigger_interval_ms":    TRIGGER_INTERVAL_MS,
    "checkpoint_interval_ms": CHECKPOINT_INTERVAL_MS,
    "spark_cpus":          SPARK_CPUS,
    "load_level":          os.environ.get("LOAD_LEVEL", "medium"),
    "edge_computing":      EDGE_COMPUTING,
    "pg_host":             PG_HOST,
    "pg_port":             PG_PORT,
    "pg_db":               PG_DB,
    "pg_user":             PG_USER,
    "pg_password":         PG_PASSWORD,
}

# ─── SparkSession ─────────────────────────────────────────
spark = (
    SparkSession.builder
    .appName("NoiseMonitoring")
    .master(f"local[{SPARK_CPUS}]")
    .config("spark.sql.shuffle.partitions", str(SPARK_CPUS))
    .config("spark.streaming.backpressure.enabled", "true")
    .config("spark.sql.streaming.checkpointInterval", str(CHECKPOINT_INTERVAL_MS))
    .getOrCreate()
)

spark.sparkContext.setLogLevel("WARN")

# ─── Observabilidade ──────────────────────────────────────
# dict compartilhado entre writer e listener para passar e2e_latency_ms
# writer escreve, listener lê na hora do INSERT
e2e_cache = {}

spark.streams.addListener(
    MetricsListener(POSTGRES_URL, POSTGRES_PROPS, RUN_CONFIG, e2e_cache)
)

# ─── Pipeline ─────────────────────────────────────────────
stream_df = read_stream(spark, KAFKA_BROKER, KAFKA_TOPIC, EDGE_COMPUTING)
stream_app_df = read_stream_app(spark, KAFKA_BROKER, KAFKA_APP_TOPIC)

if EDGE_COMPUTING:
    aggregated = aggregate_edge(stream_df, window_duration=WINDOW_DURATION, watermark=WATERMARK)
else:
    aggregated = aggregate_raw(stream_df, window_duration=WINDOW_DURATION, watermark=WATERMARK)

app_aggregated = aggregate_app(stream_app_df, window_duration=WINDOW_DURATION, watermark=WATERMARK)

# ─── Sink ─────────────────────────────────────────────────
query = (
    aggregated
    .writeStream
    .foreachBatch(
        lambda df, batch_id: write_batch(
            df, batch_id, POSTGRES_URL, POSTGRES_PROPS, e2e_cache, RUN_ID,
            REDIS_HOST, REDIS_PORT
        )
    )
    .option("checkpointLocation", CHECKPOINT_DIR)
    .trigger(processingTime=TRIGGER_INTERVAL)
    .start()
)

query_app = {app_aggregated
             .writeStream
             .foreachBatch(
                 lambda df, batch_id: write_batch_app(
                     df, batch_id, REDIS_HOST, REDIS_PORT
                 )
             )
             .option("checkpointLocation", CHECKPOINT_DIR + "_app")
             .trigger(processingTime=TRIGGER_INTERVAL)
             .start()
             }

print(f"[Job] Iniciado — run_id={RUN_ID}, trigger={TRIGGER_INTERVAL}, "
      f"window={WINDOW_DURATION}, watermark={WATERMARK}, "
      f"checkpoint={CHECKPOINT_INTERVAL}, cpus={SPARK_CPUS}, edge={EDGE_COMPUTING}")

query.awaitTermination()