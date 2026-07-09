// fazer um componente global e usar outlet (pesquisar)
import Sidebar from "../components/Sidebar";
import styles from "./Dashboard.module.css";

function Dashboard() {
  return (
    <>
      <div className={styles.container}>
        <Sidebar />
      </div>
    </>
  );
}

export default Dashboard;
