import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';

class AudioPlayerTile extends StatefulWidget {
  final Source source;
  final EdgeInsets padding;

  const AudioPlayerTile({
    super.key,
    required this.source,
    this.padding = const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
  });

  @override
  State<AudioPlayerTile> createState() => _AudioPlayerTileState();
}

class _AudioPlayerTileState extends State<AudioPlayerTile> {
  late final AudioPlayer _player;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;
  PlayerState _state = PlayerState.stopped;

  @override
  void initState() {
    super.initState();
    _player = AudioPlayer();
    _player.onDurationChanged.listen((d) {
      if (mounted) setState(() => _duration = d);
    });
    _player.onPositionChanged.listen((p) {
      if (mounted) setState(() => _position = p);
    });
    _player.onPlayerStateChanged.listen((s) {
      if (mounted) setState(() => _state = s);
    });
    _player.onPlayerComplete.listen((_) {
      if (mounted) {
        setState(() {
          _state = PlayerState.stopped;
          _position = Duration.zero;
        });
      }
    });
  }

  @override
  void didUpdateWidget(covariant AudioPlayerTile oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.source != widget.source) {
      _player.stop();
      setState(() {
        _position = Duration.zero;
        _duration = Duration.zero;
        _state = PlayerState.stopped;
      });
    }
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  Future<void> _togglePlay() async {
    if (_state == PlayerState.playing) {
      await _player.pause();
    } else {
      await _player.play(widget.source);
    }
  }

  String _format(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(1, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isPlaying = _state == PlayerState.playing;
    final maxMs = _duration.inMilliseconds > 0 ? _duration.inMilliseconds : 1;
    final value = _position.inMilliseconds.clamp(0, maxMs).toDouble();

    return Container(
      padding: widget.padding,
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          IconButton(
            icon: Icon(isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill),
            iconSize: 36,
            color: colorScheme.primary,
            onPressed: _togglePlay,
          ),
          Expanded(
            child: Slider(
              min: 0,
              max: maxMs.toDouble(),
              value: value,
              onChanged: (v) async {
                await _player.seek(Duration(milliseconds: v.toInt()));
              },
            ),
          ),
          const SizedBox(width: 4),
          Text(
            '${_format(_position)} / ${_format(_duration)}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(width: 8),
        ],
      ),
    );
  }
}
