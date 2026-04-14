import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../services/project_service.dart';
import '../utils/multilingual_utils.dart';
import 'create_project_message_screen.dart';

class FieldData {
  int? id;             // server-assigned ID (null for new fields)
  String name;         // localized — shown in the UI
  String rawName;      // raw from server (may be JSON-encoded multilingual map)
  int? typeId;
  String? typeValue;
  String? typeName;
  String? questionHelp;      // localized — shown in the UI
  String? rawQuestionHelp;   // raw from server
  bool isRequired;
  bool allowOther;
  List<Map<String, String>> choices;         // localized labels — shown in the UI
  List<dynamic> rawChoices;                  // raw from server (preserves multilingual)

  FieldData({
    this.id,
    this.name = '',
    this.rawName = '',
    this.typeId,
    this.typeValue,
    this.typeName,
    this.questionHelp,
    this.rawQuestionHelp,
    this.isRequired = false,
    this.allowOther = false,
    List<Map<String, String>>? choices,
    List<dynamic>? rawChoices,
  })  : choices = choices ?? [],
        rawChoices = rawChoices ?? [];
}

class CreateProjectFieldsScreen extends StatefulWidget {
  final String projectName;
  final String projectDescription;
  final File? coverImage;
  final List<int> selectedTopicIds;
  final List<int> selectedOrganizationIds;
  final bool isPrivate;
  final bool isPublicMap;
  final bool isDatabasePrivate;
  final bool isFuzzyGeoposition;
  final bool isDraft;
  final bool isEnded;
  final bool isEmailOnObservation;
  final bool isGlobal;
  final List<String> selectedCountryCodes;
  final String? password;
  final int? projectId; // Para modo edición
  final int? contributions; // Número de observaciones existentes
  // State restored from a previous visit (create mode only)
  final Map<String, dynamic>? initialFieldForm;
  final String? initialMessage;

  const CreateProjectFieldsScreen({
    super.key,
    required this.projectName,
    required this.projectDescription,
    this.coverImage,
    required this.selectedTopicIds,
    required this.selectedOrganizationIds,
    required this.isPrivate,
    this.isPublicMap = false,
    required this.isDatabasePrivate,
    this.isFuzzyGeoposition = false,
    this.isDraft = true,
    this.isEnded = false,
    this.isEmailOnObservation = false,
    this.isGlobal = true,
    this.selectedCountryCodes = const [],
    this.password,
    this.projectId,
    this.contributions,
    this.initialFieldForm,
    this.initialMessage,
  });

  @override
  State<CreateProjectFieldsScreen> createState() => _CreateProjectFieldsScreenState();
}

class _CreateProjectFieldsScreenState extends State<CreateProjectFieldsScreen> {
  final _projectService = ProjectService();
  bool _isLoading = false;
  bool _loadingTypes = true;
  bool _loadingData = true; // Loading general

  List<Map<String, dynamic>> _questionTypes = [];
  List<FieldData> _fields = [];
  List<FieldData> _originalFields = []; // Campos originales para comparar
  int? _selectedFieldIndex;
  String? _existingPostObservationMessage;
  bool _existingShowPostMessage = true;
  Map<String, dynamic>? _rawFieldFormData; // Raw server data (preserves multilingual)
  String? _returnedMessage; // Message returned from CreateProjectMessageScreen

