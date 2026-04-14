import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html/flutter_widget_from_html.dart' hide ImageSource;
import '../l10n/app_localizations.dart';
import 'package:image_picker/image_picker.dart';
import '../utils/image_utils.dart';
import 'dart:io';
import '../models/observation_field.dart';
import '../services/connection_helper.dart';
import '../services/observation_service.dart';
import '../services/offline_service.dart';
import '../services/sync_service.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;
import 'package:geolocator/geolocator.dart';
import 'qr_scanner_screen.dart';

class AddObservationScreen extends StatefulWidget {
  final int fieldFormId;
  final int projectId;
  final double latitude;
  final double longitude;
  final List<ObservationField> fields;
  final String? postObservationMessage;
  final bool showPostMessage;

  const AddObservationScreen({
    super.key,
    required this.fieldFormId,
    required this.projectId,
    required this.latitude,
    required this.longitude,
    required this.fields,
    this.postObservationMessage,
    this.showPostMessage = true,
  });

  @override
  State<AddObservationScreen> createState() => _AddObservationScreenState();
}

class _AddObservationScreenState extends State<AddObservationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _observationService = ObservationService();
  final _offlineService = OfflineService();
  final Map<String, dynamic> _formData = {};
  final Map<String, List<File>> _imageData = {};
  bool _isSubmitting = false;
  mapbox.MapboxMap? _miniMapController;
  final ScrollController _scrollController = ScrollController();
  bool _isMapTouched = false;
  
  // Coordenadas editables
  late double _currentLatitude;
  late double _currentLongitude;
  mapbox.CircleAnnotationManager? _markerManager;
  mapbox.CircleAnnotation? _currentMarker;

  @override
  void initState() {
    super.initState();
    _currentLatitude = widget.latitude;
    _currentLongitude = widget.longitude;
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          l10n.addObservationTitle,
        ),
      ),
      body: SafeArea(child: Column(
        children: [
          // Mini mapa - fijo arriba
          Container(
            height: 250,
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: colorScheme.outlineVariant),
            ),
            clipBehavior: Clip.hardEdge,
            child: Stack(
              children: [
                mapbox.MapWidget(
                  cameraOptions: mapbox.CameraOptions(
                    center: mapbox.Point(
                      coordinates: mapbox.Position(widget.longitude, widget.latitude),
                    ),
                    zoom: 15.0,
                  ),
                  styleUri: Theme.of(context).brightness == Brightness.dark
                      ? mapbox.MapboxStyles.DARK
                      : mapbox.MapboxStyles.MAPBOX_STREETS,
                  onMapCreated: (mapboxMap) {
                    _miniMapController = mapboxMap;
                    // Añadir marcador circular rojo
                    mapboxMap.annotations.createCircleAnnotationManager().then((manager) {
                      _markerManager = manager;
                      _updateMarker();
                    });
                  },
                  onTapListener: (mapbox.MapContentGestureContext context) {
                    // Obtener las coordenadas del tap
                    final coordinate = context.point;
                    setState(() {
                      _currentLatitude = coordinate.coordinates.lat.toDouble();
                      _currentLongitude = coordinate.coordinates.lng.toDouble();
                    });
                    _updateMarker();
                  },
                ),
                // Botón para centrar en la ubicación
                Positioned(
                  top: 8,
                  right: 8,
                  child: Material(
                    color: colorScheme.surface,
                    borderRadius: BorderRadius.circular(8),
                    elevation: 2,
                    child: InkWell(
                      onTap: () async {
                        // Obtener ubicación GPS actual
                        try {
                          final position = await Geolocator.getCurrentPosition();
                          setState(() {
                            _currentLatitude = position.latitude;
                            _currentLongitude = position.longitude;
                          });
                          _updateMarker();
                          
                          // Centrar mapa en nueva ubicación
                          if (_miniMapController != null) {
                            _miniMapController!.flyTo(
                              mapbox.CameraOptions(
                                center: mapbox.Point(
                                  coordinates: mapbox.Position(_currentLongitude, _currentLatitude),
                                ),
                                zoom: 15.0,
                              ),
                              mapbox.MapAnimationOptions(duration: 500),
                            );
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(AppLocalizations.of(context)!.addObservationLocationError(e.toString()))),
                            );
                          }
                        }
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: const Padding(
                        padding: EdgeInsets.all(8),
                        child: Icon(Icons.my_location, size: 20, color: Colors.blue),
                      ),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: colorScheme.surface,
                      borderRadius: BorderRadius.circular(4),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Text(
                      '${_currentLatitude.toStringAsFixed(5)}, ${_currentLongitude.toStringAsFixed(5)}',
                      style: const TextStyle(fontSize: 10),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Divider(),
          ),
          // Formulario - scrollable
          Expanded(
            child: Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
            // Campos dinámicos del formulario
            ...widget.fields.map((field) => _buildFieldWidget(field)),

            const SizedBox(height: 32),

            // Botón de envío
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitObservation,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue[700],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      l10n.addObservationSubmit,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
            ),
                ],
              ),
            ),
          ),
        ],
      )),
    );
  }

  Widget _buildFieldWidget(ObservationField field) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  field.label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  ),
                ),
              ),
              if (field.required)
                const Text(
                  ' *',
                  style: TextStyle(color: Colors.red, fontSize: 14),
                ),
            ],
          ),
          if (field.helpText != null && field.helpText!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              field.helpText!,
              style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant),
            ),

          ],
          const SizedBox(height: 8),
          _buildInputWidget(field),
        ],
      ),
    );
  }

  Widget _buildInputWidget(ObservationField field) {
    final colorScheme = Theme.of(context).colorScheme;
    // Normalizar el tipo de campo a minúsculas para comparación
    final fieldType = field.fieldType.toUpperCase();
    
    switch (fieldType) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'STR':
        return TextFormField(
          maxLines: fieldType == 'TEXTAREA' ? 4 : 1,
          initialValue: _formData[field.id.toString()]?.toString(),
          textCapitalization: TextCapitalization.sentences,
          decoration: InputDecoration(
            hintText: AppLocalizations.of(context)!.fieldEnter(field.label.toLowerCase()),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
          validator: field.required
              ? (value) => value == null || value.isEmpty ? AppLocalizations.of(context)!.fieldRequired : null
              : null,
          onChanged: (value) => _formData[field.id.toString()] = value,
          onSaved: (value) => _formData[field.id.toString()] = value ?? '',
        );

      case 'NUM':
      case 'NUMBER':
        return TextFormField(
          keyboardType: TextInputType.number,
          initialValue: _formData[field.id.toString()]?.toString(),
          decoration: InputDecoration(
            hintText: AppLocalizations.of(context)!.fieldEnter(field.label.toLowerCase()),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
          validator: field.required
              ? (value) => value == null || value.isEmpty ? AppLocalizations.of(context)!.fieldRequired : null
              : null,
          onChanged: (value) => _formData[field.id.toString()] = value,
          onSaved: (value) => _formData[field.id.toString()] = value ?? '',
        );

      case 'DATE':
        return TextFormField(
          readOnly: true,
          decoration: InputDecoration(
            hintText: AppLocalizations.of(context)!.fieldSelectDate,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            suffixIcon: const Icon(Icons.calendar_today),
          ),
          controller: TextEditingController(
            text: _formData[field.id.toString()]?.toString() ?? '',
          ),
          onTap: () async {
            final date = await showDatePicker(
              context: context,
              initialDate: DateTime.now(),
              firstDate: DateTime(2000),
              lastDate: DateTime(2100),
            );
            if (date != null) {
              setState(() {
                // Formato ISO 8601 (YYYY-MM-DD) requerido por Django
                _formData[field.id.toString()] = 
                    '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
              });
            }
          },
          validator: field.required
              ? (value) => value == null || value.isEmpty ? AppLocalizations.of(context)!.fieldRequired : null
              : null,
        );

      case 'BOOL':
      case 'BOOLEAN':
        return SwitchListTile(
          value: _formData[field.id.toString()] ?? false,
          onChanged: (value) {
            setState(() {
              _formData[field.id.toString()] = value;
            });
          },
          title: Text(_formData[field.id.toString()] == true ? AppLocalizations.of(context)!.boolYes : AppLocalizations.of(context)!.boolNo),
          contentPadding: EdgeInsets.zero,
        );

      case 'CHOICE':
        if (field.choices == null || field.choices!.isEmpty) {
          return TextFormField(
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              hintText: AppLocalizations.of(context)!.fieldEnter(field.label.toLowerCase()),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            validator: field.required
                ? (value) => value == null || value.isEmpty ? AppLocalizations.of(context)!.fieldRequired : null
                : null,
            onSaved: (value) => _formData[field.id.toString()] = value ?? '',
          );
        }
        {
          final key = field.id.toString();
          final isOther = _formData['${key}_is_other'] == true;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DropdownButtonFormField<String>(
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
                hint: Text(AppLocalizations.of(context)!.fieldSelect(field.label.toLowerCase())),
                value: isOther ? '__other__' : (_formData[key] as String?),
                items: [
                  ...List.generate(field.choices!.length, (i) {
                    final label = field.choices![i];
                    final value = field.choiceValues?[i] ?? label;
                    return DropdownMenuItem(value: value, child: Text(label));
                  }),
                  if (field.allowOther)
                    DropdownMenuItem(value: '__other__', child: Text(AppLocalizations.of(context)!.other)),
                ],
                validator: field.required
                    ? (value) {
                        if (value == null) return AppLocalizations.of(context)!.fieldRequired;
                        if (value == '__other__') {
                          final text = _formData[key];
                          if (text == null || (text as String).isEmpty) return AppLocalizations.of(context)!.fieldRequired;
                        }
                        return null;
                      }
                    : null,
                onChanged: (value) {
                  setState(() {
                    if (value == '__other__') {
                      _formData['${key}_is_other'] = true;
                      _formData[key] = null;
                    } else {
                      _formData['${key}_is_other'] = false;
                      _formData[key] = value;
                    }
                  });
                },
              ),
              if (isOther) ...[
                const SizedBox(height: 8),
                TextFormField(
                  textCapitalization: TextCapitalization.sentences,
                  decoration: InputDecoration(
                    hintText: AppLocalizations.of(context)!.specify,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  ),
                  onChanged: (text) => _formData[key] = text,
                  validator: field.required
                      ? (value) => value == null || value.isEmpty ? AppLocalizations.of(context)!.fieldRequired : null
                      : null,
                ),
              ],
            ],
          );
        }

      case 'MCHOICE':
        if (field.choices == null || field.choices!.isEmpty) {
          return Text(AppLocalizations.of(context)!.noOptionsDefined,
              style: TextStyle(color: colorScheme.onSurfaceVariant));
        }
        {
          final key = field.id.toString();
          return FormField<List<String>>(
            initialValue: const [],
            validator: field.required
                ? (value) => (value == null || value.where((v) => v != '__other__').isEmpty)
                    ? AppLocalizations.of(context)!.selectAtLeastOneOption
                    : null
                : null,
            onSaved: (value) {
              if (value == null) { _formData[key] = []; return; }
              final result = value.where((v) => v != '__other__').toList();
              if (value.contains('__other__')) {
                final otherText = _formData['${key}_other_text'] as String?;
                if (otherText != null && otherText.isNotEmpty) result.add(otherText);
              }
              _formData[key] = result;
            },
            builder: (formState) {
              final isOtherChecked = formState.value?.contains('__other__') ?? false;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ...List.generate(field.choices!.length, (i) {
                    final label = field.choices![i];
                    final value = field.choiceValues?[i] ?? label;
                    return CheckboxListTile(
                      title: Text(label),
                      value: formState.value?.contains(value) ?? false,
                      onChanged: (checked) {
                        final current = List<String>.from(formState.value ?? []);
                        checked == true ? current.add(value) : current.remove(value);
                        formState.didChange(current);
                      },
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                    );
                  }),
                  if (field.allowOther) ...[
                    CheckboxListTile(
                      title: Text(AppLocalizations.of(context)!.other),
                      value: isOtherChecked,
                      onChanged: (checked) {
                        final current = List<String>.from(formState.value ?? []);
                        if (checked == true) {
                          current.add('__other__');
                        } else {
                          current.remove('__other__');
                          setState(() => _formData['${key}_other_text'] = null);
                        }
                        formState.didChange(current);
                        setState(() {});
                      },
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                    ),
                    if (isOtherChecked)
                      Padding(
                        padding: const EdgeInsets.only(left: 16, bottom: 8),
                        child: TextFormField(
                          textCapitalization: TextCapitalization.sentences,
                          decoration: InputDecoration(
                            hintText: AppLocalizations.of(context)!.specify,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          ),
                          onChanged: (text) => setState(() => _formData['${key}_other_text'] = text),
                          validator: (value) =>
                              value == null || value.isEmpty ? AppLocalizations.of(context)!.fieldRequired : null,
                        ),
                      ),
                  ],
                  if (formState.hasError)
                    Padding(
                      padding: const EdgeInsets.only(top: 4, left: 4),
                      child: Text(formState.errorText!,
                          style: const TextStyle(color: Colors.red, fontSize: 12)),
                    ),
                ],
              );
            },
          );
        }

      case 'IMG':
      case 'IMAGE':
        return Column(
          children: [
            if (_imageData[field.id.toString()]?.isNotEmpty == true)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _imageData[field.id.toString()]!
                    .map((file) => Stack(
                          children: [
                            Image.file(
                              file,
                              width: 100,
                              height: 100,
                              fit: BoxFit.cover,
                            ),
                            Positioned(
                              top: 0,
                              right: 0,
                              child: IconButton(
                                icon: const Icon(Icons.close, color: Colors.white),
                                style: IconButton.styleFrom(
                                  backgroundColor: Colors.red,
                                  padding: const EdgeInsets.all(4),
                                ),
                                onPressed: () {
                                  setState(() {
                                    _imageData[field.id.toString()]!.remove(file);
                                  });
                                },
                              ),
                            ),
                          ],
                        ))
                    .toList(),
              ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => _pickImage(field.id.toString()),
              icon: const Icon(Icons.add_photo_alternate),
              label: Text(AppLocalizations.of(context)!.fieldAddImage),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              ),
            ),
          ],
        );

      case 'QR':
      case 'BARCODE':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextFormField(
              readOnly: true,
              decoration: InputDecoration(
                hintText: AppLocalizations.of(context)!.fieldScanCode,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.qr_code_scanner),
                  onPressed: () async {
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const QRScannerScreen(),
                      ),
                    );
                    if (result != null) {
                      setState(() {
                        _formData[field.id.toString()] = result;
                      });
                    }
                  },
                ),
              ),
              controller: TextEditingController(
                text: _formData[field.id.toString()]?.toString() ?? '',
              ),
              validator: field.required
                  ? (value) => value == null || value.isEmpty ? AppLocalizations.of(context)!.fieldRequired : null
                  : null,
            ),
          ],
        );

      default:
        return TextFormField(
          textCapitalization: TextCapitalization.sentences,
          decoration: InputDecoration(
            hintText: AppLocalizations.of(context)!.fieldEnter(field.label.toLowerCase()),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          validator: field.required
              ? (value) => value == null || value.isEmpty ? AppLocalizations.of(context)!.fieldRequired : null
              : null,
          onSaved: (value) => _formData[field.id.toString()] = value ?? '',
        );
    }
  }

  Future<void> _updateMarker() async {
    if (_markerManager == null) return;
    
    // Eliminar marcador anterior si existe
    if (_currentMarker != null) {
      await _markerManager!.delete(_currentMarker!);
    }
    
    // Crear nuevo marcador circular en la posición actual
    _currentMarker = await _markerManager!.create(
      mapbox.CircleAnnotationOptions(
        geometry: mapbox.Point(
          coordinates: mapbox.Position(_currentLongitude, _currentLatitude),
        ),
        circleColor: Colors.red.value,
        circleRadius: 10.0,
        circleStrokeColor: Colors.white.value,
        circleStrokeWidth: 2.0,
      ),
    );
  }

  Future<void> _pickImage(String fieldId) async {
    // Mostrar diálogo para elegir entre cámara y galería
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

    if (source == null) return;

    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: source);

    if (pickedFile != null) {
      final compressed = await compressImageIfNeeded(File(pickedFile.path));
      setState(() {
        _imageData[fieldId] = [...(_imageData[fieldId] ?? []), compressed];
      });
    }
  }

  Future<void> _showPostObservationDialog() async {
    final message = widget.postObservationMessage;
    debugPrint('[PostDialog] showPostMessage=${widget.showPostMessage} message=${message?.substring(0, message.length.clamp(0, 80))}');
    if (!widget.showPostMessage || message == null || message.isEmpty || !mounted) return;

    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        content: HtmlWidget(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(AppLocalizations.of(context)!.close),
          ),
        ],
      ),
    );
  }

  Future<void> _submitObservation() async {
    if (!_formKey.currentState!.validate()) return;

    _formKey.currentState!.save();

    setState(() => _isSubmitting = true);

    try {
      final isOnline = await ConnectionHelper.hasInternetConnection();

      if (isOnline) {
        // ── Online: submit directly ──────────────────────────────────────────
        final success = await _observationService.createObservation(
          fieldFormId: widget.fieldFormId,
          latitude: _currentLatitude,
          longitude: _currentLongitude,
          data: _formData,
          images: _imageData,
        );

        if (mounted) {
          if (success) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(AppLocalizations.of(context)!.observationCreated),
                backgroundColor: Colors.green,
              ),
            );
            await _showPostObservationDialog();
            if (mounted) Navigator.pop(context, true);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(AppLocalizations.of(context)!.observationCreateError),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      } else {
        // ── Offline: save to local queue ─────────────────────────────────────
        await _offlineService.enqueueObservation(
          fieldFormId: widget.fieldFormId,
          projectId: widget.projectId,
          latitude: _currentLatitude,
          longitude: _currentLongitude,
          data: _formData,
          images: _imageData,
        );
        SyncService().refreshPendingCount();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(AppLocalizations.of(context)!.offlineObservationSaved),
              backgroundColor: Colors.orange,
              duration: const Duration(seconds: 4),
            ),
          );
          await _showPostObservationDialog();
          if (mounted) Navigator.pop(context, true);
        }
      }
    } catch (e) {
      debugPrint('Error submitting observation: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }
}
