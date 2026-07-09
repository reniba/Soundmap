# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

SoundMap is a real-time urban noise monitoring platform built for the SSC0965 (ICMC/USP) streaming-data course. Simulated sensors and a mobile app publish decibel readings to Kafka, Spark Structured Streaming aggregates them into time windows, and the results are persisted to PostgreSQL/TimescaleDB and cached in Redis for two REST APIs (web + mobile) and a React map frontend. The system is also an experimental testbed: `batch_metrics` in Postgres records latency/throughput per Spark batch across configurable "rounds" (R1–R5) that vary trigger interval, CPU count, load, and edge computing.

All services run as Docker Compose containers on the `soundmap-net` bridge network; there is no non-Docker way to run the full stack.

## Commands

Everything is orchestrated through the root `makefile` (wraps `docker compose -f docker-compose.yml`):

```bash
make up          # start all services in background (uses existing images)
make up-build    # rebuild images then start
make down        # stop services, remove network (keeps volumes)
make restart     # down + up
make logs        # tail logs for all services
make ps          # list running containers
make clean       # stop and DELETE ALL VOLUMES (Kafka/Postgres data loss)
make build        # build images with cache
make build-nc     # build images from scratch (no cache)
```

Before first run, copy `.env.example` to `.env` (see "Experiment configuration" below). Services take ~30s to become ready after `make up` (Kafka + Postgres init).

Per-service logs: `docker compose logs -f <service>` (`spark`, `sensor`, `database`, `mobile_app_api`, `web_app_api`, `frontend`, ...).

Connect to Postgres directly:
```bash
docker exec -it soundmap_db psql -U admin_g4 -d soundmap
```

### Individual services (outside Docker, for editing/type-checking)

Each of `backend/api_web_app`, `backend/api_app_mobile`, and `frontend/web_app` is an independent npm project (own `package.json`, no workspace root):

```bash
cd backend/api_web_app && npm run dev     # tsx watch, hot reload (only api_web_app has this)
npm run build                              # tsc -> dist/
npm start                                  # node dist/index.js

cd frontend/web_app && npm run dev        # vite dev server
npm run build                              # tsc -b && vite build
npm run lint                               # eslint .
```

`backend/api_app_mobile` has no `dev` script — use `npm run build && npm start`, or run it via Docker.

There is no test suite for any backend/frontend package (no `test` script, no test files) — verification is done by running the stack and exercising endpoints/UI, or by reading `batch_metrics` for the Spark pipeline. The only test file in the repo is Flutter's default boilerplate at `mobile/app_flutter/test/widget_test.dart`.

Flutter app (`mobile/app_flutter`): standard `flutter run` / `flutter analyze` (see `analysis_options.yaml`) — not wired into Docker Compose, run manually against `mobile_app_api` on port 4343.

## Architecture

### Data flow

```
sensor (Python, N replicas) ──┐
                               ├─► Kafka topic "sensorData" ─┐
mobile app / api_app_mobile ──┘   Kafka topic "appData"    ─┤
                                                              ▼
                                              Spark Structured Streaming (spark/)
                                          tumbling window aggregation (dB, per sensor)
                                                   │                    │
                                                   ▼                    ▼
                                          PostgreSQL (Measure table)   Redis (sensor:{id}, app:{userId}:{areaId}:{sensorId})
                                                                              │
                                              web_app_api / api_app_mobile ◄──┘ (Redis first, Postgres fallback)
                                                   │
                                              frontend (React) / mobile (Flutter)
```

