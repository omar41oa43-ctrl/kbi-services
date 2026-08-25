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

class LocationTrackingService {
  LocationTrackingService._();
  static final instance = LocationTrackingService._();

  StreamSubscription<Position>? _subscription;
  Position? _lastPosition;

  bool get isTracking => _subscription != null;
  Position? get lastPosition => _lastPosition;

  Future<void> start({bool requestPermission = true}) async {
    if (_subscription != null) return;
    await _initTracking(requestPermission);
  }

  Future<void> _initTracking(bool requestPermission) async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw const LocationTrackingException(
        LocationTrackingIssue.servicesDisabled,
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied && requestPermission) {
      permission = await Geolocator.requestPermission();
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

    // 1. Try to get last known position immediately
    try {
      final lastKnown = await Geolocator.getLastKnownPosition();
      if (lastKnown != null) {
        _lastPosition = lastKnown;
        await _send(lastKnown);
      }
    } catch (_) {}

    // 2. Start continuous position stream
    try {
      _subscription = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
        ),
      ).listen(
        (pos) {
          _lastPosition = pos;
          _send(pos);
        },
        onError: (Object error) {
          debugPrint('Location tracking stream error: $error');
        },
      );
    } catch (e) {
      debugPrint('Error starting position stream: $e');
    }

    // 3. Attempt current position fix if we don't have lastKnown
    if (_lastPosition == null) {
      try {
        final current = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
            timeLimit: Duration(seconds: 6),
          ),
        );
        _lastPosition = current;
        await _send(current);
      } catch (e) {
        debugPrint('Initial current position notice: $e');
      }
    }
  }

  Future<void> _send(Position position) => TechnicianService.instance
      .updateLocation(lat: position.latitude, lng: position.longitude);

  Future<void> stop() async {
    await _subscription?.cancel();
    _subscription = null;
  }
}
