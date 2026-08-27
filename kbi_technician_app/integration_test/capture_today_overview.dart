import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:kbi_technician_app/main.dart' as app;

const _artifactDir =
    '/Users/it-team/.gemini/antigravity-ide/brain/83a65a6e-86c2-433f-b4d4-32abef623c24/.tempmediaStorage';

Future<void> _settle(WidgetTester tester, {int seconds = 4}) async {
  final deadline = DateTime.now().add(Duration(seconds: seconds));
  while (DateTime.now().isBefore(deadline)) {
    await tester.pump(const Duration(milliseconds: 250));
  }
}

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Create tech, scroll to Today Overview and capture screenshot',
      (tester) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final techEmail = 'tech_equal_$timestamp@kbi.test';
    const password = 'Test1234!';

    final testOnError = FlutterError.onError;
    await app.main();
    FlutterError.onError = testOnError;
    await _settle(tester, seconds: 4);

    // 1. Create Tech
    final techCred = await FirebaseAuth.instance.createUserWithEmailAndPassword(
      email: techEmail,
      password: password,
    );
    final techUid = techCred.user!.uid;

    final batch = FirebaseFirestore.instance.batch();
    batch.set(FirebaseFirestore.instance.collection('users').doc(techUid), {
      'role': 'technician',
      'email': techEmail,
      'fullName': 'Ahmed Al-Falasi',
      'createdAt': FieldValue.serverTimestamp(),
    });
    batch.set(FirebaseFirestore.instance.collection('technicians').doc(techUid), {
      'uid': techUid,
      'userId': techUid,
      'email': techEmail,
      'full_name': 'Ahmed Al-Falasi',
      'name': 'Ahmed Al-Falasi',
      'employeeId': 'KBI-007396',
      'isApproved': true,
      'isActive': true,
      'status': 'active',
      'availability': 'available',
      'online': true,
      'accountType': 'individual',
      'appAccessEnabled': true,
      'walletBalance': 0.0,
      'totalEarnings': 1420.0,
      'commissionRate': 0.0,
      'latitude': 25.1972,
      'longitude': 55.2744,
      'updatedAt': FieldValue.serverTimestamp(),
      'createdAt': FieldValue.serverTimestamp(),
    });

    batch.set(
      FirebaseFirestore.instance.collection('orders').doc('order_$timestamp'),
      {
        'assignedTechnician': techUid,
        'assignedTechnicianId': techUid,
        'technicianId': techUid,
        'orderNumber': 'KBI-8421',
        'orderId': 'KBI-8421',
        'device': 'iPhone 14 Pro Max',
        'deviceModel': 'iPhone 14 Pro Max',
        'service': 'Screen Replacement',
        'serviceType': 'Screen Replacement',
        'status': 'on_the_way',
        'address': 'Downtown Dubai, Boulevard Point, UAE',
        'scheduledTime': '10:30 AM – 12:00 PM',
        'customerPhone': '+971502491034',
        'price': 293.0,
        'latitude': 25.2048,
        'longitude': 55.2708,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      },
    );

    await batch.commit();
    await _settle(tester, seconds: 5);

    // Scroll down so Today Overview is in full view
    await tester.drag(find.byType(SingleChildScrollView).first, const Offset(0, -220));
    await _settle(tester, seconds: 2);

    // Save screenshot
    final dashBytes = await binding.takeScreenshot('today_overview_equal_size');
    await File('$_artifactDir/today_overview_equal_size.png').writeAsBytes(dashBytes);
    debugPrint('=== TODAY OVERVIEW EQUAL SIZE SCREENSHOT SAVED ===');
  });
}
