import type { Request, Response } from "express";
import MapService from "../services/Map.service.js";
import {type GetMapIn, GetMapInSchema} from "../schemas/in/getMapInSchema.js";
import {type GetMapOut, GetMapOutSchema} from "../schemas/out/getMapOutSchema.js";
import { ApiError } from "../errors/ApiError.js";


export default class MapController {
    mapService: MapService;

    constructor() {
        this.mapService = new MapService();
    }

    getMap = async(req: Request, res: Response): Promise<void> => {
      const userId: number | undefined = req.user?.userId;
      
      if(!userId) {
        throw new ApiError(400, "Usuário não encontrado");
      }

      const query: GetMapIn = GetMapInSchema.parse(req.query);

      const areaId: number = query.areaId;

      const mapResponse: GetMapOut = await this.mapService.getMap(userId, areaId);

      const safedMapResponse = GetMapOutSchema.parse(mapResponse);

      res.status(200).json(safedMapResponse);
    };
}
