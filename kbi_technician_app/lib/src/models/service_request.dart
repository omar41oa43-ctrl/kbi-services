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
  final String? customerName;
  final String? customerPhone;
  final String? serviceName;
  final String? deviceName;
  final double? totalAmount;
  final String? collectionName;

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
    this.customerName,
    this.customerPhone,
    this.serviceName,
    this.deviceName,
    this.totalAmount,
    this.collectionName,
  });

  static double? _toCoord(Object? value) {
    if (value is num) {
      final d = value.toDouble();
      return d.isFinite ? d : null;
    }
    if (value is String) return double.tryParse(value.trim());
    return null;
  }

  static String resolveOrderReference(
      Map<String, dynamic> data, String documentId) {
    return (data['orderNumber'] ??
            data['trackingCode'] ??
            data['orderId'] ??
            data['bookingId'] ??
            documentId)
        .toString()
        .trim();
  }

  static String resolveDescription(
    Map<String, dynamic> data, {
    required String device,
    required String issue,
  }) {
    for (final key in ['problemDescription', 'notes', 'description']) {
      final value = data[key]?.toString().trim() ?? '';
      if (value.isNotEmpty) return value;
    }
    if (device.isNotEmpty && issue.isNotEmpty) return '$device - $issue';
    return device.isNotEmpty ? device : issue;
  }

  factory ServiceRequestModel.fromDoc(
      DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? {};
    final isBooking = d.containsKey('bookingId') || d.containsKey('service');
    final collection = doc.reference.parent.id;

    // Coordinates arrive in three shapes depending on the writer: the website
    // booking flow writes a `location` map, dispatch writes flat
    // latitude/longitude, and older records use a GeoPoint.
    double? lat;
    double? lng;
    if (d['location'] is Map) {
      final locMap = d['location'] as Map;
      lat = _toCoord(locMap['lat'] ?? locMap['latitude']);
      lng = _toCoord(locMap['lng'] ?? locMap['longitude']);
    } else if (d['location'] is GeoPoint) {
      final gp = d['location'] as GeoPoint;
      lat = gp.latitude;
      lng = gp.longitude;
    }
    lat ??= _toCoord(d['latitude'] ?? d['lat']);
    lng ??= _toCoord(d['longitude'] ?? d['lng']);

    // A 0/0 pair is a placeholder written by older booking records, not a real
    // position in the Gulf of Guinea. Treat it as absent so the UI can say so.
    if (lat == 0 && lng == 0) {
      lat = null;
      lng = null;
    }

    final custName =
        (d['customerName'] ?? d['clientName'] ?? d['name'])?.toString();
    final custPhone =
        (d['customerPhone'] ?? d['clientPhone'] ?? d['phone'])?.toString();
    final rawAmt = d['totalAmount'] ?? d['amount'] ?? d['price'] ?? d['total'];
    final totAmt = rawAmt is num ? rawAmt.toDouble() : null;

    if (isBooking) {
      final bookingId = resolveOrderReference(d, doc.id);
      final device = (d['device'] ?? '').toString();
      final issue = (d['issue'] ?? '').toString();
      final service =
          (d['service'] ?? d['serviceType'] ?? '').toString().isEmpty
              ? device
              : (d['service'] ?? d['serviceType']).toString();
      final desc = resolveDescription(d, device: device, issue: issue);

      final assignedTech = d['assignedTechnician']?.toString();
      final status = (d['status'] ?? '').toString();
      final address = (d['address'] ?? '').toString();

      return ServiceRequestModel(
        id: doc.id,
        type: service,
        description: desc,
        status: status,
        technicianId: assignedTech,
        offers: assignedTech != null && status.toLowerCase() == 'assigned'
            ? [assignedTech]
            : const [],
        assignedTo: assignedTech != null ? [assignedTech] : const [],
        lat: lat,
        lng: lng,
        address: address,
        orderId: bookingId,
        customerName: custName,
        customerPhone: custPhone,
        serviceName: service,
        deviceName: device.isEmpty ? null : device,
        totalAmount: totAmt,
        collectionName: collection,
      );
    }

    final offersRaw = d['offers'];
    final List<String> offers = offersRaw is List
        ? offersRaw.map((e) => e.toString()).toList()
        : const [];

    final assignedToRaw = d['assignedTo'];
    final List<String> assignedTo = assignedToRaw is List
        ? assignedToRaw.map((e) => e.toString()).toList()
        : const [];

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
      address: d['location'] is Map
          ? (d['location'] as Map)['address']?.toString() ??
              d['address']?.toString()
          : d['address']?.toString(),
      orderId: resolveOrderReference(d, doc.id),
      customerName: custName,
      customerPhone: custPhone,
      serviceName: d['type']?.toString(),
      deviceName: (d['device'] ?? d['deviceModel'])?.toString(),
      totalAmount: totAmt,
      collectionName: collection,
    );
  }

  ServiceRequestModel copyWith({
    String? id,
    String? type,
    String? description,
    String? status,
    String? technicianId,
    List<String>? offers,
    List<String>? assignedTo,
    double? lat,
    double? lng,
    String? address,
    String? orderId,
    String? customerName,
    String? customerPhone,
    String? serviceName,
    String? deviceName,
    double? totalAmount,
    String? collectionName,
  }) {
    return ServiceRequestModel(
      id: id ?? this.id,
      type: type ?? this.type,
      description: description ?? this.description,
      status: status ?? this.status,
      technicianId: technicianId ?? this.technicianId,
      offers: offers ?? this.offers,
      assignedTo: assignedTo ?? this.assignedTo,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      address: address ?? this.address,
      orderId: orderId ?? this.orderId,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      serviceName: serviceName ?? this.serviceName,
      deviceName: deviceName ?? this.deviceName,
      totalAmount: totalAmount ?? this.totalAmount,
      collectionName: collectionName ?? this.collectionName,
    );
  }
}
