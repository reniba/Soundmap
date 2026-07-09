import styles from "./Sidebar.module.css";
import { Map, Radio, LayoutGrid } from "lucide-react";
import SidebarElement from "./ItemSidebar";

const iconSize = 15;

function Sidebar() {
  return (
    <div className={styles.container}>
      <SidebarElement
        text="Mapa dinâmico"
        icon={<Map size={iconSize} />}
        to="/dashboard/map"
      />
      <SidebarElement
        text="Dispositivos"
        icon={<Radio size={iconSize} />}
        to="/dashboard/devices"
      />
      <SidebarElement
        text="Áreas"
        icon={<LayoutGrid size={iconSize} />}
        to="/dashboard/areas"
      />
    </div>
  );
}

export default Sidebar;
