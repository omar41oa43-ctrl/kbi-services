import 'dart:async';
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../utils/job_utils.dart';

class JobDecisionAlreadyRecordedException implements Exception {
  const JobDecisionAlreadyRecordedException(this.currentStatus);

  /// The normalized server-side workflow status returned with HTTP 409.
  final String? currentStatus;

  @override
  String toString() => 'JobDecisionAlreadyRecordedException($currentStatus)';
}

class TechnicianService {
  static final TechnicianService instance = TechnicianService._();
  TechnicianService._();

  String? get uid => FirebaseAuth.instance.currentUser?.uid;

  Future<void> signOut() => FirebaseAuth.instance.signOut();

  Future<void> registerTechnician(Map<String, dynamic> data) async {
    final u = uid;
    if (u == null) throw Exception("User not logged in");

    final batch = FirebaseFirestore.instance.batch();
    batch.set(
        FirebaseFirestore.instance.collection('users').doc(u),
        {
          'role': 'technician',
          'updatedAt': FieldValue.serverTimestamp(),
        },
        SetOptions(merge: true));
    batch.set(
        FirebaseFirestore.instance.collection('technician_requests').doc(u),
        {
          'userId': u,
          ...data,
          'updatedAt': FieldValue.serverTimestamp(),
        },
        SetOptions(merge: true));
    await batch.commit();
  }

  Future<void> respondToOffer({
    required String requestId,
    required String decision,
  }) async {
    if (uid == null) throw Exception("User not logged in");
    final status = decision.toLowerCase() == 'accept' ? 'Accepted' : 'Rejected';
    await updateJobStatus(
      requestId: requestId,
      status: status,
      notes: status == 'Accepted'
          ? 'Job accepted by technician.'
          : 'Job declined by technician.',
    );
  }

  Future<void> updateJobStatus({
    required String requestId,
    required String status,
    String? notes,
    Map<String, dynamic>? workflowData,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception("User not logged in");
    final response = await _sendAuthorizedRequest(
      user: user,
      method: 'POST',
      uri: Uri.parse(
          '${AppConfig.apiBaseUrl}/api/technician/jobs/${Uri.encodeComponent(requestId)}/decision'),
      body: {
        'status': status,
        'notes': notes,
        if (workflowData != null) 'workflowData': workflowData,
      },
      timeout: const Duration(seconds: 15),
    );
    final responseBody = response.body.isNotEmpty
        ? jsonDecode(response.body) as Map<String, dynamic>
        : const <String, dynamic>{};
    if (response.statusCode == 409) {
      final rawStatus = responseBody['currentStatus'];
      throw JobDecisionAlreadyRecordedException(
        rawStatus is String && rawStatus.trim().isNotEmpty
            ? rawStatus.trim()
            : null,
      );
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(responseBody['error'] ??
          'Unable to update order (${response.statusCode})');
    }
  }

  Future<void> completeJob({
    required String requestId,
    required double finalPrice,
    required String notes,
    required String paymentMethod,
    required List<String> photos,
  }) async {
    await _authorizedRequest(
      path: '/api/technician/jobs/${Uri.encodeComponent(requestId)}/complete',
      body: {
        'finalPrice': finalPrice,
        'notes': notes,
        'paymentMethod': paymentMethod,
        'photos': photos,
      },
    );
  }

  Future<void> addJobNote(
      {required String requestId, required String note}) async {
    await _authorizedRequest(
      path: '/api/technician/jobs/${Uri.encodeComponent(requestId)}/notes',
      body: {'note': note},
    );
  }

  Future<void> requestActivation() => _authorizedRequest(
        path: '/api/technician/activation',
        body: const {'channel': 'app'},
      );

  Future<void> deleteAccount() => _authorizedRequest(
        path: '/api/technician/account',
        method: 'DELETE',
      );

  Future<void> updateNotificationToken({
    required String? token,
    required bool enabled,
  }) =>
      _authorizedRequest(
        path: '/api/technician/fcm-token',
        body: {'token': token, 'enabled': enabled},
      );

  Future<String> getRatingLink({required String requestId}) async {
    final decoded = await _authorizedJsonRequest(
      path:
          '/api/technician/jobs/${Uri.encodeComponent(requestId)}/rating-link',
      method: 'GET',
    );
    final url = decoded['url']?.toString().trim() ?? '';
    if (!url.startsWith('https://')) {
      throw Exception('Unable to create the customer rating link');
    }
    return url;
  }

  Future<List<Map<String, dynamic>>> getParts() async {
    final decoded = await _authorizedJsonRequest(
      path: '/api/technician/parts',
      method: 'GET',
    );
    final rawParts = decoded['parts'];
    if (rawParts is! List) return const [];
    return rawParts
        .whereType<Map>()
        .map((part) => Map<String, dynamic>.from(part))
        .toList();
  }

  Future<void> allocatePart({
    required String partId,
    required String orderId,
    int quantity = 1,
  }) =>
      _authorizedRequest(
        path: '/api/technician/parts',
        body: {
          'partId': partId,
          'orderId': orderId,
          'quantity': quantity,
        },
      );

  Future<void> saveInvoice({
    required String requestId,
    required Map<String, dynamic> invoice,
  }) =>
      _authorizedRequest(
        path: '/api/technician/jobs/${Uri.encodeComponent(requestId)}/invoice',
        body: {'invoice': invoice},
      );

  Future<void> _authorizedRequest({
    required String path,
    String method = 'POST',
    Map<String, dynamic>? body,
  }) async {
    await _authorizedJsonRequest(path: path, method: method, body: body);
  }

  Future<Map<String, dynamic>> _authorizedJsonRequest({
    required String path,
    String method = 'POST',
    Map<String, dynamic>? body,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception('User not logged in');
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$path');
    final response = await _sendAuthorizedRequest(
      user: user,
      method: method,
      uri: uri,
      body: body,
      timeout: const Duration(seconds: 20),
    );
    final decoded = response.body.isEmpty
        ? const <String, dynamic>{}
        : jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
          decoded['error'] ?? 'Request failed (${response.statusCode})');
    }
    return decoded;
  }

