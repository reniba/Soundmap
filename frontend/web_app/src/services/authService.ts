type LoginResponse = {
  token: string;
};

type SignUpResponse = {
  message: string;
};

export async function login(
  emailOrUsername: string,
  password: string,
): Promise<LoginResponse> {
  try {
    const payload = JSON.stringify({ emailOrUsername, password });

    const response = await fetch("/api/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    });

    const data = await response.json();

    if (response.status != 200) throw new Error(data.message);

    return data;
  } catch (error) {
    throw error;
  }
}

export async function signUp(
  email: string,
  username: string,
  password: string,
): Promise<SignUpResponse> {
  try {
    const payload = JSON.stringify({ email, username, password });

    const response = await fetch("http://localhost:4344/user/signUp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    });

    const data = await response.json();

    if (response.status != 200) throw new Error(data.message);

    return data;
  } catch (error) {
    throw error;
  }
}
