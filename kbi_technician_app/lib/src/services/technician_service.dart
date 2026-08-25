import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';

class TechnicianService {
  static final TechnicianService instance = TechnicianService._();
  TechnicianService._();

  String? get uid => FirebaseAuth.instance.currentUser?.uid;

  Future<void> signOut() => FirebaseAuth.instance.signOut();

  Future<void> registerTechnician(Map<String, dynamic> data) async {
    final u = uid;
    if (u == null) throw Exception("User not logged in");
    
    // Update role in users doc
    await FirebaseFirestore.instance.collection('users').doc(u).set({
      'role': 'technician',
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    // Save registration/draft data to technician_requests
    await FirebaseFirestore.instance.collection('technician_requests').doc(u).set({
      'userId': u,
      ...data,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<void> respondToOffer({
    required String requestId,
    required String decision,
  }) async {
    final callable = FirebaseFunctions.instance.httpsCallable('technicianRespondToOffer');
    await callable.call({'requestId': requestId, 'decision': decision});
  }

  Future<void> updateLocation({required double lat, required double lng}) async {
    final callable = FirebaseFunctions.instance.httpsCallable('technicianUpdateLocation');
    await callable.call({'lat': lat, 'lng': lng});
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchAssignedOffers() {
    final u = uid;
    if (u == null) {
      return const Stream.empty();
    }
    return FirebaseFirestore.instance
        .collection('service_requests')
        .where('offers', arrayContains: u)
        .snapshots();
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchMyJobs() {
    final u = uid;
    if (u == null) {
      return const Stream.empty();
    }
    return FirebaseFirestore.instance
        .collection('service_requests')
        .where('technicianId', isEqualTo: u)
        .snapshots();
  }

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchMyTechDoc() {
    final u = uid;
    if (u == null) {
      return const Stream.empty();
    }
    return FirebaseFirestore.instance.collection('technicians').doc(u).snapshots();
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchMyPayments() {
    final u = uid;
    if (u == null) {
      return const Stream.empty();
    }
    return FirebaseFirestore.instance.collection('payments').where('techId', isEqualTo: u).snapshots();
  }
}

