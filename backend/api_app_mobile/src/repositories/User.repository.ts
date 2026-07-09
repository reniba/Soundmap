import { pool } from "../database/db.js";
import bcrypt from "bcrypt";

export interface QueriesResult {
  result: boolean;
  userId?: number;
}

export default class UserRepository {
  async emailOrUsernameExists(emailOrUsername: string) {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE email = $1 OR username = $1",
        [emailOrUsername],
      );

      if (result.rowCount) {
        return true;
      } else return false;
    } catch (error) {
      throw error;
    }
  }

  async passwordIsRight(emailOrUsername: string, password: string) {
    try {
      const result = await pool.query(
        "SELECT id, hash_password FROM users WHERE email = $1 OR username = $1;",
        [emailOrUsername],
      );

      const isRight = await bcrypt.compare(
        password,
        result.rows[0].hash_password,
      );

      return { result: isRight, userId: result.rows[0].id };
    } catch (error) {
      throw error;
    }
  }

  getUsernameByEmailOrUsername = async (emailOrUsername: string) => {
    try {
      const result = await pool.query(
        "SELECT username FROM users WHERE email = $1 OR username = $1;",
        [emailOrUsername],
      );

      return result.rows[0].username;
    } catch (error) {
      throw error;
    }
  };
}
