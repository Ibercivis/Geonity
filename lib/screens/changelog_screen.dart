import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../l10n/app_localizations.dart';
import '../services/locale_service.dart';

class ChangelogScreen extends StatefulWidget {
  const ChangelogScreen({super.key});

  @override
  State<ChangelogScreen> createState() => _ChangelogScreenState();
}

class _ChangelogScreenState extends State<ChangelogScreen> {
  late Future<String> _content;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _content = _loadChangelog();
  }

  Future<String> _loadChangelog() async {
    final lang = LocaleService.activeLocale?.languageCode ?? 'en';
    final supported = ['es', 'en', 'it', 'pt'];
    final code = supported.contains(lang) ? lang : 'en';
    return rootBundle.loadString('assets/changelog/changelog_$code.md');
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.whatsNew)),
      body: FutureBuilder<String>(
        future: _content,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError || !snap.hasData) {
            return const SizedBox.shrink();
          }
          return Markdown(
            data: snap.data!,
            padding: const EdgeInsets.all(16),
            styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
              h2: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
              p: Theme.of(context).textTheme.bodyMedium,
            ),
          );
        },
      ),
    );
  }
}
