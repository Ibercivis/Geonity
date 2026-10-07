import 'package:flutter/foundation.dart';
import 'package:geonity/utils/multilingual_utils.dart';

class ObservationField {
  final int id;
  final int projectId;
  final String key;
  final String label;
  final String fieldType;
  final bool required;
  /// Localized labels shown in the UI (e.g. "Least Concern").
  final List<String>? choices;
  /// Original values submitted to the backend (e.g. "lc").
  /// Parallel to [choices]; falls back to [choices] when null.
  final List<String>? choiceValues;
  final int order;
  final String helpText;
  final bool allowOther;

  ObservationField({
    required this.id,
    required this.projectId,
    required this.key,
    required this.label,
    required this.fieldType,
    required this.required,
    this.choices,
    this.choiceValues,
    required this.order,
    required this.helpText,
    this.allowOther = false,
  });

  factory ObservationField.fromJson(Map<String, dynamic> json) {
    final rawChoices = json['choices'] as List?;
    if (rawChoices != null && rawChoices.isNotEmpty) {
      debugPrint('Choice raw sample: ${rawChoices.first}');
    }
    final labels = rawChoices?.map((e) {
      if (e is String) return e;
      if (e is Map) return localizedText(e['label'] ?? e['value'] ?? e.toString());
      return e.toString();
    }).toList();
    final values = rawChoices?.map((e) {
      if (e is String) return e;
      if (e is Map) return (e['value'] ?? e['label'] ?? e).toString();
      return e.toString();
    }).toList();

    return ObservationField(
      id: json['id'] ?? 0,
      projectId: json['project'] ?? 0,
      key: json['key'] ?? '',
      label: localizedText(json['label']),
      fieldType: json['field_type'] ?? 'text',
      required: json['required'] ?? false,
      choices: labels,
      choiceValues: values,
      order: json['order'] ?? 0,
      helpText: localizedText(json['question_help']),
      allowOther: json['allow_other'] ?? false,
    );
  }
}
