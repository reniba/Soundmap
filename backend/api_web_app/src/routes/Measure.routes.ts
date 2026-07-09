import { Router } from "express";
import MeasureController from "../controllers/Measure.controller.js";

const router = Router();
const measureController = new MeasureController();

router.get("/", measureController.getMeasuresFromSensor);

export default router;
