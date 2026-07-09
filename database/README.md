# Database — PostgreSQL + TimescaleDB

Banco de dados relacional com extensão TimescaleDB para séries temporais. Armazena os dados de negócio (usuários, áreas, sensores, medições) e as métricas de desempenho dos experimentos de streaming.

---

## Imagem base

`timescale/timescaledb:latest-pg15` — PostgreSQL 15 com a extensão TimescaleDB pré-instalada.

---

## Credenciais

| Parâmetro | Valor |
|---|---|
| Host (interno) | `soundmap_db` |
| Porta | `5432` |
| Database | `soundmap` |
| Usuário | `admin_g4` |
| Senha | `admin_g4` |

---

## Esquema

### Tabelas de negócio

**`users`** — Usuários da plataforma

```sql
id            SERIAL PRIMARY KEY
username      VARCHAR(40)  UNIQUE NOT NULL
email         VARCHAR(200) UNIQUE NOT NULL
hash_password VARCHAR(200) NOT NULL
```

**`area`** — Áreas de monitoramento criadas por usuários

```sql
id        SERIAL PRIMARY KEY
user_id   INT REFERENCES users(id)
name      VARCHAR(200) NOT NULL
latitude  FLOAT NOT NULL
longitude FLOAT NOT NULL
url       TEXT
-- Constraint: (user_id, name) UNIQUE
```

**`sensor`** — Sensores cadastrados

```sql
id     SERIAL PRIMARY KEY
name   VARCHAR(200) UNIQUE NOT NULL
active BOOLEAN NOT NULL
```

**`origin`** — Associação sensor ↔ área

```sql
id        SERIAL PRIMARY KEY
area_id   INT REFERENCES area(id)
sensor_id INT REFERENCES sensor(id)
active    BOOLEAN NOT NULL
```

**`noise_aggregations`** — Resultado das agregações Spark (destino do pipeline)

```sql
sensor_id    TEXT
latitude     FLOAT
longitude    FLOAT
db_avg       FLOAT   -- média logarítmica (dB)
db_max       FLOAT   -- pico (dB)
window_start TIMESTAMP
window_end   TIMESTAMP
n_samples    BIGINT
```

---

### Tabelas de métricas (experimentos)

**`batch_metrics`** — Métricas coletadas pelo `listener.py` a cada batch do Spark

#### Identificação

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | BIGSERIAL PK | |
| `run_id` | TEXT | ID único de execução (UUID gerado no início do job) |
| `batch_id` | BIGINT | Número sequencial do batch |
| `batch_timestamp` | TIMESTAMPTZ | Horário do batch |

#### Configuração do experimento

| Coluna | Valores válidos | Descrição |
|---|---|---|
| `round_id` | R1–R5 | Rodada experimental |
| `trigger_interval_ms` | 500, 1000, 2000, 5000, 10000 | Intervalo do micro-batch |
| `spark_cpus` | 1, 2 | Núcleos do Spark |
| `load_level` | low, medium, high | Nível de carga de sensores |
| `edge_computing` | BOOLEAN | Pré-agregação no sensor ativa? |
| `horario` | morning, afternoon, night | Período de coleta |

#### Métricas de volume

| Coluna | Descrição |
|---|---|
| `input_rows` | Eventos processados no batch |
| `input_rows_per_sec` | Throughput de entrada |
| `proc_rows_per_sec` | Throughput de processamento |

#### Decomposição de latência (`tt = tw + ts + tp`)

| Coluna | Equação | Descrição |
|---|---|---|
| `trigger_exec_ms` | `tt` | Tempo total do trigger |
| `wal_commit_ms` | `tw` | Custo do checkpoint WAL |
| `scheduling_delay_ms` | `ts` | Atraso do scheduler |
| `query_planning_ms` | | Planejamento da query |
| `add_batch_ms` | | Escrita no sink |
| `e2e_latency_ms` | | Latência fim-a-fim (evento → banco) |

#### Tolerância a falhas (R5)

| Coluna | Descrição |
|---|---|
| `fault_injected` | Falha foi injetada neste batch? |
| `kafka_offset_start` | Offset Kafka inicial |
| `kafka_offset_end` | Offset Kafka final |
| `events_expected` | Eventos esperados |
| `events_recovered` | Eventos recuperados após falha |
| `recovery_time_ms` | Tempo de recuperação |

---

## Índices

```sql
idx_batch_metrics_run_id    -- busca por execução
idx_batch_metrics_round_id  -- análise cross-round
idx_batch_metrics_horario   -- análise por período do dia
idx_batch_metrics_fault     -- análise de falhas (parcial: WHERE fault_injected = true)
```

---

## Inicialização

O arquivo `init.sql` é executado automaticamente pelo PostgreSQL na primeira inicialização do container (diretório `/docker-entrypoint-initdb.d/`). Ele cria todas as tabelas, índices e insere o usuário de seed inicial.

Para reinicializar o banco do zero, apague o volume:

```bash
make clean      # derruba os serviços e apaga todos os volumes
make up-build   # sobe novamente com banco limpo
```
