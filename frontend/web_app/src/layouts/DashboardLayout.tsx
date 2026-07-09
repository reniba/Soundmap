import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";
import styles from "./DashboardLayout.module.css";
import { useState, useEffect } from "react";
import getUsername from "../services/getUsername";
import getUserAreas from "../services/getUserAreas";
import getUserDevices from "../services/getUserDevices";
import { toast } from "sonner";

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

function DashboardLayout() {
  const [username, setUsername] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area>({
    id: -1,
    name: "Carregando...",
    url: "",
    latitude: 0,
    longitude: 0,
  });
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    async function loadUser() {
      try {
        const username = await getUsername();
        const areas = await getUserAreas();

        setUsername(username);
        setAreas(areas);

        setSelectedArea({
          id: -1,
          name:
            areas.length > 0
              ? "Nenhuma área selecionada"
              : "Nenhuma área cadastrada",
          url: "",
          latitude: 0,
          longitude: 0,
        });
      } catch (error) {
        setSelectedArea({
          id: -1,
          name: "Não foi possível buscar as áreas",
          url: "",
          latitude: 0,
          longitude: 0,
        });
        throw error;
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    async function loadDevices() {
      try {
        const sensors = await getUserDevices();

        console.log("Sensores: " + sensors);

        setDevices(sensors);
      } catch (error) {
        toast.error("Erro ao buscar dados dos sensores");
      }
    }

    loadDevices();
  }, []);

  return (
    <>
      <div className={styles.container}>
        <Topbar
          username={username}
          selectedArea={selectedArea}
          areas={areas}
          setSelectedArea={setSelectedArea}
          devices={devices}
        />
        <div className={styles.box}>
          <Sidebar />
          <Outlet context={{ selectedArea, setAreas, devices, setDevices }} />
        </div>
      </div>
    </>
  );
}

export default DashboardLayout;
