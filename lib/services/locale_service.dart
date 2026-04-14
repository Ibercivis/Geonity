import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleService extends ChangeNotifier {
  static const String _localeKey = 'selected_locale';
  Locale? _locale;

  /// Reflects the currently active app locale. null means "use system locale".
  /// Used by multilingual_utils.dart to resolve translated content.
  static Locale? activeLocale;

  /// Language code to send in Accept-Language headers (e.g. "es", "en", "fr").
  static String get acceptLanguage =>
      activeLocale?.languageCode ??
      ui.PlatformDispatcher.instance.locale.languageCode;

  Locale? get locale => _locale;

  LocaleService() {
    _loadLocale();
  }

  Future<void> _loadLocale() async {
    final prefs = await SharedPreferences.getInstance();
    final localeCode = prefs.getString(_localeKey);
    if (localeCode != null && localeCode.isNotEmpty) {
      _locale = Locale(localeCode);
      activeLocale = _locale;
      notifyListeners();
    }
  }

  Future<void> setLocale(String? localeCode) async {
    final prefs = await SharedPreferences.getInstance();
    if (localeCode == null) {
      await prefs.remove(_localeKey);
      _locale = null;
    } else {
      await prefs.setString(_localeKey, localeCode);
      _locale = Locale(localeCode);
    }
    activeLocale = _locale;
    notifyListeners();
  }

  String getCurrentLanguage() {
    if (_locale == null) return 'system';
    return _locale!.languageCode;
  }
}