- **Two independent Kafka topics / pipelines**: `sensorData` (physical sensors, written to Postgres `Measure` + Redis `sensor:{id}`) and `appData` (mobile app readings, written only to Redis under `app:{userId}:{areaId}:{sensorId}` — no Postgres fallback for app data).
- **Sensors register themselves via HTTP before publishing**: `sensors/seed_sensors.py` calls `web_app_api` (`/user/signUp`, `/area`, `/sensor`) on startup to create a seed user, one area, and all sensors, then writes the resulting `sensor_id`/`origin_id` mapping to `/app/sensor_map.json`. `sensor.py` reads that file to stamp each Kafka message with the correct IDs. This means `web_app_api` and `init-kafka` must be up before sensors can publish (`depends_on` in `docker-compose.yml`).
- **Edge computing mode** (`EDGE_COMPUTING=true`, round R5): sensors pre-aggregate readings before publishing (`db_avg`/`db_max`/`n_samples` instead of raw `readings[]`), changing the Kafka payload schema and the Spark parsing path (`consumer.py` picks the schema based on `EDGE_COMPUTING`; `processor.py` has separate `aggregate_raw` vs `aggregate_edge` paths).
- **Spark pipeline** (`spark/`): `job.py` wires `consumer.py` (Kafka read + schema) → `processor.py` (tumbling window aggregation, log-mean dB) → `writer.py` (`foreachBatch`: Redis write, then Postgres JDBC write to `Measure`, dropping `sensor_id`/`sensor_name`/`first_event_ts` since those aren't Measure columns) → `listener.py` (`StreamingQueryListener` that records per-batch metrics into `batch_metrics`). End-to-end latency is threaded through a shared `e2e_cache` dict because the writer's `foreachBatch` runs *before* the listener's `onQueryProgress` for the same batch — the UPDATE has to become a value the listener reads at INSERT time, not a separate UPDATE.
- **Redis is populated exclusively by Spark**, never directly by the APIs, except that `web_app_api` invalidates/removes `sensor:{id}` and `area:{areaId}` on sensor delete/move and lazily repopulates `area:{areaId}` from Postgres on first read after a cache miss.
- **Backend APIs share the same layered structure**: `routes/` → `controllers/` → `services/` → `repositories/` (Postgres via `pg`, Redis via `redis` in `api_web_app` only). `api_web_app` (port 4344) is the primary API — auth, areas, sensors, measures, map data. `api_app_mobile` (port 4343) is narrower — auth, areas, measures — and additionally acts as a Kafka producer (`kafka/producer.ts`) publishing to `appData`.
- Both APIs use JWT (`middlewares/auth.ts`, secret `JWT_SECRET`) on every route except `/user/signUp` and `/user/login`; `api_web_app` also validates request bodies/queries with Zod schemas under `src/schemas/{in,out}/`.
- **Database schema** (`database/init.sql`) is business data (`Users`, `Area`, `Sensor`, `Origin` as the sensor↔area join table, `Measure` keyed on `origin_id`) plus `batch_metrics` for experiment telemetry. It runs once via Postgres's `docker-entrypoint-initdb.d` — schema changes require `make clean` (wipes the `pg_volumn` volume) before `make up-build` to take effect. Note: `spark/README.md`'s changelog describes an *intended* future `Measure` schema (`sensor_id TEXT` columns, no `origin_id`) that has not been applied to `init.sql`/`writer.py` — trust `init.sql` and `writer.py` over that changelog note.
- **Frontend** (`frontend/web_app`, React 19 + Vite + TypeScript, port 5184) renders the noise map with MapLibre/Leaflet/react-map-gl and charts with Recharts; `src/services/*.ts` are thin fetch wrappers around `web_app_api`.
- **Observability**: Spark exposes a Prometheus JMX exporter (port 9091, config in `spark/conf/`) and Spark UI (4040); Prometheus (`prometheus/prometheus.yml`) scrapes it every ~10s; Grafana (port 5284, provisioned dashboards in `grafana/provisioning/`) reads from Prometheus and Postgres.

### Experiment configuration (`.env`)

The round-based experiment design (R1–R5) is driven entirely by env vars consumed by `docker-compose.yml` and threaded into `spark`/`sensor` containers — see `.env.example` for the full list. Key ones: `ROUND_ID`, `TRIGGER_INTERVAL`/`CHECKPOINT_INTERVAL` (Spark micro-batch cadence), `WINDOW_DURATION`/`WATERMARK` (aggregation window; watermark must be ≥ window duration), `SPARK_MASTER_CPUS`, `SENSOR_COUNT`/`SENSOR_NUMBER`/`FREQUENCY_HZ` (load shape), `EDGE_COMPUTING`, `FAULT_INJECTION`. Changing these and running `make restart` starts a new Spark `run_id` (UUID) but reuses the same Postgres/Kafka data unless `make clean` is run first.
