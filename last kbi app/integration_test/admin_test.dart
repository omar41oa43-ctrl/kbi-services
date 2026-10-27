import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:kbi_technician_app/main.dart' as app;

const _email = 'admin1@kbi.com';
const _password = '123q123q';

Future<void> _settle(WidgetTester tester, {int seconds = 8}) async {
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

  testWidgets('Test admin1 login and all technician app functions',
      (tester) async {
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 6);

    debugPrint('=== INITIAL APP SCREEN TEXT ===');
    debugPrint(_visibleText().join(' | '));

    final fields = find.byType(TextField);
    if (fields.evaluate().length >= 2) {
      debugPrint('SIGNING IN WITH: $_email');
      await tester.enterText(fields.at(0), _email);
      await tester.pump(const Duration(milliseconds: 300));
      await tester.enterText(fields.at(1), _password);
      await tester.pump(const Duration(milliseconds: 300));

      // Tap sign in
      final signInBtn = find.text('Sign in');
      if (signInBtn.evaluate().isNotEmpty) {
        await tester.tap(signInBtn.last);
        await _settle(tester, seconds: 12);
      }
    }

    debugPrint('=== POST-LOGIN SCREEN TEXT ===');
    debugPrint(_visibleText().join(' | '));

    // Test Navigation to all tabs
    final tabs = ['Jobs', 'Wallet', 'Alerts', 'Profile', 'Home'];
    for (final tab in tabs) {
      final tabFinder = find.text(tab);
      if (tabFinder.evaluate().isNotEmpty) {
        debugPrint('--- SWITCHING TO TAB: $tab ---');
        await tester.tap(tabFinder.last, warnIfMissed: false);
        await _settle(tester, seconds: 5);
        debugPrint(
            'TAB [$tab] CONTENT: ${_visibleText().take(25).join(" | ")}');
      } else {
        debugPrint('TAB [$tab] NOT FOUND IN CURRENT UI');
      }
    }

    debugPrint('=== TEST COMPLETED ===');
  });
}
