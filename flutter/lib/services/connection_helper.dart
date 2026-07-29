import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class ConnectionHelper {
  static final Connectivity _connectivity = Connectivity();

  /// Verifica si hay conexión a internet
  static Future<bool> hasInternetConnection() async {
    try {
      final connectivityResult = await _connectivity.checkConnectivity();
      // Si no hay ninguna conexión (ni wifi ni móvil)
      if (connectivityResult.contains(ConnectivityResult.none)) {
        return false;
      }
      return true;
    } catch (e) {
      debugPrint('Error checking connectivity: $e');
      return false;
    }
  }

  /// Verifica si el servidor responde
  static Future<bool> isServerReachable() async {
    try {
      final response = await http
          .get(Uri.parse('${AppConfig.apiUrl}/'))
          .timeout(const Duration(seconds: 5));
      return response.statusCode < 500;
    } on SocketException {
      return false;
    } on http.ClientException {
      return false;
    } catch (e) {
      debugPrint('Error checking server: $e');
      return false;
    }
  }

  /// Verifica conexión completa (internet + servidor)
  static Future<ConnectionStatus> checkConnection() async {
    final hasInternet = await hasInternetConnection();
    
    if (!hasInternet) {
      return ConnectionStatus.noInternet;
    }

    final serverReachable = await isServerReachable();
    
    if (!serverReachable) {
      return ConnectionStatus.serverDown;
    }

    return ConnectionStatus.connected;
  }
}

enum ConnectionStatus {
  connected,
  noInternet,
  serverDown,
}
