import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/service_request.dart';
import '../i18n.dart';

class JobDetailsScreen extends StatelessWidget {
  final ServiceRequestModel job;

  const JobDetailsScreen({super.key, required this.job});

  @override
  Widget build(BuildContext context) {
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    final hasCoords = (job.lat != null && job.lng != null && (job.lat != 0 || job.lng != 0));
    final point = hasCoords ? LatLng(job.lat!, job.lng!) : null;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(title: Text(t(context, 'details'))),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(job.type, style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 6),
                    Text(job.description),
                    const SizedBox(height: 10),
                    Text('Status: ${job.status}', style: const TextStyle(color: Colors.white70)),
                    if (job.orderId != null) ...[
                      const SizedBox(height: 6),
                      Text('Order: ${job.orderId}', style: const TextStyle(color: Colors.white54)),
                    ],
                    if (job.address != null && job.address!.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text(job.address!, style: const TextStyle(color: Colors.white70)),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            if (point != null)
              SizedBox(
                height: 320,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: GoogleMap(
                    initialCameraPosition: CameraPosition(target: point, zoom: 14),
                    markers: {Marker(markerId: const MarkerId('job'), position: point)},
                    myLocationButtonEnabled: true,
                    zoomControlsEnabled: false,
                  ),
                ),
              )
            else
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('Map unavailable', style: Theme.of(context).textTheme.bodyMedium),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

