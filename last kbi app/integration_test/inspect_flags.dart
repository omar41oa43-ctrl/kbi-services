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

  testWidgets('Inspect and fix technician doc flags if needed', (tester) async {
    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 5);

    final uid = FirebaseAuth.instance.currentUser?.uid;
    debugPrint('LOGGED IN UID: $uid');

    if (uid != null) {
      final doc = await FirebaseFirestore.instance
          .collection('technicians')
          .doc(uid)
          .get();
      final data = doc.data() ?? {};
      debugPrint('TECH DOC DATA: $data');
      debugPrint('isApproved: ${data['isApproved']}');
      debugPrint('isActive: ${data['isActive']}');
      debugPrint('subscriptionStatus: ${data['subscriptionStatus']}');
      debugPrint('isSuspended: ${data['isSuspended']}');
      debugPrint('isLocked: ${data['isLocked']}');
      debugPrint('appAccessEnabled: ${data['appAccessEnabled']}');
    }
  });
}
