import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/screens/auth_screen.dart';
import 'package:kbi_technician_app/src/screens/registration_screen.dart';
import 'package:kbi_technician_app/src/screens/request_received_screen.dart';
import 'package:kbi_technician_app/src/theme.dart';
import 'package:kbi_technician_app/src/widgets/dashboard_overview.dart';

void main() {
  setUpAll(() async {
    const output = String.fromEnvironment('REVIEW_SCREENSHOTS');
    if (output.isNotEmpty && Platform.isMacOS) {
      final textFont = FontLoader('Roboto')
        ..addFont(Future.value(ByteData.sublistView(
            File('/System/Library/Fonts/Supplemental/Arial Unicode.ttf')
                .readAsBytesSync())));
      final iconFont = FontLoader('MaterialIcons')
        ..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'));
      await textFont.load();
      await iconFont.load();
    }
  });
  test('primary and secondary text meet WCAG AA on every app surface', () {
    for (final surface in [
      kbiBlack,
      kbiSurface,
      kbiSurfaceRaised,
      kbiSurfaceMuted
    ]) {
      for (final foreground in [
        kbiLabel,
        kbiSecondaryLabel,
        kbiBrand,
        kbiOrange,
        kbiRed,
        kbiSuccess
      ]) {
        final a = foreground.computeLuminance();
        final b = surface.computeLuminance();
        final ratio = (a > b ? a + .05 : b + .05) / (a > b ? b + .05 : a + .05);
        expect(ratio, greaterThanOrEqualTo(4.5),
            reason: '$foreground on $surface');
      }
    }
  });

  for (final language in ['en', 'ar']) {
    for (final screen in ['login', 'registration', 'received', 'overview']) {
      testWidgets(
          '$language $screen supports enlarged text and shared dark styling',
          (tester) async {
        await tester.binding.setSurfaceSize(const Size(390, 844));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        final locale = Locale(language);
        final boundary = GlobalKey();
        final child = switch (screen) {
          'login' => AuthScreen(
              locale: locale,
              onLocaleChanged: (_) {},
              initialShowLoginForm: true),
          'registration' =>
            RegistrationScreen(locale: locale, onLocaleChanged: (_) {}),
          'overview' => Scaffold(
                body: SafeArea(
                    child: SingleChildScrollView(
              child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: DashboardOverview(
                      jobsToday: 8,
                      completedJobs: 5,
                      earningsToday: 1250.75,
                      activeJobs: 3,
                      isArabic: language == 'ar',
                      onOpenWallet: () {})),
            ))),
          _ => RequestReceivedScreen(locale: locale),
        };
        await tester.pumpWidget(MaterialApp(
          theme: buildKbiTheme(),
          locale: locale,
          supportedLocales: const [Locale('en'), Locale('ar')],
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context)
                .copyWith(textScaler: const TextScaler.linear(1.4)),
            child: child!,
          ),
          home: RepaintBoundary(key: boundary, child: child),
        ));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        const output = String.fromEnvironment('REVIEW_SCREENSHOTS');
        if (output.isNotEmpty) {
          await tester.runAsync(() async {
            final render = boundary.currentContext!.findRenderObject()!
                as RenderRepaintBoundary;
            final image = await render.toImage(pixelRatio: 2);
            final data = await image.toByteData(format: ui.ImageByteFormat.png);
            await Directory(output).create(recursive: true);
            await File('$output/$screen-$language.png')
                .writeAsBytes(data!.buffer.asUint8List());
            image.dispose();
          });
        }
      });
    }
  }
}
