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
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Show Welcome Screen with perfect half-body portrait',
      (tester) async {
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 3);

    if (FirebaseAuth.instance.currentUser != null) {
      await FirebaseAuth.instance.signOut();
      await _settle(tester, seconds: 2);
    }

    final backBtn = find.byIcon(Icons.arrow_back_rounded);
    if (backBtn.evaluate().isNotEmpty) {
      await tester.tap(backBtn.first);
      await _settle(tester, seconds: 2);
    }

    // Now on Welcome Screen
    expect(find.text('Get Started'), findsWidgets);
    await _settle(tester, seconds: 5);
  });
}
