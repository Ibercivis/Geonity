import 'dart:async';
import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/organization.dart';
import '../models/invitation.dart';
import '../config/app_config.dart';
import '../utils/api_error_utils.dart';
import 'auth_service.dart';

class OrganizationService {
  static String get baseUrl => '${AppConfig.apiUrl}/organization/';
  final _authService = AuthService();

  String? lastError;

  Future<List<Organization>> getOrganizations() async {
    try {
      final response = await http.get(
        Uri.parse(baseUrl),
        headers: await _authService.getHeaders(),
      );

      debugPrint('Organizations response status: ${response.statusCode}');

      if (response.statusCode == 401) {
        unawaited(_authService.handleUnauthorized());
        return [];
      }
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Organization.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching organizations: $e');
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getOrganizationTypes() async {
    try {
      final response = await http.get(
        Uri.parse('${baseUrl}type/'),
        headers: await _authService.getHeaders(),
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching organization types: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>?> getOrganizationDetailRaw(int organizationId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$organizationId/?raw=true'),
        headers: await _authService.getHeaders(),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching organization detail (raw): $e');
      return null;
    }
  }

  Future<bool> createOrganization({
    required String principalName,
    String? description,
    String? url,
    String? contactName,
    String? contactMail,
    List<int>? typeIds,
    bool isGlobal = true,
    List<String>? countries,
    File? logo,
    File? cover,
  }) async {
    try {
      final key = await _authService.getToken();
      if (key == null) throw Exception('No se encontró token de autenticación');

      var request = http.MultipartRequest('POST', Uri.parse('${baseUrl}create/'));
      request.headers.addAll(await _authService.getMultipartHeaders());

      request.fields['principalName'] = principalName;
      if (description != null && description.isNotEmpty) {
        request.fields['description'] = description;
      }
      if (url != null && url.isNotEmpty) request.fields['url'] = url;
      if (contactName != null && contactName.isNotEmpty) request.fields['contactName'] = contactName;
      if (contactMail != null && contactMail.isNotEmpty) request.fields['contactMail'] = contactMail;
      if (typeIds != null) {
        for (final id in typeIds) {
          request.fields['type'] = id.toString(); // multipart array workaround
        }
        // http package doesn't support repeated keys well; use JSON list as string if needed
        request.fields.remove('type');
        for (final id in typeIds) {
          request.fields['type[${ typeIds.indexOf(id)}]'] = id.toString();
        }
      }
      request.fields['is_global'] = isGlobal.toString();
      if (!isGlobal && countries != null) {
        for (int i = 0; i < countries.length; i++) {
          request.fields['countries[$i]'] = countries[i];
        }
      }

      if (logo != null) request.files.add(await http.MultipartFile.fromPath('logo', logo.path));
      if (cover != null) request.files.add(await http.MultipartFile.fromPath('cover', cover.path));

      lastError = null;
      debugPrint('[createOrganization] principalName=$principalName');
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      debugPrint('[createOrganization] status=${response.statusCode} body=${response.body}');

      if (response.statusCode != 200 && response.statusCode != 201) {
        lastError = parseServerError(response.body);
      }
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error creating organization: $e');
      return false;
    }
  }

  Future<bool> updateOrganization({
    required int organizationId,
    required String principalName,
    String? description,
    String? url,
    String? contactName,
    String? contactMail,
    List<int>? typeIds,
    bool? isGlobal,
    List<String>? countries,
    File? logo,
    File? cover,
  }) async {
    try {
      final key = await _authService.getToken();
      if (key == null) return false;

      final uri = Uri.parse('$baseUrl$organizationId/');
      http.Response response;

      if (logo != null || cover != null) {
        // Multipart cuando hay ficheros
        var request = http.MultipartRequest('PATCH', uri);
        request.headers.addAll(await _authService.getMultipartHeaders());
        request.fields['principalName'] = principalName;
        if (description != null && description.isNotEmpty) request.fields['description'] = description;
        if (url != null) request.fields['url'] = url;
        if (contactName != null) request.fields['contactName'] = contactName;
        if (contactMail != null) request.fields['contactMail'] = contactMail;
        if (typeIds != null) {
          for (int i = 0; i < typeIds.length; i++) {
            request.fields['type[$i]'] = typeIds[i].toString();
          }
        }
        if (isGlobal != null) request.fields['is_global'] = isGlobal.toString();
        if (isGlobal == false && countries != null) {
          for (int i = 0; i < countries.length; i++) {
            request.fields['countries[$i]'] = countries[i];
          }
        }
        if (logo != null) request.files.add(await http.MultipartFile.fromPath('logo', logo.path));
        if (cover != null) request.files.add(await http.MultipartFile.fromPath('cover', cover.path));

        final streamed = await request.send();
        response = await http.Response.fromStream(streamed);
      } else {
        // JSON cuando no hay ficheros (booleans como booleans)
        final body = <String, dynamic>{
          'principalName': principalName,
          if (description != null && description.isNotEmpty) 'description': _decodeIfJson(description),
          if (url != null) 'url': url,
          if (contactName != null) 'contactName': contactName,
          if (contactMail != null) 'contactMail': contactMail,
          if (typeIds != null) 'type': typeIds,
          if (isGlobal != null) 'is_global': isGlobal,
          if (isGlobal == false && countries != null) 'countries': countries,
        };
        debugPrint('[updateOrganization] body: ${jsonEncode(body)}');
        response = await http.patch(
          uri,
          headers: await _authService.getHeaders(),
          body: jsonEncode(body),
        );
      }

      lastError = null;
      debugPrint('[updateOrganization] status=${response.statusCode} body=${response.body}');
      if (response.statusCode != 200) {
        lastError = parseServerError(response.body);
      }
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating organization: $e');
      return false;
    }
  }

  static dynamic _decodeIfJson(String value) {
    try {
      return jsonDecode(value);
    } catch (_) {
      return value;
    }
  }

  Future<List<Organization>> getMyOrganizations() async {
    try {
      final response = await http.get(
        Uri.parse('${baseUrl}mine/'),
        headers: await _authService.getHeaders(),
      );

      debugPrint('My organizations response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Organization.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching my organizations: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>?> getOrganizationDetail(int organizationId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$organizationId/'),
        headers: await _authService.getHeaders(),
      );

      debugPrint('Organization detail response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching organization detail: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>> inviteToOrganization({
    required int organizationId,
    required String email,
    required String role, // "administrator" o "member"
  }) async {
    try {
      final key = await _authService.getToken();
      if (key == null) {
        debugPrint('No auth key available');
        return {'success': false, 'error': 'No se encontró token de autenticación'};
      }

      final response = await http.post(
        Uri.parse('$baseUrl$organizationId/invite/'),
        headers: await _authService.getHeaders(),
        body: jsonEncode({
          'email': email,
          'role': role,
        }),
      );

      debugPrint('Invite response status: ${response.statusCode}');
      debugPrint('Invite response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true};
      } else {
        // Intentar parsear el error del backend
        try {
          final errorData = jsonDecode(response.body);
          final errorMessage = errorData['error'] ?? 'Error al enviar la invitación';
          return {'success': false, 'error': errorMessage};
        } catch (e) {
          return {'success': false, 'error': 'Error al enviar la invitación'};
        }
      }
    } catch (e) {
      debugPrint('Error inviting to organization: $e');
      return {'success': false, 'error': 'Error de conexión: $e'};
    }
  }

  Future<bool> leaveOrganization(int organizationId) async {
    try {
      final key = await _authService.getToken();
      if (key == null) {
        debugPrint('No auth key available');
        return false;
      }

      final response = await http.post(
        Uri.parse('$baseUrl$organizationId/leave/'),
        headers: await _authService.getHeaders(),
      );

      debugPrint('Leave organization response status: ${response.statusCode}');
      debugPrint('Leave organization response body: ${response.body}');

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error leaving organization: $e');
      return false;
    }
  }

  Future<bool> deleteOrganization(int organizationId) async {
    try {
      final key = await _authService.getToken();
      if (key == null) {
        debugPrint('No auth key available');
        return false;
      }

      final response = await http.delete(
        Uri.parse('$baseUrl$organizationId/'),
        headers: await _authService.getHeaders(),
      );

      debugPrint('Delete organization response status: ${response.statusCode}');
      debugPrint('Delete organization response body: ${response.body}');

      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      debugPrint('Error deleting organization: $e');
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> getOrganizationInvitations(int organizationId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) return [];

      final response = await http.get(
        Uri.parse('$baseUrl$organizationId/invitations/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      debugPrint('Error getting organization invitations: $e');
      return [];
    }
  }

  Future<List<Invitation>> getPendingOrganizationInvitations() async {
    try {
      final token = await _authService.getToken();
      if (token == null) return [];

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/users/invitations/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final List<dynamic> data = decoded is List ? decoded : (decoded['results'] ?? []);
        return data.map((j) => Invitation.fromJson(j as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error getting pending org invitations: $e');
      return [];
    }
  }

  Future<bool> acceptOrganizationInvitation(int invitationId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) return false;

      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/users/invitations/organization/$invitationId/accept/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error accepting org invitation: $e');
      return false;
    }
  }

  Future<bool> rejectOrganizationInvitation(int invitationId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) return false;

      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/users/invitations/organization/$invitationId/reject/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error rejecting org invitation: $e');
      return false;
    }
  }
}
