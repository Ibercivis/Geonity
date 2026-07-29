class FieldForm {
  final int id;
  final String name;
  final int projectId;
  final Map<String, dynamic>? schema;

  FieldForm({
    required this.id,
    required this.name,
    required this.projectId,
    this.schema,
  });

  factory FieldForm.fromJson(Map<String, dynamic> json) {
    return FieldForm(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      projectId: json['project'] ?? json['project_id'] ?? 0,
      schema: json['schema'],
    );
  }
}
