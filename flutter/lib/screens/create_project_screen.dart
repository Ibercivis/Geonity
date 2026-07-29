import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import '../widgets/html_rich_editor.dart';
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
  final _passwordController = TextEditingController();
  final _descriptionEditorKey = GlobalKey<HtmlRichEditorState>();
  String? _initialDescription; // HTML cargado del servidor
  final _projectService = ProjectService();
  final _organizationService = OrganizationService();
  
  File? _coverImage;
  List<int> _selectedOrganizationIds = [];
  List<int> _selectedTopicIds = [];
  bool _isPrivate = false;
  bool _isPublicMap = false;
  bool _isDatabasePrivate = false;
  bool _isFuzzyGeoposition = false;
  bool _isDraft = true;
  bool _isEnded = false;
  bool _isEmailOnObservation = false;
  bool _isGlobal = true;
  List<String> _selectedCountryCodes = [];
  
  List<Organization> _myOrganizations = [];
  List<Map<String, dynamic>> _topics = [];
  
  bool _isLoading = false;
  bool _loadingData = true;
  String? _currentCoverUrl; // Para edición
  int? _contributions; // Número de observaciones

  // Wizard state preserved across back-navigation
  Map<String, dynamic>? _savedFieldForm;
  String? _savedMessage;

  // Raw multilingual map for description: preserves other-language translations
  // when the user edits only one language.
  Map<String, String> _descriptionTranslations = {};

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    try {
      // Cargar organizaciones
      try {
        final orgs = await _organizationService.getOrganizations();
        setState(() => _myOrganizations = orgs);
        debugPrint('Organizations loaded: ${orgs.length}');
      } catch (e) {
        debugPrint('Error loading organizations: $e');
      }

      // Cargar topics
      try {
        final topics = await _projectService.getTopics();
        setState(() => _topics = topics);
        debugPrint('Topics loaded: ${topics.length}');
      } catch (e) {
        debugPrint('Error loading topics: $e');
      }

      // Cargar datos del proyecto — debe hacerse ANTES de quitar el loading
      // para evitar race condition con los switches del usuario.
      if (widget.projectId != null) {
        await _loadProjectData();
      }
    } catch (e) {
      debugPrint('Error loading data: $e');
    } finally {
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
        _descriptionTranslations = _parseTranslations(projectData['description']);
        _nameController.text = localizedText(projectData['name']);
        _initialDescription = localizedText(projectData['description']);
        _isPrivate = projectData['is_private'] ?? false;
        _isPublicMap = projectData['public_map'] ?? false;
        _isDatabasePrivate = projectData['private_data'] ?? false;
        _isFuzzyGeoposition = projectData['fuzzy'] ?? projectData['is_fuzzy'] ?? false;
        _isDraft = projectData['draft'] ?? true;
        _isEnded = projectData['ended'] ?? false;
        _isEmailOnObservation = projectData['email_on_observation'] ?? false;
        
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

  /// Name is the same in all languages — return plain text.
  String _multilingualName() {
    return _nameController.text.trim();
  }

  String _multilingualDescription() {
    final html = _descriptionEditorKey.currentState?.getHtml() ?? '';
    return jsonEncode(Map<String, String>.from(_descriptionTranslations)..['default'] = html);
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

    final descHtml = _descriptionEditorKey.currentState?.getHtml() ?? '';
    if (descHtml.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.projectDescriptionRequired)),
      );
      return;
    }

    // Cover required on create; on edit it already exists on the server
    if (_coverImage == null && _currentCoverUrl == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.coverImageRequired)),
      );
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
        publicMap: _isPublicMap,
        fuzzy: _isFuzzyGeoposition,
        draft: _isDraft,
        ended: _isEnded,
        emailOnObservation: _isEmailOnObservation,
        isGlobal: _isGlobal,
        countries: _isGlobal ? null : _selectedCountryCodes,
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
        publicMap: _isPublicMap,
        fuzzy: _isFuzzyGeoposition,
        draft: _isDraft,
        ended: _isEnded,
        emailOnObservation: _isEmailOnObservation,
        isGlobal: _isGlobal,
        countries: _isGlobal ? null : _selectedCountryCodes,
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
      final serverMsg = _projectService.lastError;
      final fallback = widget.projectId != null
          ? AppLocalizations.of(context)!.projectUpdateError
          : AppLocalizations.of(context)!.projectCreateError;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(serverMsg ?? fallback),
          duration: const Duration(seconds: 5),
        ),
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
                      isPublicMap: _isPublicMap,
                      isDatabasePrivate: _isDatabasePrivate,
                      isFuzzyGeoposition: _isFuzzyGeoposition,
                      isDraft: _isDraft,
                      isEnded: _isEnded,
                      isEmailOnObservation: _isEmailOnObservation,
                      isGlobal: _isGlobal,
                      selectedCountryCodes: _selectedCountryCodes,
                      password: _isPrivate ? _passwordController.text.trim() : null,
                      projectId: widget.projectId,
                      contributions: _contributions,
                      initialFieldForm: _savedFieldForm,
                      initialMessage: _savedMessage,
                    ),
                  ),
                ).then((result) {
                  if (result is Map && mounted) {
                    setState(() {
                      _savedFieldForm = result['fieldForm'] as Map<String, dynamic>?;
                      _savedMessage = result['message'] as String?;
                    });
                  }
                });
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
                      textCapitalization: TextCapitalization.words,
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
                    Text(
                      l10n.projectDescriptionLabel,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 8),
                    HtmlRichEditor(
                      key: _descriptionEditorKey,
                      initialValue: _initialDescription,
                      minHeight: 180,
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

                    const Divider(height: 8),

                    // 1. Publicado / Borrador
                    SwitchListTile(
                      title: Text(l10n.projectPublished),
                      subtitle: Text(
                        _isDraft
                            ? (_contributions != null
                                ? l10n.projectDraftSubtitleWithCount(_contributions!)
                                : l10n.projectDraftSubtitle)
                            : l10n.projectPublishedSubtitle,
                      ),
                      value: !_isDraft,
                      onChanged: (_contributions == null || _contributions! < 10)
                          ? null
                          : (value) => setState(() => _isDraft = !value),
                      activeColor: Colors.blue,
                    ),

                    // 2. Proyecto privado
                    SwitchListTile(
                      title: Text(l10n.privateProject),
                      subtitle: Text(l10n.privateProjectSubtitle),
                      value: _isPrivate,
                      onChanged: (value) => setState(() => _isPrivate = value),
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

                    // 3. Mapa público
                    SwitchListTile(
                      title: Text(l10n.publicMap),
                      subtitle: Text(l10n.publicMapSubtitle),
                      value: _isPublicMap,
                      onChanged: (value) => setState(() => _isPublicMap = value),
                      activeColor: Colors.blue,
                    ),

                    // 4. Base de datos privada
                    SwitchListTile(
                      title: Text(l10n.privateDatabase),
                      subtitle: Text(l10n.privateDatabaseSubtitle),
                      value: _isDatabasePrivate,
                      onChanged: (value) => setState(() => _isDatabasePrivate = value),
                      activeColor: Colors.blue,
                    ),

                    // 5. Modo difuso
                    SwitchListTile(
                      title: Text(l10n.fuzzyGeoposition),
                      subtitle: Text(l10n.fuzzyGeopositionSubtitle),
                      value: _isFuzzyGeoposition,
                      onChanged: (value) => setState(() => _isFuzzyGeoposition = value),
                      activeColor: Colors.blue,
                    ),

                    // 6. Cobertura geográfica
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

                    // 7. Finalizado
                    SwitchListTile(
                      title: Text(l10n.projectEnded),
                      subtitle: Text(l10n.projectEndedSubtitle),
                      value: _isEnded,
                      onChanged: (value) => setState(() => _isEnded = value),
                      activeColor: Colors.blue,
                    ),

                    // 8. Email al recibir observación
                    SwitchListTile(
                      title: Text(l10n.emailOnObservation),
                      subtitle: Text(l10n.emailOnObservationSubtitle),
                      value: _isEmailOnObservation,
                      onChanged: (value) => setState(() => _isEmailOnObservation = value),
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
                          isDraft: _isDraft,
                          isEnded: _isEnded,
                          isEmailOnObservation: _isEmailOnObservation,
                          isGlobal: _isGlobal,
                          selectedCountryCodes: _selectedCountryCodes,
                          password: _isPrivate ? _passwordController.text.trim() : null,
                          projectId: widget.projectId,
                          contributions: _contributions,
                          initialFieldForm: _savedFieldForm,
                          initialMessage: _savedMessage,
                        ),
                      ),
                    ).then((result) {
                      if (result is Map && mounted) {
                        setState(() {
                          _savedFieldForm = result['fieldForm'] as Map<String, dynamic>?;
                          _savedMessage = result['message'] as String?;
                        });
                      }
                    });
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
