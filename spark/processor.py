import math
from pyspark.sql import DataFrame
from pyspark.sql.functions import (
    window, avg, max as spark_max,
    count, col, min as spark_min,
)


def aggregate_raw(df: DataFrame, window_duration: str = "30 seconds",
                  watermark: str = "1 minute") -> DataFrame:
    """
    Agrega leituras brutas em janelas temporais tumbling de 30s.
    Calcula média logarítmica de dB e pico por origin/sensor por janela.
    """
    return (
        df.withWatermark("event_time", watermark)
          .groupBy(
              window(col("event_time"), window_duration),
              col("origin_id"),
              col("sensor_id"),
              col("sensor_name"),
              col("latitude"),
              col("longitude"),
          )
          .agg(
              # média em escala linear → converte de volta para dB
              (10 * (avg(col("db_level") / 10))).alias("db_avg"),
              spark_max(col("db_level")).alias("db_max"),
              count("*").alias("n_samples"),
              spark_min(col("event_time")).alias("first_event_ts"),
          )
          .select(
              col("origin_id"),
              col("sensor_id"),
              col("sensor_name"),
              col("window.start").alias("window_start"),
              col("window.end").alias("window_end"),
              col("latitude"),
              col("longitude"),
              col("db_avg"),
              col("db_max"),
              col("first_event_ts"),   # usado para calcular latência e2e
          )
    )


def aggregate_edge(df: DataFrame, window_duration: str = "30 seconds",
                   watermark: str = "1 minute") -> DataFrame:
    """
    Agrega payloads já pré-processados nos sensores (R5).
    O sensor já enviou db_avg e db_max — reagrega por janela.
    """
    return (
        df.withWatermark("timestamp", watermark)
          .groupBy(
              window(col("timestamp"), window_duration),
              col("origin_id"),
              col("sensor_id"),
              col("sensor_name"),
              col("latitude"),
              col("longitude"),
          )
          .agg(
              (10 * (avg(col("db_avg") / 10))).alias("db_avg"),
              spark_max(col("db_max")).alias("db_max"),
              count("*").alias("n_samples"),
          )
          .select(
              col("origin_id"),
              col("sensor_id"),
              col("sensor_name"),
              col("window.start").alias("window_start"),
              col("window.end").alias("window_end"),
              col("latitude"),
              col("longitude"),
              col("db_avg"),
              col("db_max"),
          )
    )

def aggregate_app(df: DataFrame, window_duration: str = "30 seconds",
                   watermark: str = "1 minute") -> DataFrame:
    """
    Agrega payloads do app (R5).
    O app já enviou measure — reagrega por janela.
    """
    print("APP-FLAG")
    return (
        df.withWatermark("timestamp", watermark)
          .groupBy(
              window(col("timestamp"), window_duration),
              col("sensorId"),
              col("userId"),
              col("areaId"),
              col("latitude"),
              col("longitude"),
          )
          .agg(
              (10 * (avg(col("measure") / 10))).alias("db_avg"),
              spark_max(col("measure")).alias("db_max"),
              count("*").alias("n_samples"),
          )
          .select(
              col("sensorId").alias("sensor_id"),
              col("userId").alias("user_id"),
              col("areaId").alias("area_id"),
              col("window.start").alias("window_start"),
              col("window.end").alias("window_end"),
              col("latitude"),
              col("longitude"),
              col("db_avg"),
              col("db_max"),
          )
    )