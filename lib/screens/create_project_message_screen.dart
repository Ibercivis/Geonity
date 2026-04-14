import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../utils/multilingual_utils.dart';
import '../widgets/html_rich_editor.dart';
import 'create_project_translation_screen.dart';

class CreateProjectMessageScreen extends StatefulWidget {
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
  final String? existingMessage;
  final bool existingShowPostMessage;

  const CreateProjectMessageScreen({
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
    this.existingMessage,
    this.existingShowPostMessage = true,
  });

  @override
  State<CreateProjectMessageScreen> createState() => _CreateProjectMessageScreenState();
}

class _CreateProjectMessageScreenState extends State<CreateProjectMessageScreen> {
  final _editorKey = GlobalKey<HtmlRichEditorState>();
  late bool _showPostMessage;

  @override
  void initState() {
    super.initState();
    _showPostMessage = widget.existingShowPostMessage;
  }

  String _initialHtml() => localizedText(widget.existingMessage ?? '');

  /// Merges the edited HTML (default language) with the existing multilingual map.
  Future<String?> _buildMessageForTranslation() async {
    final html = _editorKey.currentState?.getHtml() ?? '';
    final isEmpty = html.isEmpty;

    if (isEmpty && (widget.existingMessage == null || widget.existingMessage!.isEmpty)) {
      return null;
    }

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

    if (!isEmpty) map['default'] = html;
    return jsonEncode(map);
  }

  Future<void> _goToTranslation() async {
    final message = await _buildMessageForTranslation();
    if (!mounted) return;
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
          fieldFormToSend: widget.fieldFormToSend,
          postObservationMessage: message,
          showPostMessage: _showPostMessage,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text(l10n.confirmationMessageTitle),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Switch — mostrar/ocultar mensaje al usuario
            SwitchListTile(
              value: _showPostMessage,
              onChanged: (v) => setState(() => _showPostMessage = v),
              title: Text(l10n.showPostMessageLabel),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16),
            ),
            const Divider(height: 1),

            // Editor
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: HtmlRichEditor(
                  key: _editorKey,
                  initialValue: _initialHtml(),
                  minHeight: 300,
                ),
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
                  BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -2)),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 50,
                      child: OutlinedButton(
                        onPressed: () async {
                          final msg = await _buildMessageForTranslation();
                          if (mounted) Navigator.pop(context, msg);
                        },
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: Theme.of(context).colorScheme.outline),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                        ),
                        child: Text(l10n.back, style: TextStyle(fontSize: 16, color: Theme.of(context).colorScheme.onSurface)),
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
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                        ),
                        child: Text(
                          l10n.next,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
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
}
