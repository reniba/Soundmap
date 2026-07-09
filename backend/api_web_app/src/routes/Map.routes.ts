import { Router } from "express";
import MapController from "../controllers/Map.controller.js";

const router = Router();
const mapController = new MapController();

router.get("/", mapController.getMap);

export default router;