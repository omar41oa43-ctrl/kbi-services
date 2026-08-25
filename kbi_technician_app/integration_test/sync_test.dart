import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:kbi_technician_app/main.dart' as app;

const _email = 'admin1@kbi.com';
const _password = '123q123q';

Future<void> _settle(WidgetTester tester, {int seconds = 5}) async {
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

  testWidgets('Full Online / Offline Toggle and Firestore Sync Test',
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
    final doc = await FirebaseFirestore.instance
        .collection('technicians')
        .doc(uid)
        .get();
    final isInitiallyOnline = doc.data()?['online'] == true ||
        doc.data()?['isOnline'] == true ||
        doc.data()?['available'] == true;
    debugPrint('1. INITIAL FIRESTORE: isInitiallyOnline=$isInitiallyOnline');

    debugPrint('=== INITIAL HOME SCREEN ===');
    debugPrint(_visibleText().join(' | '));

    final switchFinder = find.byType(Switch);
    expect(switchFinder, findsOneWidget,
        reason: 'Availability switch should be visible on dashboard');

    if (isInitiallyOnline) {
      // Toggle offline first
      debugPrint('>>> TOGGLING TO GO OFFLINE <<<');
      await tester.tap(switchFinder);
      await _settle(tester, seconds: 3);

      final goOfflineBtn = find.text('Go offline');
      if (goOfflineBtn.evaluate().isNotEmpty) {
        debugPrint('>>> CONFIRMING GO OFFLINE DIALOG <<<');
        await tester.tap(goOfflineBtn.last);
        await _settle(tester, seconds: 5);
      }

      final docOffline = await FirebaseFirestore.instance
          .collection('technicians')
          .doc(uid)
          .get();
      debugPrint(
          '2. FIRESTORE AFTER GOING OFFLINE: available=${docOffline.data()?['available']}, isOnline=${docOffline.data()?['isOnline']}');
      expect(docOffline.data()?['available'], false);

      // Now toggle back online
      debugPrint('>>> TOGGLING BACK TO GO ONLINE <<<');
      await tester.tap(switchFinder);
      await _settle(tester, seconds: 5);

      final docOnline = await FirebaseFirestore.instance
          .collection('technicians')
          .doc(uid)
          .get();
      debugPrint(
          '3. FIRESTORE AFTER GOING ONLINE: available=${docOnline.data()?['available']}, isOnline=${docOnline.data()?['isOnline']}, location=${docOnline.data()?['location']}');
      expect(docOnline.data()?['available'], true);
    } else {
      // Toggle online first
      debugPrint('>>> TOGGLING TO GO ONLINE <<<');
      await tester.tap(switchFinder);
      await _settle(tester, seconds: 5);

      final docOnline = await FirebaseFirestore.instance
          .collection('technicians')
          .doc(uid)
          .get();
      debugPrint(
          '2. FIRESTORE AFTER GOING ONLINE: available=${docOnline.data()?['available']}, isOnline=${docOnline.data()?['isOnline']}, location=${docOnline.data()?['location']}');
      expect(docOnline.data()?['available'], true);
    }

    debugPrint(
        '=== ALL SYNC & TOGGLE VERIFICATIONS COMPLETED SUCCESSFULLY ===');
  });
}
