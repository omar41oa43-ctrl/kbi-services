import 'dart:async';
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart' as fmap;
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart' as latlng;
import 'package:url_launcher/url_launcher.dart';
import '../models/service_request.dart';
import '../services/location_tracking_service.dart';
import '../services/technician_service.dart';
import '../theme.dart';
import '../utils/job_utils.dart';
import 'job_details_screen.dart';
import 'notifications_screen.dart';

ImageProvider _safeAvatarProvider(String? urlOrData) {
  if (urlOrData == null || urlOrData.trim().isEmpty) {
    return const AssetImage('assets/images/kbi_welcome_technician.png');
  }
  final clean = urlOrData.trim();
  if (clean.startsWith('data:image')) {
    try {
      final commaIndex = clean.indexOf(',');
      if (commaIndex != -1) {
        final bytes = base64Decode(clean.substring(commaIndex + 1));
        return MemoryImage(bytes);
      }
    } catch (_) {
      return const AssetImage('assets/images/kbi_welcome_technician.png');
    }
  }
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return NetworkImage(clean);
  }
  if (clean.startsWith('assets/')) {
    return AssetImage(clean);
  }
  return const AssetImage('assets/images/kbi_welcome_technician.png');
}

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
  bool _isOnline = true;
  bool _canGoOnline = true;
  bool _initialAutoOnlineTriggered = false;

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

  Future<void> _restoreLocationTracking(String uid) async {
    try {
      await LocationTrackingService.instance.start(requestPermission: true);
    } catch (error) {
      debugPrint('Could not restore location tracking: $error');
    }
  }

  Future<void> _setAvailabilityMode(String mode) async {
    final cleanMode = mode.toLowerCase().trim();
    if (cleanMode == 'available' && !_canGoOnline) {
      if (mounted) {
        final isAr = widget.locale.languageCode == 'ar';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isAr
                  ? 'الحساب بانتظار الموافقة أو موقوف، ولا يمكن الاتصال الآن.'
                  : 'Account awaiting approval or suspended. Cannot go online.',
            ),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
      return;
    }

    final isOnline = cleanMode != 'offline';
    final isAvailable = cleanMode == 'available';

    setState(() {
      _isOnline = isOnline;
    });

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        if (isOnline) {
          try {
            await LocationTrackingService.instance
                .start(requestPermission: true);
          } catch (_) {}
        } else {
          try {
            await LocationTrackingService.instance.stop();
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
    }
  }

  String _extractGeneralArea(String? fullAddress) {
    if (fullAddress == null || fullAddress.trim().isEmpty)
      return 'UAE Service Area';
    final parts = fullAddress.split(',');
    if (parts.length >= 2) {
      return '${parts[0].trim()}, ${parts[1].trim()}';
    }
    return fullAddress.trim();
  }

  void _openNavigation(double? lat, double? lng, String address) async {
    final hasCoords = lat != null && lng != null && (lat != 0 || lng != 0);
    Uri uri;
    if (hasCoords) {
      uri = Uri.parse('https://maps.apple.com/?daddr=$lat,$lng&dirflg=d');
      if (!await canLaunchUrl(uri)) {
        uri = Uri.parse(
            'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng');
      }
    } else {
      final enc = Uri.encodeComponent(address);
      uri = Uri.parse('https://maps.apple.com/?daddr=$enc&dirflg=d');
    }
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final isAr = widget.locale.languageCode == 'ar';

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: _techStream,
          builder: (context, techSnap) {
            final techData = techSnap.data?.data();
            final String techName = techData?['full_name'] ??
                techData?['name'] ??
                user?.displayName ??
                'Ahmed';
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

            _isOnline = _canGoOnline && !isExplicitlyOffline;

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

            final String techId =
                (techData?['employeeId'] ?? techData?['techId'] ?? 'KBI-007396')
                    .toString();
            final String photoUrl = (techData?['profile_photo'] ??
                    techData?['photoUrl'] ??
                    techData?['avatarUrl'] ??
                    techData?['photoURL'] ??
                    techData?['profilePhoto'] ??
                    user?.photoURL ??
                    '')
                .toString();
            final int batteryLevel = (techData?['batteryLevel'] is num)
                ? (techData!['batteryLevel'] as num).toInt()
                : 88;

            return StreamBuilder<List<DocumentSnapshot<Map<String, dynamic>>>>(
              stream: _jobsStream,
              builder: (context, jobsSnap) {
                final myJobs = jobsSnap.data ?? [];

                // Feature a new, unaccepted dispatch before work already in
                // progress. Within the same stage, the newest update wins.
                final featuredJobs = myJobs.where((doc) {
                  final data = doc.data();
                  if (data == null) return false;
                  return jobHomePriority(data['status']) < 3;
                }).toList()
                  ..sort((left, right) {
                    final leftData = left.data() ?? <String, dynamic>{};
                    final rightData = right.data() ?? <String, dynamic>{};
                    final priorityComparison = jobHomePriority(
                      leftData['status'],
                    ).compareTo(jobHomePriority(rightData['status']));
                    if (priorityComparison != 0) return priorityComparison;

                    final leftDate = TechnicianService.extractDocDate(leftData);
                    final rightDate =
                        TechnicianService.extractDocDate(rightData);
                    if (leftDate == null && rightDate == null) return 0;
                    if (leftDate == null) return 1;
                    if (rightDate == null) return -1;
                    return rightDate.compareTo(leftDate);
                  });
                final activeJobDoc =
                    featuredJobs.isEmpty ? null : featuredJobs.first;

                final todayJobs = myJobs.where((d) {
                  final data = d.data();
                  return data != null &&
                      isSameLocalDay(jobDate(data), DateTime.now());
                }).toList();

                final completedTodayJobs = todayJobs.where((d) {
                  final data = d.data();
                  if (data == null) return false;
                  return normalizeJobStatus(data['status']) == 'completed';
                }).toList();

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
                // Recent Completed Activity
                final recentCompletedDocs = myJobs.where((d) {
                  final data = d.data();
                  if (data == null) return false;
                  return normalizeJobStatus(data['status']) == 'completed';
                }).toList()
                  ..sort((a, b) => (jobDate(b.data() ?? {}) ?? DateTime.now())
                      .compareTo(jobDate(a.data() ?? {}) ?? DateTime.now()));

                final currentStatusMode = !_isOnline
                    ? 'offline'
                    : (rawStatus == 'busy' ? 'busy' : 'available');

                return SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics()),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 500),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(18, 16, 18, 140),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // 1. Technician header and compact availability control
                            _buildHeader(
                              name: techName,
                              techId: techId,
                              photoUrl: photoUrl,
                              currentMode: currentStatusMode,
                              batteryLevel: batteryLevel,
                              isAr: isAr,
                            ),
                            const SizedBox(height: 22),

                            // 4. Next Job Section Header + Card
                            _buildNextJobSection(
                              activeJobDoc: activeJobDoc,
                              isAr: isAr,
                            ),
                            const SizedBox(height: 24),

                            // 5. Today Overview Header + 3 Metric Cards
                            _buildTodayOverview(
                              jobsToday: todayJobs.length,
                              completedJobs: completedTodayJobs.length,
                              earningsToday: earningsToday,
                              activeJobs: activeTodayJobs.length,
                              isAr: isAr,
                            ),
                            const SizedBox(height: 24),

                            // 6. Recent Activity
                            _buildRecentActivity(
                              completedDocs: recentCompletedDocs,
                              isAr: isAr,
                            ),
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
    );
  }

  // ==========================================
  // 1. HEADER
  // ==========================================
  Widget _buildHeader({
    required String name,
    required String techId,
    required String photoUrl,
    required String currentMode,
    required int batteryLevel,
    required bool isAr,
  }) {
    final statusColor = currentMode == 'available'
        ? const Color(0xFF16A34A)
        : currentMode == 'busy'
            ? const Color(0xFFF59E0B)
            : const Color(0xFF94A3B8);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE8EEF5)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.055),
            blurRadius: 22,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Color(0xFFE2E8F0),
                    ),
                    child: ClipOval(
                      child: Image(
                        image: _safeAvatarProvider(photoUrl),
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            _buildAvatarFallback(name),
                      ),
                    ),
                  ),
                  Positioned(
                    right: isAr ? null : 0,
                    left: isAr ? 0 : null,
                    bottom: 1,
                    child: Container(
                      width: 15,
                      height: 15,
                      decoration: BoxDecoration(
                        color: statusColor,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      isAr ? 'مرحباً بعودتك' : 'Welcome back',
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: 3),
                    GestureDetector(
                      onTap: () {
                        Clipboard.setData(ClipboardData(text: techId));
                        HapticFeedback.selectionClick();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(isAr
                                ? 'تم نسخ المعرف: $techId'
                                : 'Copied ID: $techId'),
                            duration: const Duration(seconds: 1),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              techId,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.copy_rounded,
                              size: 12, color: Color(0xFF94A3B8)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: IconButton(
                  tooltip: isAr ? 'الإشعارات' : 'Notifications',
                  icon: const Icon(CupertinoIcons.bell,
                      size: 19, color: Color(0xFF334155)),
                  onPressed: () {
                    Navigator.push(
                      context,
                      CupertinoPageRoute(
                          builder: (_) => const NotificationsScreen()),
                    );
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 15),
          SizedBox(
            width: double.infinity,
            child: CupertinoSlidingSegmentedControl<String>(
              groupValue: currentMode,
              backgroundColor: const Color(0xFFF1F5F9),
              thumbColor: Colors.white,
              padding: const EdgeInsets.all(4),
              children: {
                'available': _buildStatusSegment(
                  title: isAr ? 'متصل' : 'Online',
                  color: const Color(0xFF16A34A),
                  selected: currentMode == 'available',
                ),
                'busy': _buildStatusSegment(
                  title: isAr ? 'مشغول' : 'Busy',
                  color: const Color(0xFFF59E0B),
                  selected: currentMode == 'busy',
                ),
                'offline': _buildStatusSegment(
                  title: isAr ? 'خارج' : 'Offline',
                  color: const Color(0xFF94A3B8),
                  selected: currentMode == 'offline',
                ),
              },
              onValueChanged: (value) {
                if (value == null || value == currentMode) return;
                HapticFeedback.selectionClick();
                _setAvailabilityMode(value);
              },
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                _buildTelemetryItem(
                  icon: Icons.location_on_rounded,
                  color: const Color(0xFF16A34A),
                  label: isAr ? 'الموقع مباشر' : 'GPS live',
                ),
                const Spacer(),
                _buildTelemetryItem(
                  icon: CupertinoIcons.arrow_2_circlepath,
                  color: const Color(0xFF2563EB),
                  label: isAr ? 'مزامن الآن' : 'Synced now',
                ),
                const Spacer(),
                _buildTelemetryItem(
                  icon: CupertinoIcons.battery_75_percent,
                  color: batteryLevel <= 20
                      ? const Color(0xFFEF4444)
                      : const Color(0xFF16A34A),
                  label: '$batteryLevel%',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusSegment({
    required String title,
    required Color color,
    required bool selected,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: selected
                    ? const Color(0xFF0F172A)
                    : const Color(0xFF64748B),
                fontSize: 12,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTelemetryItem({
    required IconData icon,
    required Color color,
    required String label,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF64748B),
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildAvatarFallback(String name) {
    return Container(
      color: const Color(0xFFE2E8F0),
      alignment: Alignment.center,
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : 'A',
        style: const TextStyle(
          color: Color(0xFF0F172A),
          fontSize: 22,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  // ==========================================
  // 4. NEXT JOB SECTION & CARD
  // ==========================================
  Widget _buildEmptyNextJobSection({required bool isAr}) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              isAr ? 'الطلب القادم' : 'Next Job',
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 16,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
              ),
            ),
            GestureDetector(
              onTap: () => widget.onNavigate?.call(1),
              child: Text(
                isAr ? 'عرض الكل' : 'View all',
                style: const TextStyle(
                  color: Color(0xFF2563EB),
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFF1F5F9)),
          ),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: kbiBlue.withValues(alpha: 0.09),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: const Icon(
                  CupertinoIcons.bell,
                  color: kbiBlue,
                  size: 21,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isAr ? 'جاهز لطلب جديد' : 'Ready for a new order',
                      style: const TextStyle(
                        color: kbiLabel,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isAr
                          ? 'سيظهر أي طلب جديد هنا فور تعيينه لك.'
                          : 'A new dispatch will appear here as soon as it is assigned to you.',
                      style: const TextStyle(
                        color: kbiSecondaryLabel,
                        fontSize: 12,
                        height: 1.4,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildNextJobSection({
    required DocumentSnapshot<Map<String, dynamic>>? activeJobDoc,
    required bool isAr,
  }) {
    if (activeJobDoc == null) {
      return _buildEmptyNextJobSection(isAr: isAr);
    }

    final data = activeJobDoc.data() ?? <String, dynamic>{};
    final String orderNum = compactOrderReference(
      data,
      documentId: activeJobDoc.id,
    );
    final rawDevices = data['devices'];
    final firstDevice =
        rawDevices is List && rawDevices.isNotEmpty ? rawDevices.first : null;
    final firstDeviceData =
        firstDevice is Map ? Map<String, dynamic>.from(firstDevice) : null;
    final fallbackDevice = [
      firstDeviceData?['brand'],
      firstDeviceData?['model'],
    ]
        .where((value) => value != null && value.toString().trim().isNotEmpty)
        .join(' ');
    final String device = (data['device'] ??
            data['deviceModel'] ??
            (fallbackDevice.isEmpty
                ? (isAr ? 'صيانة جهاز' : 'Device repair')
                : fallbackDevice))
        .toString();
    final String service = localizedJobContentLabel(
        data['service'] ??
            data['serviceType'] ??
            data['issue'] ??
            firstDeviceData?['issue'] ??
            data['description'] ??
            (isAr ? 'تفاصيل الخدمة قيد التحديث' : 'Service details pending'),
        isArabic: isAr);
    final rawAddress = data['address']?.toString();
    final String address = rawAddress == null || rawAddress.trim().isEmpty
        ? (isAr ? 'نطاق الخدمة داخل الإمارات' : 'UAE Service Area')
        : _extractGeneralArea(rawAddress);
    final String timeSlot = (data['scheduledTime'] ??
            data['timeSlot'] ??
            (isAr ? 'لم يُحدد الوقت' : 'Time not set'))
        .toString();
    final String phone =
        (data['customerPhone'] ?? data['phone'] ?? '').toString();
    final String rawStatus = normalizeJobStatus(data['status']);
    final bool isNewAssignment = jobHomePriority(rawStatus) == 0;
    final String statusPillLabel = isNewAssignment
        ? (isAr ? 'طلب جديد' : 'New Assignment')
        : localizedJobStatusLabel(rawStatus, isArabic: isAr);
    final Color statusColor = jobStatusColor(rawStatus);

    // -------------------------------------------------------------
    // Extract Real Destination Location and Calculate Live Distance & ETA
    // -------------------------------------------------------------
    final rawLat = data['latitude'] ??
        (data['location'] is Map ? (data['location'] as Map)['lat'] : null);
    final rawLng = data['longitude'] ??
        (data['location'] is Map ? (data['location'] as Map)['lng'] : null);
    final bool hasDestination = rawLat is num && rawLng is num;
    final double destLat = hasDestination ? rawLat.toDouble() : 25.2048;
    final double destLng = hasDestination ? rawLng.toDouble() : 55.2708;
    final latlng.LatLng jobPoint = latlng.LatLng(destLat, destLng);

    // Get current tech position
    final Position? techPos = LocationTrackingService.instance.lastPosition;
    final latlng.LatLng? rawTechPoint = techPos == null
        ? null
        : latlng.LatLng(techPos.latitude, techPos.longitude);
    final bool techLocationIsInServiceArea = rawTechPoint != null &&
        rawTechPoint.latitude >= 22.5 &&
        rawTechPoint.latitude <= 26.5 &&
        rawTechPoint.longitude >= 51.0 &&
        rawTechPoint.longitude <= 56.7;
    final latlng.LatLng? techPoint =
        techLocationIsInServiceArea ? rawTechPoint : null;

    // Calculate real road distance (or geodesic fallback)
    final double? distanceMeters = hasDestination && techPoint != null
        ? Geolocator.distanceBetween(
            techPoint.latitude,
            techPoint.longitude,
            destLat,
            destLng,
          )
        : null;

    // Real distance display
    final String distanceDisplay = distanceMeters == null
        ? (isAr ? 'غير متاحة' : 'Unavailable')
        : distanceMeters < 1000
            ? '${distanceMeters.round()} ${isAr ? 'م' : 'm'}'
            : '${(distanceMeters / 1000).toStringAsFixed(1)} ${isAr ? 'كم' : 'km'}';

    // Real ETA calculation: assume average city traffic speed 35 km/h
    final int? etaMinutes = distanceMeters == null
        ? null
        : ((distanceMeters / 1000) / 35 * 60).round().clamp(1, 180);
    final String etaDisplay = etaMinutes == null
        ? (isAr ? 'غير متاح' : 'Unavailable')
        : etaMinutes < 60
            ? '$etaMinutes ${isAr ? 'د' : 'min'}'
            : '${etaMinutes ~/ 60}${isAr ? 'س' : 'h'} ${etaMinutes % 60}${isAr ? 'د' : 'm'}';

    // Midpoint for map camera center
    final latlng.LatLng mapCenter = techPoint == null
        ? jobPoint
        : latlng.LatLng(
            (techPoint.latitude + destLat) / 2,
            (techPoint.longitude + destLng) / 2,
          );

    return Column(
      children: [
        // Section Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              isNewAssignment
                  ? (isAr ? 'طلب جديد' : 'New Assignment')
                  : (isAr ? 'الطلب القادم' : 'Next Job'),
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 16,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
              ),
            ),
            GestureDetector(
              onTap: () => widget.onNavigate?.call(1),
              child: Text(
                isAr ? 'عرض الكل' : 'View all',
                style: const TextStyle(
                  color: Color(0xFF2563EB),
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Main Card
        GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              CupertinoPageRoute(
                builder: (_) => JobDetailsScreen(
                    job: ServiceRequestModel.fromDoc(activeJobDoc)),
              ),
            );
          },
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFF1F5F9)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Upper Row: Info (Left) + Interactive Live Map Graphic (Right)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Left Column: Status Badge, Order Number, Device, Issue, Address, Time
                    Expanded(
                      flex: 11,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Status Badge (Blue Pill with Navigation Icon)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 9, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.10),
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(
                                color: statusColor.withValues(alpha: 0.25),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  isNewAssignment
                                      ? CupertinoIcons.bell_fill
                                      : CupertinoIcons.location_north_fill,
                                  size: 11,
                                  color: statusColor,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  statusPillLabel,
                                  style: TextStyle(
                                    color: statusColor,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 10),

                          // Order ID
                          Text(
                            orderNum,
                            style: const TextStyle(
                              color: Color(0xFF0F172A),
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 3),

                          // Device & Issue
                          Text(
                            device,
                            style: const TextStyle(
                              color: Color(0xFF334155),
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            service,
                            style: const TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 12.5,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 10),

                          // Address Row
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(CupertinoIcons.location,
                                  size: 13, color: Color(0xFF94A3B8)),
                              const SizedBox(width: 5),
                              Expanded(
                                child: Text(
                                  address,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),

                          // Time Row
                          Row(
                            children: [
                              const Icon(CupertinoIcons.clock,
                                  size: 13, color: Color(0xFF94A3B8)),
                              const SizedBox(width: 5),
                              Text(
                                timeSlot,
                                style: const TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Right Column: Real Live Mini Map with Real Distance & ETA Pills
                    Expanded(
                      flex: 9,
                      child: Container(
                        height: 145,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Stack(
                          children: [
                            if (!hasDestination)
                              Positioned.fill(
                                child: DecoratedBox(
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF0F172A),
                                    borderRadius: BorderRadius.circular(18),
                                  ),
                                  child: Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(14),
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(
                                            CupertinoIcons.location_slash,
                                            color: Color(0xFF38BDF8),
                                            size: 28,
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            isAr
                                                ? 'بانتظار تثبيت الموقع'
                                                : 'Location pin pending',
                                            textAlign: TextAlign.center,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 11,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            // Live Interactive/Rendered OpenStreetMap with route polyline
                            if (hasDestination)
                              Positioned.fill(
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(18),
                                  child: AbsorbPointer(
                                    child: fmap.FlutterMap(
                                      options: fmap.MapOptions(
                                        initialCenter: mapCenter,
                                        initialZoom: 14,
                                        initialCameraFit: techPoint == null
                                            ? null
                                            : fmap.CameraFit.coordinates(
                                                coordinates: [
                                                  techPoint,
                                                  jobPoint,
                                                ],
                                                padding:
                                                    const EdgeInsets.all(34),
                                                maxZoom: 15,
                                              ),
                                        interactionOptions:
                                            const fmap.InteractionOptions(
                                          flags: fmap.InteractiveFlag.none,
                                        ),
                                      ),
                                      children: [
                                        fmap.TileLayer(
                                          urlTemplate:
                                              'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                                          subdomains: const [
                                            'a',
                                            'b',
                                            'c',
                                            'd'
                                          ],
                                          userAgentPackageName:
                                              'ae.kbi.kbiTechnicianApp',
                                          maxZoom: 19,
                                        ),
                                        if (techPoint != null)
                                          fmap.PolylineLayer(
                                            polylines: [
                                              fmap.Polyline(
                                                points: [techPoint, jobPoint],
                                                color: const Color(0xFF38BDF8),
                                                strokeWidth: 4.0,
                                                borderColor:
                                                    const Color(0xFF0F172A),
                                                borderStrokeWidth: 1.5,
                                              ),
                                            ],
                                          ),
                                        fmap.MarkerLayer(
                                          markers: [
                                            // Tech Origin Marker
                                            if (techPoint != null)
                                              fmap.Marker(
                                                point: techPoint,
                                                width: 24,
                                                height: 24,
                                                child: Container(
                                                  decoration: BoxDecoration(
                                                    color:
                                                        const Color(0xFF38BDF8),
                                                    shape: BoxShape.circle,
                                                    border: Border.all(
                                                        color: Colors.white,
                                                        width: 3),
                                                    boxShadow: const [
                                                      BoxShadow(
                                                        color: Colors.black45,
                                                        blurRadius: 6,
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                            // Customer Destination Pin
                                            fmap.Marker(
                                              point: jobPoint,
                                              width: 28,
                                              height: 28,
                                              child: const Icon(
                                                CupertinoIcons.location_solid,
                                                color: Color(0xFFDC2626),
                                                size: 26,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),

                            // Floating Pill 1: Real Distance
                            if (hasDestination && techPoint != null)
                              Positioned(
                                top: 8,
                                left: isAr ? null : 8,
                                right: isAr ? 8 : null,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 7, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.95),
                                    borderRadius: BorderRadius.circular(10),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black
                                            .withValues(alpha: 0.08),
                                        blurRadius: 6,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(CupertinoIcons.location_solid,
                                          size: 11, color: Color(0xFF2563EB)),
                                      const SizedBox(width: 4),
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            distanceDisplay,
                                            style: const TextStyle(
                                              color: Color(0xFF0F172A),
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                          Text(
                                            isAr ? 'المسافة' : 'Distance',
                                            style: const TextStyle(
                                              color: Color(0xFF64748B),
                                              fontSize: 8,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                            // Floating Pill 2: Real ETA
                            if (hasDestination && techPoint != null)
                              Positioned(
                                bottom: 8,
                                left: isAr ? null : 8,
                                right: isAr ? 8 : null,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 7, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.95),
                                    borderRadius: BorderRadius.circular(10),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black
                                            .withValues(alpha: 0.08),
                                        blurRadius: 6,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(CupertinoIcons.time,
                                          size: 11, color: Color(0xFF2563EB)),
                                      const SizedBox(width: 4),
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            etaDisplay,
                                            style: const TextStyle(
                                              color: Color(0xFF0F172A),
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                          Text(
                                            isAr ? 'الوقت' : 'ETA',
                                            style: const TextStyle(
                                              color: Color(0xFF64748B),
                                              fontSize: 8,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // Bottom Action Buttons: Call | WhatsApp | Navigate
                Row(
                  children: [
                    // Call Button
                    Expanded(
                      flex: 7,
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final uri = Uri.parse('tel:$phone');
                          if (await canLaunchUrl(uri)) launchUrl(uri);
                        },
                        icon: const Icon(CupertinoIcons.phone,
                            size: 15, color: Color(0xFF2563EB)),
                        label: Text(
                          isAr ? 'اتصال' : 'Call',
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: const BorderSide(color: Color(0xFFE2E8F0)),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // WhatsApp Button
                    Expanded(
                      flex: 9,
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final cleanPhone =
                              phone.replaceAll(RegExp(r'[^0-9]'), '');
                          final uri = Uri.parse('https://wa.me/$cleanPhone');
                          if (await canLaunchUrl(uri))
                            launchUrl(uri,
                                mode: LaunchMode.externalApplication);
                        },
                        icon: const Icon(Icons.chat_bubble_outline_rounded,
                            size: 15, color: Color(0xFF22C55E)),
                        label: Text(
                          isAr ? 'واتساب' : 'WhatsApp',
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: const BorderSide(color: Color(0xFFE2E8F0)),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Navigate Button (Solid Royal Blue)
                    Expanded(
                      flex: 9,
                      child: FilledButton.icon(
                        onPressed: () {
                          final lat = data['latitude'] ??
                              (data['location'] is Map
                                  ? (data['location'] as Map)['lat']
                                  : null);
                          final lng = data['longitude'] ??
                              (data['location'] is Map
                                  ? (data['location'] as Map)['lng']
                                  : null);
                          _openNavigation(
                            lat != null ? (lat as num).toDouble() : null,
                            lng != null ? (lng as num).toDouble() : null,
                            address,
                          );
                        },
                        icon: const Icon(CupertinoIcons.paperplane_fill,
                            size: 14, color: Colors.white),
                        label: Text(
                          isAr ? 'توجيه' : 'Navigate',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: Colors.white,
                          ),
                        ),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ==========================================
  // 5. TODAY OVERVIEW (3 CARDS)
  // ==========================================
  Widget _buildTodayOverview({
    required int jobsToday,
    required int completedJobs,
    required double earningsToday,
    required int activeJobs,
    required bool isAr,
  }) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              isAr ? 'نظرة عامة على اليوم' : 'Today Overview',
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 16,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
              ),
            ),
            GestureDetector(
              onTap: () => widget.onNavigate?.call(2),
              child: Text(
                isAr ? 'عرض الكل' : 'View all',
                style: const TextStyle(
                  color: Color(0xFF2563EB),
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Card 1: Jobs Today (Blue Icon)
              Expanded(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFF1F5F9)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(CupertinoIcons.briefcase,
                            color: Color(0xFF2563EB), size: 17),
                      ),
                      const SizedBox(height: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              '$jobsToday',
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.3,
                              ),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            isAr ? 'طلبات اليوم' : 'Jobs Today',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            isAr
                                ? '$completedJobs مكتمل'
                                : '$completedJobs Completed',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Card 2: Earnings Today (Green Icon)
              Expanded(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFF1F5F9)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(CupertinoIcons.creditcard,
                            color: Color(0xFF22C55E), size: 17),
                      ),
                      const SizedBox(height: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              'AED ${earningsToday.toStringAsFixed(0)}',
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.3,
                              ),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            isAr ? 'أرباح اليوم' : 'Earnings Today',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            isAr ? '+12% اليوم' : '+12% Today',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFF22C55E),
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Card 3: Active Job (Orange Icon)
              Expanded(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFF1F5F9)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFFBEB),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(CupertinoIcons.square_grid_2x2,
                            color: Color(0xFFF59E0B), size: 17),
                      ),
                      const SizedBox(height: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              '$activeJobs',
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.3,
                              ),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            isAr ? 'طلب نشط' : 'Active Job',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            isAr ? 'قيد التنفيذ' : 'In Progress',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ==========================================
  // 7. RECENT ACTIVITY
  // ==========================================
  Widget _buildRecentActivity({
    required List<DocumentSnapshot<Map<String, dynamic>>> completedDocs,
    required bool isAr,
  }) {
    final topDoc = completedDocs.isNotEmpty ? completedDocs.first : null;
    final topData = topDoc?.data() ?? <String, dynamic>{};
    final String ordNum = compactOrderReference(
      topData,
      documentId: topDoc?.id ?? 'recent-order',
    );
    final String service =
        (topData['service'] ?? topData['serviceType'] ?? 'Screen Replacement')
            .toString();
    final String address =
        _extractGeneralArea(topData['address']?.toString() ?? 'Al Reem Island');
    final num amt = topData['finalAmount'] ??
        topData['totalAmount'] ??
        topData['price'] ??
        250;

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              isAr ? 'النشاط الأخير' : 'Recent Activity',
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 16,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
              ),
            ),
            GestureDetector(
              onTap: () => widget.onNavigate?.call(1),
              child: Text(
                isAr ? 'عرض الكل' : 'View all',
                style: const TextStyle(
                  color: Color(0xFF2563EB),
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFF1F5F9)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              // Green Check Circle
              Container(
                width: 42,
                height: 42,
                decoration: const BoxDecoration(
                  color: Color(0xFF22C55E),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child:
                      Icon(Icons.check_rounded, color: Colors.white, size: 22),
                ),
              ),
              const SizedBox(width: 14),

              // Title + Specs + Date
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$ordNum ${isAr ? 'مكتمل' : 'Completed'}',
                      style: const TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$service  •  $address',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isAr ? 'اليوم، 09:15 ص' : 'Today, 09:15 AM',
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 10.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),

              // Price + Chevron
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'AED ${amt.toInt()}',
                    style: const TextStyle(
                      color: Color(0xFF16A34A),
                      fontSize: 14.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(CupertinoIcons.chevron_forward,
                      size: 14, color: Color(0xFF94A3B8)),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
