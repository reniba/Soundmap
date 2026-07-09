import { Router } from "express";
import UserController from "../controllers/User.controller.js";
import authMiddleware from "../middlewares/auth.js";

const router = Router();
const userController = new UserController();

router.post("/signUp", userController.signUp);
router.post("/login", userController.login);
router.get("/", authMiddleware, userController.getUserInfo);

export default router;
