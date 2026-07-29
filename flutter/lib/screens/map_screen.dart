import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:provider/provider.dart';
import '../models/observation.dart';
import '../widgets/audio_player_tile.dart';
import 'package:audioplayers/audioplayers.dart';
import '../utils/multilingual_utils.dart';
import '../models/field_form.dart';
import '../models/observation_field.dart';
import '../l10n/app_localizations.dart';
import '../services/connection_helper.dart';
import '../services/observation_service.dart';
import '../services/offline_service.dart';
import '../services/project_service.dart';
import '../services/sync_service.dart';
import 'add_observation_screen.dart';

class MapScreen extends StatefulWidget {
  final int projectId;
  final String projectName;
  final String? postObservationMessage;
  final bool showPostMessage;
  final bool isPrivate;
  final bool isMember;
  final bool isFinished;

  const MapScreen({
    super.key,
    required this.projectId,
    required this.projectName,
    this.postObservationMessage,
    this.showPostMessage = true,
    this.isPrivate = false,
    this.isMember = false,
    this.isFinished = false,
  });

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final _observationService = ObservationService();
  final _offlineService = OfflineService();
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  List<Observation> _observations = [];
  FieldForm? _fieldForm;
  Map<String, ObservationField> _fieldsById = {};
  bool _isLoading = true;
  bool _isOfflineMode = false;
  MapboxMap? _mapboxMap;
  bool _styleLoaded = false;
  bool _isSatelliteView = false;
  String? _postObservationMessage;
  bool _isFuzzy = false;
  String? _hexGeoJson;
  int _totalCount = 0;
  bool _showOnlyMine = false;
  List<Observation> _myObservations = [];
  bool _myObservationsLoaded = false;
  int? _lastHexFieldFormId;
  int _lastHexH3Resolution = -1;
  Timer? _hexDebounce;
  bool _markersUpdating = false;
  bool _markersPending = false;
  bool _isLoadingObservation = false;

  List<Observation> get _filteredObservations =>
      _showOnlyMine ? _myObservations : _observations;

