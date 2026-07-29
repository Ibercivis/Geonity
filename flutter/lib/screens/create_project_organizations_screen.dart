import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../services/project_service.dart';

class CreateProjectOrganizationsScreen extends StatefulWidget {
  final int projectId;
  final Map<String, dynamic>? creator;
  final List<Map<String, dynamic>>? administrators;

  const CreateProjectOrganizationsScreen({
    Key? key,
    required this.projectId,
    this.creator,
    this.administrators,
  }) : super(key: key);

  @override
  State<CreateProjectOrganizationsScreen> createState() => _CreateProjectOrganizationsScreenState();
}

class _CreateProjectOrganizationsScreenState extends State<CreateProjectOrganizationsScreen> {
  final _projectService = ProjectService();
  final _emailController = TextEditingController();

  bool _isLoading = false;
  bool _loadingInvitations = true;

  List<String> _invitedEmails = [];
  List<Map<String, dynamic>> _pendingInvitations = [];

  @override
  void initState() {
    super.initState();
    _loadProjectInvitations();
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _loadProjectInvitations() async {
    setState(() {
      _loadingInvitations = true;
    });

    final invitations = await _projectService.getProjectInvitations(widget.projectId);

    debugPrint('========================================');
    debugPrint('PENDING INVITATIONS LOADED: ${invitations.length}');
    if (invitations.isNotEmpty) {
      debugPrint('First invitation: ${invitations[0]}');
      debugPrint('All invitations: $invitations');
    }
    debugPrint('========================================');

    setState(() {
      _pendingInvitations = invitations.where((inv) => inv['status'] == 'pending').toList();
      _loadingInvitations = false;
    });
  }

  Future<void> _inviteAdmin() async {
    final email = _emailController.text.trim();

    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.emailRequired),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (!_isValidEmail(email)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.emailValidRequired),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (_invitedEmails.contains(email)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.emailAlreadyInvited),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final result = await _projectService.inviteAdmin(widget.projectId, email);

    setState(() {
      _isLoading = false;
    });

    if (result['success'] == true) {
      setState(() {
        _invitedEmails.add(email);
        _emailController.clear();
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.invitationSent),
            backgroundColor: Colors.green,
          ),
        );
      }

      _loadProjectInvitations();
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['error'] ?? AppLocalizations.of(context)!.invitationSendError),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final difference = date.difference(now);

      if (difference.inDays > 0) {
        return '${difference.inDays}d';
      } else if (difference.inHours > 0) {
        return '${difference.inHours}h';
      } else {
        return AppLocalizations.of(context)!.soonExpiry;
      }
    } catch (e) {
      return '';
    }
  }

  Future<void> _finish() async {
    if (mounted) {
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text(l10n.adminAndInvitationsTitle),
        centerTitle: true,
      ),
      body: SafeArea(
        child: _loadingInvitations
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.administrators,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Gestión actual del proyecto
                      if (widget.creator != null || (widget.administrators != null && widget.administrators!.isNotEmpty)) ...[
                        Card(
                          margin: EdgeInsets.zero,
                          elevation: 0,
                          color: colorScheme.surface,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: colorScheme.outlineVariant),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.admin_panel_settings, size: 20),
                                    const SizedBox(width: 8),
                                    Text(
                                      l10n.currentManagement,
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),

                                if (widget.creator != null) ...[
                                  Row(
                                    children: [
                                      const CircleAvatar(
                                        radius: 14,
                                        child: Icon(Icons.star, size: 16),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              widget.creator!['username'] ?? widget.creator!['email'] ?? '',
                                              style: const TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            Text(
                                              l10n.creator,
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: colorScheme.onSurfaceVariant,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (widget.administrators != null && widget.administrators!.isNotEmpty)
                                    const SizedBox(height: 12),
                                ],

                                if (widget.administrators != null && widget.administrators!.isNotEmpty) ...[
                                  ...widget.administrators!.map((admin) {
                                    return Padding(
                                      padding: const EdgeInsets.only(bottom: 8),
                                      child: Row(
                                        children: [
                                          const CircleAvatar(
                                            radius: 14,
                                            child: Icon(Icons.person, size: 16),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  admin['username'] ?? admin['email'] ?? '',
                                                  style: const TextStyle(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                                Text(
                                                  l10n.administrator,
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: colorScheme.onSurfaceVariant,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }).toList(),
                                ],
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Invitaciones pendientes del proyecto
                      if (_pendingInvitations.isNotEmpty) ...[
                        Card(
                          margin: EdgeInsets.zero,
                          elevation: 0,
                          color: colorScheme.surface,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: colorScheme.outlineVariant),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.pending_actions, size: 20),
                                    const SizedBox(width: 8),
                                    Text(
                                      l10n.pendingInvitations,
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                ..._pendingInvitations.map((invitation) {
                                  final email = invitation['email'] ?? '';
                                  final invitedBy = invitation['invited_by_name'] ?? l10n.userFallback;
                                  final expiresAt = invitation['expires_at'] ?? '';

                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const CircleAvatar(
                                          radius: 14,
                                          child: Icon(Icons.email, size: 16),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                email,
                                                style: const TextStyle(
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                l10n.invitedBy(invitedBy),
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: colorScheme.onSurfaceVariant,
                                                ),
                                              ),
                                              if (expiresAt.isNotEmpty)
                                                Text(
                                                  l10n.expires(_formatDate(expiresAt)),
                                                  style: TextStyle(
                                                    fontSize: 11,
                                                    color: colorScheme.onSurfaceVariant,
                                                    fontStyle: FontStyle.italic,
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ),
                                        Text(
                                          l10n.statusPending,
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: colorScheme.onSurfaceVariant,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      Text(
                        l10n.inviteAsAdminInstruction,
                        style: TextStyle(
                          fontSize: 14,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Campo de email
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _emailController,
                              decoration: InputDecoration(
                                hintText: l10n.emailExampleHint,
                                prefixIcon: const Icon(Icons.email_outlined),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 14,
                                ),
                              ),
                              keyboardType: TextInputType.emailAddress,
                              onSubmitted: (_) => _inviteAdmin(),
                            ),
                          ),
                          const SizedBox(width: 12),
                          ElevatedButton(
                            onPressed: _isLoading ? null : _inviteAdmin,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: _isLoading
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                : Text(l10n.invite),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Lista de emails invitados
                      if (_invitedEmails.isNotEmpty) ...[
                        Card(
                          margin: EdgeInsets.zero,
                          elevation: 0,
                          color: colorScheme.surface,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: colorScheme.outlineVariant),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  l10n.invitationsSentLabel,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 8),
                                ...(_invitedEmails.map((email) {
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 4),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.check_circle, size: 16),
                                        const SizedBox(width: 8),
                                        Expanded(child: Text(email, style: const TextStyle(fontSize: 14))),
                                      ],
                                    ),
                                  );
                                }).toList()),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          l10n.invitationsExpireInfo,
                          style: TextStyle(
                            fontSize: 12,
                            color: colorScheme.onSurfaceVariant,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: colorScheme.surface,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                spreadRadius: 1,
                blurRadius: 5,
                offset: const Offset(0, -3),
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                    side: BorderSide(color: colorScheme.outline),
                  ),
                  child: Text(
                    l10n.back,
                    style: TextStyle(
                      fontSize: 16,
                      color: colorScheme.onSurface,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _finish,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(
                          l10n.finish,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
