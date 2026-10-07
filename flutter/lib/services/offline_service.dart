import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

import '../models/observation_field.dart';

class OfflineService {
  static final OfflineService _instance = OfflineService._internal();
  factory OfflineService() => _instance;
  OfflineService._internal();

  static Database? _db;
  static const _dbName = 'geonity_offline.db';
  static const _dbVersion = 4;

  // M12: Cache the TileStore so it is not recreated on every call.
  static Future<TileStore>? _tileStoreFuture;
  static Future<TileStore> get _tileStore {
    _tileStoreFuture ??= TileStore.createDefault();
    return _tileStoreFuture!;
  }

  static Future<Database> get database async {
    if (kIsWeb) throw UnsupportedError('Offline DB not supported on web');
    _db ??= await _initDb();
    return _db!;
  }

  static Future<Database> _initDb() async {
    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, _dbName);
    return openDatabase(
      path,
      version: _dbVersion,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE offline_projects (
            project_id   INTEGER PRIMARY KEY,
            name         TEXT    NOT NULL,
            description  TEXT,
            cover_url    TEXT,
            field_form_id INTEGER,
            fields_json  TEXT    NOT NULL,
            downloaded_at TEXT   NOT NULL,
            post_observation_message TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE pending_observations (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            field_form_id  INTEGER NOT NULL,
            project_id     INTEGER NOT NULL,
            latitude       REAL    NOT NULL,
            longitude      REAL    NOT NULL,
            data_json      TEXT    NOT NULL,
            image_paths_json TEXT  NOT NULL,
            audio_paths_json TEXT  NOT NULL DEFAULT '{}',
            created_at     TEXT    NOT NULL,
            attempts       INTEGER DEFAULT 0
          )
        ''');
        // L1: Indexes for query performance
        await db.execute(
            'CREATE INDEX idx_pending_project ON pending_observations(project_id)');
        await db.execute(
            'CREATE INDEX idx_offline_project ON offline_projects(project_id)');
      },
      // H3: Run ALTER TABLE statements for each version step.
      onUpgrade: (db, oldVersion, newVersion) async {
        // Version 1→2: add indexes (no schema changes needed for existing tables)
        if (oldVersion < 2) {
          try {
            await db.execute(
                'CREATE INDEX IF NOT EXISTS idx_pending_project ON pending_observations(project_id)');
            await db.execute(
                'CREATE INDEX IF NOT EXISTS idx_offline_project ON offline_projects(project_id)');
          } catch (e) {
            debugPrint('DB upgrade v$oldVersion→$newVersion: $e');
          }
        }
        // Version 2→3: add post_observation_message column
        if (oldVersion < 3) {
          try {
            await db.execute(
                'ALTER TABLE offline_projects ADD COLUMN post_observation_message TEXT');
          } catch (e) {
            debugPrint('DB upgrade v$oldVersion→$newVersion: $e');
          }
        }
        // Version 3→4: add audio_paths_json column to pending_observations
        if (oldVersion < 4) {
          try {
            await db.execute(
                "ALTER TABLE pending_observations ADD COLUMN audio_paths_json TEXT NOT NULL DEFAULT '{}'");
          } catch (e) {
            debugPrint('DB upgrade v$oldVersion→$newVersion: $e');
          }
        }
      },
    );
  }

  // ─── Offline Projects ──────────────────────────────────────────────────────

  Future<void> saveProjectOffline({
    required int projectId,
    required String name,
    String? description,
    String? coverUrl,
    required int fieldFormId,
    required List<ObservationField> fields,
    String? postObservationMessage,
  }) async {
    if (kIsWeb) return;
    final db = await database;
    final fieldsJson = jsonEncode(fields
        .map((f) => {
              'id': f.id,
              'projectId': f.projectId,
              'key': f.key,
              'label': f.label,
              'fieldType': f.fieldType,
              'required': f.required,
              'choices': f.choices,
              'choiceValues': f.choiceValues,
              'order': f.order,
              'helpText': f.helpText,
              'allowOther': f.allowOther,
            })
        .toList());

    await db.insert(
      'offline_projects',
      {
        'project_id': projectId,
        'name': name,
        'description': description ?? '',
        'cover_url': coverUrl ?? '',
        'field_form_id': fieldFormId,
        'fields_json': fieldsJson,
        'downloaded_at': DateTime.now().toIso8601String(),
        'post_observation_message': postObservationMessage ?? '',
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<bool> isProjectOffline(int projectId) async {
    if (kIsWeb) return false;
    final db = await database;
    final result = await db.query(
      'offline_projects',
      where: 'project_id = ?',
      whereArgs: [projectId],
      limit: 1,
    );
    return result.isNotEmpty;
  }

  Future<Map<String, dynamic>?> getOfflineProject(int projectId) async {
    if (kIsWeb) return null;
    final db = await database;
    final result = await db.query(
      'offline_projects',
      where: 'project_id = ?',
      whereArgs: [projectId],
      limit: 1,
    );
    if (result.isEmpty) return null;
    return result.first;
  }

  Future<List<ObservationField>> getOfflineFields(int projectId) async {
    if (kIsWeb) return [];
    final project = await getOfflineProject(projectId);
    if (project == null) return [];
    final List<dynamic> decoded =
        jsonDecode(project['fields_json'] as String);
    return decoded
        .map((f) => ObservationField(
              id: f['id'] as int,
              projectId: f['projectId'] as int,
              key: f['key'] as String,
              label: f['label'] as String,
              fieldType: f['fieldType'] as String,
              required: f['required'] as bool,
              choices: f['choices'] != null
                  ? List<String>.from(f['choices'] as List)
                  : null,
              choiceValues: f['choiceValues'] != null
                  ? List<String>.from(f['choiceValues'] as List)
                  : null,
              order: f['order'] as int,
              helpText: f['helpText'] as String,
              allowOther: f['allowOther'] as bool? ?? false,
            ))
        .toList();
  }

  Future<List<int>> getOfflineProjectIds() async {
    if (kIsWeb) return [];
    final db = await database;
    final result =
        await db.query('offline_projects', columns: ['project_id']);
    return result.map((r) => r['project_id'] as int).toList();
  }

  Future<void> removeProjectOffline(int projectId) async {
    if (kIsWeb) return;
    final db = await database;
    await db.delete(
      'offline_projects',
      where: 'project_id = ?',
      whereArgs: [projectId],
    );
  }

  // ─── Mapbox Tile Download ──────────────────────────────────────────────────

  /// Downloads Mapbox tiles for the user's local area (shared across all projects).
  /// Uses a single region key 'user-local-area' to avoid duplicating tiles.
  /// Throws an exception on failure so callers can show an error to the user.
  Future<void> downloadMapTiles({
    required double minLat,
    required double minLng,
    required double maxLat,
    required double maxLng,
    void Function(double progress)? onProgress,
  }) async {
    if (kIsWeb) return;
    // C4: Let exceptions propagate so the caller can show feedback.
    final tileStore = await _tileStore;

    final geometry = {
      'type': 'Polygon',
      'coordinates': [
        [
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat],
        ]
      ],
    };

    await tileStore.loadTileRegion(
      'user-local-area',
      TileRegionLoadOptions(
        geometry: geometry,
        descriptorsOptions: [
          TilesetDescriptorOptions(
            styleURI: MapboxStyles.MAPBOX_STREETS,
            minZoom: 3,
            maxZoom: 10,
          ),
        ],
        metadata: {},
        acceptExpired: true,
        networkRestriction: NetworkRestriction.NONE,
      ),
      (progress) {
        final total = progress.requiredResourceCount == 0
            ? 1
            : progress.requiredResourceCount;
        onProgress?.call(progress.completedResourceCount / total);
      },
    );
    debugPrint('Map tiles downloaded (user-local-area, zoom 3-10)');
  }

  Future<void> removeMapTiles(int projectId) async {
    if (kIsWeb) return;
    try {
      final tileStore = await _tileStore;
      await tileStore.removeRegion('project-$projectId');
    } catch (e) {
      debugPrint('Error removing map tiles: $e');
    }
  }

  // ─── Pending Observations ─────────────────────────────────────────────────

  /// Copies image files to permanent app storage and returns the new paths.
  Future<List<String>> _copyImagesToPermanentStorage(
      List<File> images, int projectId) async {
    final dir = await getApplicationDocumentsDirectory();
    final destDir =
        Directory('${dir.path}/offline_images/$projectId');
    if (!await destDir.exists()) {
      await destDir.create(recursive: true);
    }
    final paths = <String>[];
    for (final image in images) {
      // C5: Wrap each copy in try/catch to handle permission or missing-file errors.
      try {
        final filename =
            '${DateTime.now().microsecondsSinceEpoch}_${p.basename(image.path)}';
        final dest = File('${destDir.path}/$filename');
        await image.copy(dest.path);
        paths.add(dest.path);
      } catch (e) {
        debugPrint('Failed to copy image ${image.path}: $e');
        // Skip this image but continue with others.
      }
    }
    return paths;
  }

  /// Copies one audio file per question to permanent app storage.
  Future<String?> _copyAudioToPermanentStorage(
      File audio, int projectId) async {
    final dir = await getApplicationDocumentsDirectory();
    final destDir = Directory('${dir.path}/offline_audios/$projectId');
    if (!await destDir.exists()) {
      await destDir.create(recursive: true);
    }
    try {
      final filename =
          '${DateTime.now().microsecondsSinceEpoch}_${p.basename(audio.path)}';
      final dest = File('${destDir.path}/$filename');
      await audio.copy(dest.path);
      return dest.path;
    } catch (e) {
      debugPrint('Failed to copy audio ${audio.path}: $e');
      return null;
    }
  }

  Future<int> enqueueObservation({
    required int fieldFormId,
    required int projectId,
    required double latitude,
    required double longitude,
    required Map<String, dynamic> data,
    Map<String, List<File>>? images,
    Map<String, File>? audios,
  }) async {
    if (kIsWeb) return -1;
    final db = await database;

    // Copy images to permanent storage so they survive cache clears
    final imagePathsMap = <String, List<String>>{};
    if (images != null) {
      for (final entry in images.entries) {
        imagePathsMap[entry.key] =
            await _copyImagesToPermanentStorage(entry.value, projectId);
      }
    }

    // Copy audios (1 per question) to permanent storage
    final audioPathsMap = <String, String>{};
    if (audios != null) {
      for (final entry in audios.entries) {
        final path = await _copyAudioToPermanentStorage(entry.value, projectId);
        if (path != null) audioPathsMap[entry.key] = path;
      }
    }

    final id = await db.insert('pending_observations', {
      'field_form_id': fieldFormId,
      'project_id': projectId,
      'latitude': latitude,
      'longitude': longitude,
      'data_json': jsonEncode(data),
      'image_paths_json': jsonEncode(imagePathsMap),
      'audio_paths_json': jsonEncode(audioPathsMap),
      'created_at': DateTime.now().toIso8601String(),
      'attempts': 0,
    });

    return id;
  }

  Future<List<Map<String, dynamic>>> getPendingObservations() async {
    if (kIsWeb) return [];
    final db = await database;
    return db.query('pending_observations', orderBy: 'created_at ASC');
  }

  Future<void> removePendingObservation(int id) async {
    if (kIsWeb) return;
    final db = await database;
    await db.delete(
      'pending_observations',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> incrementAttempts(int id) async {
    if (kIsWeb) return;
    final db = await database;
    await db.rawUpdate(
      'UPDATE pending_observations SET attempts = attempts + 1 WHERE id = ?',
      [id],
    );
  }

  Future<int> getPendingCount() async {
    if (kIsWeb) return 0;
    final db = await database;
    final result = await db
        .rawQuery('SELECT COUNT(*) as count FROM pending_observations');
    return (result.first['count'] as int?) ?? 0;
  }
}