  bool get _hasObservations => (widget.contributions ?? 0) > 0;
  bool get _isEditMode => widget.projectId != null;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loadingData = true);
    await _loadQuestionTypes();
    if (_isEditMode) {
      await _loadExistingFields();
    } else if (widget.initialFieldForm != null) {
      _parseFieldsFromSaved(widget.initialFieldForm!);
    }
    setState(() => _loadingData = false);
  }

  /// Restores field list from a previously-built fieldFormToSend map (create mode only).
  void _parseFieldsFromSaved(Map<String, dynamic> form) {
    final questions = form['questions'] as List<dynamic>? ?? [];
    _fields = questions.map((q) {
      final rawChoicesList = (q['choices'] as List?) ?? [];
      final choices = rawChoicesList.map<Map<String, String>>((c) {
        if (c is Map) {
          return {
            'value': c['value']?.toString() ?? '',
            'label': localizedText(c['label'] ?? c['value'] ?? ''),
          };
        }
        return {'value': c.toString(), 'label': c.toString()};
      }).toList();

      final rawHelp = q['question_help'];
      final helpStr = rawHelp is Map
          ? jsonEncode(rawHelp)
          : (rawHelp?.toString() ?? '');

      return FieldData(
        name: localizedText(q['question_text'] ?? ''),
        rawName: q['question_text'] is Map
            ? jsonEncode(q['question_text'])
            : (q['question_text']?.toString() ?? ''),
        typeValue: q['answer_type'],
        typeName: _getTypeName(q['answer_type']),
        questionHelp: helpStr.isNotEmpty ? localizedText(rawHelp) : null,
        rawQuestionHelp: helpStr.isNotEmpty ? helpStr : null,
        isRequired: q['mandatory'] ?? false,
        allowOther: q['allow_other'] ?? false,
        choices: choices,
        rawChoices: rawChoicesList,
      );
    }).toList();
  }

  Future<void> _loadExistingFields() async {
    if (widget.projectId == null) return;
    
    try {
      final projectData = await _projectService.getProjectDetail(widget.projectId!);
      
      if (projectData == null) return;

      // Save existing post-observation message (raw, to preserve multilingual data)
      final rawMsg = projectData['post_observation_message'];
      _existingPostObservationMessage =
          rawMsg != null ? rawMsg.toString() : null;
      _existingShowPostMessage = projectData['show_post_message'] as bool? ?? true;

      debugPrint('Loading existing fields for project ${widget.projectId}');
      
      // Obtener el ID del field_form
      final fieldFormId = projectData['field_form'];
      debugPrint('Field form ID: $fieldFormId');
      
      if (fieldFormId == null) {
        debugPrint('No field form found for this project');
        return;
      }
      
      // Obtener el field_form completo
      final fieldFormData = await _projectService.getFieldForm(fieldFormId, raw: true);
      
      if (fieldFormData == null) {
        debugPrint('Could not load field form data');
        return;
      }
      
      debugPrint('Field form data loaded: $fieldFormData');

      // Keep raw data so the translation screen can access it even without changes
      _rawFieldFormData = fieldFormData;

      if (fieldFormData['questions'] != null) {
        final questions = fieldFormData['questions'] as List;
        debugPrint('Number of questions: ${questions.length}');
        final loadedFields = questions.map((q) {
          debugPrint('Question data: $q');
          final rawQ = q['question_text'] ?? q['question'] ?? '';
          final rawHelp = q['question_help'];
          final rawChoicesList = (q['choices'] as List?) ?? [];
          // Normalize rawChoices: if label is a plain string, wrap as {"default": label}
          // so re-saves preserve the multilingual format even before backend fix.
          final normalizedRawChoices = rawChoicesList.map((c) {
            if (c is Map && c['label'] is String) {
              return {...c, 'label': {'default': c['label']}};
            }
            return c;
          }).toList();
          final choices = rawChoicesList.map((c) {
                  if (c is String) {
                    return {'value': c, 'label': c};
                  } else {
                    return {
                      'value': c['value']?.toString() ?? '',
                      'label': localizedText(c['label'] ?? c['value'] ?? ''),
                    };
                  }
                }).toList().cast<Map<String, String>>();

          return FieldData(
            id: q['id'] as int?,
            name: localizedText(rawQ),
            rawName: rawQ is Map ? jsonEncode(rawQ) : rawQ.toString(),
            typeValue: q['answer_type'],
            typeName: _getTypeName(q['answer_type']),
            questionHelp: rawHelp != null ? localizedText(rawHelp) : null,
            rawQuestionHelp: rawHelp != null
                ? (rawHelp is Map ? jsonEncode(rawHelp) : rawHelp.toString())
                : null,
            isRequired: q['mandatory'] ?? false,
            allowOther: q['allow_other'] ?? false,
            choices: choices,
            rawChoices: normalizedRawChoices,
          );
        }).toList();
        
        debugPrint('Loaded ${loadedFields.length} fields');
        for (var field in loadedFields) {
          debugPrint('Field: name="${field.name}", type="${field.typeValue}", help="${field.questionHelp}"');
        }
        
        setState(() {
          _fields = loadedFields;
          _originalFields = loadedFields.map((f) => FieldData(
            id: f.id,
            name: f.name,
            rawName: f.rawName,
            typeValue: f.typeValue,
            typeName: f.typeName,
            questionHelp: f.questionHelp,
            rawQuestionHelp: f.rawQuestionHelp,
            isRequired: f.isRequired,
            allowOther: f.allowOther,
            choices: List.from(f.choices),
            rawChoices: List.from(f.rawChoices),
          )).toList();
          debugPrint('State updated with ${_fields.length} fields');
        });
      }
    } catch (e) {
      debugPrint('Error loading existing fields: $e');
    }
  }

  String? _getTypeName(String? typeValue) {
    final type = _questionTypes.firstWhere(
      (t) => t['value'] == typeValue,
      orElse: () => {},
    );
    return type['label'];
  }

  IconData _getIconForType(String? typeValue) {
    switch (typeValue) {
      case 'STR':
        return Icons.text_fields;
      case 'NUM':
        return Icons.numbers;
      case 'DATE':
        return Icons.calendar_today;
      case 'IMG':
        return Icons.image_outlined;
      case 'CHOICE':
        return Icons.list_alt;
      case 'MCHOICE':
        return Icons.checklist;
      case 'QR':
      case 'BARCODE':
        return Icons.qr_code;
      default:
        return Icons.help_outline;
    }
  }

  void _addChoiceToField(int fieldIndex) async {
    final result = await showDialog<Map<String, String>>(
      context: context,
      builder: (context) {
        String label = '';
        String value = '';
        
        return AlertDialog(
          title: Text(AppLocalizations.of(context)!.addOption),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                textCapitalization: TextCapitalization.sentences,
                decoration: InputDecoration(
                  labelText: AppLocalizations.of(context)!.optionLabelRequired,
                  hintText: AppLocalizations.of(context)!.optionLabelHint,
                ),
                onChanged: (v) => label = v,
                autofocus: true,
              ),
              const SizedBox(height: 12),
              TextField(
                decoration: InputDecoration(
                  labelText: AppLocalizations.of(context)!.optionValueLabel,
                  hintText: AppLocalizations.of(context)!.optionValueHint,
                ),
                onChanged: (v) => value = v,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(AppLocalizations.of(context)!.cancel),
            ),
            ElevatedButton(
              onPressed: () {
                if (label.trim().isNotEmpty) {
                  Navigator.pop(context, {
                    'label': label.trim(),
                    'value': value.trim().isEmpty ? label.trim() : value.trim(),
                  });
                }
              },
              child: Text(AppLocalizations.of(context)!.accept),
            ),
          ],
        );
      },
    );

    if (result != null) {
      setState(() {
        _fields[fieldIndex].choices.add(result);
      });
    }
  }

  Future<void> _loadQuestionTypes() async {
    setState(() => _loadingTypes = true);
    final types = await _projectService.getQuestionTypes();
    setState(() {
      _questionTypes = types;
      _loadingTypes = false;
    });
    debugPrint('Question types loaded: ${types.length}');
    if (types.isNotEmpty) {
      debugPrint('First type: ${types[0]}');
    }
  }

  void _addField() {
    setState(() {
      // Si hay observaciones, los campos nuevos no pueden ser obligatorios
      _fields.add(FieldData(
        isRequired: false,
      ));
    });
  }

  void _removeField(int index) {
    // Validar si el campo puede ser eliminado
    if (_hasObservations && index < _originalFields.length) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.cannotDeleteFieldWithObservations),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    
    setState(() {
      _fields.removeAt(index);
      if (_selectedFieldIndex == index) {
        _selectedFieldIndex = null;
      }
    });
  }

  void _showTypeSelector(int fieldIndex) async {
    if (_questionTypes.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.noFieldTypesAvailable)),
      );
      return;
    }
    
    // Validar si el tipo puede ser cambiado
    if (_hasObservations && fieldIndex < _originalFields.length) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.cannotChangeFieldTypeWithObservations),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    
    final selected = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppLocalizations.of(context)!.selectFieldType),
        content: _questionTypes.isEmpty
            ? Padding(
                padding: const EdgeInsets.all(20),
                child: Text(AppLocalizations.of(context)!.noFieldTypesAvailable),
              )
            : SizedBox(
                width: double.maxFinite,
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _questionTypes.length,
                  itemBuilder: (context, index) {
                    final type = _questionTypes[index];
                    return ListTile(
                      leading: Icon(
                        _getIconForType(type['value']),
                        color: Colors.blue[700],
                      ),
                      title: Text(type['label'] ?? AppLocalizations.of(context)!.noName),
                      onTap: () => Navigator.pop(context, type),
                    );
                  },
                ),
              ),
      ),
    );

    if (selected != null) {
      setState(() {
        _fields[fieldIndex].typeValue = selected['value'];
        _fields[fieldIndex].typeName = selected['label'];
      });
    }
  }

  Future<void> _goToMessageScreen() async {
    // Validar que los campos CHOICE tengan opciones
    for (var field in _fields) {
      if ((field.typeValue == 'CHOICE' || field.typeValue == 'MCHOICE') && field.choices.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.fieldMustHaveOptions(field.name))),
        );
        return;
      }
    }

    // Verificar si los campos han cambiado (solo en modo edición)
    bool fieldsChanged = !_isEditMode; // En modo creación, siempre considerar que hay cambios

    if (_isEditMode) {
      if (_fields.length != _originalFields.length) {
        fieldsChanged = true;
      } else {
        for (int i = 0; i < _fields.length; i++) {
          final current = _fields[i];
          final original = _originalFields[i];

          if (current.name != original.name ||
              current.typeValue != original.typeValue ||
              current.questionHelp != original.questionHelp ||
              current.isRequired != original.isRequired ||
              current.allowOther != original.allowOther ||
              current.choices.length != original.choices.length) {
            fieldsChanged = true;
            break;
          }

          if (current.choices.length == original.choices.length) {
            for (int j = 0; j < current.choices.length; j++) {
              if (current.choices[j]['label'] != original.choices[j]['label'] ||
                  current.choices[j]['value'] != original.choices[j]['value']) {
                fieldsChanged = true;
                break;
              }
            }
          }

          if (fieldsChanged) break;
        }
      }
    }

    // Build fieldFormToSend:
    // - If fields changed (or new project): rebuild from _fields using raw data for
    //   question_text/help/choices so existing translations are preserved.
    // - If no changes in edit mode: use the raw server data directly so the
    //   translation screen can still show and translate all questions.
    Map<String, dynamic>? fieldFormToSend;

    if (fieldsChanged && _fields.isNotEmpty) {
      final fieldForm = _fields.asMap().entries.map((entry) {
        final order = entry.key + 1;
        final field = entry.value;
        final isOriginal = _isEditMode && entry.key < _originalFields.length;

        final fieldData = <String, dynamic>{
          // Use raw multilingual value when available (preserves other-language translations)
          'question_text': (isOriginal && field.rawName.isNotEmpty) ? field.rawName : field.name,
          'answer_type': field.typeValue,
          'question_help': (isOriginal && field.rawQuestionHelp != null)
              ? field.rawQuestionHelp
              : (field.questionHelp ?? ''),
          'mandatory': field.isRequired,
          'order': order,
          // Include id for existing questions so the server updates in-place
          // (instead of delete-and-recreate) when there are observations
          if (isOriginal && field.id != null) 'id': field.id,
        };

        if ((field.typeValue == 'CHOICE' || field.typeValue == 'MCHOICE') && field.choices.isNotEmpty) {
          // Use raw choices when available (preserves multilingual labels)
          if (isOriginal && field.rawChoices.isNotEmpty) {
            fieldData['choices'] = field.rawChoices;
          } else {
            fieldData['choices'] = field.choices.map((c) => {
              'value': c['value'],
              'label': {'default': c['label']},
            }).toList();
          }
          fieldData['allow_other'] = field.allowOther;
        }

        return fieldData;
      }).toList();

      fieldFormToSend = {'questions': fieldForm};
    } else if (_isEditMode && _rawFieldFormData != null) {
      // No changes: pass the raw server data so the translation screen shows all questions
      fieldFormToSend = _rawFieldFormData;
    }

    if (!mounted) return;

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => CreateProjectMessageScreen(
          projectName: widget.projectName,
          projectDescription: widget.projectDescription,
          coverImage: widget.coverImage,
          selectedTopicIds: widget.selectedTopicIds,
          selectedOrganizationIds: widget.selectedOrganizationIds,
          isPrivate: widget.isPrivate,
          isPublicMap: widget.isPublicMap,
          isDatabasePrivate: widget.isDatabasePrivate,
          isFuzzyGeoposition: widget.isFuzzyGeoposition,
          isDraft: widget.isDraft,
          isEnded: widget.isEnded,
          isEmailOnObservation: widget.isEmailOnObservation,
          isGlobal: widget.isGlobal,
          selectedCountryCodes: widget.selectedCountryCodes,
          password: widget.password,
          projectId: widget.projectId,
          fieldFormToSend: fieldFormToSend,
          existingMessage: _returnedMessage ?? _existingPostObservationMessage ?? widget.initialMessage,
          existingShowPostMessage: _existingShowPostMessage,
        ),
      ),
    ).then((returnedMessage) {
      if (returnedMessage is String && mounted) {
        setState(() => _returnedMessage = returnedMessage);
      }
    });
  }

  /// Serializes the current _fields list into the fieldFormToSend format,
  /// so it can be passed back to CreateProjectScreen on back navigation.
  Map<String, dynamic>? _serializeCurrentFields() {
    if (_fields.isEmpty) return null;
    return {
      'questions': _fields.map((f) {
        final q = <String, dynamic>{
          'question_text': f.rawName.isNotEmpty ? f.rawName : f.name,
          'answer_type': f.typeValue,
          'question_help': f.rawQuestionHelp ?? f.questionHelp ?? '',
          'mandatory': f.isRequired,
          'allow_other': f.allowOther,
        };
        if ((f.typeValue == 'CHOICE' || f.typeValue == 'MCHOICE')) {
          q['choices'] = f.rawChoices.isNotEmpty
              ? f.rawChoices
              : f.choices.map((c) => {
                  'value': c['value'],
                  'label': {'default': c['label']},
                }).toList();
        }
        return q;
      }).toList(),
    };
  }

  void _popWithState() {
    Navigator.pop(context, {
      'fieldForm': _serializeCurrentFields(),
      'message': _returnedMessage ?? _existingPostObservationMessage ?? widget.initialMessage,
    });
  }

  @override
  Widget build(BuildContext context) {
    return PopScope<Map<String, dynamic>>(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        _popWithState();
      },
      child: Scaffold(
      appBar: AppBar(
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text(
          _isEditMode ? 'Editar Campos del Proyecto' : 'Campos del Proyecto',
        ),
      ),
      body: SafeArea(child: _loadingData
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: Builder(
                    builder: (context) {
                      debugPrint('Building field list with ${_fields.length} fields');
                      return ReorderableListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _fields.length + 1, // +1 para el botón
                    proxyDecorator: (child, index, animation) {
                      return AnimatedBuilder(
                        animation: animation,
                        builder: (context, child) {
                          return Material(
                            elevation: 8,
                            color: Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            child: Transform.scale(
                              scale: 1.05,
                              child: Opacity(
                                opacity: 0.9,
                                child: child,
                              ),
                            ),
                          );
                        },
                        child: child,
                      );
                    },
                    onReorder: (oldIndex, newIndex) {
                      if (oldIndex >= _fields.length || newIndex >= _fields.length) {
                        return; // No reordenar el botón +
                      }
                      setState(() {
                        if (newIndex > oldIndex) {
                          newIndex -= 1;
                        }
                        final field = _fields.removeAt(oldIndex);
                        _fields.insert(newIndex, field);
                        
                        // Actualizar el índice seleccionado
                        if (_selectedFieldIndex == oldIndex) {
                          _selectedFieldIndex = newIndex;
                        }
                      });
                    },
                    itemBuilder: (context, index) {
                      debugPrint('Building item at index $index (total fields: ${_fields.length})');
                      // Último item es el botón +
                      if (index == _fields.length) {
                        debugPrint('Building add button');
                        return Padding(
                          key: const ValueKey('add_button'),
                          padding: const EdgeInsets.only(top: 8, bottom: 16),
                          child: Center(
                            child: Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                color: Theme.of(context).colorScheme.onSurface,
                                shape: BoxShape.circle,
                              ),
                              child: IconButton(
                                icon: Icon(Icons.add, color: Theme.of(context).colorScheme.surface, size: 32),
                                onPressed: _addField,
                              ),
                            ),
                          ),
                        );
                      }
                      
                      final field = _fields[index];
                      final isSelected = _selectedFieldIndex == index;
                      
                      debugPrint('Building field card for index $index: name="${field.name}", type="${field.typeValue}"');
                      
                      return Container(
                        key: ValueKey('field_$index'),
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        constraints: const BoxConstraints(minHeight: 100),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.surface,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSelected ? Colors.blue : Theme.of(context).colorScheme.outlineVariant,
                                width: isSelected ? 2 : 1,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // Icono de arrastre
                                Center(
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    child: Icon(
                                      Icons.drag_indicator,
                                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                                      size: 32,
                                    ),
                                  ),
                                ),
                                
                                // Número y campo de texto
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${index + 1}.',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.stretch,
                                        children: [
                                          TextFormField(
                                            key: ValueKey('field_${index}_name_${field.name}'),
                                            initialValue: field.name,
                                            textCapitalization: TextCapitalization.sentences,
                                            decoration: InputDecoration(
                                              hintText: AppLocalizations.of(context)!.fieldNameHint,
                                              border: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              contentPadding: const EdgeInsets.symmetric(
                                                horizontal: 12,
                                                vertical: 12,
                                              ),
                                            ),
                                            onChanged: (value) {
                                              field.name = value;
                                            },
                                            onTap: () {
                                              setState(() {
                                                _selectedFieldIndex = index;
                                              });
                                            },
                                          ),
                                          const SizedBox(height: 8),
                                          TextFormField(
                                            key: ValueKey('field_${index}_help_${field.questionHelp}'),
                                            initialValue: field.questionHelp,
                                            textCapitalization: TextCapitalization.sentences,
                                            decoration: InputDecoration(
                                              hintText: AppLocalizations.of(context)!.helpTextHint,
                                              border: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              contentPadding: const EdgeInsets.symmetric(
                                                horizontal: 12,
                                                vertical: 12,
                                              ),
                                            ),
                                            onChanged: (value) {
                                              field.questionHelp = value;
                                            },
                                            onTap: () {
                                              setState(() {
                                                _selectedFieldIndex = index;
                                              });
                                            },
                                          ),
                                          const SizedBox(height: 8),
                                          // Selector de tipo — mismo ancho que los inputs
                                          () {
                                            final locked = _hasObservations && index < _originalFields.length;
                                            final hasType = field.typeValue != null;
                                            return OutlinedButton.icon(
                                              onPressed: () => _showTypeSelector(index),
                                              icon: Icon(
                                                locked ? Icons.lock : _getIconForType(field.typeValue),
                                                size: 18,
                                              ),
                                              label: Text(
                                                field.typeName ?? AppLocalizations.of(context)!.selectFieldType,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                              style: OutlinedButton.styleFrom(
                                                minimumSize: const Size(double.infinity, 44),
                                                alignment: Alignment.centerLeft,
                                                foregroundColor: locked
                                                    ? Theme.of(context).colorScheme.onSurfaceVariant
                                                    : hasType
                                                        ? Theme.of(context).colorScheme.primary
                                                        : Theme.of(context).colorScheme.error,
                                                side: BorderSide(
                                                  color: locked
                                                      ? Theme.of(context).colorScheme.outlineVariant
                                                      : hasType
                                                          ? Theme.of(context).colorScheme.primary
                                                          : Theme.of(context).colorScheme.error,
                                                ),
                                              ),
                                            );
                                          }(),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),

                                // Eliminar + Obligatorio
                                Row(
                                  children: [
                                    // Botón eliminar
                                    IconButton(
                                      icon: Icon(
                                        Icons.delete_outline,
                                        size: 20,
                                        color: (_hasObservations && index < _originalFields.length)
                                            ? Theme.of(context).colorScheme.onSurfaceVariant
                                            : Theme.of(context).colorScheme.error,
                                      ),
                                      onPressed: () => _removeField(index),
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                                      tooltip: 'Eliminar campo',
                                    ),

                                    const Spacer(),

                                    // Toggle obligatorio
                                    Text(
                                      'Obligatorio',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                                      ),
                                    ),
                                    Transform.scale(
                                      scale: 0.85,
                                      child: Switch(
                                        value: field.isRequired,
                                        onChanged: (value) {
                                          if (_hasObservations && index < _originalFields.length) {
                                            final originalField = _originalFields[index];
                                            if (originalField.isRequired != value) {
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(
                                                  content: Text(AppLocalizations.of(context)!.cannotChangeRequiredWithObservations),
                                                  backgroundColor: Colors.orange,
                                                ),
                                              );
                                              return;
                                            }
                                          }
                                          if (_hasObservations && index >= _originalFields.length && value) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(
                                                content: Text(AppLocalizations.of(context)!.newFieldsCannotBeRequiredWithObservations),
                                                backgroundColor: Colors.orange,
                                              ),
                                            );
                                            return;
                                          }
                                          setState(() => field.isRequired = value);
                                        },
                                        activeColor: Colors.blue,
                                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      ),
                                    ),
                                  ],
                                ),
                                
                                // Sección de opciones para CHOICE y MCHOICE
                                if (field.typeValue == 'CHOICE' || field.typeValue == 'MCHOICE') ...[
                                  const SizedBox(height: 12),
                                  const Divider(),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Text(
                                        AppLocalizations.of(context)!.optionsLabel,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: Theme.of(context).colorScheme.onSurface,
                                        ),
                                      ),
                                      const Spacer(),
                                      TextButton.icon(
                                        onPressed: () => _addChoiceToField(index),
                                        icon: const Icon(Icons.add, size: 16),
                                        label: Text(AppLocalizations.of(context)!.addOption),
                                        style: TextButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        ),
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      Text(
                                        'Permitir "Otro"',
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Transform.scale(
                                        scale: 0.8,
                                        child: Switch(
                                          value: field.allowOther,
                                          onChanged: (value) {
                                            setState(() {
                                              field.allowOther = value;
                                            });
                                          },
                                          activeColor: Colors.blue,
                                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  if (field.choices.isEmpty)
                                    Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      child: Text(
                                        AppLocalizations.of(context)!.noOptionsAdded,
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                                          fontStyle: FontStyle.italic,
                                        ),
                                      ),
                                    )
                                  else
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 8,
                                      children: field.choices.asMap().entries.map((entry) {
                                        final choiceIndex = entry.key;
                                        final choice = entry.value;
                                        return Chip(
                                          label: Text(
                                            choice['label'] ?? '',
                                            style: const TextStyle(fontSize: 12),
                                          ),
                                          deleteIcon: const Icon(Icons.close, size: 16),
                                          onDeleted: () {
                                            setState(() {
                                              field.choices.removeAt(choiceIndex);
                                            });
                                          },
                                          backgroundColor: Theme.of(context).colorScheme.surfaceContainerLow,
                                        );
                                      }).toList(),
                                    ),
                                ],
                              ],
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
                
                // Botones en la parte inferior
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Botón Volver
                      Expanded(
                        child: SizedBox(
                          height: 50,
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: Theme.of(context).colorScheme.outline),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(25),
                              ),
                            ),
                            child: Text(
                              AppLocalizations.of(context)!.back,
                              style: TextStyle(
                                fontSize: 16,
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      
                      // Botón Siguiente
                      Expanded(
                        flex: 2,
                        child: SizedBox(
                          height: 50,
                          child: ElevatedButton(
                            onPressed: (_isLoading || (!_isEditMode && _fields.isEmpty)) ? null : _goToMessageScreen,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(25),
                              ),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : Text(
                                    AppLocalizations.of(context)!.next,
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            )),
      ), // Scaffold
    ); // PopScope
  }
}
