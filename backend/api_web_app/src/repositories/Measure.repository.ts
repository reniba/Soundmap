import { pool } from "../database/db.js";
import type { MeasureItem } from "../schemas/out/getMeasuresFromSensorOutSchema.js";
import type { GetMeasuresFromSensorIn } from "../schemas/in/getMeasuresFromSensorInSchema.js";

const getAllMeasuresBySensorIdAndAreaIdQuery = `
  SELECT 
    m.db_avg as "dbAvg", 
    m.db_max as "dbMax", 
    m.latitude as "latitude",
    m.longitude as "longitude",
    m.window_end as "windowEnd", 
    m.window_start as "windowStart" 
  FROM measure m INNER JOIN origin o ON m.origin_id = o.id
  WHERE 
    o.area_id = $1 
    AND o.sensor_id = $2
    AND m.window_start >= $3
    AND m.window_end <= $4
  ORDER BY m.window_end
`;

const getAllMeasuresBySensorNameAndAreaIdQuery = `
  SELECT 
    m.db_avg as "dbAvg", 
    m.db_max as "dbMax", 
    m.latitude as "latitude",
    m.longitude as "longitude",
    m.window_end as "windowEnd", 
    m.window_start as "windowStart" 
  FROM measure m 
  INNER JOIN origin o ON m.origin_id = o.id
  INNER JOIN sensor s ON o.sensor_id = s.id
  WHERE 
    o.area_id = $1 
    AND s.name = $2
    AND m.window_start >= $3
    AND m.window_end <= $4
  ORDER BY m.window_end
`;

const getUserIdByAreaIdQuery = `
  SELECT 
    user_id as "userId"
  FROM area 
  WHERE id = $1;
`;

export default class MeasureRepository {
  getAllMeasuresBySensorIdAndAreaId = async(measurePageSettings: GetMeasuresFromSensorIn): Promise<MeasureItem[]> => {
    const { areaId, sensorId, windowStart, windowEnd } = measurePageSettings;
    try {
      const result = await pool.query(getAllMeasuresBySensorIdAndAreaIdQuery, [areaId, sensorId, windowStart, windowEnd]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  getAllMeasuresBySensorNameAndAreaId = async(measurePageSettings: GetMeasuresFromSensorIn): Promise<MeasureItem[]> => {
    const { areaId, sensorName, windowStart, windowEnd } = measurePageSettings;
    try {
      const result = await pool.query(getAllMeasuresBySensorNameAndAreaIdQuery, [areaId, sensorName, windowStart, windowEnd]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  getUserIdByAreaId = async(areaId: number): Promise<number> => {
    try {
      const result = await pool.query(getUserIdByAreaIdQuery, [areaId]);

      return result.rows[0]?.userId;
    } catch (error) {
      throw error;
    }
  }
}
