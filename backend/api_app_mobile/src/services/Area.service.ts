import AreaRepository from "../repositories/Area.repository.js";

export default class AreaService {
  areaRepository: AreaRepository;

  constructor() {
    this.areaRepository = new AreaRepository();
  }

  getAllAreasByUserId = async (user_id: number) => {
    try {
      const areas = await this.areaRepository.getAllAreasByUserId(user_id);

      return areas;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
}
