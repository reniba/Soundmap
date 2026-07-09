import { Router } from "express";
import MeasureController from "../controllers/Measure.controller.js";

const router = Router();
const measureService = new MeasureController();

router.post("/", measureService.postNewMeasure);

export default router;
