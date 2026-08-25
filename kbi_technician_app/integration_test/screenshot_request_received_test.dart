import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:kbi_technician_app/src/screens/request_received_screen.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Capture RequestReceivedScreen in Light and Dark mode', (tester) async {
    // 1. Light Mode
    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData.light(useMaterial3: true),
        home: const RequestReceivedScreen(
          locale: Locale('en'),
        ),
      ),
    );
    await tester.pumpAndSettle();
    sleep(const Duration(seconds: 1));
    await binding.takeScreenshot('request_received_light_mode');

    // 2. Arabic Light Mode
    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData.light(useMaterial3: true),
        home: const RequestReceivedScreen(
          locale: Locale('ar'),
        ),
      ),
    );
    await tester.pumpAndSettle();
    sleep(const Duration(seconds: 1));
    await binding.takeScreenshot('request_received_arabic_mode');
  });
}
