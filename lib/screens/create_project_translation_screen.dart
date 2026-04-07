import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
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
  final bool isDatabasePrivate;
  final bool isFuzzyGeoposition;
  final bool isGlobal;
  final List<String> selectedCountryCodes;
  final String? password;
  final int? projectId;
  final Map<String, dynamic>? fieldFormToSend;
  final String? postObservationMessage;

  const CreateProjectTranslationScreen({
    super.key,
    required this.projectName,
    required this.projectDescription,
    this.coverImage,
    required this.selectedTopicIds,
    required this.selectedOrganizationIds,
    required this.isPrivate,
    required this.isDatabasePrivate,
    this.isFuzzyGeoposition = false,
    this.isGlobal = true,
    this.selectedCountryCodes = const [],
    this.password,
    this.projectId,
    this.fieldFormToSend,
    this.postObservationMessage,
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
  bool _messagePreview = false;

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
    _prepopulateField('name', widget.projectName);
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
    final keys = <String>['name', 'description'];
    final msg = widget.postObservationMessage;
    if (msg != null && msg.isNotEmpty) keys.add('message');
    for (var i = 0; i < questions.length; i++) {
      final q = questions[i] as Map<String, dynamic>;
      keys.add('q${i}_text');
      final help = q['question_help'] as String? ?? '';
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

        q['question_text'] = jsonDecode(
            _multilingual(q['question_text'] as String,
                _ctrl('q${i}_text').text.trim()));

        final help = q['question_help'] as String? ?? '';
        if (help.isNotEmpty) {
          q['question_help'] = jsonDecode(
              _multilingual(help, _ctrl('q${i}_help').text.trim()));
        }

        if (q['choices'] != null) {
          final choices = (q['choices'] as List<dynamic>).toList();
          q['choices'] = choices.asMap().entries.map((ce) {
            final j = ce.key;
            final raw = ce.value;
            if (raw is Map) {
              final choice = Map<String, dynamic>.from(raw);
              final existingLabel = choice['label'];
              final baseText = existingLabel is Map
                  ? (existingLabel['default'] ?? existingLabel.values.first ?? '').toString()
                  : existingLabel.toString();
              choice['label'] = jsonDecode(_multilingual(
                  baseText, _ctrl('q${i}_c${j}').text.trim()));
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

    final String name = skipTranslation
        ? widget.projectName
        : _multilingual(widget.projectName, _ctrl('name').text.trim());

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
        fuzzy: widget.isFuzzyGeoposition,
        isGlobal: widget.isGlobal,
        countries: widget.isGlobal ? null : widget.selectedCountryCodes,
        fieldForm: fieldForm,
        postObservationMessage: message,
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
        fuzzy: widget.isFuzzyGeoposition,
        isGlobal: widget.isGlobal,
        countries: widget.isGlobal ? null : widget.selectedCountryCodes,
        fieldForm: fieldForm,
        postObservationMessage: message,
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(_isEditMode
                ? AppLocalizations.of(context)!.projectUpdateError
                : AppLocalizations.of(context)!.projectCreateError)),
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
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
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

    // ── Name & Description ───────────────────────────────────────────────
    items.add(_sectionHeader(AppLocalizations.of(context)!.translationSectionProject));
    items.add(_translationField(
      label: AppLocalizations.of(context)!.translationNameLabel,
      original: localizedText(widget.projectName),
      controllerKey: 'name',
    ));
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
        markdownToolbar: true,
        isPreview: _messagePreview,
        onTogglePreview: () => setState(() => _messagePreview = !_messagePreview),
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

  // ── Markdown toolbar helpers ──────────────────────────────────────────────

  void _wrapSelection(TextEditingController c, String before, String after, String placeholder) {
    final text = c.text;
    final sel = c.selection;
    if (!sel.isValid) { _insertAtCursor(c, '$before$placeholder$after'); return; }
    final selected = sel.textInside(text);
    final replacement = selected.isEmpty ? '$before$placeholder$after' : '$before$selected$after';
    final newText = text.replaceRange(sel.start, sel.end, replacement);
    final cursorPos = selected.isEmpty ? sel.start + before.length : sel.start + replacement.length;
    c.value = TextEditingValue(text: newText, selection: TextSelection.collapsed(offset: cursorPos));
  }

  void _insertAtCursor(TextEditingController c, String insertion) {
    final text = c.text;
    final sel = c.selection;
    final offset = sel.isValid ? sel.baseOffset : text.length;
    final newText = text.replaceRange(offset, sel.isValid ? sel.extentOffset : offset, insertion);
    c.value = TextEditingValue(text: newText, selection: TextSelection.collapsed(offset: offset + insertion.length));
  }

  void _insertBullet(TextEditingController c) {
    final text = c.text;
    final sel = c.selection;
    final offset = sel.isValid ? sel.baseOffset : text.length;
    final lineStart = text.lastIndexOf('\n', offset > 0 ? offset - 1 : 0);
    final insertAt = lineStart < 0 ? 0 : lineStart + 1;
    final newText = text.replaceRange(insertAt, insertAt, '- ');
    c.value = TextEditingValue(text: newText, selection: TextSelection.collapsed(offset: offset + 2));
  }

  Future<void> _insertLink(TextEditingController c) async {
    String linkText = '';
    String linkUrl = '';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(AppLocalizations.of(context)!.insertLinkTitle),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: InputDecoration(labelText: AppLocalizations.of(context)!.linkTextLabel),
              autofocus: true,
              onChanged: (v) => linkText = v,
            ),
            const SizedBox(height: 12),
            TextField(
              decoration: InputDecoration(labelText: AppLocalizations.of(context)!.linkUrlLabel),
              keyboardType: TextInputType.url,
              onChanged: (v) => linkUrl = v,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(AppLocalizations.of(context)!.cancel)),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: Text(AppLocalizations.of(context)!.insert)),
        ],
      ),
    );
    if (confirmed == true) {
      final text = linkText.trim().isEmpty ? linkUrl.trim() : linkText.trim();
      _insertAtCursor(c, '[$text](${linkUrl.trim()})');
    }
  }

  Widget _markdownToolbar(TextEditingController c) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerLowest,
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(8),
          topRight: Radius.circular(8),
        ),
      ),
      child: Row(
        children: [
          _toolbarBtn(label: 'B', bold: true,   tooltip: AppLocalizations.of(context)!.tooltipBold,   onPressed: () => _wrapSelection(c, '**', '**', 'texto')),
          _toolbarBtn(label: 'I', italic: true, tooltip: AppLocalizations.of(context)!.tooltipItalic, onPressed: () => _wrapSelection(c, '*',  '*',  'texto')),
          _toolbarBtn(icon: Icons.link,                  tooltip: AppLocalizations.of(context)!.tooltipLink,  onPressed: () => _insertLink(c)),
          _toolbarBtn(icon: Icons.format_list_bulleted,  tooltip: AppLocalizations.of(context)!.tooltipList,  onPressed: () => _insertBullet(c)),
        ],
      ),
    );
  }

  Widget _toolbarBtn({String? label, IconData? icon, required String tooltip, required VoidCallback onPressed, bool bold = false, bool italic = false}) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(4),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: icon != null
              ? Icon(icon, size: 18, color: Theme.of(context).colorScheme.onSurface)
              : Text(label!, style: TextStyle(fontSize: 15, fontWeight: bold ? FontWeight.bold : FontWeight.normal, fontStyle: italic ? FontStyle.italic : FontStyle.normal, color: Theme.of(context).colorScheme.onSurface)),
        ),
      ),
    );
  }

  // ── Translation field ─────────────────────────────────────────────────────

  Widget _translationField({
    required String label,
    required String original,
    required String controllerKey,
    int maxLines = 1,
    bool markdownToolbar = false,
    bool isPreview = false,
    VoidCallback? onTogglePreview,
  }) {
    final controller = _ctrl(controllerKey);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label + Edit/Preview toggle
          Row(
            children: [
              Text(label,
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w500)),
              if (markdownToolbar) ...[
                const Spacer(),
                _editPreviewToggle(isPreview: isPreview, onToggle: onTogglePreview!),
              ],
            ],
          ),
          const SizedBox(height: 4),
          // Original — read only
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
            ),
            child: Text(
              original,
              style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 14),
            ),
          ),
          const SizedBox(height: 4),
          // Translation — editable or preview
          if (markdownToolbar && isPreview)
            _markdownPreview(controller.text)
          else ...[
            if (markdownToolbar) _markdownToolbar(controller),
            TextField(
              controller: controller,
              maxLines: markdownToolbar ? null : maxLines,
              minLines: markdownToolbar ? maxLines : null,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: _selectedLanguage != null ? AppLocalizations.of(context)!.translationHint(_selectedLanguage!) : '',
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                border: markdownToolbar
                    ? const OutlineInputBorder(
                        borderRadius: BorderRadius.only(
                          bottomLeft: Radius.circular(8),
                          bottomRight: Radius.circular(8),
                        ),
                      )
                    : OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8)),
                filled: true,
                
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _editPreviewToggle({required bool isPreview, required VoidCallback onToggle}) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _toggleTab(label: AppLocalizations.of(context)!.editTab,    active: !isPreview, onTap: isPreview  ? onToggle : null),
          _toggleTab(label: AppLocalizations.of(context)!.previewTab, active: isPreview,  onTap: !isPreview ? onToggle : null),
        ],
      ),
    );
  }

  Widget _toggleTab({required String label, required bool active, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: active ? Theme.of(context).colorScheme.surface : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
          boxShadow: active
              ? [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 4)]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: active ? FontWeight.bold : FontWeight.normal,
            color: active ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }

  Widget _markdownPreview(String text) {
    if (text.trim().isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
          borderRadius: BorderRadius.circular(8),
          color: Theme.of(context).colorScheme.surface,
        ),
        child: Text(
          AppLocalizations.of(context)!.messageEmptyPreview,
          style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant, fontStyle: FontStyle.italic, fontSize: 13),
        ),
      );
    }
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(8),
        color: Theme.of(context).colorScheme.surface,
      ),
      child: MarkdownBody(data: text),
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
          // Omitir
          Expanded(
            child: SizedBox(
              height: 50,
              child: OutlinedButton(
                onPressed: _isLoading ? null : () => _save(skipTranslation: true),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Theme.of(context).colorScheme.outline),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25)),
                ),
                child: Text(AppLocalizations.of(context)!.skip,
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
