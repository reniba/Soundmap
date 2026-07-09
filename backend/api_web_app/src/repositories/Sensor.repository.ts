import { pool } from "../database/db.js";
import { getRedisClient } from "../database/redis.js";
import type { RedisClientType } from "redis";
import { ApiError } from "../errors/ApiError.js";
import type { GetSensorsOfUserIn } from "../schemas/in/getSensosrsOfUserInSchema.js";
import type { GetSensorsOfUserOut } from "../schemas/out/getSensorsOfUserOutSchema.js";
import type { CreateSensorIn } from "../schemas/in/createSensorInSchema.js";
import type { PutSensorInAreaIn } from "../schemas/in/putSensorInAreaInSchema.js";
import type { GetSensorLastStateOut } from "../schemas/out/getSensorLastStateOutSchema.js";

//_______getSensorLastState_________
const getSensorLastStateFromDbQuery = `
  SELECT
    s.name as "name",
    m.db_avg as "dbAverage",
    m.latitude as "latitude",
    m.longitude as "longitude",
    m.window_end as "windowEnd"
  FROM measure m
    INNER JOIN origin o ON m.origin_id = o.id
    INNER JOIN sensor s ON o.sensor_id = s.id
    INNER JOIN area a ON o.area_id = a.id
  WHERE
    s.id = $1
    AND a.user_id = $2
    AND o.active = true
  ORDER BY m.window_end DESC
  LIMIT 1
`;

//_______createSensor_________
const createSensorQuery = `
  INSERT INTO sensor (name)
  VALUES ($1)
  RETURNING id
`;

const verifyIfAreaExistsQuery = `
  SELECT 1
  FROM area
  WHERE id = $1 AND user_id = $2
`;

const createOriginQuery = `
  INSERT INTO origin (sensor_id, area_id, active)
  VALUES ($1, $2, true)
`;

//_______deleteSensor_________
const deleteSensorQuery = `
  WITH area_info AS (
    SELECT o.area_id
    FROM sensor s
    JOIN origin o ON s.id = o.sensor_id
    JOIN area a ON o.area_id = a.id
    WHERE s.id = $1 AND a.user_id = $2
  )
  DELETE FROM sensor
  WHERE id = $1 AND EXISTS (SELECT 1 FROM area_info)
  RETURNING (SELECT area_id FROM area_info) as "areaId"
`;

//______putSensorInArea_________
const verifyIfSensorExistsQuery = `
  SELECT 1
  FROM sensor s
  INNER JOIN origin o ON s.id = o.sensor_id
  INNER JOIN area a ON o.area_id = a.id
  WHERE 
    a.user_id = $1
    AND s.id = $2
`;

const verifySensorInAreaQuery = `
  SELECT 1
  FROM origin
  WHERE 
    sensor_id = $1 
    AND area_id = $2
`;

const createSensorInAreaQuery = `
  INSERT INTO origin 
  (sensor_id, area_id, active)
  VALUES ($1, $2, $3)
`;

const inactiveSensorInOldAreas = `
  UPDATE origin
  SET active = false
  WHERE 
    sensor_id = $1
    AND active = true
  RETURNING area_id as "oldAreaId"
`;

const updateSensorInAreaQuery = `
  UPDATE origin
  SET active = $3
  WHERE sensor_id = $1 AND area_id = $2
`;

export default class SensorRepository {
  createSensor = async (
    userId: number,
    sensorSettings: CreateSensorIn,
  ): Promise<void> => {
    const psClient = await pool.connect();

    const { name, areaId } = sensorSettings;

    try {
      await psClient.query("BEGIN");

      const verifyIfAreaExistsResult = (await psClient.query(verifyIfAreaExistsQuery, [areaId, userId])).rowCount;
      
      if (!verifyIfAreaExistsResult) {
        throw new ApiError(404, "Área não encontrada");
      }

      const createSensorResult = await psClient.query(createSensorQuery, [name]);

      const sensorId = createSensorResult.rows[0].id;

      await psClient.query(createOriginQuery, [sensorId, areaId]);

      await psClient.query("COMMIT");

      const redisClient: RedisClientType = await getRedisClient();

      await redisClient.del(`area:${areaId}`);
    } catch (error: any) {
      await psClient.query("ROLLBACK");

      if (error.code === "23505") {
        throw new ApiError(409, "Já existe um sensor com esse nome");
      }

      throw error;
    } finally {
      psClient.release();
    }
  };

  deleteSensor = async (userId: number, sensorId: number): Promise<void> => {
    try {
      const result = await pool.query(deleteSensorQuery, [sensorId, userId]);

      if (!result.rowCount) {
        throw new ApiError(404, "Sensor não encontrado");
      }

      const areaId: number = result.rows[0].areaId;

      const redisClient: RedisClientType = await getRedisClient();

      await redisClient.del(`area:${areaId}`);

      await redisClient.del(`sensor:${sensorId}`);
    } catch (error) {
      console.log("Erro do delete: " + error);
      throw error;
    }
  };

