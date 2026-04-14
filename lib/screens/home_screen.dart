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
import '../services/changelog_service.dart';
import 'changelog_screen.dart';
import '../utils/multilingual_utils.dart';
import '../widgets/animated_like_button.dart';
import '../widgets/connection_error_screen.dart';
import 'project_detail_screen.dart';
import 'organizations_screen.dart';
import 'map_screen.dart';
import 'create_project_screen.dart';
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
}

// ─── Home Page ───────────────────────────────────────────────────────────────

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  final _projectService = ProjectService();
  final _categoryService = CategoryService();
  final _organizationService = OrganizationService();
  final _invitationService = InvitationService();
  final _offlineService = OfflineService();

  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  late final TabController _tabController;

  List<Project> _allProjects = [];
  List<Project> _myProjects = [];
  List<Project> _draftProjects = [];
  List<Category> _categories = [];
  List<ProjectCountry> _countries = [];
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
    WidgetsBinding.instance.addObserver(this);
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkChangelog());
    // Fix 3: reload whenever connectivity is restored, not only when there was
    // an explicit error. This covers the case where the app spent time in the
    // background and Android dropped the connection / the token expired.
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final isOnline = !results.contains(ConnectivityResult.none);
      if (isOnline) {
        _loadData();
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _tabController.dispose();
    _connectivitySub?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _checkChangelog() async {
    final isNew = await ChangelogService.checkAndMarkSeen();
    if (isNew && mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const ChangelogScreen()),
      );
    }
  }

  // Fix 2: reload data whenever the app returns to the foreground so stale
  // data (or an expired token) is detected immediately on resume.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadData();
    }
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _hasConnectionError = false;
      _isOfflineMode = false;
    });

    final connectionStatus = await ConnectionHelper.checkConnection();

    if (connectionStatus != ConnectionStatus.connected) {
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
      final results = await Future.wait([
        _projectService.getProjects(),
        _projectService.getMyProjects(),
        _categoryService.getCategories(),
        _organizationService.getOrganizations(),
        _invitationService.getPendingInvitations(),
        _projectService.getDraftProjects(),
      ]);

      final orgInvitations = await _organizationService
          .getPendingOrganizationInvitations()
          .catchError((_) => <Invitation>[]);

      final countries = await _projectService.getCountries().catchError((_) => <ProjectCountry>[]);
      final offlineIds = await _offlineService.getOfflineProjectIds();

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

      if (!mounted) return;
      setState(() {
        _allProjects = results[0] as List<Project>;
        _myProjects = mergedMyProjects;
        _categories = results[2] as List<Category>;
        _pendingInvitations = [
          ...results[4] as List<Invitation>,
          ...orgInvitations,
        ];
        _draftProjects = results[5] as List<Project>;
        _countries = countries;
        _offlineProjectIds = offlineIds.toSet();
        _isLoading = false;
        _hasConnectionError = false;
      });
    } catch (e) {
      debugPrint('Error loading data: $e');
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _hasConnectionError = true;
        _hasInternet = true;
      });
    }
  }

  Future<void> _handleToggleLike(int projectId) async {
    final success = await _projectService.toggleLike(projectId);
    if (success && mounted) {
      setState(() {
        final idx = _allProjects.indexWhere((p) => p.id == projectId);
        if (idx != -1) {
          final p = _allProjects[idx];
          _allProjects[idx] = Project(
            id: p.id,
            name: p.name,
            description: p.description,
            coverImage: p.coverImage,
            organization: p.organization,
            totalLikes: p.isLiked ? p.totalLikes - 1 : p.totalLikes + 1,
            contributions: p.contributions,
            isLiked: !p.isLiked,
            topics: p.topics,
            isCreator: p.isCreator,
            isAdmin: p.isAdmin,
            hasObservations: p.hasObservations,
          );
        }
      });
      try {
        final updated = await _projectService.getMyProjects();
        if (mounted) setState(() => _myProjects = updated);
      } catch (e) {
        debugPrint('Error reloading my projects: $e');
      }
    }
  }

  // ─── Dialogs / Sheets ──────────────────────────────────────────────────────

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
                                style: TextStyle(fontSize: 15, color: Theme.of(context).colorScheme.onSurface, height: 1.4),
                                children: [
                                  TextSpan(text: invitation.invitedBy, style: const TextStyle(fontWeight: FontWeight.bold)),
                                  TextSpan(text: ' te ha invitado a ser administrador del $typeText '),
                                  TextSpan(text: invitation.name, style: const TextStyle(fontWeight: FontWeight.bold)),
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
                                      setState(() => _pendingInvitations.removeWhere((i) => i.id == invitation.id));
                                      if (_pendingInvitations.isEmpty && context.mounted) Navigator.pop(context);
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
                                      setState(() => _pendingInvitations.removeWhere((i) => i.id == invitation.id));
                                      if (_pendingInvitations.isEmpty && context.mounted) Navigator.pop(context);
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text(AppLocalizations.of(context)!.invitationAccepted)),
                                        );
                                      }
                                    }
                                  },
                                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
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
              child: Text(AppLocalizations.of(context)!.filterByCategory, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
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
                    trailing: isSelected
                        ? Icon(Icons.check_circle, color: Colors.blue[700], size: 20)
                        : null,
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
                    trailing: isSelected
                        ? Icon(Icons.check_circle, color: Colors.blue[700], size: 20)
                        : null,
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

  // ─── Filters widget (shared, applied per-tab) ──────────────────────────────

  Widget _buildFilters(AppLocalizations l10n) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Row(
        children: [
          // Búsqueda
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerLowest,
                borderRadius: BorderRadius.circular(30),
                border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  hintText: l10n.searchProjects,
                  hintStyle: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                  prefixIcon: Icon(Icons.search, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: Icon(Icons.clear, color: Theme.of(context).colorScheme.onSurfaceVariant),
                          onPressed: () { _searchController.clear(); setState(() {}); },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Botón categoría
          _IconFilterButton(
            icon: Icons.category_outlined,
            isActive: _selectedCategoryId != null,
            onTap: _showCategorySheet,
            onClear: _selectedCategoryId != null ? () => setState(() => _selectedCategoryId = null) : null,
          ),
          const SizedBox(width: 6),
          // Botón país
          _IconFilterButton(
            icon: Icons.public_outlined,
            isActive: _selectedCountryCode != null,
            onTap: _showCountrySheet,
            onClear: _selectedCountryCode != null ? () => setState(() => _selectedCountryCode = null) : null,
          ),
        ],
      ),
    );
  }

  // ─── Tab contents ──────────────────────────────────────────────────────────

  Widget _buildMyProjectsTab() {
    final l10n = AppLocalizations.of(context)!;
    final q = _searchController.text.toLowerCase();
    List<Project> projects = _myProjects;
    if (_selectedCategoryId != null) {
      projects = projects.where((p) => p.topics.contains(_selectedCategoryId)).toList();
    }
    if (_selectedCountryCode != null) {
      projects = projects.where((p) =>
          _selectedCountryCode == 'global' ? p.isGlobal : p.countries.contains(_selectedCountryCode)).toList();
    }
    if (q.isNotEmpty) {
      projects = projects.where((p) =>
          p.name.toLowerCase().contains(q) ||
          (p.description?.toLowerCase().contains(q) ?? false) ||
          (p.organization?.toLowerCase().contains(q) ?? false)).toList();
    }

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: _buildFilters(l10n)),
        if (projects.isEmpty)
          SliverFillRemaining(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.folder_open, size: 64, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  const SizedBox(height: 16),
                  Text(l10n.noMyProjectsTitle, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(l10n.noMyProjectsSubtitle, textAlign: TextAlign.center,
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                ],
              ),
            ),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 0.8,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final project = projects[index];
                  return RepaintBoundary(
                    child: _ExploreProjectCard(
                      project: project,
                      offlineBadge: _offlineProjectIds.contains(project.id),
                      draftBadge: project.isDraft,
                      onTap: () async {
                        final result = await Navigator.push(context, MaterialPageRoute(
                          builder: (_) => ProjectDetailScreen(projectId: project.id),
                        ));
                        if (result == true && mounted) _loadData();
                      },
                      onLike: () => _handleToggleLike(project.id),
                      onMap: () => Navigator.push(context, MaterialPageRoute(
                        builder: (_) => MapScreen(
                          projectId: project.id,
                          projectName: project.name,
                          isPrivate: project.isPrivate,
                          isMember: project.isMember,
                          isFinished: project.isFinished,
                        ),
                      )),
                    ),
                  );
                },
                childCount: projects.length,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildExploreTab() {
    final l10n = AppLocalizations.of(context)!;
    final q = _searchController.text.toLowerCase();
    List<Project> displayProjects = _allProjects;

    if (_selectedCategoryId != null) {
      displayProjects = displayProjects.where((p) => p.topics.contains(_selectedCategoryId)).toList();
    }
    if (_selectedCountryCode != null) {
      displayProjects = displayProjects.where((p) =>
          _selectedCountryCode == 'global' ? p.isGlobal : p.countries.contains(_selectedCountryCode)).toList();
    }
    if (q.isNotEmpty) {
      displayProjects = displayProjects.where((p) =>
          p.name.toLowerCase().contains(q) ||
          (p.description?.toLowerCase().contains(q) ?? false) ||
          (p.organization?.toLowerCase().contains(q) ?? false)).toList();
    }

    return CustomScrollView(
      cacheExtent: 600,
      slivers: [
        SliverToBoxAdapter(child: _buildFilters(l10n)),

        // Grid de proyectos
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
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
                return RepaintBoundary(child: _ExploreProjectCard(
                  project: project,
                  offlineBadge: _offlineProjectIds.contains(project.id),
                  onTap: () async {
                    final result = await Navigator.push(context, MaterialPageRoute(
                      builder: (_) => ProjectDetailScreen(projectId: project.id),
                    ));
                    if (result == true && mounted) _loadData();
                  },
                  onLike: () => _handleToggleLike(project.id),
                  onMap: () => Navigator.push(context, MaterialPageRoute(
                    builder: (_) => MapScreen(
                      projectId: project.id,
                      projectName: project.name,
                      isFinished: project.isFinished,
                    ),
                  )),
                ));
              },
              childCount: displayProjects.length,
            ),
          ),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: 24)),
      ],
    );
  }

  Widget _buildDraftsTab() {
    final l10n = AppLocalizations.of(context)!;
    final q = _searchController.text.toLowerCase();
    List<Project> drafts = _draftProjects;
    if (_selectedCategoryId != null) {
      drafts = drafts.where((p) => p.topics.contains(_selectedCategoryId)).toList();
    }
    if (_selectedCountryCode != null) {
      drafts = drafts.where((p) =>
          _selectedCountryCode == 'global' ? p.isGlobal : p.countries.contains(_selectedCountryCode)).toList();
    }
    if (q.isNotEmpty) {
      drafts = drafts.where((p) =>
          p.name.toLowerCase().contains(q) ||
          (p.description?.toLowerCase().contains(q) ?? false)).toList();
    }

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: _buildFilters(l10n)),
        if (drafts.isEmpty)
          SliverFillRemaining(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.edit_note, size: 64, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  const SizedBox(height: 16),
                  Text(l10n.noDraftsTitle, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: Text(l10n.noDraftsSubtitle, textAlign: TextAlign.center,
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                  ),
                ],
              ),
            ),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 0.8,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final project = drafts[index];
                  return RepaintBoundary(
                    child: _ExploreProjectCard(
                      project: project,
                      offlineBadge: false,
                      draftBadge: true,
                      onTap: () => Navigator.push(context, MaterialPageRoute(
                        builder: (_) => ProjectDetailScreen(projectId: project.id),
                      )),
                      onLike: () => _handleToggleLike(project.id),
                      onMap: () => Navigator.push(context, MaterialPageRoute(
                        builder: (_) => MapScreen(
                          projectId: project.id,
                          projectName: project.name,
                          isFinished: project.isFinished,
                        ),
                      )),
                      onContinueDraft: (project.isCreator || project.isAdmin)
                          ? () async {
                              final result = await Navigator.push(context, MaterialPageRoute(
                                builder: (_) => CreateProjectScreen(projectId: project.id),
                              ));
                              if (result == true && mounted) _loadData();
                            }
                          : null,
                    ),
                  );
                },
                childCount: drafts.length,
              ),
            ),
          ),
      ],
    );
  }

  Widget _draftPlaceholder() {
    return Container(
      color: Colors.orange.withValues(alpha: 0.12),
      child: const Center(
        child: Icon(Icons.edit_note, size: 40, color: Colors.orange),
      ),
    );
  }

  // ─── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (_hasConnectionError) {
      return ConnectionErrorScreen(hasInternet: _hasInternet, onRetry: _loadData);
    }

    final l10n = AppLocalizations.of(context)!;

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              // Offline banner
              if (_isOfflineMode)
                MaterialBanner(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  content: Text(l10n.offlineProjectsShown, style: const TextStyle(color: Colors.white)),
                  backgroundColor: Colors.orange[700],
                  actions: [
                    TextButton(
                      onPressed: _loadData,
                      child: Text(l10n.retry, style: const TextStyle(color: Colors.white)),
                    ),
                  ],
                ),

              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 8, 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        l10n.appTitle,
                        style: TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                    ),
                    // Notificaciones
                    Stack(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.notifications_outlined, size: 28),
                          onPressed: _showInvitationsDialog,
                        ),
                        if (_pendingInvitations.isNotEmpty)
                          Positioned(
                            right: 8,
                            top: 8,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                              constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                              child: Text(
                                '${_pendingInvitations.length}',
                                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                      ],
                    ),
                    // Crear proyecto
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline, size: 28),
                      onPressed: () async {
                        final result = await Navigator.push(context, MaterialPageRoute(
                          builder: (_) => const CreateProjectScreen(),
                        ));
                        if (result == true && mounted) _loadData();
                      },
                    ),
                  ],
                ),
              ),

              // TabBar
              TabBar(
                controller: _tabController,
                labelColor: Colors.blue[700],
                unselectedLabelColor: Theme.of(context).colorScheme.onSurfaceVariant,
                indicatorColor: Colors.blue[700],
                indicatorSize: TabBarIndicatorSize.tab,
                labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 13),
                tabs: [
                  Tab(text: l10n.myProjects),
                  Tab(text: l10n.exploreProjects),
                  Tab(text: l10n.drafts,
                  ),
                ],
              ),

              // Tab content
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : TabBarView(
                        controller: _tabController,
                        children: [
                          RefreshIndicator(onRefresh: _loadData, child: _buildMyProjectsTab()),
                          RefreshIndicator(onRefresh: _loadData, child: _buildExploreTab()),
                          RefreshIndicator(onRefresh: _loadData, child: _buildDraftsTab()),
                        ],
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Explore project card (grid) ─────────────────────────────────────────────

class _ExploreProjectCard extends StatelessWidget {
  final Project project;
  final bool offlineBadge;
  final bool draftBadge;
  final VoidCallback onTap;
  final VoidCallback onLike;
  final VoidCallback onMap;
  final VoidCallback? onContinueDraft;

  const _ExploreProjectCard({
    required this.project,
    required this.offlineBadge,
    this.draftBadge = false,
    required this.onTap,
    required this.onLike,
    required this.onMap,
    this.onContinueDraft,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: GestureDetector(
            onTap: onTap,
            onLongPress: onMap,
            child: Stack(
              fit: StackFit.expand,
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                    image: project.coverImage != null
                        ? DecorationImage(image: CachedNetworkImageProvider(project.coverImage!), fit: BoxFit.cover)
                        : null,
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black.withValues(alpha: 0.5)],
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
                        shadows: [Shadow(offset: Offset(0, 1), blurRadius: 3, color: Colors.black45)],
                      ),
                    ),
                  ),
                ),
                // ── top-right badges (column) ──
                Positioned(
                  top: 6, right: 6,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      if (draftBadge)
                        _Badge(icon: Icons.visibility_off, color: const Color(0xFFF59E0B)),
                      if (project.isFinished)
                        _Badge(icon: Icons.archive, color: const Color(0xFF64748B)),
                      if (project.isPrivate)
                        _Badge(icon: Icons.lock, color: const Color(0xFFDC2626)),
                      if (project.fuzzy)
                        _Badge(icon: Icons.location_on, color: Colors.black.withValues(alpha: 0.6)),
                      if (project.isGlobal)
                        _Badge(icon: Icons.public, color: Colors.black.withValues(alpha: 0.6)),
                      if (offlineBadge)
                        _Badge(icon: Icons.offline_pin, color: Colors.green),
                    ].separated(const SizedBox(height: 4)),
                  ),
                ),
                // ── top-left badges (row) ──
                if (project.isCreator || project.isAdmin)
                  Positioned(
                    top: 6, left: 6,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (project.isCreator)
                          _Badge(icon: Icons.workspace_premium, color: const Color(0xFFF59E0B), size: 19),
                        if (project.isCreator && project.isAdmin) const SizedBox(width: 4),
                        if (project.isAdmin)
                          _Badge(icon: Icons.shield, color: const Color(0xFF3B82F6), size: 19),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 8, left: 4, right: 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  AnimatedLikeButton(
                    isLiked: project.isLiked,
                    likes: project.totalLikes,
                    onPressed: onLike,
                    iconSize: 16,
                    textSize: 12,
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: onMap,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.location_on, size: 16,
                            color: project.hasObservations ? Colors.green : Theme.of(context).colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text('${project.contributions}',
                            style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
                      ],
                    ),
                  ),
                ],
              ),
              if (onContinueDraft != null) ...[
                const SizedBox(height: 6),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: onContinueDraft,
                    icon: const Icon(Icons.edit, size: 13),
                    label: Text(AppLocalizations.of(context)!.continueLabel, style: const TextStyle(fontSize: 11)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      side: BorderSide(color: Colors.orange.shade300),
                      foregroundColor: Colors.orange.shade700,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

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
          Text(AppLocalizations.of(context)!.mapTitle,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(AppLocalizations.of(context)!.mapInteractive),
        ],
      ),
    );
  }
}

