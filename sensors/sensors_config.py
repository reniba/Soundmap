import os
import random

SENSOR_COUNT  = int(os.environ.get("SENSOR_COUNT", 10))
SENSOR_OFFSET = int(os.environ.get("SENSOR_OFFSET", 0))

# centro da área monitorada — configurável via AREA_LAT / AREA_LON
AREA_LAT = float(os.environ.get("AREA_LAT", -22.00712784767658))
AREA_LON = float(os.environ.get("AREA_LON", -47.895427018512386))

# seed fixo garante coordenadas consistentes entre réplicas com offsets diferentes
random.seed(42)

_full_pool = [
    {
        "id":  f"{i}",
        "lat": AREA_LAT + random.uniform(-0.002, 0.002),
        "lon": AREA_LON + random.uniform(-0.002, 0.002),
    }
    for i in range(SENSOR_OFFSET + SENSOR_COUNT)
]

SENSORS = _full_pool[SENSOR_OFFSET: SENSOR_OFFSET + SENSOR_COUNT]
