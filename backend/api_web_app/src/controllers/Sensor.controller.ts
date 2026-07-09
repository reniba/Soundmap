import type { Request, Response } from "express";
import { ApiError } from "../errors/ApiError.js";
import SensorService from "../services/Sensor.service.js";
import { type GetSensorsOfUserOut, GetSensorsOfUserOutSchema } from "../schemas/out/getSensorsOfUserOutSchema.js";
import { type GetSensorsOfUserIn, GetSensorsOfUserInSchema } from "../schemas/in/getSensosrsOfUserInSchema.js";
import { type CreateSensorIn, CreateSensorInSchema } from "../schemas/in/createSensorInSchema.js";
import { type PutSensorInAreaIn, PutSensorInAreaInSchema } from "../schemas/in/putSensorInAreaInSchema.js";
import { type DeleteSensorIn, DeleteSensorInSchema } from "../schemas/in/deleteSensorInSchema.js";
import { type GetSensorLastStateIn, GetSensorLastStateInSchema } from "../schemas/in/getSensorLastStateInSchema.js";
import { type GetSensorLastStateOut, GetSensorLastStateOutSchema } from "../schemas/out/getSensorLastStateOutSchema.js";

export default class SensorController {
    sensorService: SensorService;

    constructor() {
        this.sensorService = new SensorService();
    }

    createSensor = async (req: Request, res: Response): Promise<void> => {
        const body: CreateSensorIn = CreateSensorInSchema.parse(req.body);
        
        if (!req.user) {
            throw new ApiError(404, "Usuário não encontrado");
        }

        const userId: number = req.user.userId;

        await this.sensorService.createSensor(userId, body);

        res.status(201).json({ message: "Sensor criado com sucesso" });
    }

    deleteSensor = async (req: Request, res: Response): Promise<void> => {
        const query: DeleteSensorIn = DeleteSensorInSchema.parse(req.query);

        if (!req.user) {
            throw new ApiError(404, "Usuário não encontrado");
        }

        const userId: number = req.user.userId;

        await this.sensorService.deleteSensor(userId, query.sensorId);

        res.status(200).json({ message: "Sensor deletado com sucesso" });
    }

    putSensorInArea = async (req: Request, res: Response): Promise<void> => {
        const body: PutSensorInAreaIn = PutSensorInAreaInSchema.parse(req.body);

        if (!req.user) {
            throw new ApiError(404, "Usuário não encontrado");
        }

        const userId: number = req.user.userId;

        await this.sensorService.putSensorInArea(userId, body);

        res.status(200).json({ message: "Operação realizada com sucesso" });
    }

    getSensorsOfUser = async (req: Request, res: Response): Promise<void> => {
        const query: GetSensorsOfUserIn = GetSensorsOfUserInSchema.parse(req.query);

        if (!req.user) {
            throw new ApiError(404, "Usuário não encontrado");
        }
        
        const userId = req.user.userId;

        const result: GetSensorsOfUserOut = await this.sensorService.getSensorsOfUser(userId, query);

        const parseResult = GetSensorsOfUserOutSchema.parse(result);

        res.status(200).json(parseResult);
    }

    getSensorLastState = async (req: Request, res: Response): Promise<void> => {
        const query: GetSensorLastStateIn = GetSensorLastStateInSchema.parse(req.query);

        if (!req.user) {
            throw new ApiError(404, "Usuário não encontrado");
        }
        
        const userId = req.user.userId;

        const result: GetSensorLastStateOut = await this.sensorService.getSensorLastState(userId, query.sensorId);

        const parseResult: GetSensorLastStateOut = GetSensorLastStateOutSchema.parse(result);

        res.status(200).json(parseResult);
    }
}