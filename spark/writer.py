import json
from datetime import datetime, timezone

from pyspark.sql.functions import (
    window, avg, max as spark_max,
    count, col, min as spark_min,
    pandas_udf, current_timestamp
)
from pyspark.sql import DataFrame


def write_batch(df, batch_id, postgres_url, postgres_props, e2e_cache, run_id,
                redis_host="redis", redis_port=6379):
    """
    Callback do foreachBatch:
    - calcula latência e2e a partir do first_event_ts
    - atualiza as chaves sensor:{sensor_id} no Redis
    - escreve os dados de negócio na tabela Measure do PostgreSQL
    - registra a latência e2e na tabela batch_metrics
    """
    count = df.count()
    print(f"[Writer] Processando batch {batch_id} com {count} linhas...")
    if count == 0:
        return

    sink_ts = datetime.now(timezone.utc)

    # latência e2e — só disponível no modo raw (aggregate_raw inclui first_event_ts)
    e2e_ms = None
    if "first_event_ts" in df.columns:
        first_event = df.agg({"first_event_ts": "min"}).collect()[0][0]
        if first_event:
            e2e_ms = (sink_ts - first_event.replace(tzinfo=timezone.utc)) \
                     .total_seconds() * 1000

    if e2e_ms is not None:
        print(f"[Writer] Latência e2e do batch {batch_id}: {e2e_ms:.2f} ms")
    else:
        print(f"[Writer] Latência e2e do batch {batch_id}: N/A")

    # Redis antes do drop para ter sensor_id e sensor_name disponíveis
    _write_redis(df, redis_host, redis_port)

    # remove colunas que não existem na tabela Measure antes do JDBC
    measure_df = df.drop("first_event_ts", "sensor_id", "sensor_name")

    print(f"[Writer] Escrevendo batch {batch_id} no PostgreSQL...")
    (
        measure_df.write
                  .jdbc(
                      url=postgres_url,
                      table="Measure",
                      mode="append",
                      properties=postgres_props,
                  )
    )
    print(f"[Writer] Batch {batch_id} escrito com sucesso.")

    if e2e_ms is not None:
        e2e_cache[batch_id] = e2e_ms

def write_batch_app(df, batch_id, redis_host="redis", redis_port=6379):
    """
    Callback do foreachBatch para os dados do app.
    Escreve os dados de negócio na tabela AppMeasure do PostgreSQL.
    """
    count = df.count()
    print(f"[Writer] Processando batch {batch_id} do app com {count} linhas...")
    if count == 0:
        return

    _write_redis_app(df, redis_host, redis_port)
    print(f"[Writer] Batch {batch_id} do app escrito no Redis com sucesso.")

def _write_redis(df: DataFrame, redis_host: str, redis_port: int):
    """
    Para cada sensor no batch, escreve sensor:{sensor_id} no Redis.

    Formato: sensor:{sensor_id} → { name, dbAverage, latitude, longitude, windowEnd }
    A chave area:{id} é responsabilidade do backend TypeScript.
    """
    try:
        import redis as redis_lib

        rows = (
            df.select("sensor_id", "sensor_name", "db_avg", "latitude", "longitude", "window_end")
              .collect()
        )
        if not rows:
            return

        r = redis_lib.Redis(host=redis_host, port=redis_port, decode_responses=True)

        for row in rows:
            window_end = row["window_end"]
            window_end_str = (
                window_end.strftime("%Y-%m-%dT%H:%M:%SZ")
                if hasattr(window_end, "strftime")
                else str(window_end)
            )

            r.set(
                f"sensor:{row['sensor_id']}",
                json.dumps({
                    "name":      row["sensor_name"],
                    "dbAverage": float(row["db_avg"]),
                    "latitude":  float(row["latitude"]),
                    "longitude": float(row["longitude"]),
                    "windowEnd": window_end_str,
                }),
            )

    except Exception as e:
        print(f"[Writer] Erro ao escrever no Redis: {e}")

def _write_redis_app(df: DataFrame, redis_host: str, redis_port: int):
    """
    Para cada sensor no batch do app, escreve app:{sensor_id} no Redis.

    Formato: app:{sensor_id} → { name, dbAverage, dbMax, latitude, longitude, windowEnd }
    Chave separada de sensor:{sensor_id} para evitar colisão.
    """
    try:
        import redis as redis_lib

        rows = (
            df.select("sensor_id", "user_id", "area_id", "db_avg", "latitude", "longitude", "window_end")
              .collect()
        )
        if not rows:
            return

        r = redis_lib.Redis(host=redis_host, port=redis_port, decode_responses=True)

        for row in rows:
            window_end = row["window_end"]
            window_end_str = (
                window_end.strftime("%Y-%m-%dT%H:%M:%SZ")
                if hasattr(window_end, "strftime")
                else str(window_end)
            )

            r.set(
                f"app:{row['user_id']}:{row['area_id']}:{row['sensor_id']}",
                json.dumps({
                    "name":      f"aplicativo {row['sensor_id']}",
                    "dbAverage": float(row["db_avg"]),
                    "latitude":  float(row["latitude"]),
                    "longitude": float(row["longitude"]),
                    "windowEnd": window_end_str,
                }),
            )

    except Exception as e:
        print(f"[Writer] Erro ao escrever no Redis (app): {e}")
