import 'dart:convert';
import 'dart:ui' as ui;
import '../services/locale_service.dart';

/// Returns the text for the active app language from a value that may be:
///   - A plain [String]  → returned as-is
///   - A [Map]           → already decoded multilingual object, e.g. {"default":"…","en":"…"}
///   - A JSON [String]   → decoded and treated as a multilingual map
///
/// Priority: app locale (LocaleService) → 'default' → first available value.
String localizedText(dynamic value) {
  if (value == null) return '';
  final lang = LocaleService.activeLocale?.languageCode
      ?? ui.PlatformDispatcher.instance.locale.languageCode;

  if (value is Map) {
    return (value[lang] ?? value['default'] ?? value.values.firstOrNull)?.toString() ?? '';
  }

  final str = value.toString();
  try {
    final decoded = jsonDecode(str);
    if (decoded is Map) {
      return (decoded[lang] ?? decoded['default'] ?? decoded.values.firstOrNull)?.toString() ?? str;
    }
  } catch (_) {}

  return str;
}
