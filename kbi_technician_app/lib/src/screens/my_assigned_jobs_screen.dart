import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../models/service_request.dart';
import '../services/technician_service.dart';
import '../utils/job_utils.dart';
import 'job_details_screen.dart';

class MyAssignedJobsScreen extends StatelessWidget {
  const MyAssignedJobsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: const Color(0xF2FFFFFF),
        appBar: AppBar(
          backgroundColor: const Color(0xF2FFFFFF),
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded,
                color: Colors.black, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text(
            'My Assigned Jobs',
            style: TextStyle(
                color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18),
          ),
          centerTitle: true,
          bottom: const TabBar(
            isScrollable: true,
            indicatorColor: Color(0xFF111318),
            labelColor: Color(0xFF111318),
            unselectedLabelColor: Colors.black45,
            indicatorWeight: 3,
            tabs: [
              Tab(text: 'Pending'),
              Tab(text: 'In Progress'),
              Tab(text: 'Scheduled'),
              Tab(text: 'Completed'),
            ],
          ),
        ),
        body: StreamBuilder<List<DocumentSnapshot<Map<String, dynamic>>>>(
          stream: TechnicianService.instance.watchMyJobDocs(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                  child: CircularProgressIndicator(color: Color(0xFF111318)));
            }
            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Text(
                    'Assigned jobs could not be loaded.\n${snapshot.error}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.black54),
                  ),
                ),
              );
            }

            final docs = snapshot.data ?? [];

            // Map and group jobs by status
            final pendingJobs = <DocumentSnapshot<Map<String, dynamic>>>[];
            final inProgressJobs =
                <DocumentSnapshot<Map<String, dynamic>>>[];
            final scheduledJobs =
                <DocumentSnapshot<Map<String, dynamic>>>[];
            final completedJobs =
                <DocumentSnapshot<Map<String, dynamic>>>[];

            for (final doc in docs) {
              final data = doc.data();
              if (data == null) continue;
              final status = normalizeJobStatus(data['status']);
              if (status == 'assigned' ||
                  status == 'pending' ||
                  status == 'pending acceptance') {
                pendingJobs.add(doc);
              } else if ({'accepted', 'on the way', 'arrived', 'in progress'}
                  .contains(status)) {
                inProgressJobs.add(doc);
              } else if (status == 'scheduled') {
                scheduledJobs.add(doc);
              } else if (status == 'completed') {
                completedJobs.add(doc);
              }
            }

            return TabBarView(
              children: [
                _buildJobsList(
                    context, pendingJobs, 'No pending jobs assigned.'),
                _buildJobsList(
                    context, inProgressJobs, 'No active jobs in progress.'),
                _buildJobsList(
                    context, scheduledJobs, 'No scheduled jobs found.'),
                _buildJobsList(
                    context, completedJobs, 'No completed jobs found.'),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildJobsList(
    BuildContext context,
    List<DocumentSnapshot<Map<String, dynamic>>> jobs,
    String emptyMessage,
  ) {
    if (jobs.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.assignment_outlined,
                size: 48, color: Colors.black12),
            const SizedBox(height: 12),
            Text(
              emptyMessage,
              style: const TextStyle(color: Colors.black45, fontSize: 14),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: jobs.length,
      itemBuilder: (context, index) {
        final doc = jobs[index];
        final data = doc.data() ?? <String, dynamic>{};
        final jobModel = ServiceRequestModel.fromDoc(doc);

        final rawId = jobModel.orderId ?? jobModel.id;
        final displayId = rawId.length > 5 ? rawId.substring(0, 5) : rawId;
        final jobId = 'KBI-${displayId.toUpperCase()}';
        final customerName =
            data['clientName'] ?? data['customerName'] ?? 'Not provided';
        final service = jobModel.type;
        final device = data['device'] ?? 'Not provided';
        final priority = data['priority'] ?? 'Normal';
        final appointmentTime = data['appointmentTime'] ?? 'Not provided';
        final distance = data['distance'] ?? 'Not provided';
        final address = jobModel.address?.isNotEmpty == true
            ? jobModel.address!
            : 'Not provided';
        final status = jobModel.status;

        // Priority Color badge
        Color priorityColor = Colors.orangeAccent;
        if (priority.toLowerCase() == 'high' ||
            priority.toLowerCase() == 'critical') {
          priorityColor = Colors.redAccent;
        } else if (priority.toLowerCase() == 'low') {
          priorityColor = Colors.greenAccent;
        }

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF111318),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
            border: Border.all(
              color: Colors.transparent,
              width: 1.2,
            ),
            boxShadow: const [
              BoxShadow(
                color: Colors.transparent,
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // HEADER ROW (Job ID & Status)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    jobId,
                    style: const TextStyle(
                        color: Color(0xFF111318),
                        fontWeight: FontWeight.bold,
                        fontSize: 15),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF111318).withValues(alpha: 0.08),
                      borderRadius: const BorderRadius.all(Radius.circular(24)),
                      border: Border.all(
                          color:
                              const Color(0xFF111318).withValues(alpha: 0.2)),
                    ),
                    child: Text(
                      status.toUpperCase(),
                      style: const TextStyle(
                          color: Color(0xFF111318),
                          fontSize: 10,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // DETAILS ROWS
              _buildDetailItem(
                  Icons.person_outline_rounded, 'Customer', customerName),
              _buildDetailItem(Icons.construction_outlined, 'Service', service),
              _buildDetailItem(Icons.devices_other_outlined, 'Device', device),

              Row(
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Icon(Icons.label_important_outline_rounded,
                            color: priorityColor, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          priority,
                          style: TextStyle(
                              color: priorityColor,
                              fontSize: 12.5,
                              fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: _buildDetailItem(
                        Icons.access_time_rounded, 'Time', appointmentTime),
                  ),
                ],
              ),

              _buildDetailItem(Icons.navigation_outlined, 'Distance', distance),
              _buildDetailItem(Icons.location_on_outlined, 'Address', address),

              const SizedBox(height: 18),

              // VIEW DETAILS BUTTON
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) => JobDetailsScreen(job: jobModel)),
                    );
                  },
                  icon: const Icon(Icons.visibility_outlined, size: 18),
                  label: const Text('View Details',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF111318),
                    foregroundColor: Colors.white,
                    shape: const RoundedRectangleBorder(
                        borderRadius: BorderRadius.all(Radius.circular(24))),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailItem(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.black38, size: 16),
          const SizedBox(width: 8),
          Text(
            '$label: ',
            style: const TextStyle(color: Colors.black38, fontSize: 12.5),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 12.5,
                  fontWeight: FontWeight.w500),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
