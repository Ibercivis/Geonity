import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../utils/multilingual_utils.dart';
import '../config/app_config.dart';
class Project {
  final int id;
  final String name;
  final String? description;
  final String? coverImage;
  final String? organization;
  final int totalLikes;
  final int contributions;
  final bool isLiked;
  final List<int> topics;
  final bool isCreator;
  final bool isAdmin;
  final bool hasObservations;
  final String? postObservationMessage;
  final bool showPostMessage;
  final bool fuzzy;
  final int fuzzyResolution;
  final int? fieldFormId;
  final bool isGlobal;
  final List<String> countries;
  final bool isPrivate;
  final bool isMember;
  final bool isFinished;
  final bool isDraft;

  Project({
    required this.id,
    required this.name,
    this.description,
    this.coverImage,
    this.organization,
    this.totalLikes = 0,
    this.contributions = 0,
    this.isLiked = false,
    this.topics = const [],
    this.isCreator = false,
    this.isAdmin = false,
    this.hasObservations = false,
    this.postObservationMessage,
    this.showPostMessage = true,
    this.fuzzy = false,
    this.fuzzyResolution = 10,
    this.fieldFormId,
    this.isGlobal = true,
    this.countries = const [],
    this.isPrivate = false,
    this.isMember = false,
    this.isFinished = false,
    this.isDraft = false,
  });

  static List<String> _parseCountries(dynamic value) {
    if (value == null) return [];
    if (value is List) return value.map((e) => e.toString()).toList();
    if (value is String && value.isNotEmpty) {
      try {
        final decoded = jsonDecode(value);
        if (decoded is List) return decoded.map((e) => e.toString()).toList();
      } catch (_) {}
    }
    return [];
  }

  static String _getBaseUrl() => AppConfig.baseUrl;

  factory Project.fromJson(Map<String, dynamic> json) {
    String? coverImage;
    if (json['cover'] != null) {
      String? imagePath;
      
      // Manejar diferentes formatos de cover
      if (json['cover'] is String) {
        // Si cover es String directamente
        imagePath = json['cover'];
      } else if (json['cover'] is Map && json['cover']['image'] != null) {
        // Si cover es un objeto con key 'image'
        imagePath = json['cover']['image'];
      } else if (json['cover'] is List && json['cover'].isNotEmpty) {
        // Si cover es una lista (formato antiguo)
        imagePath = json['cover'][0]['image'];
      }
      
      if (imagePath != null && imagePath.isNotEmpty) {
        // Asegurar que siempre sea una URL completa
        if (imagePath.startsWith('http')) {
          coverImage = imagePath;
        } else {
          // Las imágenes vienen como /media/..., construir URL completa
          final cleanPath = imagePath.startsWith('/') ? imagePath : '/$imagePath';
          coverImage = '${_getBaseUrl()}$cleanPath';
        }
      }
    }

    // Parse topics safely
    List<int> topics = [];
    if (json['topic'] != null) {
      try {
        if (json['topic'] is List) {
          topics = List<int>.from(json['topic']);
        }
      } catch (e) {
        debugPrint('Error parsing topics: $e');
        topics = [];
      }
    }

    return Project(
      id: json['id'] ?? 0,
      name: localizedText(json['name']),
      description: localizedText(json['description']),
      coverImage: coverImage,
      organization: json['organizations'] != null && json['organizations'].isNotEmpty
          ? json['organizations'][0]['principalName']
          : null,
      totalLikes: json['total_likes'] ?? json['likes_count'] ?? 0,
      contributions: json['contributions'] ?? json['observation_count'] ?? 0,
      isLiked: json['is_liked_by_user'] ?? false,
      topics: topics,
      isCreator: json['is_creator'] ?? false,
      isAdmin: json['is_admin'] ?? false,
      hasObservations: json['has_observations'] ?? false,
      postObservationMessage: json['post_observation_message'] != null
          ? localizedText(json['post_observation_message'])
          : null,
      showPostMessage: json['show_post_message'] as bool? ?? true,
      fuzzy: (json['fuzzy'] ?? json['is_fuzzy']) as bool? ?? false,
      fuzzyResolution: json['fuzzy_resolution'] as int? ?? 10,
      fieldFormId: json['field_form'] as int?,
      isGlobal: json['is_global'] as bool? ?? true,
      countries: _parseCountries(json['countries']),
      isPrivate: json['is_private'] as bool? ?? false,
      isMember: json['is_member'] as bool? ?? false,
      isFinished: json['ended'] as bool? ?? false,
      isDraft: json['draft'] as bool? ?? false,
    );
  }

  static List<Project> getMockNewProjects() {
    return [
      Project(id: 1, name: 'prueba'),
      Project(id: 2, name: 'Tu Patrimonio\nIndustrial'),
      Project(id: 3, name: 'VIGILANTES\nVECINAL'),
      Project(id: 4, name: 'Mapa RSU'),
      Project(id: 5, name: 'Flood2Now'),
      Project(id: 6, name: 'Alaberga\nBihotza'),
    ];
  }

  static List<Project> getMockFeaturedProjects() {
    return [
      Project(
        id: 10,
        name: 'Vigilantes del Suelo',
        organization: 'Fundación Ibercivis',
        totalLikes: 62,
        contributions: 0,
        isLiked: false,
      ),
      Project(
        id: 11,
        name: 'Flood2Now Observa',
        organization: 'Fundación Ibercivis',
        totalLikes: 5,
        contributions: 38,
        isLiked: false,
      ),
    ];
  }

  static List<Project> getMockInterestingProjects() {
    return [
      Project(
        id: 20,
        name: 'ciencia\nciudadana y\nmúsic...',
        organization: 'Fundación Ibercivis',
      ),
      Project(
        id: 21,
        name: 'AmIAire',
        organization: 'Universidad de\nDeust...',
      ),
      Project(
        id: 22,
        name: 'Huer',
        organization: 'Sin org...',
      ),
    ];
  }
}
