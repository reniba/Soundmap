"""
Inicialização via API: registra usuário, cria áreas e sensores através da
API Web, depois salva o mapeamento nome→{origin_id, sensor_id} em
/app/sensor_map.json para que sensor.py use os IDs corretos no Kafka.

Executado uma única vez na subida do container, antes de sensor.py.
"""

import os, time, json, requests
from sensors_config import SENSORS, AREA_LAT, AREA_LON

API_URL         = os.environ.get("API_URL", "http://web_app_api:4344")
API_USERNAME    = os.environ.get("API_USERNAME", "sensor_bot")
API_EMAIL       = os.environ.get("API_EMAIL", "sensor_bot@soundmap.internal")
API_PASSWORD    = os.environ.get("API_PASSWORD", "sensor_bot_pwd123")
SENSOR_MAP_PATH = "/app/sensor_map.json"

AREA_NAME = os.environ.get("AREA_NAME", "ICMC USP São Carlos")
AREA_URL  = os.environ.get("AREA_URL",  "https://www.icmc.usp.br")


def wait_for_api(retries=20, delay=5):
    # GET /user não consulta o banco — garante apenas que o processo HTTP está no ar.
    # O signup() abaixo tem seu próprio retry para aguardar o banco ficar pronto.
    for attempt in range(retries):
        try:
            requests.get(f"{API_URL}/user", timeout=3)
            print("[Seed] API disponível.")
            return
        except requests.exceptions.ConnectionError:
            print(f"[Seed] API não disponível, tentativa {attempt+1}/{retries}. Aguardando {delay}s...")
            time.sleep(delay)
    raise RuntimeError("[Seed] API não respondeu após várias tentativas.")


def signup(retries=10, delay=4):
    # Retry em 500: a API pode estar no ar mas o banco ainda inicializando.
    for attempt in range(retries):
        r = requests.post(f"{API_URL}/user/signUp", json={
            "username": API_USERNAME,
            "email":    API_EMAIL,
            "password": API_PASSWORD,
        })
        if r.status_code in (409, 400) and "já" in r.text.lower():
            print("[Seed] Usuário já existe, seguindo com login.")
            return
        if r.ok:
            return
        if r.status_code == 500:
            print(f"[Seed] signUp retornou 500 (banco ainda inicializando?), tentativa {attempt+1}/{retries}. Aguardando {delay}s...")
            time.sleep(delay)
            continue
        raise RuntimeError(f"[Seed] signUp falhou: {r.status_code} {r.text}")
    raise RuntimeError("[Seed] signUp falhou após várias tentativas.")


def login():
    r = requests.post(f"{API_URL}/user/login", json={
        "emailOrUsername": API_EMAIL,
        "password":        API_PASSWORD,
    })
    r.raise_for_status()
    return r.json()["token"]


def create_area(token, name, lat, lon):
    r = requests.post(
        f"{API_URL}/area",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": name, "latitude": lat, "longitude": lon, "url": AREA_URL},
    )
    if r.ok or (r.status_code in (400, 409) and "já" in r.text.lower()):
        return
    raise RuntimeError(f"[Seed] create_area falhou para '{name}': {r.status_code} {r.text}")


def create_sensor(token, name, area_id):
    r = requests.post(
        f"{API_URL}/sensor",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": name, "areaId": area_id},
    )
    if r.ok or (r.status_code in (400, 409) and "já" in r.text.lower()):
        return
    raise RuntimeError(f"[Seed] create_sensor falhou para '{name}': {r.status_code} {r.text}")


def seed():
    wait_for_api()
    signup()
    token = login()
    print(f"[Seed] Autenticado como '{API_USERNAME}'.")

    # cria a área única do ICMC (idempotente)
    create_area(token, AREA_NAME, AREA_LAT, AREA_LON)

    # obtém o id da área recém-criada (ou já existente)
    areas_resp = requests.get(f"{API_URL}/area", headers={"Authorization": f"Bearer {token}"})
    areas_resp.raise_for_status()
    area = next((a for a in areas_resp.json()["areas"] if a["name"] == AREA_NAME), None)
    if area is None:
        raise RuntimeError(f"[Seed] Área '{AREA_NAME}' não encontrada após criação.")
    area_id = area["id"]
    print(f"[Seed] Área '{AREA_NAME}' (id={area_id}) pronta.")

    # cria todos os sensores na mesma área (idempotente)
    for s in SENSORS:
        create_sensor(token, f"sensor_{s['id']}", area_id)

    # obtém todos os sensores da área com originId (uma única requisição)
    sensors_resp = requests.get(
        f"{API_URL}/sensor",
        headers={"Authorization": f"Bearer {token}"},
        params={"areaId": area_id, "activeInArea": "true"},
    )
    sensors_resp.raise_for_status()

    sensor_map = {
        entry["name"]: {
            "sensor_id":   entry["id"],
            "origin_id":   entry["originId"],
            "sensor_name": entry["name"],
        }
        for entry in sensors_resp.json()["sensors"]
    }

    with open(SENSOR_MAP_PATH, "w") as f:
        json.dump(sensor_map, f)

    print(f"[Seed] {len(sensor_map)} sensores registrados na área '{AREA_NAME}'. Mapa salvo em {SENSOR_MAP_PATH}.")


if __name__ == "__main__":
    seed()
