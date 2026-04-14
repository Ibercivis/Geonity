import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../l10n/app_localizations.dart';
import '../services/auth_service.dart';
import '../services/locale_service.dart';
import '../services/observation_service.dart';
import '../services/project_service.dart';
import '../services/theme_service.dart';
import '../models/project.dart';
import '../models/organization.dart';
import '../widgets/project_card.dart';
import '../widgets/organization_card.dart';
import 'map_screen.dart';
import 'edit_profile_screen.dart';
import 'login_screen.dart';
import 'changelog_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _authService = AuthService();
  final _projectService = ProjectService();
  final _observationService = ObservationService();

  Map<String, dynamic>? _profileData;
  List<Map<String, dynamic>> _myObservations = [];
  List<Project> _adminProjects = [];
  List<Project> _participatingProjects = [];
  List<Project> _likedProjects = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }


  String _formatDateTime(String? dateTimeStr) {
    if (dateTimeStr == null || dateTimeStr.isEmpty) return '';
    final localizations = AppLocalizations.of(context)!;
    
    try {
      final dateTime = DateTime.parse(dateTimeStr);
      final now = DateTime.now();
      final difference = now.difference(dateTime);
      
      if (difference.inMinutes < 1) {
        return localizations.timeAgoMoment;
      } else if (difference.inMinutes < 60) {
        return localizations.timeAgoMinutes(difference.inMinutes);
      } else if (difference.inHours < 24) {
        return localizations.timeAgoHours(difference.inHours);
      } else if (difference.inDays < 7) {
        return localizations.timeAgoDays(difference.inDays);
      } else if (difference.inDays < 30) {
        final weeks = (difference.inDays / 7).floor();
        return localizations.timeAgoWeeks(weeks);
      } else if (difference.inDays < 365) {
        final months = (difference.inDays / 30).floor();
        return months > 1 
            ? localizations.timeAgoMonthsPlural(months)
            : localizations.timeAgoMonths(months);
      } else {
        final years = (difference.inDays / 365).floor();
        return years > 1 
            ? localizations.timeAgoYearsPlural(years)
            : localizations.timeAgoYears(years);
      }
    } catch (e) {
      return dateTimeStr;
    }
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _authService.getUserProfile(),
        _observationService.getMyObservations(),
        _projectService.getMyAdminProjects(),
        _projectService.getMyParticipatingProjects(),
        _projectService.getMyLikedProjects(),
      ]);
      if (!mounted) return;
      setState(() {
        _profileData = results[0] as Map<String, dynamic>?;
        _myObservations = results[1] as List<Map<String, dynamic>>;
        _adminProjects = results[2] as List<Project>;
        _participatingProjects = results[3] as List<Project>;
        _likedProjects = results[4] as List<Project>;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading profile: $e');
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  void _showSettingsSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        final l10n = AppLocalizations.of(ctx)!;
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Theme.of(ctx).colorScheme.outlineVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                l10n.settings,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 20),
              // Idioma
              Row(
                children: [
                  Icon(Icons.language, color: Theme.of(ctx).colorScheme.primary),
                  const SizedBox(width: 12),
                  Text(l10n.languageTitle, style: const TextStyle(fontSize: 16)),
                  const Spacer(),
                  Consumer<LocaleService>(
                    builder: (ctx, localeService, _) => DropdownButton<String>(
                      value: localeService.getCurrentLanguage(),
                      underline: const SizedBox(),
                      items: [
                        DropdownMenuItem(value: 'system', child: Text(l10n.languageSystem)),
                        DropdownMenuItem(value: 'es', child: Text(l10n.languageSpanish)),
                        DropdownMenuItem(value: 'en', child: Text(l10n.languageEnglish)),
                        DropdownMenuItem(value: 'pt', child: Text(l10n.languagePortuguese)),
                        DropdownMenuItem(value: 'it', child: Text(l10n.languageItalian)),
                      ],
                      onChanged: (value) {
                        localeService.setLocale(value == 'system' ? null : value);
                      },
                    ),
                  ),
                ],
              ),
              const Divider(height: 28),
              // Tema
              Row(
                children: [
                  Icon(Icons.brightness_6, color: Theme.of(ctx).colorScheme.primary),
                  const SizedBox(width: 12),
                  Text(l10n.themeTitle, style: const TextStyle(fontSize: 16)),
                  const Spacer(),
                  Consumer<ThemeService>(
                    builder: (ctx, themeService, _) => DropdownButton<String>(
                      value: themeService.getCurrentThemeMode(),
                      underline: const SizedBox(),
                      items: [
                        DropdownMenuItem(value: 'system', child: Text(l10n.themeSystem)),
                        DropdownMenuItem(value: 'light', child: Text(l10n.themeLight)),
                        DropdownMenuItem(value: 'dark', child: Text(l10n.themeDark)),
                      ],
                      onChanged: (value) {
                        if (value != null) themeService.setThemeMode(value);
                      },
                    ),
                  ),
                ],
              ),
              const Divider(height: 28),
              // Versión
              FutureBuilder<PackageInfo>(
                future: PackageInfo.fromPlatform(),
                builder: (ctx, snap) {
                  final version = snap.hasData
                      ? '${snap.data!.version} (${snap.data!.buildNumber})'
                      : '—';
                  return Row(
                    children: [
                      Icon(Icons.info_outline, color: Theme.of(ctx).colorScheme.primary),
                      const SizedBox(width: 12),
                      Text(l10n.appVersion, style: const TextStyle(fontSize: 16)),
                      const Spacer(),
                      Text(version, style: TextStyle(color: Theme.of(ctx).colorScheme.onSurfaceVariant)),
                    ],
                  );
                },
              ),
              const Divider(height: 28),
              // Novedades
              InkWell(
                onTap: () {
                  Navigator.pop(ctx);
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ChangelogScreen()),
                  );
                },
                borderRadius: BorderRadius.circular(8),
                child: Row(
                  children: [
                    Icon(Icons.new_releases_outlined, color: Theme.of(ctx).colorScheme.primary),
                    const SizedBox(width: 12),
                    Text(l10n.whatsNew, style: const TextStyle(fontSize: 16)),
                    const Spacer(),
                    Icon(Icons.chevron_right, color: Theme.of(ctx).colorScheme.onSurfaceVariant),
                  ],
                ),
              ),
              const Divider(height: 28),
              // Política de privacidad
              InkWell(
                onTap: () => launchUrl(
                  Uri.parse('https://geonity.ibercivis.es/privacy-policy'),
                  mode: LaunchMode.externalApplication,
                ),
                borderRadius: BorderRadius.circular(8),
                child: Row(
                  children: [
                    Icon(Icons.privacy_tip_outlined, color: Theme.of(ctx).colorScheme.primary),
                    const SizedBox(width: 12),
                    Text(l10n.privacyPolicy, style: const TextStyle(fontSize: 16)),
                    const Spacer(),
                    Icon(Icons.open_in_new, size: 18, color: Theme.of(ctx).colorScheme.onSurfaceVariant),
                  ],
                ),
              ),
              const Divider(height: 28),
              // Eliminar cuenta (web)
              InkWell(
                onTap: () => launchUrl(
                  Uri.parse('https://geonity.ibercivis.es/delete-account'),
                  mode: LaunchMode.externalApplication,
                ),
                borderRadius: BorderRadius.circular(8),
                child: Row(
                  children: [
                    Icon(Icons.delete_outline, color: Colors.red.shade400),
                    const SizedBox(width: 12),
                    Text(l10n.deleteAccountWeb, style: TextStyle(fontSize: 16, color: Colors.red.shade400)),
                    const Spacer(),
                    Icon(Icons.open_in_new, size: 18, color: Theme.of(ctx).colorScheme.onSurfaceVariant),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _logout() async {
    await _authService.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  Future<void> _showDeleteAccountDialog() async {
    bool keepObservations = true;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(AppLocalizations.of(ctx)!.deleteAccountTitle),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                AppLocalizations.of(ctx)!.deleteAccountMessage,
              ),
              const SizedBox(height: 16),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(AppLocalizations.of(ctx)!.deleteAccountKeepObservations),
                subtitle: Text(
                  AppLocalizations.of(ctx)!.deleteAccountObservationsWarning,
                  style: const TextStyle(fontSize: 12),
                ),
                value: keepObservations,
                onChanged: (value) =>
                    setDialogState(() => keepObservations = value ?? true),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(AppLocalizations.of(ctx)!.cancel),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(
                AppLocalizations.of(ctx)!.delete,
                style: const TextStyle(color: Colors.red),
              ),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true || !mounted) return;

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    try {
      await _authService.deleteAccount(keepObservations: keepObservations);
      navigator.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    } catch (e) {
      debugPrint('Error deleting account: $e');
      messenger.showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.deleteAccountError)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_profileData == null) {
      return Scaffold(
        appBar: AppBar(
          elevation: 0,
          title: Text(AppLocalizations.of(context)!.myProfile),
        ),
        body: Center(
          child: Text(AppLocalizations.of(context)!.errorLoadingProfile),
        ),
      );
    }

    final localizations = AppLocalizations.of(context)!;
    final String? cover = _profileData!['cover'];
    final String? username = _profileData!['username'];
    final String? email = _profileData!['email'];
    final String? firstName = _profileData!['first_name'];
    final String? lastName = _profileData!['last_name'];
    final String? biography = _profileData!['biography'];
    final Map<String, dynamic>? country = _profileData!['country'];
    final List<dynamic> createdOrgs = _profileData!['created_organizations'] ?? [];
    final List<dynamic> adminOrgs = _profileData!['admin_organizations'] ?? [];
    final List<dynamic> memberOrgs = _profileData!['member_organizations'] ?? [];

    final Map<int, dynamic> orgsById = {};
    for (final org in [...createdOrgs, ...adminOrgs, ...memberOrgs]) {
      final id = org['id'] as int?;
      if (id != null) orgsById[id] = org;
    }
    final allOrgs = orgsById.values.toList();

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadProfile,
        child: CustomScrollView(
          slivers: [
            // Header con cover
            SliverAppBar(
              expandedHeight: 200,
              floating: false,
              pinned: false,
              stretch: true,
              actions: [
                CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                  child: IconButton(
                    icon: const Icon(Icons.settings, color: Colors.blue, size: 20),
                    onPressed: _showSettingsSheet,
                  ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                  child: IconButton(
                    icon: const Icon(Icons.edit, color: Colors.blue, size: 20),
                    onPressed: () async {
                      final result = await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => EditProfileScreen(
                            profileData: _profileData!,
                          ),
                        ),
                      );
                      if (result == true && mounted) {
                        _loadProfile();
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: cover != null
                    ? CachedNetworkImage(
                        imageUrl: cover,
                        fit: BoxFit.cover,
                        errorWidget: (context, url, error) => Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Colors.blue.shade400, Colors.blue.shade600],
                            ),
                          ),
                        ),
                      )
                    : Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.blue.shade400, Colors.blue.shade600],
                          ),
                        ),
                      ),
              ),
            ),

            // Información básica
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Nombre completo
                    if (firstName != null || lastName != null)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${firstName ?? ''} ${lastName ?? ''}'.trim(),
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(height: 4),
                        ],
                      ),
                    // Username
                    if (username != null)
                      Row(
                        children: [
                          Icon(Icons.alternate_email, size: 18, color: Theme.of(context).colorScheme.onSurfaceVariant),
                          const SizedBox(width: 4),
                          Text(
                            username,
                            style: TextStyle(
                              fontSize: 16,
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    if (username != null) const SizedBox(height: 8),
                    // Email
                    if (email != null)
                      Row(
                        children: [
                          Icon(Icons.email, size: 18, color: Theme.of(context).colorScheme.onSurfaceVariant),
                          const SizedBox(width: 4),
                          Text(
                            email,
                            style: TextStyle(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                          ),
                        ],
                      ),
                    if (email != null) const SizedBox(height: 16),
                    if (biography != null && biography.isNotEmpty)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            localizations.profileBiography,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            biography,
                            style: TextStyle(fontSize: 14, color: Theme.of(context).colorScheme.onSurface),
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    if (country != null)
                      Row(
                        children: [
                          Icon(Icons.location_on, size: 20, color: Theme.of(context).colorScheme.onSurfaceVariant),
                          const SizedBox(width: 8),
                          Text(
                            country['name'] ?? '',
                            style: TextStyle(fontSize: 14, color: Theme.of(context).colorScheme.onSurface),
                          ),
                        ],
                      ),
                    const SizedBox(height: 24),
                    const Divider(thickness: 1),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),

            // Estadísticas
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _StatCard(
                      icon: Icons.visibility,
                      count: _myObservations.length,
                      label: localizations.profileObservations,
                    ),
                  ],
                ),
              ),
            ),

            // Mis Observaciones (Colapsado)
            if (_myObservations.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                  child: Theme(
                    data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                    child: ExpansionTile(
                      tilePadding: EdgeInsets.zero,
                      leading: const Icon(Icons.visibility, color: Colors.blue),
                      title: Text(
                        localizations.myObservations(_myObservations.length),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      children: [
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _myObservations.length,
                          itemBuilder: (context, index) {
                            final obs = _myObservations[index];
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
                              child: ListTile(
                                leading: obs['cover_project']?['image'] != null
                                    ? ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: CachedNetworkImage(
                                          imageUrl: obs['cover_project']['image'],
                                          width: 50,
                                          height: 50,
                                          fit: BoxFit.cover,
                                          errorWidget: (context, url, error) => Container(
                                            width: 50,
                                            height: 50,
                                            color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                            child: const Icon(Icons.location_on),
                                          ),
                                        ),
                                      )
                                    : Container(
                                        width: 50,
                                        height: 50,
                                        decoration: BoxDecoration(
                                          color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Icon(Icons.location_on),
                                      ),
                                title: Text(obs['name_project'] ?? localizations.profileObservationDefault),
                                subtitle: Text(
                                  _formatDateTime(obs['updated_at']),
                                  style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                ),
                                trailing: const Icon(Icons.map, color: Colors.blue),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => MapScreen(
                                        projectId: obs['id_project'],
                                        projectName: obs['name_project'] ?? localizations.profileObservationDefault,
                                      ),
                                    ),
                                  );
                                },
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // Proyectos Creados o Administrados
            if (_adminProjects.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                  child: Row(
                    children: [
                      const Icon(Icons.create, color: Colors.blue),
                      const SizedBox(width: 8),
                      Text(
                        localizations.createdProjectsCount(_adminProjects.length),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            if (_adminProjects.isNotEmpty)
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => ProjectCard(
                    project: _adminProjects[index],
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    onProjectDeleted: _loadProfile,
                  ),
                  childCount: _adminProjects.length,
                ),
              ),

            // Proyectos en los que Participo
            if (_participatingProjects.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                  child: Row(
                    children: [
                      const Icon(Icons.group_work, color: Colors.blue),
                      const SizedBox(width: 8),
                      Text(
                        localizations.participatedProjectsCount(_participatingProjects.length),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            if (_participatingProjects.isNotEmpty)
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => ProjectCard(
                    project: _participatingProjects[index],
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    onProjectDeleted: _loadProfile,
                  ),
                  childCount: _participatingProjects.length,
                ),
              ),

            // Proyectos que me Gustan
            if (_likedProjects.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                  child: Row(
                    children: [
                      const Icon(Icons.favorite, color: Colors.red),
                      const SizedBox(width: 8),
                      Text(
                        localizations.likedProjectsCount(_likedProjects.length),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            if (_likedProjects.isNotEmpty)
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => ProjectCard(
                    project: _likedProjects[index],
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    onProjectDeleted: _loadProfile,
                  ),
                  childCount: _likedProjects.length,
                ),
              ),

            // Mis Organizaciones
            if (allOrgs.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                  child: Row(
                    children: [
                      const Icon(Icons.business, color: Colors.blue),
                      const SizedBox(width: 8),
                      Text(
                        localizations.myOrganizations(allOrgs.length),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            if (allOrgs.isNotEmpty)
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 0.85,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final orgData = allOrgs[index];
                      final org = Organization.fromJson(orgData);
                      final userRole = orgData['user_role'];
                      return OrganizationCard(
                        organization: org,
                        userRole: userRole,
                      );
                    },
                    childCount: allOrgs.length,
                  ),
                ),
              ),

            // Logout
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                child: OutlinedButton.icon(
                  onPressed: _logout,
                  icon: const Icon(Icons.logout),
                  label: Text(localizations.logout),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                  ),
                ),
              ),
            ),

            // Danger Zone
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, color: Colors.red.shade700, size: 18),
                        const SizedBox(width: 6),
                        Text(
                          localizations.dangerZone,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Colors.red.shade700,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: _showDeleteAccountDialog,
                      icon: Icon(Icons.delete_forever, color: Colors.red.shade700),
                      label: Text(
                        localizations.deleteAccount,
                        style: TextStyle(color: Colors.red.shade700),
                      ),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                        side: BorderSide(color: Colors.red.shade300),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 80)),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final int count;
  final String label;

  const _StatCard({
    required this.icon,
    required this.count,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Icon(icon, size: 32, color: Colors.blue),
              const SizedBox(height: 8),
              Text(
                '$count',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
