import styles from "./AreaField.module.css";
import { CircleX, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Area = {
  id: number;
  name: string;
  url: string;
  latitude: number;
  longitude: number;
};

type Props = {
  selectedArea: Area;
  areas: Area[];
  setSelectedArea: (area: Area) => void;
};

function AreaField({ selectedArea, areas, setSelectedArea }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  async function handleClick() {
    try {
      console.log("Areas: " + areas);

      setIsOpen(!isOpen);
    } catch (error) {
      throw error;
    }
  }

  return (
    <>
      <div className={styles.container} onClick={handleClick}>
        {selectedArea.id == -1 && <CircleX />}
        {selectedArea.id != -1 && (
          <img className={styles.image} src={selectedArea.url} alt="Imagem" />
        )}
        <div className={styles.name}>{selectedArea.name}</div>
        {isOpen ? (
          <ChevronUp className={styles.icon} size={16} />
        ) : (
          <ChevronDown className={styles.icon} size={16} />
        )}

        {isOpen && (
          <div className={styles.dropdown}>
            {areas.map((area) => (
              <button
                key={area.id}
                className={styles.item}
                onClick={() => {
                  setSelectedArea(area);
                  setIsOpen(false);
                  navigate("/dashboard/map");
                }}
              >
                <img className={styles.image} src={area.url} alt="Imagem" />
                <p className={styles.name}>{area.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AreaField;
