import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart' hide TextDirection;
import 'package:url_launcher/url_launcher.dart';
import '../models/service_request.dart';
import '../services/technician_service.dart';
import 'job_details_screen.dart';

class DashboardScreen extends StatefulWidget {
  final Locale locale;
  final void Function(Locale) onLocaleChanged;

  const DashboardScreen({super.key, required this.onLocaleChanged, required this.locale});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isOnline = true;
  bool _updatingStatus = false;

  Future<void> _launchUrl(String urlString) async {
    final Uri url = Uri.parse(urlString);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _toggleOnlineOffline(bool value) async {
    setState(() {
      _updatingStatus = true;
    });
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid;
      if (uid != null) {
        await FirebaseFirestore.instance.collection('technicians').doc(uid).update({
          'isActive': value,
          'updatedAt': FieldValue.serverTimestamp(),
        });
        setState(() {
          _isOnline = value;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error updating status: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _updatingStatus = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    final user = FirebaseAuth.instance.currentUser;
    final String formattedDate = DateFormat('EEEE, MMM d, yyyy').format(DateTime.now());

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFF070A0E),
        body: SafeArea(
          child: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
            stream: TechnicianService.instance.watchMyTechDoc(),
            builder: (context, techSnap) {
              final techData = techSnap.data?.data();
              final String techName = techData?['name'] ?? user?.displayName ?? 'Technician';
              final String techId = techData?['techId'] ?? 'KBI-TECH-098';
              final double rating = (techData?['rating'] is num) ? (techData?['rating'] as num).toDouble() : 4.9;
              _isOnline = techData?['isActive'] ?? true;

              return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                stream: TechnicianService.instance.watchMyJobs(),
                builder: (context, jobsSnap) {
                  final myJobs = jobsSnap.data?.docs ?? [];
                  final activeJobs = myJobs.where((d) {
                    final status = d.data()['status'] ?? '';
                    return status != 'completed' && status != 'cancelled';
                  }).map((d) => ServiceRequestModel.fromDoc(d)).toList();

                  final completedJobs = myJobs.where((d) {
                    final status = d.data()['status'] ?? '';
                    return status == 'completed';
                  }).toList();

                  return SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // HEADER SECTION
                        _buildHeader(techName, techId, formattedDate),
                        const SizedBox(height: 20),

                        // ONLINE/OFFLINE TOGGLE PANEL
                        _buildOnlineTogglePanel(),
                        const SizedBox(height: 20),

                        // ACTIVE JOB NOTICE (If there's any active job)
                        if (activeJobs.isNotEmpty) ...[
                          _buildActiveJobBanner(activeJobs.first),
                          const SizedBox(height: 20),
                        ],

                        // QUICK STATS SUMMARY
                        _buildKpiSummary(activeJobs.length, completedJobs.length, rating),
                        const SizedBox(height: 24),

                        // QUICK ACTIONS
                        const Text(
                          'QUICK ACTIONS',
                          style: TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                        ),
                        const SizedBox(height: 12),
                        _buildQuickActionsGrid(activeJobs.firstOrNull),
                        const SizedBox(height: 24),

                        // PERFORMANCE CHARTS
                        const Text(
                          'PERFORMANCE METRICS',
                          style: TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                        ),
                        const SizedBox(height: 12),
                        _buildPerformanceMetricsSection(rating),
                        const SizedBox(height: 24),

                        // ACHIEVEMENTS
                        const Text(
                          'MY ACHIEVEMENTS',
                          style: TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                        ),
                        const SizedBox(height: 12),
                        _buildAchievementsRow(),
                        const SizedBox(height: 24),

                        // TODAY'S SCHEDULE
                        const Text(
                          'TODAY\'S SCHEDULE',
                          style: TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                        ),
                        const SizedBox(height: 12),
                        _buildScheduleTimeline(),
                        const SizedBox(height: 24),

                        // RECENT REVIEWS PREVIEW
                        const Text(
                          'LATEST CUSTOMER REVIEWS',
                          style: TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                        ),
                        const SizedBox(height: 12),
                        _buildRecentReviews(),
                        const SizedBox(height: 30),
                      ],
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(String name, String id, String date) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Good Morning, $name 👋',
              style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Text(
                  'ID: $id',
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.amberAccent.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.amberAccent.withOpacity(0.3)),
                  ),
                  child: const Text(
                    '🏆 GOLD PARTNER',
                    style: TextStyle(color: Colors.amberAccent, fontSize: 8, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              date,
              style: const TextStyle(color: Colors.white30, fontSize: 11),
            ),
          ],
        ),
        const CircleAvatar(
          radius: 26,
          backgroundColor: Color(0xFF1E2633),
          child: Text('🔧', style: TextStyle(fontSize: 22)),
        ),
      ],
    );
  }

  Widget _buildOnlineTogglePanel() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF0E131B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1E2633)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: _isOnline ? Colors.greenAccent : Colors.redAccent,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: (_isOnline ? Colors.greenAccent : Colors.redAccent).withOpacity(0.4),
                      blurRadius: 6,
                      spreadRadius: 2,
                    )
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _isOnline ? 'Online / Accepting Jobs' : 'Offline / On Break',
                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _isOnline ? 'You are visible to dispatch and clients' : 'Enable toggle to go back online',
                    style: const TextStyle(color: Colors.white38, fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
          _updatingStatus
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.cyanAccent),
                )
              : Switch(
                  value: _isOnline,
                  activeColor: Colors.cyanAccent,
                  activeTrackColor: Colors.cyanAccent.withOpacity(0.2),
                  inactiveThumbColor: Colors.white30,
                  inactiveTrackColor: const Color(0xFF161E2A),
                  onChanged: _toggleOnlineOffline,
                ),
        ],
      ),
    );
  }

  Widget _buildActiveJobBanner(ServiceRequestModel job) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.cyanAccent.withOpacity(0.08), const Color(0xFF0E131B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.cyanAccent.withOpacity(0.3), width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Text('⚡', style: TextStyle(fontSize: 16)),
                  SizedBox(width: 6),
                  Text(
                    'CURRENT ACTIVE JOB',
                    style: TextStyle(color: Colors.cyanAccent, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.orangeAccent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orangeAccent.withOpacity(0.3)),
                ),
                child: Text(
                  job.status.replaceAll('_', ' ').toUpperCase(),
                  style: const TextStyle(color: Colors.orangeAccent, fontSize: 8, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            job.description,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            job.address ?? 'Client Location',
            style: const TextStyle(color: Colors.white54, fontSize: 12),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.cyanAccent,
                    foregroundColor: Colors.black,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.of(context).push(MaterialPageRoute(builder: (_) => JobDetailsScreen(job: job)));
                  },
                  icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                  label: const Text('Open Navigation & Actions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildKpiSummary(int activeCount, int completedCount, double rating) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildStatCard('Active Jobs', activeCount.toString(), Icons.play_arrow_outlined, Colors.orangeAccent)),
            const SizedBox(width: 10),
            Expanded(child: _buildStatCard('Completed', completedCount.toString(), Icons.check_circle_outlined, Colors.greenAccent)),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(child: _buildStatCard('Total Rating', rating.toStringAsFixed(1), Icons.star_border_outlined, Colors.amberAccent)),
            const SizedBox(width: 10),
            Expanded(child: _buildStatCard('Accept Rate', '98%', Icons.percent_outlined, Colors.purpleAccent)),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0E131B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1E2633)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(value, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionsGrid(ServiceRequestModel? activeJob) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.3,
      children: [
        _buildActionButton('Accept Nearest', Icons.radar_outlined, Colors.cyanAccent, () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Scanning for nearest jobs...')),
          );
        }),
        _buildActionButton('Navigate Job', Icons.map_outlined, Colors.orangeAccent, () {
          if (activeJob != null) {
            _launchUrl('https://www.google.com/maps/dir/?api=1&destination=${activeJob.lat},${jobWrapperLatLng(activeJob)}');
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('No active job to navigate to.')),
            );
          }
        }),
        _buildActionButton('Withdraw Cash', Icons.account_balance_wallet_outlined, Colors.greenAccent, () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Earnings withdrawal request submitted.')),
          );
        }),
        _buildActionButton('Emergency help', Icons.sos_outlined, Colors.redAccent, () {
          _launchUrl('tel:+971509999999');
        }),
      ],
    );
  }

  String jobWrapperLatLng(ServiceRequestModel job) {
    return job.lng != null ? job.lng.toString() : '54.3773';
  }

  Widget _buildActionButton(String label, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF0E131B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF1E2633)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPerformanceMetricsSection(double rating) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0E131B),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF1E2633)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildPerformanceIndicator('Rating', rating / 5.0, rating.toStringAsFixed(1), Colors.amberAccent),
          _buildPerformanceIndicator('Acceptance', 0.95, '95%', Colors.cyanAccent),
          _buildPerformanceIndicator('Completion', 0.98, '98%', Colors.greenAccent),
        ],
      ),
    );
  }

  Widget _buildPerformanceIndicator(String label, double val, String text, Color color) {
    return Column(
      children: [
        SizedBox(
          width: 54,
          height: 54,
          child: Stack(
            fit: StackFit.expand,
            children: [
              CircularProgressIndicator(
                value: val,
                strokeWidth: 4.5,
                color: color,
                backgroundColor: Colors.white.withOpacity(0.04),
              ),
              Center(
                child: Text(
                  text,
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Text(
          label,
          style: const TextStyle(color: Colors.white54, fontSize: 11),
        ),
      ],
    );
  }

  Widget _buildAchievementsRow() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _buildBadgeChip('⭐ Top Rated', Colors.amberAccent),
          const SizedBox(width: 8),
          _buildBadgeChip('🚀 Fast Response', Colors.cyanAccent),
          const SizedBox(width: 8),
          _buildBadgeChip('🏆 Gold Tech', Colors.orangeAccent),
          const SizedBox(width: 8),
          _buildBadgeChip('💯 100+ Jobs', Colors.greenAccent),
        ],
      ),
    );
  }

  Widget _buildBadgeChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildScheduleTimeline() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0E131B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1E2633)),
      ),
      child: Column(
        children: [
          _buildTimelineJobItem('09:00', 'Printer Diagnostics', 'Fatima Al-Mansoori', 'High Priority', Colors.redAccent),
          const Divider(color: Color(0xFF1E2633), height: 24),
          _buildTimelineJobItem('11:30', 'iPhone Screen Replacement', 'John Doe', 'Medium Priority', Colors.amberAccent),
          const Divider(color: Color(0xFF1E2633), height: 24),
          _buildTimelineJobItem('15:00', 'PlayStation 5 Cleanup', 'Salem Al-Ali', 'Low Priority', Colors.greenAccent),
        ],
      ),
    );
  }

  Widget _buildTimelineJobItem(String time, String title, String client, String priority, Color color) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          time,
          style: const TextStyle(color: Colors.cyanAccent, fontWeight: FontWeight.bold, fontSize: 14),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Text('👤', style: TextStyle(fontSize: 10)),
                  const SizedBox(width: 4),
                  Text(client, style: const TextStyle(color: Colors.white54, fontSize: 12)),
                ],
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  priority,
                  style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRecentReviews() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0E131B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1E2633)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('KBI Client', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
              Row(
                children: [
                  ...List.generate(5, (_) => const Icon(Icons.star, color: Colors.amberAccent, size: 14)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Excellent service! The technician Ahmed arrived on time, was extremely professional, and replaced the iPhone screen in less than 30 minutes. High recommended!',
            style: TextStyle(color: Colors.white54, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 4),
          const Text('July 12, 2026', style: TextStyle(color: Colors.white24, fontSize: 10)),
        ],
      ),
    );
  }
}
