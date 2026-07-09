import styles from "./SensorSearchInput.module.css";
import { Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import getSensorCoordinatesBySensorId from "../services/getSensorCoordinatesBySensorAndArea";
import { toast } from "sonner";

type Device = {
  id: number;
  name: string;
  activeInArea: boolean;
  areaId: number;
  areaName: string;
};

type Props = {
  devices: Device[];
};

function SensorSearchInput({ devices }: Props) {
  const [sensor, setSensor] = useState("");
  const [suggestions, setSuggestions] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSensor(value);
    setSelectedDevice(null);

    console.log("devices:", devices);
    console.log("digitado:", value);

    if (!value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const query = value.toLowerCase();
    const filtered = devices
      .filter((d) => d.name.toLowerCase().includes(query))
      .slice(0, 3);

    setSuggestions(filtered);
    setShowDropdown(filtered.length > 0);
  }

  function handleSelect(device: Device) {
    setSensor(device.name);
    setSelectedDevice(device);
    setSuggestions([]);
    setShowDropdown(false);
  }

  async function handleClick() {
    if (!selectedDevice) {
      toast.error("Selecione um sensor da lista de sugestões");
      return;
    }

    try {
      const { latitude, longitude } = await getSensorCoordinatesBySensorId(
        selectedDevice.id,
      );

      toast.success(`Navegando para ${selectedDevice.name}...`);

      setTimeout(
        () => navigate(`/dashboard/map/${latitude}/${longitude}`),
        1500,
      );
    } catch (error) {
      toast.error("Não foi possível encontrar as coordenadas do sensor");
      console.log("Erro: " + error);
    }
  }

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <div className={styles.container}>
        <Search size={13} color="#7e8087" />
        <input
          className={styles.input}
          value={sensor}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Pesquisar dispositivo"
        />
        <button className={styles.button} onClick={handleClick}>
          Buscar
        </button>
      </div>

      {showDropdown && (
        <ul className={styles.dropdown}>
          {suggestions.map((device) => (
            <li
              key={device.id}
              className={styles.dropdownItem}
              onMouseDown={() => handleSelect(device)}
            >
              <span className={styles.deviceName}>{device.name}</span>
              <span className={styles.deviceArea}>{device.areaName}</span>
              <span
                className={`${styles.statusDot} ${
                  device.activeInArea ? styles.active : styles.inactive
                }`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SensorSearchInput;
