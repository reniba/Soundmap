import { sendMessage } from "../kafka/producer.js";

export default class MeasureService {
  async sendToKafka(
    sensorTempId: number,
    latitude: number,
    longitude: number,
    userId: number,
    areaId: number,
    timestamp: String,
    dB: number,
  ) {
    const message = {
      sensorId: sensorTempId,
      latitude: latitude,
      longitude: longitude,
      userId: userId,
      areaId: areaId,
      timestamp: timestamp,
      measure: dB,
    };

    try {
      await sendMessage("appData", message);
    } catch (error) {
      throw error;
    }
  }
}
