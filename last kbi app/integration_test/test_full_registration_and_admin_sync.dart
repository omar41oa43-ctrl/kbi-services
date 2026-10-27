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

  testWidgets(
      'Full End-to-End Workflow: Individual Tech & Company Registration, Firestore Sync & Admin Approval',
      (tester) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final indEmail = 'tech_live_$timestamp@kbi.test';
    final compEmail = 'comp_live_$timestamp@kbi.test';
    const testPassword = 'Password123!';

    debugPrint('================================================================');
    debugPrint('=== [PART 1] TESTING INDIVIDUAL TECHNICIAN UI REGISTRATION   ===');
    debugPrint('================================================================');

    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 4);

    if (FirebaseAuth.instance.currentUser != null) {
      await FirebaseAuth.instance.signOut();
      await _settle(tester, seconds: 2);
    }

    // 1. Welcome -> Login
    final welcomeBtn = find.byKey(const Key('welcome-primary-action'));
    if (welcomeBtn.evaluate().isNotEmpty) {
      debugPrint('[1.1] Navigating from Welcome to Login...');
      await tester.tap(welcomeBtn.first);
      await _settle(tester, seconds: 3);
    }

    // 2. Login -> Register
    final applyBtn = find.text('Apply to join KBI →');
    expect(applyBtn, findsOneWidget);
    debugPrint('[1.2] Opening Registration Screen...');
    await tester.tap(applyBtn.first);
    await _settle(tester, seconds: 3);

    // 3. Fill Individual Tech Form
    debugPrint('[1.3] Filling Individual Tech details: $indEmail');
    final nameField = find.widgetWithText(TextField, 'Full Name *');
    final emailField = find.widgetWithText(TextField, 'Email Address *');
    final phoneField = find.widgetWithText(TextField, 'Mobile Number *');
    final passField = find.widgetWithText(TextField, 'Password *');
    final confirmField = find.widgetWithText(TextField, 'Confirm Password *');

    await tester.enterText(nameField, 'Rashid Al Nuaimi');
    await tester.enterText(emailField, indEmail);
    await tester.enterText(phoneField, '+971501112233');
    await tester.enterText(passField, testPassword);
    await tester.enterText(confirmField, testPassword);
    await _settle(tester, seconds: 2);

    // Agree to terms
    final termsTile = find.byType(CheckboxListTile);
    expect(termsTile, findsOneWidget);
    await tester.ensureVisible(termsTile.first);
    await tester.tap(termsTile.first);
    await _settle(tester, seconds: 1);

    // Scroll to submit button and tap
    debugPrint('[1.4] Submitting Individual Tech Application...');
    final submitBtn = find.widgetWithText(ElevatedButton, 'Submit Application');
    await tester.ensureVisible(submitBtn.first);
    await tester.tap(submitBtn.first);
    await _settle(tester, seconds: 5);

    // Assert Success Screen
    expect(find.text('Application Submitted!'), findsOneWidget);
    debugPrint('[1.5] Individual Application Submitted successfully!');

    // Verify Firestore Record Sync for Individual Tech
    final user = FirebaseAuth.instance.currentUser;
    expect(user, isNotNull);
    final indUid = user!.uid;
    debugPrint('[1.6] Verified Auth UID created: $indUid');

    final techDoc = await FirebaseFirestore.instance.collection('technicians').doc(indUid).get();
    expect(techDoc.exists, isTrue);
    expect(techDoc.data()!['accountType'], 'employee');
    expect(techDoc.data()!['status'], 'pending');
    expect(techDoc.data()!['isApproved'], isFalse);
    expect(techDoc.data()!['full_name'], 'Rashid Al Nuaimi');
    debugPrint('[1.7] Verified Firestore technicians doc synced: ${techDoc.data()}');

    final reqDoc = await FirebaseFirestore.instance.collection('technician_requests').doc(indUid).get();
    expect(reqDoc.exists, isTrue);
    expect(reqDoc.data()!['status'], 'pending');
    debugPrint('[1.8] Verified Firestore technician_requests doc synced for Admin approval.');

    // Return to Login & Sign Out
    final returnBtn = find.widgetWithText(ElevatedButton, 'Return to Sign In');
    await tester.tap(returnBtn.first);
    await _settle(tester, seconds: 3);

    await FirebaseAuth.instance.signOut();
    await _settle(tester, seconds: 2);

    debugPrint('================================================================');
    debugPrint('=== [PART 2] TESTING COMPANY REGISTRATION UI WORKFLOW        ===');
    debugPrint('================================================================');

    // If on Welcome screen, continue to login
    final welcomeBtn2 = find.byKey(const Key('welcome-primary-action'));
    if (welcomeBtn2.evaluate().isNotEmpty) {
      await tester.tap(welcomeBtn2.first);
      await _settle(tester, seconds: 3);
    }

    // 1. Open Registration again
    final applyBtn2 = find.text('Apply to join KBI →');
    expect(applyBtn2, findsOneWidget);
    await tester.tap(applyBtn2.first);
    await _settle(tester, seconds: 3);

    // 2. Select Company Tab
    debugPrint('[2.1] Switching to Company account type...');
    final companyToggle = find.text('Company');
    expect(companyToggle, findsOneWidget);
    await tester.tap(companyToggle.first);
    await _settle(tester, seconds: 2);

    // 3. Fill Company Form
    debugPrint('[2.2] Filling Company details: $compEmail');
    final compNameField = find.widgetWithText(TextField, 'Company Name *');
    final compEmailField = find.widgetWithText(TextField, 'Company Email *');
    final compPhoneField = find.widgetWithText(TextField, 'Company Phone *');
    final compOwnerField = find.widgetWithText(TextField, 'Manager / Owner Name *');
    final compLicenseField = find.widgetWithText(TextField, 'Trade License Number *');
    final compPassField = find.widgetWithText(TextField, 'Password *');
    final compConfirmField = find.widgetWithText(TextField, 'Confirm Password *');

    await tester.enterText(compNameField, 'Prime Tech Maintenance LLC');
    await tester.enterText(compEmailField, compEmail);
    await tester.enterText(compPhoneField, '+97143334455');
    await tester.enterText(compOwnerField, 'Tariq Mansoor');
    await tester.enterText(compLicenseField, 'TL-998877');
    await tester.ensureVisible(compPassField.first);
    await tester.enterText(compPassField, testPassword);
    await tester.ensureVisible(compConfirmField.first);
    await tester.enterText(compConfirmField, testPassword);
    await _settle(tester, seconds: 2);

    // Agree to terms
    final termsTile2 = find.byType(CheckboxListTile);
    expect(termsTile2, findsOneWidget);
    await tester.ensureVisible(termsTile2.first);
    await tester.tap(termsTile2.first);
    await _settle(tester, seconds: 1);

    // Scroll to submit button and tap
    debugPrint('[2.3] Submitting Company Application...');
    final submitBtn2 = find.widgetWithText(ElevatedButton, 'Submit Application');
    await tester.ensureVisible(submitBtn2.first);
    await tester.tap(submitBtn2.first);
    await _settle(tester, seconds: 5);

    debugPrint('Visible texts after company submit: ${_visibleText().join(" | ")}');

    // Assert Success Screen
    expect(find.text('Application Submitted!'), findsOneWidget);
    debugPrint('[2.4] Company Application Submitted successfully!');

    // Verify Firestore Record Sync for Company
    final compUser = FirebaseAuth.instance.currentUser;
    expect(compUser, isNotNull);
    final compUid = compUser!.uid;
    debugPrint('[2.5] Verified Company Auth UID created: $compUid');

    final compTechDoc = await FirebaseFirestore.instance.collection('technicians').doc(compUid).get();
    expect(compTechDoc.exists, isTrue);
    expect(compTechDoc.data()!['accountType'], 'company');
    expect(compTechDoc.data()!['status'], 'pending');
    expect(compTechDoc.data()!['isApproved'], isFalse);
    expect(compTechDoc.data()!['company_name'], 'Prime Tech Maintenance LLC');
    expect(compTechDoc.data()!['trade_license_number'], 'TL-998877');
    expect(compTechDoc.data()!['owner_name'], 'Tariq Mansoor');
    debugPrint('[2.6] Verified Firestore company technicians doc synced: ${compTechDoc.data()}');

    final compReqDoc = await FirebaseFirestore.instance.collection('technician_requests').doc(compUid).get();
    expect(compReqDoc.exists, isTrue);
    expect(compReqDoc.data()!['accountType'], 'company');
    expect(compReqDoc.data()!['status'], 'pending');
    debugPrint('[2.7] Verified Firestore company technician_requests doc synced for Admin approval.');

    debugPrint('================================================================');
    debugPrint('=== ALL WORKFLOWS (INDIVIDUAL & COMPANY) VERIFIED & SYNCED!  ===');
    debugPrint('================================================================');
  });
}
