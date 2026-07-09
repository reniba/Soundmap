import { pool } from "../database/db.js";

export default class AreaRepository {
  async getAllAreasByUserId(user_id: number) {
    try {
      const areas = await pool.query(
        "SELECT id, name, url FROM area WHERE user_id = $1",
        [user_id],
      );

      return areas.rows;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
