import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import 'technician_service.dart';

enum LocationTrackingIssue {
  servicesDisabled,
  permissionDenied,
  permissionPermanentlyDenied,
  locationUnavailable,
}

class LocationTrackingException implements Exception {
  const LocationTrackingException(this.issue);

  final LocationTrackingIssue issue;

  @override
  String toString() => 'Location tracking could not start: ${issue.name}';
}

Future<LocationPermission> ensureLocationAccess({
  bool requestPermission = true,
  Future<bool> Function()? serviceEnabled,
  Future<LocationPermission> Function()? checkPermission,
  Future<LocationPermission> Function()? requestPermissionCall,
}) async {
  final isEnabled =
      await (serviceEnabled ?? Geolocator.isLocationServiceEnabled)();
  if (!isEnabled) {
    throw const LocationTrackingException(
      LocationTrackingIssue.servicesDisabled,
    );
  }

  var permission = await (checkPermission ?? Geolocator.checkPermission)();
  if (permission == LocationPermission.denied && requestPermission) {
    permission =
        await (requestPermissionCall ?? Geolocator.requestPermission)();
  }
  if (permission == LocationPermission.deniedForever) {
    throw const LocationTrackingException(
      LocationTrackingIssue.permissionPermanentlyDenied,
    );
  }
  if (permission == LocationPermission.denied) {
    throw const LocationTrackingException(
      LocationTrackingIssue.permissionDenied,
    );
  }
  return permission;
}

class LocationTrackingService {
  LocationTrackingService._();
  static final instance = LocationTrackingService._();

  static const presenceHeartbeatInterval = Duration(seconds: 45);

  StreamSubscription<Position>? _subscription;
  Timer? _presenceTimer;
  Position? _lastPosition;

  bool get isTracking => _subscription != null;
  Position? get lastPosition => _lastPosition;

  Future<void> start({bool requestPermission = true}) async {
    if (_subscription != null) return;
    await _initTracking(requestPermission);
  }

  Future<void> _initTracking(bool requestPermission) async {
    await _ensureAuthorized(requestPermission: requestPermission);

    // Keep a cached fix for local UI only. Never publish it as a fresh live
    // location because the operating system may return a very old position.
    try {
      final lastKnown = await Geolocator.getLastKnownPosition();
      if (lastKnown != null) {
        _lastPosition = lastKnown;
      }
    } catch (_) {}

    final LocationSettings streamSettings;
    if (defaultTargetPlatform == TargetPlatform.android) {
      streamSettings = AndroidSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: 5,
        intervalDuration: const Duration(seconds: 10),
        foregroundNotificationConfig: const ForegroundNotificationConfig(
          notificationTitle: 'KBI live tracking',
          notificationText:
              'Your live location is shared with KBI dispatch while you are online.',
          notificationChannelName: 'KBI live location',
          enableWakeLock: true,
          setOngoing: true,
        ),
      );
    } else if (defaultTargetPlatform == TargetPlatform.iOS ||
        defaultTargetPlatform == TargetPlatform.macOS) {
      streamSettings = AppleSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        activityType: ActivityType.automotiveNavigation,
        // iOS can otherwise stay silent while the technician is stationary.
        // Receiving unchanged fixes keeps background presence current too.
        distanceFilter: 0,
        pauseLocationUpdatesAutomatically: false,
        showBackgroundLocationIndicator: true,
        allowBackgroundLocationUpdates: true,
      );
    } else {
      streamSettings = const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 5,
      );
    }

    // Start continuous GPS updates. Each accepted fix carries its real device
    // accuracy, speed, heading and capture time to the dispatch map.
    try {
      _subscription = Geolocator.getPositionStream(
        locationSettings: streamSettings,
      ).listen(
        (pos) {
          _lastPosition = pos;
          _send(pos);
        },
        onError: (Object error) {
          debugPrint('Location tracking stream error: $error');
        },
      );
      _startPresenceHeartbeat();
    } catch (e) {
      debugPrint('Error starting position stream: $e');
    }

    // Always request a fresh first fix; a cached location is not proof of the
    // technician's current position.
    try {
      final current = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
      _lastPosition = current;
      await _send(current);
    } catch (e) {
      debugPrint('Initial current position notice: $e');
    }
  }

  Future<void> _send(Position position) {
    if (!position.latitude.isFinite ||
        !position.longitude.isFinite ||
        position.isMocked ||
        (position.latitude == 0 && position.longitude == 0)) {
      return Future<void>.value();
    }
    return TechnicianService.instance.updateLocation(
      lat: position.latitude,
      lng: position.longitude,
      accuracy: position.accuracy,
      speed: position.speed,
      heading: position.heading,
    );
  }

  /// Requests a new device GPS fix immediately and publishes it to dispatch.
  /// This never falls back to the cached position, so the dashboard cannot
  /// mistake an old coordinate for the technician's current location.
  Future<void> refreshNow({bool requestPermission = true}) async {
    await _ensureAuthorized(requestPermission: requestPermission);

    final current = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        timeLimit: Duration(seconds: 20),
      ),
    );
    _lastPosition = current;
    await _send(current);
  }

  /// Keeps dispatch presence fresh when the phone has not moved enough to
  /// produce a new coordinate. Active background location keeps the Dart
  /// engine eligible to run this heartbeat on supported mobile platforms.
  void _startPresenceHeartbeat() {
    _presenceTimer?.cancel();
    _presenceTimer = Timer.periodic(presenceHeartbeatInterval, (_) {
      unawaited(TechnicianService.instance.updateLocationPresence());
    });
    unawaited(TechnicianService.instance.updateLocationPresence());
  }

  Future<void> stop() async {
    _presenceTimer?.cancel();
    _presenceTimer = null;
    await _subscription?.cancel();
    _subscription = null;
    await TechnicianService.instance.updateLocationTrackingState(
      trackingActive: false,
    );
  }

  Future<void> _ensureAuthorized({required bool requestPermission}) async {
    try {
      await ensureLocationAccess(requestPermission: requestPermission);
      await TechnicianService.instance.updateLocationTrackingState(
        permissionStatus: 'granted',
        servicesEnabled: true,
        trackingActive: true,
      );
    } on LocationTrackingException catch (error) {
      final servicesEnabled =
          error.issue != LocationTrackingIssue.servicesDisabled;
      final permissionStatus = switch (error.issue) {
        LocationTrackingIssue.permissionDenied => 'denied',
        LocationTrackingIssue.permissionPermanentlyDenied => 'denied_forever',
        LocationTrackingIssue.servicesDisabled => 'unknown',
        LocationTrackingIssue.locationUnavailable => 'granted',
      };
      await TechnicianService.instance.updateLocationTrackingState(
        permissionStatus: permissionStatus,
        servicesEnabled: servicesEnabled,
        trackingActive: false,
        issue: error.issue.name,
      );
      rethrow;
    }
  }
}
