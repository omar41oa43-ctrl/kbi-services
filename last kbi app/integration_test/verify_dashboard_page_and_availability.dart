import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:kbi_technician_app/main.dart' as app;

const _email = 'tech@kbi.test';
const _password = 'password123';

Future<void> _settle(WidgetTester tester, {int seconds = 4}) async {
  final deadline = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(deadline)) {
    await tester.pump(const Duration(milliseconds: 200));
  }
}

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Verify Dashboard Elements, Availability Pills & Actions',
      (tester) async {
    final originalOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = originalOnError;
    await _settle(tester, seconds: 5);

    // If on Welcome Screen, tap Continue to sign in
    final continueBtn = find.text('Continue to sign in');
    if (continueBtn.evaluate().isNotEmpty) {
      await tester.tap(continueBtn.first);
      await _settle(tester, seconds: 2);
    }

    // If on Login Screen
    final textFields = find.byType(TextField);
    if (textFields.evaluate().length >= 2) {
      debugPrint('[TEST] Entering credentials...');
      await tester.enterText(textFields.at(0), _email);
      await tester.pump(const Duration(milliseconds: 200));
      await tester.enterText(textFields.at(1), _password);
      await tester.pump(const Duration(milliseconds: 200));

      final signInButton = find.text('Sign in');
      if (signInButton.evaluate().isNotEmpty) {
        await tester.tap(signInButton.last);
        await _settle(tester, seconds: 6);
      }
    }

    final user = FirebaseAuth.instance.currentUser;
    expect(user, isNotNull, reason: 'Technician user should be authenticated');
    final uid = user!.uid;
    debugPrint('[TEST] Logged in successfully: $uid (${user.email})');

    // 1. Ensure approved state in Firestore for testing dashboard
    await FirebaseFirestore.instance.collection('technicians').doc(uid).set({
      'isApproved': true,
      'isActive': true,
      'subscriptionStatus': 'active',
      'full_name': 'Tech',
      'availability': 'available',
      'status': 'available',
      'isOnline': true,
      'online': true,
      'isAvailable': true,
      'available': true,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
    await _settle(tester, seconds: 3);

    // 2. Verify Availability Switcher Pills: Available, Busy, Offline
    final availablePill = find.text('Available');
    final busyPill = find.text('Busy');
    final offlinePill = find.text('Offline');

    expect(availablePill, findsWidgets, reason: 'Available pill should be visible');
    expect(busyPill, findsWidgets, reason: 'Busy pill should be visible');
    expect(offlinePill, findsWidgets, reason: 'Offline pill should be visible');

    // Test Tapping "Busy"
    debugPrint('[TEST] Testing Busy pill tap...');
    await tester.tap(busyPill.first);
    await _settle(tester, seconds: 3);

    var techDoc = await FirebaseFirestore.instance.collection('technicians').doc(uid).get();
    debugPrint('[TEST] Firestore after Busy tap: status=${techDoc.data()?['status']}, isOnline=${techDoc.data()?['isOnline']}');
    expect(techDoc.data()?['status'], 'busy');

    // Test Tapping "Offline"
    debugPrint('[TEST] Testing Offline pill tap...');
    await tester.tap(offlinePill.first);
    await _settle(tester, seconds: 3);

    techDoc = await FirebaseFirestore.instance.collection('technicians').doc(uid).get();
    debugPrint('[TEST] Firestore after Offline tap: status=${techDoc.data()?['status']}, isOnline=${techDoc.data()?['isOnline']}');
    expect(techDoc.data()?['status'], 'offline');
    expect(techDoc.data()?['isOnline'], false);

    // Test Tapping "Available"
    debugPrint('[TEST] Testing Available pill tap...');
    await tester.tap(availablePill.first);
    await _settle(tester, seconds: 3);

    techDoc = await FirebaseFirestore.instance.collection('technicians').doc(uid).get();
    debugPrint('[TEST] Firestore after Available tap: status=${techDoc.data()?['status']}, isOnline=${techDoc.data()?['isOnline']}');
    expect(techDoc.data()?['status'], 'available');
    expect(techDoc.data()?['isOnline'], true);

    // 3. Verify Stats Row items
    expect(find.text('Jobs Today'), findsWidgets);
    expect(find.text('Completed'), findsWidgets);
    expect(find.text('Earnings'), findsWidgets);

    // 4. Verify Quick Actions (Orders, Wallet, Profile)
    expect(find.text('Quick actions'), findsWidgets);
    expect(find.text('Orders'), findsWidgets);
    expect(find.text('Wallet'), findsWidgets);
    expect(find.text('Profile'), findsWidgets);

    // 5. If there are action buttons (Call, WhatsApp, Navigate)
    final callBtn = find.text('Call');
    final waBtn = find.text('WhatsApp');
    final navBtn = find.text('Navigate');
    if (callBtn.evaluate().isNotEmpty) {
      debugPrint('[TEST] Call button is present and ready');
    }
    if (waBtn.evaluate().isNotEmpty) {
      debugPrint('[TEST] WhatsApp button is present and ready');
    }
    if (navBtn.evaluate().isNotEmpty) {
      debugPrint('[TEST] Navigate button is present and ready');
    }

    // Capture screenshot to artifact directory
    await _settle(tester, seconds: 2);
    final bytes = await binding.takeScreenshot('dashboard_verified');
    final artifactFile = File(
      '/Users/it-team/.gemini/antigravity-ide/brain/55e167ea-1ac0-4dc1-b9dd-5c405d0cdecc/dashboard_verified.png',
    );
    await artifactFile.writeAsBytes(bytes);
    debugPrint('[TEST] Screenshot saved to: ${artifactFile.path}');
  });
}
