import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/organization.dart';
import '../models/invitation.dart';
import '../config/app_config.dart';
import 'auth_service.dart';

class OrganizationService {
  static String get baseUrl => '${AppConfig.apiUrl}/organization/';
  final _authService = AuthService();

  Future<List<Organization>> getOrganizations() async {
    try {
      final key = await _authService.getToken();
      
      final response = await http.get(
        Uri.parse(baseUrl),
        headers: {
          'Content-Type': 'application/json',
          if (key != null) 'Authorization': 'Token $key',
        },
      );

      debugPrint('Organizations response status: ${response.statusCode}');

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

  Future<bool> createOrganization({
    required String principalName,
    required String description,
    File? logo,
    File? cover,
  }) async {
    try {
      final key = await _authService.getToken();
      final userId = await _authService.getUserId();
      
      if (key == null || userId == null) {
        throw Exception('No se encontró token o ID de usuario');
      }

      var request = http.MultipartRequest(
        'POST',
        Uri.parse('${baseUrl}create/'),
      );

      request.headers['Authorization'] = 'Token $key';
      
      // Campos obligatorios
      request.fields['principalName'] = principalName;
      request.fields['creator'] = userId.toString();
      
      // Campos opcionales
      if (description.isNotEmpty) {
        request.fields['description'] = description;
      }

      // Imágenes
      if (logo != null) {
        request.files.add(
          await http.MultipartFile.fromPath('logo', logo.path),
        );
      }

      if (cover != null) {
        request.files.add(
          await http.MultipartFile.fromPath('cover', cover.path),
        );
      }

      debugPrint('Creating organization: $principalName');
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      debugPrint('Create organization response status: ${response.statusCode}');
      debugPrint('Create organization response body: ${response.body}');

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error creating organization: $e');
      return false;
    }
  }

  Future<bool> updateOrganization({
    required int organizationId,
    required String principalName,
    String description = '',
    File? logo,
    File? cover,
  }) async {
    try {
      final key = await _authService.getToken();
      if (key == null) {
        debugPrint('No auth key available');
        return false;
      }

      var request = http.MultipartRequest(
        'PATCH',
        Uri.parse('$baseUrl$organizationId/'),
      );

      request.headers['Authorization'] = 'Token $key';
      
      // Campos requeridos
      request.fields['principalName'] = principalName;
      
      // Campos opcionales
      if (description.isNotEmpty) {
        request.fields['description'] = description;
      }

      // Imágenes (solo si se seleccionaron nuevas)
      if (logo != null) {
        request.files.add(
          await http.MultipartFile.fromPath('logo', logo.path),
        );
      }

      if (cover != null) {
        request.files.add(
          await http.MultipartFile.fromPath('cover', cover.path),
        );
      }

      debugPrint('Updating organization $organizationId: $principalName');
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      debugPrint('Update organization response status: ${response.statusCode}');
      debugPrint('Update organization response body: ${response.body}');

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating organization: $e');
      return false;
    }
  }

  Future<List<Organization>> getMyOrganizations() async {
    try {
      final key = await _authService.getToken();
      
      final response = await http.get(
        Uri.parse('${baseUrl}mine/'),
        headers: {
          'Content-Type': 'application/json',
          if (key != null) 'Authorization': 'Token $key',
        },
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
      final key = await _authService.getToken();
      
      final response = await http.get(
        Uri.parse('$baseUrl$organizationId/'),
        headers: {
          'Content-Type': 'application/json',
          if (key != null) 'Authorization': 'Token $key',
        },
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $key',
        },
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $key',
        },
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $key',
        },
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
      debugPrint('Error getting organization invitations: $e');
      return [];
    }
  }

  Future<List<Invitation>> getPendingOrganizationInvitations() async {
    try {
      final token = await _authService.getToken();
      if (token == null) return [];

      final response = await http.get(
        Uri.parse('${baseUrl}invitations/pending/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $token',
        },
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
        Uri.parse('${baseUrl}invitations/$invitationId/accept/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $token',
        },
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
        Uri.parse('${baseUrl}invitations/$invitationId/reject/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $token',
        },
      ).timeout(const Duration(seconds: 15));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error rejecting org invitation: $e');
      return false;
    }
  }
}
