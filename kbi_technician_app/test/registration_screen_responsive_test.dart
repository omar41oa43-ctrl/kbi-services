import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/screens/registration_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> pumpRegistrationAt(
  WidgetTester tester,
  Size size, {
  Locale locale = const Locale('en'),
}) async {
  SharedPreferences.setMockInitialValues({});
  await tester.binding.setSurfaceSize(size);
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(
    MaterialApp(
      home: RegistrationScreen(
        locale: locale,
        onLocaleChanged: (_) {},
      ),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  const sizes = [
    Size(320, 568),
    Size(390, 844),
    Size(430, 932),
    Size(844, 390),
    Size(768, 1024),
  ];

  for (final size in sizes) {
    testWidgets('registration form fits ${size.width}x${size.height}',
        (tester) async {
      await pumpRegistrationAt(tester, size);

      expect(find.text('Join the KBI Network'), findsOneWidget);
      expect(find.text('Individual Tech'), findsOneWidget);
      expect(find.text('Company Tech'), findsOneWidget);
      expect(find.text('1. Account Information'), findsOneWidget);

      final submit = find.text('Submit Application');
      await tester.ensureVisible(submit);
      await tester.pumpAndSettle();
      expect(submit, findsOneWidget);
      expect(find.text('3. Documents & Verification'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('empty form gives clear validation guidance', (tester) async {
    await pumpRegistrationAt(tester, const Size(390, 844));
    final submit = find.text('Submit Application');
    await tester.ensureVisible(submit);
    await tester.tap(submit);
    await tester.pumpAndSettle();

    expect(find.text('Please enter your full name.'), findsWidgets);
    expect(tester.takeException(), isNull);
  });

  testWidgets('company selection exposes the company-specific fields',
      (tester) async {
    await pumpRegistrationAt(tester, const Size(390, 844));
    await tester.tap(find.text('Company Tech'));
    await tester.pumpAndSettle();

    expect(find.text('Company Name *'), findsOneWidget);
    expect(find.text('Company Email *'), findsOneWidget);
    expect(find.text('Manager / Owner Name *'), findsOneWidget);
    expect(find.text('Trade License Number *'), findsOneWidget);
    await tester.ensureVisible(find.text('Trade License Copy'));
    await tester.pumpAndSettle();
    expect(find.text('Trade License Copy'), findsOneWidget);
    expect(find.text('Company Logo / ID'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Arabic form uses RTL localized copy throughout', (tester) async {
    await pumpRegistrationAt(
      tester,
      const Size(390, 844),
      locale: const Locale('ar'),
    );

    expect(find.text('انضم إلى شبكة فنيي KBI'), findsOneWidget);
    expect(find.text('فني مستقل'), findsOneWidget);
    expect(find.text('1. معلومات الحساب'), findsOneWidget);
    final submit = find.text('تقديم طلب الانضمام');
    await tester.ensureVisible(submit);
    await tester.pumpAndSettle();

    expect(find.text('2. الخدمات ونطاق التغطية'), findsOneWidget);
    expect(find.text('3. المستندات والتحقق'), findsOneWidget);
    expect(submit, findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
