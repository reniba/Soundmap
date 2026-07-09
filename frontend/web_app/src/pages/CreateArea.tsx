import styles from "./CreateArea.module.css";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Image } from "lucide-react";
import { TriangleAlert } from "lucide-react";
import { CircleAlert } from "lucide-react";
import getUserLocation from "../services/getUserLocation";
import getUserAreas from "../services/getUserAreas";
import MapPointArea from "../components/MapPointArea";
import createArea from "../services/createArea";
import { toast } from "sonner";
import { useOutletContext } from "react-router-dom";

type Point = { latitude: number; longitude: number };

type Area = {
  id: number;
  name: string;
  url: string;
  latitude: number;
  longitude: number;
};

function CreateArea() {
  const [areaName, setAreaName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [currentPoint, setCurrentPoint] = useState<Point>();
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const { setAreas } = useOutletContext<{
    setAreas: (areas: Area[]) => void;
  }>();

  async function loadAreas() {
    const areas = await getUserAreas();

    setAreas(areas);
  }

  async function handleClick() {
    try {
      await createArea(
        areaName,
        currentPoint!.latitude,
        currentPoint!.longitude,
        imageUrl,
      );

      await loadAreas();

      toast.success("Área criada com sucesso");
      setTimeout(() => navigate("/dashboard/areas"), 1500);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }

  useEffect(() => {
    async function getUserPosition() {
      try {
        const { latitude, longitude } = await getUserLocation();

        setCurrentPoint({ latitude: latitude, longitude: longitude });
      } catch (error) {
        throw error;
      }
    }

    getUserPosition();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.infosContainer}>
        <div
          className={styles.getBackContainer}
          onClick={() => navigate("/dashboard/areas")}
        >
          <ArrowLeft className={styles.icon} size={12} />
          <p className={styles.getBackText}>Voltar</p>
        </div>
        <p className={styles.infosText}>INFORMAÇÕES</p>
        <p className={styles.inputTitle}>Nome da área</p>
        <input
          className={styles.input}
          onChange={(e) => setAreaName(e.target.value)}
          placeholder="Ex: Salas de Aula ICMC"
        />
        <div className={styles.urlInputTitle}>
          <p className={styles.inputTitle}>URL da imagem</p>
          <p className={styles.inputTitleComplement}>(Opcional)</p>
        </div>
        <input
          className={styles.input}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
        <div className={styles.imageContainer}>
          {imageUrl && !imageError && (
            <img
              src={imageUrl}
              className={styles.image}
              onError={() => {
                setImageError(true);
              }}
            />
          )}
          {!imageUrl && <Image className={styles.imageIcon} size={18} />}
          {imageUrl && imageError && (
            <div className={styles.errorMessageContainer}>
              <TriangleAlert className={styles.errorIcon} size={18} />
              <p className={styles.invalidUrlText}>URL inválida</p>
            </div>
          )}
        </div>
        <p className={styles.infosText}>LOCALIZAÇÃO</p>
        <div className={styles.userInstructionsContainer}>
          <CircleAlert className={styles.instructionsIcon} size={40} />
          <p className={styles.instructionsText}>
            Clique em qualquer ponto do mapa para definir a coordenada central
            da área. O último ponto marcado é mantido.
          </p>
        </div>
        <div className={styles.currentPointContainer}>
          <div className={styles.coordinate}>
            <p className={styles.cord}>Latitude: </p>
            <p className={styles.cordValue}>{currentPoint?.latitude}</p>
          </div>
          <div className={styles.coordinate}>
            <p className={styles.cord}>Longitude: </p>
            <p className={styles.cordValue}>{currentPoint?.longitude}</p>
          </div>
        </div>
        <button className={styles.button} onClick={handleClick}>
          Criar área
        </button>
      </div>
      <div className={styles.mapa}>
        <MapPointArea
          center={
            currentPoint
              ? [currentPoint.latitude, currentPoint.longitude]
              : undefined
          }
          onMapClick={(lat, lng) =>
            setCurrentPoint({ latitude: lat, longitude: lng })
          }
        />
      </div>
    </div>
  );
}

export default CreateArea;
