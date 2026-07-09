import 'dart:convert';

import 'package:http/http.dart' as http;
import '../widgets/area_button.dart';
import 'auth_service.dart';

Future<List<Area>> fetchAreas() async {
  final url = "http://192.168.100.18:4343/area";
  final AuthService authService = AuthService();

  final token = await authService.getToken();

  final response = await http.get(
    Uri.parse(url),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
  );

  if (response.statusCode == 200) {
    print("resposta: ${response.body}");
    final List<dynamic> decodedJson = jsonDecode(response.body);
    return decodedJson.map((item) => Area.fromJson(item)).toList();
  } else {
    throw Exception("Erro ao consumir API");
  }
}