class _IconFilterButton extends StatelessWidget {
  final IconData icon;
  final bool isActive;
  final VoidCallback onTap;
  final VoidCallback? onClear;

  const _IconFilterButton({
    required this.icon,
    required this.isActive,
    required this.onTap,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final color = isActive ? Colors.blue[700]! : Theme.of(context).colorScheme.onSurfaceVariant;
    final bg = isActive
        ? Colors.blue[700]!.withValues(alpha: 0.12)
        : Theme.of(context).colorScheme.surfaceContainerLowest;
    final border = isActive ? Colors.blue[700]! : Theme.of(context).colorScheme.outlineVariant;

    return GestureDetector(
      onTap: isActive && onClear != null ? onClear : onTap,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: border),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(icon, size: 20, color: color),
            if (isActive)
              Positioned(
                top: 6,
                right: 6,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: Colors.blue[700],
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ─── Badge widget ─────────────────────────────────────────────────────────────

class _Badge extends StatelessWidget {
  final IconData icon;
  final Color color;
  final double size;

  const _Badge({required this.icon, required this.color, this.size = 16});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Icon(icon, size: size, color: Colors.white),
    );
  }
}

// ─── Extension: separated list ────────────────────────────────────────────────

extension _WidgetListSeparated on List<Widget> {
  List<Widget> separated(Widget separator) {
    if (isEmpty) return this;
    final result = <Widget>[];
    for (int i = 0; i < length; i++) {
      result.add(this[i]);
      if (i < length - 1) result.add(separator);
    }
    return result;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

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
                child: Icon(Icons.close, size: 15,
                    color: isActive ? Colors.white70 : Theme.of(context).colorScheme.onSurfaceVariant),
              )
            else
              Icon(Icons.expand_more, size: 16,
                  color: isActive ? Colors.white70 : Theme.of(context).colorScheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}
