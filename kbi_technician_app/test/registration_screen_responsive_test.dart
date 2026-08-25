import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
    testWidgets('registration flow fits ${size.width}x${size.height}',
        (tester) async {
      await pumpRegistrationAt(tester, size);

      expect(find.text('How will you work?'), findsOneWidget);
      await tester.ensureVisible(find.text('Continue'));
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      expect(find.text('Employee application'), findsOneWidget);
      expect(find.text('STEP 1 OF 4'), findsOneWidget);
      expect(find.text('8+ characters'), findsOneWidget);
      if (size.width >= 370) {
        expect(find.text('Back'), findsOneWidget);
      } else {
        expect(find.byIcon(Icons.arrow_back_rounded), findsWidgets);
      }
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('empty personal step gives field-level guidance', (tester) async {
    await pumpRegistrationAt(tester, const Size(390, 844));
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    expect(find.text('Enter your full name.'), findsOneWidget);
    expect(find.text('Enter an email address.'), findsOneWidget);
    expect(find.text('Enter a contact number.'), findsOneWidget);
    expect(find.text('One or more fields need attention.'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('valid personal and skills data reaches document step',
      (tester) async {
    const filePickerChannel =
        MethodChannel('miguelruivo.flutter.plugins.filepicker');
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(filePickerChannel, (_) async {
      return [
        {
          'name': 'proof.pdf',
          'path': null,
          'bytes': Uint8List.fromList([1, 2, 3, 4]),
          'size': 4,
          'identifier': null,
        },
      ];
    });
    addTearDown(() {
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(filePickerChannel, null);
    });
    await pumpRegistrationAt(tester, const Size(390, 844));
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    final personalFields = find.byType(TextField);
    await tester.enterText(personalFields.at(0), 'Amina Hassan');
    await tester.enterText(personalFields.at(1), 'amina@example.com');
    await tester.enterText(personalFields.at(2), '+971501234567');
    await tester.enterText(personalFields.at(3), 'Repair123');
    await tester.enterText(personalFields.at(4), 'Repair123');
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    expect(find.text('Skills & coverage'), findsOneWidget);
    final specializationChip = tester.widget<InkWell>(
      find.ancestor(
        of: find.text('Mobile Repair'),
        matching: find.byType(InkWell),
      ),
    );
    specializationChip.onTap!();
    await tester.enterText(find.byType(TextField).first, 'Al Reem Island');
    final continueButton = tester.widget<ElevatedButton>(
      find.ancestor(
        of: find.text('Continue'),
        matching: find.byType(ElevatedButton),
      ),
    );
    continueButton.onPressed!();
    await tester.pumpAndSettle();

    expect(find.text('Documents'), findsWidgets);
    expect(find.text('Required'), findsNWidgets(2));
    expect(find.text('Optional'), findsOneWidget);
    expect(find.text('PDF, JPG or PNG · up to 10 MB'), findsNWidgets(3));

    for (var i = 0; i < 2; i++) {
      final browseTarget = find.text('Tap to browse files').first;
      final browseGesture = tester.widget<GestureDetector>(
        find.ancestor(
          of: browseTarget,
          matching: find.byType(GestureDetector),
        ),
      );
      browseGesture.onTap!();
      await tester.pumpAndSettle();
    }
    final terms =
        tester.widget<CheckboxListTile>(find.byType(CheckboxListTile));
    terms.onChanged!(true);
    await tester.pump();
    final reviewButton = tester.widget<ElevatedButton>(
      find.ancestor(
        of: find.text('Continue'),
        matching: find.byType(ElevatedButton),
      ),
    );
    reviewButton.onPressed!();
    await tester.pumpAndSettle();

    expect(find.text('Application summary'), findsOneWidget);
    expect(find.text('What happens next?'), findsOneWidget);
    expect(find.text('Submit application'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Arabic selector and first step use RTL localized copy',
      (tester) async {
    await pumpRegistrationAt(
      tester,
      const Size(390, 844),
      locale: const Locale('ar'),
    );

    expect(find.text('كيف ستعمل معنا؟'), findsOneWidget);
    expect(find.text('فني مستقل'), findsOneWidget);
    await tester.tap(find.text('متابعة'));
    await tester.pumpAndSettle();

    expect(find.text('طلب فني مستقل'), findsOneWidget);
    expect(find.text('الخطوة 1 من 4'), findsOneWidget);
    expect(find.text('البيانات الشخصية'), findsOneWidget);
    expect(find.text('8 أحرف على الأقل'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
