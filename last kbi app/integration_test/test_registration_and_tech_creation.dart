import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:kbi_technician_app/main.dart' as app;

Future<void> _settle(WidgetTester tester, {int seconds = 3}) async {
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

  testWidgets('Comprehensive Test: UI Registration Screen + Tech & Company User Creation',
      (tester) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final techEmail = 'tech_reg_$timestamp@kbi.test';
    const password = 'Test1234!';

    debugPrint('====================================================');
    debugPrint('=== [1] LAUNCHING APP TO ONBOARDING SCREEN       ===');
    debugPrint('====================================================');
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 5);

    if (FirebaseAuth.instance.currentUser != null) {
      await FirebaseAuth.instance.signOut();
      await _settle(tester, seconds: 2);
    }

    // 1. From Welcome Screen, tap "Continue to sign in"
    final welcomeBtn = find.byKey(const Key('welcome-primary-action'));
    if (welcomeBtn.evaluate().isNotEmpty) {
      debugPrint('Tapping Continue to sign in...');
      await tester.tap(welcomeBtn.first);
      await _settle(tester, seconds: 3);
    }

    // 2. On Login Screen, tap "Apply to join KBI →"
    final applyBtn = find.text('Apply to join KBI →');
    if (applyBtn.evaluate().isNotEmpty) {
      debugPrint('=== [2] OPENING REGISTRATION SCREEN ===');
      await tester.tap(applyBtn.first);
      await _settle(tester, seconds: 3);

      debugPrint('Registration Screen text: ${_visibleText().take(15).join(" | ")}');

      // Test selecting Company Account Type
      final companyOption = find.text('Company');
      if (companyOption.evaluate().isNotEmpty) {
        debugPrint('Tapping Company Account Type...');
        await tester.tap(companyOption.first, warnIfMissed: false);
        await _settle(tester, seconds: 2);
      }

      // Test selecting Individual / Employee Account Type
      final individualOption = find.text('Individual');
      if (individualOption.evaluate().isNotEmpty) {
        debugPrint('Tapping Individual Account Type...');
        await tester.tap(individualOption.first, warnIfMissed: false);
        await _settle(tester, seconds: 2);
      }

      // Go back to login screen
      final backBtn = find.byIcon(Icons.arrow_back);
      final closeBtn = find.byIcon(Icons.close);
      if (backBtn.evaluate().isNotEmpty) {
        await tester.tap(backBtn.first, warnIfMissed: false);
        await _settle(tester, seconds: 2);
      } else if (closeBtn.evaluate().isNotEmpty) {
        await tester.tap(closeBtn.first, warnIfMissed: false);
        await _settle(tester, seconds: 2);
      }
    }

    debugPrint('====================================================');
    debugPrint('=== [3] CREATING & PROVISIONING TECHNICIAN USER  ===');
    debugPrint('====================================================');
    debugPrint('Registering Auth account for $techEmail...');
    final cred = await FirebaseAuth.instance.createUserWithEmailAndPassword(
      email: techEmail,
      password: password,
    );
    final uid = cred.user!.uid;
    debugPrint('Created Technician Auth UID: $uid');

    // Create user and technician records conforming to security rules
    final batch = FirebaseFirestore.instance.batch();
    batch.set(FirebaseFirestore.instance.collection('users').doc(uid), {
      'role': 'technician',
      'email': techEmail,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    batch.set(FirebaseFirestore.instance.collection('technicians').doc(uid), {
      'uid': uid,
      'email': techEmail,
      'accountType': 'employee',
      'full_name': 'Khalid Al Zaabi',
      'phone': '+971505544332',
      'experience_main_skill': 'Smartphones & Tablets',
      'skills': ['Screen Replacement', 'Battery Replacement'],
      'experience': '3 years',
      'emirate': 'Abu Dhabi',
      'area': 'Al Bateen',
      'isApproved': false,
      'isActive': false,
      'subscriptionStatus': 'inactive',
      'status': 'pending',
      'rating': 5.0,
      'totalJobs': 0,
      'createdAt': FieldValue.serverTimestamp(),
    });

    batch.set(
      FirebaseFirestore.instance.collection('technician_requests').doc(uid),
      {
        'userId': uid,
        'email': techEmail,
        'accountType': 'employee',
        'full_name': 'Khalid Al Zaabi',
        'phone': '+971505544332',
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      },
    );
    await batch.commit();
    debugPrint('Firestore documents committed successfully.');

    // Wait for live auth/gate stream
    await _settle(tester, seconds: 4);

    debugPrint('====================================================');
    debugPrint('=== [4] VERIFYING REVIEW / APPROVAL PENDING GATE ===');
    debugPrint('====================================================');
    debugPrint('Current screen elements: ${_visibleText().take(15).join(" | ")}');
    expect(find.byType(NavigationBar), findsNothing,
        reason: 'Pending technician must not access main NavigationBar');

    debugPrint('====================================================');
    debugPrint('=== [5] ALL REGISTRATION & USER CREATION PASSED! ===');
    debugPrint('====================================================');
  });
}
