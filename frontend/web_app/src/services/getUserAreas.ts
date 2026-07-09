export default async function getUserAreas() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Usuário não autorizado");
    }

    const response = await fetch("/api/area", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status > 300) {
      throw new Error("Erro ao buscar por todas as áreas do usuário");
    }

    const data = await response.json();
    console.log(data);

    return data.areas;
  } catch (error) {
    throw error;
  }
}
