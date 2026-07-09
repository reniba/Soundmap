import type { Request, Response } from "express";
import { ApiError } from "../errors/ApiError.js";
import UserService from "../services/User.service.js";
import { type SignUpIn, SignUpInSchema } from "../schemas/in/signUpInSchema.js";
import { type LoginIn, LoginInSchema } from "../schemas/in/loginInSchema.js";
import {
  type LoginOut,
  LoginOutSchema,
} from "../schemas/out/loginOutSchema.js";
import {
  type GetUserInfoOut,
  GetUserInfoOutSchema,
} from "../schemas/out/getUserInfoOutSchema.js";

export default class UserController {
  userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  signUp = async (req: Request, res: Response) => {
    const body: SignUpIn = SignUpInSchema.parse(req.body);

    await this.userService.signUp(body);

    res.status(200).json({ message: "Usuário cadastrado" });
  };

  login = async (req: Request, res: Response) => {
    const body: LoginIn = LoginInSchema.parse(req.body);

    const result = await this.userService.login(body);

    const safeResult: LoginOut = LoginOutSchema.parse(result);

    return res.status(200).json(safeResult);
  };

  getUserInfo = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    const userId: number = req.user.userId;

    const result = await this.userService.getUserInfo(userId);

    const safeResult: GetUserInfoOut = GetUserInfoOutSchema.parse(result);

    return res.status(200).json(safeResult);
  };
}
