import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:kbi_technician_app/main.dart' as app;

Future<void> _settle(WidgetTester tester, {int seconds = 6}) async {
  final deadline = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(deadline)) {
    await tester.pump(const Duration(milliseconds: 250));
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Check exact booleans on technician doc', (tester) async {
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 5);

    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid != null) {
      final doc = await FirebaseFirestore.instance
          .collection('technicians')
          .doc(uid)
          .get();
      final data = doc.data() ?? {};
      debugPrint('=== FLAGS ===');
      debugPrint(
          'isApproved: ${data['isApproved']} (${data['isApproved'].runtimeType})');
      debugPrint(
          'isActive: ${data['isActive']} (${data['isActive'].runtimeType})');
      debugPrint(
          'subscriptionStatus: ${data['subscriptionStatus']} (${data['subscriptionStatus'].runtimeType})');
      debugPrint(
          'isSuspended: ${data['isSuspended']} (${data['isSuspended'].runtimeType})');
      debugPrint(
          'isLocked: ${data['isLocked']} (${data['isLocked'].runtimeType})');
      debugPrint(
          'appAccessEnabled: ${data['appAccessEnabled']} (${data['appAccessEnabled'].runtimeType})');
    }
  });
}
