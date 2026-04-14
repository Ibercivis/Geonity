import 'package:flutter/foundation.dart';
import '../config/app_config.dart';
import '../utils/multilingual_utils.dart';
class Organization {
  final int id;
  final String principalName;
  final String? logo;
  final String? cover;
  final String? description;
  final String? userRole;

  Organization({
    required this.id,
    required this.principalName,
    this.logo,
    this.cover,
    this.description,
    this.userRole,
  });

  // Getter de compatibilidad para código existente
  String get name => principalName;

  factory Organization.fromJson(Map<String, dynamic> json) {
    debugPrint('Parsing organization: ${json['principalName'] ?? json['principal_name'] ?? json['name']}');
    debugPrint('Logo value: ${json['logo']}');
    
    String? logoUrl;
    if (json['logo'] != null) {
      final logoPath = json['logo'];
      if (logoPath.startsWith('http')) {
        logoUrl = logoPath;
      } else {
        // Construir URL completa
        final cleanPath = logoPath.startsWith('/') ? logoPath : '/$logoPath';
        logoUrl = '${AppConfig.baseUrl}$cleanPath';
      }
    }
    debugPrint('Final logo URL: $logoUrl');

    String? coverUrl;
    if (json['cover'] != null) {
      final coverPath = json['cover'];
      if (coverPath.startsWith('http')) {
        coverUrl = coverPath;
      } else {
        final cleanPath = coverPath.startsWith('/') ? coverPath : '/$coverPath';
        coverUrl = '${AppConfig.baseUrl}$cleanPath';
      }
    }

    return Organization(
      id: json['id'] ?? 0,
      principalName: json['principalName'] ?? json['principal_name'] ?? json['name'] ?? '',
      logo: logoUrl,
      cover: coverUrl,
      description: json['description'] != null ? localizedText(json['description']) : null,
      userRole: json['user_role'] is Map ? localizedText(json['user_role']) : json['user_role'] as String?,
    );
  }

  static List<Organization> getMockOrganizations() {
    return [
      Organization(
        id: 1,
        principalName: 'Fundación\nIbercivis',
      ),
      Organization(
        id: 2,
        principalName: 'Universidad\nde Deusto',
      ),
      Organization(
        id: 3,
        principalName: 'CitSci UFABC',
      ),
    ];
  }
}
