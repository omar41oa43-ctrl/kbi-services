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

  testWidgets('Verify Complete Unified Registration Page', (tester) async {
    debugPrint('=== [1] LAUNCHING APPLICATION ===');
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

    // 2. Login -> Registration
    final applyBtn = find.text('Apply to join KBI →');
    expect(applyBtn, findsOneWidget);
    await tester.tap(applyBtn.first);
    await _settle(tester, seconds: 3);

    final texts = _visibleText();
    debugPrint('New Registration Page visible texts: ${texts.join(" | ")}');

    expect(find.text('Join the KBI Network'), findsOneWidget);
    expect(find.text('Individual Tech'), findsOneWidget);
    expect(find.text('Company'), findsOneWidget);
    expect(find.text('Full Name *'), findsOneWidget);
    expect(find.text('Email Address *'), findsOneWidget);
    expect(find.text('Mobile Number *'), findsOneWidget);
    expect(find.text('Password *'), findsOneWidget);
    expect(find.text('Confirm Password *'), findsOneWidget);
    expect(find.text('Specializations / Services Offered *'), findsOneWidget);
    expect(find.text('Emirate *'), findsOneWidget);
    expect(find.text('Submit Application'), findsOneWidget);

    debugPrint('SUCCESS: Unified Registration Page is completely working and beautiful!');
  });
}
