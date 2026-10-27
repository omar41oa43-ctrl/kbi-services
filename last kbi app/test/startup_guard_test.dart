import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kbi_technician_app/src/widgets/startup_guard.dart';

void main() {
  testWidgets('waits for initialization before mounting authenticated app',
      (tester) async {
    final ready = Completer<void>();
    await tester.pumpWidget(StartupGuard(
      initialize: () => ready.future,
      child: const MaterialApp(home: Text('App ready')),
    ));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text('App ready'), findsNothing);
    ready.complete();
    await tester.pumpAndSettle();
    expect(find.text('App ready'), findsOneWidget);
  });

  testWidgets('recovers from initialization failure with retry',
      (tester) async {
    var attempts = 0;
    await tester.pumpWidget(StartupGuard(
      initialize: () async {
        if (++attempts == 1) throw StateError('Backend unavailable');
      },
      child: const MaterialApp(home: Text('App ready')),
    ));
    await tester.pumpAndSettle();
    expect(find.text('Retry'), findsOneWidget);
    expect(find.text('App ready'), findsNothing);
    await tester.tap(find.text('Retry'));
    await tester.pumpAndSettle();
    expect(attempts, 2);
    expect(find.text('App ready'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
