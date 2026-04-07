import 'package:country_picker/country_picker.dart';

class ProjectCountry {
  final String code; // ISO 3166-1 alpha-2, o "global"
  final String name; // Nombre legible
  final int projectCount;

  ProjectCountry({
    required this.code,
    required this.name,
    this.projectCount = 0,
  });

  factory ProjectCountry.fromJson(Map<String, dynamic> json) {
    final code = json['country'] as String? ?? '';
    return ProjectCountry(
      code: code,
      name: _nameForCode(code),
      projectCount: json['project_count'] ?? 0,
    );
  }

  static String _nameForCode(String code) {
    if (code == 'global') return 'Global';
    try {
      return CountryParser.parseCountryCode(code).name;
    } catch (_) {
      return code.toUpperCase();
    }
  }
}
