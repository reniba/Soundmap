import { pool } from "../database/db.js";
import { ApiError } from "../errors/ApiError.js";
import bcrypt from "bcrypt";
import { SignUpResult } from "../enums/SignUpResult.js";

export default class UserRepository {
  emailExists = async (email: string): Promise<boolean> => {
    try {
      const result = await pool.query(
        "SELECT id FROM users WHERE email = $1;",
        [email],
      );

      return result.rowCount ? true : false;
    } catch (error) {
      throw error;
    }
  }

  usernameExists = async (username: string): Promise<boolean> => {
    try {
      const result = await pool.query(
        "SELECT id FROM users WHERE username = $1;",
        [username],
      );

      return result.rowCount ? true : false;
    } catch (error) {
      throw error;
    }
  }

  createUser = async (email: string, username: string, password: string): Promise<void> => {
    try {
      await pool.query(
        "INSERT INTO users(email, username, hash_password) VALUES($1, $2, $3);",
        [email, username, password],
      );
    } catch (error) {
      throw error;
    }
  }

  verifyEmailOrUsername = async (emailOrUsername: string): Promise<boolean> => {
    try {
      const result = await pool.query(
        "SELECT id FROM users WHERE email = $1 OR username = $1;",
        [emailOrUsername],
      );

      return result.rowCount ? true : false;
    } catch (error) {
      throw error;
    }
  }

  getIdByEmailOrUsername = async (emailOrUsername: string): Promise<number> => {
    try {
      const result = await pool.query(
        "SELECT id FROM users WHERE email = $1 OR username = $1;",
        [emailOrUsername],
      );

      return result.rows[0].id;
    } catch (error) {
      throw error;
    }
  }

  comparePasswordById = async (user_id: number, password: string): Promise<boolean> => {
    try {
      const result = await pool.query(
        "SELECT hash_password FROM users WHERE id = $1",
        [user_id],
      );

      const isRight = await bcrypt.compare(
        password,
        result.rows[0].hash_password,
      );

      return isRight;
    } catch (error) {
      throw error;
    }
  }

  getUsernameById = async (user_id: number): Promise<string> => {
    try {
      const username = (await pool.query(
        "SELECT username FROM users WHERE id = $1",
        [user_id],
      )).rows[0]?.username;

      if(!username) {
        throw new ApiError(404, "Nome de usuário não encontrado");
      }

      return username;
    } catch (error) {
      throw error;
    }
  }

  getEmailById = async (user_id: number): Promise<string> => {
    try {
      const email = (await pool.query(
        "SELECT email FROM users WHERE id = $1",
        [user_id],
      )).rows[0]?.email;

      if(!email) {
        throw new ApiError(404, "E-mail de usuário não encontrado");
      }

      return email;
    } catch (error) {
      throw error;
    } 
  }
}
