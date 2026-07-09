FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY sensors_config.py .
COPY seed_sensors.py .
COPY sensor.py .

CMD ["sh", "-c", "python seed_sensors.py && python sensor.py"]