import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';

import '../utils/job_utils.dart';

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
  }) async {
    if (uid == null) throw Exception("User not logged in");
    try {
      await FirebaseFunctions.instance
          .httpsCallable('technicianUpdateJob')
          .call({
        'bookingId': requestId,
        'status': status,
        'notes': notes,
      });
    } catch (e) {
      debugPrint('Cloud function notice: $e. Using direct Firestore update.');
      final isAccepted = status.toLowerCase() == 'accepted';
      final isDone = status.toLowerCase() == 'completed' ||
          status.toLowerCase() == 'cancelled';
      final payload = <String, dynamic>{
        'status': status,
        if (notes != null && notes.isNotEmpty) 'technicianNotes': notes,
        if (isAccepted) 'acceptedAt': FieldValue.serverTimestamp(),
        if (isDone) 'completedAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      };

      try {
        await FirebaseFirestore.instance
            .collection('orders')
            .doc(requestId)
            .set(payload, SetOptions(merge: true));
      } catch (_) {}

      try {
        await FirebaseFirestore.instance
            .collection('bookings')
            .doc(requestId)
            .set(payload, SetOptions(merge: true));
      } catch (_) {}
    }
  }

  Future<void> completeJob({
    required String requestId,
    required double finalPrice,
    required String notes,
    required String paymentMethod,
    required List<String> photos,
  }) async {
    if (uid == null) throw Exception("User not logged in");
    try {
      await FirebaseFunctions.instance
          .httpsCallable('technicianCompleteJob')
          .call({
        'bookingId': requestId,
        'finalPrice': finalPrice,
        'notes': notes,
        'paymentMethod': paymentMethod,
        'photos': photos,
      });
    } catch (error) {
      debugPrint(
        'Complete-job cloud function notice: $error. Using Firestore fallback.',
      );
      final payload = <String, dynamic>{
        'status': 'Completed',
        'finalPrice': finalPrice,
        'finalAmount': finalPrice,
        'completionNotes': notes,
        'paymentMethod': paymentMethod,
        'completionPhotos': photos,
        'completedAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      };
      Object? lastError;
      var updated = false;
      for (final collection in const ['orders', 'bookings']) {
        try {
          await FirebaseFirestore.instance
              .collection(collection)
              .doc(requestId)
              .update(payload);
          updated = true;
        } catch (fallbackError) {
          lastError = fallbackError;
        }
      }
      if (!updated) {
        throw Exception('Could not save job completion: $lastError');
      }
    }
  }

  Future<void> addJobNote(
      {required String requestId, required String note}) async {
    if (uid == null) throw Exception("User not logged in");
    try {
      await FirebaseFunctions.instance
          .httpsCallable('technicianAddJobNote')
          .call({
        'bookingId': requestId,
        'note': note,
      });
    } catch (_) {
      try {
        await FirebaseFirestore.instance
            .collection('orders')
            .doc(requestId)
            .set({
          'technicianNotes': note,
          'updatedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      } catch (_) {}
    }
  }

  Future<void> updateLocation(
      {required double lat, required double lng}) async {
    final u = uid;
    if (u == null) return;
    try {
      await FirebaseFirestore.instance.collection('technicians').doc(u).set({
        'latitude': lat,
        'longitude': lng,
        'location': {'lat': lat, 'lng': lng},
        'locationUpdatedAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
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
        final currentCompleted =
            const {'completed', 'delivered', 'done'}.contains(currentStatus);
        final nextCompleted =
            const {'completed', 'delivered', 'done'}.contains(nextStatus);
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
        docsByQuery[queryKey] = snapshot.docs;
        emitMerged();
      }, onError: (Object error) {
        // Each legacy assignment shape is isolated so one unsupported filter
        // can never take the technician's entire live order feed offline.
        debugPrint('$collectionName/$field subscription notice: $error');
        docsByQuery[queryKey] = const [];
        emitMerged();
      }));
    }

    controller.onListen = () {
      docsByQuery.clear();
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
