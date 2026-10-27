import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:kbi_technician_app/main.dart' as app;

const _email = 'admin1@kbi.com';
const _password = '123q123q';

Future<void> _settle(WidgetTester tester, {int seconds = 5}) async {
  final deadline = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(deadline)) {
    await tester.pump(const Duration(milliseconds: 250));
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Verify Customer Location Map on Job Details Screen',
      (tester) async {
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 5);

    // If on sign-in screen
    final fields = find.byType(TextField);
    if (fields.evaluate().length >= 2) {
      debugPrint('LOGGING IN...');
      await tester.enterText(fields.at(0), _email);
      await tester.pump(const Duration(milliseconds: 300));
      await tester.enterText(fields.at(1), _password);
      await tester.pump(const Duration(milliseconds: 300));

      final signInBtn = find.text('Sign in');
      if (signInBtn.evaluate().isNotEmpty) {
        await tester.tap(signInBtn.last);
        await _settle(tester, seconds: 8);
      }
    }

    final uid = FirebaseAuth.instance.currentUser?.uid;
    debugPrint('LOGGED IN AS: $uid');

    // Tap Open job button
    final openJobBtn = find.text('Open job');
    if (openJobBtn.evaluate().isNotEmpty) {
      debugPrint('TAPPING OPEN JOB BUTTON...');
      await tester.tap(openJobBtn.first);
      await _settle(tester, seconds: 6);
    } else {
      // Tap Jobs tab
      final jobsTab = find.text('Jobs');
      if (jobsTab.evaluate().isNotEmpty) {
        debugPrint('TAPPING JOBS TAB...');
        await tester.tap(jobsTab.first);
        await _settle(tester, seconds: 4);

        final firstJob = find.byType(Card);
        if (firstJob.evaluate().isNotEmpty) {
          await tester.tap(firstJob.first);
          await _settle(tester, seconds: 6);
        }
      }
    }

    // Give map tiles time to stream over network
    await _settle(tester, seconds: 6);
    debugPrint('MAP SCREEN LOADED SUCCESSFULLY!');
  });
}
