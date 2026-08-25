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
      'Full End-to-End Test: Create Tech User & Company User, Approve & Verify App Experience',
      (tester) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final techEmail = 'new_tech_$timestamp@kbi.test';
    final techPassword = 'Password123!';
    final companyEmail = 'new_company_$timestamp@kbi.test';
    final companyPassword = 'Password123!';

    debugPrint('================================================================');
    debugPrint('=== [PHASE 1] CREATING & TESTING INDIVIDUAL TECHNICIAN USER ===');
    debugPrint('================================================================');

    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 4);

    // Ensure cleanly signed out
    if (FirebaseAuth.instance.currentUser != null) {
      await FirebaseAuth.instance.signOut();
      await _settle(tester, seconds: 2);
    }

    // Step 1: Create Individual Technician in Firebase Auth & Firestore
    debugPrint('[1.1] Registering Auth user: $techEmail');
    final techCred = await FirebaseAuth.instance.createUserWithEmailAndPassword(
      email: techEmail,
      password: techPassword,
    );
    final techUid = techCred.user!.uid;
    debugPrint('[1.2] Individual Tech UID created: $techUid');

    final batch1 = FirebaseFirestore.instance.batch();
    batch1.set(FirebaseFirestore.instance.collection('users').doc(techUid), {
      'role': 'technician',
      'email': techEmail,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    final techData = {
      'uid': techUid,
      'email': techEmail,
      'accountType': 'employee',
      'full_name': 'Hamad Al Dhaheri',
      'phone': '+971509988776',
      'experience_main_skill': 'Smartphones & Tablets Repair',
      'skills': ['iPhone Screen Replacement', 'Battery Replacement', 'iPad Screen'],
      'experience': '5+ years',
      'emirate': 'Abu Dhabi',
      'area': 'Al Khalidiyah',
      'isApproved': false,
      'isActive': false,
      'subscriptionStatus': 'inactive',
      'status': 'pending',
      'rating': 5.0,
      'totalJobs': 0,
      'createdAt': FieldValue.serverTimestamp(),
    };

    batch1.set(
      FirebaseFirestore.instance.collection('technicians').doc(techUid),
      techData,
    );

    batch1.set(
      FirebaseFirestore.instance.collection('technician_requests').doc(techUid),
      {
        'userId': techUid,
        'email': techEmail,
        'accountType': 'employee',
        'full_name': 'Hamad Al Dhaheri',
        'phone': '+971509988776',
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      },
    );
    await batch1.commit();
    debugPrint('[1.3] Firestore records provisioned: users, technicians, technician_requests.');

    // Step 2: Test unapproved gate in the application
    await app.main();
    await _settle(tester, seconds: 4);

    debugPrint('[1.4] Checking unapproved gate...');
    expect(
      find.byType(NavigationBar),
      findsNothing,
      reason: 'Pending technician must not access main Dashboard yet',
    );
    debugPrint('Unapproved screen text: ${_visibleText().take(10).join(" | ")}');

    // Step 3: Approve & Activate Individual Tech (simulating Admin action)
    debugPrint('[1.5] Approving and activating Individual Technician...');
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

    // Step 4: Verify full access to HomeScreen and Tabs
    expect(
      find.byType(NavigationBar),
      findsOneWidget,
      reason: 'Approved technician must immediately reach HomeScreen',
    );
    debugPrint('[1.6] Individual Technician successfully unlocked HomeScreen!');

    final navBarFinder = find.byType(NavigationBar);
    final navBar = tester.widget<NavigationBar>(navBarFinder.first);

    // Test switching tabs for Individual Tech
    debugPrint('[1.7] Testing Tab Navigation: Orders (Tab 1)...');
    navBar.onDestinationSelected?.call(1);
    await _settle(tester, seconds: 3);

    debugPrint('[1.8] Testing Tab Navigation: Wallet (Tab 2)...');
    navBar.onDestinationSelected?.call(2);
    await _settle(tester, seconds: 3);

    debugPrint('[1.9] Testing Tab Navigation: Profile (Tab 4)...');
    navBar.onDestinationSelected?.call(4);
    await _settle(tester, seconds: 3);
    debugPrint('Profile screen content: ${_visibleText().take(20).join(" | ")}');

    debugPrint('================================================================');
    debugPrint('=== [PHASE 2] CREATING & TESTING COMPANY TECHNICIAN USER ===');
    debugPrint('================================================================');

    // Step 1: Sign out current user
    await FirebaseAuth.instance.signOut();
    await _settle(tester, seconds: 3);

    // Step 2: Create Company User in Firebase Auth & Firestore
    debugPrint('[2.1] Registering Company Auth user: $companyEmail');
    final compCred = await FirebaseAuth.instance.createUserWithEmailAndPassword(
      email: companyEmail,
      password: companyPassword,
    );
    final compUid = compCred.user!.uid;
    debugPrint('[2.2] Company User UID created: $compUid');

    final batch2 = FirebaseFirestore.instance.batch();
    batch2.set(FirebaseFirestore.instance.collection('users').doc(compUid), {
      'role': 'technician',
      'email': companyEmail,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    final companyData = {
      'uid': compUid,
      'email': companyEmail,
      'accountType': 'company',
      'company_name': 'Apex Fix Maintenance Solutions LLC',
      'phone': '+971544332211',
      'trade_license_number': 'CN-9823411',
      'owner_name': 'Saeed Al Mazrouei',
      'number_of_technicians': 12,
      'skills': [
        'Motherboard Repair',
        'Screen Replacement',
        'Hardware Diagnostics',
        'Data Recovery'
      ],
      'emirate': 'Abu Dhabi',
      'areas_covered': 'All Abu Dhabi & Al Ain',
      'isApproved': false,
      'isActive': false,
      'subscriptionStatus': 'inactive',
      'status': 'pending',
      'rating': 5.0,
      'totalJobs': 0,
      'createdAt': FieldValue.serverTimestamp(),
    };

    batch2.set(
      FirebaseFirestore.instance.collection('technicians').doc(compUid),
      companyData,
    );

    batch2.set(
      FirebaseFirestore.instance.collection('technician_requests').doc(compUid),
      {
        'userId': compUid,
        'email': companyEmail,
        'accountType': 'company',
        'company_name': 'Apex Fix Maintenance Solutions LLC',
        'phone': '+971544332211',
        'trade_license_number': 'CN-9823411',
        'owner_name': 'Saeed Al Mazrouei',
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      },
    );
    await batch2.commit();
    debugPrint('[2.3] Company Firestore records provisioned.');

    // Step 3: Approve & Activate Company User
    debugPrint('[2.4] Approving & Activating Company User in Firestore...');
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

    // Step 4: Re-render app to verify Company User experience
    await app.main();
    await _settle(tester, seconds: 5);

    final welcomeBtnComp = find.byKey(const Key('welcome-primary-action'));
    if (welcomeBtnComp.evaluate().isNotEmpty) {
      await tester.tap(welcomeBtnComp.first);
      await _settle(tester, seconds: 3);
    }

    final compFields = find.byType(TextField);
    if (compFields.evaluate().length >= 2) {
      debugPrint('[2.5] Logging in as Company User...');
      await tester.enterText(compFields.at(0), companyEmail);
      await tester.pump(const Duration(milliseconds: 250));
      await tester.enterText(compFields.at(1), companyPassword);
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

    expect(
      find.byType(NavigationBar),
      findsOneWidget,
      reason: 'Approved company user must have access to HomeScreen',
    );
    debugPrint('[2.6] Company User successfully unlocked HomeScreen!');

    final compNavBarFinder = find.byType(NavigationBar);
    final compNavBar = tester.widget<NavigationBar>(compNavBarFinder.first);

    // Check Company Profile Tab
    debugPrint('[2.7] Checking Company Profile Tab...');
    compNavBar.onDestinationSelected?.call(4);
    await _settle(tester, seconds: 4);
    debugPrint('Company profile view content: ${_visibleText().take(20).join(" | ")}');

    // Return to Home Tab
    compNavBar.onDestinationSelected?.call(0);
    await _settle(tester, seconds: 3);

    debugPrint('================================================================');
    debugPrint('=== [SUCCESS] BOTH TECH & COMPANY USERS CREATED & TESTED! ===');
    debugPrint('================================================================');
  });
}
