import styles from "./CreateDevice.module.css";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Image } from "lucide-react";
import { CircleAlert } from "lucide-react";
import { toast } from "sonner";
import createSensor from "../services/createSensor";
import getUserAreas from "../services/getUserAreas";

type Area = {
  id: number;
  name: string;
  url: string;
  latitude: number;
  longitude: number;
};

function CreateDevice() {
  const navigate = useNavigate();
  const [sensorName, setSensorName] = useState("");
  const [areaId, setAreaId] = useState(-1);
  const [areas, setAreas] = useState<Area[]>([]);

  async function handleClick() {
    try {
      await createSensor(sensorName, areaId);

      toast.success("Sensor criado com sucesso");
      setTimeout(() => navigate("/dashboard/devices"), 1500);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }

  useEffect(() => {
    async function getAllUserAreas() {
      try {
        const response = await getUserAreas();

        setAreas(response.areas ?? response ?? []);
      } catch (error) {
        throw error;
      }
    }

    getAllUserAreas();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.infosContainer}>
        <div
          className={styles.getBackContainer}
          onClick={() => navigate("/dashboard/devices")}
        >
          <ArrowLeft className={styles.icon} size={12} />
          <p className={styles.getBackText}>Voltar</p>
        </div>
        <p className={styles.infosText}>INFORMAÇÕES</p>
        <p className={styles.inputTitle}>Nome do sensor</p>
        <input
          className={styles.input}
          onChange={(e) => setSensorName(e.target.value)}
          placeholder="Ex: SMH 10"
        />

        <p className={styles.infosText}>ÁREA</p>
        <div className={styles.userInstructionsContainer}>
          <CircleAlert className={styles.instructionsIcon} size={40} />
          <p className={styles.instructionsText}>
            Clique na área à qual você deseja vincular este sensor.
            Posteriormente, você pode editar o vínculo.
          </p>
        </div>

        <button className={styles.button} onClick={handleClick}>
          Criar sensor
        </button>
      </div>
      <div className={styles.areasContainer}>
        {areas?.length === 0 ? (
          <p className={styles.emptyAreas}>Nenhuma área cadastrada</p>
        ) : (
          <div className={styles.areasGrid}>
            {(areas ?? []).map((area) => (
              <div
                key={area.id}
                className={`${styles.areaCard} ${areaId === area.id ? styles.areaCardSelected : ""}`}
                onClick={() => setAreaId(area.id === areaId ? -1 : area.id)}
              >
                <div className={styles.areaCardImg}>
                  {area.url ? (
                    <img
                      src={area.url}
                      alt={area.name}
                      className={styles.areaCardImgEl}
                    />
                  ) : (
                    <div className={styles.areaCardImgPlaceholder}>
                      <Image size={20} />
                    </div>
                  )}
                </div>
                <p className={styles.areaCardName}>{area.name}</p>
                <p className={styles.areaCardCoords}>
                  {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
                </p>
                {areaId === area.id && (
                  <div className={styles.areaCardCheck}>✓</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateDevice;
