import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:kbi_technician_app/main.dart' as app;

Future<void> _settle(WidgetTester tester, {int seconds = 4}) async {
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

  testWidgets('Complete Tech User Creation, Review Gate & Admin Approval Lifecycle',
      (tester) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final techEmail = 'new_tech_$timestamp@kbi.test';
    const techPassword = 'Password123!';
    const adminEmail = 'admin1@kbi.com';
    const adminPassword = '123q123q';

    debugPrint('====================================================');
    debugPrint('=== [STEP 1] INITIALIZE APP & CLEAR OLD SESSIONS ===');
    debugPrint('====================================================');
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 4);

    if (FirebaseAuth.instance.currentUser != null) {
      await FirebaseAuth.instance.signOut();
      await _settle(tester, seconds: 2);
    }

    debugPrint('====================================================');
    debugPrint('=== [STEP 2] NEW TECHNICIAN REGISTRATION FLOW    ===');
    debugPrint('====================================================');
    debugPrint('Registering Auth account: $techEmail');
    final techCred = await FirebaseAuth.instance.createUserWithEmailAndPassword(
      email: techEmail,
      password: techPassword,
    );
    final techUid = techCred.user!.uid;
    debugPrint('Generated Tech UID: $techUid');

    // Create initial user doc and pending technician doc per security rules
    final batch = FirebaseFirestore.instance.batch();
    batch.set(FirebaseFirestore.instance.collection('users').doc(techUid), {
      'role': 'technician',
      'email': techEmail,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    batch.set(FirebaseFirestore.instance.collection('technicians').doc(techUid), {
      'uid': techUid,
      'email': techEmail,
      'accountType': 'employee',
      'full_name': 'Zayed Al Mansoori',
      'phone': '+971501239988',
      'experience_main_skill': 'Smartphones & Tablets Repair',
      'skills': ['Screen Replacement', 'Battery Replacement'],
      'experience': '4 years',
      'emirate': 'Abu Dhabi',
      'area': 'Al Reem Island',
      'isApproved': false,
      'isActive': false,
      'subscriptionStatus': 'inactive',
      'status': 'pending',
      'rating': 5.0,
      'totalJobs': 0,
      'createdAt': FieldValue.serverTimestamp(),
    });

    batch.set(
      FirebaseFirestore.instance.collection('technician_requests').doc(techUid),
      {
        'userId': techUid,
        'email': techEmail,
        'accountType': 'employee',
        'full_name': 'Zayed Al Mansoori',
        'phone': '+971501239988',
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      },
    );
    await batch.commit();
    debugPrint('Pending tech records created in Firestore successfully.');

    debugPrint('====================================================');
    debugPrint('=== [STEP 3] VERIFY UNAPPROVED GATE IN APP       ===');
    debugPrint('====================================================');
    await app.main();
    await _settle(tester, seconds: 4);

    debugPrint('Screen text while pending review:');
    debugPrint(_visibleText().take(15).join(' | '));
    expect(find.byType(NavigationBar), findsNothing,
        reason: 'Pending technician must NOT have access to main NavigationBar');

    debugPrint('====================================================');
    debugPrint('=== [STEP 4] ADMIN APPROVAL SIMULATION           ===');
    debugPrint('====================================================');
    debugPrint('Signing in as Admin to approve technician...');
    await FirebaseAuth.instance.signOut();
    await _settle(tester, seconds: 2);

    await FirebaseAuth.instance.signInWithEmailAndPassword(
      email: adminEmail,
      password: adminPassword,
    );
    debugPrint('Admin authenticated: ${FirebaseAuth.instance.currentUser?.uid}');

    // Admin updates technician doc to approved & active
    await FirebaseFirestore.instance
        .collection('technicians')
        .doc(techUid)
        .update({
      'isApproved': true,
      'isActive': true,
      'subscriptionStatus': 'active',
      'status': 'approved',
    });

    await FirebaseFirestore.instance
        .collection('technician_requests')
        .doc(techUid)
        .update({
      'status': 'approved',
    });
    debugPrint('Admin approved technician doc in Firestore.');

    debugPrint('====================================================');
    debugPrint('=== [STEP 5] APPROVED TECH LOGS IN & VERIFIES UI ===');
    debugPrint('====================================================');
    await FirebaseAuth.instance.signOut();
    await _settle(tester, seconds: 2);

    await app.main();
    await _settle(tester, seconds: 4);

    final welcomeBtn = find.byKey(const Key('welcome-primary-action'));
    if (welcomeBtn.evaluate().isNotEmpty) {
      await tester.tap(welcomeBtn.first);
      await _settle(tester, seconds: 3);
    }

    final fields = find.byType(TextField);
    if (fields.evaluate().length >= 2) {
      debugPrint('Logging in with approved tech credentials...');
      await tester.enterText(fields.at(0), techEmail);
      await tester.pump(const Duration(milliseconds: 200));
      await tester.enterText(fields.at(1), techPassword);
      await tester.pump(const Duration(milliseconds: 200));

      final submitBtn = find.text('Submit');
      final signInBtn = find.text('Sign in');
      if (submitBtn.evaluate().isNotEmpty) {
        await tester.tap(submitBtn.first);
      } else if (signInBtn.evaluate().isNotEmpty) {
        await tester.tap(signInBtn.first);
      }
      await _settle(tester, seconds: 7);
    }

    debugPrint('Verifying full HomeScreen access...');
    expect(find.byType(NavigationBar), findsOneWidget,
        reason: 'Approved tech must have active NavigationBar');
    debugPrint('HomeScreen loaded! Text: ${_visibleText().take(15).join(" | ")}');

    // Test NavigationBar tabs
    final navBarFinder = find.byType(NavigationBar);
    final navBar = tester.widget<NavigationBar>(navBarFinder.first);

    // Profile Tab
    debugPrint('Navigating to Profile Tab (Tab 4)...');
    navBar.onDestinationSelected?.call(4);
    await _settle(tester, seconds: 4);
    debugPrint('Profile screen content: ${_visibleText().take(20).join(" | ")}');

    // Orders Tab
    debugPrint('Navigating to Orders Tab (Tab 1)...');
    navBar.onDestinationSelected?.call(1);
    await _settle(tester, seconds: 3);

    // Back to Dashboard
    debugPrint('Returning to Dashboard (Tab 0)...');
    navBar.onDestinationSelected?.call(0);
    await _settle(tester, seconds: 2);

    debugPrint('====================================================');
    debugPrint('=== [SUCCESS] TECH USER CREATION TEST PASSED!     ===');
    debugPrint('====================================================');
  });
}
