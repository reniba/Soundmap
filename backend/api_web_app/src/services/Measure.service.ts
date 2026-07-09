import MeasureRepository from "../repositories/Measure.repository.js";
import { ApiError } from "../errors/ApiError.js";
import type { GetMeasuresFromSensorOut } from "../schemas/out/getMeasuresFromSensorOutSchema.js";
import type { GetMeasuresFromSensorIn } from "../schemas/in/getMeasuresFromSensorInSchema.js";

export default class MeasureService {
  measureRepository: MeasureRepository;

  constructor() {
    this.measureRepository = new MeasureRepository();
  }

  getAllSensorMeasureForAnArea = async(userId: number, measuresPageSettings: GetMeasuresFromSensorIn): Promise<GetMeasuresFromSensorOut> => {
    const { areaId } = measuresPageSettings;
    try {
      const areasUserId = await this.measureRepository.getUserIdByAreaId(areaId);

      if(areasUserId !== userId) {
        throw new ApiError(400, "Usuário não autorizado a acessar medidas dessa área");
      }

      let result: GetMeasuresFromSensorOut = { measures: []};

      const {sensorId, sensorName} = measuresPageSettings;

      if(!sensorId && !sensorName) {
        throw new ApiError(400, "Nenhum parâmetro de indentificação do sensor informado");
      }

      if (sensorId) {
        result.measures = await this.measureRepository.getAllMeasuresBySensorIdAndAreaId(measuresPageSettings);
      }

      if (sensorName) {
        result.measures = await this.measureRepository.getAllMeasuresBySensorNameAndAreaId(measuresPageSettings);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }
}
