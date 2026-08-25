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

  testWidgets(
      'Create and verify Individual Tech User and Company Tech User workflows',
      (tester) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final techEmail = 'tech_$timestamp@kbi.test';
    final techPassword = 'Password123!';
    final companyEmail = 'company_$timestamp@kbi.test';
    final companyPassword = 'Password123!';

    debugPrint('====================================================');
    debugPrint('=== [PART 1] CREATING & TESTING INDIVIDUAL TECH ===');
    debugPrint('====================================================');

    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 5);

    // 1. Sign out any existing session first
    if (FirebaseAuth.instance.currentUser != null) {
      await FirebaseAuth.instance.signOut();
      await _settle(tester, seconds: 3);
    }

    // 2. Programmatically create Individual Tech in Firebase Auth & Firestore
    debugPrint('Creating Firebase Auth account for $techEmail...');
    final techCred = await FirebaseAuth.instance.createUserWithEmailAndPassword(
      email: techEmail,
      password: techPassword,
    );
    final techUid = techCred.user!.uid;
    debugPrint('Individual Tech UID: $techUid');

    final batch1 = FirebaseFirestore.instance.batch();
    batch1.set(FirebaseFirestore.instance.collection('users').doc(techUid), {
      'role': 'technician',
      'email': techEmail,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    batch1.set(
        FirebaseFirestore.instance.collection('technicians').doc(techUid), {
      'uid': techUid,
      'email': techEmail,
      'accountType': 'employee',
      'full_name': 'Rashid Al Nuaimi',
      'phone': '+971501234567',
      'experience_main_skill': 'iPhone Screen & Battery, iPad Repair',
      'skills': ['iPhone Screen & Battery', 'iPad Repair', 'MacBook Diagnostic'],
      'experience': '3-5 years',
      'emirate': 'Abu Dhabi',
      'area': 'Al Reem Island',
      'isApproved': false,
      'isActive': false,
      'subscriptionStatus': 'inactive',
      'status': 'pending',
      'createdAt': FieldValue.serverTimestamp(),
    });
    batch1.set(
        FirebaseFirestore.instance
            .collection('technician_requests')
            .doc(techUid),
        {
          'userId': techUid,
          'email': techEmail,
          'accountType': 'employee',
          'full_name': 'Rashid Al Nuaimi',
          'phone': '+971501234567',
          'status': 'pending',
          'createdAt': FieldValue.serverTimestamp(),
        });
    await batch1.commit();
    debugPrint('Individual Tech Firestore records provisioned successfully.');

    // 3. Restart app and verify ApprovalPendingScreen gate for new tech
    await app.main();
    await _settle(tester, seconds: 5);

    // If on Welcome screen, tap continue
    final welcomeBtn1 = find.byKey(const Key('welcome-primary-action'));
    if (welcomeBtn1.evaluate().isNotEmpty) {
      await tester.tap(welcomeBtn1.first);
      await _settle(tester, seconds: 3);
    }

    final textFields1 = find.byType(TextField);
    if (textFields1.evaluate().length >= 2) {
      debugPrint('Logging in as new Individual Tech...');
      await tester.enterText(textFields1.at(0), techEmail);
      await tester.pump(const Duration(milliseconds: 250));
      await tester.enterText(textFields1.at(1), techPassword);
      await tester.pump(const Duration(milliseconds: 250));
      final submitBtn = find.text('Submit');
      final signInBtn = find.text('Sign in');
      if (submitBtn.evaluate().isNotEmpty) {
        await tester.tap(submitBtn.first);
      } else if (signInBtn.evaluate().isNotEmpty) {
        await tester.tap(signInBtn.first);
      }
      await _settle(tester, seconds: 6);
    }

    debugPrint('Visible text on screen (expecting Approval Pending):');
    debugPrint(_visibleText().take(15).join(' | '));
    expect(
      find.byType(NavigationBar),
      findsNothing,
      reason: 'Unapproved tech must NOT have access to main NavigationBar',
    );

    // 4. Approve & Activate Individual Tech in Firestore (simulating Admin action)
    debugPrint('Simulating Admin Approval for Individual Tech...');
    await FirebaseFirestore.instance
        .collection('technicians')
        .doc(techUid)
        .update({
      'isApproved': true,
      'isActive': true,
      'subscriptionStatus': 'active',
      'status': 'approved',
    });
    await _settle(tester, seconds: 5);

    // 5. Verify Individual Tech now has full access to HomeScreen
    expect(
      find.byType(NavigationBar),
      findsOneWidget,
      reason: 'Approved tech must immediately gain access to HomeScreen',
    );
    debugPrint('Individual Tech successfully reached HomeScreen!');
    debugPrint('Visible tabs: ${_visibleText().take(15).join(" | ")}');

    // ====================================================
    // === [PART 2] CREATING & TESTING COMPANY USER ===
    // ====================================================
    debugPrint('====================================================');
    debugPrint('=== [PART 2] CREATING & TESTING COMPANY USER ===');
    debugPrint('====================================================');

    // 1. Sign out individual tech
    await FirebaseAuth.instance.signOut();
    await _settle(tester, seconds: 4);

    // 2. Programmatically create Company User in Firebase Auth & Firestore
    debugPrint('Creating Firebase Auth account for $companyEmail...');
    final compCred =
        await FirebaseAuth.instance.createUserWithEmailAndPassword(
      email: companyEmail,
      password: companyPassword,
    );
    final compUid = compCred.user!.uid;
    debugPrint('Company User UID: $compUid');

    final batch2 = FirebaseFirestore.instance.batch();
    batch2.set(FirebaseFirestore.instance.collection('users').doc(compUid), {
      'role': 'technician',
      'email': companyEmail,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    batch2.set(
        FirebaseFirestore.instance.collection('technicians').doc(compUid), {
      'uid': compUid,
      'email': companyEmail,
      'accountType': 'company',
      'company_name': 'Speedy Tech Solutions LLC',
      'phone': '+971529876543',
      'trade_license_number': 'CN-2894710',
      'owner_name': 'Mansoor Al Ketbi',
      'number_of_technicians': 8,
      'skills': [
        'Motherboard Micro-soldering',
        'iPhone & Android Screen Replacement',
        'Liquid Damage Recovery'
      ],
      'emirate': 'Abu Dhabi',
      'areas_covered': 'Abu Dhabi Island, Khalifa City, Mohammed Bin Zayed',
      'isApproved': false,
      'isActive': false,
      'subscriptionStatus': 'inactive',
      'status': 'pending',
      'createdAt': FieldValue.serverTimestamp(),
    });
    batch2.set(
        FirebaseFirestore.instance
            .collection('technician_requests')
            .doc(compUid),
        {
          'userId': compUid,
          'email': companyEmail,
          'accountType': 'company',
          'company_name': 'Speedy Tech Solutions LLC',
          'phone': '+971529876543',
          'trade_license_number': 'CN-2894710',
          'status': 'pending',
          'createdAt': FieldValue.serverTimestamp(),
        });
    await batch2.commit();
    debugPrint('Company User Firestore records provisioned successfully.');

    // 3. Restart and log in as Company User
    await app.main();
    await _settle(tester, seconds: 5);

    final welcomeBtn2 = find.byKey(const Key('welcome-primary-action'));
    if (welcomeBtn2.evaluate().isNotEmpty) {
      await tester.tap(welcomeBtn2.first);
      await _settle(tester, seconds: 3);
    }

    final textFields2 = find.byType(TextField);
    if (textFields2.evaluate().length >= 2) {
      debugPrint('Logging in as new Company User...');
      await tester.enterText(textFields2.at(0), companyEmail);
      await tester.pump(const Duration(milliseconds: 250));
      await tester.enterText(textFields2.at(1), companyPassword);
      await tester.pump(const Duration(milliseconds: 250));
      final submitBtn = find.text('Submit');
      final signInBtn = find.text('Sign in');
      if (submitBtn.evaluate().isNotEmpty) {
        await tester.tap(submitBtn.first);
      } else if (signInBtn.evaluate().isNotEmpty) {
        await tester.tap(signInBtn.first);
      }
      await _settle(tester, seconds: 6);
    }

    debugPrint('Company User before approval:');
    debugPrint(_visibleText().take(15).join(' | '));
    expect(
      find.byType(NavigationBar),
      findsNothing,
      reason: 'Unapproved company user must be held at ApprovalPendingScreen',
    );

    // 4. Approve & Activate Company User in Firestore
    debugPrint('Simulating Admin Approval for Company User...');
    await FirebaseFirestore.instance
        .collection('technicians')
        .doc(compUid)
        .update({
      'isApproved': true,
      'isActive': true,
      'subscriptionStatus': 'active',
      'status': 'approved',
    });
    await _settle(tester, seconds: 5);

    // 5. Verify Company User enters HomeScreen and can switch tabs
    expect(
      find.byType(NavigationBar),
      findsOneWidget,
      reason: 'Approved company user must have access to HomeScreen',
    );
    debugPrint('Company User successfully reached HomeScreen!');

    final navBarFinder = find.byType(NavigationBar);
    final navBar = tester.widget<NavigationBar>(navBarFinder.first);

    // Switch to Profile Tab (Tab 4) to verify company profile view
    debugPrint('Switching to Profile Tab for Company User...');
    navBar.onDestinationSelected?.call(4);
    await _settle(tester, seconds: 4);

    debugPrint('Company User Profile View: ${_visibleText().take(20).join(" | ")}');

    // Switch back to Home (Tab 0)
    navBar.onDestinationSelected?.call(0);
    await _settle(tester, seconds: 3);

    debugPrint('====================================================');
    debugPrint('=== BOTH TECH & COMPANY USERS TESTED & VERIFIED! ===');
    debugPrint('====================================================');
  });
}
