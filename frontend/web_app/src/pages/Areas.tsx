import styles from "./Areas.module.css";
import getUserAreas from "../services/getUserAreas";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Area = {
  id: number;
  name: string;
  url: string;
  latitude: number;
  longitude: number;
};

function Areas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAreas() {
      try {
        const response = await getUserAreas();
        setAreas(response);
      } catch (error) {
        throw error;
      }
    }

    loadAreas();
  }, []);

  function handleClick() {
    try {
      navigate("/dashboard/areas/createArea");
    } catch (error) {}
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <p className={styles.title}>Áreas cadastradas</p>
          <p className={styles.numberAreas}>{areas.length} áreas</p>
        </div>
        <button className={styles.createArea} onClick={handleClick}>
          Criar área
        </button>
      </div>
      <div className={styles.grid}>
        {areas.map((area) => {
          return (
            <div className={styles.card}>
              <img className={styles.image} src={area.url} />
              <p className={styles.areaName}>{area.name}</p>
              <p className={styles.coordinate}>
                {area.latitude}, {area.longitude}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Areas;
