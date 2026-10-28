import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/theme.dart';
import 'package:kbi_technician_app/src/widgets/dashboard_overview.dart';

void main() {
  for (final width in [320.0, 390.0, 768.0]) {
    for (final isArabic in [false, true]) {
      testWidgets('overview remains readable at $width, Arabic: $isArabic',
          (tester) async {
        await tester.binding.setSurfaceSize(Size(width, 900));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        var walletOpened = false;
        await tester.pumpWidget(MaterialApp(
          theme: buildKbiTheme(),
          home: Scaffold(
              body: MediaQuery(
            data: MediaQueryData(
                size: Size(width, 900), textScaler: const TextScaler.linear(2)),
            child: Directionality(
              textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
              child: SingleChildScrollView(
                  child: Padding(
                padding: const EdgeInsets.all(18),
                child: DashboardOverview(
                    jobsToday: 125,
                    completedJobs: 100,
                    earningsToday: 123456.78,
                    activeJobs: 25,
                    isArabic: isArabic,
                    onOpenWallet: () => walletOpened = true),
              )),
            ),
          )),
        ));
        expect(tester.takeException(), isNull);
        expect(find.text('AED 123456.78'), findsOneWidget);
        final label = find.text(isArabic ? 'أرباح اليوم' : 'Earnings today');
        final text = tester.widget<Text>(label);
        expect(text.maxLines, isNull);
        expect(text.overflow, isNull);
        await tester.tap(find.text(isArabic ? 'المحفظة' : 'Wallet'));
        expect(walletOpened, isTrue);
      });
    }
  }
}
