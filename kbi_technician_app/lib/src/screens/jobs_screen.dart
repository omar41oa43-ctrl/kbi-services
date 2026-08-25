import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart' hide TextDirection;
import 'package:url_launcher/url_launcher.dart';
import '../i18n.dart';
import '../models/service_request.dart';
import '../services/technician_service.dart';
import 'job_details_screen.dart';

class JobsScreen extends StatefulWidget {
  final Locale locale;
  final void Function(Locale) onLocaleChanged;

  const JobsScreen({super.key, required this.onLocaleChanged, required this.locale});

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  String _searchQuery = '';
  String _activeFilter = 'all'; // 'all', 'offers', 'active', 'completed'

  @override
  Widget build(BuildContext context) {
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFF070A0E),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0E131B),
          elevation: 0,
          title: Text(
            t(context, 'jobs'),
            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 20),
          ),
          actions: [
            Container(
              margin: const EdgeInsets.symmetric(vertical: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF1E2633),
                borderRadius: BorderRadius.circular(12),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: widget.locale.languageCode,
                  dropdownColor: const Color(0xFF0E131B),
                  icon: const Icon(Icons.keyboard_arrow_down, color: Colors.cyanAccent, size: 18),
                  items: const [
                    DropdownMenuItem(value: 'en', child: Text('EN', style: TextStyle(color: Colors.white, fontSize: 13))),
                    DropdownMenuItem(value: 'ar', child: Text('AR', style: TextStyle(color: Colors.white, fontSize: 13))),
                  ],
                  onChanged: (v) {
                    if (v == null) return;
                    widget.onLocaleChanged(Locale(v));
                  },
                ),
              ),
            ),
            const SizedBox(width: 16),
          ],
        ),
        body: Column(
          children: [
            // KPI Summary Header
            const _KpiSummaryHeader(),
            
            // Search & Filter Bar
            _buildSearchAndFilters(context),
            
            // Jobs List View
            Expanded(
              child: _buildJobsList(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchAndFilters(BuildContext context) {
    return Container(
      color: const Color(0xFF0E131B),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        children: [
          // Search Input
          TextField(
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Search jobs, devices, customers...',
              hintStyle: const TextStyle(color: Colors.white30, fontSize: 14),
              prefixIcon: const Icon(Icons.search, color: Colors.white54, size: 20),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, color: Colors.white54, size: 18),
                      onPressed: () => setState(() => _searchQuery = ''),
                    )
                  : null,
              filled: true,
              fillColor: const Color(0xFF161E2A),
              contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: Color(0xFF1E2633)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: Color(0xFF1E2633)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: Colors.cyanAccent, width: 1.5),
              ),
            ),
            onChanged: (val) {
              setState(() {
                _searchQuery = val.toLowerCase();
              });
            },
          ),
          const SizedBox(height: 12),
          
          // Filter Badges Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('all', 'All'),
                const SizedBox(width: 8),
                _buildFilterChip('offers', 'Offers'),
                const SizedBox(width: 8),
                _buildFilterChip('active', 'Active'),
                const SizedBox(width: 8),
                _buildFilterChip('completed', 'Completed'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String filterKey, String label) {
    final isActive = _activeFilter == filterKey;
    return InkWell(
      onTap: () => setState(() => _activeFilter = filterKey),
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? Colors.cyanAccent.withOpacity(0.1) : const Color(0xFF161E2A),
          border: Border.all(
            color: isActive ? Colors.cyanAccent : const Color(0xFF1E2633),
            width: 1.2,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.cyanAccent : Colors.white70,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildJobsList(BuildContext context) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: TechnicianService.instance.watchMyJobs(),
      builder: (context, myJobsSnap) {
        return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: TechnicianService.instance.watchAssignedOffers(),
          builder: (context, offersSnap) {
            if (myJobsSnap.connectionState == ConnectionState.waiting ||
                offersSnap.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator(color: Colors.cyanAccent));
            }

            final myJobsDocs = myJobsSnap.data?.docs ?? [];
            final offersDocs = offersSnap.data?.docs ?? [];

            // Parse and merge
            final List<_JobWrapper> allJobs = [];
            
            for (final d in offersDocs) {
              allJobs.add(_JobWrapper(job: ServiceRequestModel.fromDoc(d), isOffer: true));
            }
            for (final d in myJobsDocs) {
              allJobs.add(_JobWrapper(job: ServiceRequestModel.fromDoc(d), isOffer: false));
            }

            // Apply filter key
            var filtered = allJobs.where((item) {
              if (_activeFilter == 'offers') return item.isOffer;
              if (_activeFilter == 'active') {
                return !item.isOffer && item.job.status != 'completed' && item.job.status != 'cancelled';
              }
              if (_activeFilter == 'completed') {
                return !item.isOffer && item.job.status == 'completed';
              }
              return true; // 'all'
            }).toList();

            // Apply search query
            if (_searchQuery.isNotEmpty) {
              filtered = filtered.where((item) {
                final matchType = item.job.type.toLowerCase().contains(_searchQuery);
                final matchDesc = item.job.description.toLowerCase().contains(_searchQuery);
                final matchAddr = (item.job.address ?? '').toLowerCase().contains(_searchQuery);
                final matchOrderId = (item.job.orderId ?? '').toLowerCase().contains(_searchQuery);
                return matchType || matchDesc || matchAddr || matchOrderId;
              }).toList();
            }

            if (filtered.isEmpty) {
              return _buildEmptyState();
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final item = filtered[index];
                return _PremiumJobCard(jobWrapper: item);
              },
            );
          },
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.work_off_outlined, size: 64, color: Colors.white.withOpacity(0.15)),
          const SizedBox(height: 16),
          const Text(
            'No matching jobs found',
            style: TextStyle(color: Colors.white54, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          const Text(
            'Active request notifications will appear here',
            style: TextStyle(color: Colors.white30, fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class _JobWrapper {
  final ServiceRequestModel job;
  final bool isOffer;

  _JobWrapper({required this.job, required this.isOffer});
}

class _KpiSummaryHeader extends StatelessWidget {
  const _KpiSummaryHeader();

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: TechnicianService.instance.watchMyJobs(),
      builder: (context, jobsSnap) {
        return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: TechnicianService.instance.watchMyPayments(),
          builder: (context, paymentsSnap) {
            return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
              stream: TechnicianService.instance.watchMyTechDoc(),
              builder: (context, techSnap) {
                // Calculation logic
                final myJobs = jobsSnap.data?.docs ?? [];
                final activeCount = myJobs.where((d) {
                  final status = d.data()['status'] ?? '';
                  return status != 'completed' && status != 'cancelled';
                }).length;
                
                final completedCount = myJobs.where((d) => (d.data()['status'] ?? '') == 'completed').length;

                final payments = paymentsSnap.data?.docs ?? [];
                double totalEarnings = 0;
                for (final d in payments) {
                  final amount = d.data()['amount'];
                  if (amount is num) totalEarnings += amount.toDouble();
                }

                final techData = techSnap.data?.data();
                final rating = (techData?['rating'] is num) ? (techData?['rating'] as num).toDouble() : 5.0;

                return Container(
                  color: const Color(0xFF0E131B),
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final isWide = constraints.maxWidth > 550;
                      if (isWide) {
                        return Row(
                          children: [
                            Expanded(child: _buildKpiCard('Active Jobs', activeCount.toString(), Icons.play_arrow_outlined, Colors.orangeAccent)),
                            const SizedBox(width: 10),
                            Expanded(child: _buildKpiCard('Completed', completedCount.toString(), Icons.check_circle_outlined, Colors.greenAccent)),
                            const SizedBox(width: 10),
                            Expanded(child: _buildKpiCard('Earnings', 'AED ${totalEarnings.toStringAsFixed(0)}', Icons.wallet_outlined, Colors.cyanAccent)),
                            const SizedBox(width: 10),
                            Expanded(child: _buildKpiCard('Rating', rating.toStringAsFixed(1), Icons.star_border_outlined, Colors.amberAccent)),
                          ],
                        );
                      } else {
                        return GridView.count(
                          crossAxisCount: 2,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 2.1,
                          children: [
                            _buildKpiCard('Active Jobs', activeCount.toString(), Icons.play_arrow_outlined, Colors.orangeAccent),
                            _buildKpiCard('Completed', completedCount.toString(), Icons.check_circle_outlined, Colors.greenAccent),
                            _buildKpiCard('Earnings', 'AED ${totalEarnings.toStringAsFixed(0)}', Icons.wallet_outlined, Colors.cyanAccent),
                            _buildKpiCard('Rating', rating.toStringAsFixed(1), Icons.star_border_outlined, Colors.amberAccent),
                          ],
                        );
                      }
                    },
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  Widget _buildKpiCard(String label, String value, IconData icon, Color accentColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF161E2A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E2633)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: accentColor.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: accentColor, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  label,
                  style: const TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.w500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PremiumJobCard extends StatefulWidget {
  final _JobWrapper jobWrapper;

  const _PremiumJobCard({required this.jobWrapper});

  @override
  State<_PremiumJobCard> createState() => _PremiumJobCardState();
}

class _PremiumJobCardState extends State<_PremiumJobCard> {
  bool _busy = false;
  String? _error;
  bool _isHovered = false;

  Future<_JobDetailsInfo> _fetchOrderDetails(String orderId) async {
    final snap = await FirebaseFirestore.instance.collection('orders').where('orderId', isEqualTo: orderId).limit(1).get();
    if (snap.docs.isEmpty) {
      return _JobDetailsInfo(customerName: 'KBI Client', customerPhone: '', brand: '', model: '', price: null);
    }
    final d = snap.docs.first.data();
    final price = (d['price'] is num) ? (d['price'] as num).toDouble() : null;
    return _JobDetailsInfo(
      customerName: d['customerName']?.toString() ?? 'KBI Client',
      customerPhone: d['customerPhone']?.toString() ?? '',
      brand: d['brand']?.toString() ?? '',
      model: d['model']?.toString() ?? '',
      price: price,
    );
  }

  Future<void> _respond(String decision) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await TechnicianService.instance.respondToOffer(
        requestId: widget.jobWrapper.job.id,
        decision: decision,
      );
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
        });
      }
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await FirebaseFirestore.instance.collection('service_requests').doc(widget.jobWrapper.job.id).update({
        'status': newStatus,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
        });
      }
    }
  }

  Future<void> _launchUrl(String urlString) async {
    final Uri url = Uri.parse(urlString);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  void _uploadPhotosDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0E131B),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: Color(0xFF1E2633)),
        ),
        title: const Text('Upload Job Photos', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Select and upload photos of the device before/after repair to document the job.',
              style: TextStyle(color: Colors.white54, fontSize: 13),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.cyanAccent,
                foregroundColor: Colors.black,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Photos uploaded successfully!')),
                );
              },
              icon: const Icon(Icons.add_a_photo_outlined),
              label: const Text('Select Photos', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _chatAdminDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0E131B),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: Color(0xFF1E2633)),
        ),
        title: const Text('Chat with Admin Support', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Need assistance with this job? Connect with our operations center immediately.',
              style: TextStyle(color: Colors.white54, fontSize: 13),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.cyanAccent,
                foregroundColor: Colors.black,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: () {
                Navigator.pop(context);
                _launchUrl('https://wa.me/+971509999999');
              },
              icon: const Icon(Icons.support_agent_outlined),
              label: const Text('Open WhatsApp Support', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final request = widget.jobWrapper.job;
    final isOffer = widget.jobWrapper.isOffer;

    final String priority = request.type.toLowerCase() == 'laptop' || 
                             request.description.toLowerCase().contains('cracked') || 
                             request.description.toLowerCase().contains('shattered')
        ? 'High Priority'
        : 'Normal Priority';
    final Color priorityColor = priority == 'High Priority' ? Colors.redAccent : Colors.greenAccent;

    return FutureBuilder<_JobDetailsInfo>(
      future: request.orderId != null && request.orderId!.isNotEmpty
          ? _fetchOrderDetails(request.orderId!)
          : Future.value(_JobDetailsInfo(customerName: 'KBI Client', customerPhone: '', brand: '', model: '', price: null)),
      builder: (context, detailsSnap) {
        final details = detailsSnap.data;
        final customerName = details?.customerName ?? 'KBI Client';
        final customerPhone = details?.customerPhone ?? '';
        final brand = details?.brand ?? '';
        final model = details?.model ?? '';
        final price = details?.price;

        return MouseRegion(
          onEnter: (_) => setState(() => _isHovered = true),
          onExit: (_) => setState(() => _isHovered = false),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            margin: const EdgeInsets.only(bottom: 16),
            transform: _isHovered ? (Matrix4.identity()..translate(0, -4, 0)) : Matrix4.identity(),
            decoration: BoxDecoration(
              color: const Color(0xFF0E131B),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: isOffer ? Colors.cyanAccent.withOpacity(0.4) : const Color(0xFF1E2633),
                width: isOffer ? 1.5 : 1.0,
              ),
              boxShadow: [
                BoxShadow(
                  color: isOffer ? Colors.cyanAccent.withOpacity(_isHovered ? 0.08 : 0.04) : Colors.black.withOpacity(0.2),
                  blurRadius: _isHovered ? 16 : 8,
                  spreadRadius: 1,
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    Navigator.of(context).push(MaterialPageRoute(builder: (_) => JobDetailsScreen(job: request)));
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // HEADER SECTION
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Text(
                                  request.type.toLowerCase() == 'laptop' ? '💻' : '📱',
                                  style: const TextStyle(fontSize: 16),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  request.type.toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.cyanAccent,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                _buildStatusBadge(request.status),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: priorityColor.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: priorityColor.withOpacity(0.2)),
                                  ),
                                  child: Row(
                                    children: [
                                      _PulsingDot(color: priorityColor),
                                      const SizedBox(width: 6),
                                      Text(
                                        priority.toUpperCase(),
                                        style: TextStyle(
                                          color: priorityColor,
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // TITLE SECTION
                        Text(
                          brand.isNotEmpty ? '$brand $model' : request.description,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 19,
                            letterSpacing: 0.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Screen Replacement',
                          style: TextStyle(color: Colors.white38, fontSize: 13),
                        ),
                        const SizedBox(height: 12),

                        // CUSTOMER SUMMARY & JOB ID
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Text('👤', style: TextStyle(fontSize: 14)),
                                const SizedBox(width: 6),
                                Text(
                                  customerName,
                                  style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
                                ),
                                const SizedBox(width: 8),
                                const Text('⭐', style: TextStyle(fontSize: 12)),
                                const SizedBox(width: 4),
                                const Text(
                                  '4.9',
                                  style: TextStyle(color: Colors.amberAccent, fontSize: 13, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            if (request.orderId != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF161E2A),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFF1E2633)),
                                ),
                                child: Text(
                                  'ID: ${request.orderId}',
                                  style: const TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(color: Color(0xFF1E2633), height: 1),
                        const SizedBox(height: 14),

                        // LOCATION SECTION
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('📍', style: TextStyle(fontSize: 15)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                request.address ?? 'Abu Dhabi, UAE',
                                style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.3),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Row(
                          children: [
                            Text('📏', style: TextStyle(fontSize: 14)),
                            SizedBox(width: 8),
                            Text(
                              '4.3 km • 🚗 11 min',
                              style: TextStyle(color: Colors.white54, fontSize: 13),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        const Divider(color: Color(0xFF1E2633), height: 1),
                        const SizedBox(height: 14),

                        // PRICE SECTION
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Text('💰', style: TextStyle(fontSize: 13)),
                                    SizedBox(width: 4),
                                    Text('EST. PRICE', style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  price != null ? 'AED ${price.toStringAsFixed(0)}' : 'AED 350',
                                  style: const TextStyle(color: Colors.greenAccent, fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Row(
                                  children: [
                                    Text('👨‍🔧', style: TextStyle(fontSize: 13)),
                                    SizedBox(width: 4),
                                    Text('YOUR EARNINGS', style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'AED ${((price ?? 350) * 0.7).toStringAsFixed(0)}',
                                  style: const TextStyle(color: Colors.cyanAccent, fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        // TIME DURATION
                        const Row(
                          children: [
                            Text('⏱', style: TextStyle(fontSize: 14)),
                            SizedBox(width: 8),
                            Text(
                              'Estimated Time: 45 min',
                              style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        // CUSTOMER NOTES & DESCRIPTION
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF161E2A),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF1E2633)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Text('📝', style: TextStyle(fontSize: 13)),
                                  SizedBox(width: 6),
                                  Text('Customer Note:', style: TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold)),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                request.description,
                                style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),

                        // ATTACHMENTS
                        const Row(
                          children: [
                            Text('📸', style: TextStyle(fontSize: 13)),
                            SizedBox(width: 6),
                            Text(
                              '3 Images Attached',
                              style: TextStyle(color: Colors.cyanAccent, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),

                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
                        ],

                        // TIMELINE
                        if (!isOffer && request.status != 'cancelled') ...[
                          const SizedBox(height: 16),
                          const Divider(color: Color(0xFF1E2633), height: 1),
                          const SizedBox(height: 12),
                          _buildJobTimeline(request.status),
                        ],

                        // ACTION BUTTONS SECTION
                        const SizedBox(height: 16),
                        const Divider(color: Color(0xFF1E2633), height: 1),
                        const SizedBox(height: 12),

                        // Call, WhatsApp, Navigate, Details buttons row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildQuickActionButton(
                              icon: Icons.phone_outlined,
                              label: 'Call',
                              onTap: () {
                                if (customerPhone.isNotEmpty) {
                                  _launchUrl('tel:$customerPhone');
                                }
                              },
                            ),
                            _buildQuickActionButton(
                              icon: Icons.chat_bubble_outline,
                              label: 'WhatsApp',
                              onTap: () {
                                if (customerPhone.isNotEmpty) {
                                  _launchUrl('https://wa.me/$customerPhone');
                                }
                              },
                            ),
                            _buildQuickActionButton(
                              icon: Icons.map_outlined,
                              label: 'Navigate',
                              onTap: () {
                                if (request.lat != null && request.lng != null) {
                                  _launchUrl('https://www.google.com/maps/dir/?api=1&destination=${request.lat},${request.lng}');
                                } else {
                                  _launchUrl('https://www.google.com/maps/dir/?api=1&destination=24.4539,54.3773');
                                }
                              },
                            ),
                            _buildQuickActionButton(
                              icon: Icons.assignment_outlined,
                              label: 'Details',
                              onTap: () {
                                Navigator.of(context).push(MaterialPageRoute(builder: (_) => JobDetailsScreen(job: request)));
                              },
                            ),
                          ],
                        ),

                        const SizedBox(height: 12),
                        const Divider(color: Color(0xFF1E2633), height: 1),
                        const SizedBox(height: 16),

                        _buildActionButtons(context, request, isOffer, customerPhone),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.cyanAccent, size: 20),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    Color bg;
    switch (status.toLowerCase()) {
      case 'pending':
        color = Colors.cyanAccent;
        bg = Colors.cyanAccent.withOpacity(0.08);
        break;
      case 'accepted':
      case 'assigned':
        color = Colors.orangeAccent;
        bg = Colors.orangeAccent.withOpacity(0.08);
        break;
      case 'on_the_way':
        color = Colors.amberAccent;
        bg = Colors.amberAccent.withOpacity(0.08);
        break;
      case 'arrived':
        color = Colors.purpleAccent;
        bg = Colors.purpleAccent.withOpacity(0.08);
        break;
      case 'in_progress':
        color = Colors.blueAccent;
        bg = Colors.blueAccent.withOpacity(0.08);
        break;
      case 'completed':
        color = Colors.greenAccent;
        bg = Colors.greenAccent.withOpacity(0.08);
        break;
      default:
        color = Colors.white54;
        bg = Colors.white12;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Text(
        status.replaceAll('_', ' ').toUpperCase(),
        style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5),
      ),
    );
  }

  Widget _buildJobTimeline(String status) {
    final int step = _getStepIndex(status);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'JOB PROGRESS TIMELINE',
          style: TextStyle(color: Colors.white30, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            _buildTimelineStep('Assigned', step >= 0),
            _buildTimelineLine(step >= 1),
            _buildTimelineStep('Accepted', step >= 1),
            _buildTimelineLine(step >= 2),
            _buildTimelineStep('Driving', step >= 2),
            _buildTimelineLine(step >= 3),
            _buildTimelineStep('Arrived', step >= 3),
            _buildTimelineLine(step >= 4),
            _buildTimelineStep('Repairing', step >= 4),
            _buildTimelineLine(step >= 5),
            _buildTimelineStep('Testing', step >= 5),
            _buildTimelineLine(step >= 6),
            _buildTimelineStep('Completed', step >= 6),
          ],
        ),
      ],
    );
  }

  Widget _buildTimelineStep(String label, bool active) {
    return Column(
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: active ? Colors.cyanAccent : const Color(0xFF1E2633),
            shape: BoxShape.circle,
            boxShadow: active
                ? [BoxShadow(color: Colors.cyanAccent.withOpacity(0.4), blurRadius: 4, spreadRadius: 1)]
                : null,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label, 
          style: TextStyle(
            color: active ? Colors.white70 : Colors.white24, 
            fontSize: 7,
            fontWeight: active ? FontWeight.bold : FontWeight.normal
          )
        ),
      ],
    );
  }

  Widget _buildTimelineLine(bool active) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          height: 1.5,
          color: active ? Colors.cyanAccent : const Color(0xFF1E2633),
        ),
      ),
    );
  }

  int _getStepIndex(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 0;
      case 'accepted':
      case 'assigned':
        return 1;
      case 'on_the_way':
        return 2;
      case 'arrived':
        return 3;
      case 'in_progress':
        return 4;
      case 'testing':
        return 5;
      case 'completed':
        return 6;
      default:
        return 0;
    }
  }

  Widget _buildActionButtons(BuildContext context, ServiceRequestModel request, bool isOffer, String customerPhone) {
    if (_busy) {
      return const Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.cyanAccent),
        ),
      );
    }

    if (isOffer) {
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.cyanAccent,
                    foregroundColor: Colors.black,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: () => _respond('accept'),
                  child: const Text('Accept Job', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white70,
                    side: const BorderSide(color: Color(0xFF1E2633)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: () => _respond('reject'),
                  child: const Text('Decline', style: TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
                ),
              ),
            ],
          ),
        ],
      );
    }

    // Active Jobs status changes flow buttons
    String primaryLabel = '';
    String nextStatus = '';
    IconData primaryIcon = Icons.check;

    if (request.status == 'accepted' || request.status == 'assigned') {
      primaryLabel = 'Start Navigation (On the Way)';
      nextStatus = 'on_the_way';
      primaryIcon = Icons.navigation_outlined;
    } else if (request.status == 'on_the_way') {
      primaryLabel = 'Mark Arrived';
      nextStatus = 'arrived';
      primaryIcon = Icons.place_outlined;
    } else if (request.status == 'arrived') {
      primaryLabel = 'Start Diagnosis & Repair';
      nextStatus = 'in_progress';
      primaryIcon = Icons.build_outlined;
    } else if (request.status == 'in_progress') {
      primaryLabel = 'Complete Job & Payment';
      nextStatus = 'completed';
      primaryIcon = Icons.done_all_outlined;
    }

    return Column(
      children: [
        if (primaryLabel.isNotEmpty) ...[
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.cyanAccent,
              foregroundColor: Colors.black,
              elevation: 0,
              minimumSize: const Size.fromHeight(50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            onPressed: () {
              if (nextStatus == 'on_the_way') {
                if (request.lat != null && request.lng != null) {
                  _launchUrl('https://www.google.com/maps/dir/?api=1&destination=${request.lat},${request.lng}');
                } else {
                  _launchUrl('https://www.google.com/maps/dir/?api=1&destination=24.4539,54.3773');
                }
              }
              _updateStatus(nextStatus);
            },
            icon: Icon(primaryIcon, size: 20),
            label: Text(primaryLabel, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          ),
          const SizedBox(height: 12),
        ],

        // Row of additional action buttons for active jobs
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white70,
                  side: const BorderSide(color: Color(0xFF1E2633)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => _uploadPhotosDialog(),
                icon: const Icon(Icons.photo_camera_outlined, size: 16),
                label: const Text('Upload Photos', style: TextStyle(fontSize: 11)),
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white70,
                  side: const BorderSide(color: Color(0xFF1E2633)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  if (customerPhone.isNotEmpty) {
                    _launchUrl('https://wa.me/$customerPhone');
                  }
                },
                icon: const Icon(Icons.chat_bubble_outline, size: 16),
                label: const Text('Chat Customer', style: TextStyle(fontSize: 11)),
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white70,
                  side: const BorderSide(color: Color(0xFF1E2633)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => _chatAdminDialog(),
                icon: const Icon(Icons.shield_outlined, size: 16),
                label: const Text('Chat Admin', style: TextStyle(fontSize: 11)),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _PulsingDot extends StatefulWidget {
  final Color color;
  const _PulsingDot({required this.color});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: 6 + (_controller.value * 3),
          height: 6 + (_controller.value * 3),
          decoration: BoxDecoration(
            color: widget.color.withOpacity(0.6 + (1 - _controller.value) * 0.4),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: widget.color.withOpacity(0.4 * _controller.value),
                blurRadius: 4,
                spreadRadius: 1,
              )
            ],
          ),
        );
      },
    );
  }
}

class _JobDetailsInfo {
  final String customerName;
  final String customerPhone;
  final String brand;
  final String model;
  final double? price;

  _JobDetailsInfo({
    required this.customerName,
    required this.customerPhone,
    required this.brand,
    required this.model,
    required this.price,
  });
}
