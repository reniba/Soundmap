export default async function putSensorInArea(
  sensorId: number,
  areaId: number,
  activeInArea: boolean,
) {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Usuário não autorizado");
    }

    const payload = JSON.stringify({ sensorId, areaId, activeInArea });

    const response = await fetch("/api/sensor/", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: payload,
    });

    if (response.status != 200) {
      throw new Error("Erro ao atualizar área");
    }

    const data = await response.json();
    const { message } = data;

    return message;
  } catch (error) {
    throw error;
  }
}
