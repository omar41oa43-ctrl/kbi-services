import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:kbi_technician_app/src/services/location_tracking_service.dart';

void main() {
  test('requests the operating-system permission when access is undecided',
      () async {
    var requestCount = 0;

    final permission = await ensureLocationAccess(
      serviceEnabled: () async => true,
      checkPermission: () async => LocationPermission.denied,
      requestPermissionCall: () async {
        requestCount += 1;
        return LocationPermission.whileInUse;
      },
    );

    expect(permission, LocationPermission.whileInUse);
    expect(requestCount, 1);
  });

  test('does not open a permission prompt during a background-only refresh',
      () async {
    var requested = false;

    await expectLater(
      ensureLocationAccess(
        requestPermission: false,
        serviceEnabled: () async => true,
        checkPermission: () async => LocationPermission.denied,
        requestPermissionCall: () async {
          requested = true;
          return LocationPermission.whileInUse;
        },
      ),
      throwsA(
        isA<LocationTrackingException>().having(
          (error) => error.issue,
          'issue',
          LocationTrackingIssue.permissionDenied,
        ),
      ),
    );
    expect(requested, isFalse);
  });

  test('reports disabled GPS before checking app permission', () async {
    var checkedPermission = false;

    await expectLater(
      ensureLocationAccess(
        serviceEnabled: () async => false,
        checkPermission: () async {
          checkedPermission = true;
          return LocationPermission.always;
        },
      ),
      throwsA(
        isA<LocationTrackingException>().having(
          (error) => error.issue,
          'issue',
          LocationTrackingIssue.servicesDisabled,
        ),
      ),
    );
    expect(checkedPermission, isFalse);
  });

  test('maps permanently denied access to the settings recovery state',
      () async {
    await expectLater(
      ensureLocationAccess(
        serviceEnabled: () async => true,
        checkPermission: () async => LocationPermission.deniedForever,
      ),
      throwsA(
        isA<LocationTrackingException>().having(
          (error) => error.issue,
          'issue',
          LocationTrackingIssue.permissionPermanentlyDenied,
        ),
      ),
    );
  });
}
