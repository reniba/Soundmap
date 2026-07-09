import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  final _storage = const FlutterSecureStorage();
  static const _tokenKey = 'jwt_token';
  static const _usernameKey = 'username';

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<void> saveUsername(String username) async {
    await _storage.write(key: _usernameKey, value: username);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  Future<String> getUsernameInitial() async {
    final String? username = await _storage.read(key: _usernameKey);

    return username != null ? username[0] : "A";
  }

  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
  }
}
