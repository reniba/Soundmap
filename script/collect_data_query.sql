WITH stats AS (
    -- 1. Calcula a média e o desvio padrão do período
    SELECT 
        AVG(e2e_latency_ms) AS media_lat,
        STDDEV(e2e_latency_ms) AS desvio_lat,
        AVG(proc_rows_per_sec) AS media_tpt,
        STDDEV(proc_rows_per_sec) AS desvio_tpt
    FROM batch_metrics
    WHERE batch_timestamp >= '2026-06-07 23:50:00' 
      AND batch_timestamp <= '2026-06-08 00:05:00'
)
-- 2. Calcula as médias limpas
SELECT 
    AVG(b.e2e_latency_ms) AS avg_latency_limpa,
    AVG(b.proc_rows_per_sec) AS avg_throughput_limpo
FROM batch_metrics b
CROSS JOIN stats s
WHERE b.batch_timestamp >= '2026-06-07 23:50:00' 
  AND b.batch_timestamp <= '2026-06-08 00:05:00'
  -- Filtro 1: Remove os outliers de Latência (usando >= e <= em vez de BETWEEN)
  AND b.e2e_latency_ms >= (s.media_lat - 2 * s.desvio_lat) 
  AND b.e2e_latency_ms <= (s.media_lat + 2 * s.desvio_lat)                             
 -- Filtro 2: Remove os outliers de Throughput (usando >= e <= em vez de BETWEEN)
  AND b.proc_rows_per_sec >= (s.media_tpt - 2 * s.desvio_tpt) 
  AND b.proc_rows_per_sec <= (s.media_tpt + 2 * s.desvio_tpt);