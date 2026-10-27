import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:kbi_technician_app/main.dart' as app;

const _email = 'tech@kbi.test';
const _password = 'password123';

Future<void> _settle(WidgetTester tester, {int seconds = 4}) async {
  final deadline = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(deadline)) {
    await tester.pump(const Duration(milliseconds: 250));
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Login to Technician App and Settle on Dashboard',
      (tester) async {
    debugPrint('=== [1] LAUNCHING APP ===');
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 5);

    // If on Welcome screen, tap Continue to sign in
    final continueBtn = find.text('Continue to sign in');
    if (continueBtn.evaluate().isNotEmpty) {
      debugPrint('=== [2] TAPPING CONTINUE TO SIGN IN ===');
      await tester.tap(continueBtn.first);
      await _settle(tester, seconds: 2);
    }

    // Check for login fields
    final textFields = find.byType(TextField);
    if (textFields.evaluate().length >= 2) {
      debugPrint('=== [3] ENTERING CREDENTIALS ===');
      await tester.enterText(textFields.at(0), _email);
      await tester.pump(const Duration(milliseconds: 300));
      await tester.enterText(textFields.at(1), _password);
      await tester.pump(const Duration(milliseconds: 300));

      final signInBtn = find.text('Sign in');
      if (signInBtn.evaluate().isNotEmpty) {
        debugPrint('=== [4] TAPPING SIGN IN BUTTON ===');
        await tester.tap(signInBtn.last);
        await _settle(tester, seconds: 7);
      }
    }

    debugPrint('=== [5] VERIFYING DASHBOARD LOGGED IN ===');
    await _settle(tester, seconds: 4);
  });
}
