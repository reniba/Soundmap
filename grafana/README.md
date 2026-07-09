# Grafana — Dashboards de Observabilidade

Interface de visualização de métricas do pipeline de streaming. Exibe dados do Spark (throughput, latência, JVM) coletados via Prometheus, e dados de negócio consultados diretamente no PostgreSQL.

---

## Acesso

| URL | http://localhost:5284 |
|---|---|
| Usuário | `admin` |
| Senha | `admin` |

---

## Datasources pré-configurados

O diretório `provisioning/datasources/` contém arquivos YAML que o Grafana carrega automaticamente na inicialização (sem necessidade de configuração manual).

### Prometheus

- **Nome:** Prometheus
- **URL interna:** `http://prometheus:9090`
- **Dados:** métricas de runtime do Spark — throughput de batches, latência, uso de CPU/memória JVM, métricas de executores

### PostgreSQL (NoiseDB)

- **Nome:** NoiseDB
- **Host:** `soundmap_db:5432`
- **Database:** `soundmap`
- **Dados:** resultados de agregação (`noise_aggregations`) e métricas de experimentos (`batch_metrics`)

---

## Estrutura de arquivos

```
grafana/
└── provisioning/
    └── datasources/
        └── prometheus.yaml   # Datasource Prometheus + PostgreSQL
```

---

## Persistência

Os dashboards criados manualmente e preferências do Grafana são armazenados no volume Docker `grafana_data`. Para não perder dashboards customizados, adicione-os ao diretório `provisioning/dashboards/` como arquivos JSON (infraestrutura como código).

---

## Métricas disponíveis (via Prometheus)

O Spark expõe métricas em dois endpoints:

| Endpoint | Conteúdo |
|---|---|
| `spark:4040/metrics/executors/prometheus` | Jobs, stages, tasks, executores |
| `spark:9091` | Métricas JVM via agente JMX (heap, GC, threads) |

Exemplos de métricas úteis para dashboards:

- `spark_streaming_query_inputrowspersecond` — throughput de entrada
- `spark_streaming_query_processingrate` — taxa de processamento
- `jvm_memory_heap_used_bytes` — uso de heap
- Consultas SQL em `batch_metrics` para análise de latência por rodada
