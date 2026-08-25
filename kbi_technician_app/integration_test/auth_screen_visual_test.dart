import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:kbi_technician_app/main.dart' as app;

Future<void> _settle(WidgetTester tester, {int seconds = 3}) async {
  final deadline = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(deadline)) {
    await tester.pump(const Duration(milliseconds: 200));
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Visual Test for MoveEase-style Welcome and Login Screens',
      (tester) async {
    // 1. Sign out if currently signed in to view AuthScreen
    await app.main();
    await _settle(tester, seconds: 5);

    if (FirebaseAuth.instance.currentUser != null) {
      await FirebaseAuth.instance.signOut();
      await _settle(tester, seconds: 4);
    }

    debugPrint('=== [VIEW 1: LOGIN TO DOORSTEP SCREEN] ===');
    expect(find.textContaining('Login to Doorstep'), findsOneWidget);
    expect(find.text('Login'), findsWidgets);
    expect(find.text('Sign Up'), findsWidgets);
    expect(find.text('Enter your email'), findsOneWidget);
    expect(find.text('Enter your password'), findsOneWidget);
    expect(find.text('Remember me'), findsOneWidget);
    expect(find.text('Forgot Password?'), findsOneWidget);

    await _settle(tester, seconds: 2);

    // Capture screenshot of Login screen
    // Tap back button to see Welcome / Onboarding screen
    final backBtn = find.byIcon(Icons.arrow_back_rounded);
    if (backBtn.evaluate().isNotEmpty) {
      debugPrint('=== [VIEW 2: TAPPING BACK TO WELCOME SCREEN] ===');
      await tester.tap(backBtn.first);
      await _settle(tester, seconds: 3);

      expect(find.textContaining('Powerful Repairs Muscle On Demand Anytime!'),
          findsOneWidget);
      expect(find.text('Get Started'), findsOneWidget);

      debugPrint('=== [VIEW 3: TAPPING GET STARTED TO RETURN TO LOGIN] ===');
      final getStarted = find.text('Get Started');
      await tester.tap(getStarted.first);
      await _settle(tester, seconds: 3);

      expect(find.textContaining('Login to Doorstep'), findsOneWidget);
    }

    debugPrint('=== ALL AUTH SCREEN VIEWS VERIFIED SUCCESSFULLY! ===');
  });
}
