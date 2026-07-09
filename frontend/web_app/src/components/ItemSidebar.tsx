import styles from "./ItemSidebar.module.css";
import { NavLink } from "react-router-dom";

type Props = {
  text: string;
  icon: React.ReactNode;
  to: string;
};

function SidebarElement({ text, icon, to }: Props) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? styles.active : styles.element)}
    >
      <div className={styles.icon}>{icon}</div>
      <div className={styles.text}>{text}</div>
    </NavLink>
  );
}

export default SidebarElement;
