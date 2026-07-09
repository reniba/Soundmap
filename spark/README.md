# Spark — Processamento de Stream

Pipeline de processamento em tempo real baseado em Apache Spark Structured Streaming. Consome o tópico Kafka `sensorData`, agrega leituras de ruído em janelas temporais e persiste os resultados no PostgreSQL.

---

## Arquitetura interna

```
job.py (ponto de entrada)
  │
  ├── consumer.py   — lê do Kafka e parseia JSON
  ├── processor.py  — agrega em janelas de 30 segundos
  ├── writer.py     — grava no PostgreSQL e calcula latência e2e
  └── listener.py   — coleta métricas de batch no banco
```

---

## Arquivos

| Arquivo | Descrição |
|---|---|
| `job.py` | Inicializa a SparkSession e orquestra o pipeline |
| `consumer.py` | Lê do Kafka, infere schema e parseia o JSON |
| `processor.py` | Aplica janelas de tempo e agrega os dB |
| `writer.py` | Grava os resultados no PostgreSQL via JDBC |
| `listener.py` | `StreamingQueryListener` — registra métricas por batch |
| `conf/metrics.properties` | Configura o sink Prometheus do Spark |
| `conf/jmx_prometheus.yml` | Configura o agente JMX para exportar métricas JVM |

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `KAFKA_BROKER` | `kafka:9092` | Endereço do broker Kafka |
| `KAFKA_TOPIC` | `sensorData` | Tópico a consumir |
| `DB_HOST` | `soundmap_db` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_NAME` | `soundmap` | Nome do banco de dados |
| `DB_USER` | `admin_g4` | Usuário do banco |
| `DB_PASSWORD` | `admin_g4` | Senha do banco |
| `TRIGGER_INTERVAL` | `5 seconds` | Intervalo do micro-batch do Spark |
| `CHECKPOINT_DIR` | `/checkpoint` | Diretório de checkpoint (tolerância a falhas) |
| `SPARK_MASTER_CPUS` | `2` | Núcleos de CPU (`local[N]`) |
| `EDGE_COMPUTING` | `false` | Altera o schema esperado do Kafka |
| `ROUND_ID` | `R1` | Identificador da rodada experimental |

---

## Pipeline de processamento

### 1. Consumo (`consumer.py`)

- Lê o tópico `sensorData` a partir do offset `latest`
- Parseia o JSON conforme o schema ativo (`EDGE_COMPUTING`)
- Adiciona a coluna `kafka_timestamp` (horário de chegada no broker)

### 2. Agregação (`processor.py`)

- **Janela:** tumbling de 30 segundos (sem sobreposição)
- **Watermark:** 1 minuto — tolera eventos atrasados
- **Chave de agregação:** `(sensor_id, latitude, longitude)`
- **Métricas calculadas:**
  - `db_avg` — média logarítmica correta para decibéis:
    ```
    db_avg = 10 × log₁₀( mean( 10^(dB/10) ) )
    ```
  - `db_max` — pico de dB na janela
  - `n_samples` — contagem de leituras
  - `first_event_ts` — timestamp do primeiro evento (para latência e2e)

### 3. Gravação (`writer.py`)

- Grava na tabela `Measure` via JDBC (driver PostgreSQL 42.7.3)
- Descarta a coluna `first_event_ts` antes de gravar (auxiliar interno)
- Calcula latência fim-a-fim: `sink_timestamp − first_event_ts` (apenas modo raw)
- Armazena `e2e_latency_ms` em `e2e_cache[batch_id]` para o listener ler no INSERT

### 4. Coleta de métricas (`listener.py`)

A cada batch concluído, o `MetricsListener` lê `e2e_cache.pop(batch_id)` e registra em `batch_metrics`:

| Campo | Descrição |
|---|---|
| `batch_id` | Número sequencial do batch |
| `trigger_exec_ms` | Tempo total de execução do trigger |
| `scheduling_delay_ms` | Tempo de espera do scheduler |
| `add_batch_ms` | Tempo de escrita no sink |
| `wal_commit_ms` | Custo do checkpoint |
| `input_rows` | Eventos processados |
| `input_rows_per_sec` | Throughput de entrada |
| `proc_rows_per_sec` | Throughput de processamento |
| `e2e_latency_ms` | Latência fim-a-fim |

---

## Portas expostas

| Porta | Serviço |
|---|---|
| `4040` | Spark UI — inspecionar jobs, stages e tasks |
| `9091` | Agente JMX → Prometheus — métricas JVM e Spark |

---

## JARs de dependência (baixados no Dockerfile)

| JAR | Finalidade |
|---|---|
| `postgresql-42.7.3.jar` | Driver JDBC para o PostgreSQL |
| `spark-sql-kafka-0-10_2.12:3.5.1` | Conector Spark ↔ Kafka |
| `kafka-clients:3.4.1` | Biblioteca Kafka |
| `jmx_prometheus_javaagent-0.20.0.jar` | Exporta métricas JVM para o Prometheus |

---

## Rodadas experimentais

| Rodada | Configuração |
|---|---|
| R1 | Base: `TRIGGER_INTERVAL=5s`, `SPARK_MASTER_CPUS=2` |
| R2–R4 | Varia trigger, CPUs e nível de carga (`SENSOR_COUNT` / `SENSOR_NUMBER`) |
| R5 | `EDGE_COMPUTING=true` — schema edge, re-agrega db_avg pré-computado |

---

## Tolerância a falhas

O Spark usa checkpointing em `CHECKPOINT_DIR` para garantir semântica *exactly-once*. Em caso de reinicialização, o job retoma a partir do último offset confirmado. Os offsets Kafka de início e fim de cada batch são registrados em `batch_metrics.kafka_offset_start` e `kafka_offset_end`.

---

## Changelog

### writer.py

- **Batches vazios**: substituído `df.rdd.isEmpty()` por `df.count()` — elimina duas ações Spark separadas e reutiliza o resultado no log.
- **Modo edge computing**: cálculo de `e2e_latency_ms` agora é guardado por `"first_event_ts" in df.columns` — `aggregate_edge` não produz essa coluna, o que causava `AnalysisException`.
- **Tabela de destino**: alterada de `noise_aggregations` (inexistente) para `Measure`.
- **Passagem de e2e para o listener**: o `UPDATE batch_metrics` foi removido do writer. O valor de `e2e_latency_ms` agora é armazenado em `e2e_cache[batch_id]` e lido pelo listener no INSERT. Motivo: `foreachBatch` roda *durante* o batch e `onQueryProgress` roda *depois* — o UPDATE chegava antes da linha existir no banco.

### listener.py

- Recebe `e2e_cache` como parâmetro no construtor.
- `e2e_latency_ms` no INSERT agora vem de `e2e_cache.pop(batch_id, None)` em vez de ser calculado como `trigger_exec + wal_commit + sched_delay` (que não representa latência sensor→sink).
- Coluna `e2e_latency_ms` adicionada explicitamente no `INSERT INTO batch_metrics`.

### job.py

- `e2e_cache = {}` criado antes do listener e passado tanto ao `MetricsListener` quanto ao `write_batch` via closure.

### database/init.sql

- Tabela `Measure` reformulada: removida coluna `origin_id` e FK para `Origin`; adicionadas colunas `sensor_id TEXT`, `latitude FLOAT`, `longitude FLOAT`, `n_samples INT` para receber diretamente o output do aggregate.
