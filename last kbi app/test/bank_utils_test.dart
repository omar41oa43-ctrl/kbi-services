import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/utils/bank_utils.dart';

void main() {
  test('normalizes and validates a UAE IBAN', () {
    const iban = 'ae07 0331 2345 6789 0123 456';

    expect(normalizeIban(iban), 'AE070331234567890123456');
    expect(isValidUaeIban(iban), isTrue);
    expect(formatIban(iban), 'AE07 0331 2345 6789 0123 456');
  });

  test('rejects incomplete or non-UAE IBAN values', () {
    expect(isValidUaeIban('AE12'), isFalse);
    expect(isValidUaeIban('GB82 WEST 1234 5698 7654 32'), isFalse);
  });

  test('masks the middle of a saved IBAN', () {
    expect(
      maskIban('AE070331234567890123456'),
      'AE07 •••• •••• •••• 3456',
    );
  });
}
