import { Router } from "express";
import UserController from "../controllers/User.controller.js";

const router = Router();
const userController = new UserController();

router.post("/", userController.authenticate);

export default router;
