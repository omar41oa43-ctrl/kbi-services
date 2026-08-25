import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:kbi_technician_app/main.dart' as app;

Future<void> _settle(WidgetTester tester, {int seconds = 2}) async {
  final deadline = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(deadline)) {
    await tester.pump(const Duration(milliseconds: 200));
  }
}

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Capture Welcome & Login Screens with Perfect Half-Body Portrait',
      (tester) async {
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 3);

    if (FirebaseAuth.instance.currentUser != null) {
      await FirebaseAuth.instance.signOut();
      await _settle(tester, seconds: 2);
    }

    // 1. If on login view, go back to Welcome
    final backBtn = find.byIcon(Icons.arrow_back_rounded);
    if (backBtn.evaluate().isNotEmpty) {
      await tester.tap(backBtn.first);
      await _settle(tester, seconds: 2);
    }

    // Take screenshot of Welcome screen
    final bytesWelcome = await binding.takeScreenshot('welcome_halfbody');
    final welcomeFile = File(
        '/Users/it-team/.gemini/antigravity-ide/brain/83a65a6e-86c2-433f-b4d4-32abef623c24/sim_halfbody_welcome_perfect_saved.png');
    await welcomeFile.writeAsBytes(bytesWelcome);
    debugPrint('Saved welcome screenshot: ${bytesWelcome.length} bytes');

    // 2. Tap Get Started to go to Login screen
    final getStarted = find.text('Get Started');
    if (getStarted.evaluate().isNotEmpty) {
      await tester.tap(getStarted.first);
      await _settle(tester, seconds: 2);
    }

    // Take screenshot of Login screen
    final bytesLogin = await binding.takeScreenshot('login_halfbody');
    final loginFile = File(
        '/Users/it-team/.gemini/antigravity-ide/brain/83a65a6e-86c2-433f-b4d4-32abef623c24/sim_halfbody_login_perfect_saved.png');
    await loginFile.writeAsBytes(bytesLogin);
    debugPrint('Saved login screenshot: ${bytesLogin.length} bytes');
  });
}
