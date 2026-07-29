import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart';
import 'package:flutter_quill_delta_from_html/flutter_quill_delta_from_html.dart';
import 'package:vsc_quill_delta_to_html/vsc_quill_delta_to_html.dart';

/// WYSIWYG HTML editor using flutter_quill (pure Dart, no WebView).
/// Converts HTML ↔ Quill Delta so it's compatible with Tiptap output.
class HtmlRichEditor extends StatefulWidget {
  final String? initialValue;
  final double minHeight;

  const HtmlRichEditor({
    super.key,
    this.initialValue,
    this.minHeight = 220,
  });

  @override
  State<HtmlRichEditor> createState() => HtmlRichEditorState();
}

class HtmlRichEditorState extends State<HtmlRichEditor> {
  late final QuillController _controller;
  final _focusNode = FocusNode();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _controller = _buildController(widget.initialValue);
  }

  static QuillController _buildController(String? html) {
    if (html == null || html.trim().isEmpty) {
      return QuillController.basic();
    }
    try {
      final delta = HtmlToDelta().convert(html);
      return QuillController(
        document: Document.fromDelta(delta),
        selection: const TextSelection.collapsed(offset: 0),
      );
    } catch (_) {
      return QuillController.basic();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  /// Returns the current content as HTML.
  String getHtml() {
    final delta = _controller.document.toDelta();
    final converter = QuillDeltaToHtmlConverter(
      List<Map<String, dynamic>>.from(delta.toJson()),
      ConverterOptions.forEmail(),
    );
    return converter.convert();
  }

  @override
  Widget build(BuildContext context) {
    final borderColor = Theme.of(context).colorScheme.outlineVariant;
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Toolbar
        Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerLowest,
            border: Border.all(color: borderColor),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(8),
              topRight: Radius.circular(8),
            ),
          ),
          child: QuillSimpleToolbar(
            controller: _controller,
            config: QuillSimpleToolbarConfig(
              showBoldButton: true,
              showItalicButton: true,
              showUnderLineButton: false,
              showListBullets: true,
              showListNumbers: true,
              showLink: true,
              showUndo: true,
              showRedo: true,
              // Hide everything else
              showStrikeThrough: false,
              showInlineCode: false,
              showColorButton: false,
              showBackgroundColorButton: false,
              showClearFormat: false,
              showAlignmentButtons: false,
              showHeaderStyle: false,
              showIndent: false,
              showQuote: false,
              showCodeBlock: false,
              showSearchButton: false,
              showSubscript: false,
              showSuperscript: false,
              showSmallButton: false,
              showFontFamily: false,
              showFontSize: false,
              showDirection: false,
              showListCheck: false,
              showClipboardCut: false,
              showClipboardCopy: false,
              showClipboardPaste: false,
              toolbarIconAlignment: WrapAlignment.start,
              iconTheme: QuillIconTheme(
                iconButtonSelectedData: IconButtonData(
                  color: Colors.blue,
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.blue.withValues(alpha: 0.12),
                  ),
                ),
                iconButtonUnselectedData: IconButtonData(
                  color: theme.colorScheme.onSurface,
                ),
              ),
            ),
          ),
        ),
        // Editor
        Container(
          constraints: BoxConstraints(minHeight: widget.minHeight),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            border: Border(
              left: BorderSide(color: borderColor),
              right: BorderSide(color: borderColor),
              bottom: BorderSide(color: borderColor),
            ),
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(8),
              bottomRight: Radius.circular(8),
            ),
          ),
          child: QuillEditor(
            controller: _controller,
            focusNode: _focusNode,
            scrollController: _scrollController,
            config: QuillEditorConfig(
              minHeight: widget.minHeight,
              padding: const EdgeInsets.all(12),
              placeholder: '',
              expands: false,
              scrollable: true,
              autoFocus: false,
            ),
          ),
        ),
      ],
    );
  }
}
