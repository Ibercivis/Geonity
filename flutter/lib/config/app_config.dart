import 'secrets.dart';

class AppConfig {
  // M11: Set at build time with --dart-define=PRODUCTION=true
  // Default is false (dev environment).
  static const bool isProduction =
      bool.fromEnvironment('PRODUCTION', defaultValue: false);

  // Mapbox access token (configurado en secrets.dart)
  static String get mapboxAccessToken => Secrets.mapboxAccessToken;

  static String get baseUrl => 'https://geonity.ibercivis.es';

  static String get apiUrl => '$baseUrl/api';

  static String get mediaUrl => '$baseUrl/media';

  // Google auth endpoint is only available on the production host (no port)
  static String get productionBaseUrl => 'https://geonity.ibercivis.es';
  static String get googleAuthUrl => '$productionBaseUrl/api/users/auth/google/';

  static String get observationsApiKey => Secrets.observationsApiKey;
}
