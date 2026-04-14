import 'dart:convert';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:http/http.dart' as http;
import '../models/category.dart';
import '../config/app_config.dart';
import 'auth_service.dart';

class CategoryService {
  static String get baseUrl => '${AppConfig.apiUrl}/project/topics/';
  final _authService = AuthService();

  Future<List<Category>> getCategories() async {
    try {
      final response = await http.get(
        Uri.parse(baseUrl),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      debugPrint('Categories response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Category.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching categories: $e');
      return [];
    }
  }
}
