export default async function getUsername() {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch("/api/user/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar dado");
    }

    const data = await response.json();
    const { username } = data;

    return username;
  } catch (error) {
    throw error;
  }
}
