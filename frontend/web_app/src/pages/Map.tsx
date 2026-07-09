import { useEffect, useRef, useState, useCallback } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import styles from "./Map.module.css";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { X } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import getHistoricalData from "../services/getHistoricalData";
import { useParams } from "react-router-dom";

type MapSensor = {
  id: number;
  name: string;
  active: boolean;
  dbAverage: number;
  latitude: number;
  longitude: number;
};

type AppSensor = {
  sensorId: string;
  name: string;
  active: boolean;
  dbAverage: number;
  latitude: number;
  longitude: number;
};

type DisplaySensor = {
  uid: string;
  name: string;
  active: boolean;
  dbAverage: number;
  latitude: number;
  longitude: number;
  kind: "sensor" | "app";
  rawId: number | string;
};

type HistoryPoint = {
  time: string;
  dbAverage: number;
  dbMax: number;
};

type Area = {
  id: number;
  name: string;
  url: string;
  latitude: number;
  longitude: number;
};

type Props = {
  selectedArea: Area;
};

function fromMapSensor(s: MapSensor): DisplaySensor {
  return { ...s, uid: `sensor-${s.id}`, kind: "sensor", rawId: s.id };
}

function fromAppSensor(s: AppSensor): DisplaySensor {
  return { ...s, uid: `app-${s.sensorId}`, kind: "app", rawId: s.sensorId };
}

const NOISE_CATEGORY = (db: number, active: boolean) => {
  if (!active)
    return {
      label: "Sem sinal",
      color: "#555c6e",
      fill: "rgba(85,92,110,0.15)",
      border: "rgba(85,92,110,0.5)",
    };
  if (db >= 80)
    return {
      label: "Alto ruído",
      color: "#e05a5a",
      fill: "rgba(224,90,90,0.18)",
      border: "rgba(224,90,90,0.6)",
    };
  if (db >= 60)
    return {
      label: "Médio ruído",
      color: "#e4a830",
      fill: "rgba(228,168,48,0.15)",
      border: "rgba(228,168,48,0.55)",
    };
  return {
    label: "Baixo ruído",
    color: "#3ecf6e",
    fill: "rgba(62,207,110,0.15)",
    border: "rgba(62,207,110,0.55)",
  };
};

const circleSize = (db: number, active: boolean) => {
  if (!active) return 32;
  const min = 32,
    max = 96;
  const clamped = Math.min(Math.max(db, 30), 110);
  return min + ((clamped - 30) / (110 - 30)) * (max - min);
};

const POLL_INTERVAL_MS = 1_000;

function SensorCircle({
  sensor,
  onClick,
  isSelected,
}: {
  sensor: DisplaySensor;
  onClick: () => void;
  isSelected: boolean;
}) {
  const cat = NOISE_CATEGORY(sensor.dbAverage, sensor.active);
  const size = circleSize(sensor.dbAverage, sensor.active);
  const prevColorRef = useRef(cat.color);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (prevColorRef.current !== cat.color) {
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 600);
      prevColorRef.current = cat.color;
      return () => clearTimeout(t);
    }
  }, [cat.color]);

  return (
    <Marker
      latitude={sensor.latitude}
      longitude={sensor.longitude}
      anchor="center"
    >
      <div
        className={`${styles.sensorWrap} ${isSelected ? styles.sensorSelected : ""}`}
        onClick={onClick}
        title={sensor.name}
        style={{ width: size + 8, height: size + 8 }}
      >
        <div
          className={`${styles.circle} ${animating ? styles.circleAnimate : ""}`}
          style={{
            width: size,
            height: size,
            background: cat.fill,
            border: `2px solid ${cat.border}`,
            boxShadow: `0 0 0 4px ${cat.fill}`,
            transition:
              "width 0.6s ease, height 0.6s ease, background 0.6s ease, border-color 0.6s ease",
          }}
        />
        <div className={styles.dot} style={{ background: cat.color }} />
        {isSelected && <div className={styles.sensorLabel}>{sensor.name}</div>}
      </div>
    </Marker>
  );
}

