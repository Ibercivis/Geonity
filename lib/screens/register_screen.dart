import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/app_config.dart';
import '../l10n/app_localizations.dart';
import '../services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _password1Controller = TextEditingController();
  final _password2Controller = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;
  bool _obscurePassword1 = true;
  bool _obscurePassword2 = true;
  bool _termsAccepted = false;
  String? _termsError;

  @override
  void dispose() {
    _emailController.dispose();
    _password1Controller.dispose();
    _password2Controller.dispose();
    super.dispose();
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_termsAccepted) {
      setState(() => _termsError = AppLocalizations.of(context)!.registerTermsRequired);
      return;
    }
    setState(() {
      _isLoading = true;
      _termsError = null;
    });

    final error = await _authService.register(
      _emailController.text.trim(),
      _password1Controller.text,
      _password2Controller.text,
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (error == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.registerCheckEmail,
          ),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.of(context).pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo
                  Center(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Image.asset(
                        'Icon-geonity.png',
                        width: 90,
                        height: 90,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    l10n.registerTitle,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Únete a la comunidad Geonity',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 15,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Email
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: l10n.loginEmailLabel,
                      hintText: l10n.registerEmailHint,
                      prefixIcon: const Icon(Icons.email_outlined),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return AppLocalizations.of(context)!.loginEmailRequired;
                      }
                      if (!value.contains('@')) {
                        return AppLocalizations.of(context)!.registerEmailInvalid;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Contraseña
                  TextFormField(
                    controller: _password1Controller,
                    obscureText: _obscurePassword1,
                    decoration: InputDecoration(
                      labelText: l10n.registerPasswordLabel,
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword1
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                        ),
                        onPressed: () => setState(
                          () => _obscurePassword1 = !_obscurePassword1,
                        ),
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return AppLocalizations.of(context)!.registerPasswordRequired;
                      }
                      if (value.length < 8) {
                        return AppLocalizations.of(context)!.registerPasswordMinLength;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Repetir contraseña
                  TextFormField(
                    controller: _password2Controller,
                    obscureText: _obscurePassword2,
                    decoration: InputDecoration(
                      labelText: l10n.registerPasswordRepeatLabel,
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword2
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                        ),
                        onPressed: () => setState(
                          () => _obscurePassword2 = !_obscurePassword2,
                        ),
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return AppLocalizations.of(context)!.registerPasswordRepeatRequired;
                      }
                      if (value != _password1Controller.text) {
                        return AppLocalizations.of(context)!.registerPasswordMismatch;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),

                  // Terms checkbox
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Checkbox(
                            value: _termsAccepted,
                            onChanged: (value) => setState(() {
                              _termsAccepted = value ?? false;
                              if (_termsAccepted) _termsError = null;
                            }),
                          ),
                          Expanded(
                            child: Text.rich(
                              TextSpan(
                                children: [
                                  TextSpan(
                                    text: '${l10n.consentTermsLabel} ',
                                    style: TextStyle(
                                      color: colorScheme.primary,
                                      decoration: TextDecoration.underline,
                                    ),
                                    recognizer: TapGestureRecognizer()
                                      ..onTap = () => _openUrl('${AppConfig.baseUrl}/terms'),
                                  ),
                                  const TextSpan(text: '& '),
                                  TextSpan(
                                    text: l10n.privacyPolicy,
                                    style: TextStyle(
                                      color: colorScheme.primary,
                                      decoration: TextDecoration.underline,
                                    ),
                                    recognizer: TapGestureRecognizer()
                                      ..onTap = () => _openUrl('${AppConfig.baseUrl}/privacy-policy'),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (_termsError != null)
                        Padding(
                          padding: const EdgeInsets.only(left: 12),
                          child: Text(
                            _termsError!,
                            style: TextStyle(
                              color: colorScheme.error,
                              fontSize: 12,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Botón registrar
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleRegister,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2B4CE0),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              l10n.registerCreateAccount,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Link to login
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        l10n.registerAlreadyHaveAccount,
                        style: TextStyle(color: colorScheme.onSurfaceVariant),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.of(context).pop(),
                        child: Text(
                          l10n.registerSignIn,
                          style: TextStyle(
                            color: colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
