import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/observation.dart';
import '../models/field_form.dart';
import '../models/observation_field.dart';
import '../models/project.dart';
import 'auth_service.dart';
import '../utils/multilingual_utils.dart';
import 'locale_service.dart';

class ObservationService {
  final _authService = AuthService();

  Future<List<Observation>> getObservations(int fieldFormId) async {
    final token = await _authService.getToken();
    if (token == null) throw Exception('No auth token available');

    debugPrint('Getting observations for field_form $fieldFormId');

    final response = await http.get(
      Uri.parse('${AppConfig.apiUrl}/field_form/$fieldFormId/observations/'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token $token',
      },
    ).timeout(const Duration(seconds: 15));

    debugPrint('Observations response status: ${response.statusCode}');

    if (response.statusCode == 200) {
      final decoded = json.decode(utf8.decode(response.bodyBytes));
      
      List<dynamic> data;
      // La respuesta podría ser un array directo o un objeto con un campo 'results'
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

  Future<List<FieldForm>> getFieldForms() async {
    final token = await _authService.getToken();
    if (token == null) throw Exception('No auth token available');
    final url = '${AppConfig.apiUrl}/field_forms/';

    final response = await http.get(
      Uri.parse(url),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token $token',
      },
    ).timeout(const Duration(seconds: 15));

    debugPrint('Field forms response status: ${response.statusCode}');

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(utf8.decode(response.bodyBytes));
      return data.map((json) => FieldForm.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load field forms: ${response.statusCode}');
    }
  }

  Future<Project?> getProject(int projectId) async {
    final token = await _authService.getToken();
    if (token == null) throw Exception('No auth token available');

    final response = await http.get(
      Uri.parse('${AppConfig.apiUrl}/project/$projectId/'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token $token',
      },
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final body = utf8.decode(response.bodyBytes);
      final data = json.decode(body) as Map<String, dynamic>;
      debugPrint('[getProject] fuzzy=${data['fuzzy']}  fuzzy_resolution=${data['fuzzy_resolution']}  field_form=${data['field_form']}');
      return Project.fromJson(data);
    }
    return null;
  }

  Future<String> getHexObservations(int fieldFormId) async {
    final token = await _authService.getToken();
    if (token == null) throw Exception('No auth token available');

    debugPrint('Getting hex observations for field_form $fieldFormId');

    final response = await http.get(
      Uri.parse('${AppConfig.apiUrl}/field_form/$fieldFormId/observations/hex/'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token $token',
      },
    ).timeout(const Duration(seconds: 15));

    debugPrint('Hex observations response status: ${response.statusCode}');

    if (response.statusCode == 200) {
      return utf8.decode(response.bodyBytes);
    } else {
      throw Exception('Failed to load hex observations: ${response.statusCode}');
    }
  }

  Future<int?> getFieldFormIdFromProject(int projectId) async {
    final token = await _authService.getToken();
    if (token == null) throw Exception('No auth token available');

    final response = await http.get(
      Uri.parse('${AppConfig.apiUrl}/project/$projectId/'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token $token',
      },
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
      Uri.parse('${AppConfig.apiUrl}/observations/$observationId/'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token $token',
      },
    ).timeout(const Duration(seconds: 15));

    return response.statusCode == 204 || response.statusCode == 200;
  }

  Future<List<ObservationField>> getObservationFields(int projectId) async {
    final token = await _authService.getToken();
    if (token == null) throw Exception('No auth token available');

    final response = await http.get(
      Uri.parse('${AppConfig.apiUrl}/projects/$projectId/observation-fields/'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token $token',
      },
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(utf8.decode(response.bodyBytes));
      return data.map((json) => ObservationField.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load observation fields: ${response.statusCode}');
    }
  }

  Future<List<ObservationField>> getFieldFormQuestions(int fieldFormId) async {
    final token = await _authService.getToken();
    if (token == null) throw Exception('No auth token available');

    final lang = LocaleService.activeLocale?.languageCode ?? 'es';
    final response = await http.get(
      Uri.parse('${AppConfig.apiUrl}/field_forms/$fieldFormId/'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token $token',
        'Accept-Language': lang,
      },
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final data = json.decode(utf8.decode(response.bodyBytes));

      // El field_form tiene un array "questions" con los datos
      if (data['questions'] != null && data['questions'] is List) {
        final List<dynamic> questions = data['questions'];

        // Convertir las preguntas a ObservationField
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

      // Crear el request multipart
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('${AppConfig.apiUrl}/observations/'),
      );

      // Headers
      request.headers['Authorization'] = 'Token $key';

      // Campos del formulario
      request.fields['field_form'] = fieldFormId.toString();
      request.fields['geoposition'] = 'POINT($latitude $longitude)';
      request.fields['timestamp'] = DateTime.now().toUtc().toIso8601String();

      // Convertir data a formato [{key: id, value: valor}]
      // MCHOICE values are List<String> and must be sent as arrays, not strings
      final dataList = data.entries
          .map((e) => {'key': e.key, 'value': e.value is List ? e.value : e.value.toString()})
          .toList();
      request.fields['data'] = jsonEncode(dataList);

      // Agregar imágenes si existen
      if (images != null) {
        for (var entry in images.entries) {
          for (var file in entry.value) {
            final stream = http.ByteStream(file.openRead());
            final length = await file.length();
            final multipartFile = http.MultipartFile(
              entry.key, // question_id
              stream,
              length,
              filename: file.path.split('/').last,
            );
            request.files.add(multipartFile);
          }
        }
      }

      // Enviar request
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

