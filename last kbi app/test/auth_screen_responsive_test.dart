import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/screens/auth_screen.dart';

Future<void> pumpAuthAt(
  WidgetTester tester,
  Size size, {
  bool showLogin = true,
  Brightness brightness = Brightness.light,
  Locale locale = const Locale('en'),
}) async {
  await tester.binding.setSurfaceSize(size);
  addTearDown(() => tester.binding.setSurfaceSize(null));
  tester.binding.platformDispatcher.platformBrightnessTestValue = brightness;
  addTearDown(
    tester.binding.platformDispatcher.clearPlatformBrightnessTestValue,
  );
  await tester.pumpWidget(
    MaterialApp(
      home: AuthScreen(
        locale: locale,
        onLocaleChanged: (_) {},
        initialShowLoginForm: showLogin,
      ),
    ),
  );
  await tester.pump();
}

void main() {
  const phoneSizes = [
    Size(320, 568),
    Size(390, 844),
    Size(360, 640),
    Size(412, 915),
    Size(430, 932),
    Size(585, 843),
    Size(600, 960),
    Size(844, 390),
    Size(768, 1024),
  ];

  for (final brightness in [Brightness.light, Brightness.dark]) {
    for (final size in phoneSizes) {
      testWidgets(
          '${brightness.name} login remains usable at ${size.width}x${size.height}',
          (tester) async {
        await pumpAuthAt(tester, size, brightness: brightness);

        expect(find.byKey(const ValueKey('login_view')), findsOneWidget);
        expect(find.byKey(const Key('technician-login-form')), findsOneWidget);
        expect(find.text('Sign in'), findsOneWidget);
        expect(find.text('Email address'), findsOneWidget);
        expect(find.text('Forgot password?'), findsOneWidget);
        final heroSize = tester.getSize(
          find.byKey(const Key('login-technician-hero')),
        );
        expect(heroSize.height, lessThanOrEqualTo(size.height * 0.65));
        if (size.width >= 500) {
          final formSize = tester.getSize(
            find.byKey(const Key('technician-login-form')),
          );
          expect(formSize.width, lessThanOrEqualTo(480));
        }
        if (size.height >= 700) {
          final formRect = tester.getRect(
            find.byKey(const Key('technician-login-form')),
          );
          expect(formRect.bottom, lessThanOrEqualTo(size.height));
        }
        expect(tester.takeException(), isNull);
      });
    }
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

  for (final locale in const [Locale('en'), Locale('ar')]) {
    for (final size in const [
      Size(320, 568),
      Size(375, 667),
      Size(390, 844),
      Size(430, 932),
      Size(440, 956),
      Size(844, 390),
    ]) {
      testWidgets(
          '${locale.languageCode} welcome remains usable at ${size.width}x${size.height}',
          (tester) async {
        await pumpAuthAt(tester, size, showLogin: false, locale: locale);

        expect(find.byKey(const ValueKey('welcome_view')), findsOneWidget);
        final logo = find.byKey(const Key('welcome-header'));
        final action = find.byKey(const Key('welcome-primary-action'));
        expect(logo, findsOneWidget);
        expect(action, findsOneWidget);
        expect(
          find.textContaining(
            locale.languageCode == 'ar' ? 'يوم عملك.' : 'Your workday.',
          ),
          findsOneWidget,
        );
        expect(tester.getRect(logo).center.dx, lessThan(size.width / 2));
        final actionRect = tester.getRect(action);
        expect(actionRect.left, greaterThanOrEqualTo(16));
        expect(actionRect.right, lessThanOrEqualTo(size.width - 16));
        if (size.height >= 568) {
          expect(actionRect.bottom, lessThanOrEqualTo(size.height - 16));
        }
        expect(tester.takeException(), isNull);
      });
    }
  }
}
