import UserRepository from "../repositories/User.repository.js";
import { ApiError } from "../errors/ApiError.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { LoginResult } from "../enums/LoginResult.js";
import { SignUpResult } from "../enums/SignUpResult.js";
import type { SignUpIn } from "../schemas/in/signUpInSchema.js";
import type { LoginIn } from "../schemas/in/loginInSchema.js";
import type { LoginOut } from "../schemas/out/loginOutSchema.js";
import type { GetUserInfoOut } from "../schemas/out/getUserInfoOutSchema.js";

export interface LoginResponse {
  result: LoginResult;
  userId?: number;
}

export default class UserService {
  userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  signUp = async(singUpData: SignUpIn): Promise<void> => {
    const { email, username, password } = singUpData;

    try {
      const emailExists = await this.userRepository.emailExists(email);
      if (emailExists) {
        throw new ApiError(400, "E-mail já cadastrado");
      }

      const usernameExists = await this.userRepository.usernameExists(username);
      if (usernameExists) {
        throw new ApiError(400, "Username já cadastrado");
      }

      const hash_password = await bcrypt.hash(password, 10);

      await this.userRepository.createUser(email, username, hash_password);
    } catch (error) {
      throw error;
    }
  }

  login = async (loginData: LoginIn): Promise<LoginOut> => {
    const { emailOrUsername, password } = loginData;
    try {
      
      const emailOrUsernameExists = (await this.userRepository.verifyEmailOrUsername(emailOrUsername));
      if (!emailOrUsernameExists) {
        throw new ApiError(400, "E-mail ou username não cadastrado");
      }

      const userId = await this.userRepository.getIdByEmailOrUsername(emailOrUsername);

      const passwordMatch: boolean = (await this.userRepository.comparePasswordById(userId, password));
      if (!passwordMatch) {
        throw new ApiError(400, "Senha incorreta");
      }

      const token = jwt.sign(
        { userId: userId },
        process.env.JWT_SECRET as string,
        {
          expiresIn: "1d",
        },
      );

      const result: LoginOut = {token: token};
        
      return result;
    } catch (error) {
      throw error;
    }
  }

  getUserInfo = async (userId: number): Promise<GetUserInfoOut> => {
    const username = await this.userRepository.getUsernameById(userId);
    const email = await this.userRepository.getEmailById(userId);

    const result: GetUserInfoOut = {
      username: username,
      email: email,
    };

    return result;
  }
}
