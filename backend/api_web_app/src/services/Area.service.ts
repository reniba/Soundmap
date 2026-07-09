import AreaRepository from "../repositories/Area.repository.js";
import { ApiError } from "../errors/ApiError.js";
import type { GetAllUserAreasOut} from "../schemas/out/getAllUserAreasOutSchema.js";
import type { CreateAreaIn } from "../schemas/in/createAreaInSchema.js";

export default class AreaService {
  areaRepository: AreaRepository;

  constructor() {
    this.areaRepository = new AreaRepository();
  }

  createArea = async(userId: number,areaData: CreateAreaIn): Promise<void> => {
    const areaExists: boolean = await this.areaRepository.AreaExists(userId, areaData.name);

    if (areaExists) {
      throw new ApiError(400, "Área já existente para esse usuário");
    }

    await this.areaRepository.createArea(userId, areaData);
  }

  deleteArea = async(userId: number, areaId: number): Promise<void> => {
    await this.areaRepository.deleteArea(userId, areaId);
  }

  getAllUserAreas = async(userId: number): Promise<GetAllUserAreasOut> => {
    return await this.areaRepository.getAllUserAreasById(userId);
  }
}
