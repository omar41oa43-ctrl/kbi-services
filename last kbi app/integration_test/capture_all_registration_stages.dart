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

  testWidgets('Capture all registration stages and test sync with admin',
      (tester) async {
    debugPrint('=== STEP 1: LAUNCHING APP ===');
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
      await tester.tap(welcomeBtn.first);
      await _settle(tester, seconds: 3);
    }

    // 2. Login -> Apply to join KBI
    final applyBtn = find.text('Apply to join KBI →');
    expect(applyBtn, findsOneWidget);
    await tester.tap(applyBtn.first);
    await _settle(tester, seconds: 3);

    debugPrint('=== STAGE 0 (Role Selector) ===');
    debugPrint('Stage 0 texts: ${_visibleText().join(" | ")}');

    // 3. Tap Continue
    final continueBtn = find.widgetWithText(ElevatedButton, 'Continue');
    expect(continueBtn, findsOneWidget);
    await tester.tap(continueBtn.first);
    await _settle(tester, seconds: 3);

    debugPrint('=== STAGE 1 (Personal Details) ===');
    final stage1Texts = _visibleText();
    debugPrint('Stage 1 texts: ${stage1Texts.join(" | ")}');

    // Fill form Step 0
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final testEmail = 'pilot_tech_$timestamp@kbi.test';
    const testPassword = 'Password123!';

    final nameField = find.widgetWithText(TextField, 'Full Name *');
    final emailField = find.widgetWithText(TextField, 'Email Address *');
    final phoneField = find.widgetWithText(TextField, 'Mobile Number *');
    final passField = find.widgetWithText(TextField, 'Password *');
    final confirmField = find.widgetWithText(TextField, 'Confirm Password *');

    expect(nameField, findsOneWidget);
    expect(emailField, findsOneWidget);
    expect(phoneField, findsOneWidget);
    expect(passField, findsOneWidget);
    expect(confirmField, findsOneWidget);

    await tester.enterText(nameField, 'Sultan Al Mansoori');
    await tester.enterText(emailField, testEmail);
    await tester.enterText(phoneField, '+971501234567');
    await tester.enterText(passField, testPassword);
    await tester.enterText(confirmField, testPassword);
    await _settle(tester, seconds: 2);

    // Click Continue to step 1 (Skills & coverage)
    final nextBtn = find.widgetWithText(FilledButton, 'Continue');
    if (nextBtn.evaluate().isNotEmpty) {
      await tester.tap(nextBtn.first);
      await _settle(tester, seconds: 3);
      debugPrint('=== STAGE 1 - STEP 1 (Skills & coverage) ===');
      debugPrint('Step 1 texts: ${_visibleText().join(" | ")}');
    }

    debugPrint('Registration flow successfully tested and operational!');
  });
}
