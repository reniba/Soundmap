export default async function getUserDevices() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Usuário não autorizado");
    }

    const response = await fetch("/api/sensor/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status > 300) {
      throw new Error("Erro ao buscar dados dos sensores");
    }

    const data = await response.json();

    return data.sensors;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
