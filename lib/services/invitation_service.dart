import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/invitation.dart';
import '../config/app_config.dart';
import 'auth_service.dart';

class InvitationService {
  final _authService = AuthService();

  Future<List<Invitation>> getPendingInvitations() async {
    try {
      final key = await _authService.getToken();
      if (key == null) return [];

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/users/invitations/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final List<dynamic> data = decoded is List ? decoded : (decoded['results'] ?? decoded['invitations'] ?? []);
        return data.map((json) => Invitation.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching pending invitations: $e');
      return [];
    }
  }

  Future<bool> acceptInvitation(int invitationId) async {
    try {
      final key = await _authService.getToken();
      if (key == null) return false;

      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/users/invitations/project/$invitationId/accept/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error accepting invitation: $e');
      return false;
    }
  }

  Future<bool> rejectInvitation(int invitationId) async {
    try {
      final key = await _authService.getToken();
      if (key == null) return false;

      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/users/invitations/project/$invitationId/reject/'),
        headers: await _authService.getHeaders(),
      ).timeout(const Duration(seconds: 15));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error rejecting invitation: $e');
      return false;
    }
  }
}
