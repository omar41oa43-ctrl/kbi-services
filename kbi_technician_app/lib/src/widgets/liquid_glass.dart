import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// A quiet content canvas. Liquid Glass surfaces should float above this layer
/// as navigation or controls rather than being repeated on every content card.
class LiquidGlassBackdrop extends StatelessWidget {
  final Widget? child;

  const LiquidGlassBackdrop({super.key, this.child});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: const Color(0xFFF4F7FB),
      child: Stack(
        fit: StackFit.expand,
        children: [
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFFF7FAFF),
                  Color(0xFFF3F6FB),
                  Color(0xFFF8FAFC),
                ],
              ),
            ),
          ),
          Positioned(
            top: -180,
            right: -150,
            child: _AmbientOrb(
              size: 360,
              color: const Color(0xFF2563EB).withValues(alpha: 0.075),
            ),
          ),
          Positioned(
            bottom: -190,
            left: -170,
            child: _AmbientOrb(
              size: 380,
              color: const Color(0xFF06B6D4).withValues(alpha: 0.055),
            ),
          ),
          child ?? const SizedBox.expand(),
        ],
      ),
    );
  }
}

class _AmbientOrb extends StatelessWidget {
  final double size;
  final Color color;

  const _AmbientOrb({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: ImageFiltered(
        imageFilter: ImageFilter.blur(sigmaX: 50, sigmaY: 50),
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
      ),
    );
  }
}

/// Adaptive glass intended for the app's floating navigation and primary
/// controls. High Contrast produces a more opaque surface and disables blur.
class LiquidGlassSurface extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final BorderRadius borderRadius;
  final double blur;
  final Color? tint;
  final Color? borderColor;
  final List<BoxShadow>? shadows;
  final VoidCallback? onTap;
  final String? semanticLabel;

  const LiquidGlassSurface({
    super.key,
    required this.child,
    this.padding = EdgeInsets.zero,
    this.borderRadius = const BorderRadius.all(Radius.circular(28)),
    this.blur = 28,
    this.tint,
    this.borderColor,
    this.shadows,
    this.onTap,
    this.semanticLabel,
  });

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.maybeOf(context);
    final highContrast = media?.highContrast ?? false;
    final reduceMotion = (media?.disableAnimations ?? false) ||
        (media?.accessibleNavigation ?? false);
    final resolvedTint = tint ??
        (highContrast
            ? const Color(0xFFF8F8FA)
            : Colors.white.withValues(alpha: 0.72));
    final resolvedBorder = borderColor ??
        (highContrast
            ? const Color(0xFF636366)
            : Colors.white.withValues(alpha: 0.78));

    Widget surface = Container(
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        boxShadow: shadows ??
            [
              BoxShadow(
                color: const Color(0xFF1C1C1E)
                    .withValues(alpha: highContrast ? 0.18 : 0.12),
                blurRadius: highContrast ? 18 : 32,
                offset: const Offset(0, 12),
              ),
              BoxShadow(
                color: Colors.white.withValues(alpha: 0.55),
                blurRadius: 2,
                offset: const Offset(0, -1),
              ),
            ],
      ),
      child: ClipRRect(
        borderRadius: borderRadius,
        child: BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: highContrast ? 0 : blur,
            sigmaY: highContrast ? 0 : blur,
          ),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: resolvedTint,
              borderRadius: borderRadius,
              border: Border.all(color: resolvedBorder, width: 1),
              gradient: highContrast
                  ? null
                  : LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Colors.white.withValues(alpha: 0.32),
                        Colors.white.withValues(alpha: 0.08),
                      ],
                    ),
            ),
            child: Padding(padding: padding, child: child),
          ),
        ),
      ),
    );

    if (onTap != null) {
      surface = Semantics(
        button: true,
        label: semanticLabel,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            if (!reduceMotion) HapticFeedback.selectionClick();
            onTap!();
          },
          child: surface,
        ),
      );
    }

    return RepaintBoundary(child: surface);
  }
}
