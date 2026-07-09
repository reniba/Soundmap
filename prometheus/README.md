# Prometheus — Coleta de Métricas

Serviço de monitoramento que raspa métricas do Spark periodicamente e as armazena em série temporal. O Grafana usa o Prometheus como datasource para construir os dashboards.

---

## Acesso

| URL | http://localhost:9090 |
|---|---|

---

## Configuração (`prometheus.yml`)

```yaml
scrape_configs:
  - job_name: spark
    scrape_interval: 10s
    static_configs:
      - targets:
          - spark:4040   # Spark UI — métricas de streaming e executores
          - spark:9091   # Agente JMX — métricas JVM (heap, GC, threads)
    metrics_path: /metrics/executors/prometheus
```

> **Nota:** o `metrics_path` acima se aplica apenas ao target `spark:4040`. O target `spark:9091` (JMX) já serve métricas no path `/metrics` padrão do Prometheus.

---

## Fontes de métricas do Spark

### Spark UI (`spark:4040`)

Configurado via `spark/conf/metrics.properties`:

```properties
*.sink.prometheus.class=org.apache.spark.metrics.sink.PrometheusServlet
*.sink.prometheus.path=/metrics/prometheus
*.sink.prometheus.sample-rate=10
driver.source.jvm.class=org.apache.spark.metrics.source.JvmSource
```

Expõe métricas de streaming, jobs, stages e JVM do driver.

### Agente JMX (`spark:9091`)

Configurado via `spark/conf/jmx_prometheus.yml`. Exporta métricas JVM de baixo nível via `jmx_prometheus_javaagent-0.20.0.jar`, que é carregado como `-javaagent` no processo Spark.

---

## Persistência

As séries temporais são armazenadas no volume Docker `prometheus_data`. O período de retenção padrão do Prometheus é **15 dias**.

---

## Estrutura de arquivos

```
prometheus/
└── prometheus.yml    # Configuração de scrape targets
```
