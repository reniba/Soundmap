import { pool } from "../database/db.js";
import { getRedisClient } from "../database/redis.js";
import type { RedisClientType } from "redis";
import type { AppMapSensor, MapSensor } from "../schemas/out/getMapOutSchema.js";

const getIdSensorsOfMapQuery = `
    SELECT
        sensor_id as "id"
    FROM origin
    WHERE 
        area_id = $1
        AND active = true
`;

export default class MapRepository{

    getIdSensorsOfMap = async(areaId: number): Promise<number[]> => {
        let sensorList: number[] = [];

        try {
            const redisClient: RedisClientType = await getRedisClient();
            
            if (!redisClient) {
                return [];
            }
            
            const key: string = `area:${areaId}`;
            const sensorJsonString = await redisClient.get(key);
            sensorList = JSON.parse(sensorJsonString || '[]');
            
            if (sensorList.length === 0) {
                const rows = (await pool.query(getIdSensorsOfMapQuery, [areaId])).rows;

                if (!rows || rows.length === 0) {
                    return sensorList;
                }

                sensorList = rows.map((sensor: any) => sensor.id);

                await redisClient.set(key, JSON.stringify(sensorList));
            }
        }
        catch (error) {
            throw error;
        }

        return sensorList;
    }

    getSensorsOfMap = async(sensorIds: number[]): Promise<MapSensor[]> => {
        let sensors: MapSensor[] = []

        try{
            const redisClient: RedisClientType = await getRedisClient();

            if(!sensorIds || sensorIds.length === 0 ) {
                return sensors;
            }

            for (const id of sensorIds) {
                const key: string = `sensor:${id}`;

                const sensorLastMeasureJsonString: string | null = await redisClient.get(key);

                if (sensorLastMeasureJsonString) {
                    const sensorLastMeasure = JSON.parse(sensorLastMeasureJsonString);

                    const windowEnd: Date = new Date(sensorLastMeasure.windowEnd);

                    const now = new Date();

                    const diffMS = now.getTime() -  windowEnd.getTime();

                    const active: boolean = diffMS <= (1 * 60 * 1000) // 1 minuto

                    sensors.push({
                        id: id,
                        name: sensorLastMeasure.name,
                        active: active,
                        dbAverage: sensorLastMeasure.dbAverage,
                        latitude: sensorLastMeasure.latitude,
                        longitude: sensorLastMeasure.longitude
                    })
                }
            }
        }
        catch (error) {
            throw error;
        }

        return sensors;
    }

    getAppSensorsOfMap = async(userId: number, areaId: number): Promise<AppMapSensor[]> => {
        const appSensors: AppMapSensor[] = [];

        try {
            const redisClient: RedisClientType = await getRedisClient();

            const keys: string[] = await redisClient.keys(`app:${userId}:${areaId}:*`);

            for (const key of keys) {
                const json: string | null = await redisClient.get(key);

                if (!json) continue;

                const data = JSON.parse(json);

                const sensorId: string = key.split(":")[3] ?? "";

                const windowEnd: Date = new Date(data.windowEnd);
                const diffMS = new Date().getTime() - windowEnd.getTime();
                const active: boolean = diffMS <= (1 * 60 * 1000); // 1 minuto

                appSensors.push({
                    sensorId,
                    name: data.name,
                    active,
                    dbAverage: data.dbAverage,
                    latitude: data.latitude,
                    longitude: data.longitude,
                });
            }
        } catch (error) {
            throw error;
        }

        return appSensors;
    }

}