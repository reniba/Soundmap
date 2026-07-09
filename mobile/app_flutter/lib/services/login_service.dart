import 'package:http/http.dart' as http;
import 'dart:convert';
import 'auth_service.dart';

class LoginService {
  final String url = "http://192.168.100.18:4343/user/";
  final AuthService _authService = AuthService();

  Future<bool> login(String emailOrUsername, String password) async {
    try {
      final payload = jsonEncode({
        'emailOrUsername': emailOrUsername.trim(),
        'password': password.trim(),
      });

      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: payload,
      );

      print("Resposta: ${response.body}");

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final String? token = data["token"];
        final String? username = data["username"];

        if (token != null && username != null) {
          await _authService.saveToken(token);
          await _authService.saveUsername(username);
          return true;
        }
      }

      return false;
    } catch (error) {
      throw Exception("Erro ao verificar autenticação");
    }
  }
}
