import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/models/service_request.dart';

void main() {
  group('ServiceRequestModel data mapping', () {
    test('uses the customer-facing order number before the document ID', () {
      final reference = ServiceRequestModel.resolveOrderReference(
        {
          'orderNumber': 'KBI-7394',
          'orderId': 'internal-order-id',
        },
        'firestore-document-id',
      );

      expect(reference, 'KBI-7394');
    });

    test('uses admin diagnostic notes instead of repeating device and issue',
        () {
      final description = ServiceRequestModel.resolveDescription(
        {
          'notes': 'Check Face ID after the display repair.',
        },
        device: 'iPhone 15 Pro Max',
        issue: 'Screen Replacement',
      );

      expect(description, 'Check Face ID after the display repair.');
    });

    test('falls back to a device and issue summary when notes are absent', () {
      final description = ServiceRequestModel.resolveDescription(
        const {},
        device: 'iPhone 15 Pro Max',
        issue: 'Screen Replacement',
      );

      expect(description, 'iPhone 15 Pro Max - Screen Replacement');
    });
  });
}
