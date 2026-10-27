import 'dart:ui' as ui;

import 'package:flutter/material.dart';

/// A full-bleed workshop atmosphere with a separately framed, unaltered portrait.
/// Keeping these layers independent avoids enlarging the face to fill tall phones.
class AuthPortraitBackground extends StatelessWidget {
  const AuthPortraitBackground({super.key, this.portraitKey});

  final Key? portraitKey;
  static const _photo = 'assets/images/technician-login-hero-dark-v4.png';
  static const _canvas = Color(0xFF020305);

  Widget _image({required BoxFit fit}) => Image.asset(
        _photo,
        fit: fit,
        alignment: Alignment.topCenter,
        filterQuality: FilterQuality.high,
        errorBuilder: (_, __, ___) => Image.asset(
          'assets/images/technician-login-bg-v2.png',
          fit: fit,
          alignment: Alignment.topCenter,
        ),
      );

  @override
  Widget build(BuildContext context) {
    final safeTop = MediaQuery.viewPaddingOf(context).top;
    return RepaintBoundary(
      child: LayoutBuilder(builder: (context, constraints) {
        final width = constraints.maxWidth.clamp(0.0, 600.0);
        final height = (width * 1.2).clamp(0.0, constraints.maxHeight * 0.64);
        return Stack(fit: StackFit.expand, children: [
          const ColoredBox(color: _canvas),
          // Aspect-fill reaches every edge. Soft focus and a dark tint keep
          // this environmental layer behind the sharp, correctly scaled face.
          Positioned.fill(
            child: ClipRect(
              child: Opacity(
                opacity: 0.30,
                child: ImageFiltered(
                  imageFilter: ui.ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                  child: _image(fit: BoxFit.cover),
                ),
              ),
            ),
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: Alignment(0.8, -0.5),
                radius: 1.1,
                colors: [Color(0x171ECBC7), Color(0x00020305)],
              ),
            ),
          ),
          Positioned(
            top: safeTop + 24,
            left: 0,
            right: 0,
            child: Align(
              alignment: Alignment.topCenter,
              child: SizedBox(
                key: portraitKey,
                width: width,
                height: height,
                child: ShaderMask(
                  blendMode: BlendMode.dstIn,
                  shaderCallback: (bounds) => const LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.white,
                      Colors.white,
                      Colors.transparent
                    ],
                    stops: [0.0, 0.06, 0.66, 1.0],
                  ).createShader(bounds),
                  child: _image(fit: BoxFit.contain),
                ),
              ),
            ),
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0x14020305),
                  Color(0x00020305),
                  Color(0xDE020305),
                  _canvas
                ],
                stops: [0.0, 0.36, 0.70, 1.0],
              ),
            ),
          ),
        ]);
      }),
    );
  }
}
