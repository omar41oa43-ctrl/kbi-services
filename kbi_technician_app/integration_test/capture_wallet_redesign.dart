import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:kbi_technician_app/main.dart' as app;

const _email = 'tech@kbi.test';
const _password = 'Test1234!';
const _artifactDir =
    '/Users/it-team/.gemini/antigravity-ide/brain/83a65a6e-86c2-433f-b4d4-32abef623c24/.tempmediaStorage';

Future<void> _settle(WidgetTester tester, {int seconds = 4}) async {
  final deadline = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(deadline)) {
    await tester.pump(const Duration(milliseconds: 250));
  }
}

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Capture Wallet Redesign Preview', (tester) async {
    debugPrint('=== STEP 1: LAUNCHING APP ===');
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 5);

    // Welcome Screen handler if present
    final welcomeBtn = find.byKey(const Key('welcome-primary-action'));
    if (welcomeBtn.evaluate().isNotEmpty) {
      debugPrint('=== STEP 1.5: TAPPING WELCOME BUTTON ===');
      await tester.tap(welcomeBtn.first);
      await _settle(tester, seconds: 3);
    }

    // Login if fields are present
    final textFields = find.byType(TextField);
    if (textFields.evaluate().length >= 2) {
      debugPrint('=== STEP 2: LOGGING IN AS $_email ===');
      await tester.enterText(textFields.at(0), _email);
      await tester.pump(const Duration(milliseconds: 300));
      await tester.enterText(textFields.at(1), _password);
      await tester.pump(const Duration(milliseconds: 300));

      final signInBtn = find.text('Sign in');
      final filledBtn = find.byType(FilledButton);
      final elevatedBtn = find.byType(ElevatedButton);

      if (signInBtn.evaluate().isNotEmpty) {
        await tester.tap(signInBtn.first);
      } else if (filledBtn.evaluate().isNotEmpty) {
        await tester.tap(filledBtn.last);
      } else if (elevatedBtn.evaluate().isNotEmpty) {
        await tester.tap(elevatedBtn.first);
      }
      await _settle(tester, seconds: 7);
    }

    // Tap Wallet Destination / Icon
    debugPrint('=== STEP 3: TAPPING WALLET TAB ===');
    final walletIcon = find.text('Wallet');
    if (walletIcon.evaluate().isNotEmpty) {
      await tester.tap(walletIcon.first);
      await _settle(tester, seconds: 4);
    }

    final walletBytes = await binding.takeScreenshot('wallet_redesign_hd');
    await File('$_artifactDir/wallet_redesign_hd.png').writeAsBytes(walletBytes);
    debugPrint('=== WALLET SCREENSHOT SAVED ===');
  });
}
