FROM apache/spark-py:v3.4.0

# troca para root para instalar dependências
USER root

# dependências do sistema para o driver JDBC do PostgreSQL
RUN apt-get update && apt-get install -y \
    wget \
    && rm -rf /var/lib/apt/lists/*

# baixa o driver JDBC do PostgreSQL diretamente para o diretório
# de jars do Spark — evita configurar spark.jars.packages no runtime
RUN wget -q \
    https://jdbc.postgresql.org/download/postgresql-42.7.3.jar \
    -O /opt/spark/jars/postgresql-42.7.3.jar

# baixa o conector Kafka para Spark
RUN wget -q \
    https://repo1.maven.org/maven2/org/apache/spark/spark-sql-kafka-0-10_2.12/3.5.1/spark-sql-kafka-0-10_2.12-3.5.1.jar \
    -O /opt/spark/jars/spark-sql-kafka-0-10_2.12-3.5.1.jar

# dependências transitivas do conector Kafka
RUN wget -q \
    https://repo1.maven.org/maven2/org/apache/kafka/kafka-clients/3.4.1/kafka-clients-3.4.1.jar \
    -O /opt/spark/jars/kafka-clients-3.4.1.jar && \
    wget -q \
    https://repo1.maven.org/maven2/org/apache/spark/spark-token-provider-kafka-0-10_2.12/3.5.6/spark-token-provider-kafka-0-10_2.12-3.5.6.jar \
    -O /opt/spark/jars/spark-token-provider-kafka-0-10_2.12-3.5.6.jar && \
    wget -q \
    https://repo1.maven.org/maven2/org/apache/commons/commons-pool2/2.11.1/commons-pool2-2.11.1.jar \
    -O /opt/spark/jars/commons-pool2-2.11.1.jar

    # Baixa o agente JMX do Prometheus (Versão estável 0.20.0)
RUN wget -q \
    https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.20.0/jmx_prometheus_javaagent-0.20.0.jar \
    -O /opt/spark/jars/jmx_prometheus_javaagent.jar
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY conf/metrics.properties /app/conf/metrics.properties

COPY conf/jmx_prometheus.yml /opt/spark/conf/jmx_prometheus.yml

# Cria a pasta /app/conf caso ela não exista no seu container
RUN mkdir -p /app/conf

# Copia o arquivo que criamos localmente para o exato caminho e nome que o erro pediu
COPY conf/jmx_prometheus.yml /app/conf/jmx_exporter.yml

CMD ["/opt/spark/bin/spark-submit", \
    "--master", "local[*]", \
    "--conf", "spark.ui.enabled=true", \
    "--conf", "spark.ui.port=4040", \
    "--conf", "spark.ui.prometheus.enabled=true", \
    "--conf", "spark.metrics.conf=/app/conf/metrics.properties", \
    "--conf", "spark.driver.extraJavaOptions=-javaagent:/opt/spark/jars/jmx_prometheus_javaagent.jar=9091:/app/conf/jmx_exporter.yml", \
    "--conf", "spark.executor.extraJavaOptions=-javaagent:/opt/spark/jars/jmx_prometheus_javaagent.jar=9091:/app/conf/jmx_exporter.yml", \
    "--conf", "spark.sql.shuffle.partitions=2", \
    "--conf", "spark.streaming.backpressure.enabled=true", \
    "job.py"]