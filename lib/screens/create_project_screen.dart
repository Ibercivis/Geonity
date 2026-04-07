import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:country_picker/country_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../utils/image_utils.dart';
import '../l10n/app_localizations.dart';
import '../services/project_service.dart';
import '../utils/multilingual_utils.dart';
import '../services/organization_service.dart';
import '../models/organization.dart';
import '../config/app_config.dart';
import 'create_project_fields_screen.dart';

class CreateProjectScreen extends StatefulWidget {
  final int? projectId; // Si no es null, estamos editando
  
  const CreateProjectScreen({super.key, this.projectId});

  @override
  State<CreateProjectScreen> createState() => _CreateProjectScreenState();
}

class _CreateProjectScreenState extends State<CreateProjectScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _passwordController = TextEditingController();
  final _projectService = ProjectService();
  final _organizationService = OrganizationService();
  
  File? _coverImage;
  List<int> _selectedOrganizationIds = [];
  List<int> _selectedTopicIds = [];
  bool _isPrivate = false;
  bool _isDatabasePrivate = false;
  bool _isFuzzyGeoposition = false;
  bool _isGlobal = true;
  List<String> _selectedCountryCodes = [];
  
  List<Organization> _myOrganizations = [];
  List<Map<String, dynamic>> _topics = [];
  
  bool _isLoading = false;
  bool _loadingData = true;
  String? _currentCoverUrl; // Para edición
  int? _contributions; // Número de observaciones

  // Raw multilingual maps: preserved from the server so other-language
  // translations are not lost when the user edits only one language.
  Map<String, String> _nameTranslations = {};
  Map<String, String> _descriptionTranslations = {};

  @override
  void initState() {
    super.initState();
    _loadInitialData().then((_) {
      if (widget.projectId != null) {
        _loadProjectData();
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    try {
      // Cargar organizaciones (puede fallar con 404)
      try {
        final orgs = await _organizationService.getOrganizations();
        setState(() {
          _myOrganizations = orgs;
        });
        debugPrint('Organizations loaded: ${orgs.length}');
      } catch (e) {
        debugPrint('Error loading organizations: $e');
        setState(() {
          _myOrganizations = [];
        });
      }
      
      // Cargar topics
      try {
        final topics = await _projectService.getTopics();
        setState(() {
          _topics = topics;
        });
        debugPrint('Topics loaded: ${topics.length}');
      } catch (e) {
        debugPrint('Error loading topics: $e');
        setState(() {
          _topics = [];
        });
      }
      
      setState(() => _loadingData = false);
    } catch (e) {
      debugPrint('Error loading data: $e');
      setState(() => _loadingData = false);
    }
  }

  String _getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    if (imagePath.startsWith('http')) return imagePath;
    final cleanPath = imagePath.startsWith('/') ? imagePath : '/$imagePath';
    return '${AppConfig.baseUrl}$cleanPath';
  }

  Future<void> _loadProjectData() async {
    if (widget.projectId == null) return;
    
    try {
      final projectData = await _projectService.getProjectDetail(widget.projectId!);
      
      if (projectData == null) return;
      
      setState(() {
        _nameTranslations = _parseTranslations(projectData['name']);
        _descriptionTranslations = _parseTranslations(projectData['description']);
        _nameController.text = localizedText(projectData['name']);
        _descriptionController.text = localizedText(projectData['description']);
        _isPrivate = projectData['is_private'] ?? false;
        _isDatabasePrivate = projectData['private_data'] ?? false;
        _isFuzzyGeoposition = projectData['fuzzy'] ?? projectData['is_fuzzy'] ?? false;
        
        // Procesar la imagen de portada
        final cover = projectData['cover'];
        if (cover != null && cover is List && cover.isNotEmpty) {
          _currentCoverUrl = _getImageUrl(cover[0]['image']);
        } else if (cover is String && cover.isNotEmpty) {
          _currentCoverUrl = _getImageUrl(cover);
        }
        
        _contributions = projectData['contributions'] ?? 0;
        
        // Cargar topics seleccionados
        if (projectData['topic'] != null) {
          final topics = projectData['topic'] as List;
          _selectedTopicIds = topics.map<int>((t) => t['id'] as int).toList();
        }
        
        // Cargar organizaciones seleccionadas
        if (projectData['organizations'] != null) {
          final orgs = projectData['organizations'] as List;
          _selectedOrganizationIds = orgs.map<int>((o) => o['id'] as int).toList();
        }

        // Cargar países
        _isGlobal = projectData['is_global'] ?? true;
        if (projectData['countries'] != null) {
          _selectedCountryCodes = (projectData['countries'] as List).cast<String>();
        }
      });
    } catch (e) {
      debugPrint('Error loading project data: $e');
    }
  }

  static Map<String, String> _parseTranslations(dynamic value) {
    if (value is Map) {
      return Map<String, String>.from(
          value.map((k, v) => MapEntry(k.toString(), v?.toString() ?? '')));
    }
    if (value is String && value.isNotEmpty) {
      try {
        final decoded = jsonDecode(value);
        if (decoded is Map) {
          return Map<String, String>.from(
              decoded.map((k, v) => MapEntry(k.toString(), v?.toString() ?? '')));
        }
      } catch (_) {}
    }
    return {};
  }

  /// Returns the value to pass to the wizard: JSON-encoded multilingual map
  /// Always encodes as a multilingual map with a 'default' key for the primary text.
  String _multilingualName() {
    final plain = _nameController.text.trim();
    return jsonEncode(Map<String, String>.from(_nameTranslations)..['default'] = plain);
  }

  String _multilingualDescription() {
    final plain = _descriptionController.text.trim();
    return jsonEncode(Map<String, String>.from(_descriptionTranslations)..['default'] = plain);
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    
    if (pickedFile != null) {
      final compressed = await compressImageIfNeeded(File(pickedFile.path));
      setState(() {
        _coverImage = compressed;
      });
    }
  }

  Future<void> _showTopicsDialog() async {
    final tempSelected = List<int>.from(_selectedTopicIds);
    String query = '';

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final filtered = _topics.where((t) =>
                (t['topic'] as String? ?? '').toLowerCase().contains(query.toLowerCase())).toList();
            return AlertDialog(
              title: Text(AppLocalizations.of(context)!.selectTopics),
              content: SizedBox(
                width: double.maxFinite,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      decoration: InputDecoration(
                        hintText: AppLocalizations.of(context)!.searchHint,
                        prefixIcon: const Icon(Icons.search, size: 20),
                        isDense: true,
                        border: const OutlineInputBorder(),
                        contentPadding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      onChanged: (v) => setDialogState(() => query = v),
                    ),
                    const SizedBox(height: 8),
                    Flexible(
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final topic = filtered[index];
                          final isSelected = tempSelected.contains(topic['id']);
                          return CheckboxListTile(
                            title: Text(topic['topic'] ?? ''),
                            value: isSelected,
                            onChanged: (checked) {
                              setDialogState(() {
                                if (checked == true) {
                                  tempSelected.add(topic['id']);
                                } else {
                                  tempSelected.remove(topic['id']);
                                }
                              });
                            },
                            activeColor: Colors.blue,
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(AppLocalizations.of(context)!.cancel),
                ),
                ElevatedButton(
                  onPressed: () {
                    setState(() => _selectedTopicIds = tempSelected);
                    Navigator.pop(context);
                  },
                  child: Text(AppLocalizations.of(context)!.accept),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showOrganizationsDialog() async {
    final tempSelected = List<int>.from(_selectedOrganizationIds);
    String query = '';

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final filtered = _myOrganizations.where((o) =>
                o.principalName.toLowerCase().contains(query.toLowerCase())).toList();
            return AlertDialog(
              title: Text(AppLocalizations.of(context)!.selectOrganizationsDialog),
              content: SizedBox(
                width: double.maxFinite,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      decoration: InputDecoration(
                        hintText: AppLocalizations.of(context)!.searchHint,
                        prefixIcon: const Icon(Icons.search, size: 20),
                        isDense: true,
                        border: const OutlineInputBorder(),
                        contentPadding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      onChanged: (v) => setDialogState(() => query = v),
                    ),
                    const SizedBox(height: 8),
                    Flexible(
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final org = filtered[index];
                          final isSelected = tempSelected.contains(org.id);
                          return CheckboxListTile(
                            title: Text(org.principalName),
                            value: isSelected,
                            onChanged: (checked) {
                              setDialogState(() {
                                if (checked == true) {
                                  tempSelected.add(org.id);
                                } else {
                                  tempSelected.remove(org.id);
                                }
                              });
                            },
                            activeColor: Colors.blue,
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(AppLocalizations.of(context)!.cancel),
                ),
                ElevatedButton(
                  onPressed: () {
                    setState(() => _selectedOrganizationIds = tempSelected);
                    Navigator.pop(context);
                  },
                  child: Text(AppLocalizations.of(context)!.accept),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _createProject() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_isPrivate && _passwordController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.privateProjectsRequirePassword)),
      );
      return;
    }

    setState(() => _isLoading = true);

    bool success = false;
    
    if (widget.projectId != null) {
      // Modo edición
      success = await _projectService.updateProject(
        projectId: widget.projectId!,
        name: _multilingualName(),
        description: _multilingualDescription(),
        cover: _coverImage,
        topics: _selectedTopicIds.isEmpty ? null : _selectedTopicIds,
        organizationIds: _selectedOrganizationIds.isEmpty ? null : _selectedOrganizationIds,
        isPrivate: _isPrivate,
        password: _isPrivate ? _passwordController.text.trim() : null,
        isDatabasePrivate: _isDatabasePrivate,
        fuzzy: _isFuzzyGeoposition,
      );
    } else {
      // Modo creación
      final projectId = await _projectService.createProject(
        name: _multilingualName(),
        description: _multilingualDescription(),
        cover: _coverImage,
        topics: _selectedTopicIds.isEmpty ? null : _selectedTopicIds,
        organizationIds: _selectedOrganizationIds.isEmpty ? null : _selectedOrganizationIds,
        isPrivate: _isPrivate,
        password: _isPrivate ? _passwordController.text.trim() : null,
        isDatabasePrivate: _isDatabasePrivate,
        fuzzy: _isFuzzyGeoposition,
      );
      success = projectId != null;
    }

    setState(() => _isLoading = false);

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.projectId != null ? AppLocalizations.of(context)!.projectUpdated : AppLocalizations.of(context)!.projectCreated)),
      );
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.projectId != null ? AppLocalizations.of(context)!.projectUpdateError : AppLocalizations.of(context)!.projectCreateError)),
      );
    }
  }

  void _showEditOptions() {
    final l10n = AppLocalizations.of(context)!;
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              l10n.whatToEdit,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.save, color: Colors.blue),
              title: Text(l10n.saveBasicInfo),
              subtitle: Text(l10n.saveBasicInfoSubtitle),
              onTap: () {
                Navigator.pop(context);
                _createProject();
              },
            ),
            ListTile(
              leading: const Icon(Icons.list_alt, color: Colors.orange),
              title: Text(l10n.editFormFields),
              subtitle: _contributions != null && _contributions! > 0
                  ? Text(l10n.projectHasObservations(_contributions ?? 0))
                  : Text(l10n.editFormFieldsSubtitle),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => CreateProjectFieldsScreen(
                      projectName: _multilingualName(),
                      projectDescription: _multilingualDescription(),
                      coverImage: _coverImage,
                      selectedTopicIds: _selectedTopicIds,
                      selectedOrganizationIds: _selectedOrganizationIds,
                      isPrivate: _isPrivate,
                      isDatabasePrivate: _isDatabasePrivate,
                      isFuzzyGeoposition: _isFuzzyGeoposition,
                      isGlobal: _isGlobal,
                      selectedCountryCodes: _selectedCountryCodes,
                      password: _isPrivate ? _passwordController.text.trim() : null,
                      projectId: widget.projectId,
                      contributions: _contributions,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
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
          widget.projectId != null ? l10n.editProjectTitle : l10n.newProjectTitle,
        ),
      ),
      body: SafeArea(child: _loadingData
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Imagen de portada
                    GestureDetector(
                      onTap: _pickImage,
                      child: Container(
                        height: 200,
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surfaceContainerLow,
                          borderRadius: BorderRadius.circular(12),
                          image: _coverImage != null
                              ? DecorationImage(
                                  image: FileImage(_coverImage!),
                                  fit: BoxFit.cover,
                                )
                              : (_currentCoverUrl != null
                                  ? DecorationImage(
                                      image: CachedNetworkImageProvider(_currentCoverUrl!),
                                      fit: BoxFit.cover,
                                    )
                                  : null),
                        ),
                        child: (_coverImage == null && _currentCoverUrl == null)
                            ? Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.add_photo_alternate,
                                      size: 48, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                  const SizedBox(height: 8),
                                  Text(
                                    l10n.addCoverImage,
                                    style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                                  ),
                                ],
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Nombre del proyecto
                    TextFormField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        labelText: l10n.projectNameLabel,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return AppLocalizations.of(context)!.projectNameRequired;
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Descripción
                    TextFormField(
                      controller: _descriptionController,
                      decoration: InputDecoration(
                        labelText: l10n.projectDescriptionLabel,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        
                        alignLabelWithHint: true,
                      ),
                      maxLines: 5,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return AppLocalizations.of(context)!.projectDescriptionRequired;
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Topics
                    Text(
                      l10n.topicsLabel,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: _topics.isEmpty ? null : _showTopicsDialog,
                      icon: const Icon(Icons.add),
                      label: Text(_topics.isEmpty
                        ? l10n.noTopicsAvailable
                        : l10n.selectTopicsAction),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                    if (_selectedTopicIds.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _selectedTopicIds.map((id) {
                          final topic = _topics.firstWhere(
                            (t) => t['id'] == id,
                            orElse: () => {'id': id, 'topic': ''},
                          );
                          if ((topic['topic'] as String).isEmpty) return const SizedBox.shrink();
                          return Chip(
                            label: Text(topic['topic'] ?? ''),
                            deleteIcon: const Icon(Icons.close, size: 18),
                            onDeleted: () {
                              setState(() {
                                _selectedTopicIds.remove(id);
                              });
                            },
                          );
                        }).toList(),
                      ),
                    ],
                    const SizedBox(height: 16),

                    // Organizaciones
                    Text(
                      l10n.organizationsLabel,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: _myOrganizations.isEmpty ? null : _showOrganizationsDialog,
                      icon: const Icon(Icons.add),
                      label: Text(_myOrganizations.isEmpty
                          ? l10n.noOrganizationsAvailable
                          : l10n.selectOrganizationsAction),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                    if (_selectedOrganizationIds.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _selectedOrganizationIds.map((id) {
                          final org = _myOrganizations.firstWhere((o) => o.id == id);
                          return Chip(
                            label: Text(org.principalName),
                            deleteIcon: const Icon(Icons.close, size: 18),
                            onDeleted: () => setState(() => _selectedOrganizationIds.remove(id)),
                          );
                        }).toList(),
                      ),
                    ],
                    const SizedBox(height: 16),

                    // Cobertura geográfica
                    SwitchListTile(
                      title: Text(l10n.globalLabel),
                      subtitle: Text(l10n.globalProjectSubtitle),
                      value: _isGlobal,
                      onChanged: (value) {
                        setState(() {
                          _isGlobal = value;
                          if (value) _selectedCountryCodes.clear();
                        });
                      },
                      activeColor: Colors.blue,
                    ),
                    if (!_isGlobal) ...[
                      const SizedBox(height: 4),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
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
                              label: Text(l10n.addCountry),
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
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    const Divider(height: 8),

                    // Proyecto privado
                    SwitchListTile(
                      title: Text(l10n.privateProject),
                      subtitle: Text(l10n.privateProjectSubtitle),
                      value: _isPrivate,
                      onChanged: (value) {
                        setState(() {
                          _isPrivate = value;
                        });
                      },
                      activeColor: Colors.blue,
                    ),
                    if (_isPrivate) ...[
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: TextFormField(
                          controller: _passwordController,
                          decoration: InputDecoration(
                            labelText: l10n.projectPasswordLabel,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            filled: true,
                            
                            prefixIcon: const Icon(Icons.lock),
                          ),
                          obscureText: true,
                          validator: (value) {
                            if (_isPrivate && (value == null || value.trim().isEmpty)) {
                              return AppLocalizations.of(context)!.projectPasswordRequired;
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],

                    // Base de datos privada
                    SwitchListTile(
                      title: Text(l10n.privateDatabase),
                      subtitle: Text(l10n.privateDatabaseSubtitle),
                      value: _isDatabasePrivate,
                      onChanged: (value) {
                        setState(() {
                          _isDatabasePrivate = value;
                        });
                      },
                      activeColor: Colors.blue,
                    ),

                    // Fuzzy geoposition
                    SwitchListTile(
                      title: Text(l10n.fuzzyGeoposition),
                      subtitle: Text(l10n.fuzzyGeopositionSubtitle),
                      value: _isFuzzyGeoposition,
                      onChanged: (value) {
                        setState(() {
                          _isFuzzyGeoposition = value;
                        });
                      },
                      activeColor: Colors.blue,
                    ),

                  ],
                ),
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
                onPressed: _isLoading ? null : () {
                  if (_formKey.currentState!.validate()) {
                    if (_isPrivate && _passwordController.text.trim().isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(AppLocalizations.of(context)!.privateProjectsRequirePassword)),
                      );
                      return;
                    }
                    
                    // Navegar a pantalla de campos (tanto en creación como edición)
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => CreateProjectFieldsScreen(
                          projectName: _multilingualName(),
                          projectDescription: _multilingualDescription(),
                          coverImage: _coverImage,
                          selectedTopicIds: _selectedTopicIds,
                          selectedOrganizationIds: _selectedOrganizationIds,
                          isPrivate: _isPrivate,
                          isDatabasePrivate: _isDatabasePrivate,
                          isFuzzyGeoposition: _isFuzzyGeoposition,
                          isGlobal: _isGlobal,
                          selectedCountryCodes: _selectedCountryCodes,
                          password: _isPrivate ? _passwordController.text.trim() : null,
                          projectId: widget.projectId,
                          contributions: _contributions,
                        ),
                      ),
                    );
                  }
                },
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Theme.of(context).colorScheme.outline),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        l10n.next,
                        style: TextStyle(
                          fontSize: 16,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
              ),
            ),
          ),
        ],
      )),
    );
  }
}
