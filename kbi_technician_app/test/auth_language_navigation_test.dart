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
}
