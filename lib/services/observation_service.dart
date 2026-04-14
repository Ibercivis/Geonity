import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/observation.dart';
import '../models/observation_field.dart';
import '../models/project.dart';
import 'auth_service.dart';
import '../utils/multilingual_utils.dart';

class ObservationService {
  final _authService = AuthService();

  Future<List<Observation>> getObservations(int fieldFormId) async {
    debugPrint('Getting observations for field_form $fieldFormId');

    final response = await http.get(
      Uri.parse('${AppConfig.apiUrl}/field_form/$fieldFormId/observations/'),
      headers: await _authService.getHeaders(),
    ).timeout(const Duration(seconds: 15));

    debugPrint('Observations response status: ${response.statusCode}');

    if (response.statusCode == 200) {
      final decoded = json.decode(utf8.decode(response.bodyBytes));

      List<dynamic> data;
      if (decoded is List) {
        data = decoded;
      } else if (decoded is Map && decoded['results'] != null) {
        data = decoded['results'] as List;
      } else {
        throw Exception('Unexpected response format');
      }

      return data.map((json) => Observation.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load observations: ${response.statusCode}');
    }
  }

  Future<List<Map<String, dynamic>>> getMyObservations() async {
    try {
      final key = await _authService.getToken();
      if (key == null) return [];

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/observation/mine/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final decoded = json.decode(utf8.decode(response.bodyBytes));
        final List<dynamic> data = decoded is List ? decoded : (decoded['results'] ?? []);
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching my observations: $e');
      return [];
    }
  }

  Future<Project?> getProject(int projectId) async {
    final response = await http.get(
      Uri.parse('${AppConfig.apiUrl}/project/$projectId/'),
      headers: await _authService.getHeaders(),
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final body = utf8.decode(response.bodyBytes);
      final data = json.decode(body) as Map<String, dynamic>;
      debugPrint('[getProject] fuzzy=${data['fuzzy']}  fuzzy_resolution=${data['fuzzy_resolution']}  field_form=${data['field_form']}');
      return Project.fromJson(data);
    }
    return null;
  }

  Future<String> getHexObservations(int fieldFormId, {int zoom = 11}) async {
    debugPrint('Getting hex observations for field_form $fieldFormId at zoom $zoom');

    final uri = Uri.parse('${AppConfig.apiUrl}/field_form/$fieldFormId/observations/hex/')
        .replace(queryParameters: {'zoom': zoom.toString()});

    final response = await http.get(
      uri,
      headers: await _authService.getHeaders(),
    ).timeout(const Duration(seconds: 15));

    debugPrint('Hex observations response status: ${response.statusCode}');

    if (response.statusCode == 200) {
      return utf8.decode(response.bodyBytes);
    } else {
      throw Exception('Failed to load hex observations: ${response.statusCode}');
    }
  }

  Future<int?> getFieldFormIdFromProject(int projectId) async {
    final response = await http.get(
      Uri.parse('${AppConfig.apiUrl}/project/$projectId/'),
      headers: await _authService.getHeaders(),
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final data = json.decode(utf8.decode(response.bodyBytes));
      if (data['field_form'] != null) {
        return data['field_form'] as int?;
      }
    }
    return null;
  }

  Future<bool> deleteObservation(int observationId) async {
    final token = await _authService.getToken();
    if (token == null) throw Exception('No auth token available');

    final response = await http.delete(
      Uri.parse('${AppConfig.apiUrl}/observation/$observationId/'),
      headers: await _authService.getHeaders(),
    ).timeout(const Duration(seconds: 15));

    return response.statusCode == 204 || response.statusCode == 200;
  }

  Future<List<ObservationField>> getFieldFormQuestions(int fieldFormId) async {
    final url = '${AppConfig.apiUrl}/field_forms/$fieldFormId/?raw=true';
    debugPrint('[getFieldFormQuestions] GET $url');
    final response = await http.get(
      Uri.parse(url),
      headers: await _authService.getHeaders(),
    ).timeout(const Duration(seconds: 15));

    debugPrint('[getFieldFormQuestions] status=${response.statusCode}  body=${response.body.length > 200 ? response.body.substring(0, 200) : response.body}');

    if (response.statusCode == 200) {
      final data = json.decode(utf8.decode(response.bodyBytes));

      if (data['questions'] != null && data['questions'] is List) {
        final List<dynamic> questions = data['questions'];

        return questions.map((q) {
          final rawChoices = q['choices'] as List?;
          final choiceLabels = rawChoices?.map((e) {
            if (e is String) return e;
            if (e is Map) return localizedText(e['label'] ?? e['value'] ?? e.toString());
            return e.toString();
          }).toList();
          final choiceValues = rawChoices?.map((e) {
            if (e is String) return e;
            if (e is Map) return (e['value'] ?? e['label'] ?? e).toString();
            return e.toString();
          }).toList();

          final labelText = localizedText(q['question_text']);
          return ObservationField(
            id: q['id'] ?? 0,
            projectId: 0,
            key: q['id']?.toString() ?? '',
            label: labelText.isNotEmpty ? labelText : 'Campo ${q['id']}',
            fieldType: q['answer_type'] ?? 'STR',
            required: q['mandatory'] ?? false,
            choices: choiceLabels,
            choiceValues: choiceValues,
            order: q['order'] ?? 0,
            helpText: localizedText(q['question_help']),
            allowOther: q['allow_other'] ?? false,
          );
        }).toList();
      }

      return [];
    } else {
      throw Exception('Failed to load field form: ${response.statusCode}');
    }
  }

  /// Puntos ligeros para el mapa: GET /field_form/{id}/observations/map/
  /// Devuelve {id, lat, lon}[] sin datos de formulario.
  Future<List<Observation>> getMapObservations(int fieldFormId) async {
    debugPrint('[getMapObservations] GET /field_form/$fieldFormId/observations/map/');
    final response = await http.get(
      Uri.parse('${AppConfig.apiUrl}/field_form/$fieldFormId/observations/map/'),
      headers: await _authService.getHeaders(),
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final decoded = json.decode(utf8.decode(response.bodyBytes));
      List<dynamic> data;
      if (decoded is List) {
        data = decoded;
      } else if (decoded is Map && decoded['results'] != null) {
        data = decoded['results'] as List;
      } else {
        throw Exception('Unexpected response format');
      }
      return data.map((j) => Observation.fromJson(j as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Failed to load map observations: ${response.statusCode}');
    }
  }

  /// Observaciones completas del usuario: GET /field_form/{id}/observations/mine/
  Future<List<Observation>> getMyObservationsForFieldForm(int fieldFormId) async {
    debugPrint('[getMyObservationsForFieldForm] GET /field_form/$fieldFormId/observations/mine/');
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/field_form/$fieldFormId/observations/mine/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final decoded = json.decode(utf8.decode(response.bodyBytes));
        List<dynamic> data;
        if (decoded is List) {
          data = decoded;
        } else if (decoded is Map && decoded['results'] != null) {
          data = decoded['results'] as List;
        } else {
          return [];
        }
        return data.map((j) => Observation.fromJson(j as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      debugPrint('[getMyObservationsForFieldForm] error: $e');
    }
    return [];
  }

  /// Detalle completo de una observación: GET /observations/{id}/
  Future<Observation?> getObservationDetail(int observationId) async {
    debugPrint('[getObservationDetail] GET /observations/$observationId/');
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/observations/$observationId/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = json.decode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
        return Observation.fromJson(data);
      }
    } catch (e) {
      debugPrint('[getObservationDetail] error: $e');
    }
    return null;
  }

  Future<bool> createObservation({
    required int fieldFormId,
    required double latitude,
    required double longitude,
    required Map<String, dynamic> data,
    Map<String, List<File>>? images,
  }) async {
    try {
      final key = await _authService.getToken();
      if (key == null) {
        debugPrint('No auth token available');
        return false;
      }

      var request = http.MultipartRequest(
        'POST',
        Uri.parse('${AppConfig.apiUrl}/observations/'),
      );

      request.headers.addAll(await _authService.getMultipartHeaders());
      request.headers['X-Api-Key'] = AppConfig.observationsApiKey;

      request.fields['field_form'] = fieldFormId.toString();
      request.fields['geoposition'] = 'POINT($longitude $latitude)';
      request.fields['timestamp'] = DateTime.now().toUtc().toIso8601String();

      final dataList = data.entries
          .map((e) => {'key': e.key, 'value': e.value is List ? e.value : e.value.toString()})
          .toList();
      request.fields['data'] = jsonEncode(dataList);

      if (images != null) {
        for (var entry in images.entries) {
          for (var file in entry.value) {
            final stream = http.ByteStream(file.openRead());
            final length = await file.length();
            final multipartFile = http.MultipartFile(
              entry.key,
              stream,
              length,
              filename: file.path.split('/').last,
            );
            request.files.add(multipartFile);
          }
        }
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      debugPrint('Create observation response: ${response.statusCode}');
      if (response.statusCode != 201 && response.statusCode != 200) {
        debugPrint('Response body (truncated): ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}');
      }

      return response.statusCode == 201 || response.statusCode == 200;
    } catch (e) {
      debugPrint('Error creating observation: $e');
      return false;
    }
  }
}
