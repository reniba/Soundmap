import { pool } from "../database/db.js";
import { getRedisClient } from "../database/redis.js";
import { ApiError } from "../errors/ApiError.js";
import type { GetAllUserAreasOut } from "../schemas/out/getAllUserAreasOutSchema.js";
import type { CreateAreaIn } from "../schemas/in/createAreaInSchema.js";

//_______createArea_________
const createAreaQuery = `
  INSERT INTO area
    (user_id, name, latitude, longitude, url) 
    VALUES($1, $2, $3, $4, $5)
  returning id;
`;

//_______deleteArea_________
const deleteAreaQuery = `
  DELETE FROM area
  WHERE
    user_id = $1
    AND id = $2
`;

//_______AreaExists_________
const areaExistsQuery = `
  SELECT 
    id 
  FROM area
  WHERE 
    user_id = $1 
    AND name = $2;`;

//_______getAllUserAreasById_________
const getAllUserAreasByIdQuery = `
  SELECT 
    id, 
    name, 
    url,
    latitude,
    longitude 
  FROM area 
  WHERE user_id = $1;
`;
export default class AreaRepository {
  createArea = async (
    userId: number,
    areaData: CreateAreaIn,
  ): Promise<void> => {
    const { name, latitude, longitude, url } = areaData;

    try {
      const id: number | undefined = (
        await pool.query(createAreaQuery, [
          userId,
          name,
          latitude,
          longitude,
          url,
        ])
      ).rows[0]?.id;

      if (!id) {
        throw new ApiError(500, "Erro ao criar área");
      }
    } catch (error) {
      throw error;
    }
  };

  deleteArea = async (userId: number, areaId: number): Promise<void> => {
    try {
      const result = await pool.query(deleteAreaQuery, [userId, areaId]);

      if (!result.rowCount) {
        throw new ApiError(404, "Área não encontrada para esse usuário");
      }

      const redisClient = await getRedisClient();

      const key: string = `area:${areaId}`;

      redisClient.del(key);
    } catch (error) {
      throw error;
    }
  };

  AreaExists = async (userId: number, name: string): Promise<boolean> => {
    try {
      const result = await pool.query(areaExistsQuery, [userId, name]);

      return result.rowCount ? true : false;
    } catch (error) {
      throw error;
    }
  };

  getAllUserAreasById = async (userId: number): Promise<GetAllUserAreasOut> => {
    try {
      let result: GetAllUserAreasOut = { areas: [] };

      result.areas = (
        await pool.query(getAllUserAreasByIdQuery, [userId])
      ).rows;

      return result;
    } catch (error) {
      throw error;
    }
  };
}
