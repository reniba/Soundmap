import os, json, time, random, math
from kafka import KafkaProducer
from datetime import datetime, timezone
from kafka.errors import NoBrokersAvailable
from sensors_config import SENSORS

SENSOR_MAP_PATH = "/app/sensor_map.json"
BROKER          = os.environ["KAFKA_BROKER"]
TOPIC           = os.environ["KAFKA_TOPIC"]
FREQUENCY_HZ    = int(os.environ.get("FREQUENCY_HZ", 10))
EDGE            = os.environ.get("EDGE_COMPUTING", "false").lower() == "true"


def load_sensor_map(retries=20, delay=3):
    for attempt in range(retries):
        if os.path.exists(SENSOR_MAP_PATH):
            with open(SENSOR_MAP_PATH) as f:
                return json.load(f)
        print(f"[Sensor] Aguardando sensor_map.json... tentativa {attempt+1}/{retries}")
        time.sleep(delay)
    raise RuntimeError("[Sensor] sensor_map.json não encontrado. Verifique se o seed concluiu.")


def create_producer(broker, retries=10, delay=5):
    for attempt in range(retries):
        try:
            return KafkaProducer(
                bootstrap_servers=broker,
                value_serializer=lambda v: json.dumps(v).encode(),
            )
        except NoBrokersAvailable:
            print(f"[Sensor] Broker não disponível, tentativa {attempt+1}/{retries}. Aguardando {delay}s...")
            time.sleep(delay)
    raise RuntimeError("[Sensor] Não foi possível conectar ao broker após várias tentativas.")


def generate_readings(n=10, base_db=70.0, std_db=8.0):
    now = datetime.now(timezone.utc)
    readings = []
    for _ in range(n):
        db = random.gauss(base_db, std_db)
        # pico esporádico (~10% de chance) — simula evento ruidoso pontual
        if random.random() < 0.10:
            db += random.uniform(10, 25)
        readings.append({"ts": now.isoformat(), "db": round(max(30.0, min(120.0, db)), 1)})
    return readings


def sensor_profile(sensor_id: int) -> tuple[float, float]:
    """Deriva base_db e std_db únicos por sensor a partir do sensor_id."""
    rng = random.Random(sensor_id)
    base_db = rng.uniform(50, 85)   # sensores variam de ambiente silencioso a ruidoso
    std_db  = rng.uniform(4, 14)    # alguns têm ruído estável, outros muito variável
    return base_db, std_db


def send_raw(producer, sensor, ids):
    base_db, std_db = sensor_profile(ids["sensor_id"])
    payload = {
        "origin_id":   ids["origin_id"],
        "sensor_id":   ids["sensor_id"],
        "sensor_name": ids["sensor_name"],
        "latitude":    sensor["lat"],
        "longitude":   sensor["lon"],
        "readings":    generate_readings(base_db=base_db, std_db=std_db),
    }
    producer.send(TOPIC, payload)


def send_edge(producer, sensor, ids):
    base_db, std_db = sensor_profile(ids["sensor_id"])
    readings = [r["db"] for r in generate_readings(base_db=base_db, std_db=std_db)]
    db_avg = 10 * math.log10(sum(10 ** (db / 10) for db in readings) / len(readings))
    payload = {
        "origin_id":   ids["origin_id"],
        "sensor_id":   ids["sensor_id"],
        "sensor_name": ids["sensor_name"],
        "latitude":    sensor["lat"],
        "longitude":   sensor["lon"],
        "timestamp":   datetime.now(timezone.utc).isoformat(),
        "db_avg":      round(db_avg, 2),
        "db_max":      round(max(readings), 1),
        "n_samples":   len(readings),
    }
    producer.send(TOPIC, payload)


sensor_map = load_sensor_map()
producer   = create_producer(BROKER)
interval   = 1.0 / FREQUENCY_HZ

while True:
    for sensor in SENSORS:
        ids = sensor_map.get(f"sensor_{sensor['id']}")
        if ids is None:
            print(f"[Sensor] '{sensor['id']}' não encontrado no mapa, pulando.")
            continue
        if EDGE:
            send_edge(producer, sensor, ids)
        else:
            send_raw(producer, sensor, ids)
        print(f"[Sensor] Enviado dados do sensor '{sensor['id']}' (origin_id={ids['origin_id']})")
    producer.flush()
    time.sleep(interval)
