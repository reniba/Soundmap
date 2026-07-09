export default async function getSensorCoordinatesBySensorId(sensorId: number) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Usuário não autenticado");
  }

  const params = new URLSearchParams({
    sensorId: String(sensorId),
  });

  const response = await fetch(`/api/sensor/last-state?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude,
  };
}
