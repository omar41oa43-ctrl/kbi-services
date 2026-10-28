import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/widgets/payout_bank_card.dart';

const bank = {
  'bank_name': 'Abu Dhabi Commercial Bank',
  'account_holder': 'MOHAMED AHMED OMER ALTYEB',
  'iban': 'AE070331234567890123456',
};

void main() {
  for (final width in [280.0, 320.0, 400.0, 760.0]) {
    for (final isAr in [false, true]) {
      testWidgets('bank card fits $width with Arabic=$isAr', (tester) async {
        await tester.pumpWidget(MaterialApp(
            home: Scaffold(
                body: Center(
          child: SizedBox(
              width: width,
              child: Directionality(
                textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
                child: PayoutBankCard(
                    bankDetails: bank, isAr: isAr, onEdit: () {}),
              )),
        ))));
        expect(tester.takeException(), isNull);
        expect(find.text(bank['iban']!), findsNothing);
        expect(find.text('AE07 •••• •••• •••• 3456'), findsOneWidget);
        expect(find.text(bank['account_holder']!), findsOneWidget);
      });
    }
  }
  testWidgets('empty card offers bank setup', (tester) async {
    var edited = false;
    await tester.pumpWidget(MaterialApp(
        home: Scaffold(
            body: SizedBox(
      width: 320,
      child: PayoutBankCard(
          bankDetails: const {}, isAr: false, onEdit: () => edited = true),
    ))));
    await tester.tap(find.text('Add bank details'));
    expect(edited, isTrue);
    expect(find.text('Add bank details in Profile'), findsOneWidget);
  });
}
