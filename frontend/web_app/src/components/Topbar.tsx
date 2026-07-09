import LogoBox from "./LogoBox";
import TopBarSearch from "./TopBarSearch";
import styles from "./Topbar.module.css";

type Device = {
  id: number;
  name: string;
  activeInArea: boolean;
  areaId: number;
  areaName: string;
};

type Area = {
  id: number;
  name: string;
  url: string;
  latitude: number;
  longitude: number;
};

type Props = {
  username: string;
  areas: Area[];
  selectedArea: Area;
  setSelectedArea: (area: Area) => void;
  devices: Device[];
};

function Topbar({
  username,
  areas,
  selectedArea,
  setSelectedArea,
  devices,
}: Props) {
  return (
    <>
      <div className={styles.container}>
        <LogoBox />
        <TopBarSearch
          username={username}
          areas={areas}
          selectedArea={selectedArea}
          setSelectedArea={setSelectedArea}
          devices={devices}
        />
      </div>
    </>
  );
}

export default Topbar;
