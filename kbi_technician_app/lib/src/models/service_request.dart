import 'package:cloud_firestore/cloud_firestore.dart';

class ServiceRequestModel {
  final String id;
  final String type;
  final String description;
  final String status;
  final String? technicianId;
  final List<String> offers;
  final List<String> assignedTo;
  final double? lat;
  final double? lng;
  final String? address;
  final String? orderId;

  ServiceRequestModel({
    required this.id,
    required this.type,
    required this.description,
    required this.status,
    required this.offers,
    required this.assignedTo,
    required this.technicianId,
    required this.lat,
    required this.lng,
    required this.address,
    required this.orderId,
  });

  factory ServiceRequestModel.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? {};
    final loc = (d['location'] as Map?)?.cast<String, dynamic>();
    final lat = (loc?['lat'] is num) ? (loc?['lat'] as num).toDouble() : null;
    final lng = (loc?['lng'] is num) ? (loc?['lng'] as num).toDouble() : null;
    final offers = (d['offers'] as List?)?.map((e) => e.toString()).toList() ?? const [];
    final assignedTo = (d['assignedTo'] as List?)?.map((e) => e.toString()).toList() ?? const [];
    return ServiceRequestModel(
      id: doc.id,
      type: (d['type'] ?? '').toString(),
      description: (d['description'] ?? '').toString(),
      status: (d['status'] ?? '').toString(),
      technicianId: d['technicianId']?.toString(),
      offers: offers,
      assignedTo: assignedTo,
      lat: lat,
      lng: lng,
      address: loc?['address']?.toString(),
      orderId: d['orderId']?.toString(),
    );
  }
}

