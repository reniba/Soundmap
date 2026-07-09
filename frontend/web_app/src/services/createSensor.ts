async function createSensor(name: string, areaId: number) {
  try {
    const token = localStorage.getItem("token");

    console.log(token);

    if (!token) {
      throw new Error("Usuário não autorizado");
    }

    const payload = JSON.stringify({ name, areaId });

    const response = await fetch("/api/sensor", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: payload,
    });

    const data = await response.json();

    if (response.status > 300) {
      throw new Error(data.message);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export default createSensor;
