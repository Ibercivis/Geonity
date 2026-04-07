import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../utils/image_utils.dart';
import 'package:country_picker/country_picker.dart';
import '../l10n/app_localizations.dart';
import '../services/auth_service.dart';

class EditProfileScreen extends StatefulWidget {
  final Map<String, dynamic> profileData;

  const EditProfileScreen({super.key, required this.profileData});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _authService = AuthService();
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _biographyController = TextEditingController();
  
  File? _coverImage;
  String? _currentCoverUrl;
  bool _isLoading = false;
  bool _visibility = true;
  String? _selectedCountryCode;
  String? _selectedCountryName;

  @override
  void initState() {
    super.initState();
    _firstNameController.text = widget.profileData['first_name'] ?? '';
    _lastNameController.text = widget.profileData['last_name'] ?? '';
    _biographyController.text = widget.profileData['biography'] ?? '';
    _currentCoverUrl = widget.profileData['cover'];
    _visibility = widget.profileData['visibility'] ?? true;
    
    // Inicializar país
    final countryCode = widget.profileData['country']?['code'];
    final countryName = widget.profileData['country']?['name'];
    if (countryCode != null) {
      _selectedCountryCode = countryCode;
      _selectedCountryName = countryName;
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _biographyController.dispose();
    super.dispose();
  }

  Future<void> _pickCoverImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      final compressed = await compressImageIfNeeded(File(pickedFile.path));
      setState(() {
        _coverImage = compressed;
      });
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final success = await _authService.updateProfile(
        firstName: _firstNameController.text,
        lastName: _lastNameController.text,
        biography: _biographyController.text,
        visibility: _visibility,
        countryCode: _selectedCountryCode,
        cover: _coverImage,
      );

      if (!mounted) return;

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.profileUpdated)),
        );
        Navigator.pop(context, true); // Volver con resultado para refrescar
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.profileUpdateError)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          l10n.profileEditTitle,
        ),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Cover Image
              Text(
                l10n.profileCoverImage,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _pickCoverImage,
                child: Container(
                  height: 200,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                  ),
                  child: _coverImage != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(
                            _coverImage!,
                            fit: BoxFit.cover,
                          ),
                        )
                      : _currentCoverUrl != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: CachedNetworkImage(
                                imageUrl: _currentCoverUrl!,
                                fit: BoxFit.cover,
                                errorWidget: (context, url, error) => Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.add_photo_alternate, size: 48, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                      const SizedBox(height: 8),
                                      Text(l10n.profileCoverImageChange),
                                    ],
                                  ),
                                ),
                              ),
                            )
                          : Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.add_photo_alternate, size: 48, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                  const SizedBox(height: 8),
                                  Text(l10n.profileCoverImageAdd),
                                ],
                              ),
                            ),
                ),
              ),
              const SizedBox(height: 24),

              // First Name
              Text(
                l10n.profileFirstName,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _firstNameController,
                decoration: InputDecoration(
                  hintText: l10n.profileFirstName,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return AppLocalizations.of(context)!.profileFirstNameRequired;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Last Name
              Text(
                l10n.profileLastName,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _lastNameController,
                decoration: InputDecoration(
                  hintText: l10n.profileLastName,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return AppLocalizations.of(context)!.profileLastNameRequired;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Biography
              Text(
                l10n.profileBiography,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _biographyController,
                maxLines: 4,
                decoration: InputDecoration(
                  hintText: l10n.profileBiographyHint,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  
                ),
              ),
              const SizedBox(height: 16),

              // Country
              Text(
                l10n.profileCountry,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () {
                  showCountryPicker(
                    context: context,
                    showPhoneCode: false,
                    countryListTheme: CountryListThemeData(
                      borderRadius: BorderRadius.circular(12),
                      inputDecoration: InputDecoration(
                        labelText: l10n.profileCountrySearch,
                        hintText: l10n.profileCountrySearchHint,
                        prefixIcon: const Icon(Icons.search),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    onSelect: (Country country) {
                      setState(() {
                        _selectedCountryCode = country.countryCode;
                        _selectedCountryName = country.name;
                      });
                    },
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerLowest,
                    border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _selectedCountryName ?? l10n.profileCountrySelect,
                        style: TextStyle(
                          fontSize: 16,
                          color: _selectedCountryName != null ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                      Icon(Icons.arrow_drop_down, color: Theme.of(context).colorScheme.onSurfaceVariant),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Visibility
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.profilePublic,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          l10n.profilePublicDescription,
                          style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: _visibility,
                    onChanged: (value) {
                      setState(() {
                        _visibility = value;
                      });
                    },
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Botón de guardar
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveProfile,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          l10n.profileSaveChanges,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
