import 'dart:async';
import 'dart:ui' as ui;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/service_request.dart';
import '../services/storage_service.dart';
import '../services/technician_service.dart';
import '../theme.dart';
import '../utils/job_utils.dart';
import 'job_details_screen.dart';

enum OrderSortOption {
  newest,
  oldest,
  today,
  highestPriority,
  recentlyUpdated,
}

class JobsScreen extends StatefulWidget {
  final Locale locale;
  final void Function(Locale) onLocaleChanged;

  const JobsScreen({
    super.key,
    required this.onLocaleChanged,
    required this.locale,
  });

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  late final Stream<List<DocumentSnapshot<Map<String, dynamic>>>> _jobsStream;
  String _searchQuery = '';
  String _selectedFilter = 'Active';
  OrderSortOption _sortOption = OrderSortOption.newest;
  bool _isLoading = false;
  final Map<String, List<String>> _pendingPhotos = {};

  final TextEditingController _searchController = TextEditingController();

  final List<String> _filters = [
    'Active',
    'Today',
    'Upcoming',
    'Completed',
  ];

  @override
  void initState() {
    super.initState();
    _jobsStream = TechnicianService.instance.watchMyJobDocs();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _handleRefresh() async {
    setState(() => _isLoading = true);
    try {
      await TechnicianService.instance.refreshMyJobs();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to refresh jobs: $error')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAr = widget.locale.languageCode == 'ar';

    return Directionality(
      textDirection: isAr ? ui.TextDirection.rtl : ui.TextDirection.ltr,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: _buildM3AppBar(),
        body: StreamBuilder<List<DocumentSnapshot<Map<String, dynamic>>>>(
          stream: _jobsStream,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting ||
                _isLoading) {
              return _buildShimmerSkeletonLoader();
            }

            if (snapshot.hasError) {
              return _buildErrorState(snapshot.error);
            }
            final docs =
                snapshot.data ?? <DocumentSnapshot<Map<String, dynamic>>>[];

            final awaitingCount = docs.where((doc) {
              final status = normalizeJobStatus(doc.data()?['status']);
              return const {
                'assigned',
                'pending',
                'pending acceptance',
              }.contains(status);
            }).length;
            final inProgressCount = docs.where((doc) {
              final status = normalizeJobStatus(doc.data()?['status']);
              return const {
                'accepted',
                'on the way',
                'arrived',
                'in progress',
                'working',
              }.contains(status);
            }).length;

            // Process, filter, and sort docs
            final processedDocs = _filterAndSortDocs(docs);

            return RefreshIndicator(
              onRefresh: _handleRefresh,
              color: const Color(0xFF111318),
              backgroundColor: const Color(0xF2FFFFFF),
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 2, 16, 12),
                      child: _buildQueueBriefing(
                        total: docs.length,
                        awaiting: awaitingCount,
                        inProgress: inProgressCount,
                        isAr: isAr,
                      ),
                    ),
                  ),

                  // Queue summary and always-available search.
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 2, 16, 8),
                      child: _buildSearchBar(),
                    ),
                  ),

                  // Compact iOS-style queue segments.
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 6, 16, 8),
                      child: SizedBox(
                        width: double.infinity,
                        child: CupertinoSlidingSegmentedControl<String>(
                          groupValue: _selectedFilter,
                          backgroundColor: Colors.white.withValues(alpha: 0.72),
                          thumbColor: Colors.white,
                          padding: const EdgeInsets.all(3),
                          onValueChanged: (value) {
                            if (value == null) return;
                            HapticFeedback.selectionClick();
                            setState(() => _selectedFilter = value);
                          },
                          children: {
                            for (final filter in _filters)
                              filter: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                  vertical: 7,
                                ),
                                child: Text(
                                  _localizedFilter(filter, isAr),
                                  maxLines: 1,
                                  overflow: TextOverflow.fade,
                                  style: TextStyle(
                                    color: _selectedFilter == filter
                                        ? kbiLabel
                                        : kbiSecondaryLabel,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                          },
                        ),
                      ),
                    ),
                  ),

                  const SliverToBoxAdapter(child: SizedBox(height: 12)),

                  // Orders List or Empty State
                  if (processedDocs.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: _buildEmptyState(),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 110),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final doc = processedDocs[index];
                            final data = doc.data() ?? <String, dynamic>{};
                            final jobModel = ServiceRequestModel.fromDoc(doc);
                            final group = _orderGroupLabel(data);
                            final previousGroup = index == 0
                                ? null
                                : _orderGroupLabel(
                                    processedDocs[index - 1].data() ??
                                        <String, dynamic>{},
                                  );
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (group != previousGroup)
                                  Padding(
                                    padding: EdgeInsets.only(
                                      top: index == 0 ? 0 : 8,
                                      bottom: 9,
                                      left: 4,
                                      right: 4,
                                    ),
                                    child: Text(
                                      _localizedOrderGroup(group, isAr),
                                      style: const TextStyle(
                                        color: kbiSecondaryLabel,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 0.45,
                                      ),
                                    ),
                                  ),
                                _buildCompactJobRow(doc.id, data, jobModel),
                              ],
                            );
                          },
                          childCount: processedDocs.length,
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildQueueBriefing({
    required int total,
    required int awaiting,
    required int inProgress,
    required bool isAr,
  }) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white),
        boxShadow: [
          BoxShadow(
            color: kbiNavy.withValues(alpha: 0.055),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [kbiBlue, kbiBlueDark],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: kbiBlue.withValues(alpha: 0.22),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: const Icon(
                  CupertinoIcons.waveform_path_ecg,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isAr ? 'نبض قائمة العمل' : 'Queue pulse',
                      style: const TextStyle(
                        color: kbiLabel,
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.25,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isAr
                          ? 'ملخص مباشر للطلبات التي تحتاج انتباهك'
                          : 'A live view of work that needs your attention',
                      style: const TextStyle(
                        color: kbiSecondaryLabel,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: kbiGreen.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  isAr ? 'مباشر' : 'LIVE',
                  style: const TextStyle(
                    color: Color(0xFF047857),
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.6,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 15),
          Row(
            children: [
              Expanded(
                child: _buildQueueMetric(
                  '$total',
                  isAr ? 'إجمالي الطلبات' : 'Total orders',
                  kbiBlue,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildQueueMetric(
                  '$awaiting',
                  isAr ? 'بانتظارك' : 'Awaiting you',
                  kbiOrange,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildQueueMetric(
                  '$inProgress',
                  isAr ? 'قيد التنفيذ' : 'In progress',
                  kbiGreen,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQueueMetric(String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 11),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.075),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 18,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.4,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: kbiSecondaryLabel,
              fontSize: 9.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  // --- APP BAR ---
  AppBar _buildM3AppBar() {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      toolbarHeight: 70,
      titleSpacing: 16,
      title: Text(
        widget.locale.languageCode == 'ar' ? 'الطلبات' : 'Orders',
        style: Theme.of(context).textTheme.displaySmall,
      ),
      actions: [
        _buildSortPopupMenu(),
        const SizedBox(width: 12),
      ],
    );
  }

  // --- SEARCH BAR ---
  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: CupertinoSearchTextField(
        controller: _searchController,
        placeholder: widget.locale.languageCode == 'ar'
            ? 'ابحث برقم الطلب، العميل، أو الجهاز...'
            : 'Search by order ID, customer, device…',
        backgroundColor: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        style: const TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 14.5,
            fontWeight: FontWeight.w600),
        itemColor: const Color(0xFF2563EB),
        onSuffixTap: () {
          _searchController.clear();
          setState(() => _searchQuery = '');
        },
        onChanged: (val) {
          setState(() {
            _searchQuery = val.toLowerCase().trim();
          });
        },
      ),
    );
  }

  // --- SORT POPUP ---
  Widget _buildSortPopupMenu() {
    return PopupMenuButton<OrderSortOption>(
      icon: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.all(Radius.circular(16)),
          border: Border.all(color: const Color(0xFFE8E9EC)),
        ),
        child: const Row(
          children: [
            Icon(Icons.sort_rounded, color: Color(0xFF111318), size: 18),
            SizedBox(width: 4),
            Icon(Icons.arrow_drop_down, color: Colors.black54, size: 16),
          ],
        ),
      ),
      color: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(24))),
      onSelected: (option) => setState(() => _sortOption = option),
      itemBuilder: (context) => [
        const PopupMenuItem(
            value: OrderSortOption.newest,
            child: Text('Newest first',
                style: TextStyle(color: Color(0xFF111318), fontSize: 13))),
        const PopupMenuItem(
            value: OrderSortOption.oldest,
            child: Text('Oldest first',
                style: TextStyle(color: Color(0xFF111318), fontSize: 13))),
        const PopupMenuItem(
            value: OrderSortOption.today,
            child: Text('Today\'s jobs',
                style: TextStyle(color: Color(0xFF111318), fontSize: 13))),
        const PopupMenuItem(
            value: OrderSortOption.highestPriority,
            child: Text('Highest priority',
                style: TextStyle(color: Color(0xFF111318), fontSize: 13))),
        const PopupMenuItem(
            value: OrderSortOption.recentlyUpdated,
            child: Text('Recently updated',
                style: TextStyle(color: Color(0xFF111318), fontSize: 13))),
      ],
    );
  }

  Widget _buildCompactJobRow(
      String docId, Map<String, dynamic> data, ServiceRequestModel job) {
    final isAr = widget.locale.languageCode == 'ar';
    final status = (data['status'] ?? job.status).toString();
    final customer = (data['clientName'] ??
            data['customerName'] ??
            (isAr ? 'اسم العميل غير متوفر' : 'Customer not provided'))
        .toString();
    final orderReference = compactOrderReference(
      data,
      documentId: docId,
    );
    final time = jobTimeLabel(data);
    final location = job.address?.trim().isNotEmpty == true
        ? job.address!
        : (isAr ? 'الموقع غير متوفر' : 'Location not provided');
    final isPending = {
      'assigned',
      'pending',
      'pending acceptance',
      'offered',
      'awaiting_acceptance'
    }.contains(normalizeJobStatus(status));
    final isCurrentActive = isJobActive(status);
    final isEmphasized = isPending || isCurrentActive;

    final device =
        (data['device'] ?? data['deviceModel'] ?? '').toString().trim();
    final service = job.type.isNotEmpty
        ? job.type
        : (data['service'] ?? 'Service Repair').toString().trim();
    final displayTitle = device.isNotEmpty &&
            !service.toLowerCase().contains(device.toLowerCase())
        ? '$device • $service'
        : service;
    final displayLocation = location;

    final price = data['assignedPrice'] ?? data['price'] ?? data['cost'];
    final priceStr = price != null ? '$price AED' : null;

    return Semantics(
      button: true,
      label:
          '$orderReference, $displayTitle, $customer, $time, ${localizedJobStatusLabel(status, isArabic: isAr)}',
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: isEmphasized
                ? kbiBlue.withValues(alpha: 0.72)
                : const Color(0xFFE2E8F0),
            width: isEmphasized ? 1.5 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: isEmphasized
                  ? kbiBlue.withValues(alpha: 0.09)
                  : Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(22),
          child: InkWell(
            onTap: () => Navigator.of(context).push(
              CupertinoPageRoute<void>(
                builder: (_) => JobDetailsScreen(job: job),
              ),
            ),
            onLongPress: () {
              HapticFeedback.mediumImpact();
              _showOrderDetailsBottomSheet(docId, data, job);
            },
            borderRadius: BorderRadius.circular(22),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: isEmphasized
                              ? kbiBlue.withValues(alpha: 0.10)
                              : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(
                          _getServiceIcon(job.type),
                          color:
                              isEmphasized ? kbiBlue : const Color(0xFF0F172A),
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              orderReference,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              textDirection: TextDirection.ltr,
                              style: const TextStyle(
                                color: kbiBlue,
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.25,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              displayTitle,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 14.5,
                                fontWeight: FontWeight.w800,
                                height: 1.25,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.person_outline_rounded,
                                    color: Color(0xFF64748B), size: 13),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    customer,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: Color(0xFF475569),
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          if (priceStr != null)
                            Text(
                              priceStr,
                              style: const TextStyle(
                                color: kbiBlue,
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          const SizedBox(height: 5),
                          const Icon(
                            CupertinoIcons.chevron_forward,
                            color: kbiSecondaryLabel,
                            size: 16,
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(
                        CupertinoIcons.clock,
                        color: kbiSecondaryLabel,
                        size: 14,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        time,
                        style: const TextStyle(
                          color: kbiSecondaryLabel,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(
                        CupertinoIcons.location_solid,
                        color: kbiSecondaryLabel,
                        size: 14,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          displayLocation,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: kbiSecondaryLabel,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      if (isCurrentActive)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: kbiBlue,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            isAr ? 'الطلب الحالي' : 'Current job',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        )
                      else
                        const SizedBox.shrink(),
                      const Spacer(),
                      _buildStatusBadge(status),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // --- WORKFLOW STATE ACTION BUTTONS ---
  Widget _buildWorkflowStateActionButtons(String docId, String status,
      Map<String, dynamic> data, ServiceRequestModel job) {
    if (status == 'assigned' ||
        status == 'pending' ||
        status == 'pending acceptance') {
      return Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF111318),
                foregroundColor: Colors.white,
                shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.all(Radius.circular(24))),
              ),
              onPressed: () => _showAcceptConfirmationDialog(docId),
              icon: const Icon(Icons.check_circle_outline, size: 18),
              label: const Text('Accept Order',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.redAccent,
                side: const BorderSide(color: Colors.redAccent, width: 1.2),
                shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.all(Radius.circular(24))),
              ),
              onPressed: () => _showRejectReasonBottomSheet(docId),
              icon: const Icon(Icons.cancel_outlined, size: 18),
              label: const Text('Reject Order',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ),
          ),
        ],
      );
    } else if (status == 'accepted') {
      return ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.orangeAccent,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(42),
          shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(24))),
        ),
        onPressed: () => _updateOrderStatus(
            docId, 'on_the_way', 'Technician started driving to location.'),
        icon: const Icon(Icons.directions_car_outlined, size: 18),
        label: const Text('Start Driving (On The Way)',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
      );
    } else if (status == 'on the way' || status == 'on_the_way') {
      return ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.purpleAccent,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(42),
          shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(24))),
        ),
        onPressed: () => _updateOrderStatus(
            docId, 'arrived', 'Technician arrived at customer address.'),
        icon: const Icon(Icons.place_outlined, size: 18),
        label: const Text('I Have Arrived',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
      );
    } else if (status == 'arrived') {
      return ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.indigoAccent,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(42),
          shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(24))),
        ),
        onPressed: () => _updateOrderStatus(
            docId, 'in_progress', 'Technician started repair work.'),
        icon: const Icon(Icons.build_outlined, size: 18),
        label: const Text('Start Repair Work',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
      );
    } else if (status == 'in progress' || status == 'in_progress') {
      return Row(
        children: [
          IconButton(
            icon:
                const Icon(Icons.camera_alt_outlined, color: Color(0xFF111318)),
            onPressed: () => _uploadPhotoToJob(docId),
          ),
          IconButton(
            icon:
                const Icon(Icons.note_add_outlined, color: Colors.amberAccent),
            onPressed: () => _showAddNoteDialog(docId),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.greenAccent,
                foregroundColor: Colors.white,
                shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.all(Radius.circular(24))),
              ),
              onPressed: () => _showCompleteJobBottomSheet(docId, data),
              icon: const Icon(Icons.task_alt_rounded, size: 18),
              label: const Text('Complete Job',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ),
          ),
        ],
      );
    } else {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        decoration: BoxDecoration(
          color: const Color(0xF2FFFFFF).withValues(alpha: 0.04),
          borderRadius: const BorderRadius.all(Radius.circular(24)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.history_rounded, color: Colors.black54, size: 16),
            const SizedBox(width: 6),
            Text(
              'Order Status: ${status.toUpperCase()}',
              style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 11,
                  fontWeight: FontWeight.bold),
            ),
          ],
        ),
      );
    }
  }

  // --- ACCEPT CONFIRMATION DIALOG ---
  void _showAcceptConfirmationDialog(String docId) {
    showDialog(
      context: context,
      builder: (c) => AlertDialog(
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(24))),
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Color(0xFF00C9A7)),
            SizedBox(width: 8),
            Text('Accept Job?',
                style: TextStyle(
                    color: Color(0xFF111827), fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'Do you want to accept this assigned service order? Once accepted, you will start the field service dispatch flow.',
          style: TextStyle(color: Color(0xFF374151), fontSize: 13.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c),
            child: const Text('Cancel',
                style: TextStyle(color: Color(0xFF6B7280))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00C9A7),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              Navigator.pop(c);
              final updated = await _updateOrderStatus(
                  docId, 'Accepted', 'Job accepted by technician.');
              if (mounted && updated) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Job accepted successfully.'),
                    backgroundColor: Color(0xFF00897B),
                  ),
                );
              }
            },
            child: const Text('Confirm Accept',
                style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // --- REJECT REASON BOTTOM SHEET ---
  void _showRejectReasonBottomSheet(String docId) {
    String selectedReason = 'Currently Busy';
    final otherReasonController = TextEditingController();

    final reasons = [
      'Currently Busy',
      'Too Far Away',
      'Outside Working Hours',
      'No Required Parts',
      'Vehicle Problem',
      'Personal Emergency',
      'Already Working',
      'Other',
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (c) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(
              24, 24, 24, MediaQuery.of(context).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Decline Order',
                  style: TextStyle(
                      color: Color(0xFFDC2626),
                      fontSize: 18,
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              const Text(
                  'Please choose a reason for declining this assignment:',
                  style: TextStyle(color: Color(0xFF4B5563), fontSize: 13)),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: selectedReason,
                dropdownColor: Colors.white,
                decoration: const InputDecoration(
                  filled: true,
                  fillColor: Color(0xFFF9FAFB),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(16))),
                ),
                style:
                    const TextStyle(color: Color(0xFF111827), fontSize: 13.5),
                items: reasons
                    .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                    .toList(),
                onChanged: (v) => setSheetState(() => selectedReason = v!),
              ),
              if (selectedReason == 'Other') ...[
                const SizedBox(height: 12),
                TextField(
                  controller: otherReasonController,
                  style:
                      const TextStyle(color: Color(0xFF111827), fontSize: 13.5),
                  decoration: const InputDecoration(
                    hintText: 'Type your custom reason...',
                    hintStyle: TextStyle(color: Color(0xFF9CA3AF)),
                    filled: true,
                    fillColor: Color(0xFFF9FAFB),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(16))),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFDC2626),
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(46),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () async {
                  final finalReason = selectedReason == 'Other'
                      ? otherReasonController.text.trim()
                      : selectedReason;
                  Navigator.pop(c);
                  await _rejectJob(docId, finalReason);
                },
                child: const Text('Submit Decline',
                    style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- COMPLETE JOB BOTTOM SHEET ---
  void _showCompleteJobBottomSheet(String docId, Map<String, dynamic> data) {
    final priceController =
        TextEditingController(text: data['estimatedPrice']?.toString() ?? '');
    final notesController = TextEditingController();
    final partsController = TextEditingController();
    String paymentMethod = 'Cash';
    bool submitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (c) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(
              24, 24, 24, MediaQuery.of(context).viewInsets.bottom + 24),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Complete Service Job',
                    style: TextStyle(
                        color: Color(0xFF047857),
                        fontSize: 18,
                        fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                TextField(
                  controller: priceController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Color(0xFF111827)),
                  decoration: const InputDecoration(
                    labelText: 'Final Price (AED)',
                    labelStyle: TextStyle(color: Color(0xFF4B5563)),
                    filled: true,
                    fillColor: Color(0xFFF9FAFB),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(16))),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: partsController,
                  style: const TextStyle(color: Color(0xFF111827)),
                  decoration: const InputDecoration(
                    labelText:
                        'Parts Used (e.g. Screen Assembly, Thermal Paste)',
                    labelStyle: TextStyle(color: Color(0xFF4B5563)),
                    filled: true,
                    fillColor: Color(0xFFF9FAFB),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(16))),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesController,
                  maxLines: 3,
                  style: const TextStyle(color: Color(0xFF111827)),
                  decoration: const InputDecoration(
                    labelText: 'Completion Work Notes',
                    labelStyle: TextStyle(color: Color(0xFF4B5563)),
                    filled: true,
                    fillColor: Color(0xFFF9FAFB),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(16))),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: paymentMethod,
                  dropdownColor: Colors.white,
                  decoration: const InputDecoration(
                    labelText: 'Payment Method',
                    filled: true,
                    fillColor: Color(0xFFF9FAFB),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(16))),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'Cash', child: Text('Cash')),
                    DropdownMenuItem(value: 'Card', child: Text('Card')),
                    DropdownMenuItem(
                        value: 'Bank Transfer', child: Text('Bank Transfer')),
                    DropdownMenuItem(value: 'Online', child: Text('Online')),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setSheetState(() => paymentMethod = value);
                    }
                  },
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.greenAccent,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(46),
                  ),
                  onPressed: submitting
                      ? null
                      : () async {
                          final price =
                              double.tryParse(priceController.text.trim());
                          final workNotes = notesController.text.trim();
                          if (price == null ||
                              price < 0 ||
                              workNotes.length < 3) {
                            _showMessage(
                                'Enter a valid final price and completion notes.');
                            return;
                          }
                          setSheetState(() => submitting = true);
                          try {
                            final parts = partsController.text.trim();
                            await TechnicianService.instance.completeJob(
                              requestId: docId,
                              finalPrice: price,
                              notes: parts.isEmpty
                                  ? workNotes
                                  : '$workNotes\nParts used: $parts',
                              paymentMethod: paymentMethod,
                              photos: [
                                ...((data['photos'] as List?)
                                        ?.whereType<String>() ??
                                    const <String>[]),
                                ...(_pendingPhotos[docId] ?? const <String>[]),
                              ],
                            );
                            _pendingPhotos.remove(docId);
                            if (c.mounted) Navigator.pop(c);
                            _showMessage('Job completed successfully.');
                          } catch (error) {
                            _showMessage('Unable to complete job: $error');
                            if (c.mounted) {
                              setSheetState(() => submitting = false);
                            }
                          }
                        },
                  child: submitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Submit Completion'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- ORDER DETAILS BOTTOM SHEET ---
  void _showOrderDetailsBottomSheet(
      String docId, Map<String, dynamic> data, ServiceRequestModel job) {
    final status = normalizeJobStatus(data['status']);
    final isPreAcceptance = {
      'assigned',
      'pending',
      'pending acceptance',
      'offered',
      'awaiting_acceptance'
    }.contains(status);

    final orderId = compactOrderReference(data, documentId: docId);

    final priority = (data['priority'] ?? 'NORMAL').toString().toUpperCase();
    final price =
        data['estimatedPrice'] ?? data['finalPrice'] ?? data['price'] ?? 350;
    final customerName =
        data['clientName'] ?? data['customerName'] ?? 'Customer';
    final customerPhone =
        (data['clientPhone'] ?? data['customerPhone'] ?? '').toString().trim();
    final deviceName = (data['device'] ??
            data['deviceModel'] ??
            data['device_model'] ??
            'iPhone 15 Pro Max')
        .toString();
    final serviceName =
        job.type.isNotEmpty ? job.type : (data['service'] ?? 'Device Repair');
    final fullAddress = job.address?.isNotEmpty == true
        ? job.address!
        : (data['address'] ?? 'Abu Dhabi, UAE');
    final generalArea = fullAddress.split(',').first.trim();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (c) => DraggableScrollableSheet(
        initialChildSize: 0.88,
        maxChildSize: 0.95,
        minChildSize: 0.55,
        expand: false,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: SingleChildScrollView(
            controller: scrollController,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Drag Handle
                Center(
                  child: Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: const BorderRadius.all(Radius.circular(10)),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Order Header: Order ID, Priority & Status
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00C9A7).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        orderId,
                        style: const TextStyle(
                          color: Color(0xFF00897B),
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: priority == 'URGENT'
                            ? Colors.red.shade50
                            : priority == 'HIGH'
                                ? Colors.amber.shade50
                                : Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        priority == 'URGENT'
                            ? 'Urgent Priority 🚨'
                            : priority == 'HIGH'
                                ? 'High Priority'
                                : 'Normal Priority',
                        style: TextStyle(
                          color: priority == 'URGENT'
                              ? Colors.red.shade700
                              : priority == 'HIGH'
                                  ? Colors.amber.shade800
                                  : Colors.blue.shade700,
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                        ),
                      ),
                    ),
                    const Spacer(),
                    _buildStatusBadge(data['status']?.toString() ?? 'Pending'),
                  ],
                ),
                const SizedBox(height: 12),

                // Main Service Title (Wrapped in Expanded/Flex to prevent overflow)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        serviceName,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF111827),
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          height: 1.25,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        border: Border.all(color: const Color(0xFFA7F3D0)),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        'AED $price',
                        style: const TextStyle(
                          color: Color(0xFF047857),
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Device & Customer Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Device row
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border:
                                  Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: const Icon(Icons.smartphone_rounded,
                                size: 20, color: Color(0xFF1F2937)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'DEVICE DETAILS',
                                  style: TextStyle(
                                    color: Color(0xFF6B7280),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  deviceName,
                                  style: const TextStyle(
                                    color: Color(0xFF111827),
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Divider(height: 1, color: Color(0xFFE5E7EB)),
                      ),

                      // Customer & Location section
                      if (isPreAcceptance) ...[
                        // Pre-Acceptance Privacy Mode
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border:
                                    Border.all(color: const Color(0xFFE5E7EB)),
                              ),
                              child: const Icon(Icons.location_on_rounded,
                                  size: 20, color: Color(0xFF00C9A7)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Text(
                                        'APPROXIMATE LOCATION',
                                        style: TextStyle(
                                          color: Color(0xFF6B7280),
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 6, vertical: 1.5),
                                        decoration: BoxDecoration(
                                          color: Colors.amber.shade100,
                                          borderRadius:
                                              BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          'Masked',
                                          style: TextStyle(
                                            color: Colors.amber.shade900,
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    '$generalArea • 6.2 km • 12 min away',
                                    style: const TextStyle(
                                      color: Color(0xFF111827),
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.lock_outline_rounded,
                                  size: 14, color: Color(0xFF6B7280)),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Full address, navigation & contact unlocked after acceptance.',
                                  style: TextStyle(
                                    color: Color(0xFF4B5563),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ] else ...[
                        // Post-Acceptance Revealed Mode
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border:
                                    Border.all(color: const Color(0xFFE5E7EB)),
                              ),
                              child: const Icon(Icons.person_rounded,
                                  size: 20, color: Color(0xFF3B82F6)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'CUSTOMER CONTACT',
                                    style: TextStyle(
                                      color: Color(0xFF6B7280),
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    customerName,
                                    style: const TextStyle(
                                      color: Color(0xFF111827),
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  if (customerPhone.isNotEmpty)
                                    Text(
                                      customerPhone,
                                      style: const TextStyle(
                                        color: Color(0xFF4B5563),
                                        fontSize: 12,
                                        fontFamily: 'monospace',
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border:
                                    Border.all(color: const Color(0xFFE5E7EB)),
                              ),
                              child: const Icon(Icons.location_on_rounded,
                                  size: 20, color: Color(0xFFEF4444)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'SERVICE DESTINATION',
                                    style: TextStyle(
                                      color: Color(0xFF6B7280),
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    fullAddress,
                                    style: const TextStyle(
                                      color: Color(0xFF111827),
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      height: 1.3,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Problem Description
                if (job.description.isNotEmpty) ...[
                  const Text(
                    'PROBLEM DESCRIPTION',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: Text(
                      job.description,
                      style: const TextStyle(
                        color: Color(0xFF374151),
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                ],

                // Timeline Stepper
                const Text(
                  'DISPATCH & SERVICE TIMELINE',
                  style: TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 10),
                _buildTimelineStepper(data['status']?.toString() ?? 'Assigned'),
                const SizedBox(height: 24),

                // Actions Section
                _buildDetailsActions(c, docId, data, job),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailsActions(BuildContext sheetContext, String docId,
      Map<String, dynamic> data, ServiceRequestModel job) {
    final status = normalizeJobStatus(data['status']);
    final phone =
        (data['clientPhone'] ?? data['customerPhone'] ?? '').toString().trim();
    final isPending = {
      'assigned',
      'pending',
      'pending acceptance',
      'offered',
      'awaiting_acceptance'
    }.contains(status);

    if (isPending) {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFDC2626),
                side: const BorderSide(color: Color(0xFFFCA5A5), width: 1.5),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              onPressed: () {
                Navigator.pop(sheetContext);
                _showRejectReasonBottomSheet(docId);
              },
              child: const Text(
                'Decline',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00C9A7),
                foregroundColor: Colors.white,
                elevation: 2,
                shadowColor: const Color(0xFF00C9A7).withValues(alpha: 0.4),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              onPressed: () {
                Navigator.pop(sheetContext);
                _showAcceptConfirmationDialog(docId);
              },
              icon: const Icon(Icons.check_rounded, size: 20),
              label: const Text(
                'Accept Job',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
              ),
            ),
          ),
        ],
      );
    }

    // Post-acceptance Quick Actions + Workflow Stepper Action
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Quick Action Bar: Call, WhatsApp, Navigate
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  foregroundColor: const Color(0xFF1F2937),
                  side: const BorderSide(color: Color(0xFFE5E7EB)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                onPressed:
                    phone.isEmpty ? null : () => _launchUrl('tel:$phone'),
                icon: const Icon(Icons.phone_rounded,
                    size: 16, color: Color(0xFF10B981)),
                label: const Text(
                  'Call',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  foregroundColor: const Color(0xFF1F2937),
                  side: const BorderSide(color: Color(0xFFE5E7EB)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                onPressed: phone.isEmpty
                    ? null
                    : () {
                        final cleanPhone =
                            phone.replaceAll(RegExp(r'[^0-9]'), '');
                        final msg = Uri.encodeComponent(
                            "Hello, I am your technician for ${job.type}. I am heading to your location.");
                        _launchUrl('https://wa.me/$cleanPhone?text=$msg');
                      },
                icon: const Icon(Icons.chat_rounded,
                    size: 16, color: Color(0xFF25D366)),
                label: const Text(
                  'WhatsApp',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  foregroundColor: const Color(0xFF1F2937),
                  side: const BorderSide(color: Color(0xFFE5E7EB)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                onPressed: () {
                  final dest = Uri.encodeComponent(
                      job.address?.isNotEmpty == true
                          ? job.address!
                          : 'Abu Dhabi, UAE');
                  _launchUrl('https://maps.apple.com/?daddr=$dest');
                },
                icon: const Icon(Icons.navigation_rounded,
                    size: 16, color: Color(0xFF3B82F6)),
                label: const Text(
                  'Navigate',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Workflow Action Stage Button
        _buildWorkflowStateActionButtons(docId, status, data, job),
      ],
    );
  }

  // --- TIMELINE STEPPER ---
  Widget _buildTimelineStepper(String status) {
    final steps = [
      {'title': 'Assigned', 'sub': 'Order matched to technician'},
      {'title': 'Accepted', 'sub': 'Technician accepted dispatch'},
      {'title': 'On The Way', 'sub': 'Driving to service location'},
      {'title': 'Arrived', 'sub': 'Technician arrived at site'},
      {'title': 'In Progress', 'sub': 'Repair & diagnostic active'},
      {'title': 'Completed', 'sub': 'Device tested & delivered'},
    ];
    final normalized = status.toLowerCase().replaceAll('_', ' ');
    int current = 0;
    if (normalized == 'accepted') current = 1;
    if (normalized == 'on the way' || normalized == 'on_the_way') current = 2;
    if (normalized == 'arrived') current = 3;
    if (normalized == 'in progress' || normalized == 'in_progress') current = 4;
    if (normalized == 'completed') current = 5;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        children: List.generate(steps.length, (i) {
          final isCompleted = i < current;
          final isCurrent = i == current;
          final isLast = i == steps.length - 1;

          return IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Step Indicator & Line
                Column(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? const Color(0xFF10B981)
                            : isCurrent
                                ? const Color(0xFF00C9A7)
                                : Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isCompleted || isCurrent
                              ? const Color(0xFF00C9A7)
                              : const Color(0xFFD1D5DB),
                          width: 2,
                        ),
                        boxShadow: isCurrent
                            ? [
                                BoxShadow(
                                  color: const Color(0xFF00C9A7)
                                      .withValues(alpha: 0.4),
                                  blurRadius: 6,
                                  spreadRadius: 1,
                                )
                              ]
                            : null,
                      ),
                      child: Center(
                        child: isCompleted
                            ? const Icon(Icons.check_rounded,
                                size: 14, color: Colors.white)
                            : isCurrent
                                ? Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                    ),
                                  )
                                : Text(
                                    '${i + 1}',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: Color(0xFF9CA3AF),
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                      ),
                    ),
                    if (!isLast)
                      Expanded(
                        child: Container(
                          width: 2,
                          color: isCompleted
                              ? const Color(0xFF10B981)
                              : const Color(0xFFE5E7EB),
                          margin: const EdgeInsets.symmetric(vertical: 4),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 14),

                // Step Text
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          steps[i]['title']!,
                          style: TextStyle(
                            color: isCurrent || isCompleted
                                ? const Color(0xFF111827)
                                : const Color(0xFF9CA3AF),
                            fontSize: 13,
                            fontWeight: isCurrent
                                ? FontWeight.w800
                                : isCompleted
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 1),
                        Text(
                          steps[i]['sub']!,
                          style: TextStyle(
                            color: isCurrent
                                ? const Color(0xFF4B5563)
                                : const Color(0xFF9CA3AF),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }

  // --- STATUS BADGE UTILS ---
  Widget _buildStatusBadge(String rawStatus) {
    final norm = normalizeJobStatus(rawStatus);
    final label = localizedJobStatusLabel(
      rawStatus,
      isArabic: widget.locale.languageCode == 'ar',
    );

    Color bg;
    Color fg;

    switch (norm) {
      case 'completed':
        bg = const Color(0xFF10B981).withValues(alpha: 0.12);
        fg = const Color(0xFF059669);
        break;
      case 'in progress':
        bg = const Color(0xFF3B82F6).withValues(alpha: 0.12);
        fg = const Color(0xFF2563EB);
        break;
      case 'arrived':
      case 'on the way':
        bg = const Color(0xFF8B5CF6).withValues(alpha: 0.12);
        fg = const Color(0xFF7C3AED);
        break;
      case 'assigned':
      case 'pending':
        bg = const Color(0xFFF59E0B).withValues(alpha: 0.12);
        fg = const Color(0xFFD97706);
        break;
      case 'cancelled':
      case 'rejected':
        bg = const Color(0xFFEF4444).withValues(alpha: 0.12);
        fg = const Color(0xFFDC2626);
        break;
      default:
        bg = const Color(0xFF64748B).withValues(alpha: 0.12);
        fg = const Color(0xFF475569);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  IconData _getServiceIcon(String type) {
    final t = type.toLowerCase();
    if (t.contains('phone') || t.contains('screen')) {
      return Icons.smartphone_rounded;
    }
    if (t.contains('laptop') || t.contains('macbook')) {
      return Icons.laptop_mac_rounded;
    }
    if (t.contains('console') || t.contains('playstation')) {
      return Icons.sports_esports_rounded;
    }
    return Icons.build_circle_outlined;
  }

  // --- FIRESTORE HELPERS ---
  Future<bool> _updateOrderStatus(
      String docId, String status, String notes) async {
    try {
      await TechnicianService.instance
          .updateJobStatus(requestId: docId, status: status, notes: notes);
      return true;
    } catch (error) {
      _showMessage('Unable to update job: $error');
      return false;
    }
  }

  Future<void> _rejectJob(String docId, String reason) async {
    try {
      await TechnicianService.instance.updateJobStatus(
        requestId: docId,
        status: 'Rejected',
        notes: reason,
      );
    } catch (error) {
      _showMessage('Unable to reject job: $error');
    }
  }

  Future<void> _uploadPhotoToJob(String docId) async {
    try {
      final result = await FilePicker.pickFiles(
          type: FileType.image, allowMultiple: false, withData: true);
      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.bytes != null) {
          final url = await StorageService.instance.uploadTechnicianFile(
            category: 'jobs/$docId',
            fileName: file.name,
            bytes: file.bytes!,
          );
          if (mounted) {
            setState(
                () => _pendingPhotos.putIfAbsent(docId, () => []).add(url));
            _showMessage('Photo uploaded and will be attached on completion.');
          }
        }
      }
    } catch (error) {
      _showMessage('Photo upload failed: $error');
    }
  }

  void _showAddNoteDialog(String docId) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (c) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Add Technician Note',
            style: TextStyle(
                color: Color(0xFF111827),
                fontWeight: FontWeight.bold,
                fontSize: 17)),
        content: TextField(
          controller: controller,
          style: const TextStyle(color: Color(0xFF111827), fontSize: 14),
          decoration: InputDecoration(
              hintText: 'Type internal note...',
              hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
              filled: true,
              fillColor: const Color(0xFFF9FAFB),
              border:
                  OutlineInputBorder(borderRadius: BorderRadius.circular(14))),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(c),
              child: const Text('Cancel',
                  style: TextStyle(color: Color(0xFF6B7280)))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00C9A7),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              Navigator.pop(c);
              if (controller.text.trim().isNotEmpty) {
                try {
                  await TechnicianService.instance.addJobNote(
                    requestId: docId,
                    note: controller.text.trim(),
                  );
                  _showMessage('Note added.');
                } catch (error) {
                  _showMessage('Unable to add note: $error');
                }
              }
            },
            child: const Text('Save Note'),
          ),
        ],
      ),
    );
  }

  // --- FILTER & SORT CALCULATION ---
  String _localizedFilter(String filter, bool isAr) {
    if (!isAr) return filter;
    return switch (filter) {
      'Active' => 'نشطة',
      'Today' => 'اليوم',
      'Upcoming' => 'قادمة',
      'Completed' => 'مكتملة',
      _ => filter,
    };
  }

  String _orderGroupLabel(Map<String, dynamic> data) {
    final status = normalizeJobStatus(data['status']);
    if (const {'completed', 'delivered', 'done'}.contains(status)) {
      return 'COMPLETED';
    }
    if (isJobActive(status)) return 'ACTIVE';
    final date = jobDate(data)?.toLocal();
    final now = DateTime.now();
    if (isSameLocalDay(date, now)) return 'TODAY';
    if (date != null && date.isAfter(now)) return 'UPCOMING';
    return 'ACTIVE';
  }

  String _localizedOrderGroup(String group, bool isAr) {
    if (!isAr) return group;
    return switch (group) {
      'ACTIVE' => 'قيد التنفيذ',
      'TODAY' => 'اليوم',
      'UPCOMING' => 'قادمة',
      'COMPLETED' => 'مكتملة',
      _ => group,
    };
  }

  int _orderGroupRank(Map<String, dynamic> data) {
    return switch (_orderGroupLabel(data)) {
      'ACTIVE' => 0,
      'TODAY' => 1,
      'UPCOMING' => 2,
      _ => 3,
    };
  }

  bool _matchesQueueFilter(
    String filter,
    Map<String, dynamic> data, {
    DateTime? now,
  }) {
    final reference = now ?? DateTime.now();
    final status = normalizeJobStatus(data['status']);
    final date = jobDate(data)?.toLocal();
    final terminal = const {
      'completed',
      'delivered',
      'done',
      'cancelled',
      'rejected',
    }.contains(status);

    return switch (filter) {
      'Active' => !terminal,
      'Today' => isSameLocalDay(date, reference),
      'Upcoming' => !terminal &&
          date != null &&
          date.isAfter(DateTime(
            reference.year,
            reference.month,
            reference.day,
            23,
            59,
            59,
          )),
      'Completed' => const {'completed', 'delivered', 'done'}.contains(status),
      _ => true,
    };
  }

  List<DocumentSnapshot<Map<String, dynamic>>> _filterAndSortDocs(
      List<DocumentSnapshot<Map<String, dynamic>>> docs) {
    final filtered = docs.where((doc) {
      final data = doc.data();
      if (data == null) return false;
      // Search Query Filter
      if (_searchQuery.isNotEmpty) {
        final orderIdentifiers = [
          doc.id,
          data['orderNumber'],
          data['trackingCode'],
          data['orderId'],
          data['bookingId'],
          data['reference'],
        ]
            .where((value) => value != null)
            .map((value) => value.toString().toLowerCase())
            .join(' ');
        final clientName = (data['clientName'] ?? data['customerName'] ?? '')
            .toString()
            .toLowerCase();
        final phone = (data['clientPhone'] ?? data['customerPhone'] ?? '')
            .toString()
            .toLowerCase();
        final address = (data['address'] ?? '').toString().toLowerCase();
        final device = (data['device'] ?? '').toString().toLowerCase();
        final brand = (data['brand'] ?? '').toString().toLowerCase();

        final match = orderIdentifiers.contains(_searchQuery) ||
            clientName.contains(_searchQuery) ||
            phone.contains(_searchQuery) ||
            address.contains(_searchQuery) ||
            device.contains(_searchQuery) ||
            brand.contains(_searchQuery);
        if (!match) return false;
      }

      return _matchesQueueFilter(_selectedFilter, data);
    }).toList();

    int compareDates(
      DocumentSnapshot<Map<String, dynamic>> a,
      DocumentSnapshot<Map<String, dynamic>> b,
    ) {
      final aData = a.data() ?? <String, dynamic>{};
      final bData = b.data() ?? <String, dynamic>{};
      final aDate = _sortOption == OrderSortOption.recentlyUpdated
          ? jobDate({'date': aData['updatedAt']})
          : jobDate(aData);
      final bDate = _sortOption == OrderSortOption.recentlyUpdated
          ? jobDate({'date': bData['updatedAt']})
          : jobDate(bData);
      return (aDate ?? DateTime.fromMillisecondsSinceEpoch(0))
          .compareTo(bDate ?? DateTime.fromMillisecondsSinceEpoch(0));
    }

    filtered.sort((a, b) {
      final aData = a.data() ?? <String, dynamic>{};
      final bData = b.data() ?? <String, dynamic>{};
      if (_selectedFilter == 'Active') {
        final groupCompare =
            _orderGroupRank(aData).compareTo(_orderGroupRank(bData));
        if (groupCompare != 0) return groupCompare;
      }
      switch (_sortOption) {
        case OrderSortOption.oldest:
          return compareDates(a, b);
        case OrderSortOption.highestPriority:
          final priorityCompare = priorityRank(bData['priority'])
              .compareTo(priorityRank(aData['priority']));
          return priorityCompare != 0 ? priorityCompare : -compareDates(a, b);
        case OrderSortOption.newest:
        case OrderSortOption.today:
        case OrderSortOption.recentlyUpdated:
          return -compareDates(a, b);
      }
    });
    if (_sortOption == OrderSortOption.today) {
      return filtered
          .where((doc) =>
              isSameLocalDay(jobDate(doc.data() ?? {}), DateTime.now()))
          .toList();
    }
    return filtered;
  }

  // --- EMPTY & SKELETON STATES ---
  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.assignment_outlined,
                size: 48, color: Color(0xFF9B9FA7)),
            const SizedBox(height: 20),
            const Text('No assigned jobs',
                style: TextStyle(
                    color: Color(0xFF111318),
                    fontSize: 18,
                    fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text(
                'New assignments from dispatch will appear here automatically.',
                style:
                    TextStyle(color: Colors.black54, fontSize: 13, height: 1.4),
                textAlign: TextAlign.center),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF111318),
                  foregroundColor: Colors.white),
              onPressed: _handleRefresh,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Refresh'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmerSkeletonLoader() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 3,
      itemBuilder: (c, i) => Container(
        height: 94,
        margin: const EdgeInsets.only(bottom: 10),
        decoration: const BoxDecoration(
          color: Color(0xFFE9EAED),
          borderRadius: BorderRadius.all(Radius.circular(20)),
        ),
      ),
    );
  }

  Widget _buildErrorState(Object? error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_outlined,
                size: 52, color: Colors.redAccent),
            const SizedBox(height: 16),
            const Text(
              'Jobs could not be loaded',
              style: TextStyle(
                  color: Color(0xFF111318), fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              '$error',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.black87, fontSize: 12),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _handleRefresh,
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        _showMessage('No app is available to open this link.');
      }
    } catch (error) {
      _showMessage('Unable to open link: $error');
    }
  }
}

class _PendingAcceptanceBanner extends StatefulWidget {
  final DateTime? createdAt;

  const _PendingAcceptanceBanner({required this.createdAt});

  @override
  State<_PendingAcceptanceBanner> createState() =>
      _PendingAcceptanceBannerState();
}

class _PendingAcceptanceBannerState extends State<_PendingAcceptanceBanner> {
  Timer? _timer;
  late DateTime _expiresAt;
  late Duration _remaining;

  @override
  void initState() {
    super.initState();
    _resetCountdown();
  }

  @override
  void didUpdateWidget(covariant _PendingAcceptanceBanner oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.createdAt != widget.createdAt) {
      _resetCountdown();
    }
  }

  void _resetCountdown() {
    _timer?.cancel();
    _expiresAt = (widget.createdAt ?? DateTime.now()).add(
      const Duration(minutes: 30),
    );
    _remaining = _calculateRemaining();

    if (_remaining > Duration.zero) {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        final nextRemaining = _calculateRemaining();
        if (!mounted) return;

        if (nextRemaining == Duration.zero) {
          _timer?.cancel();
        }

        if (nextRemaining.inSeconds != _remaining.inSeconds) {
          setState(() => _remaining = nextRemaining);
        }
      });
    }
  }

  Duration _calculateRemaining() {
    final remaining = _expiresAt.difference(DateTime.now());
    if (remaining.isNegative) return Duration.zero;
    return Duration(seconds: remaining.inSeconds);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mins = _remaining.inMinutes.toString().padLeft(2, '0');
    final secs = (_remaining.inSeconds % 60).toString().padLeft(2, '0');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.amberAccent.withValues(alpha: 0.12),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Flexible(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: Colors.amberAccent,
                  size: 16,
                ),
                SizedBox(width: 6),
                Flexible(
                  child: Text(
                    'Waiting For Your Response',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.amberAccent,
                      fontSize: 11.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '⏱ $mins:$secs Remaining',
            style: const TextStyle(
              color: Color(0xFF111318),
              fontSize: 11.5,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
