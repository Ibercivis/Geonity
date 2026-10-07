import 'dart:convert';
import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:country_picker/country_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../utils/image_utils.dart';
import '../l10n/app_localizations.dart';
import '../services/organization_service.dart';
import '../utils/multilingual_utils.dart';
import '../config/app_config.dart';
import '../widgets/html_rich_editor.dart';

class CreateOrganizationScreen extends StatefulWidget {
  final int? organizationId;

  const CreateOrganizationScreen({super.key, this.organizationId});

  @override
  State<CreateOrganizationScreen> createState() => _CreateOrganizationScreenState();
}

class _CreateOrganizationScreenState extends State<CreateOrganizationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _urlController = TextEditingController();
  final _contactNameController = TextEditingController();
  final _contactMailController = TextEditingController();
  final _editorKey = GlobalKey<HtmlRichEditorState>();
  final _organizationService = OrganizationService();

  File? _logoImage;
  File? _coverImage;
  String? _existingLogoUrl;
  String? _existingCoverUrl;
  String? _initialDescription; // HTML loaded from server

  List<Map<String, dynamic>> _organizationTypes = [];
  List<int> _selectedTypeIds = [];

  bool _isGlobal = true;
  List<String> _selectedCountryCodes = [];

  bool _isSubmitting = false;
  bool _isLoadingData = false;

  // Preserves other-language translations from the server
  Map<String, dynamic> _descriptionTranslations = {};

  bool get _isEditMode => widget.organizationId != null;

  @override
  void initState() {
    super.initState();
    _loadTypes();
    if (_isEditMode) _loadOrganizationData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _urlController.dispose();
    _contactNameController.dispose();
    _contactMailController.dispose();
    super.dispose();
  }

  Future<void> _loadTypes() async {
    final types = await _organizationService.getOrganizationTypes();
    if (mounted) setState(() => _organizationTypes = types);
  }

  Future<void> _loadOrganizationData() async {
    setState(() => _isLoadingData = true);
    try {
      final data = await _organizationService.getOrganizationDetailRaw(widget.organizationId!);
      if (data == null || !mounted) return;

      // Parse existing description translations (raw map)
      final rawDesc = data['description'];
      String descHtml = '';
      if (rawDesc is Map) {
        _descriptionTranslations = Map<String, dynamic>.from(rawDesc);
        descHtml = localizedText(rawDesc);
      } else if (rawDesc is String && rawDesc.isNotEmpty) {
        try {
          final decoded = jsonDecode(rawDesc);
          if (decoded is Map) {
            _descriptionTranslations = Map<String, dynamic>.from(decoded);
            descHtml = localizedText(decoded);
          } else {
            descHtml = rawDesc;
          }
        } catch (_) {
          descHtml = rawDesc;
        }
      }

      // Existing images
      String? logoUrl;
      final logoRaw = data['logo'];
      if (logoRaw is String && logoRaw.isNotEmpty) {
        logoUrl = logoRaw.startsWith('http') ? logoRaw : '${AppConfig.baseUrl}$logoRaw';
      } else if (logoRaw is List && logoRaw.isNotEmpty) {
        final img = logoRaw[0]['image'] as String?;
        if (img != null) logoUrl = img.startsWith('http') ? img : '${AppConfig.baseUrl}$img';
      }

      String? coverUrl;
      final coverRaw = data['cover'];
      if (coverRaw is String && coverRaw.isNotEmpty) {
        coverUrl = coverRaw.startsWith('http') ? coverRaw : '${AppConfig.baseUrl}$coverRaw';
      } else if (coverRaw is List && coverRaw.isNotEmpty) {
        final img = coverRaw[0]['image'] as String?;
        if (img != null) coverUrl = img.startsWith('http') ? img : '${AppConfig.baseUrl}$img';
      }

      // Type IDs
      List<int> typeIds = [];
      final typeRaw = data['type'];
      if (typeRaw is List) {
        typeIds = typeRaw.map<int>((t) {
          if (t is int) return t;
          if (t is Map) return t['id'] as int;
          return t as int;
        }).toList();
      }

      // Countries
      List<String> countries = [];
      if (data['countries'] is List) {
        countries = (data['countries'] as List).cast<String>();
      }

      setState(() {
        _nameController.text = localizedText(data['principalName'] ?? data['name'] ?? '');
        _initialDescription = descHtml;
        _urlController.text = data['url'] ?? '';
        _contactNameController.text = data['contactName'] ?? '';
        _contactMailController.text = data['contactMail'] ?? '';
        _existingLogoUrl = logoUrl;
        _existingCoverUrl = coverUrl;
        _selectedTypeIds = typeIds;
        _isGlobal = data['is_global'] ?? true;
        _selectedCountryCodes = countries;
      });
    } catch (e) {
      debugPrint('Error loading organization data: $e');
    } finally {
      if (mounted) setState(() => _isLoadingData = false);
    }
  }

  Future<String?> _buildDescription() async {
    final html = _editorKey.currentState?.getHtml() ?? '';
    if (html.isEmpty) return null;
    final map = Map<String, dynamic>.from(_descriptionTranslations);
    map['default'] = html;
    return jsonEncode(map);
  }

  Future<void> _pickImage(bool isLogo) async {
    final source = await showDialog<ImageSource>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppLocalizations.of(context)!.imagePickerTitle),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Colors.blue),
              title: Text(AppLocalizations.of(context)!.imagePickerTakePhoto),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: Colors.blue),
              title: Text(AppLocalizations.of(context)!.imagePickerChooseGallery),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source != null) {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(source: source);
      if (pickedFile != null) {
        final compressed = await compressImageIfNeeded(File(pickedFile.path));
        setState(() {
          if (isLogo) {
            _logoImage = compressed;
          } else {
            _coverImage = compressed;
          }
        });
      }
    }
  }

  Future<void> _showTypesDialog() async {
    final tempSelected = List<int>.from(_selectedTypeIds);

    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(AppLocalizations.of(context)!.organizationType),
          content: SizedBox(
            width: double.maxFinite,
            child: _organizationTypes.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    shrinkWrap: true,
                    itemCount: _organizationTypes.length,
                    itemBuilder: (context, index) {
                      final type = _organizationTypes[index];
                      final id = type['id'] as int;
                      final label = type['type']?.toString() ?? type['name']?.toString() ?? id.toString();
                      return CheckboxListTile(
                        title: Text(label),
                        value: tempSelected.contains(id),
                        onChanged: (checked) {
                          setDialogState(() {
                            if (checked == true) {
                              tempSelected.add(id);
                            } else {
                              tempSelected.remove(id);
                            }
                          });
                        },
                        activeColor: Colors.blue,
                      );
                    },
                  ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(AppLocalizations.of(context)!.cancel),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() => _selectedTypeIds = tempSelected);
                Navigator.pop(context);
              },
              child: Text(AppLocalizations.of(context)!.accept),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final description = await _buildDescription();
      final bool success;

      if (_isEditMode) {
        success = await _organizationService.updateOrganization(
          organizationId: widget.organizationId!,
          principalName: _nameController.text.trim(),
          description: description,
          url: _urlController.text.trim(),
          contactName: _contactNameController.text.trim(),
          contactMail: _contactMailController.text.trim(),
          typeIds: _selectedTypeIds,
          isGlobal: _isGlobal,
          countries: _isGlobal ? null : _selectedCountryCodes,
          logo: _logoImage,
          cover: _coverImage,
        );
      } else {
        success = await _organizationService.createOrganization(
          principalName: _nameController.text.trim(),
          description: description,
          url: _urlController.text.trim(),
          contactName: _contactNameController.text.trim(),
          contactMail: _contactMailController.text.trim(),
          typeIds: _selectedTypeIds,
          isGlobal: _isGlobal,
          countries: _isGlobal ? null : _selectedCountryCodes,
          logo: _logoImage,
          cover: _coverImage,
        );
      }

      if (!mounted) return;
      final l10n = AppLocalizations.of(context)!;
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEditMode ? l10n.organizationUpdated : l10n.organizationCreated),
        ));
        Navigator.pop(context, true);
      } else {
        final serverMsg = _organizationService.lastError;
        final fallback = _isEditMode ? l10n.organizationUpdateError : l10n.organizationCreateError;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(serverMsg ?? fallback),
          duration: const Duration(seconds: 5),
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Text(_isEditMode ? l10n.editOrganizationTitle : l10n.createOrganizationTitle),
      ),
      body: _isLoadingData
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: Column(
                children: [
                  Expanded(
                    child: Form(
                      key: _formKey,
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          // ── Imágenes ────────────────────────────────────
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Logo
                              Column(
                                children: [
                                  Text(l10n.profileImageLabel, style: const TextStyle(fontSize: 14)),
                                  const SizedBox(height: 8),
                                  GestureDetector(
                                    onTap: () => _pickImage(true),
                                    child: Stack(
                                      children: [
                                        _logoImage != null
                                            ? ClipOval(
                                                child: Image.file(_logoImage!, width: 100, height: 100, fit: BoxFit.cover),
                                              )
                                            : _existingLogoUrl != null
                                                ? ClipOval(
                                                    child: CachedNetworkImage(
                                                      imageUrl: _existingLogoUrl!,
                                                      width: 100,
                                                      height: 100,
                                                      fit: BoxFit.cover,
                                                      errorWidget: (_, __, ___) => _logoPlaceholder(context),
                                                    ),
                                                  )
                                                : _logoPlaceholder(context),
                                        Positioned(
                                          bottom: 0,
                                          right: 0,
                                          child: Container(
                                            width: 28,
                                            height: 28,
                                            decoration: const BoxDecoration(color: Colors.blue, shape: BoxShape.circle),
                                            child: const Icon(Icons.add, color: Colors.white, size: 16),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(width: 16),
                              // Cover
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(l10n.coverImageLabel, style: const TextStyle(fontSize: 14)),
                                    const SizedBox(height: 8),
                                    GestureDetector(
                                      onTap: () => _pickImage(false),
                                      child: Stack(
                                        children: [
                                          ClipRRect(
                                            borderRadius: BorderRadius.circular(10),
                                            child: _coverImage != null
                                                ? Image.file(_coverImage!, width: double.infinity, height: 100, fit: BoxFit.cover)
                                                : _existingCoverUrl != null
                                                    ? CachedNetworkImage(
                                                        imageUrl: _existingCoverUrl!,
                                                        width: double.infinity,
                                                        height: 100,
                                                        fit: BoxFit.cover,
                                                        errorWidget: (_, __, ___) => _coverPlaceholder(context),
                                                      )
                                                    : _coverPlaceholder(context),
                                          ),
                                          Positioned(
                                            bottom: 6,
                                            right: 6,
                                            child: Container(
                                              width: 28,
                                              height: 28,
                                              decoration: const BoxDecoration(color: Colors.blue, shape: BoxShape.circle),
                                              child: const Icon(Icons.add, color: Colors.white, size: 16),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // ── Nombre ──────────────────────────────────────
                          TextFormField(
                            controller: _nameController,
                            maxLength: 50,
                            textCapitalization: TextCapitalization.words,
                            decoration: InputDecoration(
                              labelText: l10n.organizationNameLabel,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            onChanged: (_) => setState(() {}),
                            validator: (v) => (v == null || v.trim().isEmpty)
                                ? l10n.organizationNameRequired
                                : null,
                          ),
                          const SizedBox(height: 16),

                          // ── Descripción ─────────────────────────────────
                          Text(l10n.organizationBiographyLabel,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                          const SizedBox(height: 8),
                          HtmlRichEditor(
                            key: _editorKey,
                            initialValue: _initialDescription,
                          ),
                          const SizedBox(height: 16),

                          // ── URL ─────────────────────────────────────────
                          TextFormField(
                            controller: _urlController,
                            maxLength: 50,
                            keyboardType: TextInputType.url,
                            decoration: InputDecoration(
                              labelText: 'URL',
                              hintText: 'https://miorganizacion.org',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // ── Contacto ────────────────────────────────────
                          TextFormField(
                            controller: _contactNameController,
                            maxLength: 50,
                            textCapitalization: TextCapitalization.words,
                            decoration: InputDecoration(
                              labelText: 'Nombre de contacto',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                          const SizedBox(height: 16),

                          TextFormField(
                            controller: _contactMailController,
                            maxLength: 50,
                            keyboardType: TextInputType.emailAddress,
                            decoration: InputDecoration(
                              labelText: 'Email de contacto',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            validator: (v) {
                              if (v != null && v.isNotEmpty && !v.contains('@')) {
                                return 'Introduce un email válido';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          // ── Tipo de organización ─────────────────────────
                          Text(AppLocalizations.of(context)!.organizationType, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                          const SizedBox(height: 8),
                          OutlinedButton.icon(
                            onPressed: _organizationTypes.isEmpty ? null : _showTypesDialog,
                            icon: const Icon(Icons.add),
                            label: Text(_organizationTypes.isEmpty
                                ? 'Cargando tipos...'
                                : 'Seleccionar tipos'),
                          ),
                          if (_selectedTypeIds.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 4,
                              children: _selectedTypeIds.map((id) {
                                final type = _organizationTypes.firstWhere(
                                  (t) => t['id'] == id,
                                  orElse: () => {'id': id, 'type': id.toString()},
                                );
                                final label = type['type']?.toString() ?? type['name']?.toString() ?? id.toString();
                                return Chip(
                                  label: Text(label),
                                  deleteIcon: const Icon(Icons.close, size: 16),
                                  onDeleted: () => setState(() => _selectedTypeIds.remove(id)),
                                );
                              }).toList(),
                            ),
                          ],
                          const SizedBox(height: 8),

                          const Divider(height: 24),

                          // ── Cobertura geográfica ─────────────────────────
                          SwitchListTile(
                            title: Text(AppLocalizations.of(context)!.globalLabel),
                            value: _isGlobal,
                            onChanged: (v) => setState(() {
                              _isGlobal = v;
                              if (v) _selectedCountryCodes.clear();
                            }),
                            activeColor: Colors.blue,
                            contentPadding: EdgeInsets.zero,
                          ),
                          if (!_isGlobal) ...[
                            const SizedBox(height: 4),
                            OutlinedButton.icon(
                              onPressed: () {
                                showCountryPicker(
                                  context: context,
                                  showPhoneCode: false,
                                  onSelect: (Country country) {
                                    if (!_selectedCountryCodes.contains(country.countryCode)) {
                                      setState(() => _selectedCountryCodes.add(country.countryCode));
                                    }
                                  },
                                );
                              },
                              icon: const Icon(Icons.add_location_alt_outlined),
                              label: Text(AppLocalizations.of(context)!.addCountry),
                            ),
                            if (_selectedCountryCodes.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 4,
                                children: _selectedCountryCodes.map((code) {
                                  final country = CountryParser.parseCountryCode(code);
                                  return Chip(
                                    avatar: Text(country.flagEmoji, style: const TextStyle(fontSize: 16)),
                                    label: Text(country.name),
                                    deleteIcon: const Icon(Icons.close, size: 16),
                                    onDeleted: () => setState(() => _selectedCountryCodes.remove(code)),
                                  );
                                }).toList(),
                              ),
                            ],
                            const SizedBox(height: 8),
                          ],
                        ],
                      ),
                    ),
                  ),

                  // ── Footer ───────────────────────────────────────────
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
                    child: SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : Text(
                                _isEditMode ? l10n.profileSaveChanges : l10n.createOrganizationTitle,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _logoPlaceholder(BuildContext context) => Container(
        width: 100,
        height: 100,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          shape: BoxShape.circle,
        ),
        child: Icon(Icons.business, size: 48, color: Theme.of(context).colorScheme.onSurfaceVariant),
      );

  Widget _coverPlaceholder(BuildContext context) => Container(
        width: double.infinity,
        height: 100,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(Icons.image, size: 48, color: Theme.of(context).colorScheme.onSurfaceVariant),
      );
}
