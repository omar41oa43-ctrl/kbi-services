import 'dart:async';
import 'dart:ui';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/service_request.dart';
import '../services/location_tracking_service.dart';
import '../services/technician_service.dart';
import '../utils/job_utils.dart';
import '../theme.dart';
import '../widgets/liquid_glass.dart';
import 'job_details_screen.dart';
import 'notifications_screen.dart';
import 'parts_inventory_screen.dart';
import 'forms_list_screen.dart';
import 'invoice_form_screen.dart';

class DashboardScreen extends StatefulWidget {
  final Locale locale;
  final void Function(Locale) onLocaleChanged;
  final ValueChanged<int>? onNavigate;

  const DashboardScreen({
    super.key,
    required this.onLocaleChanged,
    required this.locale,
    this.onNavigate,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isOnline = false;
  bool _canGoOnline = false;
  bool _updatingStatus = false;
  bool _initialAutoOnlineTriggered = false;

  LocationTrackingIssue? _locationIssue;
  late final Stream<DocumentSnapshot<Map<String, dynamic>>> _techStream;
  late final Stream<List<DocumentSnapshot<Map<String, dynamic>>>> _jobsStream;
  bool _restoredLocationTracking = false;

  @override
  void initState() {
    super.initState();
    _techStream = TechnicianService.instance.watchMyTechDoc();
    _jobsStream = TechnicianService.instance.watchMyJobDocs();
  }

  @override
  void dispose() {
    LocationTrackingService.instance.stop();
    super.dispose();
  }

  Widget _buildLoadError(String section, Object? error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_outlined,
                color: Colors.redAccent, size: 48),
            const SizedBox(height: 12),
            Text(
              'Unable to load $section.',
              style: const TextStyle(
                  color: Color(0xFF111318), fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text('$error',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.black87)),
          ],
        ),
      ),
    );
  }

  Future<void> _restoreLocationTracking(String uid) async {
    try {
      await LocationTrackingService.instance.start(requestPermission: true);
      if (mounted) setState(() => _locationIssue = null);
    } on LocationTrackingException catch (error) {
      if (mounted) setState(() => _locationIssue = error.issue);
    } catch (error) {
      debugPrint('Could not restore location tracking: $error');
    }
  }

  Widget _buildLocationBlockedBanner(
      LocationTrackingIssue issue, bool isOnline, bool isAr) {
    final reason = switch (issue) {
      LocationTrackingIssue.servicesDisabled => isAr
          ? 'خدمات الموقع معطلة في الجهاز.'
          : 'Location services are turned off.',
      LocationTrackingIssue.permissionPermanentlyDenied => isAr
          ? 'إذن الموقع مرفوض في إعدادات التطبيق.'
          : 'Location access is denied for KBI in Settings.',
      LocationTrackingIssue.permissionDenied => isAr
          ? 'يلزم إذن الموقع لبث موقعك والوقت المتوقع.'
          : 'KBI needs location access to broadcast your live ETA.',
      LocationTrackingIssue.locationUnavailable => isAr
          ? 'تعذر تحديد موقعك الحالي بدقة.'
          : 'Your current location could not be determined.',
    };

    final title = !isOnline
        ? (isAr
            ? 'أنت غير متصل حالياً'
            : "You're offline and not receiving jobs")
        : (isAr
            ? 'خدمة الموقع المباشر غير مفعّلة'
            : 'Live GPS is currently unavailable');

    final actionLabel = !isOnline
        ? (isAr ? 'تمكين الموقع والاتصال' : 'Fix and go online')
        : (isAr ? 'تمكين خدمة الموقع' : 'Enable Location');

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF4E5),
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        border: Border.all(color: const Color(0xFFE9A23B)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.location_off_outlined,
              color: Color(0xFFB26A00), size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF7A4A00),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  reason,
                  style: const TextStyle(
                      color: Color(0xFF7A4A00), fontSize: 12, height: 1.3),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _updatingStatus
                      ? null
                      : () async {
                          try {
                            await LocationTrackingService.instance
                                .start(requestPermission: true);
                            if (mounted) setState(() => _locationIssue = null);
                          } on LocationTrackingException catch (e) {
                            if (e.issue ==
                                LocationTrackingIssue
                                    .permissionPermanentlyDenied) {
                              await Geolocator.openAppSettings();
                            } else if (e.issue ==
                                LocationTrackingIssue.servicesDisabled) {
                              await Geolocator.openLocationSettings();
                            }
                            if (mounted) {
                              setState(() => _locationIssue = e.issue);
                            }
                          } catch (_) {}
                          if (!isOnline) {
                            await _setAvailabilityMode('available');
                          }
                        },
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: const Size(0, 32),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    foregroundColor: const Color(0xFFB26A00),
                  ),
                  child: Text(actionLabel,
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _setAvailabilityMode(String mode) async {
    final cleanMode = mode.toLowerCase().trim();
    if (cleanMode == 'available' && !_canGoOnline) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
                'Account awaiting approval or suspended. Cannot go online.'),
            backgroundColor: Color(0xFFEF4444),
          ),
        );
      }
      return;
    }

    final isOnline = cleanMode != 'offline';
    final isAvailable = cleanMode == 'available';

    setState(() {
      _updatingStatus = true;
      _isOnline = isOnline;
    });

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        if (isOnline) {
          try {
            await LocationTrackingService.instance
                .start(requestPermission: true);
            if (mounted) setState(() => _locationIssue = null);
          } on LocationTrackingException catch (e) {
            if (mounted) setState(() => _locationIssue = e.issue);
          } catch (_) {}
        } else {
          try {
            await LocationTrackingService.instance.stop();
            if (mounted) setState(() => _locationIssue = null);
          } catch (_) {}
        }

        final techRef =
            FirebaseFirestore.instance.collection('technicians').doc(user.uid);
        await techRef.set({
          'isOnline': isOnline,
          'online': isOnline,
          'isAvailable': isAvailable,
          'available': isAvailable,
          'availability': cleanMode,
          'status': cleanMode == 'busy'
              ? 'BUSY'
              : (isAvailable ? 'AVAILABLE' : 'OFFLINE'),
          'lastActive': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      }
    } catch (e) {
      debugPrint('Status update exception (handled gracefully): $e');
    } finally {
      if (mounted) {
        setState(() {
          _updatingStatus = false;
        });
      }
    }
  }

  // --- HELPER LOGIC FOR DISTANCE & GENERAL AREA ---
  String _extractGeneralArea(String? fullAddress) {
    if (fullAddress == null || fullAddress.trim().isEmpty) return 'Abu Dhabi';
    final parts = fullAddress.split(',');
    if (parts.length >= 2) {
      return parts[0].trim();
    }
    return fullAddress.trim();
  }

  String _formatPriorityLabel(String? rawPriority) {
    final clean = (rawPriority ?? 'Normal').trim().toLowerCase();
    if (clean == 'high') return 'High Priority';
    if (clean == 'urgent' || clean == 'critical') return 'Urgent Priority';
    if (clean == 'low') return 'Low Priority';
    return 'Normal Priority';
  }

  Color _getPriorityColor(String? rawPriority) {
    final rank = jobPriorityRank(rawPriority ?? 'Normal');
    if (rank >= 3) return const Color(0xFFEF4444);
    if (rank == 2) return const Color(0xFFF59E0B);
    return const Color(0xFF10B981);
  }

  // --- MAPS / NAVIGATION BOTTOM SHEET ---
  void _openNavigationPicker(
      BuildContext context, double? lat, double? lng, String address) {
    final hasCoords = lat != null && lng != null && (lat != 0 || lng != 0);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Row(
                  children: [
                    Icon(Icons.directions_rounded,
                        color: Color(0xFF0284C7), size: 22),
                    SizedBox(width: 10),
                    Text(
                      'Turn-by-Turn GPS Navigation',
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: Color(0xFF0F172A)),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  address,
                  style:
                      const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 16),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 12),

                // 1. Google Maps
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF4285F4).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.map_rounded,
                        color: Color(0xFF4285F4), size: 20),
                  ),
                  title: const Text('Google Maps',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  subtitle: const Text('Live traffic routing',
                      style:
                          TextStyle(color: Color(0xFF64748B), fontSize: 11.5)),
                  trailing: const Icon(Icons.chevron_right_rounded,
                      color: Color(0xFF94A3B8)),
                  onTap: () async {
                    Navigator.pop(ctx);
                    Uri uri;
                    if (hasCoords) {
                      uri = Uri.parse(
                          'comgooglemaps://?daddr=$lat,$lng&directionsmode=driving');
                      if (!await canLaunchUrl(uri)) {
                        uri = Uri.parse(
                            'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng');
                      }
                    } else {
                      final enc = Uri.encodeComponent(address);
                      uri = Uri.parse(
                          'https://www.google.com/maps/dir/?api=1&destination=$enc');
                    }
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri,
                          mode: LaunchMode.externalApplication);
                    }
                  },
                ),

                // 2. Apple Maps
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.explore_rounded,
                        color: Color(0xFF0F172A), size: 20),
                  ),
                  title: const Text('Apple Maps',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  subtitle: const Text('Native iOS guidance',
                      style:
                          TextStyle(color: Color(0xFF64748B), fontSize: 11.5)),
                  trailing: const Icon(Icons.chevron_right_rounded,
                      color: Color(0xFF94A3B8)),
                  onTap: () async {
                    Navigator.pop(ctx);
                    Uri uri;
                    if (hasCoords) {
                      uri = Uri.parse(
                          'http://maps.apple.com/?daddr=$lat,$lng&dirflg=d');
                    } else {
                      final enc = Uri.encodeComponent(address);
                      uri = Uri.parse(
                          'http://maps.apple.com/?daddr=$enc&dirflg=d');
                    }
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri,
                          mode: LaunchMode.externalApplication);
                    }
                  },
                ),

                // 3. Waze
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF33CCFF).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.navigation_rounded,
                        color: Color(0xFF0284C7), size: 20),
                  ),
                  title: const Text('Waze Navigation',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  subtitle: const Text('Speed camera alerts',
                      style:
                          TextStyle(color: Color(0xFF64748B), fontSize: 11.5)),
                  trailing: const Icon(Icons.chevron_right_rounded,
                      color: Color(0xFF94A3B8)),
                  onTap: () async {
                    Navigator.pop(ctx);
                    Uri uri;
                    if (hasCoords) {
                      uri = Uri.parse('waze://?ll=$lat,$lng&navigate=yes');
                      if (!await canLaunchUrl(uri)) {
                        uri = Uri.parse(
                            'https://waze.com/ul?ll=$lat,$lng&navigate=yes');
                      }
                    } else {
                      final enc = Uri.encodeComponent(address);
                      uri =
                          Uri.parse('https://waze.com/ul?q=$enc&navigate=yes');
                    }
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri,
                          mode: LaunchMode.externalApplication);
                    }
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final isAr = widget.locale.languageCode == 'ar';

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
            stream: _techStream,
            builder: (context, techSnap) {
              if (techSnap.connectionState == ConnectionState.waiting) {
                return _buildDashboardSkeleton();
              }
              if (techSnap.hasError) {
                return _buildLoadError('profile', techSnap.error);
              }
              final techData = techSnap.data?.data();
              final String techName = techData?['full_name'] ??
                  techData?['name'] ??
                  user?.displayName ??
                  'Technician';
              final rawStatus =
                  (techData?['status'] ?? techData?['availability'] ?? '')
                      .toString()
                      .toLowerCase()
                      .trim();
              final isExplicitlyOffline = rawStatus == 'offline' ||
                  rawStatus == 'standby' ||
                  techData?['online'] == false;

              _canGoOnline = techData?['isSuspended'] != true &&
                  techData?['isLocked'] != true &&
                  techData?['appAccessEnabled'] != false;

              // If technician is active and not explicitly offline, default to ONLINE ACTIVE
              _isOnline = _canGoOnline && !isExplicitlyOffline;

              // Auto-activate online state on first login if document has not yet saved status
              if (_canGoOnline &&
                  (rawStatus.isEmpty ||
                      rawStatus == 'approved' ||
                      rawStatus == 'active') &&
                  !_initialAutoOnlineTriggered) {
                _initialAutoOnlineTriggered = true;
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  _setAvailabilityMode('available');
                });
              }

              if (_isOnline && user != null && !_restoredLocationTracking) {
                _restoredLocationTracking = true;
                WidgetsBinding.instance.addPostFrameCallback(
                  (_) => _restoreLocationTracking(user.uid),
                );
              }

              return StreamBuilder<
                  List<DocumentSnapshot<Map<String, dynamic>>>>(
                stream: _jobsStream,
                builder: (context, jobsSnap) {
                  if (jobsSnap.connectionState == ConnectionState.waiting) {
                    return _buildDashboardSkeleton();
                  }
                  if (jobsSnap.hasError) {
                    return _buildLoadError('jobs', jobsSnap.error);
                  }
                  final myJobs = jobsSnap.data ?? [];

                  // Active job priority: in_progress / on_the_way / arrived / accepted / pending
                  final activeJobDoc = myJobs
                      .cast<DocumentSnapshot<Map<String, dynamic>>?>()
                      .firstWhere(
                    (d) {
                      if (d == null) return false;
                      final data = d.data();
                      if (data == null) return false;
                      final status = normalizeJobStatus(data['status']);
                      return !{'completed', 'cancelled', 'rejected'}
                          .contains(status);
                    },
                    orElse: () => null,
                  );

                  final todayJobs = myJobs.where((d) {
                    final data = d.data();
                    return data != null &&
                        isSameLocalDay(jobDate(data), DateTime.now());
                  }).toList()
                    ..sort((a, b) => (jobDate(a.data() ?? {}) ?? DateTime(2100))
                        .compareTo(jobDate(b.data() ?? {}) ?? DateTime(2100)));

                  final completedTodayJobs = todayJobs.where((d) {
                    final data = d.data();
                    if (data == null) return false;
                    return normalizeJobStatus(data['status']) == 'completed';
                  }).toList();

                  // Active today jobs (excluding completed, cancelled, rejected)
                  final activeTodayJobs = todayJobs.where((d) {
                    final data = d.data();
                    if (data == null) return false;
                    final s = normalizeJobStatus(data['status']);
                    return !{'completed', 'cancelled', 'rejected', 'delivered'}
                        .contains(s);
                  }).toList();

                  double earningsToday = 0;
                  for (final doc in completedTodayJobs) {
                    final data = doc.data() ?? {};
                    final amt = data['finalAmount'] ??
                        data['totalAmount'] ??
                        data['finalPrice'] ??
                        data['price'] ??
                        0;
                    if (amt is num) {
                      earningsToday += amt.toDouble();
                    } else if (amt is String) {
                      earningsToday += double.tryParse(amt) ?? 0;
                    }
                  }

                  // Monthly earnings calculation
                  double earningsMonth = 0;
                  final now = DateTime.now();
                  final completedMonthJobs = myJobs.where((d) {
                    final data = d.data();
                    if (data == null) return false;
                    if (normalizeJobStatus(data['status']) != 'completed') return false;
                    final dDate = jobDate(data);
                    return dDate != null && dDate.month == now.month && dDate.year == now.year;
                  }).toList();

                  for (final doc in completedMonthJobs) {
                    final data = doc.data() ?? {};
                    final amt = data['finalAmount'] ??
                        data['totalAmount'] ??
                        data['finalPrice'] ??
                        data['price'] ??
                        0;
                    if (amt is num) {
                      earningsMonth += amt.toDouble();
                    } else if (amt is String) {
                      earningsMonth += double.tryParse(amt) ?? 0;
                    }
                  }

                  final String photoUrl = (techData?['photoUrl'] ??
                          techData?['avatarUrl'] ??
                          techData?['profilePhoto'] ??
                          '')
                      .toString();

                  final rawStatus =
                      (techData?['status'] ?? techData?['availability'] ?? '')
                          .toString()
                          .toLowerCase();
                  final bool isBusy = _isOnline &&
                      (rawStatus == 'busy' ||
                          (rawStatus != 'available' &&
                              activeJobDoc != null &&
                              normalizeJobStatus(
                                      activeJobDoc.data()?['status']) !=
                                  'pending'));

                  final allActiveJobs = myJobs.where((d) {
                    final data = d.data();
                    if (data == null) return false;
                    final s = normalizeJobStatus(data['status']);
                    return !{'completed', 'cancelled', 'rejected'}.contains(s);
                  }).toList();

                  final double rating = (techData?['rating'] is num)
                      ? (techData!['rating'] as num).toDouble()
                      : (double.tryParse((techData?['rating'] ?? '5.0').toString()) ?? 5.0);
                  final String techId = (techData?['employeeId'] ?? techData?['techId'] ?? 'KBI-2FRFOT').toString();
                  final String serviceArea = (techData?['serviceArea'] ?? techData?['zone'] ?? techData?['city'] ?? 'Abu Dhabi').toString();
                  final int batteryLevel = (techData?['batteryLevel'] is num) ? (techData!['batteryLevel'] as num).toInt() : 88;
                  final String networkStatus = (techData?['networkStatus'] ?? '5G Active').toString();
                  final dynamic lastSyncVal = techData?['lastActive'] ?? techData?['updatedAt'];

                  return SingleChildScrollView(
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 560),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 128),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildTopSection(
                                techName: techName,
                                techId: techId,
                                rating: rating,
                                serviceArea: serviceArea,
                                photoUrl: photoUrl,
                                isOnline: _isOnline,
                                isBusy: isBusy,
                                jobsTodayCount: todayJobs.length,
                                completedCount: completedTodayJobs.length,
                                activeJobsCount: allActiveJobs.length,
                                earningsToday: earningsToday,
                                earningsMonth: earningsMonth,
                                batteryLevel: batteryLevel,
                                networkStatus: networkStatus,
                                lastSyncVal: lastSyncVal,
                                isAr: isAr,
                              ),
                              const SizedBox(height: 18),

                              if (_locationIssue != null)
                                _buildLocationBlockedBanner(
                                  _locationIssue!,
                                  _isOnline,
                                  isAr,
                                ),

                              if (activeJobDoc != null &&
                                  activeJobDoc.data() != null) ...[
                                _buildConceptActiveJobCard(activeJobDoc, isAr),
                                const SizedBox(height: 18),
                              ],

                              const SizedBox(height: 22),

                              _buildHomeQuickActionsV2(
                                isAr,
                                activeJobDoc: activeJobDoc,
                              ),

                              const SizedBox(height: 24),

                              // 3. TODAY'S ACTIVE ORDERS TIMELINE (Never show completed orders on Home)
                              if (activeTodayJobs.isNotEmpty) ...[
                                _buildSectionHeader(
                                  isAr ? 'جدول طلبات اليوم' : 'Today’s Orders',
                                  isAr
                                      ? '${activeTodayJobs.length} طلبات'
                                      : '${activeTodayJobs.length} Orders',
                                ),
                                const SizedBox(height: 12),
                                _buildScheduleTimeline(activeTodayJobs),
                              ],
                            ],
                          ),
                        ),
                      ),
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

  Widget _buildConceptActiveJobCard(
    DocumentSnapshot<Map<String, dynamic>> doc,
    bool isAr,
  ) {
    final data = doc.data() ?? <String, dynamic>{};
    final job = ServiceRequestModel.fromDoc(doc);
    final status = normalizeJobStatus(data['status'] ?? job.status);
    final isPending = const {
      'assigned',
      'pending',
      'pending acceptance',
      'offered',
      'awaiting acceptance',
    }.contains(status);
    final device = (data['device'] ?? data['deviceModel'] ?? '').toString();
    final service =
        (data['service'] ?? data['serviceType'] ?? job.type).toString().trim();
    final title = device.isNotEmpty &&
            !service.toLowerCase().contains(device.toLowerCase())
        ? '$service — $device'
        : (service.isNotEmpty ? service : device);
    final customer = (data['clientName'] ??
            data['customerName'] ??
            job.customerName ??
            (isAr ? 'العميل' : 'Customer'))
        .toString();
    final address = job.address?.trim().isNotEmpty == true
        ? job.address!
        : (isAr ? 'الموقع غير متوفر' : 'Location not provided');
    final statusColor = jobStatusColor(status);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isAr ? 'المهمة النشطة' : 'Active job',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: kbiSeparator),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 14,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: kbiBlue.withValues(alpha: 0.09),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                      Icons.home_repair_service_rounded,
                      color: kbiBlue,
                      size: 25,
                    ),
                  ),
                  const SizedBox(width: 13),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title.isEmpty
                              ? (isAr ? 'طلب صيانة' : 'Service order')
                              : title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: kbiLabel,
                            fontSize: 16,
                            height: 1.2,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          customer,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: kbiSecondaryLabel,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.only(top: 14),
                    child: Icon(
                      CupertinoIcons.chevron_forward,
                      color: kbiSecondaryLabel,
                      size: 17,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 13),
              _buildConceptJobMetadata(
                CupertinoIcons.calendar,
                jobTimeLabel(data),
              ),
              const SizedBox(height: 7),
              _buildConceptJobMetadata(
                CupertinoIcons.location_solid,
                isPending ? _extractGeneralArea(address) : address,
              ),
              const SizedBox(height: 9),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.11),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  jobStatusLabel(status),
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 15),
              if (isPending)
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => TechnicianService.instance
                            .respondToOffer(
                                requestId: doc.id, decision: 'decline'),
                        style:
                            OutlinedButton.styleFrom(foregroundColor: kbiRed),
                        child: Text(isAr ? 'رفض' : 'Decline'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: FilledButton(
                        onPressed: () => TechnicianService.instance
                            .respondToOffer(
                                requestId: doc.id, decision: 'accept'),
                        child: Text(isAr ? 'قبول المهمة' : 'Accept job'),
                      ),
                    ),
                  ],
                )
              else
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => Navigator.of(context).push(
                      CupertinoPageRoute<void>(
                        builder: (_) => JobDetailsScreen(job: job),
                      ),
                    ),
                    child: Text(isAr ? 'متابعة' : 'Continue'),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildConceptJobMetadata(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: kbiSecondaryLabel, size: 15),
        const SizedBox(width: 7),
        Expanded(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: kbiSecondaryLabel,
              fontSize: 12.5,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHomeQuickActionsV2(
    bool isAr, {
    DocumentSnapshot<Map<String, dynamic>>? activeJobDoc,
  }) {
    final actions = [
      (
        icon: CupertinoIcons.calendar_badge_plus,
        label: isAr ? 'الجدول' : 'Schedule',
        accentColor: kbiBlue,
        onTap: () => widget.onNavigate?.call(1),
      ),
      (
        icon: CupertinoIcons.wrench_fill,
        label: isAr ? 'المعدات' : 'Equipment',
        accentColor: const Color(0xFF5856D6),
        onTap: () => widget.onNavigate?.call(4),
      ),
      (
        icon: CupertinoIcons.doc_text_fill,
        label: isAr ? 'النماذج' : 'Forms',
        accentColor: kbiGreen,
        onTap: () {
          if (activeJobDoc != null) {
            Navigator.of(context).push(
              CupertinoPageRoute<void>(
                builder: (_) => InvoiceFormScreen(
                  job: ServiceRequestModel.fromDoc(activeJobDoc),
                  locale: widget.locale,
                ),
              ),
            );
          } else {
            Navigator.of(context).push(
              CupertinoPageRoute<void>(
                builder: (_) => FormsListScreen(
                  locale: widget.locale,
                ),
              ),
            );
          }
        },
      ),
      (
        icon: CupertinoIcons.cube_box_fill,
        label: isAr ? 'القطع' : 'Parts',
        accentColor: kbiOrange,
        onTap: () {
          Navigator.of(context).push(
            CupertinoPageRoute<void>(
              builder: (_) => PartsInventoryScreen(
                locale: widget.locale,
                activeJob: activeJobDoc != null
                    ? ServiceRequestModel.fromDoc(activeJobDoc)
                    : null,
              ),
            ),
          );
        },
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isAr ? 'اختصارات' : 'Shortcuts',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            for (var index = 0; index < actions.length; index++) ...[
              if (index > 0) const SizedBox(width: 10),
              Expanded(
                child: Semantics(
                  button: true,
                  label: actions[index].label,
                  child: Material(
                    color: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: const BorderSide(color: kbiSeparator),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        actions[index].onTap();
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 13,
                        ),
                        child: Column(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: actions[index]
                                    .accentColor
                                    .withValues(alpha: 0.11),
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: Icon(
                                actions[index].icon,
                                color: actions[index].accentColor,
                                size: 21,
                              ),
                            ),
                            const SizedBox(height: 8),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                actions[index].label,
                                maxLines: 1,
                                style: const TextStyle(
                                  color: kbiLabel,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  // The dashboard is the content layer, so it stays visually solid. Glass is
  // reserved for the notification and availability controls floating above it.
  // ignore: unused_element
  Widget _buildTopSection({
    required String techName,
    required String techId,
    required double rating,
    required String serviceArea,
    required String photoUrl,
    required bool isOnline,
    required bool isBusy,
    required int jobsTodayCount,
    required int completedCount,
    required int activeJobsCount,
    required double earningsToday,
    required double earningsMonth,
    required int batteryLevel,
    required String networkStatus,
    required dynamic lastSyncVal,
    required bool isAr,
  }) {
    final firstName = techName.trim().split(RegExp(r'\s+')).first;
    final status = !isOnline ? 'offline' : (isBusy ? 'busy' : 'available');
    final statusColor = switch (status) {
      'available' => kbiGreen,
      'busy' => kbiOrange,
      _ => const Color(0xFF8E8E93),
    };
    final statusLabel = switch (status) {
      'available' => isAr ? 'متاح للطلبات' : 'Available for orders',
      'busy' => isAr ? 'مشغول بطلب حالي' : 'Busy with an active order',
      _ => isAr ? 'غير متصل' : 'Offline',
    };

    return Container(
      width: double.infinity,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFF0B1220),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0B1220).withValues(alpha: 0.20),
            blurRadius: 28,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Stack(
        children: [
          PositionedDirectional(
            top: -110,
            end: -90,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    statusColor.withValues(alpha: 0.28),
                    statusColor.withValues(alpha: 0),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.60),
                              width: 1.5,
                            ),
                          ),
                          child: ClipOval(
                            child: photoUrl.isNotEmpty
                                ? Image.network(
                                    photoUrl,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) =>
                                        _buildInitialsAvatar(firstName),
                                  )
                                : _buildInitialsAvatar(firstName),
                          ),
                        ),
                        PositionedDirectional(
                          end: -1,
                          bottom: 1,
                          child: Container(
                            width: 13,
                            height: 13,
                            decoration: BoxDecoration(
                              color: statusColor,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: const Color(0xFF0B1220),
                                width: 2,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 13),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            techName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              height: 1.18,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.35,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '$serviceArea  •  ${rating.toStringAsFixed(1)} ★  •  $techId',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.62),
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    LiquidGlassSurface(
                      semanticLabel:
                          isAr ? 'فتح الإشعارات' : 'Open notifications',
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const NotificationsScreen(),
                        ),
                      ),
                      blur: 16,
                      tint: Colors.white.withValues(alpha: 0.10),
                      borderColor: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(15),
                      shadows: const [],
                      padding: const EdgeInsets.all(12),
                      child: const Icon(
                        CupertinoIcons.bell,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: statusColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 7),
                    Expanded(
                      child: Text(
                        statusLabel,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.82),
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Text(
                      '$activeJobsCount ${isAr ? 'نشطة' : 'active'}',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.50),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Semantics(
                  label: isAr ? 'حالة التوفر' : 'Availability status',
                  child: CupertinoSlidingSegmentedControl<String>(
                    groupValue: status,
                    backgroundColor: Colors.black.withValues(alpha: 0.24),
                    thumbColor: Colors.white.withValues(alpha: 0.18),
                    padding: const EdgeInsets.all(3),
                    proportionalWidth: true,
                    onValueChanged: (value) {
                      if (_updatingStatus) return;
                      if (value != null && value != status) {
                        HapticFeedback.selectionClick();
                        _setAvailabilityMode(value);
                      }
                    },
                    children: {
                      'available': _buildAvailabilitySegment(
                        isAr ? 'متاح' : 'Available',
                        CupertinoIcons.bolt_fill,
                        status == 'available',
                      ),
                      'busy': _buildAvailabilitySegment(
                        isAr ? 'مشغول' : 'Busy',
                        CupertinoIcons.timer_fill,
                        status == 'busy',
                      ),
                      'offline': _buildAvailabilitySegment(
                        isAr ? 'غير متصل' : 'Offline',
                        CupertinoIcons.power,
                        status == 'offline',
                      ),
                    },
                  ),
                ),
                const SizedBox(height: 18),
                // Top Telemetry Status Pill Row (GPS Live | 88% | 5G Active | Synced)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildOperationalStatus(
                        isOnline
                            ? CupertinoIcons.location_fill
                            : CupertinoIcons.location_slash_fill,
                        isOnline ? 'GPS Live' : 'GPS Idle',
                        isOnline ? const Color(0xFF10B981) : const Color(0xFF8E8E93),
                      ),
                      Container(width: 1, height: 14, color: Colors.white.withValues(alpha: 0.12)),
                      _buildOperationalStatus(
                        CupertinoIcons.battery_75_percent,
                        '$batteryLevel%',
                        batteryLevel > 20 ? const Color(0xFF38BDF8) : const Color(0xFFEF4444),
                      ),
                      Container(width: 1, height: 14, color: Colors.white.withValues(alpha: 0.12)),
                      _buildOperationalStatus(
                        CupertinoIcons.wifi,
                        networkStatus,
                        const Color(0xFFA78BFA),
                      ),
                      Container(width: 1, height: 14, color: Colors.white.withValues(alpha: 0.12)),
                      _buildOperationalStatus(
                        CupertinoIcons.arrow_2_circlepath,
                        isAr ? 'متزامن' : 'Synced',
                        const Color(0xFFF59E0B),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // 2-Row 6-Metric Card
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.10),
                    ),
                  ),
                  child: Column(
                    children: [
                      // Top Row: Jobs Today, Completed, Active Jobs
                      Row(
                        children: [
                          Expanded(
                            child: _buildDashboardSummaryMetric(
                              icon: CupertinoIcons.doc_text_fill,
                              iconColor: const Color(0xFF38BDF8),
                              value: '$jobsTodayCount',
                              label: isAr ? 'طلبات اليوم' : 'Jobs Today',
                            ),
                          ),
                          _buildSummaryDivider(),
                          Expanded(
                            child: _buildDashboardSummaryMetric(
                              icon: CupertinoIcons.checkmark_seal_fill,
                              iconColor: const Color(0xFF10B981),
                              value: '$completedCount',
                              label: isAr ? 'مكتمل' : 'Completed',
                            ),
                          ),
                          _buildSummaryDivider(),
                          Expanded(
                            child: _buildDashboardSummaryMetric(
                              icon: CupertinoIcons.clock_fill,
                              iconColor: const Color(0xFFF59E0B),
                              value: '$activeJobsCount',
                              label: isAr ? 'طلبات نشطة' : 'Active Jobs',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Container(
                        height: 0.5,
                        margin: const EdgeInsets.symmetric(horizontal: 10),
                        color: Colors.white.withValues(alpha: 0.10),
                      ),
                      const SizedBox(height: 14),
                      // Bottom Row: Earnings Today, Monthly Earnings, Avg Rating
                      Row(
                        children: [
                          Expanded(
                            child: _buildDashboardSummaryMetric(
                              icon: CupertinoIcons.money_dollar_circle_fill,
                              iconColor: const Color(0xFFFBBF24),
                              value: 'AED ${earningsToday.toStringAsFixed(0)}',
                              label: isAr ? 'أرباح اليوم' : 'Earnings Today',
                              compact: true,
                            ),
                          ),
                          _buildSummaryDivider(),
                          Expanded(
                            child: _buildDashboardSummaryMetric(
                              icon: CupertinoIcons.graph_circle_fill,
                              iconColor: const Color(0xFF60A5FA),
                              value: 'AED ${earningsMonth.toStringAsFixed(0)}',
                              label: isAr ? 'أرباح الشهر' : 'Monthly Earnings',
                              compact: true,
                            ),
                          ),
                          _buildSummaryDivider(),
                          Expanded(
                            child: _buildDashboardSummaryMetric(
                              icon: CupertinoIcons.star_fill,
                              iconColor: const Color(0xFFF43F5E),
                              value: rating.toStringAsFixed(1),
                              label: isAr ? 'التقييم' : 'Avg Rating',
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvailabilitySegment(
    String label,
    IconData icon,
    bool selected,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 13,
            color: Colors.white.withValues(alpha: selected ? 1 : 0.58),
          ),
          const SizedBox(width: 5),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.white.withValues(alpha: selected ? 1 : 0.62),
                fontSize: 11.5,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDashboardSummaryMetric({
    IconData? icon,
    Color? iconColor,
    required String value,
    required String label,
    bool compact = false,
  }) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: compact ? 13 : 15, color: iconColor ?? Colors.white),
              const SizedBox(width: 5),
            ],
            Flexible(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  value,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: compact ? 15 : 18,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.55),
            fontSize: 10.5,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryDivider() {
    return Container(
      width: 0.5,
      height: 32,
      color: Colors.white.withValues(alpha: 0.13),
    );
  }

  Widget _buildOperationalStatus(IconData icon, String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 12),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.62),
            fontSize: 10.5,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildInitialsAvatar(String name) {
    return Container(
      color: const Color(0xFF0284C7),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'T',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }

  // --- 2. ACTIVE JOB REQUEST / WORKFLOW CARD ---
  // ignore: unused_element
  Widget _buildActiveJobCard(
      DocumentSnapshot<Map<String, dynamic>> doc, bool isAr) {
    final data = doc.data() ?? {};
    final rawStatus = (data['status'] ?? 'assigned').toString();
    final status = normalizeJobStatus(rawStatus);

    // Pre-acceptance check
    final bool isPreAcceptance = status == 'assigned' ||
        status == 'pending' ||
        status == 'awaiting_acceptance' ||
        status == 'offered';

    // Order ID (e.g. #KBI-1048)
    String rawId =
        (data['orderNumber'] ?? data['trackingCode'] ?? '').toString().trim();
    String cleanSuffix = rawId
        .replaceAll(RegExp(r'[^a-zA-Z0-9]'), '')
        .replaceAll('KBI', '')
        .replaceAll('kbi', '')
        .trim();
    if (cleanSuffix.isEmpty) {
      final docClean = doc.id
          .replaceAll(RegExp(r'[^a-zA-Z0-9]'), '')
          .replaceAll('KBI', '')
          .replaceAll('kbi', '')
          .trim();
      cleanSuffix = docClean.isNotEmpty ? docClean : '1048';
    }
    final orderId = '#KBI-$cleanSuffix';

    // Device and Service Type
    final device = (data['device'] ?? 'iPhone 15 Pro Max').toString();
    final serviceType =
        (data['serviceType'] ?? 'Screen Replacement').toString();

    // Assigned Order Price from Admin / Customer Order
    final rawPrice = data['totalAmount'] ??
        data['price'] ??
        data['finalAmount'] ??
        data['serviceAmount'] ??
        data['amount'] ??
        data['estimatedPrice'] ??
        0;
    final priceNum = rawPrice is num
        ? rawPrice.toDouble()
        : (double.tryParse(rawPrice.toString()) ?? 0);
    final priceStr = priceNum > 0 ? priceNum.toStringAsFixed(0) : '0';

    // Location & Privacy
    final fullAddress = (data['address'] ??
            (data['location'] is Map
                ? (data['location'] as Map)['address']
                : null) ??
            'Al Reem Island, Sky Tower Apt 2402, Abu Dhabi')
        .toString();
    final generalArea = _extractGeneralArea(fullAddress);
    const distanceEta = '6.2 km • 12 min';

    // Customer Contact
    final customerName =
        (data['clientName'] ?? data['customerName'] ?? 'Customer').toString();
    final customerPhone = (data['clientPhone'] ??
            data['customerPhone'] ??
            data['phone'] ??
            '+971502491034')
        .toString();

    final priority = _formatPriorityLabel(data['priority']?.toString());
    final priorityColor = _getPriorityColor(data['priority']?.toString());

    final rawLat = data['latitude'] ??
        (data['location'] is Map ? (data['location'] as Map)['lat'] : null);
    final rawLng = data['longitude'] ??
        (data['location'] is Map ? (data['location'] as Map)['lng'] : null);
    final double? lat = rawLat is num ? rawLat.toDouble() : null;
    final double? lng = rawLng is num ? rawLng.toDouble() : null;

    final serviceModel = ServiceRequestModel.fromDoc(doc);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isPreAcceptance
              ? const Color(0xFF0284C7).withValues(alpha: 0.4)
              : const Color(0xFFE2E8F0),
          width: isPreAcceptance ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isPreAcceptance
                ? const Color(0xFF0284C7).withValues(alpha: 0.08)
                : Colors.black.withValues(alpha: 0.03),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Card Header: Order ID + Priority Badge + Status Pill
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        orderId,
                        style: const TextStyle(
                          color: Color(0xFF0F172A),
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: priorityColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        priority,
                        style: TextStyle(
                          color: priorityColor,
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isPreAcceptance
                        ? const Color(0xFF0284C7).withValues(alpha: 0.12)
                        : const Color(0xFF10B981).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    isPreAcceptance
                        ? (isAr ? 'طلب جديد' : 'NEW REQUEST')
                        : jobStatusLabel(rawStatus).toUpperCase(),
                    style: TextStyle(
                      color: isPreAcceptance
                          ? const Color(0xFF0284C7)
                          : const Color(0xFF10B981),
                      fontWeight: FontWeight.w800,
                      fontSize: 10.5,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),

          // Device, Service & Estimated Price Value
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.phone_iphone_rounded,
                      color: Colors.white, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        device,
                        style: const TextStyle(
                          color: Color(0xFF0F172A),
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        serviceType,
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: const Color(0xFF10B981).withValues(alpha: 0.25)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'AED $priceStr',
                        style: const TextStyle(
                          color: Color(0xFF059669),
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        isAr ? 'قيمة الطلب' : 'Est. Value',
                        style: const TextStyle(
                            color: Color(0xFF059669), fontSize: 9.5),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Location & Privacy Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: isPreAcceptance
                  ? Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            color: Color(0xFF0284C7), size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '$generalArea • $distanceEta away',
                            style: const TextStyle(
                              color: Color(0xFF0F172A),
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text('Masked',
                              style: TextStyle(
                                  color: Color(0xFF64748B), fontSize: 10)),
                        ),
                      ],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.pin_drop_rounded,
                                color: Color(0xFF0284C7), size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                fullAddress,
                                style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.person_outline_rounded,
                                color: Color(0xFF64748B), size: 15),
                            const SizedBox(width: 6),
                            Text(
                              customerName,
                              style: const TextStyle(
                                  color: Color(0xFF475569),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500),
                            ),
                            const Spacer(),
                            const Text(
                              distanceEta,
                              style: TextStyle(
                                  color: Color(0xFF0284C7),
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ],
                    ),
            ),
          ),

          // PRE-ACCEPTANCE: PRIVACY BANNER & ACCEPT/DECLINE BUTTONS
          if (isPreAcceptance) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 10, 18, 0),
              child: Row(
                children: [
                  const Icon(Icons.lock_outline_rounded,
                      size: 13, color: Color(0xFF64748B)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      isAr
                          ? 'سيتم كشف العنوان ورقم الهاتف بالكامل فور قبول الطلب'
                          : 'Full address, navigation & contact unlocked after acceptance.',
                      style: const TextStyle(
                          color: Color(0xFF64748B), fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        await TechnicianService.instance.respondToOffer(
                          requestId: doc.id,
                          decision: 'decline',
                        );
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Order declined.')),
                          );
                        }
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFEF4444),
                        side: const BorderSide(color: Color(0xFFEF4444)),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                        minimumSize: const Size.fromHeight(48),
                      ),
                      child: Text(
                        isAr ? 'رفض' : 'Decline',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: FilledButton.icon(
                      onPressed: () async {
                        await TechnicianService.instance.respondToOffer(
                          requestId: doc.id,
                          decision: 'accept',
                        );
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              backgroundColor: Color(0xFF10B981),
                              content: Text(
                                  'Order accepted! Customer details unlocked.'),
                            ),
                          );
                        }
                      },
                      icon: const Icon(Icons.check_rounded, size: 18),
                      label: Text(
                        isAr ? 'قبول الطلب' : 'Accept Job',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                        minimumSize: const Size.fromHeight(48),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            // POST-ACCEPTANCE: QUICK ACTIONS (Call / WhatsApp / Navigate) + WORKFLOW BUTTON
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 14, 18, 0),
              child: Row(
                children: [
                  Expanded(
                    child: _buildQuickActionButton(
                      icon: Icons.phone_rounded,
                      label: isAr ? 'اتصال' : 'Call',
                      color: const Color(0xFF0F172A),
                      onTap: () async {
                        final uri = Uri.parse('tel:$customerPhone');
                        if (await canLaunchUrl(uri)) await launchUrl(uri);
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildQuickActionButton(
                      icon: Icons.chat_bubble_rounded,
                      label: isAr ? 'واتساب' : 'WhatsApp',
                      color: const Color(0xFF25D366),
                      onTap: () async {
                        final cleanPhone =
                            customerPhone.replaceAll(RegExp(r'[^0-9]'), '');
                        final uri = Uri.parse(
                            'https://wa.me/$cleanPhone?text=${Uri.encodeComponent('Hello $customerName, I am your KBI certified technician on the way for your $device repair.')}');
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri,
                              mode: LaunchMode.externalApplication);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildQuickActionButton(
                      icon: Icons.near_me_rounded,
                      label: isAr ? 'ملاحة' : 'Navigate',
                      color: const Color(0xFF0284C7),
                      onTap: () =>
                          _openNavigationPicker(context, lat, lng, fullAddress),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: _buildWorkflowStageButton(
                docId: doc.id,
                status: status,
                serviceModel: serviceModel,
                isAr: isAr,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12.5,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- STEP-BY-STEP WORKFLOW BUTTON ---
  Widget _buildWorkflowStageButton({
    required String docId,
    required String status,
    required ServiceRequestModel serviceModel,
    required bool isAr,
  }) {
    String label;
    IconData icon;
    Color color = const Color(0xFF0F172A);
    VoidCallback onPressed;

    if (status == 'accepted') {
      label = isAr ? 'بدء الرحلة للعميل 🚗' : 'Start Trip 🚗';
      icon = Icons.directions_car_rounded;
      onPressed = () async {
        await TechnicianService.instance.updateJobStatus(
          requestId: docId,
          status: 'on_the_way',
          notes: 'Technician is en route to customer location.',
        );
      };
    } else if (status == 'on_the_way') {
      label = isAr ? 'تم الوصول لموقع العميل 📍' : 'Arrived at Location 📍';
      icon = Icons.location_pin;
      color = const Color(0xFF0284C7);
      onPressed = () async {
        await TechnicianService.instance.updateJobStatus(
          requestId: docId,
          status: 'arrived',
          notes: 'Technician has arrived at customer premises.',
        );
      };
    } else if (status == 'arrived') {
      label = isAr ? 'بدء فحص وإصلاح الجهاز 🛠️' : 'Start Repair 🛠️';
      icon = Icons.build_rounded;
      color = const Color(0xFFF59E0B);
      onPressed = () async {
        await TechnicianService.instance.updateJobStatus(
          requestId: docId,
          status: 'in_progress',
          notes: 'Technician has commenced diagnostic & repair.',
        );
      };
    } else {
      // in_progress or other active state -> Open Handover / Complete
      label = isAr ? 'إكمال الطلب وتسليم الجهاز ✨' : 'Complete Job ✨';
      icon = Icons.task_alt_rounded;
      color = const Color(0xFF10B981);
      onPressed = () {
        Navigator.push(
          context,
          MaterialPageRoute(
              builder: (_) => JobDetailsScreen(job: serviceModel)),
        );
      };
    }

    return SizedBox(
      width: double.infinity,
      height: 50,
      child: FilledButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 18),
        label: Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14.5),
        ),
        style: FilledButton.styleFrom(
          backgroundColor: color,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }

  // --- 3. APPLE LIQUID GLASS & M3 EXPRESSIVE RADAR / STANDBY STATE ---
  // ignore: unused_element
  Widget _buildEmptyState(bool isOnline, bool isAr, {bool isBusy = false}) {
    final stateColor = !isOnline
        ? const Color(0xFF64748B)
        : isBusy
            ? const Color(0xFFF59E0B)
            : const Color(0xFF0284C7);

    final title = !isOnline
        ? (isAr ? 'أنت حالياً غير متصل' : 'You’re currently offline.')
        : isBusy
            ? (isAr
                ? 'أنت في وضع العمل (مشغول)'
                : 'You’re currently in Busy Operations.')
            : (isAr ? 'أنت متصل وجاهز للعمل' : 'You’re online & available.');

    final description = !isOnline
        ? (isAr
            ? 'قم بالتبديل إلى متاح أعلاه لبدء استقبال طلبات الصيانة.'
            : 'Switch to Available above or tap below to start receiving customer orders.')
        : isBusy
            ? (isAr
                ? 'وضع الإرسال معلق مؤقتاً أثناء إتمام مهامك الحالية.'
                : 'Auto-dispatch is paused while you complete your active assignment.')
            : (isAr
                ? 'أولوية الإرسال المباشر نشطة في أبوظبي • يرجى إبقاء GPS قيد التشغيل'
                : 'High dispatch priority active in Abu Dhabi • Telemetry broadcasting');

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: stateColor.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.88),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.8),
                width: 1.5,
              ),
            ),
            child: Column(
              children: [
                Container(
                  width: 68,
                  height: 68,
                  decoration: BoxDecoration(
                    color: stateColor.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: stateColor.withValues(alpha: 0.25),
                      width: 1.5,
                    ),
                  ),
                  child: Icon(
                    !isOnline
                        ? Icons.power_settings_new_rounded
                        : isBusy
                            ? Icons.timelapse_rounded
                            : Icons.radar_rounded,
                    color: stateColor,
                    size: 32,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
                if (!isOnline) ...[
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: () {
                      HapticFeedback.mediumImpact();
                      _setAvailabilityMode('available');
                    },
                    icon: const Icon(Icons.flash_on_rounded, size: 18),
                    label: Text(isAr
                        ? 'الاتصال واستقبال الطلبات'
                        : 'Go Online & Receive Orders'),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF00C9A7),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                      elevation: 4,
                      shadowColor:
                          const Color(0xFF00C9A7).withValues(alpha: 0.4),
                    ),
                  ),
                ] else if (isBusy) ...[
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      FilledButton.icon(
                        onPressed: () {
                          HapticFeedback.mediumImpact();
                          _setAvailabilityMode('available');
                        },
                        icon: const Icon(Icons.check_circle_rounded, size: 18),
                        label: Text(isAr
                            ? 'إنهاء واستقبال طلب جديد'
                            : 'Ready for New Order'),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF00C9A7),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 2,
                          shadowColor:
                              const Color(0xFF00C9A7).withValues(alpha: 0.3),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- 4. TODAY'S SCHEDULE TIMELINE ---
  Widget _buildSectionHeader(String title, String count) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            count,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildScheduleTimeline(
      List<DocumentSnapshot<Map<String, dynamic>>> jobs) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: List.generate(jobs.length, (index) {
          final doc = jobs[index];
          final data = doc.data() ?? <String, dynamic>{};
          final date = jobDate(data);
          final priority = _formatPriorityLabel(data['priority']?.toString());
          final color = _getPriorityColor(data['priority']?.toString());
          final address = (data['address'] ??
                  (data['location'] is Map
                      ? (data['location'] as Map)['address']
                      : null) ??
                  'Abu Dhabi, UAE')
              .toString();

          final item = InkWell(
            onTap: () {
              final model = ServiceRequestModel.fromDoc(doc);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => JobDetailsScreen(job: model)),
              );
            },
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      date == null
                          ? 'Today'
                          : '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}',
                      style: const TextStyle(
                        color: Color(0xFF475569),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                (data['device'] ??
                                        data['serviceType'] ??
                                        'Device Service')
                                    .toString(),
                                style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: color.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                priority,
                                style: TextStyle(
                                  color: color,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          (data['clientName'] ??
                                  data['customerName'] ??
                                  'Customer')
                              .toString(),
                          style: const TextStyle(
                              color: Color(0xFF64748B), fontSize: 12),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined,
                                size: 12, color: Color(0xFF94A3B8)),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                address,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    color: Color(0xFF94A3B8), fontSize: 11.5),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.chevron_right_rounded,
                      color: Color(0xFFCBD5E1), size: 18),
                ],
              ),
            ),
          );

          if (index == jobs.length - 1) return item;
          return Column(
            children: [
              item,
              const Divider(
                  height: 1,
                  indent: 16,
                  endIndent: 16,
                  color: Color(0xFFF1F5F9)),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildDashboardSkeleton() {
    Widget bar(double width, double height) => Container(
          width: width,
          height: height,
          decoration: const BoxDecoration(
            color: Color(0xFFE9EAED),
            borderRadius: BorderRadius.all(Radius.circular(10)),
          ),
        );
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          bar(190, 24),
          const SizedBox(height: 8),
          bar(120, 14),
          const SizedBox(height: 28),
          bar(double.infinity, 142),
          const SizedBox(height: 24),
          bar(110, 18),
          const SizedBox(height: 10),
          bar(double.infinity, 72),
          const SizedBox(height: 24),
          bar(double.infinity, 220),
        ],
      ),
    );
  }
}
