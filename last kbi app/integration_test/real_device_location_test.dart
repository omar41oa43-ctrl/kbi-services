import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:integration_test/integration_test.dart';
import 'package:kbi_technician_app/firebase_options.dart';
import 'package:kbi_technician_app/src/services/location_tracking_service.dart';
import 'package:kbi_technician_app/src/services/technician_service.dart';

const _customToken = String.fromEnvironment('TEST_CUSTOM_TOKEN');
const _allowMockLocation = bool.fromEnvironment('TEST_ALLOW_MOCK_LOCATION');

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('real device publishes a fresh GPS fix for admin tracking',
      (tester) async {
    expect(_customToken, isNotEmpty);
    if (Firebase.apps.isEmpty) {
      try {
        await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform,
        );
      } on FirebaseException catch (error) {
        if (error.code != 'duplicate-app') rethrow;
      }
    }

    final credential =
        await FirebaseAuth.instance.signInWithCustomToken(_customToken);
    final uid = credential.user!.uid;
    final before = DateTime.now().toUtc().subtract(const Duration(seconds: 2));

    final permission = await ensureLocationAccess(requestPermission: true);
    expect(
      permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always,
      isTrue,
    );
    await LocationTrackingService.instance.refreshNow(
      requestPermission: false,
    );

    var snapshot = await FirebaseFirestore.instance
        .collection('technicians')
        .doc(uid)
        .get();
    var data = snapshot.data() ?? const <String, dynamic>{};
    if (_allowMockLocation && data['latitude'] == null) {
      final simulated = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.bestForNavigation,
          timeLimit: Duration(seconds: 20),
        ),
      );
      expect(simulated.isMocked, isTrue);
      await TechnicianService.instance.updateLocation(
        lat: simulated.latitude,
        lng: simulated.longitude,
        accuracy: simulated.accuracy,
        speed: simulated.speed,
        heading: simulated.heading,
      );
      snapshot = await FirebaseFirestore.instance
          .collection('technicians')
          .doc(uid)
          .get();
      data = snapshot.data() ?? const <String, dynamic>{};
    }
    final latitude = (data['latitude'] as num?)?.toDouble();
    final longitude = (data['longitude'] as num?)?.toDouble();
    final updatedAt = (data['locationUpdatedAt'] as Timestamp?)?.toDate();
    expect(latitude, isNotNull);
    expect(longitude, isNotNull);
    expect(latitude == 0 && longitude == 0, isFalse);
    expect(updatedAt, isNotNull);
    expect(updatedAt!.toUtc().isAfter(before), isTrue);
    expect(data['locationPermissionStatus'], 'granted');
    expect(data['locationServicesEnabled'], true);
    expect(data['isTrackingActive'], true);
    debugPrint(
      'VERIFIED_DEVICE_GPS=$latitude,$longitude at ${updatedAt.toUtc().toIso8601String()}',
    );

    await LocationTrackingService.instance.stop();
    await FirebaseAuth.instance.signOut();
  });
}
