# Como usar o SoundMap localmente

## Pré-requisitos

- Docker 24+ com Docker Compose
- `make`

---

## 1. Configurar o `.env`

Crie um arquivo `.env` na raiz do projeto com os parâmetros do experimento:

```env
# Sensores
SENSOR_COUNT=2        # leituras por sensor por envio
SENSOR_NUMBER=1       # número de containers de sensores

# Frequência
FREQUENCY_HZ=10       # Hz

# Processamento
EDGE_COMPUTING=false  # true = modo edge (R5)
ROUND_ID=R1

# Spark
TRIGGER_INTERVAL=5 seconds
CHECKPOINT_DIR=/checkpoint
SPARK_MASTER_CPUS=2
```

Para simular **alta carga** (mais sensores):

```env
SENSOR_COUNT=10
SENSOR_NUMBER=5
FREQUENCY_HZ=20
```

---

## 2. Subir os serviços

```bash
make up          # usa imagens já construídas
# ou
make up-build    # reconstrói as imagens antes de subir
```

Aguarde ~30 segundos para o Kafka e o banco inicializarem. O Spark começa a processar batches assim que o init-kafka conclui a criação dos tópicos.

---

## 3. Verificar o funcionamento

| Interface  | URL                   | Login         |
| ---------- | --------------------- | ------------- |
| Kafka UI   | http://localhost:5384 | —             |
| Spark UI   | http://localhost:4040 | —             |
| Prometheus | http://localhost:9090 | —             |
| Grafana    | http://localhost:5284 | admin / admin |
| API Web    | http://localhost:4344 | —             |
| API Mobile | http://localhost:4343 | —             |
| App WEB    | http://localhost:5184 | —             |

**Kafka UI** → aba "Topics" → `sensorData` → ver mensagens chegando dos sensores.

**Spark UI** → aba "Streaming" → ver batches sendo processados e o throughput.

---

## 4. Ver logs

```bash
make logs                              # todos os serviços
docker compose logs -f spark           # apenas o Spark
docker compose logs -f sensor          # apenas os sensores
docker compose logs -f database        # apenas o banco
```

---

## 5. Encerrar

```bash
make down        # para os containers e remove a rede (mantém volumes)
make clean       # para e APAGA todos os volumes  ⚠️ perda de dados
```

---

## Trocar de rodada experimental

Edite o `.env`, ajuste os parâmetros e reinicie:

```bash
make restart
```

O checkpoint do Spark ficará em `/checkpoint` dentro do container. Se quiser começar do zero (novo run_id), use `make clean` antes de subir novamente.

---

## Consultar métricas do experimento

Conecte diretamente ao banco:

```bash
docker exec -it soundmap_db psql -U admin_g4 -d soundmap
```

```sql
-- Latência média por rodada
SELECT round_id, AVG(e2e_latency_ms) AS avg_latency_ms
FROM batch_metrics
GROUP BY round_id
ORDER BY round_id;

-- Throughput por batch
SELECT batch_id, input_rows_per_sec, proc_rows_per_sec
FROM batch_metrics
WHERE round_id = 'R1'
ORDER BY batch_id;
```
