import type { Request, Response } from "express";
import { ApiError } from "../errors/ApiError.js";
import MeasureService from "../services/Measure.service.js";
import { type GetMeasuresFromSensorIn, GetMeasuresFromSensorInSchema } from "../schemas/in/getMeasuresFromSensorInSchema.js";
import { type GetMeasuresFromSensorOut, GetMeasuresFromSensorOutSchema } from "../schemas/out/getMeasuresFromSensorOutSchema.js";

export default class MeasureController {
  measureService: MeasureService;

  constructor() {
    this.measureService = new MeasureService();
  }

  getMeasuresFromSensor = async (req: Request, res: Response) => {
    try {
      const query: GetMeasuresFromSensorIn = GetMeasuresFromSensorInSchema.parse(req.query);

      if (!req.user) {
        throw new ApiError(404, "Usuário não encontrado");
      }

      const userId = req.user.userId;

      const result: GetMeasuresFromSensorOut = await this.measureService.getAllSensorMeasureForAnArea(userId, query);

      const safedResult: GetMeasuresFromSensorOut = GetMeasuresFromSensorOutSchema.parse(result);

      return res.status(200).json(safedResult);
    } catch (error) {
      throw error;
    }
  };
}
