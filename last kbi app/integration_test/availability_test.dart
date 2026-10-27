import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:kbi_technician_app/main.dart' as app;

const _email = 'admin1@kbi.com';
const _password = '123q123q';

Future<void> _settle(WidgetTester tester, {int seconds = 6}) async {
  final deadline = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(deadline)) {
    await tester.pump(const Duration(milliseconds: 250));
  }
}

List<String> _visibleText() => find
    .byType(Text)
    .evaluate()
    .map((e) => (e.widget as Text).data)
    .whereType<String>()
    .where((s) => s.trim().isNotEmpty)
    .toList();

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Test Online / Offline Switch and Firestore sync',
      (tester) async {
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 5);

    // If login needed
    final fields = find.byType(TextField);
    if (fields.evaluate().length >= 2) {
      debugPrint('SIGNING IN...');
      await tester.enterText(fields.at(0), _email);
      await tester.pump(const Duration(milliseconds: 300));
      await tester.enterText(fields.at(1), _password);
      await tester.pump(const Duration(milliseconds: 300));

      final signInBtn = find.text('Sign in');
      if (signInBtn.evaluate().isNotEmpty) {
        await tester.tap(signInBtn.last);
        await _settle(tester, seconds: 8);
      }
    }

    final uid = FirebaseAuth.instance.currentUser?.uid;
    debugPrint('LOGGED IN UID: $uid');

    // Check initial Firestore availability
    if (uid != null) {
      final doc = await FirebaseFirestore.instance
          .collection('technicians')
          .doc(uid)
          .get();
      debugPrint(
          'INITIAL FIRESTORE AVAILABILITY: ${doc.data()?['availability']}, online: ${doc.data()?['online']}');
    }

    debugPrint('=== INITIAL HOME SCREEN ===');
    debugPrint(_visibleText().join(' | '));

    final switchFinder = find.byType(Switch);
    expect(switchFinder, findsOneWidget,
        reason: 'Availability switch should be visible on dashboard');

    // Tap switch to go Online
    debugPrint('--- TOGGLING SWITCH TO GO ONLINE ---');
    await tester.tap(switchFinder);
    await _settle(tester, seconds: 6);

    debugPrint('=== AFTER GOING ONLINE (UI) ===');
    debugPrint(_visibleText().join(' | '));

    if (uid != null) {
      final docOnline = await FirebaseFirestore.instance
          .collection('technicians')
          .doc(uid)
          .get();
      debugPrint(
          'FIRESTORE AFTER ONLINE: availability=${docOnline.data()?['availability']}, online=${docOnline.data()?['online']}, location=${docOnline.data()?['location']}');
    }

    // Tap switch to go Offline
    debugPrint('--- TOGGLING SWITCH TO GO OFFLINE ---');
    final switchOfflineFinder = find.byType(Switch);
    if (switchOfflineFinder.evaluate().isNotEmpty) {
      await tester.tap(switchOfflineFinder.last);
      await _settle(tester, seconds: 3);

      final goOfflineBtn = find.text('Go offline');
      if (goOfflineBtn.evaluate().isNotEmpty) {
        await tester.tap(goOfflineBtn.last);
        await _settle(tester, seconds: 5);
      }
    }

    debugPrint('=== AFTER GOING OFFLINE (UI) ===');
    debugPrint(_visibleText().join(' | '));

    if (uid != null) {
      final docOffline = await FirebaseFirestore.instance
          .collection('technicians')
          .doc(uid)
          .get();
      debugPrint(
          'FIRESTORE AFTER OFFLINE: availability=${docOffline.data()?['availability']}, online=${docOffline.data()?['online']}');
    }

    debugPrint('=== AVAILABILITY TEST COMPLETE ===');
  });
}
