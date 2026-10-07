import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../l10n/app_localizations.dart';

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
    if (kDebugMode) {
      final info = await PackageInfo.fromPlatform();
      final path = 'assets/changelog/debug/debug_${info.version}+${info.buildNumber}.md';
      try {
        return await rootBundle.loadString(path);
      } catch (_) {
        return '## DEBUG ${info.version}+${info.buildNumber}\n\nNo debug changelog found.\nRun `./generate_changelog.sh` to generate one.';
      }
    }
    return rootBundle.loadString('assets/changelog/changelog.md');
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(kDebugMode ? 'Changelog (debug)' : l10n.whatsNew)),
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
