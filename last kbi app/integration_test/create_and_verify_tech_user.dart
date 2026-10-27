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

  testWidgets('Complete Technician User Creation, Review Gate & Admin Approval Lifecycle',
      (tester) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final adminEmail = 'admin_$timestamp@kbi.test';
    final techEmail = 'tech_$timestamp@kbi.test';
    const password = 'Test1234!';

    debugPrint('====================================================');
    debugPrint('=== [1] INITIALIZING APP & ADMIN SETUP           ===');
    debugPrint('====================================================');
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 5);

    // Create an Admin user for this test run
    debugPrint('Provisioning Admin account: $adminEmail...');
    final adminCred = await FirebaseAuth.instance.createUserWithEmailAndPassword(
      email: adminEmail,
      password: password,
    );
    final adminUid = adminCred.user!.uid;

    await FirebaseFirestore.instance.collection('users').doc(adminUid).set({
      'role': 'technician',
      'email': adminEmail,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    await FirebaseFirestore.instance.collection('users').doc(adminUid).update({
      'role': 'admin',
    });
    debugPrint('Admin account provisioned with UID: $adminUid');

    await FirebaseAuth.instance.signOut();
    await _settle(tester, seconds: 2);

    debugPrint('====================================================');
    debugPrint('=== [2] CREATING NEW TECHNICIAN: $techEmail ===');
    debugPrint('====================================================');
    final techCred = await FirebaseAuth.instance.createUserWithEmailAndPassword(
      email: techEmail,
      password: password,
    );
    final techUid = techCred.user!.uid;
    debugPrint('Technician created in Firebase Auth with UID: $techUid');

    // Create initial pending records
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
      'full_name': 'Sultan Al Qasimi',
      'phone': '+971508877665',
      'experience_main_skill': 'Smartphones & Tablets Repair',
      'skills': ['Screen Replacement', 'Battery Replacement', 'Water Damage'],
      'experience': '5 years',
      'emirate': 'Abu Dhabi',
      'area': 'Al Maryah Island',
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
        'full_name': 'Sultan Al Qasimi',
        'phone': '+971508877665',
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      },
    );
    await batch.commit();
    debugPrint('Technician records saved to Firestore with status: pending.');

    // Settle to let auth state update in the UI
    await _settle(tester, seconds: 4);

    debugPrint('====================================================');
    debugPrint('=== [3] VERIFYING APPROVAL PENDING GATE          ===');
    debugPrint('====================================================');
    debugPrint('Current screen elements: ${_visibleText().take(15).join(" | ")}');
    expect(find.byType(NavigationBar), findsNothing,
        reason: 'Pending technician must be held at the ApprovalPending gate');

    debugPrint('====================================================');
    debugPrint('=== [4] ADMIN APPROVAL IN FIRESTORE              ===');
    debugPrint('====================================================');
    // Admin signs in to approve
    await FirebaseAuth.instance.signInWithEmailAndPassword(
      email: adminEmail,
      password: password,
    );
    await _settle(tester, seconds: 2);

    await FirebaseFirestore.instance
        .collection('technicians')
        .doc(techUid)
        .update({
      'isApproved': true,
      'isActive': true,
      'subscriptionStatus': 'active',
      'status': 'approved',
    });
    debugPrint('Admin approved technician doc (isApproved: true, isActive: true, subscriptionStatus: active).');

    // Sign technician back in
    await FirebaseAuth.instance.signInWithEmailAndPassword(
      email: techEmail,
      password: password,
    );
    await _settle(tester, seconds: 5);

    debugPrint('====================================================');
    debugPrint('=== [5] VERIFYING HOMESCREEN & TAB NAVIGATION   ===');
    debugPrint('====================================================');
    expect(find.byType(NavigationBar), findsOneWidget,
        reason: 'Approved technician must be granted access to HomeScreen');
    debugPrint('HomeScreen loaded! Text: ${_visibleText().take(15).join(" | ")}');

    final navBarFinder = find.byType(NavigationBar);
    final navBar = tester.widget<NavigationBar>(navBarFinder.first);

    // Tab 1: Orders
    debugPrint('Navigating to Orders (Tab 1)...');
    navBar.onDestinationSelected?.call(1);
    await _settle(tester, seconds: 3);
    debugPrint('Orders Tab text: ${_visibleText().take(15).join(" | ")}');

    // Tab 2: Wallet
    debugPrint('Navigating to Wallet (Tab 2)...');
    navBar.onDestinationSelected?.call(2);
    await _settle(tester, seconds: 3);
    debugPrint('Wallet Tab text: ${_visibleText().take(15).join(" | ")}');

    // Tab 3: Notifications
    debugPrint('Navigating to Notifications (Tab 3)...');
    navBar.onDestinationSelected?.call(3);
    await _settle(tester, seconds: 3);
    debugPrint('Notifications Tab text: ${_visibleText().take(15).join(" | ")}');

    // Tab 4: Profile
    debugPrint('Navigating to Profile (Tab 4)...');
    navBar.onDestinationSelected?.call(4);
    await _settle(tester, seconds: 3);
    debugPrint('Profile Tab text: ${_visibleText().take(20).join(" | ")}');

    // Back to Dashboard
    debugPrint('Returning to Home (Tab 0)...');
    navBar.onDestinationSelected?.call(0);
    await _settle(tester, seconds: 2);

    debugPrint('====================================================');
    debugPrint('=== [SUCCESS] TECH USER CREATION TEST PASSED!    ===');
    debugPrint('====================================================');
  });
}
