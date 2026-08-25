import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:kbi_technician_app/main.dart' as app;

const _email = 'tech@kbi.test';
const _password = 'Test1234!';
const _artifactDir =
    '/Users/it-team/.gemini/antigravity-ide/brain/55e167ea-1ac0-4dc1-b9dd-5c405d0cdecc';

Future<void> _settle(WidgetTester tester, {int seconds = 4}) async {
  final deadline = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(deadline)) {
    await tester.pump(const Duration(milliseconds: 250));
  }
}

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Comprehensive Tab & Feature Verification with Artifact Screenshots',
      (tester) async {
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

      final submitBtn = find.text('Submit');
      final signInBtn = find.text('Sign in');
      final filledBtn = find.byType(FilledButton);
      final elevatedBtn = find.byType(ElevatedButton);

      if (submitBtn.evaluate().isNotEmpty) {
        await tester.tap(submitBtn.first);
      } else if (signInBtn.evaluate().isNotEmpty) {
        await tester.tap(signInBtn.first);
      } else if (filledBtn.evaluate().isNotEmpty) {
        await tester.tap(filledBtn.last);
      } else if (elevatedBtn.evaluate().isNotEmpty) {
        await tester.tap(elevatedBtn.first);
      }
      await _settle(tester, seconds: 7);
    }

    debugPrint('=== STEP 3: DASHBOARD SCREEN ===');
    await _settle(tester, seconds: 3);
    final dashBytes = await binding.takeScreenshot('01_dashboard');
    await File('$_artifactDir/tab_01_dashboard.png').writeAsBytes(dashBytes);

    // Test NavigationBar tabs
    final navBarFinder = find.byType(NavigationBar);
    if (navBarFinder.evaluate().isNotEmpty) {
      final navBar = tester.widget<NavigationBar>(navBarFinder.first);

      // Tab 1: Orders
      debugPrint('=== STEP 4: ORDERS TAB ===');
      navBar.onDestinationSelected?.call(1);
      await _settle(tester, seconds: 4);
      final ordersBytes = await binding.takeScreenshot('02_orders');
      await File('$_artifactDir/tab_02_orders.png').writeAsBytes(ordersBytes);

      // Tab 2: Wallet
      debugPrint('=== STEP 5: WALLET TAB ===');
      navBar.onDestinationSelected?.call(2);
      await _settle(tester, seconds: 4);
      final walletBytes = await binding.takeScreenshot('03_wallet');
      await File('$_artifactDir/tab_03_wallet.png').writeAsBytes(walletBytes);

      // Tab 3: Notifications
      debugPrint('=== STEP 6: NOTIFICATIONS TAB ===');
      navBar.onDestinationSelected?.call(3);
      await _settle(tester, seconds: 4);
      final notifBytes = await binding.takeScreenshot('04_notifications');
      await File('$_artifactDir/tab_04_notifications.png').writeAsBytes(notifBytes);

      // Tab 4: Profile
      debugPrint('=== STEP 7: PROFILE TAB ===');
      navBar.onDestinationSelected?.call(4);
      await _settle(tester, seconds: 4);
      final profileBytes = await binding.takeScreenshot('05_profile');
      await File('$_artifactDir/tab_05_profile.png').writeAsBytes(profileBytes);

      // Back to Home
      debugPrint('=== STEP 8: BACK TO HOME ===');
      navBar.onDestinationSelected?.call(0);
      await _settle(tester, seconds: 3);
    }

    debugPrint('=== ALL TABS AND CAPTURES COMPLETED SUCCESSFULLY ===');
  });
}
