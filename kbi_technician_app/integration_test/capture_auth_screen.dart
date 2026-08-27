import 'dart:io';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:kbi_technician_app/main.dart' as app;

const _artifactDir =
    '/Users/it-team/.gemini/antigravity-ide/brain/83a65a6e-86c2-433f-b4d4-32abef623c24/.tempmediaStorage';

Future<void> _settle(WidgetTester tester, {int seconds = 3}) async {
  final deadline = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(deadline)) {
    await tester.pump(const Duration(milliseconds: 250));
  }
}

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Sign out and capture Auth Screen', (tester) async {
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 3);

    // Ensure signed out to land on AuthScreen
    await FirebaseAuth.instance.signOut();
    await _settle(tester, seconds: 3);

    // If on Welcome screen, tap Continue to sign in
    final continueFinder = find.text('Continue to sign in');
    if (continueFinder.evaluate().isNotEmpty) {
      await tester.tap(continueFinder);
      await _settle(tester, seconds: 2);
    }

    final authBytes = await binding.takeScreenshot('auth_screen_preview_hd');
    await File('$_artifactDir/auth_screen_preview_hd.png').writeAsBytes(authBytes);
    debugPrint('=== AUTH SCREEN PREVIEW HD SAVED ===');
  });
}
