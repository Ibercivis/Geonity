import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

import 'observation_service.dart';
import 'offline_service.dart';

/// Singleton service that auto-uploads pending offline observations
/// whenever connectivity is restored.
class SyncService extends ChangeNotifier with WidgetsBindingObserver {
  static final SyncService _instance = SyncService._internal();
  factory SyncService() => _instance;
  SyncService._internal();

  final _offlineService = OfflineService();
  final _observationService = ObservationService();

  // C3: Use a Completer-based lock to prevent concurrent sync runs.
  Completer<void>? _syncLock;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;

  int _pendingCount = 0;

  bool get isSyncing => _syncLock != null && !_syncLock!.isCompleted;
  int get pendingCount => _pendingCount;

  /// Call once from main() after app initialisation.
  void start() {
    if (kIsWeb) return;
    // C2: Register as a lifecycle observer so we sync on foreground resume.
    WidgetsBinding.instance.addObserver(this);

    // H6: Store the subscription so it can be cancelled by stop().
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final isOnline = !results.contains(ConnectivityResult.none);
      if (isOnline) {
        syncPendingObservations();
      }
    });

    // Refresh badge count and try an initial sync
    refreshPendingCount();
    syncPendingObservations();
  }

  /// Cancel the connectivity listener and remove lifecycle observer.
  void stop() {
    _connectivitySub?.cancel();
    _connectivitySub = null;
    WidgetsBinding.instance.removeObserver(this);
  }

  // C2: Trigger sync whenever the app returns to the foreground.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      refreshPendingCount();
      syncPendingObservations();
    }
  }

  Future<void> refreshPendingCount() async {
    if (kIsWeb) return;
    final count = await _offlineService.getPendingCount();
    if (count != _pendingCount) {
      _pendingCount = count;
      notifyListeners();
    }
  }

  /// Uploads every pending observation silently in the background.
  Future<void> syncPendingObservations() async {
    if (kIsWeb) return;
    // C3: Atomic lock — if already syncing, wait for it to finish then return.
    if (_syncLock != null && !_syncLock!.isCompleted) return;

    final pending = await _offlineService.getPendingObservations();
    if (pending.isEmpty) return;

    _syncLock = Completer<void>();
    notifyListeners();

    int synced = 0;
    try {
      for (final obs in pending) {
        // M3: Skip observations that have failed too many times.
        final attempts = obs['attempts'] as int? ?? 0;
        if (attempts >= 5) {
          debugPrint('SyncService: skipping observation ${obs['id']} after $attempts failed attempts');
          continue;
        }

        try {
          final data =
              jsonDecode(obs['data_json'] as String) as Map<String, dynamic>;
          final imagePathsRaw =
              jsonDecode(obs['image_paths_json'] as String) as Map<String, dynamic>;

          // Rebuild File references, skip any that were deleted
          final images = <String, List<File>>{};
          for (final entry in imagePathsRaw.entries) {
            final paths = (entry.value as List).cast<String>();
            final files =
                paths.map((p) => File(p)).where((f) => f.existsSync()).toList();
            if (files.isNotEmpty) {
              images[entry.key] = files;
            }
          }

          final audioPathsRaw =
              jsonDecode((obs['audio_paths_json'] as String?) ?? '{}')
                  as Map<String, dynamic>;
          final audios = <String, File>{};
          for (final entry in audioPathsRaw.entries) {
            final f = File(entry.value as String);
            if (f.existsSync()) audios[entry.key] = f;
          }

          final success = await _observationService.createObservation(
            fieldFormId: obs['field_form_id'] as int,
            latitude: obs['latitude'] as double,
            longitude: obs['longitude'] as double,
            data: data,
            images: images.isEmpty ? null : images,
            audios: audios.isEmpty ? null : audios,
          );

          if (success) {
            await _offlineService.removePendingObservation(obs['id'] as int);
            synced++;
          } else {
            await _offlineService.incrementAttempts(obs['id'] as int);
          }
        } catch (e) {
          debugPrint('Error syncing observation ${obs['id']}: $e');
          await _offlineService.incrementAttempts(obs['id'] as int);
        }
      }
    } finally {
      _syncLock!.complete();
      await refreshPendingCount();
      debugPrint('SyncService: synced $synced / ${pending.length} pending observations');
      notifyListeners();
    }
  }
}
