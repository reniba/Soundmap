import { useState } from "react";
import LoginAndSignUpInput from "../components/LoginInput";
import { signUp } from "../services/authService";
import { Link } from "react-router-dom";
import styles from "./LoginAndSignUp.module.css";
import logo from "../assets/logo.svg";
import { Mail, User, Lock, CircleX, CircleCheckBig } from "lucide-react";
import { useNavigate } from "react-router-dom";

function SignUp() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [sucess, setSucess] = useState(false);
  const navigate = useNavigate();

  async function handleSignUp() {
    try {
      await signUp(email, username, password);

      setSucess(true);

      setTimeout(() => navigate("/"), 2500);
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
          <h1 className={styles.h1}>Criar minha conta</h1>
          <h2 className={styles.h2_spaced}>Crie seu cadastro na plataforma.</h2>

          <h2 className={styles.h2}>E-mail</h2>
          <LoginAndSignUpInput
            placeholder="E-mail"
            value={email}
            onChange={setEmail}
            onChangeRedefineMessage={setMessage}
            icon={<Mail size={18} />}
            isSensitive={false}
          ></LoginAndSignUpInput>
          <h2 className={styles.h2}>Username</h2>
          <LoginAndSignUpInput
            placeholder="Username"
            value={username}
            onChange={setUsername}
            onChangeRedefineMessage={setMessage}
            icon={<User size={18} />}
            isSensitive={false}
          ></LoginAndSignUpInput>
          <h2 className={styles.h2}>Password</h2>
          <LoginAndSignUpInput
            placeholder="Password"
            value={password}
            onChange={setPassword}
            onChangeRedefineMessage={setMessage}
            icon={<Lock size={18} />}
            isSensitive={true}
          ></LoginAndSignUpInput>
          {message && !sucess && (
            <div className={styles.errorBox}>
              <CircleX className={styles.icon} size={18} />
              <p className={styles.errorMessage}>{message}</p>
            </div>
          )}
          <button className={styles.buttom} onClick={handleSignUp}>
            Enviar
          </button>
          <div className={styles.createAccount}>
            <h2 className={styles.doNotHaveAnAccount}>Já tem uma conta? </h2>
            <Link className={styles.link} to="/">
              Fazer login
            </Link>
          </div>
        </div>
        {sucess && (
          <div className={styles.successOverlay}>
            <div className={styles.successCard}>
              <CircleCheckBig className={styles.sucessIcon} size={42} />

              <h2 className={styles.successTitle}>Conta criada com sucesso!</h2>

              <p className={styles.successText}>Faça o login...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SignUp;
