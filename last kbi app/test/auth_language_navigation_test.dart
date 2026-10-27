import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/screens/auth_screen.dart';

class _LocaleHarness extends StatefulWidget {
  const _LocaleHarness();

  @override
  State<_LocaleHarness> createState() => _LocaleHarnessState();
}

class _LocaleHarnessState extends State<_LocaleHarness> {
  Locale _locale = const Locale('en');
  bool _showLogin = false;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      locale: _locale,
      supportedLocales: const [Locale('en'), Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: AuthScreen(
        locale: _locale,
        initialShowLoginForm: _showLogin,
        onViewChanged: (value) => _showLogin = value,
        onLocaleChanged: (locale) => setState(() => _locale = locale),
      ),
    );
  }
}

void main() {
  testWidgets('welcome screen is the default signed-out entry view', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(430, 932));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      const MaterialApp(
        home: AuthScreen(
          locale: Locale('en'),
          onLocaleChanged: _ignoreLocaleChange,
        ),
      ),
    );
    await tester.pump();

    expect(find.byKey(const ValueKey('welcome_view')), findsOneWidget);
    expect(find.byKey(const ValueKey('login_view')), findsNothing);
  });

  testWidgets('language switch keeps the welcome screen open', (tester) async {
    await tester.binding.setSurfaceSize(const Size(430, 932));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const _LocaleHarness());
    await tester.pump();
    expect(find.byKey(const ValueKey('welcome_view')), findsOneWidget);

    await tester.tap(find.text('عربي'));
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('welcome_view')), findsOneWidget);
    expect(find.byKey(const ValueKey('login_view')), findsNothing);
    expect(find.text('يوم عملك.\nتواصل أفضل.'), findsOneWidget);
  });

  testWidgets('logo stays on the physical left in both languages and views',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(const _LocaleHarness());
    await tester.pumpAndSettle();
    final welcomeLeft =
        tester.getTopLeft(find.byKey(const Key('welcome-header'))).dx;
    await tester.tap(find.text('عربي'));
    await tester.pumpAndSettle();
    expect(tester.getTopLeft(find.byKey(const Key('welcome-header'))).dx,
        welcomeLeft);
    expect(welcomeLeft, lessThan(100));
    await tester.tap(find.byKey(const Key('welcome-primary-action')));
    await tester.pumpAndSettle();
    final loginLeft =
        tester.getTopLeft(find.byKey(const Key('login-header-logo'))).dx;
    await tester.tap(find.text('EN'));
    await tester.pumpAndSettle();
    expect(tester.getTopLeft(find.byKey(const Key('login-header-logo'))).dx,
        loginLeft);
    expect(loginLeft, lessThan(100));
    expect(tester.takeException(), isNull);
  });

  testWidgets('continue opens the email and password form', (tester) async {
    await tester.binding.setSurfaceSize(const Size(430, 932));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      const MaterialApp(
        home: AuthScreen(
          locale: Locale('en'),
          onLocaleChanged: _ignoreLocaleChange,
        ),
      ),
    );
    await tester.pump();

    await tester.tap(find.byKey(const Key('welcome-primary-action')));
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('login_view')), findsOneWidget);
    expect(find.byKey(const Key('technician-login-form')), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2));
  });
}

void _ignoreLocaleChange(Locale _) {}
