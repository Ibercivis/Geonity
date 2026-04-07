import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../l10n/app_localizations.dart';
import '../utils/multilingual_utils.dart';
import 'create_project_translation_screen.dart';

class CreateProjectMessageScreen extends StatefulWidget {
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
  final String? existingMessage;

  const CreateProjectMessageScreen({
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
    this.existingMessage,
  });

  @override
  State<CreateProjectMessageScreen> createState() => _CreateProjectMessageScreenState();
}

class _CreateProjectMessageScreenState extends State<CreateProjectMessageScreen> {
  late final TextEditingController _messageController;
  bool _isPreview = false;

  bool get _isEditMode => widget.projectId != null;

  @override
  void initState() {
    super.initState();
    // Show the localized text in the editor; raw value is passed through to the translation screen
    _messageController = TextEditingController(text: localizedText(widget.existingMessage ?? ''));
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  // ── Toolbar helpers ──────────────────────────────────────────────────────

  void _wrapSelection(String before, String after, String placeholder) {
    final text = _messageController.text;
    final sel = _messageController.selection;
    if (!sel.isValid) {
      _insertAtCursor('$before$placeholder$after');
      return;
    }
    final selected = sel.textInside(text);
    final replacement = selected.isEmpty ? '$before$placeholder$after' : '$before$selected$after';
    final newText = text.replaceRange(sel.start, sel.end, replacement);
    final cursorPos = selected.isEmpty
        ? sel.start + before.length
        : sel.start + replacement.length;
    _messageController.value = TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(offset: cursorPos),
    );
  }

