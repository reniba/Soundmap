import { Router } from "express";
import AreaController from "../controllers/Area.controller.js";

const router = Router();
const areaController = new AreaController();

router.get("/", areaController.getAllUserAreas);
router.post("/", areaController.createArea);
router.delete("/", areaController.deleteArea);

export default router;
