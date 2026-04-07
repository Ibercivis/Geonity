import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../models/category.dart';
import '../models/project.dart';
import '../models/project_country.dart';
import '../models/organization.dart';
import '../models/invitation.dart';
import '../services/auth_service.dart';
import '../services/project_service.dart';
import '../services/category_service.dart';
import '../services/organization_service.dart';
import '../services/invitation_service.dart';
import '../services/connection_helper.dart';
import '../services/offline_service.dart';
import '../utils/multilingual_utils.dart';
import '../widgets/animated_like_button.dart';
import '../widgets/connection_error_screen.dart';
import 'project_detail_screen.dart';
import 'organizations_screen.dart';
import 'map_screen.dart';
import 'create_project_screen.dart';
import 'create_organization_screen.dart';
import 'organization_detail_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  final GlobalKey<_HomePageState> _homePageKey = GlobalKey<_HomePageState>();

  Widget _getCurrentPage() {
    switch (_selectedIndex) {
      case 0:
        return HomePage(key: _homePageKey);
      case 1:
        return const OrganizationsPage();
      case 2:
        return const ProfileScreen();
      default:
        return HomePage(key: _homePageKey);
    }
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _getCurrentPage(),
      bottomNavigationBar: BottomNavigationBar(
        items: <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: const Icon(Icons.folder),
            label: AppLocalizations.of(context)!.navProjects,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.business),
            label: AppLocalizations.of(context)!.navOrganizations,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.person_outline),
            label: AppLocalizations.of(context)!.navProfile,
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.blue[700],
        selectedFontSize: 11,
        unselectedFontSize: 10,
        iconSize: 24,
        type: BottomNavigationBarType.fixed,
        onTap: _onItemTapped,
      ),
    );
  }

  void _showCreateDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppLocalizations.of(context)!.createNewTitle),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.folder, color: Colors.blue),
              title: Text(AppLocalizations.of(context)!.createNewProject),
              onTap: () async {
                Navigator.pop(context);
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const CreateProjectScreen(),
                  ),
                );
                
                // Si se creó el proyecto, recargar la lista
                if (result == true && _homePageKey.currentState != null) {
                  _homePageKey.currentState!._loadData();
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.business, color: Colors.blue),
              title: Text(AppLocalizations.of(context)!.createNewOrganization),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const CreateOrganizationScreen(),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

