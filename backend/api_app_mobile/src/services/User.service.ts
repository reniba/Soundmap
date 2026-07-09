import express from "express";
import type { Request, Response } from "express";
import UserRepository from "../repositories/User.repository.js";
import { LoginResult } from "../enums/LoginResult.js";
import type { QueriesResult } from "../repositories/User.repository.js";

export interface LoginResponse {
  result: LoginResult;
  userId?: number | undefined;
}

export default class UserService {
  userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  verifyLogin = async (emailOrUsername: string, password: string) => {
    try {
      if (!(await this.userRepository.emailOrUsernameExists(emailOrUsername))) {
        return { result: LoginResult.USER_NOT_FOUND };
      }

      const passwordIsRight: QueriesResult =
        await this.userRepository.passwordIsRight(emailOrUsername, password);
      if (!passwordIsRight.result) {
        return { result: LoginResult.WRONG_PASSWORD };
      }

      return { result: LoginResult.OK, userId: passwordIsRight.userId };
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  getUsernameByEmailOrUsername = async (emailOrUsername: string) => {
    try {
      const result =
        await this.userRepository.getUsernameByEmailOrUsername(emailOrUsername);

      return result;
    } catch (error) {
      throw error;
    }
  };
}
