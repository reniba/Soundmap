type HistoryPoint = {
  time: string;
  dbAverage: number;
  dbMax: number;
};

export default async function getHistoricalData(
  areaId: number,
  sensorId: number,
  from: string,
  to: string,
): Promise<HistoryPoint[]> {
  const token = localStorage.getItem("token");

  const params = new URLSearchParams({
    areaId: String(areaId),
    sensorId: String(sensorId),
    windowStart: new Date(from).toISOString(),
    windowEnd: new Date(to).toISOString(),
  });

  const response = await fetch(`/api/measure?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Erro ao buscar histórico");

  const data = await response.json();

  return (data.measures ?? []).map((m: any) => ({
    time: new Date(m.windowEnd).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    dbAverage: m.dbAvg,
    dbMax: m.dbMax,
  }));
}
