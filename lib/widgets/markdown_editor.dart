import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../l10n/app_localizations.dart';

/// Reusable markdown editor with toolbar and edit/preview tabs.
class MarkdownEditor extends StatefulWidget {
  final TextEditingController controller;
  final String? hintText;

  const MarkdownEditor({
    super.key,
    required this.controller,
    this.hintText,
  });

  @override
  State<MarkdownEditor> createState() => _MarkdownEditorState();
}

class _MarkdownEditorState extends State<MarkdownEditor> {
  bool _isPreview = false;

  void _wrapSelection(String before, String after, String placeholder) {
    final text = widget.controller.text;
    final sel = widget.controller.selection;
    if (!sel.isValid) {
      _insertAtCursor('$before$placeholder$after');
      return;
    }
    final selected = sel.textInside(text);
    final replacement = selected.isEmpty ? '$before$placeholder$after' : '$before$selected$after';
    final newText = text.replaceRange(sel.start, sel.end, replacement);
    final cursorPos = selected.isEmpty ? sel.start + before.length : sel.start + replacement.length;
    widget.controller.value = TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(offset: cursorPos),
    );
  }

  void _insertAtCursor(String insertion) {
    final text = widget.controller.text;
    final sel = widget.controller.selection;
    final offset = sel.isValid ? sel.baseOffset : text.length;
    final newText = text.replaceRange(offset, sel.isValid ? sel.extentOffset : offset, insertion);
    widget.controller.value = TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(offset: offset + insertion.length),
    );
  }

  void _insertBullet() {
    final text = widget.controller.text;
    final sel = widget.controller.selection;
    final offset = sel.isValid ? sel.baseOffset : text.length;
    final lineStart = text.lastIndexOf('\n', offset > 0 ? offset - 1 : 0);
    final insertAt = lineStart < 0 ? 0 : lineStart + 1;
    final newText = text.replaceRange(insertAt, insertAt, '- ');
    widget.controller.value = TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(offset: offset + 2),
    );
  }

  Future<void> _insertLink() async {
    final l10n = AppLocalizations.of(context)!;
    String linkText = '';
    String linkUrl = '';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.insertLinkTitle),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              textCapitalization: TextCapitalization.sentences,
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
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.cancel)),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l10n.insert)),
        ],
      ),
    );

    if (confirmed == true) {
      final text = linkText.trim().isEmpty ? linkUrl.trim() : linkText.trim();
      _insertAtCursor('[$text](${linkUrl.trim()})');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Edit / Preview toggle
        Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              _tab(context, l10n.editTab, !_isPreview, () => setState(() => _isPreview = false)),
              _tab(context, l10n.previewTab, _isPreview, () => setState(() => _isPreview = true)),
            ],
          ),
        ),
        const SizedBox(height: 8),

        if (_isPreview)
          _buildPreview(context, l10n)
        else
          _buildEditor(context, l10n),
      ],
    );
  }

  Widget _tab(BuildContext context, String label, bool active, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: active ? Theme.of(context).colorScheme.surface : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: active
                ? [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4)]
                : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontWeight: active ? FontWeight.bold : FontWeight.normal,
              color: active
                  ? Theme.of(context).colorScheme.onSurface
                  : Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEditor(BuildContext context, AppLocalizations l10n) {
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
                label: 'B', bold: true,
                tooltip: l10n.tooltipBold,
                onPressed: () => _wrapSelection('**', '**', 'texto'),
              ),
              _ToolbarButton(
                label: 'I', italic: true,
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
        Container(
          constraints: const BoxConstraints(minHeight: 160),
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
            controller: widget.controller,
            maxLines: null,
            textAlignVertical: TextAlignVertical.top,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              hintText: widget.hintText,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.all(12),
            ),
            onChanged: (_) => setState(() {}),
          ),
        ),
      ],
    );
  }

  Widget _buildPreview(BuildContext context, AppLocalizations l10n) {
    final text = widget.controller.text;
    if (text.trim().isEmpty) {
      return Container(
        height: 160,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          l10n.messageEmptyPreview,
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            fontStyle: FontStyle.italic,
          ),
        ),
      );
    }
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 160),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(8),
      ),
      child: MarkdownBody(data: text),
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
