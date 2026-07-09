import SensorRepository from "../repositories/Sensor.repository.js";  
import type { GetSensorsOfUserIn } from "../schemas/in/getSensosrsOfUserInSchema.js";
import type { GetSensorsOfUserOut } from "../schemas/out/getSensorsOfUserOutSchema.js";
import type { CreateSensorIn } from "../schemas/in/createSensorInSchema.js";
import type { PutSensorInAreaIn } from "../schemas/in/putSensorInAreaInSchema.js";
import { type GetSensorLastStateOut } from "../schemas/out/getSensorLastStateOutSchema.js";
import { ApiError } from "../errors/ApiError.js";

export default class SensorService {
    sensorRepository: SensorRepository;

    constructor() {
        this.sensorRepository = new SensorRepository();    
    }

    createSensor = async (userId: number, sensorSettings: CreateSensorIn): Promise<void> => {
        await this.sensorRepository.createSensor(userId, sensorSettings);
    }

    deleteSensor = async (userId: number, sensorId: number): Promise<void> => {
        await this.sensorRepository.deleteSensor(userId, sensorId);
    }

    putSensorInArea = async (userId: number, operationSettings: PutSensorInAreaIn): Promise<void> => {
        await this.sensorRepository.putSensorInArea(userId, operationSettings);
    }

    getSensorsOfUser = async (userId: number, pageSensorSeetings: GetSensorsOfUserIn): Promise<GetSensorsOfUserOut> => {
        return await this.sensorRepository.getSensorsOfUser(userId, pageSensorSeetings);
    }

    getSensorLastState = async (userId: number, sensorId: number): Promise<GetSensorLastStateOut> => {
        let result: GetSensorLastStateOut | null = await this.sensorRepository.getSensorLastStateFromRedis(userId, sensorId);

        if (!result) {
            result = await this.sensorRepository.getSensorLastStateFromDb(userId, sensorId);
        }

        if (!result) {
            throw new ApiError(404, "Último estado do sensor não encontrado");
        }

        return result;
    }
}