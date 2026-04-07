import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../config/secrets.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  static String get baseUrl => '${AppConfig.apiUrl}/users/authentication';
  static const String keyStorageKey = 'auth_key';

  Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final key = data['key'];

        if (key != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(keyStorageKey, key);
          return true;
        }
      }
      return false;
    } catch (e) {
      debugPrint('Login error: $e');
      return false;
    }
  }

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final key = prefs.getString(keyStorageKey);
    return key != null && key.isNotEmpty;
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(keyStorageKey);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(keyStorageKey);
  }

  /// Returns null on success, or a human-readable error string on failure.
  Future<String?> register(String email, String password1, String password2) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/users/registration/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password1': password1,
          'password2': password2,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 201) return null;

      // Parse server error messages
      final body = jsonDecode(response.body);
      if (body is Map) {
        final messages = <String>[];
        body.forEach((key, value) {
          if (value is List) {
            messages.addAll(value.map((e) => e.toString()));
          } else {
            messages.add(value.toString());
          }
        });
        if (messages.isNotEmpty) return messages.join('\n');
      }
      return 'Error ${response.statusCode}';
    } catch (e) {
      return 'Error de conexión';
    }
  }

  Future<void> deleteAccount({bool keepObservations = true}) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');
    final response = await http.delete(
      Uri.parse('${AppConfig.apiUrl}/users/delete/'),
      headers: {
        'Authorization': 'Token $token',
        'Content-Type': 'application/json',
      },
      body: '{"keep_observations": $keepObservations}',
    ).timeout(const Duration(seconds: 15));
    if (response.statusCode != 204 && response.statusCode != 200) {
      throw Exception('Failed to delete account: ${response.statusCode}');
    }
    await logout();
  }

  Future<Map<String, dynamic>?> getUserInfo() async {
    try {
      final token = await getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/user/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $token',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(utf8.decode(response.bodyBytes));
      }
      return null;
    } catch (e) {
      debugPrint('Get user info error: $e');
      return null;
    }
  }

  Future<int?> getUserId() async {
    final userInfo = await getUserInfo();
    return userInfo?['pk'] as int?;
  }

  Future<Map<String, dynamic>?> getUserProfile() async {
    try {
      final token = await getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/users/profile/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $token',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(utf8.decode(response.bodyBytes));
      }
      return null;
    } catch (e) {
      debugPrint('Get user profile error: $e');
      return null;
    }
  }

  /// Signs in with Google and exchanges the auth code with the backend.
  /// Returns null on success, or an error string on failure.
  Future<String?> loginWithGoogle() async {
    try {
      final googleSignIn = GoogleSignIn(
        serverClientId: Secrets.googleWebClientId,
      );

      final account = await googleSignIn.signIn();
      if (account == null) return 'Inicio de sesión cancelado';

      final auth = await account.authentication;
      final accessToken = auth.accessToken;
      final idToken = auth.idToken;
      debugPrint('Google accessToken: $accessToken');
      debugPrint('Google idToken: $idToken');

      if (accessToken == null) {
        return 'No se pudo obtener el token de autenticación';
      }

      final body = jsonEncode({'access_token': accessToken});
      debugPrint('Google auth body: $body');

      final response = await http.post(
        Uri.parse(AppConfig.googleAuthUrl),
        headers: {'Content-Type': 'application/json'},
        body: body,
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final key = data['key'];
        if (key != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(keyStorageKey, key);
          return null; // success
        }
      }

      debugPrint('Google login error: ${response.statusCode} ${response.body}');
      return 'Error al iniciar sesión con Google';
    } catch (e, stack) {
      debugPrint('Google login exception: $e');
      debugPrint('Google login stacktrace: $stack');
      return 'Error de conexión: $e';
    }
  }

  Future<bool> updateProfile({
    required String firstName,
    required String lastName,
    String biography = '',
    bool visibility = true,
    String? countryCode,
    File? cover,
  }) async {
    try {
      final token = await getToken();
      if (token == null) {
        debugPrint('No auth token available');
        return false;
      }

      var request = http.MultipartRequest(
        'PATCH',
        Uri.parse('${AppConfig.apiUrl}/users/profile/'),
      );

      request.headers['Authorization'] = 'Token $token';

      // Campos de texto
      request.fields['first_name'] = firstName;
      request.fields['last_name'] = lastName;
      if (biography.isNotEmpty) {
        request.fields['biography'] = biography;
      }
      request.fields['visibility'] = visibility.toString();
      if (countryCode != null && countryCode.isNotEmpty) {
        request.fields['country'] = countryCode;
      }

      // Imagen de portada
      if (cover != null) {
        request.files.add(
          await http.MultipartFile.fromPath('cover', cover.path),
        );
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating profile: $e');
      return false;
    }
  }
}
