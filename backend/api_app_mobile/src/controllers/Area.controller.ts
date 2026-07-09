import AreaService from "../services/Area.service.js";
import type { Request, Response } from "express";

export default class AreaController {
  areaService: AreaService;

  constructor() {
    this.areaService = new AreaService();
  }

  getAllAreas = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Sem autorização",
        });
      }

      const user_id = req.user.userId;

      if (!user_id) {
        return res.status(401).json({ error: "ID do usuário não informado" });
      }

      const areas = await this.areaService.getAllAreasByUserId(user_id);

      return res.status(200).json(areas);
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
}
