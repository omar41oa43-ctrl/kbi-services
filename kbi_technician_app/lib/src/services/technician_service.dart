import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';

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
    List<DocumentSnapshot<Map<String, dynamic>>> bookingsDocs = [];
    List<DocumentSnapshot<Map<String, dynamic>>> ordersDocs = [];

    void emitMerged() {
      final map = <String, DocumentSnapshot<Map<String, dynamic>>>{};

      void addMostUseful(DocumentSnapshot<Map<String, dynamic>> doc) {
        final current = map[doc.id];
        if (current == null) {
          map[doc.id] = doc;
          return;
        }
        final currentStatus =
            (current.data()?['status'] ?? '').toString().toLowerCase();
        final nextStatus =
            (doc.data()?['status'] ?? '').toString().toLowerCase();
        final currentCompleted =
            const {'completed', 'delivered', 'done'}.contains(currentStatus);
        final nextCompleted =
            const {'completed', 'delivered', 'done'}.contains(nextStatus);
        if (nextCompleted && !currentCompleted) {
          map[doc.id] = doc;
          return;
        }
        if (currentCompleted && !nextCompleted) return;
        final currentDate = extractDocDate(current.data());
        final nextDate = extractDocDate(doc.data());
        if (currentDate == null ||
            (nextDate != null && nextDate.isAfter(currentDate))) {
          map[doc.id] = doc;
        }
      }

      for (final doc in bookingsDocs) {
        addMostUseful(doc);
      }
      for (final doc in ordersDocs) {
        addMostUseful(doc);
      }
      final list = map.values.toList();
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

    StreamSubscription? subBookings;
    StreamSubscription? subOrders;

    controller.onListen = () {
      subBookings = FirebaseFirestore.instance
          .collection('bookings')
          .where(
            Filter.or(
              Filter('assignedTechnician', isEqualTo: u),
              Filter('assignedTechnicianId', isEqualTo: u),
              Filter('technicianId', isEqualTo: u),
              Filter('techId', isEqualTo: u),
              Filter('assignedTechnicians', arrayContains: u),
              Filter('technicianIds', arrayContains: u),
            ),
          )
          .snapshots()
          .listen((snap) {
        bookingsDocs = snap.docs;
        emitMerged();
      }, onError: (err) {
        debugPrint('Bookings filter notice: $err');
        FirebaseFirestore.instance
            .collection('bookings')
            .where('assignedTechnician', isEqualTo: u)
            .snapshots()
            .listen((fallbackSnap) {
          bookingsDocs = fallbackSnap.docs;
          emitMerged();
        });
      });

      subOrders = FirebaseFirestore.instance
          .collection('orders')
          .where(
            Filter.or(
              Filter('assignedTechnician', isEqualTo: u),
              Filter('assignedTechnicianId', isEqualTo: u),
              Filter('technicianId', isEqualTo: u),
              Filter('techId', isEqualTo: u),
              Filter('assignedTechnicians', arrayContains: u),
              Filter('technicianIds', arrayContains: u),
            ),
          )
          .snapshots()
          .listen((snap) {
        ordersDocs = snap.docs;
        emitMerged();
      }, onError: (err) {
        debugPrint('Orders filter notice: $err');
        FirebaseFirestore.instance
            .collection('orders')
            .where('assignedTechnician', isEqualTo: u)
            .snapshots()
            .listen((fallbackSnap) {
          ordersDocs = fallbackSnap.docs;
          emitMerged();
        });
      });
    };

    controller.onCancel = () {
      subBookings?.cancel();
      subOrders?.cancel();
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
