import styles from "./Devices.module.css";
import getUserDevices from "../services/getUserDevices";
import getUserAreas from "../services/getUserAreas";
import putSensorInArea from "../services/putSensorInArea";
import deleteSensor from "../services/deleteSensor";
import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

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

type EditingState = {
  deviceId: number;
  originalAreaId: number;
  selectedAreaId: number;
};

function Devices() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const { devices, setDevices } = useOutletContext<{
    devices: Device[];
    setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  }>();

  useEffect(() => {
    async function load() {
      try {
        const [devResponse, areaResponse] = await Promise.all([
          getUserDevices(),
          getUserAreas(),
        ]);
        setDevices(devResponse);
        setAreas(areaResponse);
      } catch (error) {
        if (error instanceof Error) toast.error(error.message);
      }
    }
    load();
  }, []);

  function startEditing(device: Device) {
    setEditing({
      deviceId: device.id,
      originalAreaId: device.areaId,
      selectedAreaId: device.areaId,
    });
  }

  function discardChanges() {
    setEditing(null);
  }

  async function saveChanges() {
    if (!editing) return;
    try {
      await putSensorInArea(editing.deviceId, editing.selectedAreaId, true);
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id !== editing.deviceId) return d;
          const area = areas.find((a) => a.id === editing.selectedAreaId);
          return {
            ...d,
            areaId: editing.selectedAreaId,
            areaName: area?.name ?? d.areaName,
          };
        }),
      );
      toast.success("Vínculo atualizado com sucesso!");
      setEditing(null);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  }

  async function handleDelete(sensorId: number) {
    try {
      await deleteSensor(sensorId);
      setDevices((prev) => prev.filter((d) => d.id !== sensorId));
      toast.success("Sensor removido com sucesso");
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  }

  const activeDevices = devices.filter((d) => d.activeInArea);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <p className={styles.title}>Sensores cadastrados</p>
          <p className={styles.numberAreas}>{activeDevices.length} sensores</p>
        </div>
        <button
          className={styles.createArea}
          onClick={() => navigate("/dashboard/devices/createDevice")}
        >
          Cadastrar sensor
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Área vinculada</th>
              <th></th>
              <th style={{ width: "48px" }}></th>
            </tr>
          </thead>
          <tbody>
            {activeDevices.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.empty}>
                  Nenhum sensor ativo cadastrado.
                </td>
              </tr>
            ) : (
              activeDevices.map((device) => {
                const isEditing = editing?.deviceId === device.id;
                return (
                  <tr key={device.id}>
                    <td className={styles.nameCell}>{device.name}</td>
                    <td className={styles.areaCell}>
                      {isEditing ? (
                        <select
                          className={styles.areaSelect}
                          value={editing.selectedAreaId}
                          onChange={(e) =>
                            setEditing((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    selectedAreaId: Number(e.target.value),
                                  }
                                : null,
                            )
                          }
                          autoFocus
                        >
                          {areas.map((area) => (
                            <option key={area.id} value={area.id}>
                              {area.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={styles.areaPill}
                          onClick={() => startEditing(device)}
                          title="Clique para alterar"
                        >
                          {device.areaName}
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
                          </svg>
                        </span>
                      )}
                    </td>
                    <td className={styles.actionsCell}>
                      {isEditing && (
                        <div className={styles.actions}>
                          <button
                            className={styles.btnDiscard}
                            onClick={discardChanges}
                          >
                            Descartar
                          </button>
                          <button
                            className={styles.btnSave}
                            onClick={saveChanges}
                          >
                            Salvar
                          </button>
                        </div>
                      )}
                    </td>
                    <td className={styles.deleteCell}>
                      <button
                        className={styles.btnDelete}
                        onClick={() => handleDelete(device.id)}
                        title="Remover sensor"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Devices;
