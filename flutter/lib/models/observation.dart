import 'package:flutter/foundation.dart';

class ObservationAudio {
  final int id;
  final int questionId;
  final String url;

  ObservationAudio({
    required this.id,
    required this.questionId,
    required this.url,
  });

  factory ObservationAudio.fromJson(Map<String, dynamic> json) {
    return ObservationAudio(
      id: json['id'] as int? ?? 0,
      questionId: (json['question'] as int?) ?? 0,
      url: (json['audio'] as String?) ?? '',
    );
  }
}

class Observation {
  final int id;
  final double latitude;
  final double longitude;
  final String? description;
  final DateTime createdAt;
  final int? userId;
  final int fieldFormId;
  final Map<String, dynamic>? data;
  final List<String>? images;
  final List<ObservationAudio>? audios;
  final List<Map<String, dynamic>>? adminValues;
  final bool isMine;

  Observation({
    required this.id,
    required this.latitude,
    required this.longitude,
    this.description,
    required this.createdAt,
    this.userId,
    required this.fieldFormId,
    this.data,
    this.images,
    this.audios,
    this.adminValues,
    this.isMine = false,
  });

  factory Observation.fromJson(Map<String, dynamic> json) {
    try {
      // Parse geoposition: "SRID=4326;POINT (longitude latitude)"
      // El servidor almacena WKT estándar: POINT(lon lat).
      double lat = 0.0;
      double lon = 0.0;

      if (json['geoposition'] != null) {
        final geoStr = json['geoposition'] as String;
        final match = RegExp(r'POINT \(([0-9.\-]+) ([0-9.\-]+)\)').firstMatch(geoStr);
        if (match != null) {
          lon = double.parse(match.group(1)!);  // primer valor = longitud
          lat = double.parse(match.group(2)!);  // segundo valor = latitud
        }
      } else {
        lat = (json['latitude'] ?? json['lat'] ?? 0.0).toDouble();
        lon = (json['longitude'] ?? json['lon'] ?? 0.0).toDouble();
      }

      // Parse data - convertir lista de {key, value} a Map
      Map<String, dynamic>? parsedData;
      if (json['data'] != null) {
        if (json['data'] is Map) {
          parsedData = json['data'] as Map<String, dynamic>;
        } else if (json['data'] is List) {
          final dataList = json['data'] as List;
          parsedData = {};
          for (var item in dataList) {
            if (item is Map && item['key'] != null) {
              parsedData[item['key'].toString()] = item['value'];
            }
          }
        }
      }

      // Parse images - pueden ser strings o objetos con {id, image, question}
      List<String>? imageUrls;
      if (json['images'] != null) {
        final imgList = json['images'] as List;
        imageUrls = imgList.map((img) {
          if (img is String) {
            return img;
          } else if (img is Map && img['image'] != null) {
            return img['image'] as String;
          }
          return '';
        }).where((url) => url.isNotEmpty).toList();
      }

      // Parse audios — lista de {id, question, audio}
      List<ObservationAudio>? audios;
      if (json['audios'] != null && json['audios'] is List) {
        audios = (json['audios'] as List)
            .whereType<Map>()
            .map((e) => ObservationAudio.fromJson(Map<String, dynamic>.from(e)))
            .where((a) => a.url.isNotEmpty)
            .toList();
      }

      // Parse admin_values - lista de {key, label, value}
      List<Map<String, dynamic>>? adminValues;
      if (json['admin_values'] != null && json['admin_values'] is List) {
        adminValues = (json['admin_values'] as List)
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }

      return Observation(
        id: json['id'] ?? 0,
        latitude: lat,
        longitude: lon,
        description: json['description'],
        createdAt: json['created_at'] != null
            ? DateTime.parse(json['created_at'])
            : (json['timestamp'] != null ? DateTime.parse(json['timestamp']) : DateTime.now()),
        userId: json['user_id'] ?? json['user'] ?? json['creator'],
        fieldFormId: json['field_form'] ?? json['field_form_id'] ?? 0,
        data: parsedData,
        images: imageUrls,
        audios: audios,
        adminValues: adminValues,
        isMine: json['is_mine'] == true,
      );
    } catch (e) {
      debugPrint('Error parsing observation: $e');
      debugPrint('JSON: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'description': description,
      'field_form': fieldFormId,
      'data': data,
    };
  }
}
