import { Router } from "express";
import SensorController from "../controllers/Sensor.controller.js";

const router = Router();
const sensorController = new SensorController();

router.get("/", sensorController.getSensorsOfUser);
router.get("/last-state", sensorController.getSensorLastState);
router.post("/", sensorController.createSensor);
router.delete("/", sensorController.deleteSensor);
router.put("/", sensorController.putSensorInArea);

export default router;
