import 'dart:async';
import 'dart:io';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import 'audio_player_tile.dart';

class AudioRecorderField extends StatefulWidget {
  final String questionId;
  final File? initial;
  final ValueChanged<File?> onChanged;
  final int maxDurationSeconds;

  const AudioRecorderField({
    super.key,
    required this.questionId,
    required this.onChanged,
    this.initial,
    this.maxDurationSeconds = 20,
  });

  @override
  State<AudioRecorderField> createState() => _AudioRecorderFieldState();
}

class _AudioRecorderFieldState extends State<AudioRecorderField> {
  final AudioRecorder _recorder = AudioRecorder();
  File? _file;
  bool _isRecording = false;
  Duration _elapsed = Duration.zero;
  Timer? _timer;
  String? _error;

  @override
  void initState() {
    super.initState();
    _file = widget.initial;
  }

  @override
  void dispose() {
    _timer?.cancel();
    _recorder.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    setState(() => _error = null);
    try {
      if (!await _recorder.hasPermission()) {
        setState(() => _error = 'Permiso de micrófono denegado');
        return;
      }
      final dir = await getTemporaryDirectory();
      final path = p.join(
        dir.path,
        'audio_${widget.questionId}_${DateTime.now().millisecondsSinceEpoch}.flac',
      );
      await _recorder.start(
        const RecordConfig(
          encoder: AudioEncoder.flac,
          sampleRate: 48000,
          numChannels: 1,
        ),
        path: path,
      );
      setState(() {
        _isRecording = true;
        _elapsed = Duration.zero;
        _file = null;
      });
      widget.onChanged(null);
      _timer = Timer.periodic(const Duration(milliseconds: 100), (t) {
        if (!mounted) return;
        final next = _elapsed + const Duration(milliseconds: 100);
        if (next.inMilliseconds >= widget.maxDurationSeconds * 1000) {
          _stop();
        } else {
          setState(() => _elapsed = next);
        }
      });
    } catch (e) {
      setState(() => _error = 'Error al iniciar grabación: $e');
    }
  }

  Future<void> _stop() async {
    _timer?.cancel();
    _timer = null;
    try {
      final path = await _recorder.stop();
      if (!mounted) return;
      if (path != null) {
        final f = File(path);
        setState(() {
          _file = f;
          _isRecording = false;
        });
        widget.onChanged(f);
      } else {
        setState(() => _isRecording = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isRecording = false;
          _error = 'Error al detener: $e';
        });
      }
    }
  }

  Future<void> _delete() async {
    final f = _file;
    setState(() => _file = null);
    widget.onChanged(null);
    if (f != null) {
      try {
        if (await f.exists()) await f.delete();
      } catch (_) {/* ignore */}
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final maxSecs = widget.maxDurationSeconds;
    final progress =
        (_elapsed.inMilliseconds / (maxSecs * 1000)).clamp(0.0, 1.0);
    final secsLabel =
        '${_elapsed.inSeconds.toString().padLeft(1, '0')}:${(_elapsed.inMilliseconds % 1000 ~/ 100)}';

    if (_isRecording) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(Icons.fiber_manual_record, color: Colors.red, size: 18),
              const SizedBox(width: 8),
              Text('Grabando  $secsLabel / 0:$maxSecs'),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(value: progress),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _stop,
            icon: const Icon(Icons.stop),
            label: const Text('Detener'),
          ),
        ],
      );
    }

    if (_file != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AudioPlayerTile(source: DeviceFileSource(_file!.path)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _start,
                  icon: const Icon(Icons.mic),
                  label: const Text('Re-grabar'),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                tooltip: 'Eliminar',
                onPressed: _delete,
                icon: Icon(Icons.delete_outline, color: colorScheme.error),
              ),
            ],
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(_error!,
                  style: TextStyle(color: colorScheme.error, fontSize: 12)),
            ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        OutlinedButton.icon(
          onPressed: _start,
          icon: const Icon(Icons.mic),
          label: Text('Grabar audio (máx ${widget.maxDurationSeconds}s)'),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(_error!,
                style: TextStyle(color: colorScheme.error, fontSize: 12)),
          ),
      ],
    );
  }
}