// Home Page with full content
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _authService = AuthService();
  final _projectService = ProjectService();
  final _categoryService = CategoryService();
  final _organizationService = OrganizationService();
  final _invitationService = InvitationService();
  
  final _offlineService = OfflineService();
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;

  List<Project> _allProjects = [];
  List<Project> _myProjects = [];
  List<Category> _categories = [];
  List<ProjectCountry> _countries = [];
  List<Organization> _organizations = [];
  List<Invitation> _pendingInvitations = [];
  Set<int> _offlineProjectIds = {};
  bool _isLoading = true;
  bool _hasConnectionError = false;
  bool _hasInternet = true;
  bool _isOfflineMode = false;
  int? _selectedCategoryId;
  String? _selectedCountryCode;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final isOnline = !results.contains(ConnectivityResult.none);
      if (isOnline && (_isOfflineMode || _hasConnectionError)) {
        _loadData();
      }
    });
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _hasConnectionError = false;
      _isOfflineMode = false;
    });

    // Verificar conexión primero
    final connectionStatus = await ConnectionHelper.checkConnection();

    if (connectionStatus != ConnectionStatus.connected) {
      // Try to show offline-saved projects instead of a blank error screen
      final offlineIds = await _offlineService.getOfflineProjectIds();
      final offlineProjects = <Project>[];
      for (final id in offlineIds) {
        final row = await _offlineService.getOfflineProject(id);
        if (row != null) {
          final coverUrl = row['cover_url'] as String?;
          offlineProjects.add(Project(
            id: id,
            name: localizedText(row['name']),
            description: localizedText(row['description']),
            coverImage: (coverUrl != null && coverUrl.isNotEmpty) ? coverUrl : null,
          ));
        }
      }
      if (offlineProjects.isNotEmpty) {
        setState(() {
          _myProjects = offlineProjects;
          _offlineProjectIds = offlineIds.toSet();
          _isLoading = false;
          _isOfflineMode = true;
        });
      } else {
        setState(() {
          _isLoading = false;
          _hasConnectionError = true;
          _hasInternet = connectionStatus != ConnectionStatus.noInternet;
        });
      }
      return;
    }

    try {
      debugPrint('Loading data...');
      final results = await Future.wait([
        _projectService.getProjects(),
        _projectService.getMyProjects(),
        _categoryService.getCategories(),
        _organizationService.getOrganizations(),
        _invitationService.getPendingInvitations(),
      ]);

      final orgInvitations = await _organizationService
          .getPendingOrganizationInvitations()
          .catchError((_) => <Invitation>[]);

      debugPrint('All projects loaded: ${results[0].length}');
      debugPrint('My projects loaded: ${results[1].length}');
      debugPrint('Categories loaded: ${results[2].length}');
      debugPrint('Organizations loaded: ${results[3].length}');
      debugPrint('Pending invitations loaded: ${results[4].length}');
      debugPrint('Pending org invitations loaded: ${orgInvitations.length}');

      // Cargar países por separado — si falla no bloquea el resto
      final countries = await _projectService.getCountries().catchError((_) => <ProjectCountry>[]);

      final offlineIds = await _offlineService.getOfflineProjectIds();

      // Merge offline projects into myProjects so they always appear
      final apiMyProjects = results[1] as List<Project>;
      final apiMyProjectIds = apiMyProjects.map((p) => p.id).toSet();
      final mergedMyProjects = List<Project>.from(apiMyProjects);
      for (final id in offlineIds) {
        if (!apiMyProjectIds.contains(id)) {
          final row = await _offlineService.getOfflineProject(id);
          if (row != null) {
            final coverUrl = row['cover_url'] as String?;
            mergedMyProjects.add(Project(
              id: id,
              name: localizedText(row['name']),
              description: localizedText(row['description']),
              coverImage: (coverUrl != null && coverUrl.isNotEmpty) ? coverUrl : null,
            ));
          }
        }
      }

      setState(() {
        _allProjects = results[0] as List<Project>;
        _myProjects = mergedMyProjects;
        _categories = results[2] as List<Category>;
        _organizations = results[3] as List<Organization>;
        _pendingInvitations = [
          ...results[4] as List<Invitation>,
          ...orgInvitations,
        ];
        _countries = countries;
        _offlineProjectIds = offlineIds.toSet();
        _isLoading = false;
        _hasConnectionError = false;
      });
    } catch (e) {
      debugPrint('Error loading data: $e');
      setState(() {
        _isLoading = false;
        _hasConnectionError = true;
        _hasInternet = true; // Si llegó aquí, tiene internet pero el servidor falló
      });
    }
  }

  Future<void> _handleToggleLike(int projectId) async {
    final success = await _projectService.toggleLike(projectId);
    if (success && mounted) {
      // Actualizar inmediatamente el estado visual en _allProjects
      setState(() {
        final allIndex = _allProjects.indexWhere((p) => p.id == projectId);
        if (allIndex != -1) {
          final project = _allProjects[allIndex];
          _allProjects[allIndex] = Project(
            id: project.id,
            name: project.name,
            description: project.description,
            coverImage: project.coverImage,
            organization: project.organization,
            totalLikes: project.isLiked ? project.totalLikes - 1 : project.totalLikes + 1,
            contributions: project.contributions,
            isLiked: !project.isLiked,
            topics: project.topics,
            isCreator: project.isCreator,
            isAdmin: project.isAdmin,
            hasObservations: project.hasObservations,
          );
        }
      });
      
      // Recargar "Mis proyectos" desde el servidor
      try {
        final updatedMyProjects = await _projectService.getMyProjects();
        if (mounted) {
          setState(() {
            _myProjects = updatedMyProjects;
          });
        }
      } catch (e) {
        debugPrint('Error reloading my projects: $e');
      }
    }
  }


  void _showInvitationsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.notifications_active, color: Colors.blue),
            const SizedBox(width: 8),
            Text(AppLocalizations.of(context)!.invitationsCount(_pendingInvitations.length)),
          ],
        ),
        content: _pendingInvitations.isEmpty
            ? Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.notifications_none, size: 64, color: Theme.of(context).colorScheme.onSurfaceVariant),
                    const SizedBox(height: 16),
                    Text(
                      AppLocalizations.of(context)!.invitationsEmpty,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              )
            : SizedBox(
                width: double.maxFinite,
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _pendingInvitations.length,
                  itemBuilder: (context, index) {
                    final invitation = _pendingInvitations[index];
                    final typeText = invitation.isProjectInvitation 
                        ? AppLocalizations.of(context)!.invitationToProject 
                        : AppLocalizations.of(context)!.invitationToOrganization;
                    
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            RichText(
                              text: TextSpan(
                                style: TextStyle(
                                  fontSize: 15,
                                  color: Theme.of(context).colorScheme.onSurface,
                                  height: 1.4,
                                ),
                                children: [
                                  TextSpan(
                                    text: invitation.invitedBy,
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  TextSpan(text: ' te ha invitado a ser administrador del $typeText '),
                                  TextSpan(
                                    text: invitation.name,
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton(
                                  onPressed: () async {
                                    final success = invitation.isOrganizationInvitation
                                        ? await _organizationService.rejectOrganizationInvitation(invitation.id)
                                        : await _invitationService.rejectInvitation(invitation.id);
                                    if (success) {
                                      setState(() {
                                        _pendingInvitations.removeWhere((i) => i.id == invitation.id);
                                      });
                                      if (_pendingInvitations.isEmpty && context.mounted) {
                                        Navigator.pop(context);
                                      }
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text(AppLocalizations.of(context)!.invitationRejected)),
                                        );
                                      }
                                    }
                                  },
                                  child: Text(AppLocalizations.of(context)!.reject),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton(
                                  onPressed: () async {
                                    final success = invitation.isOrganizationInvitation
                                        ? await _organizationService.acceptOrganizationInvitation(invitation.id)
                                        : await _invitationService.acceptInvitation(invitation.id);
                                    if (success) {
                                      setState(() {
                                        _pendingInvitations.removeWhere((i) => i.id == invitation.id);
                                      });
                                      if (_pendingInvitations.isEmpty && context.mounted) {
                                        Navigator.pop(context);
                                      }
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text(AppLocalizations.of(context)!.invitationAccepted)),
                                        );
                                      }
                                    }
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.blue,
                                    foregroundColor: Colors.white,
                                  ),
                                  child: Text(AppLocalizations.of(context)!.accept),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(AppLocalizations.of(context)!.close),
          ),
        ],
      ),
    );
  }

  void _showCategorySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (_, controller) => Column(
          children: [
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Theme.of(context).colorScheme.outlineVariant, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(AppLocalizations.of(context)!.filterByCategory,
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView.builder(
                controller: controller,
                itemCount: _categories.length,
                itemBuilder: (_, i) {
                  final cat = _categories[i];
                  final isSelected = _selectedCategoryId == cat.id;
                  return ListTile(
                    leading: SvgPicture.asset(cat.icon, width: 24, height: 24,
                        colorFilter: ColorFilter.mode(Colors.blue.shade700, BlendMode.srcIn)),
                    title: Text(cat.name),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (cat.projectCount > 0)
                          Text('${cat.projectCount}', style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 13)),
                        if (isSelected) ...[
                          const SizedBox(width: 8),
                          Icon(Icons.check_circle, color: Colors.blue[700], size: 20),
                        ],
                      ],
                    ),
                    onTap: () {
                      setState(() => _selectedCategoryId = isSelected ? null : cat.id);
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCountrySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        minChildSize: 0.3,
        maxChildSize: 0.85,
        expand: false,
        builder: (_, controller) => Column(
          children: [
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Theme.of(context).colorScheme.outlineVariant, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(AppLocalizations.of(context)!.profileCountry, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView.builder(
                controller: controller,
                itemCount: _countries.length,
                itemBuilder: (_, i) {
                  final country = _countries[i];
                  final isSelected = _selectedCountryCode == country.code;
                  return ListTile(
                    leading: const Icon(Icons.public_outlined, size: 22, color: Colors.blueGrey),
                    title: Text(country.name),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (country.projectCount > 0)
                          Text('${country.projectCount}', style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 13)),
                        if (isSelected) ...[
                          const SizedBox(width: 8),
                          Icon(Icons.check_circle, color: Colors.blue[700], size: 20),
                        ],
                      ],
                    ),
                    onTap: () {
                      setState(() => _selectedCountryCode = isSelected ? null : country.code);
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Si hay error de conexión, mostrar pantalla de error
    if (_hasConnectionError) {
      return ConnectionErrorScreen(
        hasInternet: _hasInternet,
        onRetry: _loadData,
      );
    }

    // Filtrar proyectos
    List<Project> displayProjects = _allProjects;
    
    // Filtrar por categoría si hay una seleccionada
    if (_selectedCategoryId != null) {
      displayProjects = displayProjects.where((p) => p.topics.contains(_selectedCategoryId)).toList();
    }

    // Filtrar por país si hay uno seleccionado
    if (_selectedCountryCode != null) {
      displayProjects = displayProjects.where((p) {
        if (_selectedCountryCode == 'global') return p.isGlobal;
        return p.countries.contains(_selectedCountryCode);
      }).toList();
    }
    
    // Filtrar por búsqueda
    final searchQuery = _searchController.text.toLowerCase();
    if (searchQuery.isNotEmpty) {
      displayProjects = displayProjects.where((p) {
        return p.name.toLowerCase().contains(searchQuery) ||
               (p.description?.toLowerCase().contains(searchQuery) ?? false) ||
               (p.organization?.toLowerCase().contains(searchQuery) ?? false);
      }).toList();
    }
    
    // Mis proyectos vienen del endpoint my_projects (ya filtrados por backend)
    final myProjects = _myProjects;
    
    return Scaffold(
      body: Column(
        children: [
          if (_isOfflineMode)
            MaterialBanner(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              content: Text(AppLocalizations.of(context)!.offlineProjectsShown,
                  style: const TextStyle(color: Colors.white)),
              backgroundColor: Colors.orange[700],
              actions: [
                TextButton(
                  onPressed: _loadData,
                  child: Text(AppLocalizations.of(context)!.retry, style: const TextStyle(color: Colors.white)),
                ),
              ],
            ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadData,
              child: SafeArea(
                child: CustomScrollView(
                  cacheExtent: 600,
                  slivers: [
            // Header con logo y menú
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        AppLocalizations.of(context)!.appTitle,
                        style: TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                    ),
                    // Campana de notificaciones
                    Stack(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.notifications_outlined, size: 28),
                          onPressed: () => _showInvitationsDialog(),
                        ),
                        if (_pendingInvitations.isNotEmpty)
                          Positioned(
                            right: 8,
                            top: 8,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                              constraints: const BoxConstraints(
                                minWidth: 16,
                                minHeight: 16,
                              ),
                              child: Text(
                                '${_pendingInvitations.length}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                      ],
                    ),
                    // Botón para crear proyecto
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline, size: 28),
                      onPressed: () async {
                        final result = await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const CreateProjectScreen(),
                          ),
                        );
                        
                        // Si se creó el proyecto, recargar la lista
                        if (result == true) {
                          _loadData();
                        }
                      },
                    ),
                  ],
                ),
              ),
            ),
            
            // Barra de búsqueda
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (value) {
                      setState(() {}); // Recargar al escribir
                    },
                    decoration: InputDecoration(
                      hintText: AppLocalizations.of(context)!.searchProjects,
                      hintStyle: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                      prefixIcon: Icon(Icons.search, color: Theme.of(context).colorScheme.onSurfaceVariant),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: Icon(Icons.clear, color: Theme.of(context).colorScheme.onSurfaceVariant),
                              onPressed: () {
                                _searchController.clear();
                                setState(() {});
                              },
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
                ),
              ),
            ),

            // Mostrar indicador de búsqueda solo si hay búsqueda activa
            if (searchQuery.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.search, size: 28, color: Theme.of(context).colorScheme.onSurface),
                          const SizedBox(width: 12),
                          Text(
                            AppLocalizations.of(context)!.searchResults,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        displayProjects.length == 1
                            ? AppLocalizations.of(context)!.searchResultsCount(searchQuery, displayProjects.length)
                            : AppLocalizations.of(context)!.searchResultsCountPlural(searchQuery, displayProjects.length),
                        style: const TextStyle(
                          fontSize: 16,
                          color: Color(0xFF2B4CE0),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Sección Mis proyectos (siempre visible si no hay búsqueda)
            if (searchQuery.isEmpty && myProjects.isNotEmpty)
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
                      child: Row(
                        children: [
                          const Icon(Icons.favorite, color: Color(0xFF2B4CE0), size: 28),
                          const SizedBox(width: 12),
                          Text(
                            AppLocalizations.of(context)!.myProjects,
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w600,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(
                      height: 200,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: myProjects.length,
                        itemBuilder: (context, index) {
                          final project = myProjects[index];
                          return RepaintBoundary(child: Container(
                            width: 160,
                            margin: const EdgeInsets.only(right: 16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () async {
                                      final result = await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => ProjectDetailScreen(projectId: project.id),
                                        ),
                                      );
                                      // Si se borró el proyecto, recargar datos
                                      if (result == true && mounted) {
                                        _loadData();
                                      }
                                    },
                                    onLongPress: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => MapScreen(
                                            projectId: project.id,
                                            projectName: project.name,
                                            isPrivate: project.isPrivate,
                                            isMember: project.isMember,
                                          ),
                                        ),
                                      );
                                    },
                                    child: Stack(
                                      fit: StackFit.expand,
                                      children: [
                                        Container(
                                          decoration: BoxDecoration(
                                            color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                            borderRadius: BorderRadius.circular(12),
                                            image: project.coverImage != null
                                                ? DecorationImage(
                                                    image: CachedNetworkImageProvider(project.coverImage!),
                                                    fit: BoxFit.cover,
                                                  )
                                                : null,
                                          ),
                                          child: Container(
                                            decoration: BoxDecoration(
                                              borderRadius: BorderRadius.circular(12),
                                              gradient: LinearGradient(
                                                begin: Alignment.topCenter,
                                                end: Alignment.bottomCenter,
                                                colors: [
                                                  Colors.transparent,
                                                  Colors.black.withOpacity(0.5),
                                                ],
                                              ),
                                            ),
                                            alignment: Alignment.bottomLeft,
                                            padding: const EdgeInsets.all(12),
                                            child: Text(
                                              project.name,
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                                shadows: [
                                                  Shadow(
                                                    offset: Offset(0, 1),
                                                    blurRadius: 3,
                                                    color: Colors.black45,
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                        if (_offlineProjectIds.contains(project.id))
                                          Positioned(
                                            top: 6,
                                            right: 6,
                                            child: Container(
                                              padding: const EdgeInsets.all(3),
                                              decoration: BoxDecoration(
                                                color: Colors.green,
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Icon(Icons.offline_pin,
                                                  size: 14, color: Colors.white),
                                            ),
                                          ),
                                        if (project.isPrivate)
                                          Positioned(
                                            bottom: 6,
                                            right: 6,
                                            child: Container(
                                              padding: const EdgeInsets.all(3),
                                              decoration: BoxDecoration(
                                                color: project.isMember ? Colors.green : Colors.red,
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Icon(
                                                project.isMember ? Icons.lock_open : Icons.lock,
                                                size: 14,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ),
                                        if (project.isCreator || project.isAdmin)
                                          Positioned(
                                            top: 6,
                                            left: 6,
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                if (project.isCreator)
                                                  Container(
                                                    padding: const EdgeInsets.all(3),
                                                    decoration: BoxDecoration(
                                                      color: Colors.yellow.withOpacity(0.9),
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                    child: const Icon(Icons.workspace_premium, size: 14, color: Colors.black),
                                                  ),
                                                if (project.isAdmin) ...[
                                                  if (project.isCreator) const SizedBox(width: 4),
                                                  Container(
                                                    padding: const EdgeInsets.all(3),
                                                    decoration: BoxDecoration(
                                                      color: Colors.blue.withOpacity(0.9),
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                    child: const Icon(Icons.verified_user, size: 14, color: Colors.white),
                                                  ),
                                                ],
                                              ],
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.only(top: 8, left: 4),
                                  child: Row(
                                    children: [
                                      AnimatedLikeButton(
                                        isLiked: project.isLiked,
                                        likes: project.totalLikes,
                                        onPressed: () => _handleToggleLike(project.id),
                                        iconSize: 16,
                                        textSize: 12,
                                      ),
                                      const SizedBox(width: 12),
                                      GestureDetector(
                                        onTap: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (context) => MapScreen(
                                                projectId: project.id,
                                                projectName: project.name,
                                                postObservationMessage: project.postObservationMessage,
                                                isPrivate: project.isPrivate,
                                                isMember: project.isMember,
                                              ),
                                            ),
                                          );
                                        },
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              Icons.location_on,
                                              size: 16,
                                              color: project.hasObservations ? Colors.green : Theme.of(context).colorScheme.onSurfaceVariant,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              '${project.contributions}',
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ));
                        },
                      ),
                    ),
                  ],
                ),
              ),

            // Sección Explorar proyectos con categorías integradas
            if (searchQuery.isEmpty)
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
                      child: Row(
                        children: [
                          const Icon(Icons.explore, color: Color(0xFF2B4CE0), size: 28),
                          const SizedBox(width: 12),
                          Text(
                            AppLocalizations.of(context)!.exploreProjects,
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w600,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Panel de filtros: dos selectores
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                      child: Row(
                        children: [
                          // Selector categoría
                          Expanded(
                            child: _FilterChip(
                              icon: Icons.category_outlined,
                              label: _selectedCategoryId != null
                                  ? _categories.firstWhere((c) => c.id == _selectedCategoryId, orElse: () => _categories.first).name
                                  : AppLocalizations.of(context)!.filterByCategory,
                              isActive: _selectedCategoryId != null,
                              onTap: () => _showCategorySheet(),
                              onClear: _selectedCategoryId != null ? () => setState(() => _selectedCategoryId = null) : null,
                            ),
                          ),
                          const SizedBox(width: 10),
                          // Selector país
                          Expanded(
                            child: _FilterChip(
                              icon: Icons.public_outlined,
                              label: _selectedCountryCode != null
                                  ? _countries.firstWhere((c) => c.code == _selectedCountryCode, orElse: () => _countries.first).name
                                  : AppLocalizations.of(context)!.profileCountry,
                              isActive: _selectedCountryCode != null,
                              onTap: () => _showCountrySheet(),
                              onClear: _selectedCountryCode != null ? () => setState(() => _selectedCountryCode = null) : null,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

            // Grid de todos los proyectos (filtrados por categoría si hay una seleccionada)
            if (searchQuery.isEmpty)
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 0.8,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final project = displayProjects[index];
                      return RepaintBoundary(child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () async {
                                final result = await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ProjectDetailScreen(projectId: project.id),
                                  ),
                                );
                                if (result == true && mounted) {
                                  _loadData();
                                }
                              },
                              onLongPress: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => MapScreen(
                                      projectId: project.id,
                                      projectName: project.name,
                                      isPrivate: project.isPrivate,
                                      isMember: project.isMember,
                                    ),
                                  ),
                                );
                              },
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  Container(
                                    decoration: BoxDecoration(
                                      color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                      borderRadius: BorderRadius.circular(12),
                                      image: project.coverImage != null
                                          ? DecorationImage(
                                              image: CachedNetworkImageProvider(project.coverImage!),
                                              fit: BoxFit.cover,
                                            )
                                          : null,
                                    ),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(12),
                                        gradient: LinearGradient(
                                          begin: Alignment.topCenter,
                                          end: Alignment.bottomCenter,
                                          colors: [
                                            Colors.transparent,
                                            Colors.black.withValues(alpha: 0.5),
                                          ],
                                        ),
                                      ),
                                      alignment: Alignment.bottomLeft,
                                      padding: const EdgeInsets.all(12),
                                      child: Text(
                                        project.name,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          shadows: [
                                            Shadow(
                                              offset: Offset(0, 1),
                                              blurRadius: 3,
                                              color: Colors.black45,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                  if (_offlineProjectIds.contains(project.id))
                                    Positioned(
                                      top: 6,
                                      right: 6,
                                      child: Container(
                                        padding: const EdgeInsets.all(3),
                                        decoration: BoxDecoration(
                                          color: Colors.green,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Icon(Icons.offline_pin,
                                            size: 14, color: Colors.white),
                                      ),
                                    ),
                                  if (project.isPrivate)
                                    Positioned(
                                      bottom: 6,
                                      right: 6,
                                      child: Container(
                                        padding: const EdgeInsets.all(3),
                                        decoration: BoxDecoration(
                                          color: project.isMember ? Colors.green : Colors.red,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Icon(
                                          project.isMember ? Icons.lock_open : Icons.lock,
                                          size: 14,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  if (project.isCreator || project.isAdmin)
                                    Positioned(
                                      top: 6,
                                      left: 6,
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          if (project.isCreator)
                                            Container(
                                              padding: const EdgeInsets.all(3),
                                              decoration: BoxDecoration(
                                                color: Colors.yellow.withOpacity(0.9),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Icon(Icons.workspace_premium, size: 14, color: Colors.black),
                                            ),
                                          if (project.isAdmin) ...[
                                            if (project.isCreator) const SizedBox(width: 4),
                                            Container(
                                              padding: const EdgeInsets.all(3),
                                              decoration: BoxDecoration(
                                                color: Colors.blue.withOpacity(0.9),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Icon(Icons.verified_user, size: 14, color: Colors.white),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.only(top: 8, left: 4),
                            child: Row(
                              children: [
                                AnimatedLikeButton(
                                  isLiked: project.isLiked,
                                  likes: project.totalLikes,
                                  onPressed: () => _handleToggleLike(project.id),
                                  iconSize: 16,
                                  textSize: 12,
                                ),
                                const SizedBox(width: 12),
                                GestureDetector(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => MapScreen(
                                          projectId: project.id,
                                          projectName: project.name,
                                        ),
                                      ),
                                    );
                                  },
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.location_on, size: 16,
                                          color: project.hasObservations ? Colors.green : Theme.of(context).colorScheme.onSurfaceVariant),
                                      const SizedBox(width: 4),
                                      Text(
                                        '${project.contributions}',
                                        style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ));
                    },
                    childCount: displayProjects.length,
                  ),
                ),
              ),

            // Lista vertical de proyectos filtrados (solo cuando hay búsqueda activa)
            if (searchQuery.isNotEmpty)
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final project = displayProjects[index];
                      return RepaintBoundary(child: GestureDetector(
                        onTap: () async {
                          final result = await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ProjectDetailScreen(projectId: project.id),
                            ),
                          );
                          // Si se borró el proyecto, recargar datos
                          if (result == true && mounted) {
                            _loadData();
                          }
                        },
                        child: Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.grey.withOpacity(0.2),
                              spreadRadius: 1,
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (project.coverImage != null)
                              Container(
                                height: 200,
                                decoration: BoxDecoration(
                                  borderRadius: const BorderRadius.vertical(
                                    top: Radius.circular(16),
                                  ),
                                  image: DecorationImage(
                                    image: CachedNetworkImageProvider(project.coverImage!),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    project.name,
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Theme.of(context).colorScheme.onSurface,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  if (project.organization != null)
                                    Text(
                                      project.organization!,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Color(0xFF2B4CE0),
                                      ),
                                    ),
                                  if (project.description != null) ...[
                                    const SizedBox(height: 12),
                                    Text(
                                      project.description!,
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      if (project.contributions > 0) ...[
                                        Icon(Icons.people, size: 20, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                        const SizedBox(width: 4),
                                        Text(
                                          '${project.contributions}',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                      ],
                                      Icon(Icons.favorite_border, size: 20, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                      const SizedBox(width: 4),
                                      Text(
                                        '${project.totalLikes}',
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      ));
                    },
                    childCount: displayProjects.length,
                  ),
                ),
              ),
          ],
        ),
              ),
            ),
          ),        // close Expanded
        ],          // close Column children
      ),            // close Column
    );
  }
}

class MapPage extends StatelessWidget {
  const MapPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.map, size: 80, color: Colors.green),
          const SizedBox(height: 16),
          Text(
            AppLocalizations.of(context)!.mapTitle,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(AppLocalizations.of(context)!.mapInteractive),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final VoidCallback? onClear;

  const _FilterChip({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? Colors.blue[700] : Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isActive ? Colors.blue[700]! : Theme.of(context).colorScheme.outlineVariant),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: isActive ? Colors.white : Theme.of(context).colorScheme.onSurfaceVariant),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: isActive ? Colors.white : Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ),
            if (onClear != null)
              GestureDetector(
                onTap: onClear,
                child: Icon(Icons.close, size: 15, color: isActive ? Colors.white70 : Theme.of(context).colorScheme.onSurfaceVariant),
              )
            else
              Icon(Icons.expand_more, size: 16, color: isActive ? Colors.white70 : Theme.of(context).colorScheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}
