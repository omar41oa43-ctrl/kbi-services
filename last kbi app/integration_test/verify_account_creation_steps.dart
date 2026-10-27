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
      'Verify Account Creation Stage 0 to Stage 1 Navigation and Form Render',
      (tester) async {
    debugPrint('=== [1] LAUNCHING APP ===');
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 4);

    if (FirebaseAuth.instance.currentUser != null) {
      await FirebaseAuth.instance.signOut();
      await _settle(tester, seconds: 2);
    }

    // 1. Welcome Screen -> Login Screen
    final welcomeBtn = find.byKey(const Key('welcome-primary-action'));
    if (welcomeBtn.evaluate().isNotEmpty) {
      debugPrint('Tapping Continue to sign in...');
      await tester.tap(welcomeBtn.first);
      await _settle(tester, seconds: 3);
    }

    // 2. Login Screen -> Registration Screen
    final applyBtn = find.text('Apply to join KBI →');
    expect(applyBtn, findsOneWidget);
    debugPrint('Tapping Apply to join KBI...');
    await tester.tap(applyBtn.first);
    await _settle(tester, seconds: 3);

    debugPrint('Stage 0 visible text: ${_visibleText().join(" | ")}');
    expect(find.text('Join the KBI network'), findsOneWidget);
    expect(find.text('How will you work?'), findsOneWidget);

    // 3. Tap Continue on Stage 0
    final continueBtn = find.widgetWithText(ElevatedButton, 'Continue');
    expect(continueBtn, findsOneWidget);
    debugPrint('Tapping Continue button on Stage 0...');
    await tester.tap(continueBtn.first);
    await _settle(tester, seconds: 3);

    // 4. Assert Stage 1 form fields are rendered!
    final visible = _visibleText();
    debugPrint('Stage 1 visible text: ${visible.join(" | ")}');

    expect(find.text('Employee application'), findsOneWidget);
    expect(find.text('Personal details'), findsOneWidget);
    expect(find.text('Full Name *'), findsOneWidget);
    expect(find.text('Email Address *'), findsOneWidget);
    expect(find.text('Mobile Number *'), findsOneWidget);
    expect(find.text('Password *'), findsOneWidget);
    expect(find.text('Confirm Password *'), findsOneWidget);

    debugPrint(
        'SUCCESS: All registration Step 1 form fields rendered perfectly!');
  });
}
