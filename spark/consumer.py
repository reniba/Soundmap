from pyspark.sql import SparkSession
from pyspark.sql.types import (
    StructType, StructField, StringType,
    FloatType, IntegerType, ArrayType, TimestampType, LongType
)
from pyspark.sql.functions import from_json, col, explode


# schema do payload bruto (R1, R2, R3, R4)
SCHEMA_RAW = StructType([
    StructField("origin_id",   IntegerType()),
    StructField("sensor_id",   IntegerType()),
    StructField("sensor_name", StringType()),
    StructField("latitude",    FloatType()),
    StructField("longitude",   FloatType()),
    StructField("readings", ArrayType(StructType([
        StructField("ts", StringType()),
        StructField("db", FloatType()),
    ]))),
])

# schema do payload com Edge Computing (R5)
SCHEMA_EDGE = StructType([
    StructField("origin_id",   IntegerType()),
    StructField("sensor_id",   IntegerType()),
    StructField("sensor_name", StringType()),
    StructField("latitude",    FloatType()),
    StructField("longitude",   FloatType()),
    StructField("timestamp",   StringType()),
    StructField("db_avg",      FloatType()),
    StructField("db_max",      FloatType()),
    StructField("n_samples",   IntegerType()),
])

# schema do payload do app (tópico: appData)
SCHEMA_APP_DATA = StructType([
    StructField("sensorId",   StringType()),
    StructField("latitude",   FloatType()),
    StructField("longitude",  FloatType()),
    StructField("userId",     IntegerType()),
    StructField("areaId",     IntegerType()),
    StructField("timestamp",  LongType()),  # microsegundos desde epoch
    StructField("measure",    FloatType())
])


def read_stream(spark: SparkSession, broker: str, topic: str, edge: bool):
    """
    Lê o stream do Kafka e retorna um DataFrame estruturado.
    """
    raw = (
        spark.readStream
             .format("kafka")
             .option("kafka.bootstrap.servers", broker)
             .option("subscribe", topic)
             .option("startingOffsets", "latest")
             .option("failOnDataLoss", "false")
             .load()
    )
    print(f"[Consumer] Conectado ao broker={broker}, topic={topic}, edge={edge}")

    json_df = raw.selectExpr("CAST(value AS STRING) as json_str",
                             "timestamp as kafka_ts")

    if edge:
        parsed = json_df.select(
            from_json(col("json_str"), SCHEMA_EDGE).alias("data"),
            col("kafka_ts")
        ).select("data.*", "kafka_ts")
    else:
        parsed = json_df.select(
            from_json(col("json_str"), SCHEMA_RAW).alias("data"),
            col("kafka_ts")
        ).select("data.*", "kafka_ts")

        parsed = parsed.withColumn(
            "reading", explode(col("readings"))
        ).select(
            col("origin_id"),
            col("sensor_id"),
            col("sensor_name"),
            col("latitude"),
            col("longitude"),
            col("reading.ts").cast(TimestampType()).alias("event_time"),
            col("reading.db").alias("db_level"),
            col("kafka_ts"),
        )

    print("[Consumer] Stream lido e estruturado com sucesso")
    return parsed


def read_stream_app(spark: SparkSession, broker: str, topic: str):
    """
    Lê o stream do Kafka (tópico appData) e retorna um DataFrame estruturado.
    """
    raw = (
        spark.readStream
             .format("kafka")
             .option("kafka.bootstrap.servers", broker)
             .option("subscribe", topic)
             .option("startingOffsets", "latest")
             .option("failOnDataLoss", "false")
             .load()
    )

    json_df = raw.selectExpr("CAST(value AS STRING) as json_str",
                             "timestamp as kafka_ts")

    parsed = (
        json_df
        .select(
            from_json(col("json_str"), SCHEMA_APP_DATA).alias("data"),
            col("kafka_ts"),
        )
        .select("data.*", "kafka_ts")
        .withColumn(
            "timestamp",
            (col("timestamp") / 1_000_000).cast(TimestampType()) 
        )
    )

    print(f"[Consumer APP] Conectado ao broker={broker}, topic={topic}")
    parsed.printSchema()
    return parsed