  Future<http.Response> _sendAuthorizedRequest({
    required User user,
    required String method,
    required Uri uri,
    required Duration timeout,
    Map<String, dynamic>? body,
  }) async {
    Future<http.Response> send({required bool forceRefresh}) async {
      final token = await user.getIdToken(forceRefresh);
      if (token == null || token.isEmpty) {
        throw Exception('Session expired. Please sign in again.');
      }
      final headers = {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      };
      return switch (method.toUpperCase()) {
        'GET' => http.get(uri, headers: headers).timeout(timeout),
        'DELETE' => http.delete(uri, headers: headers).timeout(timeout),
        _ => http
            .post(uri, headers: headers, body: jsonEncode(body ?? const {}))
            .timeout(timeout),
      };
    }

    var response = await send(forceRefresh: false);
    if (response.statusCode == 401) {
      response = await send(forceRefresh: true);
    }
    return response;
  }

  Future<void> updateLocation({
    required double lat,
    required double lng,
    required double accuracy,
    required double speed,
    required double heading,
  }) async {
    final u = uid;
    if (u == null ||
        !lat.isFinite ||
        !lng.isFinite ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180 ||
        (lat == 0 && lng == 0)) {
      return;
    }
    final safeAccuracy = accuracy.isFinite && accuracy >= 0 ? accuracy : 0.0;
    final safeSpeed = speed.isFinite && speed >= 0 ? speed : 0.0;
    final safeHeading = heading.isFinite && heading >= 0 ? heading : 0.0;
    try {
      await FirebaseFirestore.instance.collection('technicians').doc(u).set({
        'latitude': lat,
        'longitude': lng,
        'location': {
          'lat': lat,
          'lng': lng,
          'accuracy': safeAccuracy,
          'speed': safeSpeed,
          'heading': safeHeading,
          'source': 'device_gps',
          'capturedAt': FieldValue.serverTimestamp(),
        },
        'accuracy': safeAccuracy,
        'speed': safeSpeed,
        'heading': safeHeading,
        'locationUpdatedAt': FieldValue.serverTimestamp(),
        'lastActive': FieldValue.serverTimestamp(),
        'locationSource': 'device_gps',
        'isTrackingActive': true,
      }, SetOptions(merge: true));
    } catch (e) {
      debugPrint('Direct location update error: $e');
    }
    // Attempt cloud function in background if deployed
    try {
      final callable = FirebaseFunctions.instance.httpsCallable(
        'technicianUpdateLocation',
        options: HttpsCallableOptions(timeout: const Duration(seconds: 2)),
      );
      unawaited(() async {
        try {
          await callable.call({'lat': lat, 'lng': lng});
        } catch (_) {}
      }());
    } catch (_) {}
  }

