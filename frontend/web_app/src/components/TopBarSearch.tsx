import styles from "./TopBarSearch.module.css";
import SensorSearchInput from "./SensorSearchInput";
import { Toaster } from "sonner";
import UserProfile from "./UserProfile";
import AreaField from "./AreaField";

type Area = {
  id: number;
  name: string;
  url: string;
  latitude: number;
  longitude: number;
};

type Device = {
  id: number;
  name: string;
  activeInArea: boolean;
  areaId: number;
  areaName: string;
};

type Props = {
  username: string;
  areas: Area[];
  selectedArea: Area;
  setSelectedArea: (area: Area) => void;
  devices: Device[];
};

function TopBarSearch({
  username,
  areas,
  selectedArea,
  setSelectedArea,
  devices,
}: Props) {
  return (
    <>
      <Toaster richColors />
      <div className={styles.container}>
        <AreaField
          areas={areas}
          selectedArea={selectedArea}
          setSelectedArea={setSelectedArea}
        />
        <SensorSearchInput devices={devices} />
        <UserProfile username={username} />
      </div>
    </>
  );
}

export default TopBarSearch;
