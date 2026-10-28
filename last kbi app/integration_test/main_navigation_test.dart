import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:kbi_technician_app/firebase_options.dart';
import 'package:kbi_technician_app/src/screens/home_screen.dart';
import 'package:kbi_technician_app/src/theme.dart';

const _token = String.fromEnvironment('TEST_CUSTOM_TOKEN');

Future<void> settle(WidgetTester tester) async {
  for (var i = 0; i < 16; i++) {
    await tester.pump(const Duration(milliseconds: 250));
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('main tabs load in English and Arabic with enlarged text',
      (tester) async {
    expect(_token, isNotEmpty,
        reason: 'Supply a dedicated approved test account.');
    try {
      await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform);
    } on FirebaseException catch (error) {
      if (error.code != 'duplicate-app') rethrow;
    }
    await FirebaseAuth.instance.signInWithCustomToken(_token);
    for (final language in ['en', 'ar']) {
      final locale = Locale(language);
      await tester.pumpWidget(MaterialApp(
        key: ValueKey(language),
        theme: buildKbiTheme(),
        locale: locale,
        supportedLocales: const [Locale('en'), Locale('ar')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate
        ],
        builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context)
                .copyWith(textScaler: const TextScaler.linear(1.4)),
            child: child!),
        home: HomeScreen(locale: locale, onLocaleChanged: (_) {}),
      ));
      await settle(tester);
      final dismiss = find.text(language == 'ar' ? 'ليس الآن' : 'Not now');
      if (dismiss.evaluate().isNotEmpty) {
        await tester.tap(dismiss.first);
        await settle(tester);
      }
      for (var index = 0; index < 5; index++) {
        final destination = find.byKey(ValueKey('main-nav-$index'));
        expect(destination, findsOneWidget);
        await tester.tap(destination);
        await settle(tester);
        expect(tester.takeException(), isNull, reason: '$language tab $index');
      }
    }
    await tester.pumpWidget(const SizedBox.shrink());
    await FirebaseAuth.instance.signOut();
  });
}
