import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/utils/job_utils.dart';

void main() {
  group('job status normalization', () {
    test('normalizes case, whitespace, and underscore separators', () {
      expect(normalizeJobStatus(' In_Progress '), 'in progress');
      expect(normalizeJobStatus('COMPLETED'), 'completed');
      expect(normalizeJobStatus(null), '');
    });
  });

  group('order references', () {
    test('keeps new numeric references short and padded', () {
      expect(
        compactOrderReference({'orderNumber': 'KBI-17'}, documentId: 'doc'),
        'KBI-000017',
      );
    });

    test('shortens legacy UUID-like references for display', () {
      expect(
        compactOrderReference(
          {'orderId': 'KBI-55E3FB2A77EF6A6A'},
          documentId: 'doc',
        ),
        'KBI-EF6A6A',
      );
    });

    test('deduplicates matching references across collections', () {
      final booking = jobIdentityKey(
        {'bookingId': 'KBI-000017'},
        documentId: 'booking-doc',
      );
      final order = jobIdentityKey(
        {'orderNumber': '#kbi_000017'},
        documentId: 'order-doc',
      );
      expect(booking, order);
    });
  });

  test('localizes technician statuses and next actions', () {
    expect(
      localizedJobStatusLabel('in_progress', isArabic: true),
      'جارٍ العمل',
    );
    expect(
      localizedJobNextActionTitle('accepted', isArabic: true),
      'بدء الرحلة',
    );
  });

  test('Home prioritizes new assignments before active work', () {
    expect(jobHomePriority('Assigned'), 0);
    expect(jobHomePriority('pending_acceptance'), 0);
    expect(jobHomePriority('On The Way'), 1);
    expect(jobHomePriority('In Progress'), 1);
    expect(jobHomePriority('Completed'), 3);
  });

  group('job date filters', () {
    test('reads Firestore timestamps', () {
      final value = DateTime(2026, 8, 10, 9, 30);
      expect(jobDate({'scheduledAt': Timestamp.fromDate(value)}), value);
    });

    test('matches local calendar days', () {
      expect(
        isSameLocalDay(
          DateTime(2026, 8, 10, 23, 59),
          DateTime(2026, 8, 10, 1),
        ),
        isTrue,
      );
      expect(
        isSameLocalDay(
          DateTime(2026, 8, 11),
          DateTime(2026, 8, 10),
        ),
        isFalse,
      );
    });

    test('uses Monday through Sunday as the current week', () {
      final reference = DateTime(2026, 8, 12); // Wednesday
      expect(isInCurrentWeek(DateTime(2026, 8, 10), reference), isTrue);
      expect(isInCurrentWeek(DateTime(2026, 8, 16), reference), isTrue);
      expect(isInCurrentWeek(DateTime(2026, 8, 17), reference), isFalse);
    });
  });

  test('sorts job priorities consistently', () {
    expect(jobPriorityRank('critical'), greaterThan(jobPriorityRank('high')));
    expect(jobPriorityRank('high'), greaterThan(jobPriorityRank('medium')));
    expect(jobPriorityRank('medium'), greaterThan(jobPriorityRank('low')));
  });
}
