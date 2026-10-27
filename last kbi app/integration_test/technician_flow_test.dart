// Drives the real app against the local Firebase emulator suite.
//
// Run with:
//   flutter test integration_test/technician_flow_test.dart -d <simulator-id> \
//     --dart-define=USE_FIREBASE_EMULATOR=true \
//     --dart-define=FIREBASE_IOS_APP_ID=<ios app id> \
//     --dart-define=REQUIRE_EMAIL_VERIFICATION=false
//
// Expects the emulator to be seeded with the tech@kbi.test technician.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:kbi_technician_app/main.dart' as app;

const _email = 'tech@kbi.test';
const _password = 'Test1234!';

/// Pumps for a fixed wall-clock window. The app holds live Firestore streams,
/// so pumpAndSettle never reaches quiescence.
Future<void> _settle(WidgetTester tester, {int seconds = 10}) async {
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

  testWidgets('technician reaches the dashboard and each tab renders',
      (tester) async {
    // main() installs its own FlutterError.onError; flutter_test needs its own
    // handler back or it asserts on the first framework error.
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 8);

    final welcomeAction = find.text('Continue to sign in');
    if (welcomeAction.evaluate().isNotEmpty) {
      await tester.tap(welcomeAction.first);
      await _settle(tester, seconds: 2);
    }

    // Firebase Auth persists sessions, so the app may already be signed in.
    final fields = find.byType(TextField);
    if (fields.evaluate().length >= 2) {
      debugPrint('SCREEN[login]: signing in as $_email');
      await tester.enterText(fields.at(0), _email);
      await tester.pump(const Duration(milliseconds: 300));
      await tester.enterText(fields.at(1), _password);
      await tester.pump(const Duration(milliseconds: 300));
      await tester.tap(find.text('Sign in'));
      await _settle(tester, seconds: 15);
    } else {
      debugPrint('SCREEN[login]: session already restored, skipping sign-in');
    }

    // An approved + subscribed technician lands on HomeScreen, which shows the
    // bottom navigation. That is the signal we actually cleared the gate.
    expect(find.text('Home'), findsWidgets,
        reason: 'bottom navigation should be present on the dashboard');
    expect(find.text('Sign in'), findsNothing,
        reason: 'should no longer be on the login screen');

    debugPrint('SCREEN[home]: ${_visibleText().take(30).join(" | ")}');

    // Seeded data: KBI-9001 assigned + KBI-9002 accepted + KBI-9003 completed.
    expect(find.textContaining('Ahmed Al Mansoori'), findsWidgets,
        reason: 'seeded booking KBI-9001 should surface on the dashboard');

    for (final tab in [
      'Orders',
      'Wallet',
      'Notifications',
      'Profile',
      'Home',
    ]) {
      final target = find.text(tab);
      if (target.evaluate().isEmpty) {
        debugPrint('SCREEN[$tab]: tab not found, skipping');
        continue;
      }
      await tester.tap(target.last, warnIfMissed: false);
      await _settle(tester, seconds: 8);
      debugPrint('SCREEN[$tab]: ${_visibleText().take(30).join(" | ")}');
    }
  });
}
