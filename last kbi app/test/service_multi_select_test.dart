import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/widgets/service_multi_select.dart';

Future<void> openPicker(
    WidgetTester tester, ValueChanged<List<String>> onChanged) async {
  await tester.pumpWidget(MaterialApp(
      home: Scaffold(
          body: ServiceMultiSelect(
    options: const ['Mobile Repair', 'Laptop Repair', 'Printer Repair'],
    selected: const ['Mobile Repair'],
    labelFor: (value) => value,
    onChanged: onChanged,
    isArabic: false,
  ))));
  await tester.tap(find.byKey(const Key('service-selection-field')));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('applies multiple choices and closes without disposal errors',
      (tester) async {
    List<String>? result;
    await openPicker(tester, (value) => result = value);
    await tester.tap(find.widgetWithText(CheckboxListTile, 'Printer Repair'));
    await tester.pump();
    await tester.tap(find.byKey(const Key('apply-services')));
    await tester.pumpAndSettle();
    expect(result, ['Mobile Repair', 'Printer Repair']);
    expect(tester.takeException(), isNull);
  });

  testWidgets('cancel discards draft choices', (tester) async {
    var changes = 0;
    await openPicker(tester, (_) => changes++);
    await tester.tap(find.widgetWithText(CheckboxListTile, 'Laptop Repair'));
    await tester.tap(find.byTooltip('Cancel'));
    await tester.pumpAndSettle();
    expect(changes, 0);
    expect(tester.takeException(), isNull);
  });

  testWidgets('search filters choices and at least one selection is required',
      (tester) async {
    await openPicker(tester, (_) {});
    await tester.enterText(find.byKey(const Key('service-search')), 'Mobile');
    await tester.pump();
    expect(
        find.widgetWithText(CheckboxListTile, 'Printer Repair'), findsNothing);
    await tester.tap(find.widgetWithText(CheckboxListTile, 'Mobile Repair'));
    await tester.pump();
    expect(
        tester
            .widget<FilledButton>(find.byKey(const Key('apply-services')))
            .onPressed,
        isNull);
    expect(tester.takeException(), isNull);
  });
}