  void _insertAtCursor(String insertion) {
    final text = _messageController.text;
    final sel = _messageController.selection;
    final offset = sel.isValid ? sel.baseOffset : text.length;
    final newText = text.replaceRange(offset, sel.isValid ? sel.extentOffset : offset, insertion);
    _messageController.value = TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(offset: offset + insertion.length),
    );
  }

  void _insertBullet() {
    final text = _messageController.text;
    final sel = _messageController.selection;
    final offset = sel.isValid ? sel.baseOffset : text.length;
    // Find start of current line
    final lineStart = text.lastIndexOf('\n', offset > 0 ? offset - 1 : 0);
    final insertAt = lineStart < 0 ? 0 : lineStart + 1;
    final newText = text.replaceRange(insertAt, insertAt, '- ');
    _messageController.value = TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(offset: offset + 2),
    );
  }

  Future<void> _insertLink() async {
    String linkText = '';
    String linkUrl = '';
    final l10n = AppLocalizations.of(context)!;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.insertLinkTitle),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: InputDecoration(labelText: l10n.linkTextLabel),
              autofocus: true,
              onChanged: (v) => linkText = v,
            ),
            const SizedBox(height: 12),
            TextField(
              decoration: InputDecoration(labelText: l10n.linkUrlLabel),
              keyboardType: TextInputType.url,
              onChanged: (v) => linkUrl = v,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.insert),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final text = linkText.trim().isEmpty ? linkUrl.trim() : linkText.trim();
      _insertAtCursor('[$text](${linkUrl.trim()})');
    }
  }

  // ── Navigate to translation screen ───────────────────────────────────────

  /// Builds the message value to pass to the translation screen.
  /// Merges the user's edited text (primary language) into the existing
  /// multilingual map from the server so other-language translations are preserved.
  String? _buildMessageForTranslation() {
    final edited = _messageController.text.trim();
    if (edited.isEmpty && (widget.existingMessage == null || widget.existingMessage!.isEmpty)) {
      return null;
    }
    // Start from the existing raw map (may already have other-language translations)
    Map<String, String> map;
    try {
      final decoded = jsonDecode(widget.existingMessage ?? '');
      if (decoded is Map) {
        map = Map<String, String>.from(decoded.map((k, v) => MapEntry(k.toString(), v?.toString() ?? '')));
      } else {
        map = {'default': widget.existingMessage ?? ''};
      }
    } catch (_) {
      map = {'default': widget.existingMessage ?? ''};
    }
    // Update default with what the user typed in the editor
    if (edited.isNotEmpty) map['default'] = edited;
    return jsonEncode(map);
  }

  void _goToTranslation() {
    final message = _buildMessageForTranslation();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CreateProjectTranslationScreen(
          projectName: widget.projectName,
          projectDescription: widget.projectDescription,
          coverImage: widget.coverImage,
          selectedTopicIds: widget.selectedTopicIds,
          selectedOrganizationIds: widget.selectedOrganizationIds,
          isPrivate: widget.isPrivate,
          isDatabasePrivate: widget.isDatabasePrivate,
          isFuzzyGeoposition: widget.isFuzzyGeoposition,
          isGlobal: widget.isGlobal,
          selectedCountryCodes: widget.selectedCountryCodes,
          password: widget.password,
          projectId: widget.projectId,
          fieldFormToSend: widget.fieldFormToSend,
          postObservationMessage: message,
        ),
      ),
    );
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
        title: Text(
          l10n.confirmationMessageTitle,
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Edit / Preview toggle
            Container(
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerLowest,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _isPreview = false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: !_isPreview ? Theme.of(context).colorScheme.surface : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: !_isPreview
                              ? [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4)]
                              : null,
                        ),
                        child: Text(
                          l10n.editTab,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontWeight: !_isPreview ? FontWeight.bold : FontWeight.normal,
                            color: !_isPreview ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _isPreview = true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _isPreview ? Theme.of(context).colorScheme.surface : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: _isPreview
                              ? [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4)]
                              : null,
                        ),
                        child: Text(
                          l10n.previewTab,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontWeight: _isPreview ? FontWeight.bold : FontWeight.normal,
                            color: _isPreview ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Editor or preview
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _isPreview ? _buildPreview() : _buildEditor(),
              ),
            ),

            // Informative note
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Row(
                children: [
                  Icon(Icons.info_outline, size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      l10n.messageInfo,
                      style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                    ),
                  ),
                ],
              ),
            ),

            // Bottom buttons
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
                          l10n.back,
                          style: TextStyle(fontSize: 16, color: Theme.of(context).colorScheme.onSurface),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _goToTranslation,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(25),
                          ),
                        ),
                        child: Text(
                          l10n.next,
                          style: const TextStyle(
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
        ),
      ),
    );
  }

  Widget _buildEditor() {
    final l10n = AppLocalizations.of(context)!;
    return Column(
      children: [
        // Toolbar
        Container(
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
              _ToolbarButton(
                label: 'B',
                bold: true,
                tooltip: l10n.tooltipBold,
                onPressed: () => _wrapSelection('**', '**', 'texto'),
              ),
              _ToolbarButton(
                label: 'I',
                italic: true,
                tooltip: l10n.tooltipItalic,
                onPressed: () => _wrapSelection('*', '*', 'texto'),
              ),
              _ToolbarButton(
                icon: Icons.link,
                tooltip: l10n.tooltipLink,
                onPressed: _insertLink,
              ),
              _ToolbarButton(
                icon: Icons.format_list_bulleted,
                tooltip: l10n.tooltipList,
                onPressed: _insertBullet,
              ),
            ],
          ),
        ),
        // Text area
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              border: Border(
                left: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
                right: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
                bottom: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
              ),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(8),
                bottomRight: Radius.circular(8),
              ),
            ),
            child: TextField(
              controller: _messageController,
              maxLines: null,
              expands: true,
              textAlignVertical: TextAlignVertical.top,
              decoration: InputDecoration(
                hintText: l10n.messageHint,
                border: InputBorder.none,
                contentPadding: EdgeInsets.all(12),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPreview() {
    final l10n = AppLocalizations.of(context)!;
    final text = _messageController.text;
    if (text.trim().isEmpty) {
      return Center(
        child: Text(
          l10n.messageEmptyPreview,
          style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontStyle: FontStyle.italic),
        ),
      );
    }
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(8),
      ),
      child: SingleChildScrollView(
        child: MarkdownBody(data: text),
      ),
    );
  }
}

class _ToolbarButton extends StatelessWidget {
  final String? label;
  final IconData? icon;
  final String tooltip;
  final VoidCallback onPressed;
  final bool bold;
  final bool italic;

  const _ToolbarButton({
    this.label,
    this.icon,
    required this.tooltip,
    required this.onPressed,
    this.bold = false,
    this.italic = false,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(4),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: icon != null
              ? Icon(icon, size: 18, color: Theme.of(context).colorScheme.onSurface)
              : Text(
                  label!,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: bold ? FontWeight.bold : FontWeight.normal,
                    fontStyle: italic ? FontStyle.italic : FontStyle.normal,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
        ),
      ),
    );
  }
}
