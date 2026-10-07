class Invitation {
  final int id;
  final String type; // 'project' o 'organization'
  final String name; // Nombre del proyecto u organización
  final int? projectId;
  final int? organizationId;
  final String? role; // solo en invitaciones de organización
  final String invitedBy;
  final String createdAt;
  final String expiresAt;

  Invitation({
    required this.id,
    required this.type,
    required this.name,
    this.projectId,
    this.organizationId,
    this.role,
    required this.invitedBy,
    required this.createdAt,
    required this.expiresAt,
  });

  factory Invitation.fromJson(Map<String, dynamic> json) {
    // Detect type from which keys are present
    final bool isOrg = json.containsKey('organization_name') ||
        (json.containsKey('organization') && !json.containsKey('project'));

    return Invitation(
      id: json['id'] as int,
      type: isOrg ? 'organization' : 'project',
      name: (json['organization_name'] ?? json['project_name'] ?? json['name'] ?? '').toString(),
      projectId: json['project'] as int?,
      organizationId: json['organization'] as int?,
      role: json['role'] as String?,
      invitedBy: (json['invited_by_name'] ?? json['invited_by'] ?? '').toString(),
      createdAt: (json['created_at'] ?? '').toString(),
      expiresAt: (json['expires_at'] ?? '').toString(),
    );
  }

  bool get isProjectInvitation => type == 'project';
  bool get isOrganizationInvitation => type == 'organization';
  int? get entityId => projectId ?? organizationId;
}
