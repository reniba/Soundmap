-- ─── Extensões ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ─── Tabela de dados de negócio ───────────────────────────
CREATE TABLE Users (
	id SERIAL NOT NULL,
	username VARCHAR(40) NOT NULL,
	email VARCHAR(200) NOT NULL,
	hash_password VARCHAR(200) NOT NULL,
	CONSTRAINT USER_PK PRIMARY KEY (id),
	CONSTRAINT USER_USERNAME_UN UNIQUE (username),
	CONSTRAINT USER_EMAIL_UN UNIQUE (email)
);


CREATE TABLE Area (
	id SERIAL,
	user_id INTEGER NOT NULL,
	name VARCHAR(200) NOT NULL,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
	url TEXT NOT NULL,
	CONSTRAINT AREA_PK PRIMARY KEY (id),
	CONSTRAINT AREA_USER_NAME_UN UNIQUE (user_id, name),
	CONSTRAINT AREA_USER_ID_FK FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE, 
    CONSTRAINT AREA_LATITUDE_RANGE CHECK (latitude >= -90.000000 AND latitude <= 90.000000),
    CONSTRAINT AREA_LONGITUDE_RANGE CHECK (longitude >= -180.000000 AND longitude <= 180.000000)
);


CREATE TABLE Sensor (
	id SERIAL,
	name VARCHAR(200) NOT NULL,
	CONSTRAINT SENSOR_PK PRIMARY KEY (id),
	CONSTRAINT SENSOR_NAME_UN UNIQUE (name)
);


CREATE TABLE Origin (
	id SERIAL NOT NULL,
	area_id INTEGER,
	sensor_id INTEGER,
	active BOOLEAN DEFAULT true,
	CONSTRAINT ORIGIN_PK PRIMARY KEY (id), 
	CONSTRAINT ORIGIN_AREA_FK FOREIGN KEY (area_id) REFERENCES Area(id) ON DELETE CASCADE,
	CONSTRAINT ORIGIN_SENSOR_FK FOREIGN KEY (sensor_id) REFERENCES Sensor(id) ON DELETE CASCADE
);


CREATE TABLE Measure (
	id BIGSERIAL NOT NULL,
	origin_id INTEGER,
	db_avg FLOAT,
	db_max FLOAT, 
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
	window_end TIMESTAMP,
	window_start TIMESTAMP,
	CONSTRAINT MEASURE_PK PRIMARY KEY (id),
	CONSTRAINT MEASURE_ORIGIN_FK FOREIGN KEY (origin_id) REFERENCES Origin(id) ON DELETE CASCADE,
    CONSTRAINT MEASURE_LATITUDE_RANGE CHECK (latitude >= -90.000000 AND latitude <= 90.000000),
    CONSTRAINT MEASURE_LONGITUDE_RANGE CHECK (longitude >= -180.000000 AND longitude <= 180.000000)
);


-- ─── Tabela de métricas experimentais ─────────────────────
CREATE TABLE IF NOT EXISTS batch_metrics (

    -- identificação da execução
    id                  BIGSERIAL       PRIMARY KEY,
    run_id              TEXT            NOT NULL,
    batch_id            BIGINT          NOT NULL,
    batch_timestamp     TIMESTAMPTZ     NOT NULL DEFAULT now(),

    -- configuração experimental — identifica a rodada
    round_id            TEXT            NOT NULL, -- 'R1', 'R2', 'R3', 'R4', 'R5'
    trigger_interval_ms    INT             NOT NULL,
    frequency_checkpoint_ms INT          NOT NULL,
    frequency_hz           INT           NOT NULL DEFAULT 1,
    spark_cpus          INT             NOT NULL,
    load_level          TEXT            NOT NULL, -- 'low', 'medium', 'high'
    edge_computing      BOOLEAN         NOT NULL DEFAULT FALSE,
    horario             TEXT            NOT NULL, -- 'morning', 'afternoon', 'night'

    -- métricas de volume
    input_rows          INT,
    input_rows_per_sec  FLOAT,
    proc_rows_per_sec   FLOAT,

    -- métricas de tempo — decomposição da Equação 1 (tt = tw + ts + tp)
    trigger_exec_ms     INT,            -- tempo total do trigger (tt)
    wal_commit_ms       INT,            -- custo do checkpoint (parte de tp)
    scheduling_delay_ms INT,            -- ts — tempo de espera no scheduler
    query_planning_ms   INT,            -- tempo de planejamento da query
    add_batch_ms        INT,            -- tempo de escrita no sink

    -- latência end-to-end
    -- t_sink_write - t_sensor_generation (inclui tw + ts + tp)
    e2e_latency_ms      FLOAT,

    -- consistência pós-falha (preenchido apenas nas execuções com falha induzida)
    fault_injected      BOOLEAN         NOT NULL DEFAULT FALSE,
    kafka_offset_start  BIGINT,         -- offset no momento da falha
    kafka_offset_end    BIGINT,         -- offset após recuperação
    events_expected     INT,            -- eventos_esperados = offset_end - offset_start
    events_recovered    INT,            -- COUNT(*) no PostgreSQL após recuperação
    recovery_time_ms    INT,            -- tempo entre kill e primeiro batch bem-sucedido

    -- constraints
    CONSTRAINT chk_round_id
        CHECK (round_id IN ('R1', 'R2', 'R3', 'R4', 'R5')),

    CONSTRAINT chk_load_level
        CHECK (load_level IN ('low', 'medium', 'high')),

    CONSTRAINT chk_horario
        CHECK (horario IN ('morning', 'afternoon', 'night')),

    CONSTRAINT chk_trigger_interval
        CHECK (trigger_interval_ms IN (500, 1000, 2000, 5000, 10000)),

    CONSTRAINT chk_spark_cpus
        CHECK (spark_cpus IN (1, 2)),

    CONSTRAINT chk_positive_rows
        CHECK (input_rows >= 0),

    CONSTRAINT chk_positive_latency
        CHECK (e2e_latency_ms IS NULL OR e2e_latency_ms >= 0)
);


-- ─── Índices ──────────────────────────────────────────────

-- busca por execução específica
CREATE INDEX IF NOT EXISTS idx_batch_metrics_run_id
    ON batch_metrics (run_id, batch_id);

-- busca por rodada experimental (comparação entre rodadas)
CREATE INDEX IF NOT EXISTS idx_batch_metrics_round_id
    ON batch_metrics (round_id, trigger_interval_ms, load_level);

-- busca por horário (análise de variabilidade do cluster)
CREATE INDEX IF NOT EXISTS idx_batch_metrics_horario
    ON batch_metrics (horario, batch_timestamp);

-- busca por execuções com falha (sub-experimento de consistência)
CREATE INDEX IF NOT EXISTS idx_batch_metrics_fault
    ON batch_metrics (fault_injected, round_id)
    WHERE fault_injected = TRUE;
