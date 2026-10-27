import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/widgets/password_reset_dialog.dart';

void main() {
  for (final submit in [false, true]) {
    testWidgets('dialog survives route exit and reopening (submit: $submit)',
        (tester) async {
      String? result;
      await tester.pumpWidget(MaterialApp(
        home: Builder(
            builder: (context) => Scaffold(
                  body: TextButton(
                    onPressed: () async {
                      result = await showDialog<String>(
                        context: context,
                        builder: (_) => const PasswordResetDialog(
                            initialEmail: 'tech@example.com', isArabic: false),
                      );
                    },
                    child: const Text('Open'),
                  ),
                )),
      ));
      for (var attempt = 0; attempt < 3; attempt++) {
        await tester.tap(find.text('Open'));
        await tester.pumpAndSettle();
        await tester.enterText(find.byType(TextField), ' tech@example.com ');
        await tester.tap(find.text(submit ? 'Send request' : 'Cancel'));
        // Check both the pop frame and the route's reverse animation.
        await tester.pump();
        expect(tester.takeException(), isNull);
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        expect(find.byType(PasswordResetDialog), findsNothing);
        expect(result, submit ? 'tech@example.com' : isNull);
      }
    });
  }
}
