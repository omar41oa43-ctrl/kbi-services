String normalizeIban(String value) =>
    value.replaceAll(RegExp(r'\s+'), '').toUpperCase();

bool isValidUaeIban(String value) =>
    RegExp(r'^AE\d{21}$').hasMatch(normalizeIban(value));

String formatIban(String value) {
  final normalized = normalizeIban(value);
  final groups = <String>[];
  for (var index = 0; index < normalized.length; index += 4) {
    final end = (index + 4).clamp(0, normalized.length);
    groups.add(normalized.substring(index, end));
  }
  return groups.join(' ');
}

String maskIban(String value) {
  final normalized = normalizeIban(value);
  if (normalized.length < 8) return normalized;
  return '${normalized.substring(0, 4)} •••• •••• •••• '
      '${normalized.substring(normalized.length - 4)}';
}
