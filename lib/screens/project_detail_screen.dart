import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../l10n/app_localizations.dart';
import '../services/auth_service.dart';
import '../services/observation_service.dart';
import '../services/offline_service.dart';
import '../services/project_service.dart';
import '../services/category_service.dart';
import '../models/category.dart';
import '../models/organization.dart';
import '../config/app_config.dart';
import '../utils/multilingual_utils.dart';
import '../widgets/animated_like_button.dart';
import '../widgets/organization_card.dart';
import 'map_screen.dart';
import 'create_project_screen.dart';
import 'create_project_organizations_screen.dart';

class ProjectDetailScreen extends StatefulWidget {
  final int projectId;
  
  const ProjectDetailScreen({super.key, required this.projectId});

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  final _projectService = ProjectService();
  final _categoryService = CategoryService();
  final _observationService = ObservationService();
  final _offlineService = OfflineService();
  final _authService = AuthService();
  Map<String, dynamic>? _projectData;
  List<Category> _categories = [];
  bool _isLoading = true;
  bool _isLiked = false;
  bool _isOffline = false;
  bool _isDownloadingOffline = false;
  bool _isDownloadingCsv = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadProjectDetail();
    _checkOfflineStatus();
  }

  Future<void> _checkOfflineStatus() async {
    final offline = await _offlineService.isProjectOffline(widget.projectId);
    if (mounted) setState(() => _isOffline = offline);
  }

  Future<void> _downloadCsv() async {
    setState(() => _isDownloadingCsv = true);
    try {
      final token = await _authService.getToken();
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/project/${widget.projectId}/download_observations/'),
        headers: {
          if (token != null) 'Authorization': 'Token $token',
        },
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final dir = await getTemporaryDirectory();
        final projectName = (_projectData?['name'] as String? ?? 'project_${widget.projectId}')
            .replaceAll(RegExp(r'[^\w\s-]'), '')
            .replaceAll(RegExp(r'\s+'), '_');
        final now = DateTime.now();
        final date = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
        final file = File('${dir.path}/${projectName}_${date}_observations.csv');
        await file.writeAsBytes(response.bodyBytes);
        await Share.shareXFiles(
          [XFile(file.path)],
          text: AppLocalizations.of(context)!.projectObservationsShare,
        );
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(AppLocalizations.of(context)!.downloadErrorCode(response.statusCode.toString())), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      debugPrint('Error downloading CSV: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.csvDownloadError), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isDownloadingCsv = false);
    }
  }

  /// Downloads the project + field form to SQLite and Mapbox tile cache.
  Future<void> _makeOffline() async {
    if (_projectData == null) return;

    setState(() => _isDownloadingOffline = true);

    try {
      // 1. Get field form id
      final fieldFormId =
          await _observationService.getFieldFormIdFromProject(widget.projectId);
      if (fieldFormId == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(AppLocalizations.of(context)!.noFieldFormError),
            backgroundColor: Colors.orange,
          ));
        }
        setState(() => _isDownloadingOffline = false);
        return;
      }

      // 2. Get field form questions
      final fields =
          await _observationService.getFieldFormQuestions(fieldFormId);

      // 3. Compute ~50km² bounding box around user's current position
      double minLat, maxLat, minLng, maxLng;
      try {
        LocationPermission permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.low,
        ).timeout(const Duration(seconds: 10));
        // ±0.032° ≈ ±3.5km → ~7km × 7km ≈ 49km²
        const delta = 0.032;
        minLat = pos.latitude - delta;
        maxLat = pos.latitude + delta;
        minLng = pos.longitude - delta;
        maxLng = pos.longitude + delta;
      } catch (_) {
        // Fallback: centre of Spain
        minLat = 40.38; maxLat = 40.44; minLng = -3.73; maxLng = -3.67;
      }

      // 4. Save project data to SQLite
      final name = localizedText(_projectData!['name']);
      final description = localizedText(_projectData!['description']);
      final coverData = _projectData!['cover'];
      String? coverUrl;
      if (coverData is List && coverData.isNotEmpty) {
        coverUrl = _getImageUrl(coverData[0]['image']);
      }

      await _offlineService.saveProjectOffline(
        projectId: widget.projectId,
        name: name,
        description: description,
        coverUrl: coverUrl,
        fieldFormId: fieldFormId,
        fields: fields,
        postObservationMessage: localizedText(_projectData!['post_observation_message']).isNotEmpty
            ? localizedText(_projectData!['post_observation_message'])
            : null,
      );

      // 5. Download Mapbox tiles (best-effort, shows progress)
      await _offlineService.downloadMapTiles(
        minLat: minLat,
        minLng: minLng,
        maxLat: maxLat,
        maxLng: maxLng,
      );

      setState(() {
        _isOffline = true;
        _isDownloadingOffline = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(AppLocalizations.of(context)!.projectAvailableOffline),
          backgroundColor: Colors.green,
        ));
      }
    } catch (e) {
      debugPrint('Error making project offline: $e');
      setState(() => _isDownloadingOffline = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(AppLocalizations.of(context)!.offlineDownloadError(e.toString())),
          backgroundColor: Colors.red,
        ));
      }
    }
  }

  Future<void> _removeOffline() async {
    await _offlineService.removeProjectOffline(widget.projectId);
    await _offlineService.removeMapTiles(widget.projectId);
    if (mounted) setState(() => _isOffline = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(AppLocalizations.of(context)!.offlineDataDeleted),
      ));
    }
  }

  Future<void> _loadCategories() async {
    final categories = await _categoryService.getCategories();
    if (mounted) {
      setState(() {
        _categories = categories;
      });
    }
  }

  Future<void> _loadProjectDetail() async {
    final data = await _projectService.getProjectDetail(widget.projectId);
    if (data != null) {
      if (mounted) {
        setState(() {
          _projectData = data;
          _isLiked = data['is_liked_by_user'] ?? false;
          _isLoading = false;
        });
      }
      return;
    }
    // API returned null (offline or server error) — fall back to SQLite cache
    final row = await _offlineService.getOfflineProject(widget.projectId);
    if (mounted) {
      setState(() {
        if (row != null) {
          final coverUrl = row['cover_url'] as String?;
          _projectData = {
            'name': row['name'],
            'description': row['description'],
            'cover': (coverUrl != null && coverUrl.isNotEmpty)
                ? [{'image': coverUrl}]
                : null,
            'is_liked_by_user': false,
            'total_likes': 0,
            'contributions': 0,
            'organizations': [],
            'is_creator': false,
            'is_admin': false,
          };
        }
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleLike() async {
    final success = await _projectService.toggleLike(widget.projectId);
    if (success && mounted) {
      setState(() {
        _isLiked = !_isLiked;
        if (_projectData != null) {
          final currentLikes = _projectData!['total_likes'] ?? 0;
          _projectData!['total_likes'] = _isLiked ? currentLikes + 1 : currentLikes - 1;
        }
      });
    }
  }

  String _getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    if (imagePath.startsWith('http')) return imagePath;
    final cleanPath = imagePath.startsWith('/') ? imagePath : '/$imagePath';
    return '${AppConfig.baseUrl}$cleanPath';
  }

  List<String> _getTopics() {
    if (_projectData == null || _categories.isEmpty) return [];
    final topicIds = _projectData!['topic'] as List?;
    if (topicIds == null) return [];
    
    // Map topic IDs to category names
    final topicNames = <String>[];
    for (var id in topicIds) {
      final category = _categories.firstWhere(
        (cat) => cat.id == id,
        orElse: () => Category(id: 0, name: '', icon: ''),
      );
      if (category.id != 0) {
        topicNames.add(category.name);
      }
    }
    return topicNames;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          automaticallyImplyLeading: false,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_projectData == null) {
      return Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          automaticallyImplyLeading: false,
        ),
        body: Center(child: Text(AppLocalizations.of(context)!.projectLoadError)),
      );
    }

    final coverImage = _projectData!['cover']?.isNotEmpty == true
        ? _getImageUrl(_projectData!['cover'][0]['image'])
        : '';
    final name = localizedText(_projectData!['name']);
    final description = localizedText(_projectData!['description']);
    final totalLikes = _projectData!['total_likes'] ?? 0;
    final contributions = _projectData!['contributions'] ?? 0;
    
    // Manejar creator: puede ser Map o int
    final creatorData = _projectData!['creator'];
    final creator = creatorData is Map ? (creatorData['username'] ?? '') : '';
    
    final organizationsData = _projectData!['organizations'] as List<dynamic>? ?? [];
    
    final organizations = organizationsData.map((org) => Organization.fromJson(org)).toList();
    final topics = _getTopics();
    final isAdmin = _projectData!['is_admin'] ?? false;
    final isCreator = _projectData!['is_creator'] ?? false;
    final hasObservations = _projectData!['has_observations'] ?? false;
    final isDatabasePrivate = _projectData!['private_data'] ?? false;
    final isPrivate = _projectData!['is_private'] ?? false;
    final isMember = _projectData!['is_member'] ?? false;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Image Header with back button
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            automaticallyImplyLeading: false,
            actions: [
              // Botón descargar CSV
              if (!isDatabasePrivate && !isPrivate)
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: CircleAvatar(
                    backgroundColor: Colors.green[100],
                    child: _isDownloadingCsv
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.green),
                          )
                        : IconButton(
                            icon: const Icon(Icons.download, color: Colors.green, size: 20),
                            tooltip: AppLocalizations.of(context)!.downloadCsv,
                            onPressed: _downloadCsv,
                          ),
                  ),
                ),
              // Botón editar (si es admin o creador)
              if (isAdmin || isCreator)
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: CircleAvatar(
                    backgroundColor: Colors.blue[100],
                    child: IconButton(
                      icon: const Icon(Icons.edit, color: Colors.blue, size: 20),
                      onPressed: () async {
                        final result = await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => CreateProjectScreen(projectId: widget.projectId),
                          ),
                        );
                        // Si se editó el proyecto, recargar datos
                        if (result == true && mounted) {
                          _loadProjectDetail();
                        }
                      },
                    ),
                  ),
                ),
              // Botón gestionar instituciones y administradores (si es admin o creador)
              if (isAdmin || isCreator)
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: CircleAvatar(
                    backgroundColor: Colors.purple[100],
                    child: IconButton(
                      icon: const Icon(Icons.group_add, color: Colors.purple, size: 20),
                      onPressed: () async {
                        // Preparar creator: convertir int a Map si es necesario, o null si no existe
                        Map<String, dynamic>? creatorMap;
                        final creatorData = _projectData!['creator'];
                        if (creatorData != null) {
                          if (creatorData is Map) {
                            creatorMap = creatorData as Map<String, dynamic>;
                          } else if (creatorData is int) {
                            creatorMap = {'id': creatorData, 'username': AppLocalizations.of(context)!.creator};
                          }
                        }
                        
                        // Preparar administrators: manejar si es lista de ints o null
                        List<Map<String, dynamic>>? administratorsList;
                        final adminsData = _projectData!['administrators'];
                        if (adminsData is List && adminsData.isNotEmpty) {
                          if (adminsData.first is Map) {
                            administratorsList = adminsData.cast<Map<String, dynamic>>();
                          } else if (adminsData.first is int) {
                            administratorsList = adminsData.map((id) => <String, dynamic>{'id': id, 'username': 'Admin $id'}).toList();
                          }
                        }
                        
                        final result = await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => CreateProjectOrganizationsScreen(
                              projectId: widget.projectId,
                              creator: creatorMap,
                              administrators: administratorsList,
                            ),
                          ),
                        );
                        
                        // Si se actualizaron las organizaciones, recargar los detalles
                        if (result == true) {
                          _loadProjectDetail();
                        }
                      },
                    ),
                  ),
                ),
              // Botón borrar (si es creador)
              if (isCreator)
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: CircleAvatar(
                    backgroundColor: Colors.red[100],
                    child: IconButton(
                      icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: Text(AppLocalizations.of(context)!.projectDeleteConfirmTitle),
                            content: Text(AppLocalizations.of(context)!.projectDeleteConfirmMessage),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context),
                                child: Text(AppLocalizations.of(context)!.cancel),
                              ),
                              TextButton(
                                onPressed: () async {
                                  final navigator = Navigator.of(context);
                                  final scaffoldMessenger = ScaffoldMessenger.of(context);
                                  final l10n = AppLocalizations.of(context)!;

                                  navigator.pop(); // Cerrar diálogo de confirmación

                                  // Mostrar indicador de carga
                                  showDialog(
                                    context: context,
                                    barrierDismissible: false,
                                    builder: (loadingContext) => const Center(
                                      child: CircularProgressIndicator(),
                                    ),
                                  );

                                  final success = await _projectService.deleteProject(widget.projectId);

                                  if (!mounted) return;

                                  // Cerrar indicador de carga
                                  navigator.pop();

                                  if (success) {
                                    scaffoldMessenger.showSnackBar(
                                      SnackBar(content: Text(l10n.projectDeleted)),
                                    );
                                    // Volver a la pantalla anterior indicando que se borró el proyecto
                                    navigator.pop(true);
                                  } else {
                                    scaffoldMessenger.showSnackBar(
                                      SnackBar(content: Text(l10n.projectDeleteError)),
                                    );
                                  }
                                },
                                child: Text(AppLocalizations.of(context)!.delete, style: const TextStyle(color: Colors.red)),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ),
              // Offline toggle button
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: CircleAvatar(
                  backgroundColor: _isOffline ? Colors.green[100] : Theme.of(context).colorScheme.surfaceContainerHighest,
                  child: _isDownloadingOffline
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : IconButton(
                          icon: Icon(
                            _isOffline ? Icons.offline_pin : Icons.download_for_offline_outlined,
                            size: 20,
                            color: _isOffline ? Colors.green[700] : Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                          tooltip: _isOffline ? AppLocalizations.of(context)!.removeOfflineTooltip : AppLocalizations.of(context)!.makeOfflineTooltip,
                          onPressed: () async {
                            if (_isOffline) {
                              final confirm = await showDialog<bool>(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  title: Text(AppLocalizations.of(context)!.projectOfflineDeleteTitle),
                                  content: Text(AppLocalizations.of(context)!.projectOfflineDeleteMessage),
                                  actions: [
                                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(AppLocalizations.of(context)!.cancel)),
                                    TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text(AppLocalizations.of(context)!.delete, style: const TextStyle(color: Colors.red))),
                                  ],
                                ),
                              );
                              if (confirm == true) _removeOffline();
                            } else {
                              _makeOffline();
                            }
                          },
                        ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                  child: IconButton(
                    icon: const Icon(Icons.share, size: 20),
                    onPressed: () {
                      // C6: Use AppConfig.baseUrl so production builds share the correct URL.
                      final projectUrl = '${AppConfig.baseUrl}/projects/${widget.projectId}';
                      final shareText = '$name\n\n$description\n\n$projectUrl';
                      Share.share(shareText, subject: name);
                    },
                  ),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  coverImage.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: coverImage,
                          fit: BoxFit.cover,
                          errorWidget: (context, url, error) => Container(color: Theme.of(context).colorScheme.surfaceContainerHighest),
                        )
                      : Container(color: Theme.of(context).colorScheme.surfaceContainerHighest),
                  if (isCreator || isAdmin)
                    Positioned(
                      bottom: 16,
                      left: 16,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (isCreator)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                              decoration: BoxDecoration(
                                color: Colors.yellow.withOpacity(0.9),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.workspace_premium, size: 16, color: Colors.black),
                                  const SizedBox(width: 4),
                                  Text(AppLocalizations.of(context)!.creator, style: const TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ),
                          if (isAdmin) ...[
                            if (isCreator) const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.9),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.verified_user, size: 16, color: Colors.white),
                                  const SizedBox(width: 4),
                                  Text(AppLocalizations.of(context)!.adminBadge, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Project name with white background overlay
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                        ),
                        if (isPrivate) ...[
                          const SizedBox(width: 8),
                          Icon(
                            isMember ? Icons.lock_open : Icons.lock,
                            color: isMember ? Colors.green : Colors.red,
                            size: 22,
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Stats and button row
                  Row(
                    children: [
                      // Likes (a la izquierda)
                      AnimatedLikeButton(
                        isLiked: _isLiked,
                        likes: totalLikes,
                        onPressed: _toggleLike,
                        iconSize: 24,
                        textSize: 18,
                        textColor: Theme.of(context).colorScheme.onSurface,
                        fontWeight: FontWeight.w500,
                      ),
                      const SizedBox(width: 24),
                      
                      // Contributions (clickeable para ir al mapa)
                      GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => MapScreen(
                                projectId: widget.projectId,
                                projectName: name,
                                postObservationMessage: localizedText(_projectData?['post_observation_message']).isNotEmpty
                                ? localizedText(_projectData?['post_observation_message'])
                                : null,
                                isPrivate: isPrivate,
                                isMember: isMember,
                              ),
                            ),
                          );
                        },
                        child: Row(
                          children: [
                            Icon(Icons.location_on, size: 24, color: hasObservations ? Colors.green : Theme.of(context).colorScheme.onSurfaceVariant),
                            const SizedBox(width: 4),
                            Text(
                              contributions.toString(),
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const Spacer(),
                      
                      // Ver mapa button
                      ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => MapScreen(
                                projectId: widget.projectId,
                                projectName: name,
                                postObservationMessage: localizedText(_projectData?['post_observation_message']).isNotEmpty
                                ? localizedText(_projectData?['post_observation_message'])
                                : null,
                                isPrivate: isPrivate,
                                isMember: isMember,
                              ),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue[700],
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                        child: Text(
                          AppLocalizations.of(context)!.viewMap,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Creator
                  if (creator.isNotEmpty)
                    Text(
                      AppLocalizations.of(context)!.projectCreatedBy(creator),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),

                  const SizedBox(height: 8),

                  // Topics/Hashtags
                  if (topics.isNotEmpty)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: topics.map((topic) {
                        return Text(
                          '#$topic',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.blue[700],
                            fontWeight: FontWeight.w500,
                          ),
                        );
                      }).toList(),
                    ),

                  const SizedBox(height: 24),

                  // Description
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 16,
                      height: 1.5,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),

                  // Organizations Section
                  if (organizations.isNotEmpty) ...[
                    const SizedBox(height: 32),
                    Text(
                      AppLocalizations.of(context)!.projectInstitutions,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 16),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: organizations.length == 1 ? 1 : 2,
                        mainAxisSpacing: 16,
                        crossAxisSpacing: 16,
                        childAspectRatio: 0.9,
                      ),
                      itemCount: organizations.length,
                      itemBuilder: (context, index) => OrganizationCard(
                        organization: organizations[index],
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
