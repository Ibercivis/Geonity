import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../services/organization_service.dart';
import '../config/app_config.dart';

class ManageOrganizationAdminsScreen extends StatefulWidget {
  final int organizationId;
  final Map<String, dynamic>? creator;
  final List<Map<String, dynamic>>? administrators;

  const ManageOrganizationAdminsScreen({
    Key? key,
    required this.organizationId,
    this.creator,
    this.administrators,
  }) : super(key: key);

  @override
  State<ManageOrganizationAdminsScreen> createState() => _ManageOrganizationAdminsScreenState();
}

class _ManageOrganizationAdminsScreenState extends State<ManageOrganizationAdminsScreen> {
  final _organizationService = OrganizationService();
  final _emailController = TextEditingController();

  bool _isLoading = false;
  bool _loadingInvitations = true;
  
  List<String> _invitedEmails = [];
  List<Map<String, dynamic>> _pendingInvitations = [];
  String _selectedRole = 'member';

  @override
  void initState() {
    super.initState();
    _loadOrganizationInvitations();
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _loadOrganizationInvitations() async {
    setState(() {
      _loadingInvitations = true;
    });

    final invitations = await _organizationService.getOrganizationInvitations(widget.organizationId);
    
    debugPrint('========================================');
    debugPrint('PENDING ORGANIZATION INVITATIONS LOADED: ${invitations.length}');
    if (invitations.isNotEmpty) {
      debugPrint('First invitation: ${invitations[0]}');
      debugPrint('All invitations: $invitations');
    }
    debugPrint('========================================');
    
    setState(() {
      _pendingInvitations = invitations;
      _loadingInvitations = false;
    });
  }

  void _addInvitedEmail(String email) {
    if (!_invitedEmails.contains(email)) {
      setState(() {
        _invitedEmails.add(email);
      });
    }
  }

  void _removeInvitedEmail(String email) {
    setState(() {
      _invitedEmails.remove(email);
    });
  }

  Future<void> _inviteMember() async {
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

    setState(() {
      _isLoading = true;
    });

    final result = await _organizationService.inviteToOrganization(
      organizationId: widget.organizationId,
      email: email,
      role: _selectedRole,
    );

    setState(() {
      _isLoading = false;
    });

    if (result['success']) {
      _addInvitedEmail(email);
      _emailController.clear();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(AppLocalizations.of(context)!.invitationSent),
            backgroundColor: Colors.green,
          ),
        );
      }

      // Recargar las invitaciones pendientes
      _loadOrganizationInvitations();
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

  Widget _sectionCard({required Widget child}) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      color: Theme.of(context).colorScheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Padding(padding: const EdgeInsets.all(16), child: child),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text(l10n.adminAndInvitationsTitle),
        centerTitle: true,
      ),
      body: SafeArea(child: _loadingInvitations
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Sección de Gestión actual
                    if (widget.creator != null || (widget.administrators != null && widget.administrators!.isNotEmpty)) ...[
                      _sectionCard(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.admin_panel_settings, size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  l10n.currentManagement,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            // Creador
                            if (widget.creator != null) ...[
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(Icons.star, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
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
                                        AppLocalizations.of(context)!.organizationRoleCreator,
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
                              if (widget.administrators != null && widget.administrators!.isNotEmpty)
                                const SizedBox(height: 12),
                            ],
                            
                            // Administradores
                            if (widget.administrators != null && widget.administrators!.isNotEmpty) ...[
                              ...widget.administrators!.map((admin) {
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(6),
                                        decoration: BoxDecoration(
                                          color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(Icons.person, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
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
                                              l10n.roleAdministrator,
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
                                );
                              }).toList(),
                            ],
                          ],
                        )),
                      const SizedBox(height: 24),
                    ],

                    // Invitaciones pendientes de la organización
                    if (_pendingInvitations.isNotEmpty) ...[
                      _sectionCard(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.pending_actions, size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  l10n.pendingInvitations,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            ..._pendingInvitations.map((invitation) {
                              final email = invitation['email'] ?? '';
                              final invitedBy = invitation['invited_by_name'] ?? l10n.userFallback;
                              final expiresAt = invitation['expires_at'] ?? '';
                              final role = invitation['role'] ?? 'member';
                              
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(Icons.email, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
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
                                            '${l10n.invitedBy(invitedBy)} • ${role == 'administrator' ? l10n.roleAdministrator : l10n.roleMember}',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                                            ),
                                          ),
                                          if (expiresAt.isNotEmpty)
                                            Text(
                                              l10n.expires(_formatDate(expiresAt)),
                                              style: TextStyle(
                                                fontSize: 11,
                                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                                                fontStyle: FontStyle.italic,
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        l10n.statusPending,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ],
                        )),
                      const SizedBox(height: 24),
                    ],

                    // Sección de Invitar miembros
                    Text(
                      l10n.invitationSendInstruction,
                      style: TextStyle(
                        fontSize: 14,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Campo de email
                    TextField(
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
                      onSubmitted: (_) => _inviteMember(),
                    ),
                    const SizedBox(height: 12),
                    
                    // Selector de rol y botón invitar
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _selectedRole,
                            decoration: InputDecoration(
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 14,
                              ),
                            ),
                            items: [
                              DropdownMenuItem(value: 'member', child: Text(l10n.roleMember)),
                              DropdownMenuItem(value: 'administrator', child: Text(l10n.roleAdministrator)),
                            ],
                            onChanged: (value) {
                              if (value != null) {
                                setState(() {
                                  _selectedRole = value;
                                });
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton(
                          onPressed: _isLoading ? null : _inviteMember,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 16,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : Text(l10n.invite),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Lista de invitaciones enviadas en esta sesión
                    if (_invitedEmails.isNotEmpty) ...[
                      _sectionCard(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.invitationsSentLabel,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 8),
                            ...(_invitedEmails.map((email) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Row(
                                  children: [
                                    const Icon(Icons.check_circle, size: 16),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        email,
                                        style: const TextStyle(fontSize: 14),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList()),
                          ],
                        )),
                      const SizedBox(height: 8),
                      Text(
                        l10n.invitationsExpireInfo,
                        style: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            )),
      bottomNavigationBar: SafeArea(top: false, child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.2),
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
                  side: BorderSide(color: Theme.of(context).colorScheme.outline),
                ),
                child: Text(
                  l10n.back,
                  style: TextStyle(
                    fontSize: 16,
                    color: Theme.of(context).colorScheme.onSurface,
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
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ],
        ),
      )),
    );
  }
}
