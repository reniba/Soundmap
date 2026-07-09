export default async function putSensorInArea(sensorId: number) {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Usuário não autorizado");
    }

    const response = await fetch(`/api/sensor?sensorId=${sensorId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status != 200) {
      throw new Error("Erro ao deletar sensor");
    }

    const data = await response.json();
    const { message } = data;

    return message;
  } catch (error) {
    throw error;
  }
}
