import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../utils/image_utils.dart';
import 'dart:io';
import '../l10n/app_localizations.dart';
import '../services/organization_service.dart';

class CreateOrganizationScreen extends StatefulWidget {
  final int? organizationId;
  final String? initialName;
  final String? initialDescription;
  final String? initialLogo;
  final String? initialCover;

  const CreateOrganizationScreen({
    super.key,
    this.organizationId,
    this.initialName,
    this.initialDescription,
    this.initialLogo,
    this.initialCover,
  });

  @override
  State<CreateOrganizationScreen> createState() => _CreateOrganizationScreenState();
}

class _CreateOrganizationScreenState extends State<CreateOrganizationScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _bioController;
  final _organizationService = OrganizationService();
  File? _profileImage;
  File? _coverImage;
  String? _existingLogoUrl;
  String? _existingCoverUrl;
  bool _isSubmitting = false;

  bool get isEditMode => widget.organizationId != null;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialName ?? '');
    _bioController = TextEditingController(text: widget.initialDescription ?? '');
    _existingLogoUrl = widget.initialLogo;
    _existingCoverUrl = widget.initialCover;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(bool isProfile) async {
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
          if (isProfile) {
            _profileImage = compressed;
          } else {
            _coverImage = compressed;
          }
        });
      }
    }
  }

  Future<void> _submitOrganization() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final bool success;
      
      if (isEditMode) {
        // Modo edición
        success = await _organizationService.updateOrganization(
          organizationId: widget.organizationId!,
          principalName: _nameController.text.trim(),
          description: _bioController.text.trim(),
          logo: _profileImage,
          cover: _coverImage,
        );
      } else {
        // Modo creación
        success = await _organizationService.createOrganization(
          principalName: _nameController.text.trim(),
          description: _bioController.text.trim(),
          logo: _profileImage,
          cover: _coverImage,
        );
      }
      
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                isEditMode
                  ? l10n.organizationUpdated
                  : l10n.organizationCreated
              ),
            ),
          );
          Navigator.pop(context, true);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                isEditMode
                  ? l10n.organizationUpdateError
                  : l10n.organizationCreateError
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header sin botón de atrás
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                isEditMode ? l10n.editOrganizationTitle : l10n.createOrganizationTitle,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            Expanded(
              child: Form(
                key: _formKey,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Imágenes
                    Row(
                      children: [
                        // Imagen del perfil
                        Expanded(
                          child: Column(
                            children: [
                              Text(
                                AppLocalizations.of(context)!.profileImageLabel,
                                style: const TextStyle(fontSize: 14),
                              ),
                              const SizedBox(height: 12),
                              GestureDetector(
                                onTap: () => _pickImage(true),
                                child: SizedBox(
                                  width: 120,
                                  height: 120,
                                  child: Stack(
                                    clipBehavior: Clip.none,
                                    children: [
                                      _profileImage != null
                                          ? ClipOval(
                                              child: SizedBox(
                                                width: 120,
                                                height: 120,
                                                child: Image.file(
                                                  _profileImage!,
                                                  fit: BoxFit.cover,
                                                ),
                                              ),
                                            )
                                          : _existingLogoUrl != null
                                              ? ClipOval(
                                                  child: SizedBox(
                                                    width: 120,
                                                    height: 120,
                                                    child: CachedNetworkImage(
                                                      imageUrl: _existingLogoUrl!,
                                                      fit: BoxFit.cover,
                                                      errorWidget: (context, url, error) => Container(
                                                        width: 120,
                                                        height: 120,
                                                        decoration: BoxDecoration(
                                                          color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                                          shape: BoxShape.circle,
                                                        ),
                                                        child: Icon(
                                                          Icons.person,
                                                          size: 60,
                                                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                )
                                              : Container(
                                                  width: 120,
                                                  height: 120,
                                                  decoration: BoxDecoration(
                                                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: Icon(
                                                    Icons.person,
                                                    size: 60,
                                                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                                                  ),
                                                ),
                                      Positioned(
                                        bottom: 0,
                                        right: 0,
                                        child: Container(
                                          width: 36,
                                          height: 36,
                                          decoration: const BoxDecoration(
                                            color: Colors.blue,
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(
                                            Icons.add,
                                            color: Colors.white,
                                            size: 20,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        // Imagen de portada
                        Expanded(
                          child: Column(
                            children: [
                              Text(
                                AppLocalizations.of(context)!.coverImageLabel,
                                style: const TextStyle(fontSize: 14),
                              ),
                              const SizedBox(height: 12),
                              GestureDetector(
                                onTap: () => _pickImage(false),
                                child: Stack(
                                  children: [
                                    Container(
                                      width: double.infinity,
                                      height: 120,
                                      decoration: BoxDecoration(
                                        color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: _coverImage != null
                                          ? ClipRRect(
                                              borderRadius: BorderRadius.circular(12),
                                              child: Image.file(
                                                _coverImage!,
                                                fit: BoxFit.cover,
                                              ),
                                            )
                                          : _existingCoverUrl != null
                                              ? ClipRRect(
                                                  borderRadius: BorderRadius.circular(12),
                                                  child: CachedNetworkImage(
                                                    imageUrl: _existingCoverUrl!,
                                                    fit: BoxFit.cover,
                                                    errorWidget: (context, url, error) => Icon(
                                                      Icons.image,
                                                      size: 60,
                                                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                                                    ),
                                                  ),
                                                )
                                              : Icon(
                                                  Icons.image,
                                                  size: 60,
                                                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                                            ),
                                    ),
                                    Positioned(
                                      bottom: 8,
                                      right: 8,
                                      child: Container(
                                        width: 36,
                                        height: 36,
                                        decoration: const BoxDecoration(
                                          color: Colors.blue,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.add,
                                          color: Colors.white,
                                          size: 20,
                                        ),
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
                    const SizedBox(height: 32),

                    // Nombre de la organización
                    Text(
                      l10n.organizationNameLabel,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _nameController,
                      maxLength: 50,
                      decoration: InputDecoration(
                        hintText: l10n.organizationNameHint,
                        hintStyle: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: Colors.blue),
                        ),
                        counterText: '${_nameController.text.length}/50',
                      ),
                      onChanged: (value) {
                        setState(() {}); // Para actualizar el contador
                      },
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return AppLocalizations.of(context)!.organizationNameRequired;
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),

                    // Biografía
                    Text(
                      l10n.organizationBiographyLabel,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _bioController,
                      maxLength: 500,
                      maxLines: 6,
                      decoration: InputDecoration(
                        hintText: l10n.organizationBiographyHint,
                        hintStyle: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: Colors.blue),
                        ),
                        counterText: '${_bioController.text.length}/500',
                      ),
                      onChanged: (value) {
                        setState(() {}); // Para actualizar el contador
                      },
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          
          // Footer con botones
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              boxShadow: [
                BoxShadow(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SizedBox(
              width: double.infinity,
              height: 50,
              child: OutlinedButton(
                onPressed: _isSubmitting ? null : _submitOrganization,
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Theme.of(context).colorScheme.outline),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        isEditMode ? l10n.profileSaveChanges : l10n.createOrganizationTitle,
                        style: TextStyle(
                          fontSize: 16,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
      ),
    );
  }
}
