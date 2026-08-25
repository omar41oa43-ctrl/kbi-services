double? readFirstMeaningfulAmount(
  Map<String, dynamic> data,
  List<String> keys,
) {
  double? zeroValue;
  for (final key in keys) {
    final value = data[key];
    final amount = switch (value) {
      num number => number.toDouble(),
      String text => double.tryParse(text.replaceAll(',', '').trim()),
      _ => null,
    };
    if (amount == null) continue;
    if (amount > 0) return amount;
    zeroValue ??= amount;
  }
  return zeroValue;
}

double? calculateJobPayout(
  Map<String, dynamic> data,
  double platformFeePercent,
) {
  final directShare = readFirstMeaningfulAmount(
    data,
    const ['technicianAmount', 'technicianShare'],
  );
  if (directShare != null) return directShare;

  final price = readFirstMeaningfulAmount(data, const [
    'finalPrice',
    'finalAmount',
    'totalAmount',
    'serviceAmount',
    'servicePrice',
    'quotedPrice',
    'approvedAmount',
    'estimatedPrice',
    'price',
    'amount',
  ]);
  if (price == null || price <= 0) return null;
  return platformFeePercent > 0
      ? price * (1 - platformFeePercent / 100)
      : price;
}
