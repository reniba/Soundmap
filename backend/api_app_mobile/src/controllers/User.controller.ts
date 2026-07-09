import UserService from "../services/User.service.js";
import type { Request, Response } from "express";
import { LoginResult } from "../enums/LoginResult.js";
import jwt from "jsonwebtoken";
import type { LoginResponse } from "../services/User.service.js";

export default class UserController {
  userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  authenticate = async (req: Request, res: Response) => {
    const { emailOrUsername, password } = req.body;

    const authResult: LoginResponse = await this.userService.verifyLogin(
      emailOrUsername,
      password,
    );

    switch (authResult.result) {
      case LoginResult.USER_NOT_FOUND:
        res.status(404).send("Usuário não encontrado");
        break;

      case LoginResult.WRONG_PASSWORD:
        res.status(401).send("Senha incorreta");
        break;

      case LoginResult.OK:
        const token = jwt.sign(
          { userId: authResult.userId },
          process.env.JWT_SECRET as string,
          {
            expiresIn: "1d",
          },
        );

        const username =
          await this.userService.getUsernameByEmailOrUsername(emailOrUsername);

        res.status(200).json({ token: token, username: username });
        break;
    }
  };
}