  @override
  void initState() {
    super.initState();
    _postObservationMessage = widget.postObservationMessage;
    if (widget.isPrivate && !widget.isMember) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _showPasswordDialog());
    } else {
      _loadMapData();
    }
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final isOnline = !results.contains(ConnectivityResult.none);
      if (isOnline && _isOfflineMode) {
        _loadMapData();
      }
    });
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    _hexDebounce?.cancel();
    super.dispose();
  }

  Future<void> _showPasswordDialog() async {
    final l10n = AppLocalizations.of(context)!;
    final controller = TextEditingController();
    bool obscure = true;

    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.lock, color: Colors.red),
              const SizedBox(width: 8),
              Text(l10n.privateProject),
            ],
          ),
          content: TextField(
            controller: controller,
            obscureText: obscure,
            autofocus: true,
            decoration: InputDecoration(
              labelText: l10n.loginPasswordLabel,
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                onPressed: () => setS(() => obscure = !obscure),
              ),
            ),
            onSubmitted: (_) => Navigator.pop(ctx, true),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(l10n.cancel),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(l10n.accept),
            ),
          ],
        ),
      ),
    );

    if (!mounted) {
      controller.dispose();
      return;
    }

    if (confirmed != true) {
      controller.dispose();
      Navigator.pop(context);
      return;
    }

    final valid = await ProjectService().validatePassword(widget.projectId, controller.text);

    controller.dispose();

    if (!mounted) return;

    if (valid) {
      _loadMapData();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.projectPasswordWrong),
          backgroundColor: Colors.red,
        ),
      );
      Navigator.pop(context);
    }
  }

  Future<void> _loadMapData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    final isOnline = await ConnectionHelper.hasInternetConnection();

    if (isOnline) {
      // ── Online: load from API ──────────────────────────────────────────────
      try {
        final project = await _observationService.getProject(widget.projectId);

        if (project != null && project.fieldFormId != null) {
          final fieldFormId = project.fieldFormId!;
          debugPrint('[MapScreen] project.fuzzy=${project.fuzzy}  project.fuzzyResolution=${project.fuzzyResolution}  fieldFormId=$fieldFormId');

          final questions =
              await _observationService.getFieldFormQuestions(fieldFormId);
          _fieldsById = {
            for (var field in questions) field.id.toString(): field
          };

          if (project.fuzzy) {
            // ── Fuzzy mode: fetch hex GeoJSON + mis observaciones ─────────────
            const initialZoom = 6; // matches the map's starting zoom
            final results = await Future.wait([
              _observationService.getHexObservations(fieldFormId, zoom: initialZoom),
              _observationService.getMyObservationsForFieldForm(fieldFormId),
            ]);
            final hexGeoJson = results[0] as String;
            final myObs = results[1] as List<Observation>;

            final decoded = jsonDecode(hexGeoJson) as Map<String, dynamic>;
            final features = decoded['features'] as List<dynamic>;
            final total = features.fold<int>(
                0, (s, f) => s + (f['properties']['count'] as int? ?? 1));

            if (!mounted) return;
            setState(() {
              _fieldForm = FieldForm(
                  id: fieldFormId, name: '', projectId: widget.projectId);
              _isFuzzy = true;
              _hexGeoJson = hexGeoJson;
              _totalCount = total;
              _observations = [];
              _myObservations = myObs;
              _myObservationsLoaded = true;
              _showOnlyMine = false;
              _isOfflineMode = false;
              _isLoading = false;
              _lastHexFieldFormId = fieldFormId;
              _lastHexH3Resolution = _zoomToH3Resolution(initialZoom.toDouble());
            });
          } else {
            // ── Normal mode: puntos ligeros del mapa ──────────────────────────
            final observations =
                await _observationService.getMapObservations(fieldFormId);

            // Also append any locally-pending observations not yet synced
            final allPending = await _offlineService.getPendingObservations();
            final pendingObs = allPending
                .where((row) => row['project_id'] == widget.projectId)
                .map(_pendingRowToObservation)
                .toList();

            if (!mounted) return;
            setState(() {
              _fieldForm = FieldForm(
                  id: fieldFormId, name: '', projectId: widget.projectId);
              _isFuzzy = false;
              _observations = [...observations, ...pendingObs];
              _totalCount = _observations.length;
              _myObservations = [];
              _myObservationsLoaded = false;
              _showOnlyMine = false;
              _isOfflineMode = false;
              _isLoading = false;
            });
          }

          if (_mapboxMap != null && _styleLoaded) await _addMarkersToMap();
          return;
        }
      } catch (e) {
        debugPrint('Error loading map data online: $e');
      }
    }

    // ── Offline fallback: load from local SQLite ───────────────────────────
    final offlineProject =
        await _offlineService.getOfflineProject(widget.projectId);
    if (!mounted) return;
    if (offlineProject != null) {
      final fieldFormId = offlineProject['field_form_id'] as int;
      final fields = await _offlineService.getOfflineFields(widget.projectId);

      // Load pending observations queued for this project
      final allPending = await _offlineService.getPendingObservations();
      final pendingObs = allPending
          .where((row) => row['project_id'] == widget.projectId)
          .map(_pendingRowToObservation)
          .toList();

      if (!mounted) return;
      setState(() {
        _fieldForm =
            FieldForm(id: fieldFormId, name: '', projectId: widget.projectId);
        _fieldsById = {for (var f in fields) f.id.toString(): f};
        _isFuzzy = false;
        _observations = pendingObs;
        _totalCount = pendingObs.length;
        _myObservations = [];
        _myObservationsLoaded = false;
        _showOnlyMine = false;
        _isOfflineMode = true;
        _isLoading = false;
        final msg = localizedText(offlineProject['post_observation_message']);
        if (msg.isNotEmpty) {
          _postObservationMessage = msg;
        }
      });

      if (_mapboxMap != null) await _addMarkersToMap();
    } else {
      setState(() => _isLoading = false);
    }
  }

  /// Converts a SQLite pending_observations row into an [Observation].
  Observation _pendingRowToObservation(Map<String, dynamic> row) {
    final imagePathsMap = Map<String, dynamic>.from(
        jsonDecode(row['image_paths_json'] as String) as Map);
    // Flatten all local image paths across all field keys into one list
    final imagePaths = <String>[];
    for (final paths in imagePathsMap.values) {
      if (paths is List) imagePaths.addAll(paths.cast<String>());
    }
    return Observation(
      id: -(row['id'] as int), // negative to distinguish from server obs
      latitude: row['latitude'] as double,
      longitude: row['longitude'] as double,
      createdAt: DateTime.parse(row['created_at'] as String),
      fieldFormId: row['field_form_id'] as int,
      data: Map<String, dynamic>.from(
          jsonDecode(row['data_json'] as String) as Map),
      images: imagePaths.isEmpty ? null : imagePaths,
      isMine: true,
    );
  }

  /// Renders a single image: local file path or remote URL.
  Widget _buildImage(String path, {double size = 100}) {
    final isLocal = path.startsWith('/');
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: isLocal
          ? Image.file(File(path),
              width: size, height: size, fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _imagePlaceholder(size))
          : CachedNetworkImage(
              imageUrl: path,
              width: size,
              height: size,
              fit: BoxFit.cover,
              errorWidget: (_, __, ___) => _imagePlaceholder(size)),
    );
  }

  Widget _imagePlaceholder(double size) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      width: size,
      height: size,
      color: colorScheme.surfaceContainerHighest,
      child: Icon(Icons.image_not_supported, color: colorScheme.onSurfaceVariant),
    );
  }

  Future<void> _addMarkersToMap() async {
    if (_mapboxMap == null) return;

    // Prevent concurrent executions — queue at most one pending run
    if (_markersUpdating) {
      _markersPending = true;
      return;
    }
    _markersUpdating = true;
    _markersPending = false;

    try {
      await _addMarkersToMapInternal();
    } finally {
      _markersUpdating = false;
      if (_markersPending) {
        // A newer update arrived while we were running — execute it now
        _markersPending = false;
        unawaited(_addMarkersToMap());
      }
    }
  }

  Future<void> _addMarkersToMapInternal() async {
    if (_mapboxMap == null) return;
    // En fuzzy mode mostramos hex, salvo cuando el toggle "solo las mías" está activo
    final useHex = _isFuzzy && !_showOnlyMine;
    if (!useHex && _filteredObservations.isEmpty) return;
    if (useHex && _hexGeoJson == null) return;

    // Remove existing layers/sources (refresh-safe)
    for (final id in [
      'hex-count', 'hex-outline', 'hex-fill',
      'cluster-count', 'clusters', 'unclustered-point',
    ]) {
      try { await _mapboxMap!.style.removeStyleLayer(id); } catch (_) {}
    }
    for (final id in ['observations', 'hex-polygons']) {
      try { await _mapboxMap!.style.removeStyleSource(id); } catch (_) {}
    }

    if (useHex) {
      await _addHexMarkersToMap();
    } else {
      await _addPointMarkersToMap();
    }

    _registerMapInteractions();
  }

  /// Renders the Material location_on icon and registers it as a Mapbox style image.
  Future<void> _registerPinImage({Color color = Colors.red}) async {
    const int size = 96;

    final recorder = ui.PictureRecorder();
    final canvas = ui.Canvas(recorder, Rect.fromLTWH(0, 0, size.toDouble(), size.toDouble()));

    final textPainter = TextPainter(textDirection: TextDirection.ltr)
      ..text = TextSpan(
        text: String.fromCharCode(Icons.location_on.codePoint),
        style: TextStyle(
          fontSize: size.toDouble(),
          fontFamily: Icons.location_on.fontFamily,
          package: Icons.location_on.fontPackage,
          color: color,
        ),
      )
      ..layout();
    textPainter.paint(canvas, Offset.zero);

    final picture = recorder.endRecording();
    final image = await picture.toImage(size, size);
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    final bytes = Uint8List.view(byteData!.buffer);

    await _mapboxMap!.style.addStyleImage(
      'pin-marker',
      2.0,
      MbxImage(width: size, height: size, data: bytes),
      false,
      [],
      [],
      null,
    );
  }

  Future<void> _addPointMarkersToMap() async {
    final features = _filteredObservations.map((obs) => {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [obs.longitude, obs.latitude],
      },
      'properties': {'id': obs.id},
    }).toList();

    try {
      debugPrint('Adding ${_filteredObservations.length} observations to map');

      await _registerPinImage();

      await _mapboxMap!.style.addSource(
        GeoJsonSource(
          id: 'observations',
          data: jsonEncode({'type': 'FeatureCollection', 'features': features}),
          cluster: true,
          clusterRadius: 50,
          clusterMaxZoom: 14,
        ),
      );

      await _mapboxMap!.style.addLayer(
        CircleLayer(
          id: 'clusters',
          sourceId: 'observations',
          filter: ['has', 'point_count'],
          circleColorExpression: [
            'step', ['get', 'point_count'],
            '#51bbd6', 100, '#f1f075', 750, '#f28cb1',
          ],
          circleRadiusExpression: [
            'step', ['get', 'point_count'],
            20, 100, 30, 750, 40,
          ],
          circleOpacity: 0.85,
        ),
      );

      await _mapboxMap!.style.addLayer(
        SymbolLayer(
          id: 'cluster-count',
          sourceId: 'observations',
          filter: ['has', 'point_count'],
          textField: "{point_count_abbreviated}",
          textSize: 14.0,
          textColor: Colors.white.value,
        ),
      );

      await _mapboxMap!.style.addLayer(
        SymbolLayer(
          id: 'unclustered-point',
          sourceId: 'observations',
          filter: ['!', ['has', 'point_count']],
          iconImage: 'pin-marker',
          iconSize: 1.0,
          iconAnchor: IconAnchor.BOTTOM,
          iconAllowOverlap: true,
        ),
      );

      debugPrint('Point markers with clustering added successfully');
    } catch (e) {
      debugPrint('Error adding point markers: $e');
    }
  }

  Future<void> _addHexMarkersToMap() async {
    try {
      debugPrint('[HEX] start, geoJson length=${_hexGeoJson?.length}');

      final decoded = jsonDecode(_hexGeoJson!) as Map<String, dynamic>;
      final features = decoded['features'] as List<dynamic>;
      debugPrint('[HEX] features count: ${features.length}');
      if (features.isEmpty) return;

      // Build polygon features from hex_polygon property.
      // Backend already sends GeoJSON-compliant [lng, lat] — no swap needed.
      final polygonFeatures = <Map<String, dynamic>>[];
      for (final f in features) {
        final props = Map<String, dynamic>.from(
            (f as Map<String, dynamic>)['properties'] as Map<String, dynamic>);
        final hexPolygon = props['hex_polygon'];
        if (hexPolygon == null) continue;

        final ring = List<dynamic>.from(hexPolygon as List<dynamic>);
        // GeoJSON Polygon ring must be closed (last == first)
        if (ring.first.toString() != ring.last.toString()) {
          ring.add(ring.first);
        }

        polygonFeatures.add({
          'type': 'Feature',
          'geometry': {'type': 'Polygon', 'coordinates': [ring]},
          'properties': props,
        });
      }
      debugPrint('[HEX] polygon features: ${polygonFeatures.length}');

      await _mapboxMap!.style.addSource(
        GeoJsonSource(
          id: 'hex-polygons',
          data: jsonEncode({'type': 'FeatureCollection', 'features': polygonFeatures}),
          cluster: false,
        ),
      );

      // Fill — color by count: blue → orange → red
      await _mapboxMap!.style.addLayer(
        FillLayer(
          id: 'hex-fill',
          sourceId: 'hex-polygons',
          fillColorExpression: [
            'step', ['get', 'count'],
            '#4FC3F7',   // 1–9    light blue
            10,  '#29B6F6',  // 10–49  blue
            50,  '#FFA726',  // 50–99  orange
            100, '#EF5350',  // 100+   red
          ],
          fillOpacity: 0.6,
        ),
      );

      // Outline
      await _mapboxMap!.style.addLayer(
        LineLayer(
          id: 'hex-outline',
          sourceId: 'hex-polygons',
          lineColor: Colors.white.value,
          lineWidth: 1.0,
          lineOpacity: 0.8,
        ),
      );

      // Count label in the center of each hexagon
      await _mapboxMap!.style.addLayer(
        SymbolLayer(
          id: 'hex-count',
          sourceId: 'hex-polygons',
          textField: '{count}',
          textSize: 13.0,
          textColor: Colors.white.value,
          textHaloColor: const Color(0x66000000).value,
          textHaloWidth: 1.0,
          textAllowOverlap: true,
          textIgnorePlacement: true,
        ),
      );

      debugPrint('[HEX] all layers added successfully');
    } catch (e, st) {
      debugPrint('[HEX] ERROR: $e\n$st');
    }
  }

  /// Maps Mapbox zoom level to H3 resolution, matching the server-side logic.
  int _zoomToH3Resolution(double zoom) {
    if (zoom <= 2) return 1;
    if (zoom <= 4) return 2;
    if (zoom <= 6) return 3;
    if (zoom <= 8) return 4;
    if (zoom <= 10) return 5;
    return 6;
  }

  /// Called whenever the camera changes. Re-fetches hex data only when the
  /// H3 resolution would change (avoids excessive API calls during panning).
  void _onCameraChanged(CameraChangedEventData data) {
    if (!_isFuzzy || _lastHexFieldFormId == null) return;
    _hexDebounce?.cancel();
    _hexDebounce = Timer(const Duration(milliseconds: 600), () async {
      if (_mapboxMap == null) return;
      final camera = await _mapboxMap!.getCameraState();
      final newResolution = _zoomToH3Resolution(camera.zoom);
      if (newResolution == _lastHexH3Resolution) return;

      debugPrint('[MapScreen] H3 resolution changed $_lastHexH3Resolution → $newResolution (zoom ${camera.zoom.toStringAsFixed(1)})');
      try {
        final hexGeoJson = await _observationService.getHexObservations(
          _lastHexFieldFormId!,
          zoom: camera.zoom.toInt(),
        );
        final decoded = jsonDecode(hexGeoJson) as Map<String, dynamic>;
        final features = decoded['features'] as List<dynamic>;
        final total = features.fold<int>(
            0, (s, f) => s + (f['properties']['count'] as int? ?? 1));

        if (!mounted) return;
        setState(() {
          _hexGeoJson = hexGeoJson;
          _totalCount = total;
          _lastHexH3Resolution = newResolution;
        });
        if (_mapboxMap != null && _styleLoaded) await _addMarkersToMap();
      } catch (e) {
        debugPrint('[MapScreen] Error refreshing hex at zoom ${camera.zoom}: $e');
      }
    });
  }

  void _onMapCreated(MapboxMap mapboxMap) {
    _mapboxMap = mapboxMap;
    _styleLoaded = false; // style not ready yet — wait for onStyleLoaded
  }

  void _registerMapInteractions() {
    // Interactions are handled via onTapListener on the MapWidget
  }

  Future<void> _onMapTap(MapContentGestureContext gestureContext) async {
    if (_mapboxMap == null || _isLoadingObservation) return;

    final screenCoord = gestureContext.touchPosition;
    final geometry = RenderedQueryGeometry.fromScreenBox(ScreenBox(
      min: ScreenCoordinate(x: screenCoord.x - 20, y: screenCoord.y - 20),
      max: ScreenCoordinate(x: screenCoord.x + 20, y: screenCoord.y + 20),
    ));

    final useHex = _isFuzzy && !_showOnlyMine;
    final layerIds = useHex ? ['hex-fill'] : ['unclustered-point'];

    final features = await _mapboxMap!.queryRenderedFeatures(
      geometry,
      RenderedQueryOptions(layerIds: layerIds),
    );

    if (features.isEmpty) return;

    final featureMap = features.first?.queriedFeature.feature;
    if (featureMap == null) return;
    final props = featureMap['properties'] as Map<Object?, Object?>?;
    if (props == null) return;

    if (useHex) {
      final count = props['count'];
      _showHexDetails(count is int ? count : int.tryParse(count?.toString() ?? '') ?? 0);
    } else {
      final observationId = props['id'];
      final id = observationId is int ? observationId : int.tryParse(observationId?.toString() ?? '');
      if (id == null) return;

      // Buscar en la lista activa (mine o all)
      final pool = _showOnlyMine ? _myObservations : _observations;
      final cached = pool.where((o) => o.id == id).firstOrNull;

      if (cached != null && cached.data != null) {
        // Observación completa ya en memoria (mine/ o pendiente offline)
        _showObservationDetails(cached);
      } else {
        // Observación sintética (del endpoint /map/) — fetch detalle completo
        setState(() => _isLoadingObservation = true);
        try {
          final detail = await _observationService.getObservationDetail(id);
          if (detail != null && mounted) _showObservationDetails(detail);
        } finally {
          if (mounted) setState(() => _isLoadingObservation = false);
        }
      }
    }
  }

  void _onStyleLoaded(StyleLoadedEventData _) {
    _styleLoaded = true;
    if (_observations.isNotEmpty || (_isFuzzy && _hexGeoJson != null)) {
      _addMarkersToMap();
    }
  }

  Future<void> _addObservationWithCurrentLocation() async {
    // Mostrar modal inmediatamente con loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text(AppLocalizations.of(context)!.mapGettingLocation),
              ],
            ),
          ),
        ),
      ),
    );

    try {
      // Verificar permisos de ubicación
      bool serviceEnabled = await geo.Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) {
          Navigator.pop(context); // Cerrar loading
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(AppLocalizations.of(context)!.mapLocationServicesDisabled)),
          );
        }
        return;
      }

      geo.LocationPermission permission = await geo.Geolocator.checkPermission();
      if (permission == geo.LocationPermission.denied) {
        permission = await geo.Geolocator.requestPermission();
        if (permission == geo.LocationPermission.denied) {
          if (mounted) {
            Navigator.pop(context); // Cerrar loading
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(AppLocalizations.of(context)!.mapLocationPermissionDenied)),
            );
          }
          return;
        }
      }

      if (permission == geo.LocationPermission.deniedForever) {
        if (mounted) {
          Navigator.pop(context); // Cerrar loading
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(AppLocalizations.of(context)!.mapLocationPermissionPermanentlyDenied),
            ),
          );
        }
        return;
      }

      // Obtener ubicación actual
      geo.Position position = await geo.Geolocator.getCurrentPosition();
      
      if (mounted) {
        Navigator.pop(context); // Cerrar loading
        _addObservationAtLocation(position.latitude, position.longitude);
      }
    } catch (e) {
      debugPrint('Error getting location: $e');
      if (mounted) {
        Navigator.pop(context); // Cerrar loading
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.mapLocationError(e.toString()))),
        );
      }
    }
  }
  Future<void> _addObservationAtLocation(double latitude, double longitude) async {
    if (_fieldForm == null) return;

    // Obtener los campos del formulario
    final fields = _fieldsById.values.toList()..sort((a, b) => (a.order ?? 0).compareTo(b.order ?? 0));

    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => AddObservationScreen(
          fieldFormId: _fieldForm!.id,
          projectId: widget.projectId,
          latitude: latitude,
          longitude: longitude,
          fields: fields,
          postObservationMessage: _postObservationMessage,
          showPostMessage: widget.showPostMessage,
        ),
      ),
    );

    // Si se creó la observación, recargar el mapa
    if (result == true) {
      _loadMapData();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  widget.projectName,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
                if (_isOfflineMode) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.orange,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'OFFLINE',
                      style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ],
            ),
            Consumer<SyncService>(
              builder: (context, sync, _) {
                final pending = sync.pendingCount;
                return Text(
                  _isOfflineMode
                      ? (pending > 0 ? l10n.offlinePendingBadge(pending) : l10n.offlineModeBadge)
                      : '$_totalCount observaciones'
                          '${pending > 0 ? ' · $pending pendientes' : ''}',
                  style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant),
                );
              },
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadMapData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _fieldForm == null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.map_outlined, size: 80, color: colorScheme.onSurfaceVariant),
                        const SizedBox(height: 16),
                        Text(
                          AppLocalizations.of(context)!.noObservationMap,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'El proyecto no cuenta con un formulario de campo configurado para registrar observaciones.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 14, color: colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                )
              : Stack(
                  children: [
                    MapWidget(
                      cameraOptions: CameraOptions(
                        center: Point(coordinates: _initialPosition()),
                        zoom: 6.0,
                      ),
                      styleUri: Theme.of(context).brightness == Brightness.dark
                          ? MapboxStyles.DARK
                          : MapboxStyles.MAPBOX_STREETS,
                      onMapCreated: _onMapCreated,
                      onStyleLoadedListener: _onStyleLoaded,
                      onTapListener: _onMapTap,
                      onCameraChangeListener: _onCameraChanged,
                    ),
                    
                    // Indicador de carga al tocar un marker
                    if (_isLoadingObservation)
                      Positioned.fill(
                        child: ColoredBox(
                          color: Colors.black12,
                          child: const Center(child: CircularProgressIndicator()),
                        ),
                      ),

                    // Botón para filtrar mis observaciones (normal y fuzzy)
                    if (!_isOfflineMode)
                      Positioned(
                        top: 120,
                        right: 16,
                        child: Material(
                          color: _showOnlyMine ? Colors.blue[700] : colorScheme.surface,
                          borderRadius: BorderRadius.circular(8),
                          elevation: 4,
                          child: InkWell(
                            onTap: () async {
                              final newValue = !_showOnlyMine;
                              // En modo normal, cargar mine/ la primera vez que se activa
                              if (newValue && !_myObservationsLoaded && !_isFuzzy) {
                                final myObs = await _observationService
                                    .getMyObservationsForFieldForm(_fieldForm!.id);
                                if (!mounted) return;
                                setState(() {
                                  _myObservations = myObs;
                                  _myObservationsLoaded = true;
                                  _showOnlyMine = newValue;
                                });
                              } else {
                                setState(() => _showOnlyMine = newValue);
                              }
                              await _addMarkersToMap();
                            },
                            borderRadius: BorderRadius.circular(8),
                            child: Padding(
                              padding: const EdgeInsets.all(8),
                              child: Icon(
                                Icons.person_pin,
                                size: 24,
                                color: _showOnlyMine ? Colors.white : Colors.blue[700],
                              ),
                            ),
                          ),
                        ),
                      ),

                    // Botón para cambiar vista
                    Positioned(
                      top: 68,
                      right: 16,
                      child: Material(
                        color: colorScheme.surface,
                        borderRadius: BorderRadius.circular(8),
                        elevation: 4,
                        child: InkWell(
                          onTap: () async {
                            final newSatellite = !_isSatelliteView;
                            setState(() => _isSatelliteView = newSatellite);
                            if (_mapboxMap == null) return;
                            final isDark = Theme.of(context).brightness == Brightness.dark;
                            final styleUri = newSatellite
                                ? MapboxStyles.SATELLITE_STREETS
                                : (isDark ? MapboxStyles.DARK : MapboxStyles.MAPBOX_STREETS);
                            _styleLoaded = false;
                            await _mapboxMap!.loadStyleURI(styleUri);
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Padding(
                            padding: const EdgeInsets.all(8),
                            child: Icon(
                              _isSatelliteView ? Icons.map : Icons.satellite,
                              size: 24,
                              color: Colors.blue[700],
                            ),
                          ),
                        ),
                      ),
                    ),
                    
                    // Contador de observaciones en la parte superior
                    if (_totalCount > 0)
                      Positioned(
                        top: 16,
                        right: 16,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: colorScheme.surface,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.pin_drop, color: Colors.blue[700], size: 20),
                              const SizedBox(width: 8),
                              Text(
                                '${_showOnlyMine ? _filteredObservations.length : _totalCount} observaciones',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
      floatingActionButton: _fieldForm != null && !widget.isFinished
          ? FloatingActionButton(
              onPressed: _addObservationWithCurrentLocation,
              backgroundColor: Colors.blue[700],
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
    );
  }

  Position _initialPosition() {
    if (_isFuzzy && _hexGeoJson != null) {
      try {
        final decoded = jsonDecode(_hexGeoJson!) as Map<String, dynamic>;
        final features = decoded['features'] as List<dynamic>;
        if (features.isNotEmpty) {
          final coords = features.first['geometry']['coordinates'] as List;
          // Polygon: coords[0] = outer ring, coords[0][0] = first point
          // Backend sends [lat, lon] → Position needs (lon, lat)
          final firstPoint = (coords[0] as List)[0] as List;
          return Position(firstPoint[1] as double, firstPoint[0] as double);
        }
      } catch (_) {}
    } else if (_observations.isNotEmpty) {
      return Position(_observations.first.longitude, _observations.first.latitude);
    }
    return Position(-3.7038, 40.4168);
  }

  void _showHexDetails(int count) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.location_on, color: Colors.blue[700], size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    AppLocalizations.of(context)!.observationZone,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildInfoRow(Icons.pin_drop, AppLocalizations.of(context)!.observationsInZone, '$count'),
            const SizedBox(height: 12),
            Text(
              AppLocalizations.of(context)!.fuzzyPrivacyNote,
              style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }

  void _showObservationDetails(Observation observation) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.location_on, color: Colors.blue[700], size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            AppLocalizations.of(context)!.observationTitle(observation.id.toString()),
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildInfoRow(Icons.calendar_today, AppLocalizations.of(context)!.observationDate,
                      '${observation.createdAt.day}/${observation.createdAt.month}/${observation.createdAt.year} ${observation.createdAt.hour}:${observation.createdAt.minute.toString().padLeft(2, '0')}'),
                    const SizedBox(height: 12),
                    _buildInfoRow(Icons.place, AppLocalizations.of(context)!.observationCoordinates,
                      '${observation.latitude.toStringAsFixed(6)}, ${observation.longitude.toStringAsFixed(6)}'),
                    if (observation.description != null && observation.description!.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      _buildInfoRow(Icons.description, AppLocalizations.of(context)!.observationDescription, observation.description!),
                    ],
                    if (observation.data != null && observation.data!.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 8),
                      Text(
                        AppLocalizations.of(context)!.additionalData,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ..._buildObservationDataRows(observation.data!),
                    ],
                    if (observation.adminValues != null && observation.adminValues!.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          const Expanded(child: Divider()),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Row(
                              children: [
                                Icon(Icons.admin_panel_settings, size: 16, color: Colors.orange[700]),
                                const SizedBox(width: 6),
                                Text(
                                  AppLocalizations.of(context)!.observationAdminValues,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.orange[700],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Expanded(child: Divider()),
                        ],
                      ),
                      const SizedBox(height: 12),
                      ...observation.adminValues!.map((item) {
                        final label = item['label']?.toString() ?? item['key']?.toString() ?? '';
                        final value = item['value']?.toString() ?? 'N/A';
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: _buildInfoRow(Icons.science_outlined, label, value),
                        );
                      }),
                    ],
                    if (observation.images != null && observation.images!.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 8),
                      Text(
                        AppLocalizations.of(context)!.observationImages(observation.images!.length),
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 100,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: observation.images!.length,
                          itemBuilder: (context, index) {
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: GestureDetector(
                                onTap: () {
                                  _showFullScreenImage(context, observation.images![index]);
                                },
                                child: _buildImage(observation.images![index]),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                    if (observation.audios != null && observation.audios!.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 8),
                      Text(
                        'Audios (${observation.audios!.length})',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ...observation.audios!.map((a) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: AudioPlayerTile(source: UrlSource(a.url)),
                          )),
                    ],
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          if (_mapboxMap != null) {
                            _mapboxMap!.flyTo(
                              CameraOptions(
                                center: Point(
                                  coordinates: Position(observation.longitude, observation.latitude),
                                ),
                                zoom: 15.0,
                              ),
                              MapAnimationOptions(duration: 1000),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue[700],
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(AppLocalizations.of(context)!.observationCenterOnMap),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: colorScheme.onSurfaceVariant),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  color: colorScheme.onSurface,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  bool _coerceBool(dynamic value) {
    if (value is bool) return value;
    if (value is num) return value != 0;
    if (value is String) {
      final s = value.trim().toLowerCase();
      return s == 'true' || s == '1';
    }
    return false;
  }

  String _resolveChoiceLabel(ObservationField field, String value) {
    final values = field.choiceValues;
    final labels = field.choices;
    if (values == null || labels == null) return value;
    final idx = values.indexOf(value);
    if (idx < 0 || idx >= labels.length) return value;
    return labels[idx];
  }

  String _formatFieldValue(ObservationField? field, dynamic value) {
    if (value == null) return '';
    final type = (field?.fieldType ?? '').toUpperCase();

    switch (type) {
      case 'BOOL':
      case 'BOOLEAN':
      case 'SWITCH':
        return _coerceBool(value)
            ? '✓ ${AppLocalizations.of(context)!.boolYes}'
            : '✗ ${AppLocalizations.of(context)!.boolNo}';

      case 'MCHOICE':
        final parts = value is List
            ? value.map((v) => v.toString().trim()).toList()
            : value.toString().split(',').map((s) => s.trim()).toList();
        final resolved = parts
            .where((p) => p.isNotEmpty)
            .map((p) => field == null ? p : _resolveChoiceLabel(field, p))
            .toList();
        return resolved.join(', ');

      case 'CHOICE':
        final raw = value.toString();
        if (raw.isEmpty) return '';
        return field == null ? raw : _resolveChoiceLabel(field, raw);

      default:
        return value.toString();
    }
  }

  Widget _buildAnswerRow(String label, String value, {bool isCustom = false}) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.info_outline, size: 20, color: colorScheme.onSurfaceVariant),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(
                      label,
                      style: TextStyle(
                        fontSize: 12,
                        color: colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  if (isCustom) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: colorScheme.secondaryContainer,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        AppLocalizations.of(context)!.other,
                        style: TextStyle(
                          fontSize: 10,
                          color: colorScheme.onSecondaryContainer,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  color: colorScheme.onSurface,
                  fontStyle: isCustom ? FontStyle.italic : FontStyle.normal,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  List<Widget> _buildObservationDataRows(Map<String, dynamic> data) {
    final isOtherRe = RegExp(r'^(\d+)_is_other$');
    final otherTextRe = RegExp(r'^(\d+)_other_text$');

    final isOtherMap = <String, bool>{};
    final otherTextMap = <String, String>{};
    final valueMap = <String, dynamic>{};

    data.forEach((key, value) {
      final k = key.toString();
      final isOtherMatch = isOtherRe.firstMatch(k);
      if (isOtherMatch != null) {
        isOtherMap[isOtherMatch.group(1)!] = _coerceBool(value);
        return;
      }
      final otherTextMatch = otherTextRe.firstMatch(k);
      if (otherTextMatch != null) {
        otherTextMap[otherTextMatch.group(1)!] = (value ?? '').toString();
        return;
      }
      valueMap[k] = value;
    });

    final orderedFields = _fieldsById.values.toList()
      ..sort((a, b) => a.order.compareTo(b.order));
    final renderedKeys = <String>{};
    final rows = <Widget>[];

    void appendRow(String label, String value, {bool isCustom = false}) {
      rows.add(Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: _buildAnswerRow(label, value, isCustom: isCustom),
      ));
    }

    for (final field in orderedFields) {
      final keyStr = field.id.toString();
      final hasValue = valueMap.containsKey(keyStr);
      final isOther = isOtherMap[keyStr] == true;
      final otherText = otherTextMap[keyStr];
      if (!hasValue && !(isOther && otherText != null && otherText.isNotEmpty)) {
        continue;
      }
      renderedKeys.add(keyStr);

      final displayValue = (isOther && otherText != null && otherText.isNotEmpty)
          ? otherText
          : _formatFieldValue(field, valueMap[keyStr]);
      if (displayValue.isEmpty) continue;

      appendRow(field.label, displayValue, isCustom: isOther);
    }

    // Fallback: data keys with no matching field (e.g. legacy/offline).
    for (final entry in valueMap.entries) {
      if (renderedKeys.contains(entry.key)) continue;
      final raw = entry.value?.toString() ?? '';
      if (raw.isEmpty) continue;
      appendRow(
        AppLocalizations.of(context)!.fieldLabelFallback(entry.key),
        raw,
      );
    }

    return rows;
  }

  void _showFullScreenImage(BuildContext context, String imagePath) {
    final isLocal = imagePath.startsWith('/');
    showDialog(
      context: context,
      barrierColor: Colors.black87,
      builder: (context) {
        return Scaffold(
          backgroundColor: Colors.black,
          body: Stack(
            children: [
              Center(
                child: InteractiveViewer(
                  minScale: 0.5,
                  maxScale: 4.0,
                  constrained: false,
                  child: isLocal
                      ? Image.file(
                          File(imagePath),
                          fit: BoxFit.contain,
                          width: MediaQuery.of(context).size.width,
                          height: MediaQuery.of(context).size.height,
                          errorBuilder: (_, __, ___) => Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.image_not_supported,
                                    color: Colors.grey[400], size: 64),
                                const SizedBox(height: 16),
                                Text(AppLocalizations.of(context)!.observationImageLoadError,
                                    style: TextStyle(color: Colors.grey[400])),
                              ],
                            ),
                          ),
                        )
                      : CachedNetworkImage(
                          imageUrl: imagePath,
                          fit: BoxFit.contain,
                          width: MediaQuery.of(context).size.width,
                          height: MediaQuery.of(context).size.height,
                          errorWidget: (context, url, error) => Container(
                            width: MediaQuery.of(context).size.width,
                            height: MediaQuery.of(context).size.height,
                            color: Colors.grey[900],
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.image_not_supported, color: Colors.grey[400], size: 64),
                                  const SizedBox(height: 16),
                                  Text(
                                    AppLocalizations.of(context)!.observationImageLoadError,
                                    style: TextStyle(color: Colors.grey[400]),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                ),
              ),
              Positioned(
                top: MediaQuery.of(context).padding.top + 8,
                left: 8,
                child: IconButton(
                  icon: const Icon(Icons.close, color: Colors.white, size: 30),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
