import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/screens/auth_screen.dart';

Future<void> pumpAuthAt(
  WidgetTester tester,
  Size size, {
  bool showLogin = true,
}) async {
  await tester.binding.setSurfaceSize(size);
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(
    MaterialApp(
      home: AuthScreen(
        locale: const Locale('en'),
        onLocaleChanged: (_) {},
      ),
    ),
  );
  await tester.pump();
  if (showLogin) {
    final action = find.byKey(const Key('welcome-primary-action'));
    await tester.ensureVisible(action);
    await tester.pumpAndSettle();
    await tester.tap(action);
    await tester.pumpAndSettle();
  }
}

void main() {
  const phoneSizes = [
    Size(320, 568),
    Size(390, 844),
    Size(430, 932),
    Size(585, 843),
    Size(600, 960),
    Size(844, 390),
    Size(768, 1024),
  ];

  for (final size in phoneSizes) {
    testWidgets('login remains usable at ${size.width}x${size.height}',
        (tester) async {
      await pumpAuthAt(tester, size);

      expect(find.byKey(const ValueKey('login_view')), findsOneWidget);
      expect(find.byKey(const Key('technician-login-form')), findsOneWidget);
      expect(find.text('Sign in'), findsOneWidget);
      expect(find.text('Email address'), findsOneWidget);
      expect(find.text('Forgot password?'), findsOneWidget);
      if (size.width >= 500) {
        final formSize = tester.getSize(
          find.byKey(const Key('technician-login-form')),
        );
        expect(formSize.width, lessThanOrEqualTo(480));
      }
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('desktop keeps the login form compact and centered',
      (tester) async {
    await pumpAuthAt(tester, const Size(1366, 768));

    expect(find.byKey(const Key('technician-login-form')), findsOneWidget);
    expect(find.text('Welcome back'), findsOneWidget);
    final formSize = tester.getSize(
      find.byKey(const Key('technician-login-form')),
    );
    expect(formSize.width, lessThanOrEqualTo(430));
    expect(tester.takeException(), isNull);
  });

  for (final size in const [Size(320, 568), Size(390, 844), Size(844, 390)]) {
    testWidgets('welcome remains usable at ${size.width}x${size.height}',
        (tester) async {
      await pumpAuthAt(tester, size, showLogin: false);

      expect(find.byKey(const ValueKey('welcome_view')), findsOneWidget);
      expect(find.byKey(const Key('welcome-header')), findsOneWidget);
      expect(find.textContaining('Your workday.'), findsOneWidget);
      expect(
        find.byKey(const Key('welcome-primary-action')),
        findsOneWidget,
      );
      expect(tester.takeException(), isNull);
    });
  }
}
