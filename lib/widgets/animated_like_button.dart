import 'package:flutter/material.dart';

/// M7: Extracted from home_screen.dart.
/// Reusable animated like/heart button with scale animation.
class AnimatedLikeButton extends StatefulWidget {
  final bool isLiked;
  final int likes;
  final VoidCallback onPressed;
  final Color? iconColor;
  final Color? textColor;
  final double iconSize;
  final double textSize;
  final FontWeight? fontWeight;

  const AnimatedLikeButton({
    super.key,
    required this.isLiked,
    required this.likes,
    required this.onPressed,
    this.iconColor,
    this.textColor,
    this.iconSize = 16,
    this.textSize = 12,
    this.fontWeight,
  });

  @override
  State<AnimatedLikeButton> createState() => _AnimatedLikeButtonState();
}

class _AnimatedLikeButtonState extends State<AnimatedLikeButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.3)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.3, end: 1.0)
            .chain(CurveTween(curve: Curves.elasticOut)),
        weight: 50,
      ),
    ]).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTap() {
    _controller.forward(from: 0);
    widget.onPressed();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: _handleTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ScaleTransition(
            scale: _scaleAnimation,
            child: Icon(
              widget.isLiked ? Icons.favorite : Icons.favorite_border,
              size: widget.iconSize,
              color: widget.iconColor ?? (widget.isLiked ? Colors.red : colorScheme.onSurfaceVariant),
            ),
          ),
          const SizedBox(width: 4),
          Text(
            '${widget.likes}',
            style: TextStyle(
              fontSize: widget.textSize,
              color: widget.textColor ?? colorScheme.onSurfaceVariant,
              fontWeight: widget.fontWeight,
            ),
          ),
        ],
      ),
    );
  }
}
