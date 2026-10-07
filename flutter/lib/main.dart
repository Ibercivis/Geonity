import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_quill/flutter_quill.dart' show FlutterQuillLocalizations;
import 'l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'services/auth_service.dart';
import 'services/locale_service.dart';
import 'services/offline_service.dart';
import 'services/sync_service.dart';
import 'services/theme_service.dart';
import 'config/app_config.dart';

/// Global navigator key used to push the login screen when a 401 is received
/// from any service, regardless of where in the widget tree the call happened.
final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Render behind the system nav bar so SafeArea handles insets consistently.
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  if (!kIsWeb) {
    MapboxOptions.setAccessToken(AppConfig.mapboxAccessToken);
  }

  // L3: Catch all unhandled Flutter framework errors.
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    debugPrint('Flutter error: ${details.exceptionAsString()}');
  };

  // L3: Catch all unhandled platform/async errors.
  PlatformDispatcher.instance.onError = (error, stack) {
    debugPrint('Platform error: $error\n$stack');
    return true;
  };

  final syncService = SyncService();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LocaleService()),
        ChangeNotifierProvider(create: (_) => ThemeService()),
        ChangeNotifierProvider.value(value: syncService),
        // L6: Expose singleton services via Provider so screens can use
        // context.read<AuthService>() instead of instantiating directly.
        Provider<AuthService>.value(value: AuthService()),
        Provider<OfflineService>.value(value: OfflineService()),
      ],
      child: const GeonityApp(),
    ),
  );
}

const _kBrandBlue = Color(0xFF2B4CE0);

ThemeData get _lightTheme {
  final cs = ColorScheme.fromSeed(
    seedColor: _kBrandBlue,
    brightness: Brightness.light,
  );
  return ThemeData(
    colorScheme: cs,
    useMaterial3: true,
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: cs.surfaceContainerHighest,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: cs.outlineVariant),
      ),
    ),
    cardTheme: CardThemeData(
      color: cs.surfaceContainerLow,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: cs.surfaceContainerHighest,
      selectedColor: cs.primaryContainer,
      labelStyle: TextStyle(color: cs.onSurface),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: cs.surface,
      foregroundColor: cs.onSurface,
      elevation: 0,
    ),
  );
}

ThemeData get _darkTheme {
  final cs = ColorScheme.fromSeed(
    seedColor: _kBrandBlue,
    brightness: Brightness.dark,
  );
  return ThemeData(
    colorScheme: cs,
    useMaterial3: true,
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: cs.surfaceContainerHighest,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: cs.outlineVariant),
      ),
    ),
    cardTheme: CardThemeData(
      color: cs.surfaceContainerLow,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: cs.surfaceContainerHighest,
      selectedColor: cs.primaryContainer,
      labelStyle: TextStyle(color: cs.onSurface),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: cs.surface,
      foregroundColor: cs.onSurface,
      elevation: 0,
    ),
  );
}

class GeonityApp extends StatefulWidget {
  const GeonityApp({super.key});

  @override
  State<GeonityApp> createState() => _GeonityAppState();
}

class _GeonityAppState extends State<GeonityApp> {
  StreamSubscription<void>? _unauthorizedSub;

  @override
  void initState() {
    super.initState();
    // Start sync service once the widget tree is fully built.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SyncService>().start();
    });
    // Redirect to login whenever any service receives a 401 (session expired).
    _unauthorizedSub = AuthService.onUnauthorized.listen((_) {
      appNavigatorKey.currentState?.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (_) => false,
      );
    });
  }

  @override
  void dispose() {
    _unauthorizedSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final localeService = Provider.of<LocaleService>(context);
    final themeService = Provider.of<ThemeService>(context);

    return MaterialApp(
      navigatorKey: appNavigatorKey,
      title: 'Geonity',
      locale: localeService.locale,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        FlutterQuillLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('es'),
        Locale('en'),
        Locale('pt'),
        Locale('it'),
      ],
      theme: _lightTheme,
      darkTheme: _darkTheme,
      themeMode: themeService.themeMode,
      home: const AuthCheck(),
    );
  }
}

class AuthCheck extends StatefulWidget {
  const AuthCheck({super.key});

  @override
  State<AuthCheck> createState() => _AuthCheckState();
}

class _AuthCheckState extends State<AuthCheck> {
  final _authService = AuthService();
  bool _isChecking = true;
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final loggedIn = await _authService.isLoggedIn();
    if (!mounted) return;
    setState(() {
      _isLoggedIn = loggedIn;
      _isChecking = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isChecking) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return _isLoggedIn ? const HomeScreen() : const LoginScreen();
  }
}
