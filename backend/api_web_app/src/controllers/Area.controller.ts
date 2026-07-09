import AreaService from "../services/Area.service.js";
import { ApiError } from "../errors/ApiError.js";
import type { Response, Request } from "express";
import {
  type CreateAreaIn,
  CreateAreaInSchema,
} from "../schemas/in/createAreaInSchema.js";
import {
  type GetAllUserAreasOut,
  GetAllUserAreasOutSchema,
} from "../schemas/out/getAllUserAreasOutSchema.js";
import {
  type DeleteAreaIn,
  DeleteAreaInSchema,
} from "../schemas/in/deleteAreaInSchema.js";
export default class AreaController {
  areaService: AreaService;

  constructor() {
    this.areaService = new AreaService();
  }

  createArea = async (req: Request, res: Response) => {
    const body: CreateAreaIn = CreateAreaInSchema.parse(req.body);

    if (!req.user) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    const userId = req.user.userId;

    await this.areaService.createArea(userId, body);

    return res.status(200).json({ message: "Área criada com sucesso" });
  };

  deleteArea = async (req: Request, res: Response) => {
    const query: DeleteAreaIn = DeleteAreaInSchema.parse(req.query);

    if (!req.user) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    const userId = req.user.userId;

    await this.areaService.deleteArea(userId, query.areaId);

    return res.status(200).send("Área deletada com sucesso");
  };

  getAllUserAreas = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    const userId: number = req.user.userId;

    const result = await this.areaService.getAllUserAreas(userId);

    const safedResult: GetAllUserAreasOut =
      GetAllUserAreasOutSchema.parse(result);

    return res.status(200).json(safedResult);
  };
}