  putSensorInArea = async (
    userId: number,
    operationSettings: PutSensorInAreaIn,
  ): Promise<void> => {
    const psClient = await pool.connect();

    const { sensorId, areaId, activeInArea } = operationSettings;

    try {
      await psClient.query("BEGIN");

      const verifyIfSensorExistsResult = (
        await psClient.query(verifyIfSensorExistsQuery, [userId, sensorId])
      ).rowCount;
      if (!verifyIfSensorExistsResult) {
        throw new ApiError(404, "Sensor não encontrado");
      }

      const verifyIfAreaExistsResult = (
        await psClient.query(verifyIfAreaExistsQuery, [areaId, userId])
      ).rowCount;
      if (!verifyIfAreaExistsResult) {
        throw new ApiError(404, "Área não encontrada");
      }

      const verifySensorInAreaResult = (
        await psClient.query(verifySensorInAreaQuery, [sensorId, areaId])
      ).rowCount;

      // Se sensor já não estava associado à área, exclui no redis para possibilitar atualização da chave da área na próxima requisição de mapa
      if (!verifySensorInAreaResult) {
        await psClient.query(createSensorInAreaQuery, [sensorId, areaId, activeInArea]);
      }

      // Sensor só pode estar ativo em uma área (isso será usado ativo em uma área)
      let oldActivateAreasId: number[] = [];
      if (activeInArea) {
        const result = await psClient.query(inactiveSensorInOldAreas, [sensorId]);
        oldActivateAreasId = result.rows.map((row) => row.oldAreaId);
      }

      await psClient.query(updateSensorInAreaQuery, [
        sensorId,
        areaId,
        activeInArea,
      ]);

      await psClient.query("COMMIT");

      if (activeInArea) {

        const redisClient: RedisClientType = await getRedisClient();

        for(const oldAreaId of oldActivateAreasId) {
          await redisClient.del(`area:${oldAreaId}`);
        }
      }

      const redisClient: RedisClientType = await getRedisClient();

      await redisClient.del(`area:${areaId}`);
      
    } catch (error) {
      await psClient.query("ROLLBACK");

      throw error;
    } finally {
      psClient.release();
    }
  };

  getSensorsOfUser = async (userId: number, pageSensorSeetings: GetSensorsOfUserIn): Promise<GetSensorsOfUserOut> => {
    let result: GetSensorsOfUserOut = { sensors: [] };

    let params: string[] = [`a.user_id = $1`];
    let values: any = [userId];

    const { sensorId, sensorName, areaId, areaName, activeInArea } =
      pageSensorSeetings;

    if (sensorId !== undefined) {
      params.push(`s.id = $${values.length + 1}`);
      values.push(sensorId);
    }

    if (sensorName !== undefined) {
      params.push(`s.name ILIKE $${values.length + 1}`);
      values.push(`%${sensorName}%`);
    }
    
    if (areaId !== undefined) {
      params.push(`o.area_id = $${values.length + 1}`);
      values.push(areaId);
    }
    
    if (areaName !== undefined) {
      params.push(`a.name ILIKE $${values.length + 1}`);
      values.push(`%${areaName}%`);
    }
    
    if (activeInArea !== undefined) {
      params.push(`o.active = $${values.length + 1}`);
      values.push(activeInArea);
    }

    const getSensorsOfUserQuery = `
      SELECT 
        s.id, 
        s.name,  
        o.area_id as "areaId",
        a.name as "areaName",
        o.active as "activeInArea",
        o.id as "originId"
      FROM sensor s
        JOIN origin o ON s.id = o.sensor_id
        JOIN area a ON o.area_id = a.id
      WHERE ${params.join(" AND ")}
    `;

    result.sensors = (await pool.query(getSensorsOfUserQuery, values)).rows;

    return result;
  };

  getSensorLastStateFromRedis = async (userId: number, sensorId: number): Promise<GetSensorLastStateOut | null> => {
    try {
      const redisClient: RedisClientType = await getRedisClient();
      const raw = await redisClient.get(`sensor:${sensorId}`);

      if (!raw) { 
        return null;
      }

      const data = JSON.parse(raw);

      const diffMS = new Date().getTime() - new Date(data.windowEnd).getTime();
      const active: boolean = diffMS <= (1 * 60 * 1000); // 1 minuto

      return { name: data.name, active, dbAverage: data.dbAverage, latitude: data.latitude, longitude: data.longitude };
    } catch (error) {
      throw error;
    }
  }

  getSensorLastStateFromDb = async (userId: number, sensorId: number): Promise<GetSensorLastStateOut | null> => {
    try {
      const result = await pool.query(getSensorLastStateFromDbQuery, [sensorId, userId]);

      if (!result.rowCount) {
        return null;
      }

      const row = result.rows[0];
      const diffMS = new Date().getTime() - new Date(row.windowEnd).getTime();
      const active: boolean = diffMS <= (1 * 60 * 1000); // 1 minuto

      return { name: row.name, active, dbAverage: row.dbAverage, latitude: row.latitude, longitude: row.longitude };
    } catch (error) {
      throw error;
    }
  }
}