function SensorCard({
  sensor,
  onClose,
}: {
  sensor: DisplaySensor;
  onClose: () => void;
}) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const fmt = (d: Date) => d.toISOString().slice(0, 16);

  const [dateFrom, setDateFrom] = useState(fmt(oneHourAgo));
  const [dateTo, setDateTo] = useState(fmt(now));
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const cat = NOISE_CATEGORY(sensor.dbAverage, sensor.active);

  const { selectedArea } = useOutletContext<{ selectedArea: Area }>();

  const loadHistory = useCallback(
    async (from: string, to: string) => {
      if (sensor.kind !== "sensor") return; // ← app sensors não têm histórico
      setLoading(true);
      try {
        const measures = await getHistoricalData(
          selectedArea.id,
          sensor.rawId as number,
          from,
          to,
        );
        setHistory(measures);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    },
    [sensor.rawId, sensor.kind, selectedArea.id],
  );

  useEffect(() => {
    loadHistory(dateFrom, dateTo);
  }, [loadHistory, dateFrom, dateTo]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardSub}>Sensor</div>
          <div className={styles.cardName}>{sensor.name}</div>
        </div>
        <div className={styles.cardRight}>
          <span
            className={styles.badge}
            style={{
              background: cat.fill,
              color: cat.color,
              border: `1px solid ${cat.border}`,
            }}
          >
            <span
              className={styles.badgeDot}
              style={{ background: cat.color }}
            />
            {cat.label}
          </span>
          <button
            className={styles.closeBtn}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className={styles.cardStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>dB médio</span>
          <span className={styles.statValue}>
            {sensor.dbAverage.toFixed(1)}
          </span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statLabel}>Status</span>
          <span
            className={styles.statValue}
            style={{ color: sensor.active ? "#3ecf6e" : "#8b90a0" }}
          >
            {sensor.active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      {/* Histórico apenas para sensores fixos */}
      {sensor.kind === "sensor" && (
        <>
          <div className={styles.cardGranRow}>
            <div className={styles.dateRange}>
              <div className={styles.dateField}>
                <label className={styles.granLabel}>De</label>
                <input
                  type="datetime-local"
                  className={styles.dateInput}
                  value={dateFrom}
                  max={dateTo}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className={styles.dateField}>
                <label className={styles.granLabel}>Até</label>
                <input
                  type="datetime-local"
                  className={styles.dateInput}
                  value={dateTo}
                  min={dateFrom}
                  max={fmt(new Date())}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <button
                className={styles.granBtnActive}
                style={{
                  padding: "5px 14px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: 500,
                }}
                onClick={() => loadHistory(dateFrom, dateTo)}
              >
                Buscar
              </button>
            </div>
          </div>

          <div className={styles.chartWrap}>
            {loading ? (
              <div className={styles.chartLoading}>Carregando...</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart
                  data={history}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradMax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e05a5a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#e05a5a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4a8cff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4a8cff" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "#555c6e" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={40}
                  />

                  <YAxis
                    tick={{ fontSize: 10, fill: "#555c6e" }}
                    axisLine={false}
                    tickLine={false}
                    domain={([min, max]) => [
                      Math.max(0, Math.floor(min - 5)),
                      Math.ceil(max + 5),
                    ]}
                    tickCount={5}
                  />

                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div
                          style={{
                            background: "#1a1d24",
                            border: "1px solid #2e3340",
                            borderRadius: 7,
                            fontSize: 12,
                            padding: "8px 12px",
                          }}
                        >
                          <p style={{ color: "#8b90a0", marginBottom: 4 }}>
                            {label}
                          </p>
                          {payload.map((entry) => (
                            <p
                              key={entry.name}
                              style={{ color: entry.color, margin: "2px 0" }}
                            >
                              {entry.name}: {Number(entry.value).toFixed(1)} dB
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#8b90a0",
                      paddingTop: 8,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="dbMax"
                    name="dB máximo"
                    stroke="#e05a5a"
                    strokeWidth={1.5}
                    fill="url(#gradMax)"
                    dot={false}
                    animationDuration={400}
                  />

                  <Area
                    type="monotone"
                    dataKey="dbAverage"
                    name="dB médio"
                    stroke="#4a8cff"
                    strokeWidth={1.5}
                    fill="url(#gradAvg)"
                    dot={false}
                    animationDuration={400}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DynamicMap() {
  const { selectedArea } = useOutletContext<Props>();
  const mapRef = useRef<MapRef>(null);

  if (!selectedArea) {
    return <div>Carregando...</div>;
  }

  const [sensors, setSensors] = useState<DisplaySensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<DisplaySensor | null>(
    null,
  );
  const selectedSensorRef = useRef<DisplaySensor | null>(null);
  const { latitude, longitude } = useParams();

  useEffect(() => {
    selectedSensorRef.current = selectedSensor;
  }, [selectedSensor]);

  const fetchSensorsData = useCallback(async () => {
    if (!selectedArea?.id || selectedArea.id < 0) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:4344/map?areaId=${selectedArea.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) return;
      const data = await response.json();

      console.log("[Map] appSensors recebidos:", data.appSensors);

      const fetched: DisplaySensor[] = [
        ...(data.sensors ?? []).map(fromMapSensor),
        ...(data.appSensors ?? []).map(fromAppSensor),
      ];

      console.log("[Map] fetched total:", fetched);

      setSensors(fetched);

      const current = selectedSensorRef.current;
      if (current) {
        const updated = fetched.find((s) => s.uid === current.uid);
        if (updated) setSelectedSensor(updated);
      }
    } catch {}
  }, [selectedArea.id]);

  useEffect(() => {
    setSelectedSensor(null);
    fetchSensorsData();
    const interval = setInterval(fetchSensorsData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchSensorsData]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedArea.longitude, selectedArea.latitude],
        zoom: 17,
        essential: true,
        duration: 1500,
      });
    }
  }, [selectedArea]);

  useEffect(() => {
    if (mapRef.current && latitude && longitude) {
      mapRef.current.flyTo({
        center: [parseFloat(longitude), parseFloat(latitude)],
        zoom: 19,
        essential: true,
        duration: 1500,
      });
    }
  }, [latitude, longitude]);

  return (
    <div className={styles.mapWrap}>
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: selectedArea.latitude,
          longitude: selectedArea.longitude,
          zoom: 17,
        }}
        maxZoom={22}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      >
        <NavigationControl position="bottom-right" />

        {sensors.map((sensor) => (
          <SensorCircle
            key={sensor.uid}
            sensor={sensor}
            isSelected={selectedSensor?.uid === sensor.uid}
            onClick={() =>
              setSelectedSensor(
                selectedSensor?.uid === sensor.uid ? null : sensor,
              )
            }
          />
        ))}
      </Map>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ background: "#3ecf6e" }}
          />
          <span>Baixo &lt;60 dB</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ background: "#e4a830" }}
          />
          <span>Médio 60–80 dB</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ background: "#e05a5a" }}
          />
          <span>Alto ≥80 dB</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ background: "#555c6e" }}
          />
          <span>Sem sinal</span>
        </div>
      </div>

      {selectedSensor && (
        <div className={styles.cardWrap}>
          <SensorCard
            sensor={selectedSensor}
            onClose={() => setSelectedSensor(null)}
          />
        </div>
      )}
    </div>
  );
}

export default DynamicMap;
