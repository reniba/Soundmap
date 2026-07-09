import MapRepository from "../repositories/Map.repository.js";
import type { GetMapOut } from "../schemas/out/getMapOutSchema.js";
export default class MapService {
    mapRepository: MapRepository;

    constructor(){
        this.mapRepository = new MapRepository();
    }

    getMap = async(userId: number, areaId: number): Promise<GetMapOut> => {
        let mapResponse: GetMapOut = { areaId: areaId, sensors: [], appSensors: [] };

        const sensorIds: number[] = await this.mapRepository.getIdSensorsOfMap(areaId);

        mapResponse.sensors = await this.mapRepository.getSensorsOfMap(sensorIds);
        mapResponse.appSensors = await this.mapRepository.getAppSensorsOfMap(userId, areaId);

        return mapResponse;
    }
}