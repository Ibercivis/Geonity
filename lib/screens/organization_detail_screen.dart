import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html/flutter_widget_from_html.dart';
import '../l10n/app_localizations.dart';
import '../models/project.dart';
import '../services/organization_service.dart';
import '../services/project_service.dart';
import '../services/auth_service.dart';
import '../widgets/project_card.dart';
import 'project_detail_screen.dart';
import 'create_organization_screen.dart';
import 'manage_organization_admins_screen.dart';

class OrganizationDetailScreen extends StatefulWidget {
  final int organizationId;

  const OrganizationDetailScreen({super.key, required this.organizationId});

  @override
  State<OrganizationDetailScreen> createState() => _OrganizationDetailScreenState();
}

class _OrganizationDetailScreenState extends State<OrganizationDetailScreen> {
  final _organizationService = OrganizationService();
  final _projectService = ProjectService();
  final _authService = AuthService();
  Map<String, dynamic>? _orgData;
  List<Project> _projects = [];
  bool _isLoading = true;
  int? _userId;

  @override
  void initState() {
    super.initState();
    _loadOrganizationData();
  }

  Future<void> _loadOrganizationData() async {
    setState(() => _isLoading = true);
    try {
      final userId = await _authService.getUserId();
      final orgDetail = await _organizationService.getOrganizationDetail(widget.organizationId);
      final projects = await _projectService.getProjectsByOrganization(widget.organizationId);

      if (!mounted) return;
      setState(() {
        _userId = userId;
        _orgData = orgDetail;
        _projects = projects;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading organization data: $e');
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  void _showLeaveOrganizationDialog() {
    final l10n = AppLocalizations.of(context)!;
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(l10n.organizationLeaveConfirmTitle),
        content: Text(l10n.organizationLeaveConfirmMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context); // Usar context del widget, no del diálogo
              final navigator = Navigator.of(context);

              Navigator.pop(dialogContext); // Cerrar diálogo
              final success = await _organizationService.leaveOrganization(widget.organizationId);
              if (!mounted) return;

              if (success) {
                final msg = AppLocalizations.of(context)!.organizationLeft;
                navigator.pop(true); // Volver a la pantalla anterior
                messenger.showSnackBar(
                  SnackBar(content: Text(msg)),
                );
              } else {
                messenger.showSnackBar(
                  SnackBar(content: Text(AppLocalizations.of(context)!.organizationLeaveError)),
                );
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text(l10n.leave),
          ),
        ],
      ),
    );
  }

  void _showInviteDialog() {
    final emailController = TextEditingController();
    String selectedRole = 'member';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(AppLocalizations.of(context)!.inviteMember),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: emailController,
                decoration: InputDecoration(
                  labelText: AppLocalizations.of(context)!.emailFieldLabel,
                  hintText: AppLocalizations.of(context)!.inviteMemberHint,
                  border: const OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedRole,
                decoration: InputDecoration(
                  labelText: AppLocalizations.of(context)!.roleLabel,
                  border: const OutlineInputBorder(),
                ),
                items: [
                  DropdownMenuItem(value: 'member', child: Text(AppLocalizations.of(context)!.roleMember)),
                  DropdownMenuItem(value: 'administrator', child: Text(AppLocalizations.of(context)!.roleAdministrator)),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => selectedRole = value);
                  }
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(AppLocalizations.of(context)!.cancel),
            ),
            ElevatedButton(
              onPressed: () async {
                final email = emailController.text.trim();
                if (email.isEmpty || !email.contains('@')) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(AppLocalizations.of(context)!.enterValidEmail)),
                  );
                  return;
                }

                Navigator.pop(context);

                final result = await _organizationService.inviteToOrganization(
                  organizationId: widget.organizationId,
                  email: email,
                  role: selectedRole,
                );

