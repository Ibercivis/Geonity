import 'dart:async';
import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/project.dart';
import '../models/project_country.dart';
import '../config/app_config.dart';
import '../utils/api_error_utils.dart';
import 'auth_service.dart';

class ProjectService {
  static String get baseUrl => '${AppConfig.apiUrl}/project/';
  final _authService = AuthService();

  /// Set when an update/create fails with a field-level API error.
  /// Callers can read this to show a specific message to the user.
  String? lastError;

  Future<List<Project>> getProjects() async {
    try {
      final response = await http.get(
        Uri.parse(baseUrl),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      debugPrint('Projects response status: ${response.statusCode}');

      if (response.statusCode == 401) {
        unawaited(_authService.handleUnauthorized());
        return [];
      }
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
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 401) {
        unawaited(_authService.handleUnauthorized());
        return [];
      }
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

  Future<List<Project>> getMyAdminProjects() async {
    try {
      final key = await _authService.getToken();
      if (key == null) return [];

      final response = await http.get(
        Uri.parse('${baseUrl}my_admin_projects/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(utf8.decode(response.bodyBytes));
        final List<dynamic> data = decoded is List ? decoded : (decoded['results'] ?? []);
        return data.map((json) => Project.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching my admin projects: $e');
      return [];
    }
  }

  Future<List<Project>> getMyParticipatingProjects() async {
    try {
      final key = await _authService.getToken();
      if (key == null) return [];

      final response = await http.get(
        Uri.parse('${baseUrl}my_participating/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(utf8.decode(response.bodyBytes));
        final List<dynamic> data = decoded is List ? decoded : (decoded['results'] ?? []);
        return data.map((json) => Project.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching my participating projects: $e');
      return [];
    }
  }

  Future<List<Project>> getMyLikedProjects() async {
    try {
      final key = await _authService.getToken();
      if (key == null) return [];

      final response = await http.get(
        Uri.parse('${baseUrl}my_liked/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(utf8.decode(response.bodyBytes));
        final List<dynamic> data = decoded is List ? decoded : (decoded['results'] ?? []);
        return data.map((json) => Project.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching my liked projects: $e');
      return [];
    }
  }

  Future<List<Project>> getDraftProjects() async {
    try {
      final key = await _authService.getToken();
      if (key == null) return [];

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/project/drafts/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(utf8.decode(response.bodyBytes));
        final List<dynamic> data = decoded is List ? decoded : (decoded['results'] ?? []);
        return data.map((json) => Project.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching draft projects: $e');
      return [];
    }
  }

  Future<bool> toggleLike(int projectId) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/projects/$projectId/toggle-like/'),
        headers: await _authService.getHeaders(),
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
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/project/$projectId/'),
        headers: await _authService.getHeaders(),
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
      final uri = Uri.parse('${AppConfig.apiUrl}/field_forms/$fieldFormId/')
          .replace(queryParameters: raw ? {'raw': 'true'} : null);

      final response = await http.get(
        uri,
        headers: await _authService.getHeaders(),
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
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/organization/$organizationId/projects/'),
        headers: await _authService.getHeaders(),
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
      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/projects/$projectId/validate-password/'),
        headers: await _authService.getHeaders(),
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
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      return response.statusCode == 204 || response.statusCode == 200;
    } catch (e) {
      debugPrint('Error deleting project: $e');
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> getTopics() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/project/topics/'),
        headers: await _authService.getHeaders(),
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
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/project/countries/'),
        headers: await _authService.getHeaders(),
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
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/question_types/'),
        headers: await _authService.getHeaders(),
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
    bool publicMap = false,
    bool fuzzy = false,
    bool draft = true,
    bool ended = false,
    bool emailOnObservation = false,
    bool isGlobal = true,
    List<String>? countries,
    Map<String, dynamic>? fieldForm,
    String? postObservationMessage,
    bool showPostMessage = true,
  }) async {
    try {
      lastError = null;
      final key = await _authService.getToken();
      if (key == null) {
        debugPrint('No auth token available');
        return null;
      }

      final request = http.MultipartRequest('POST', Uri.parse(baseUrl));
      request.headers.addAll(await _authService.getMultipartHeaders());

      request.fields['name'] = name;
      request.fields['description'] = description;
      request.fields['is_private'] = isPrivate.toString();
      request.fields['private_data'] = isDatabasePrivate.toString();
      request.fields['public_map'] = publicMap.toString();
      request.fields['fuzzy'] = fuzzy.toString();
      request.fields['draft'] = draft.toString();
      request.fields['ended'] = ended.toString();
      request.fields['email_on_observation'] = emailOnObservation.toString();
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
      request.fields['show_post_message'] = showPostMessage.toString();

      if (cover != null) {
        request.files.add(await http.MultipartFile.fromPath('cover', cover.path));
      }

      final response = await request.send();
      final responseBody = await response.stream.bytesToString();

      debugPrint('Create project response: ${response.statusCode}');
      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(responseBody);
        return data['id'] as int?;
      }
      debugPrint('[createProject] ERROR body: $responseBody');
      lastError = parseServerError(responseBody);
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
    bool? publicMap,
    bool? fuzzy,
    bool? draft,
    bool? ended,
    bool? emailOnObservation,
    bool? isGlobal,
    List<String>? countries,
    Map<String, dynamic>? fieldForm,
    String? postObservationMessage,
    bool showPostMessage = true,
  }) async {
    try {
      lastError = null;
      final key = await _authService.getToken();
      if (key == null) {
        debugPrint('No auth token available');
        return false;
      }

      final uri = Uri.parse('${AppConfig.apiUrl}/project/$projectId/');

      // description arrives as a JSON-encoded string '{"es":"..."}' — decode it so
      // it serialises as an object (not a double-encoded string) in the JSON body.
      dynamic descriptionValue;
      try {
        descriptionValue = jsonDecode(description);
      } catch (_) {
        descriptionValue = description;
      }

      dynamic postObsValue;
      if (postObservationMessage != null) {
        try {
          postObsValue = jsonDecode(postObservationMessage);
        } catch (_) {
          postObsValue = postObservationMessage;
        }
      }

      // Build the payload as a plain Map first (booleans as actual booleans)
      final body = <String, dynamic>{
        'name': name,
        'description': descriptionValue,
        if (isPrivate != null) 'is_private': isPrivate,
        if (isPrivate == true && password != null && password.isNotEmpty) 'raw_password': password,
        if (isDatabasePrivate != null) 'private_data': isDatabasePrivate,
        if (publicMap != null) 'public_map': publicMap,
        if (fuzzy != null) 'fuzzy': fuzzy,
        if (draft != null) 'draft': draft,
        if (ended != null) 'ended': ended,
        if (emailOnObservation != null) 'email_on_observation': emailOnObservation,
        if (isGlobal != null) 'is_global': isGlobal,
        if (isGlobal == false && countries != null && countries.isNotEmpty) 'countries': countries,
        if (organizationIds != null) 'organizations_write': organizationIds,
        if (topics != null) 'topic': topics,
        if (fieldForm != null) 'field_form': fieldForm,
        if (postObsValue != null) 'post_observation_message': postObsValue,
        'show_post_message': showPostMessage,
      };

      http.Response response;

      if (cover != null) {
        // Multipart — needed for file upload; booleans sent as strings
        final request = http.MultipartRequest('PATCH', uri);
        request.headers.addAll(await _authService.getMultipartHeaders());
        body.forEach((k, v) {
          if (v is List) {
            request.fields[k] = jsonEncode(v);
          } else if (v is Map) {
            request.fields[k] = jsonEncode(v);
          } else {
            request.fields[k] = v.toString();
          }
        });
        request.files.add(await http.MultipartFile.fromPath('cover', cover.path));
        debugPrint('[updateProject] PATCH multipart → $uri');
        debugPrint('[updateProject] fields: ${request.fields}');
        final streamed = await request.send();
        response = await http.Response.fromStream(streamed);
      } else {
        // JSON — booleans arrive as actual booleans, matches React behaviour
        final jsonBody = jsonEncode(body);
        debugPrint('[updateProject] PATCH json → $uri');
        debugPrint('[updateProject] body: $jsonBody');
        response = await http.patch(
          uri,
          headers: await _authService.getHeaders(),
          body: jsonBody,
        ).timeout(const Duration(seconds: 15));
      }

      final responseBody = response.body;
      debugPrint('[updateProject] response ${response.statusCode}: $responseBody');

      if (response.statusCode != 200) {
        debugPrint('[updateProject] ERROR body: $responseBody');
        lastError = parseServerError(responseBody);
      }
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating project: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>> inviteAdmin(int projectId, String email) async {
    try {
      final key = await _authService.getToken();
      if (key == null) throw Exception('No token found');

      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/project/$projectId/invite/'),
        headers: await _authService.getHeaders(),
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
      final key = await _authService.getToken();
      if (key == null) throw Exception('No token found');

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/project/$projectId/invitations/'),
        headers: await _authService.getHeaders(),
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
      final key = await _authService.getToken();
      if (key == null) throw Exception('No token found');

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/organization/mine/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final List<dynamic> data = decoded is List ? decoded : (decoded['results'] ?? []);
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
      final key = await _authService.getToken();
      if (key == null) throw Exception('No token found');

      final request = http.MultipartRequest(
        'PATCH',
        Uri.parse('${AppConfig.apiUrl}/project/$projectId/'),
      );
      request.headers.addAll(await _authService.getMultipartHeaders());
      request.fields['organizations_write'] = jsonEncode(organizationIds);

      final streamed = await request.send();
      await streamed.stream.drain<void>();

      if (streamed.statusCode == 200 || streamed.statusCode == 204) {
        return true;
      } else {
        debugPrint('Update organizations error: ${streamed.statusCode}');
        return false;
      }
    } catch (e) {
      debugPrint('Error updating project organizations: $e');
      return false;
    }
  }
}
