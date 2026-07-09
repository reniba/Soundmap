import { Link } from "react-router-dom";
import LoginAndSignUpInput from "../components/LoginInput";
import { login } from "../services/authService";
import { useState } from "react";
import styles from "./LoginAndSignUp.module.css";
import logo from "../assets/logo.svg";
import { User, Lock, CircleX, CircleCheckBig } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [sucess, setSucess] = useState(false);
  const navigate = useNavigate();

  async function handleLogin() {
    try {
      const { token } = await login(emailOrUsername, password);

      localStorage.setItem("token", token);
      setSucess(true);

      setTimeout(() => navigate("/dashboard/map"), 1500);
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
        setSucess(false);
      }
    }
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.soundMapIot}>
          <img className={styles.logo} src={logo} alt="Logo" />
          <h1 className={styles.soundMap}>SoundMap</h1>
          <h1 className={styles.iot}>IoT</h1>
        </div>
        <div className={styles.container}>
          <h1 className={styles.h1}>Entrar na plataforma</h1>
          <h2 className={styles.h2_spaced}>
            Monitore seus dispositivos de áudio em tempo real.
          </h2>

          <h2 className={styles.h2}>E-mail ou username</h2>
          <LoginAndSignUpInput
            placeholder="E-mail ou username"
            onChange={setEmailOrUsername}
            onChangeRedefineMessage={setMessage}
            value={emailOrUsername}
            icon={<User size={18} />}
            isSensitive={false}
          />
          <h2 className={styles.h2}>Senha</h2>
          <LoginAndSignUpInput
            placeholder="Senha"
            onChange={setPassword}
            onChangeRedefineMessage={setMessage}
            value={password}
            icon={<Lock size={18} />}
            isSensitive={true}
          />
          {message && !sucess && (
            <div className={styles.errorBox}>
              <CircleX className={styles.icon} size={18} />
              <p className={styles.errorMessage}>{message}</p>
            </div>
          )}
          <button className={styles.buttom} onClick={handleLogin}>
            Enviar
          </button>
          <div className={styles.createAccount}>
            <h2 className={styles.doNotHaveAnAccount}>Não tem uma conta? </h2>
            <Link className={styles.link} to="/signup">
              Criar conta
            </Link>
          </div>
        </div>
        {sucess && (
          <div className={styles.successOverlay}>
            <div className={styles.successCard}>
              <CircleCheckBig className={styles.sucessIcon} size={42} />

              <h2 className={styles.successTitle}>
                Login realizado com sucesso!
              </h2>

              <p className={styles.successText}>Redirecionando...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Login;