                if (mounted) {
                  final localizations = AppLocalizations.of(context)!;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        result['success']
                            ? localizations.invitationSent
                            : (result['error'] ?? localizations.inviteMember),
                      ),
                      backgroundColor: result['success'] ? null : Colors.red,
                    ),
                  );
                  
                  if (result['success']) {
                    _loadOrganizationData(); // Recargar datos
                  }
                }
              },
              child: Text(AppLocalizations.of(context)!.sendInvitation),
            ),
          ],
        ),
      ),
    ).then((_) => emailController.dispose());
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_orgData == null) {
      return Scaffold(
        appBar: AppBar(title: Text(AppLocalizations.of(context)!.error)),
        body: Center(child: Text(AppLocalizations.of(context)!.errorLoadingOrganization)),
      );
    }

    final String principalName = _orgData!['principalName'] ?? '';
    final String? cover = _orgData!['cover'];
    final String? logo = _orgData!['logo'];
    final String? description = _orgData!['description'];
    final int projectCount = _projects.length;
    
    // Obtener creator, administrators y members
    final int? creatorId = _orgData!['creator'];
    final List<dynamic> administrators = _orgData!['administrators'] ?? [];
    final List<dynamic> members = _orgData!['members'] ?? [];
    
    // Calcular total de miembros: administrators + members
    final int totalMembers = administrators.length + members.length;
    
    // Determinar rol del usuario actual
    String? userRole;
    if (_userId != null) {
      if (_userId == creatorId) {
        userRole = 'creator';
      } else if (administrators.contains(_userId)) {
        userRole = 'administrator';
      } else if (members.contains(_userId)) {
        userRole = 'member';
      }
    }
    
    // Verificar permisos
    final bool canEdit = userRole == 'creator' || userRole == 'administrator';
    final bool canLeave = userRole == 'administrator' || userRole == 'member'; // Solo admins y members (no creators)
    final bool hasRole = userRole != null;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Header con cover y logo
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            automaticallyImplyLeading: false,
            actions: [
              // Botón editar (si es admin o creador)
              if (canEdit)
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
                            builder: (context) => CreateOrganizationScreen(
                              organizationId: widget.organizationId,
                            ),
                          ),
                        );
                        
                        if (result == true) {
                          _loadOrganizationData();
                        }
                      },
                    ),
                  ),
                ),
              // Botón gestionar miembros (si es admin o creador)
              if (canEdit)
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: CircleAvatar(
                    backgroundColor: Colors.purple[100],
                    child: IconButton(
                      icon: const Icon(Icons.group_add, color: Colors.purple, size: 20),
                      onPressed: () async {
                        Map<String, dynamic>? creatorData;
                        if (creatorId != null) {
                          creatorData = {'id': creatorId, 'username': AppLocalizations.of(context)!.creator};
                        }

                        final List<dynamic> admins = _orgData!['administrators'] ?? [];
                        final List<Map<String, dynamic>>? administratorsData = admins.isNotEmpty
                            ? admins.map((id) => {'id': id, 'username': 'Admin $id'} as Map<String, dynamic>).toList()
                            : null;

                        final result = await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ManageOrganizationAdminsScreen(
                              organizationId: widget.organizationId,
                              creator: creatorData,
                              administrators: administratorsData,
                            ),
                          ),
                        );
                        
                        if (result == true) {
                          _loadOrganizationData();
                        }
                      },
                    ),
                  ),
                ),
              // Botón borrar (si es creador)
              if (userRole == 'creator')
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
                            title: Text(AppLocalizations.of(context)!.deleteOrganizationQuestion),
                            content: Text(AppLocalizations.of(context)!.deleteOrganizationConfirm),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context),
                                child: Text(AppLocalizations.of(context)!.cancel),
                              ),
                              TextButton(
                                onPressed: () async {
                                  final navigator = Navigator.of(context);
                                  final scaffoldMessenger = ScaffoldMessenger.of(context);

                                  navigator.pop();

                                  showDialog(
                                    context: context,
                                    barrierDismissible: false,
                                    builder: (loadingContext) => const Center(
                                      child: CircularProgressIndicator(),
                                    ),
                                  );

                                  final success = await _organizationService.deleteOrganization(widget.organizationId);

                                  if (!mounted) return;

                                  navigator.pop();

                                  if (success) {
                                    scaffoldMessenger.showSnackBar(
                                      SnackBar(content: Text(AppLocalizations.of(context)!.organizationDeleted)),
                                    );
                                    navigator.pop(true);
                                  } else {
                                    scaffoldMessenger.showSnackBar(
                                      SnackBar(content: Text(AppLocalizations.of(context)!.organizationDeleteError)),
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
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                clipBehavior: Clip.none,
                children: [
                  // Cover image
                  Container(
                    height: 200,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.teal.shade700,
                          Colors.teal.shade500,
                        ],
                      ),
                    ),
                    child: cover != null
                        ? CachedNetworkImage(
                            imageUrl: cover,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            errorWidget: (context, url, error) => Container(),
                          )
                        : null,
                  ),
                  // Título sobre el cover
                  Positioned(
                    top: 70,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: Text(
                        principalName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          shadows: [
                            Shadow(
                              blurRadius: 4.0,
                              color: Colors.black54,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                  // Logo circular
                  Positioned(
                    top: 200 - 70,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: Container(
                        width: 140,
                        height: 140,
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Theme.of(context).colorScheme.surface,
                        ),
                        child: ClipOval(
                          child: logo != null
                              ? CachedNetworkImage(
                                  imageUrl: logo,
                                  width: 132,
                                  height: 132,
                                  fit: BoxFit.cover,
                                  errorWidget: (context, url, error) => Container(
                                    color: Theme.of(context).colorScheme.surfaceContainerLow,
                                    child: const Icon(Icons.business, size: 60),
                                  ),
                                )
                              : Container(
                                  color: Theme.of(context).colorScheme.surfaceContainerLow,
                                  child: const Icon(Icons.business, size: 60),
                                ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Espacio para el logo
          const SliverToBoxAdapter(child: SizedBox(height: 80)),

          // Estadísticas
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Column(
                    children: [
                      Text(
                        '$projectCount',
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        AppLocalizations.of(context)!.projectsLabel,
                        style: const TextStyle(fontSize: 16),
                      ),
                    ],
                  ),
                  Column(
                    children: [
                      Text(
                        '$totalMembers',
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        AppLocalizations.of(context)!.membersLabel,
                        style: const TextStyle(fontSize: 16),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Rol del usuario
          if (hasRole)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: userRole == 'creator'
                        ? Theme.of(context).colorScheme.secondaryContainer
                        : userRole == 'administrator'
                            ? Theme.of(context).colorScheme.primaryContainer
                            : Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        userRole == 'creator'
                            ? Icons.stars
                            : userRole == 'administrator'
                                ? Icons.admin_panel_settings
                                : Icons.person,
                        size: 18,
                        color: userRole == 'creator'
                            ? Theme.of(context).colorScheme.onSecondaryContainer
                            : userRole == 'administrator'
                                ? Theme.of(context).colorScheme.onPrimaryContainer
                                : Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        userRole == 'creator'
                            ? AppLocalizations.of(context)!.organizationRoleCreator
                            : userRole == 'administrator'
                                ? AppLocalizations.of(context)!.organizationRoleAdministrator
                                : AppLocalizations.of(context)!.organizationRoleMember,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: userRole == 'creator'
                              ? Theme.of(context).colorScheme.onSecondaryContainer
                              : userRole == 'administrator'
                                  ? Theme.of(context).colorScheme.onPrimaryContainer
                                  : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Descripción
          if (description != null && description.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                child: HtmlWidget(
                  description,
                  textStyle: const TextStyle(fontSize: 16),
                ),
              ),
            ),

          // Título de proyectos
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
              child: Text(
                AppLocalizations.of(context)!.projectsLabel,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),

          // Lista de proyectos
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final project = _projects[index];
                return ProjectCard(project: project);
              },
              childCount: _projects.length,
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
    );
  }
}
