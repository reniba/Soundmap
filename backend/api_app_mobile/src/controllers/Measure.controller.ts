import type { Request, Response } from "express";
import MeasureService from "../services/Measure.service.js";

export default class MeasureController {
  measureService: MeasureService;

  constructor() {
    this.measureService = new MeasureService();
  }

  postNewMeasure = async (req: Request, res: Response) => {
    const { sensor_id_temp, latitude, longitude, area_id, reading } = req.body;
    const { ts, dB } = reading;

    if (!req.user) {
      return res.status(401).json({
        message: "Sem autorização",
      });
    }

    const userId = req.user.userId;

    await this.measureService.sendToKafka(
      sensor_id_temp,
      latitude,
      longitude,
      userId,
      area_id,
      ts,
      dB,
    );
  };
}
