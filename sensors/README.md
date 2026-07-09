# Sensores

Container Python que simula sensores físicos de ruído urbano. Publica leituras de decibéis com geolocalização no Kafka.

---

## Responsabilidade

Gera cargas de trabalho configuráveis para os experimentos de streaming. Cada container gerencia `SENSOR_COUNT` sensores virtuais e publica leituras periodicamente no tópico `sensorData`.

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `KAFKA_BROKER` | `kafka:9092` | Endereço do broker Kafka |
| `KAFKA_TOPIC` | `sensorData` | Tópico de destino |
| `SENSOR_COUNT` | `10` | Sensores simulados por container |
| `SENSOR_NUMBER` | `10` | Número de réplicas do container |
| `FREQUENCY_HZ` | `10` | Frequência de leitura em Hz |
| `EDGE_COMPUTING` | `false` | `true` ativa pré-agregação no sensor (R5) |
| `AREA_LAT` | `-22.00712784767658` | Latitude do centro da área monitorada — os sensores são gerados em posições aleatórias ao redor deste ponto (raio de ~220m) |
| `AREA_LON` | `-47.895427018512386` | Longitude do centro da área monitorada |
| `AREA_NAME` | `ICMC USP São Carlos` | Nome da área monitorada registrada na API |
| `AREA_URL` | — | URL da imagem exibida no frontend para identificar a área |
| `API_URL` | `http://web_app_api:4344` | Endereço da API Web |
| `API_USERNAME` | — | Username do usuário seed (definido no `.env`) |
| `API_EMAIL` | — | E-mail do usuário seed (definido no `.env`) |
| `API_PASSWORD` | — | Senha do usuário seed (definido no `.env`) |

---

## Payloads Kafka

### Modo padrão (`EDGE_COMPUTING=false`) — Rodadas R1 a R4

Publica leituras brutas. O Spark calcula a média.

```json
{
  "origin_id": 1,
  "sensor_id": 1,
  "sensor_name": "0",
  "latitude": -22.0087,
  "longitude": -47.8978,
  "readings": [
    {"ts": "2024-05-30T12:00:00+00:00", "db": 75.3},
    {"ts": "2024-05-30T12:00:01+00:00", "db": 76.1}
  ]
}
```

### Modo edge (`EDGE_COMPUTING=true`) — Rodada R5

Pré-agrega no sensor antes de publicar. Reduz tráfego de rede e carga de processamento no Spark.

```json
{
  "origin_id": 1,
  "sensor_id": 1,
  "sensor_name": "0",
  "latitude": -22.0087,
  "longitude": -47.8978,
  "timestamp": "2024-05-30T12:00:00+00:00",
  "db_avg": 75.2,
  "db_max": 78.5,
  "n_samples": 10
}
```

---

## Escalonamento

O número de containers é controlado pelo campo `deploy.replicas` no `docker-compose.yml`, configurado via `SENSOR_NUMBER` no `.env`. Para simular alta carga:

```env
SENSOR_COUNT=10     # 10 sensores por container
SENSOR_NUMBER=5     # 5 containers = 50 sensores totais
FREQUENCY_HZ=20     # 20 leituras/segundo por sensor
```

---

## Inicialização (seed)

Antes de publicar dados, o container executa `seed_sensors.py`, que:

1. Aguarda a API Web estar disponível
2. Cria o usuário seed (`API_USERNAME`/`API_EMAIL`/`API_PASSWORD`) via `POST /user/signUp`
3. Cria **uma única área** centrada em `AREA_LAT`/`AREA_LON`, com nome `AREA_NAME` e imagem `AREA_URL`, via `POST /area`
4. Cria todos os `SENSOR_COUNT` sensores nessa mesma área via `POST /sensor` — cada sensor registrado com nome `"sensor_{id}"`
5. Chama `GET /sensor?areaId=<id>&activeInArea=true` para obter os `originId` de cada sensor
6. Salva o mapeamento `"sensor_{id}" → {sensor_id, origin_id, sensor_name}` em `/app/sensor_map.json`

O `sensor.py` lê esse mapeamento para incluir `origin_id` e `sensor_id` em cada mensagem Kafka — campos necessários para o Spark gravar corretamente na tabela `Measure` e no Redis.

## Perfil de ruído por sensor

Cada sensor tem um perfil acústico único gerado deterministicamente a partir do seu `sensor_id`:

- **`base_db`**: nível base de ruído (entre 50 e 85 dB), derivado do ID do sensor com seed fixo
- **`std_db`**: variabilidade local (desvio padrão entre 4 e 14 dB)
- **Picos esporádicos**: 10% de chance de um evento ruidoso pontual (+10 a +25 dB acima do base)
- **Distribuição gaussiana** em torno do `base_db`, limitada entre 30 e 120 dB

Isso simula ambientes distintos: um sensor próximo ao estacionamento terá `base_db` alto e `std_db` elevado, enquanto um sensor em corredor interno terá `base_db` baixo e pouca variação.

---

## Dependências

- `kafka-python` — cliente Kafka
- `requests` — chamadas HTTP à API Web
- Python 3.11
