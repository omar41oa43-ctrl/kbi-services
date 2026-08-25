import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/utils/wallet_utils.dart';

void main() {
  group('completed job payout', () {
    test('uses serviceAmount after a zero placeholder price', () {
      final payout = calculateJobPayout({
        'finalPrice': 0,
        'serviceAmount': 150,
      }, 0);

      expect(payout, 150);
    });

    test('subtracts the configured platform fee', () {
      expect(calculateJobPayout({'serviceAmount': 200}, 20), 160);
    });

    test('uses the recorded technician share when available', () {
      final payout = calculateJobPayout({
        'technicianShare': 135,
        'serviceAmount': 150,
      }, 20);

      expect(payout, 135);
    });

    test('returns null when the order has not been priced', () {
      expect(calculateJobPayout({'finalPrice': 0}, 0), isNull);
      expect(calculateJobPayout({}, 0), isNull);
    });
  });
}
