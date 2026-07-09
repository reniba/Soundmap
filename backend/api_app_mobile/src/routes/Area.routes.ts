import { Router } from "express";
import AreaController from "../controllers/Area.controller.js";

const router = Router();
const areaController = new AreaController();

router.get("/", areaController.getAllAreas);

export default router;
