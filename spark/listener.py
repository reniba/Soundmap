import os
import json
from datetime import datetime, timezone
from pyspark.sql.streaming import StreamingQueryListener


def _parse_interval_ms(value: str) -> int:
    """Converte strings como '30 seconds' ou '500 milliseconds' para milissegundos."""
    parts = value.strip().split()
    amount = float(parts[0])
    unit   = parts[1].lower().rstrip("s")  # "seconds" → "second", "milliseconds" → "millisecond"
    if unit in ("second",):
        return int(amount * 1000)
    if unit in ("millisecond",):
        return int(amount)
    if unit in ("minute",):
        return int(amount * 60_000)
    raise ValueError(f"Unidade de intervalo não suportada: {value!r}")


class MetricsListener(StreamingQueryListener):
    """
    Intercepta o ciclo de vida de cada micro-batch e persiste
    as métricas de desempenho na tabela batch_metrics do PostgreSQL.
    """

    def __init__(self, postgres_url, postgres_props, run_config, e2e_cache):
        self.postgres_url   = postgres_url
        self.postgres_props = postgres_props
        self.run_config     = run_config  # trigger_interval, cpus, load, edge
        self.e2e_cache      = e2e_cache   # preenchido pelo writer antes do onQueryProgress

    def get_horario(self):
        """
        Retorna o horário do dia (manhã, tarde, noite) com base na hora atual.
        """
        now = datetime.now().time()
        if now >= datetime.strptime("06:00:00", "%H:%M:%S").time() and now < datetime.strptime("12:00:00", "%H:%M:%S").time():
            return "morning"
        elif now >= datetime.strptime("12:00:00", "%H:%M:%S").time() and now < datetime.strptime("18:00:00", "%H:%M:%S").time():
            return "afternoon"
        else:
            return "night"

    def onQueryStarted(self, event):
        print(f"[Listener] Query iniciada: {event.id}")

    def onQueryTerminated(self, event):
        print(f"[Listener] Query encerrada: {event.id}")

    def onQueryProgress(self, event):
        progress = event.progress

        # extrai campos do durationMs com fallback para 0
        duration    = progress.durationMs or {}
        print(f"[Listener] durationMs raw: {progress.durationMs}")
        trigger_exec = duration.get("triggerExecution", 0)
        sched_delay  = duration.get("latestOffset", 0)
        queryPlanning = duration.get("queryPlanning", 0)
        getBatch = duration.get("getBatch", 0)
        commitOffsets = duration.get("commitOffsets", 0)
        latestOffset = duration.get("latestOffset", 0)
        addBatch = duration.get("addBatch", 0)
        wal_commit  = duration.get("walCommit", 0)

        record = {
            "batch_id":            progress.batchId,
            "run_id":              self.run_config["run_id"],
            "batch_timestamp":     datetime.now(timezone.utc).isoformat(),

            "round_id":               os.getenv("ROUND_ID", "R1"),
            "trigger_interval_ms":    self.run_config["trigger_interval_ms"],
            "frequency_checkpoint_ms": _parse_interval_ms(os.getenv("CHECKPOINT_INTERVAL", "30 seconds")),
            "frequency_hz":           int(os.getenv("FREQUENCY_HZ", 1)),
            "spark_cpus":          self.run_config["spark_cpus"],
            "load_level":          self.run_config["load_level"],
            "edge_computing":      self.run_config["edge_computing"],
            "horario":            self.get_horario(),

            "input_rows":          progress.numInputRows,
            "input_rows_per_sec":  progress.inputRowsPerSecond,
            "proc_rows_per_sec":   progress.processedRowsPerSecond,
            
            "trigger_exec_ms":     trigger_exec,
            "wal_commit_ms":       wal_commit,
            "scheduling_delay_ms": sched_delay,
            "query_planning_ms":   queryPlanning,
            "add_batch_ms":        addBatch,
        
            "e2e_latency_ms": self.e2e_cache.pop(progress.batchId, None),
        
            "fault_injected": os.getenv("FAULT_INJECTION", "false").lower() == "true",
            #"kafka_offset_start": progress.sources[0].startOffset,
            #"kafka_offset_end": progress.sources[0].endOffset,
            "events_expected": int(self.run_config["trigger_interval_ms"] / 1000 * float(os.getenv("FREQUENCY_HZ", 1)) * float(os.getenv("NUM_SENSORS", 1))),
            "events_recovered": progress.numInputRows,
            #"recovery_time_ms": duration.get("addBatch", 0) if progress.numInputRows < self.run_config["events_expected"] else 0,
        }

        # escrita assíncrona — não bloqueia o pipeline principal
        try:
            import psycopg2
            conn = psycopg2.connect(
                host=os.environ.get("DB_HOST", "localhost"),
                port=os.environ.get("DB_PORT", 5432),
                dbname=os.environ.get("DB_NAME", "metrics"),
                user=os.environ.get("DB_USER", "metrics_user"),
                password=os.environ.get("DB_PASSWORD", "metrics_password"),
            )
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO batch_metrics (
                    batch_id, run_id, batch_timestamp, round_id,
                    trigger_interval_ms, frequency_checkpoint_ms, frequency_hz, spark_cpus,
                    load_level, edge_computing, horario, input_rows,
                    input_rows_per_sec, proc_rows_per_sec,
                    trigger_exec_ms, wal_commit_ms, scheduling_delay_ms,
                    e2e_latency_ms, query_planning_ms, add_batch_ms,
                    fault_injected,
                    events_expected, events_recovered
                ) VALUES (
                    %(batch_id)s, %(run_id)s, %(batch_timestamp)s, %(round_id)s,
                    %(trigger_interval_ms)s, %(frequency_checkpoint_ms)s, %(frequency_hz)s, %(spark_cpus)s,
                    %(load_level)s, %(edge_computing)s, %(horario)s,
                    %(input_rows)s, %(input_rows_per_sec)s,
                    %(proc_rows_per_sec)s, %(trigger_exec_ms)s,
                    %(wal_commit_ms)s, %(scheduling_delay_ms)s,
                    %(e2e_latency_ms)s, %(query_planning_ms)s, %(add_batch_ms)s,
                    %(fault_injected)s,
                    %(events_expected)s, %(events_recovered)s
                )
            """, record)
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            print(f"[Listener] Erro ao gravar métricas: {e}")