  Future<void> updateLocationTrackingState({
    String? permissionStatus,
    bool? servicesEnabled,
    required bool trackingActive,
    String? issue,
  }) async {
    final u = uid;
    if (u == null) return;
    try {
      await FirebaseFirestore.instance.collection('technicians').doc(u).set({
        if (permissionStatus != null)
          'locationPermissionStatus': permissionStatus,
        if (servicesEnabled != null) 'locationServicesEnabled': servicesEnabled,
        'isTrackingActive': trackingActive,
        'locationTrackingIssue': issue ?? FieldValue.delete(),
        'locationPermissionUpdatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } catch (error) {
      debugPrint('Location permission status update error: $error');
    }
  }

  /// Refreshes the technician's online presence without inventing a new GPS
  /// coordinate. The explicit availability fields remain authoritative.
  Future<void> updateLocationPresence() async {
    final u = uid;
    if (u == null) return;
    try {
      await FirebaseFirestore.instance.collection('technicians').doc(u).set({
        'lastActive': FieldValue.serverTimestamp(),
        'presenceUpdatedAt': FieldValue.serverTimestamp(),
        'isTrackingActive': true,
      }, SetOptions(merge: true));
    } catch (error) {
      debugPrint('Location presence heartbeat error: $error');
    }
  }

  /// Statuses that mean "waiting for this technician to accept".
  ///
  /// Firestore equality is case-sensitive and different writers have used
  /// different casing, so match against every spelling in use rather than a
  /// single literal — a mismatch here silently hides jobs from the technician.
  static const _offerStatuses = <String>[
    'Assigned',
    'assigned',
    'Pending',
    'pending',
    'Pending Acceptance',
    'pending acceptance',
  ];

  static DateTime? extractDocDate(Map<String, dynamic>? data) {
    if (data == null) return null;
    final val = data['updatedAt'] ??
        data['completedAt'] ??
        data['createdAt'] ??
        data['timestamp'] ??
        data['date'];
    if (val is Timestamp) return val.toDate();
    if (val is DateTime) return val;
    if (val is String) return DateTime.tryParse(val);
    if (val is int) return DateTime.fromMillisecondsSinceEpoch(val);
    return null;
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchAssignedOffers() {
    final u = uid;
    if (u == null) {
      return const Stream.empty();
    }
    return FirebaseFirestore.instance
        .collection('bookings')
        .where('assignedTechnician', isEqualTo: u)
        .where('status', whereIn: _offerStatuses)
        .snapshots();
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchMyJobs() {
    final u = uid;
    if (u == null) {
      return const Stream.empty();
    }
    return FirebaseFirestore.instance
        .collection('bookings')
        .where('assignedTechnician', isEqualTo: u)
        .snapshots();
  }

  /// Unified real-time stream that watches both `bookings` and `orders`
  /// collections for any work order assigned to this technician.
  /// Deduplicates and sorts by date descending.
  Stream<List<DocumentSnapshot<Map<String, dynamic>>>> watchMyJobDocs() {
    final u = uid;
    if (u == null) {
      return const Stream.empty();
    }

    final controller = StreamController<
        List<DocumentSnapshot<Map<String, dynamic>>>>.broadcast();
    final queryErrors = <String, Object>{};
    final docsByQuery =
        <String, List<DocumentSnapshot<Map<String, dynamic>>>>{};

    void emitMerged() {
      final mergedDocs = <DocumentSnapshot<Map<String, dynamic>>>[];
      final mergedAliases = <Set<String>>[];

      int documentUsefulness(Map<String, dynamic>? data) {
        if (data == null) return 0;
        var score = 0;
        for (final key in const [
          'orderNumber',
          'trackingCode',
          'orderId',
          'bookingId',
          'customerName',
          'clientName',
          'customerPhone',
          'device',
          'deviceModel',
          'devices',
          'service',
          'serviceType',
          'issue',
          'description',
          'address',
          'location',
        ]) {
          final value = data[key];
          if (value == null) continue;
          if (value is String && value.trim().isEmpty) continue;
          if (value is Iterable && value.isEmpty) continue;
          if (value is Map && value.isEmpty) continue;
          score++;
        }
        return score;
      }

      DocumentSnapshot<Map<String, dynamic>> mostUseful(
        DocumentSnapshot<Map<String, dynamic>> current,
        DocumentSnapshot<Map<String, dynamic>> next,
      ) {
        final currentStatus =
            (current.data()?['status'] ?? '').toString().toLowerCase();
        final nextStatus =
            (next.data()?['status'] ?? '').toString().toLowerCase();
        final currentCompleted = isJobCompleted(currentStatus);
        final nextCompleted = isJobCompleted(nextStatus);
        if (nextCompleted && !currentCompleted) {
          return next;
        }
        if (currentCompleted && !nextCompleted) return current;
        final currentUsefulness = documentUsefulness(current.data());
        final nextUsefulness = documentUsefulness(next.data());
        if (nextUsefulness > currentUsefulness) {
          return next;
        }
        if (currentUsefulness > nextUsefulness) return current;
        final currentDate = extractDocDate(current.data());
        final nextDate = extractDocDate(next.data());
        if (currentDate == null ||
            (nextDate != null && nextDate.isAfter(currentDate))) {
          return next;
        }
        return current;
      }

      void addMostUseful(DocumentSnapshot<Map<String, dynamic>> doc) {
        final aliases = jobIdentityAliases(
          doc.data() ?? const <String, dynamic>{},
          documentId: doc.id,
        );
        final matches = <int>[];
        for (var index = 0; index < mergedAliases.length; index++) {
          if (aliases.any(mergedAliases[index].contains)) matches.add(index);
        }

        if (matches.isEmpty) {
          mergedDocs.add(doc);
          mergedAliases.add({...aliases});
          return;
        }

        final primary = matches.first;
        mergedDocs[primary] = mostUseful(mergedDocs[primary], doc);
        mergedAliases[primary].addAll(aliases);

        // Merge every transitive alias group as well. This covers a legacy
        // record linked by document ID to one copy and by order number to
        // another copy without leaving a third duplicate behind.
        for (final index in matches.skip(1).toList().reversed) {
          mergedDocs[primary] =
              mostUseful(mergedDocs[primary], mergedDocs[index]);
          mergedAliases[primary].addAll(mergedAliases[index]);
          mergedDocs.removeAt(index);
          mergedAliases.removeAt(index);
        }
      }

      for (final docs in docsByQuery.values) {
        for (final doc in docs) {
          addMostUseful(doc);
        }
      }
      final list = [...mergedDocs];
      list.sort((a, b) {
        final aDate = extractDocDate(a.data());
        final bDate = extractDocDate(b.data());
        if (aDate == null && bDate == null) return 0;
        if (aDate == null) return 1;
        if (bDate == null) return -1;
        return bDate.compareTo(aDate);
      });
      if (!controller.isClosed) {
        controller.add(list);
      }
    }

    final subscriptions =
        <StreamSubscription<QuerySnapshot<Map<String, dynamic>>>>[];

    void subscribeToAssignment({
      required String collectionName,
      required String field,
      required bool isArray,
    }) {
      final queryKey = '$collectionName:$field';
      final collection = FirebaseFirestore.instance.collection(collectionName);
      final query = isArray
          ? collection.where(field, arrayContains: u)
          : collection.where(field, isEqualTo: u);

      subscriptions.add(query.snapshots().listen((snapshot) {
        queryErrors.remove(queryKey);
        docsByQuery[queryKey] = snapshot.docs;
        emitMerged();
      }, onError: (Object error) {
        // Each legacy assignment shape is isolated so one unsupported filter
        // can never take the technician's entire live order feed offline.
        debugPrint('$collectionName/$field subscription notice: $error');
        queryErrors[queryKey] = error;
        docsByQuery[queryKey] = const [];
        if (queryErrors.length == 12) {
          if (!controller.isClosed) controller.addError(error);
        } else {
          emitMerged();
        }
      }));
    }

    controller.onListen = () {
      docsByQuery.clear();
      queryErrors.clear();
      subscriptions.clear();

      for (final collectionName in const ['bookings', 'orders']) {
        for (final field in const [
          'assignedTechnician',
          'assignedTechnicianId',
          'technicianId',
          'techId',
        ]) {
          subscribeToAssignment(
            collectionName: collectionName,
            field: field,
            isArray: false,
          );
        }
        for (final field in const [
          'assignedTechnicians',
          'technicianIds',
        ]) {
          subscribeToAssignment(
            collectionName: collectionName,
            field: field,
            isArray: true,
          );
        }
      }
    };

    controller.onCancel = () {
      for (final subscription in subscriptions) {
        subscription.cancel();
      }
      subscriptions.clear();
      docsByQuery.clear();
    };

    return controller.stream;
  }

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchMyTechDoc() {
    final u = uid;
    if (u == null) {
      return const Stream.empty();
    }
    return FirebaseFirestore.instance
        .collection('technicians')
        .doc(u)
        .snapshots();
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchMyPayments() {
    final u = uid;
    if (u == null) {
      return const Stream.empty();
    }
    return FirebaseFirestore.instance
        .collection('payments')
        .where('techId', isEqualTo: u)
        .orderBy('createdAt', descending: true)
        .limit(100)
        .snapshots();
  }

  Future<void> refreshMyJobs() async {
    final u = uid;
    if (u == null) throw Exception("User not logged in");
    await FirebaseFirestore.instance
        .collection('bookings')
        .where('assignedTechnician', isEqualTo: u)
        .limit(100)
        .get(const GetOptions(source: Source.server));
  }
}
