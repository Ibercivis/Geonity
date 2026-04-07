import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/project.dart';
import '../models/project_country.dart';
import '../config/app_config.dart';
import 'auth_service.dart';
import 'locale_service.dart';

class ProjectService {
  static String get baseUrl => '${AppConfig.apiUrl}/project/';
  final _authService = AuthService();

  Future<List<Project>> getProjects() async {
    try {
      final key = await _authService.getToken();

      final response = await http.get(
        Uri.parse(baseUrl),
        headers: {
          'Content-Type': 'application/json',
          if (key != null) 'Authorization': 'Token $key',
        },
      ).timeout(const Duration(seconds: 15));

      debugPrint('Projects response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final List<dynamic> data = decoded is List ? decoded : (decoded['results'] ?? []);
        return data.map((json) => Project.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching projects: $e');
      return [];
    }
  }

  Future<List<Project>> getMyProjects() async {
    try {
      final key = await _authService.getToken();

      if (key == null) {
        debugPrint('No auth token available for my_projects');
        return [];
      }

      final response = await http.get(
        Uri.parse('${baseUrl}my_projects/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $key',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final List<dynamic> data = decoded is List ? decoded : (decoded['results'] ?? []);
        return data.map((json) => Project.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching my projects: $e');
      return [];
    }
  }

  Future<bool> toggleLike(int projectId) async {
    try {
      final key = await _authService.getToken();
      
      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/projects/$projectId/toggle-like/'),
        headers: {
          'Content-Type': 'application/json',
          if (key != null) 'Authorization': 'Token $key',
        },
        body: jsonEncode({}),
      ).timeout(const Duration(seconds: 15));

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error toggling like: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>?> getProjectDetail(int projectId) async {
    try {
      final key = await _authService.getToken();
      
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/project/$projectId/'),
        headers: {
          'Content-Type': 'application/json',
          if (key != null) 'Authorization': 'Token $key',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching project detail: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> getFieldForm(int fieldFormId, {bool raw = false}) async {
    try {
      final key = await _authService.getToken();
      final lang = LocaleService.activeLocale?.languageCode ?? 'es';
      final uri = Uri.parse('${AppConfig.apiUrl}/field_forms/$fieldFormId/')
          .replace(queryParameters: raw ? {'raw': 'true'} : null);

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (key != null) 'Authorization': 'Token $key',
          if (!raw) 'Accept-Language': lang,
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching field form: $e');
      return null;
    }
  }

  Future<List<Project>> getProjectsByOrganization(int organizationId) async {
    try {
      final key = await _authService.getToken();
      
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/organization/$organizationId/projects/'),
        headers: {
          'Content-Type': 'application/json',
          if (key != null) 'Authorization': 'Token $key',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Project.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching organization projects: $e');
      return [];
    }
  }

  Future<bool> validatePassword(int projectId, String password) async {
    try {
      final key = await _authService.getToken();
      
      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/projects/$projectId/validate-password/'),
        headers: {
          'Content-Type': 'application/json',
          if (key != null) 'Authorization': 'Token $key',
        },
        body: jsonEncode({'password': password}),
      ).timeout(const Duration(seconds: 15));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error validating password: $e');
      return false;
    }
  }

  Future<bool> deleteProject(int projectId) async {
    try {
      final key = await _authService.getToken();
      
      if (key == null) {
        debugPrint('No auth token available');
        return false;
      }

      final response = await http.delete(
        Uri.parse('${AppConfig.apiUrl}/project/$projectId/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $key',
        },
      ).timeout(const Duration(seconds: 15));

      return response.statusCode == 204 || response.statusCode == 200;
    } catch (e) {
      debugPrint('Error deleting project: $e');
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> getTopics() async {
    try {
      final key = await _authService.getToken();
      
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/project/topics/'),
        headers: {
          'Content-Type': 'application/json',
          if (key != null) 'Authorization': 'Token $key',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching topics: $e');
      return [];
    }
  }

  Future<List<ProjectCountry>> getCountries() async {
    try {
      final key = await _authService.getToken();

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/project/countries/'),
        headers: {
          'Content-Type': 'application/json',
          if (key != null) 'Authorization': 'Token $key',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((j) => ProjectCountry.fromJson(j as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching countries: $e');
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getQuestionTypes() async {
    try {
      final key = await _authService.getToken();
      
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/question_types/'),
        headers: {
          'Content-Type': 'application/json',
          if (key != null) 'Authorization': 'Token $key',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data);
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching question types: $e');
      return [];
    }
  }

  Future<int?> createProject({
    required String name,
    required String description,
    File? cover,
    List<int>? topics,
    List<int>? organizationIds,
    bool isPrivate = false,
    String? password,
    bool isDatabasePrivate = false,
    bool fuzzy = false,
    bool isGlobal = true,
    List<String>? countries,
    Map<String, dynamic>? fieldForm,
    String? postObservationMessage,
  }) async {
    try {
      final key = await _authService.getToken();
      
      if (key == null) {
        debugPrint('No auth token available');
        return null;
      }

      final request = http.MultipartRequest(
        'POST',
        Uri.parse(baseUrl),
      );

      request.headers['Authorization'] = 'Token $key';
      
      request.fields['name'] = name;
      request.fields['description'] = description;
      request.fields['is_private'] = isPrivate.toString();
      request.fields['private_data'] = isDatabasePrivate.toString();
      request.fields['fuzzy'] = fuzzy.toString();
      if (fuzzy) request.fields['fuzzy_resolution'] = '10';
      request.fields['is_global'] = isGlobal.toString();
      if (!isGlobal && countries != null && countries.isNotEmpty) {
        request.fields['countries'] = jsonEncode(countries);
      }

      debugPrint('[createProject] fields: ${request.fields}');

      if (isPrivate && password != null && password.isNotEmpty) {
        request.fields['raw_password'] = password;
      }
      
      if (organizationIds != null && organizationIds.isNotEmpty) {
        request.fields['organizations_write'] = jsonEncode(organizationIds);
      }
      
      if (topics != null && topics.isNotEmpty) {
        request.fields['topic'] = jsonEncode(topics);
      }

      if (fieldForm != null) {
        request.fields['field_form'] = jsonEncode(fieldForm);
      }

      if (postObservationMessage != null) {
        request.fields['post_observation_message'] = postObservationMessage;
      }

      if (cover != null) {
        request.files.add(
          await http.MultipartFile.fromPath('cover', cover.path),
        );
      }

      final response = await request.send();
      final responseBody = await response.stream.bytesToString();

      debugPrint('Create project response: ${response.statusCode}');
      if (response.statusCode != 201 && response.statusCode != 200) {
        debugPrint('[createProject] ERROR body: $responseBody');
      }

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(responseBody);
        return data['id'] as int?;
      }
      return null;
    } catch (e) {
      debugPrint('Error creating project: $e');
      return null;
    }
  }

  Future<bool> updateProject({
    required int projectId,
    required String name,
    required String description,
    File? cover,
    List<int>? topics,
    List<int>? organizationIds,
    bool? isPrivate,
    String? password,
    bool? isDatabasePrivate,
    bool? fuzzy,
    bool? isGlobal,
    List<String>? countries,
    Map<String, dynamic>? fieldForm,
    String? postObservationMessage,
  }) async {
    try {
      final key = await _authService.getToken();
      
      if (key == null) {
        debugPrint('No auth token available');
        return false;
      }

      final request = http.MultipartRequest(
        'PATCH',
        Uri.parse('${AppConfig.apiUrl}/project/$projectId/'),
      );

      request.headers['Authorization'] = 'Token $key';
      
      request.fields['name'] = name;
      request.fields['description'] = description;
      
      if (isPrivate != null) {
        request.fields['is_private'] = isPrivate.toString();
        if (isPrivate && password != null && password.isNotEmpty) {
          request.fields['raw_password'] = password;
        }
      }

      if (isDatabasePrivate != null) {
        request.fields['private_data'] = isDatabasePrivate.toString();
      }

      if (fuzzy != null) {
        request.fields['fuzzy'] = fuzzy.toString();
        if (fuzzy) request.fields['fuzzy_resolution'] = '10';
      }

      if (isGlobal != null) {
        request.fields['is_global'] = isGlobal.toString();
        if (!isGlobal && countries != null && countries.isNotEmpty) {
          request.fields['countries'] = jsonEncode(countries);
        }
      }

      if (organizationIds != null) {
        request.fields['organizations_write'] = jsonEncode(organizationIds);
      }
      
      if (topics != null) {
        request.fields['topic'] = jsonEncode(topics);
      }

      if (fieldForm != null) {
        request.fields['field_form'] = jsonEncode(fieldForm);
      }

      if (postObservationMessage != null) {
        request.fields['post_observation_message'] = postObservationMessage;
      }

      if (cover != null) {
        request.files.add(
          await http.MultipartFile.fromPath('cover', cover.path),
        );
      }

      final response = await request.send();
      // Drain stream to avoid resource leak
      await response.stream.drain<void>();

      debugPrint('Update project response: ${response.statusCode}');

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating project: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>> inviteAdmin(int projectId, String email) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('No token found');
      }

      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/project/$projectId/invite/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $token',
        },
        body: jsonEncode({'email': email}),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true};
      } else if (response.statusCode == 400) {
        final errorData = jsonDecode(response.body);
        return {'success': false, 'error': errorData['error'] ?? 'Error desconocido'};
      } else {
        return {'success': false, 'error': 'Error al enviar la invitación'};
      }
    } catch (e) {
      debugPrint('Error inviting admin: $e');
      return {'success': false, 'error': 'Error de conexión'};
    }
  }

  Future<List<Map<String, dynamic>>> getProjectInvitations(int projectId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('No token found');
      }

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/project/$projectId/invitations/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $token',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }

      return [];
    } catch (e) {
      debugPrint('Error getting project invitations: $e');
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getOrganizations() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('No token found');
      }

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/organization/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $token',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }

      return [];
    } catch (e) {
      debugPrint('Error getting organizations: $e');
      return [];
    }
  }

  Future<bool> updateProjectOrganizations(int projectId, List<int> organizationIds) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('No token found');
      }

      final response = await http.patch(
        Uri.parse('${AppConfig.apiUrl}/project/$projectId/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $token',
        },
        body: jsonEncode({
          'organizations_write': organizationIds,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 204) {
        return true;
      } else {
        debugPrint('Update organizations error: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      debugPrint('Error updating project organizations: $e');
      return false;
    }
  }
}
