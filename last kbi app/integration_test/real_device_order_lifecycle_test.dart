import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:kbi_technician_app/firebase_options.dart';
import 'package:kbi_technician_app/src/models/service_request.dart';
import 'package:kbi_technician_app/src/screens/job_details_screen.dart';
import 'package:qr_flutter/qr_flutter.dart';

const _customToken = String.fromEnvironment('TEST_CUSTOM_TOKEN');
const _orderId = String.fromEnvironment('TEST_ORDER_ID');

Future<void> _settle(WidgetTester tester, {int seconds = 3}) async {
  final end = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 200));
  }
}

Future<void> _tapAction(WidgetTester tester, String label) async {
  final action = find.text(label);
  expect(action, findsOneWidget, reason: 'Expected lifecycle action: $label');
  await tester.tap(action);
  await _settle(tester, seconds: 3);
  expect(find.textContaining('Unauthorized'), findsNothing);
  expect(find.textContaining('Failed to update status'), findsNothing);
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('real device completes order and creates verified rating QR',
      (tester) async {
    expect(_customToken, isNotEmpty);
    expect(_orderId, isNotEmpty);

    if (Firebase.apps.isEmpty) {
      try {
        await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform,
        );
      } on FirebaseException catch (error) {
        if (error.code != 'duplicate-app') rethrow;
      }
    }
    await FirebaseAuth.instance.signInWithCustomToken(_customToken);

    final job = ServiceRequestModel(
      id: _orderId,
      type: 'Mobile Phone Repair',
      description: 'Automated real-device lifecycle verification',
      status: 'Assigned',
      offers: const [],
      assignedTo: [FirebaseAuth.instance.currentUser!.uid],
      technicianId: FirebaseAuth.instance.currentUser!.uid,
      lat: 24.4539,
      lng: 54.3773,
      address: 'KBI automated test location, Abu Dhabi',
      orderId: 'KBI-E2E-DEVICE',
      customerName: 'KBI Automated Test',
      customerPhone: '+971500000000',
      serviceName: 'Mobile Phone Repair',
      deviceName: 'Test Device',
      totalAmount: 100,
      collectionName: 'orders',
    );

    await tester.pumpWidget(
      MaterialApp(home: JobDetailsScreen(job: job)),
    );
    await _settle(tester, seconds: 2);

    await _tapAction(tester, 'Accept order');
    await tester.tap(find.text('Accept'));
    await _settle(tester, seconds: 4);
    expect(find.textContaining('Unauthorized'), findsNothing);

    await _tapAction(tester, 'Start Trip (On The Way)');
    await _tapAction(tester, 'Mark as Arrived');
    await _tapAction(tester, 'Start Working (In Progress)');
    await _tapAction(tester, 'Complete Job');
    final completeAnyway = find.text('Complete anyway');
    final complete = find.text('Complete');
    expect(completeAnyway.evaluate().isNotEmpty || complete.evaluate().isNotEmpty,
        isTrue);
    await tester.tap(completeAnyway.evaluate().isNotEmpty
        ? completeAnyway
        : complete.last);
    await _settle(tester, seconds: 5);

    final completed = await FirebaseFirestore.instance
        .collection('orders')
        .doc(_orderId)
        .get();
    expect(completed.data()?['status'], 'Completed');
    expect(completed.data()?['checklist'], isA<Map>());

    await tester.tap(find.text('Closeout'));
    await _settle(tester, seconds: 1);
    final qrButton = find.text('Display Rating QR Code');
    await tester.scrollUntilVisible(
      qrButton,
      500,
      scrollable: find.byType(Scrollable).last,
    );
    await tester.tap(qrButton);
    await _settle(tester, seconds: 4);

    expect(find.byType(QrImageView), findsOneWidget);
    await tester.tap(find.text('Copy Link'));
    await tester.pumpAndSettle();
    final clipboardData = await Clipboard.getData(Clipboard.kTextPlain);
    final ratingUrl = clipboardData?.text ?? '';
    expect(ratingUrl, startsWith('https://kbi.services/rate?'));
    expect(ratingUrl, contains('order=${Uri.encodeComponent(_orderId)}'));
    expect(ratingUrl, contains('sig='));
    debugPrint('VERIFIED_RATING_URL=$ratingUrl');

    await FirebaseAuth.instance.signOut();
  });
}
