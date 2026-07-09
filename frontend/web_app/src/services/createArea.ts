async function createArea(
  name: string,
  latitude: number,
  longitude: number,
  url: string,
) {
  try {
    const token = localStorage.getItem("token");

    console.log(token);

    if (!token) {
      throw new Error("Usuário não autorizado");
    }

    const payload = JSON.stringify({ name, latitude, longitude, url });

    const response = await fetch("/api/area", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: payload,
    });

    const data = await response.json();

    if (response.status != 200) {
      throw new Error(data.message);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export default createArea;
