import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class SendDataService {
  Future<void> sendDataToAPI(
    String sensorTempId,
    double lat,
    double lng,
    int areaId,
    double dB,
  ) async {
    try {
      final timestamp = DateTime.now().microsecondsSinceEpoch;

      final json = jsonEncode({
        'sensor_id_temp': sensorTempId,
        'latitude': lat,
        'longitude': lng,
        'area_id': areaId,
        'reading': {'ts': timestamp, 'dB': dB},
      });

      final String url = "http://192.168.100.18:4343/measure";
      final AuthService authService = AuthService();

      final token = await authService.getToken();

      await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json,
      );
    } catch (error) {
      throw Exception("Erro ao enviar dado para API: $error");
    }
  }
}
