import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html/flutter_widget_from_html.dart';
import '../l10n/app_localizations.dart';
import '../services/project_service.dart';
import '../utils/multilingual_utils.dart';
import 'project_detail_screen.dart';

// ── Available languages ───────────────────────────────────────────────────────

const _kLanguages = [
  ('en', 'English'),
  ('es', 'Español'),
  ('fr', 'Français'),
  ('de', 'Deutsch'),
  ('it', 'Italiano'),
  ('pt', 'Português'),
  ('ca', 'Català'),
  ('eu', 'Euskara'),
  ('gl', 'Galego'),
  ('ar', 'العربية'),
  ('zh', '中文'),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class CreateProjectTranslationScreen extends StatefulWidget {
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
  final int? projectId;
  final Map<String, dynamic>? fieldFormToSend;
  final String? postObservationMessage;
  final bool showPostMessage;

  const CreateProjectTranslationScreen({
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
    this.fieldFormToSend,
    this.postObservationMessage,
    this.showPostMessage = true,
  });

  @override
  State<CreateProjectTranslationScreen> createState() =>
      _CreateProjectTranslationScreenState();
}

class _CreateProjectTranslationScreenState
    extends State<CreateProjectTranslationScreen> {
  final _projectService = ProjectService();

  String? _selectedLanguage;
  final Map<String, TextEditingController> _controllers = {};
  bool _isLoading = false;

  bool get _isEditMode => widget.projectId != null;

  @override
  void initState() {
    super.initState();
    _prepopulateFromExistingTranslations();
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  // ── Pre-populate controllers from existing multilingual translations ───────

  void _prepopulateFromExistingTranslations() {
    _prepopulateField('description', widget.projectDescription);
    final msg = widget.postObservationMessage;
    if (msg != null && msg.isNotEmpty) _prepopulateField('message', msg);

    final questions =
        (widget.fieldFormToSend?['questions'] as List<dynamic>?) ?? [];
    for (var i = 0; i < questions.length; i++) {
      final q = questions[i] as Map<String, dynamic>;
      _prepopulateField('q${i}_text', q['question_text']);
      final help = q['question_help'];
      if (help != null && localizedText(help).isNotEmpty) {
        _prepopulateField('q${i}_help', help);
      }
      final choices = q['choices'] as List<dynamic>?;
      if (choices != null) {
        for (var j = 0; j < choices.length; j++) {
          final raw = choices[j];
          _prepopulateField('q${i}_c${j}', raw is Map ? raw['label'] : raw);
        }
      }
    }
  }

  void _prepopulateField(String key, dynamic value) {
    Map<String, dynamic>? map;
    if (value is Map) {
      map = Map<String, dynamic>.from(value);
    } else {
      try {
        final decoded = jsonDecode(value.toString());
        if (decoded is Map) map = Map<String, dynamic>.from(decoded);
      } catch (_) {}
    }
    if (map == null) return;
    for (final entry in map.entries) {
      final lang = entry.key;
      if (lang == 'default') continue;
      final text = entry.value?.toString() ?? '';
      if (text.isNotEmpty) {
        _controllers['${lang}_$key'] = TextEditingController(text: text);
      }
    }
  }

  TextEditingController _ctrl(String key) =>
      _controllers.putIfAbsent('${_selectedLanguage}_$key', () => TextEditingController());

  // ── Field key enumeration (mirrors _buildFieldList) ──────────────────────

  List<String> _fieldKeys() {
    final questions =
        (widget.fieldFormToSend?['questions'] as List<dynamic>?) ?? [];
    final keys = <String>['description'];
    final msg = widget.postObservationMessage;
    if (msg != null && msg.isNotEmpty) keys.add('message');
    for (var i = 0; i < questions.length; i++) {
      final q = questions[i] as Map<String, dynamic>;
      keys.add('q${i}_text');
      final helpRaw = q['question_help'];
      final help = helpRaw is Map ? jsonEncode(helpRaw) : (helpRaw?.toString() ?? '');
      if (help.isNotEmpty) keys.add('q${i}_help');
      final choices = q['choices'] as List<dynamic>?;
      if (choices != null) {
        for (var j = 0; j < choices.length; j++) {
          keys.add('q${i}_c${j}');
        }
      }
    }
    return keys;
  }

  int get _totalFields => _fieldKeys().length;

  int _filledCount(String lang) => _fieldKeys().where((key) {
        final c = _controllers['${lang}_$key'];
        return c != null && c.text.trim().isNotEmpty;
      }).length;

  // ── Build multilingual value: {"es": "original", "en": "translation"} ──────

  String _multilingual(String original, String? translation) {
    // Start from any existing multilingual map, then add/update
    Map<String, String> map;
    try {
      final decoded = jsonDecode(original);
      if (decoded is Map) {
        map = decoded.map((k, v) => MapEntry(k.toString(), v?.toString() ?? ''));
      } else {
        map = {'default': original};
      }
    } catch (_) {
      map = {'default': original};
    }
    if (_selectedLanguage != null &&
        translation != null &&
        translation.isNotEmpty) {
      map[_selectedLanguage!] = translation;
    }
    return jsonEncode(map);
  }

  // ── Build transformed fieldForm with multilingual texts ───────────────────

  Map<String, dynamic>? _buildMultilingualFieldForm() {
    if (widget.fieldFormToSend == null) return null;
    final questions =
        (widget.fieldFormToSend!['questions'] as List<dynamic>).toList();

    return {
      'questions': questions.asMap().entries.map((entry) {
        final i = entry.key;
        final q = Map<String, dynamic>.from(entry.value as Map);

        // question_text may be a String (from FieldData.rawName) or a Map (from _rawFieldFormData)
        final qtRaw = q['question_text'];
        final qtStr = qtRaw is Map ? jsonEncode(qtRaw) : (qtRaw?.toString() ?? '');
        q['question_text'] = jsonDecode(_multilingual(qtStr, _ctrl('q${i}_text').text.trim()));

        // question_help may be a String or a Map
        final helpRaw = q['question_help'];
        final help = helpRaw is Map ? jsonEncode(helpRaw) : (helpRaw?.toString() ?? '');
        if (help.isNotEmpty) {
          q['question_help'] = jsonDecode(_multilingual(help, _ctrl('q${i}_help').text.trim()));
        }

        if (q['choices'] != null) {
          final choices = (q['choices'] as List<dynamic>).toList();
          q['choices'] = choices.asMap().entries.map((ce) {
            final j = ce.key;
            final raw = ce.value;
            if (raw is Map) {
              final choice = Map<String, dynamic>.from(raw);
              final existingLabel = choice['label'];
              // Pass the full existing multilingual map (JSON-encoded) so other
              // language translations are preserved — not just the default text.
              final labelStr = existingLabel is Map
                  ? jsonEncode(existingLabel)
                  : (existingLabel?.toString() ?? '');
              choice['label'] = jsonDecode(_multilingual(
                  labelStr, _ctrl('q${i}_c${j}').text.trim()));
              return choice;
            } else {
              // Plain string choice → promote to {value, label} with multilingual label
              final str = raw.toString();
              return {
                'value': str,
                'label': jsonDecode(_multilingual(
                    str, _ctrl('q${i}_c${j}').text.trim())),
              };
            }
          }).toList();
        }

        return q;
      }).toList(),
    };
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  Future<void> _save({bool skipTranslation = false}) async {
    setState(() => _isLoading = true);

    final String name = widget.projectName;

    final String description = skipTranslation
        ? widget.projectDescription
        : _multilingual(
            widget.projectDescription, _ctrl('description').text.trim());

    final String? message = () {
      final raw = widget.postObservationMessage;
      if (raw == null || raw.isEmpty) return null;
      if (skipTranslation) return raw;
      return _multilingual(raw, _ctrl('message').text.trim());
    }();

    final fieldForm =
        skipTranslation ? widget.fieldFormToSend : _buildMultilingualFieldForm();

    bool success = false;
    int? resultProjectId;

    if (_isEditMode && widget.projectId != null) {
      success = await _projectService.updateProject(
        projectId: widget.projectId!,
        name: name,
        description: description,
        cover: widget.coverImage,
        topics:
            widget.selectedTopicIds.isEmpty ? null : widget.selectedTopicIds,
        organizationIds: widget.selectedOrganizationIds.isEmpty
            ? null
            : widget.selectedOrganizationIds,
        isPrivate: widget.isPrivate,
        password: widget.password,
        isDatabasePrivate: widget.isDatabasePrivate,
        publicMap: widget.isPublicMap,
        fuzzy: widget.isFuzzyGeoposition,
        draft: widget.isDraft,
        ended: widget.isEnded,
        emailOnObservation: widget.isEmailOnObservation,
        isGlobal: widget.isGlobal,
        countries: widget.isGlobal ? null : widget.selectedCountryCodes,
        fieldForm: fieldForm,
        postObservationMessage: message,
        showPostMessage: widget.showPostMessage,
      );
      resultProjectId = success ? widget.projectId : null;
    } else {
      resultProjectId = await _projectService.createProject(
        name: name,
        description: description,
        cover: widget.coverImage,
        topics:
            widget.selectedTopicIds.isEmpty ? null : widget.selectedTopicIds,
        organizationIds: widget.selectedOrganizationIds.isEmpty
            ? null
            : widget.selectedOrganizationIds,
        isPrivate: widget.isPrivate,
        password: widget.password,
        isDatabasePrivate: widget.isDatabasePrivate,
        publicMap: widget.isPublicMap,
        fuzzy: widget.isFuzzyGeoposition,
        draft: widget.isDraft,
        ended: widget.isEnded,
        emailOnObservation: widget.isEmailOnObservation,
        isGlobal: widget.isGlobal,
        countries: widget.isGlobal ? null : widget.selectedCountryCodes,
        fieldForm: fieldForm,
        postObservationMessage: message,
        showPostMessage: widget.showPostMessage,
      );
      success = resultProjectId != null;
    }

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (success && resultProjectId != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(_isEditMode
                ? AppLocalizations.of(context)!.projectUpdated
                : AppLocalizations.of(context)!.projectCreated)),
      );
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (context) => ProjectDetailScreen(projectId: resultProjectId!),
        ),
        (route) => route.isFirst,
      );
    } else {
      final apiError = _projectService.lastError;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiError ??
                (_isEditMode
                    ? AppLocalizations.of(context)!.projectUpdateError
                    : AppLocalizations.of(context)!.projectCreateError),
          ),
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text(l10n.addLanguageTitle),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // ── Language selector ───────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: DropdownButtonFormField<String>(
                value: _selectedLanguage,
                decoration: InputDecoration(
                  labelText: l10n.translationLanguageLabel,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  
                  prefixIcon: const Icon(Icons.language),
                ),
                hint: Text(l10n.translationSelectLanguage),
                items: _kLanguages
                    .map((l) {
                      final filled = _filledCount(l.$1);
                      final total = _totalFields;
                      final counter = filled > 0 ? ' $filled/$total' : '';
                      return DropdownMenuItem(
                        value: l.$1,
                        child: Text('${l.$2} (${l.$1})$counter'),
                      );
                    })
                    .toList(),
                onChanged: (value) => setState(() => _selectedLanguage = value),
              ),
            ),

            const SizedBox(height: 8),

            // ── Field list ──────────────────────────────────────────────
            Expanded(
              child: _selectedLanguage == null
                  ? _buildEmptyState()
                  : _buildFieldList(),
            ),

            // ── Bottom buttons ──────────────────────────────────────────
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.translate, size: 64, color: Theme.of(context).colorScheme.outlineVariant),
            const SizedBox(height: 16),
            Text(
              AppLocalizations.of(context)!.translationSelectLanguageHint,
              textAlign: TextAlign.center,
              style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 15),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFieldList() {
    final questions =
        (widget.fieldFormToSend?['questions'] as List<dynamic>?) ?? [];

    final items = <Widget>[];

    // ── Description ──────────────────────────────────────────────────────
    items.add(_sectionHeader(AppLocalizations.of(context)!.translationSectionProject));
    items.add(_translationField(
      label: AppLocalizations.of(context)!.translationDescriptionLabel,
      original: localizedText(widget.projectDescription),
      controllerKey: 'description',
      maxLines: 4,
    ));

    // ── Post observation message ─────────────────────────────────────────
    final msg = widget.postObservationMessage;
    if (msg != null && msg.isNotEmpty) {
      items.add(_translationField(
        label: AppLocalizations.of(context)!.translationPostMessageLabel,
        original: localizedText(msg),
        controllerKey: 'message',
        maxLines: 3,
      ));
    }

    // ── Questions ────────────────────────────────────────────────────────
    if (questions.isNotEmpty) {
      items.add(_sectionHeader(AppLocalizations.of(context)!.translationSectionQuestions));
      for (var i = 0; i < questions.length; i++) {
        final q = questions[i] as Map<String, dynamic>;
        final questionText = localizedText(q['question_text']);
        final questionHelp = localizedText(q['question_help']);
        final choices = q['choices'] as List<dynamic>?;

        items.add(_questionHeader(AppLocalizations.of(context)!.translationQuestionHeader(i + 1)));

        items.add(_translationField(
          label: AppLocalizations.of(context)!.translationQuestionTextLabel,
          original: questionText,
          controllerKey: 'q${i}_text',
        ));

        if (questionHelp.isNotEmpty) {
          items.add(_translationField(
            label: AppLocalizations.of(context)!.translationHelpTextLabel,
            original: questionHelp,
            controllerKey: 'q${i}_help',
          ));
        }

        if (choices != null && choices.isNotEmpty) {
          items.add(_choicesSubHeader());
          for (var j = 0; j < choices.length; j++) {
            final raw = choices[j];
            final String original;
            final String displayKey;
            if (raw is Map) {
              original = localizedText(raw['label']);
              displayKey = (raw['value'] ?? raw['label'] ?? '').toString();
            } else {
              original = localizedText(raw);
              displayKey = original;
            }
            items.add(_indented(_translationField(
              label: AppLocalizations.of(context)!.translationOptionLabel(displayKey),
              original: original,
              controllerKey: 'q${i}_c${j}',
            )));
          }
        }
      }
    }

    items.add(const SizedBox(height: 8));

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: items,
    );
  }

  // ── Shared widgets ────────────────────────────────────────────────────────

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 4),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _questionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 2),
      child: Text(
        title,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _choicesSubHeader() {
    return Padding(
      padding: const EdgeInsets.only(top: 6, bottom: 2),
      child: Row(
        children: [
          Icon(Icons.list_alt, size: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
          const SizedBox(width: 4),
          Text(
            AppLocalizations.of(context)!.translationSectionOptions,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              letterSpacing: 0.6,
            ),
          ),
        ],
      ),
    );
  }

  Widget _indented(Widget child) {
    return Padding(
      padding: const EdgeInsets.only(left: 12),
      child: child,
    );
  }

  // ── Translation field ─────────────────────────────────────────────────────

  Widget _translationField({
    required String label,
    required String original,
    required String controllerKey,
    int maxLines = 1,
  }) {
    final controller = _ctrl(controllerKey);
    final isHtml = original.contains('<') && original.contains('>');
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          // Original — read only, rendered as HTML if needed
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
            ),
            child: isHtml
                ? HtmlWidget(
                    original,
                    textStyle: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      fontSize: 14,
                    ),
                  )
                : Text(
                    original,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      fontSize: 14,
                    ),
                  ),
          ),
          const SizedBox(height: 4),
          // Translation input — plain text
          TextField(
            controller: controller,
            maxLines: maxLines,
            textCapitalization: TextCapitalization.sentences,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: _selectedLanguage != null
                  ? AppLocalizations.of(context)!.translationHint(_selectedLanguage!)
                  : '',
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              filled: true,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Cancelar
          Expanded(
            child: SizedBox(
              height: 50,
              child: OutlinedButton(
                onPressed: _isLoading ? null : () => Navigator.of(context).popUntil((route) => route.isFirst),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Theme.of(context).colorScheme.outline),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25)),
                ),
                child: Text(AppLocalizations.of(context)!.cancel,
                    style: TextStyle(fontSize: 16, color: Theme.of(context).colorScheme.onSurface)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Crear / Actualizar con traducción
          Expanded(
            flex: 2,
            child: SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : () => _save(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25)),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        _isEditMode ? AppLocalizations.of(context)!.update : AppLocalizations.of(context)!.create,
                        style:
                            const TextStyle(fontSize: 16, color: Colors.white),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
