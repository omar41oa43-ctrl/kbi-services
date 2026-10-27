import 'dart:convert';

import 'package:flutter/material.dart';

/// Keeps the decoded image provider alive while unrelated parent state changes.
///
/// Profile photos can be stored as data URLs when Firebase Storage is
/// unavailable. Decoding that data on every Firestore or scroll-driven rebuild
/// creates a new [MemoryImage], which briefly replaces the rendered frame.
class StableProfileImage extends StatefulWidget {
  const StableProfileImage({
    super.key,
    required this.source,
    required this.fallback,
    required this.width,
    required this.height,
    this.fit = BoxFit.cover,
    this.semanticsLabel,
  });

  final String? source;
  final Widget fallback;
  final double width;
  final double height;
  final BoxFit fit;
  final String? semanticsLabel;

  @override
  State<StableProfileImage> createState() => _StableProfileImageState();
}

class _StableProfileImageState extends State<StableProfileImage> {
  String _normalizedSource = '';
  ImageProvider? _provider;

  @override
  void initState() {
    super.initState();
    _updateProvider();
  }

  @override
  void didUpdateWidget(covariant StableProfileImage oldWidget) {
    super.didUpdateWidget(oldWidget);
    final nextSource = widget.source?.trim() ?? '';
    if (nextSource != _normalizedSource) _updateProvider();
  }

  void _updateProvider() {
    _normalizedSource = widget.source?.trim() ?? '';
    _provider = _imageProviderFor(_normalizedSource);
  }

  ImageProvider? _imageProviderFor(String source) {
    if (source.isEmpty) return null;
    if (source.startsWith('data:image')) {
      try {
        final commaIndex = source.indexOf(',');
        if (commaIndex < 0) return null;
        return MemoryImage(base64Decode(source.substring(commaIndex + 1)));
      } catch (_) {
        return null;
      }
    }
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return NetworkImage(source);
    }
    if (source.startsWith('assets/')) return AssetImage(source);
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final provider = _provider;
    return RepaintBoundary(
      child: SizedBox(
        width: widget.width,
        height: widget.height,
        child: provider == null
            ? widget.fallback
            : Image(
                image: provider,
                width: widget.width,
                height: widget.height,
                fit: widget.fit,
                gaplessPlayback: true,
                filterQuality: FilterQuality.medium,
                semanticLabel: widget.semanticsLabel,
                errorBuilder: (_, __, ___) => widget.fallback,
              ),
      ),
    );
  }
}
