import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/app.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const KbiTechnicianApp());
    expect(find.byType(KbiTechnicianApp), findsOneWidget);
  });
}
