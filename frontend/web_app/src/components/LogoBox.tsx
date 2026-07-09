import logo from "../assets/logo.svg";
import styles from "./LogoBox.module.css";

function LogoBox() {
  return (
    <>
      <div className={styles.soundMapIot}>
        <img className={styles.logo} src={logo} alt="Logo" />
        <h1 className={styles.soundMap}>SoundMap</h1>
        <h1 className={styles.iot}>IoT</h1>
      </div>
    </>
  );
}

export default LogoBox;
