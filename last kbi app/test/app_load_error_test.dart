import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/theme.dart';
import 'package:kbi_technician_app/src/widgets/app_load_error.dart';

void main() {
  for (final isArabic in [false, true]) {
    testWidgets('retry remains reachable on a short screen, Arabic: $isArabic',
        (tester) async {
      await tester.binding.setSurfaceSize(const Size(320, 240));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      var retried = false;
      await tester.pumpWidget(MaterialApp(
          theme: buildKbiTheme(),
          home: Scaffold(
            body: MediaQuery(
                data: const MediaQueryData(textScaler: TextScaler.linear(2)),
                child: Directionality(
                    textDirection:
                        isArabic ? TextDirection.rtl : TextDirection.ltr,
                    child: AppLoadError(
                        title: isArabic
                            ? 'تعذر تحميل المحفظة'
                            : 'Couldn’t load your wallet',
                        isArabic: isArabic,
                        onRetry: () => retried = true))),
          )));
      expect(tester.takeException(), isNull);
      final retry = find.byType(OutlinedButton);
      await tester.ensureVisible(retry);
      await tester.tap(retry);
      expect(retried, isTrue);
    });
  }
}
