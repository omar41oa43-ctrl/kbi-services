import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/service_request.dart';
import '../theme.dart';
import '../utils/job_utils.dart';
import 'invoice_form_screen.dart';

class FormsListScreen extends StatefulWidget {
  final Locale locale;
  final ServiceRequestModel? activeJob;

  const FormsListScreen({
    super.key,
    required this.locale,
    this.activeJob,
  });

  @override
  State<FormsListScreen> createState() => _FormsListScreenState();
}

class _FormsListScreenState extends State<FormsListScreen> {
  String _searchQuery = '';

  Stream<QuerySnapshot<Map<String, dynamic>>> _getOrdersStream() {
    return FirebaseFirestore.instance
        .collection('orders')
        .orderBy('createdAt', descending: true)
        .limit(100)
        .snapshots();
  }

  @override
  Widget build(BuildContext context) {
    final isAr = widget.locale.languageCode == 'ar';

    return Scaffold(
      backgroundColor: kbiGroupedBackground,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: kbiLabel, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          isAr ? 'النماذج والفواتير' : 'Forms & Work Orders',
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: kbiLabel,
          ),
        ),
      ),
      body: Column(
        children: [
          // Search Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: kbiSeparator),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: TextField(
                onChanged: (val) => setState(() => _searchQuery = val.trim()),
                decoration: InputDecoration(
                  hintText: isAr
                      ? 'بحث برقم الطلب، العميل أو الجهاز...'
                      : 'Search by Order No, Customer or Device...',
                  hintStyle: const TextStyle(
                      color: kbiSecondaryLabel, fontSize: 14),
                  prefixIcon: const Icon(Icons.search_rounded,
                      color: kbiSecondaryLabel, size: 20),
                  border: InputBorder.none,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
              ),
            ),
          ),

          // Orders Stream
          Expanded(
            child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: _getOrdersStream(),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Center(
                    child: Text(
                      isAr ? 'تعذر تحميل الطلبات' : 'Failed to load orders',
                      style: const TextStyle(color: kbiSecondaryLabel),
                    ),
                  );
                }

                if (!snapshot.hasData) {
                  return const Center(child: CupertinoActivityIndicator());
                }

                final docs = snapshot.data!.docs;
                final filtered = docs.where((doc) {
                  final data = doc.data();
                  final id = doc.id.toLowerCase();
                  final orderNo = (data['orderNumber'] ??
                          data['orderId'] ??
                          data['trackingCode'] ??
                          '')
                      .toString()
                      .toLowerCase();
                  final client = (data['clientName'] ??
                          data['customerName'] ??
                          '')
                      .toString()
                      .toLowerCase();
                  final device = (data['device'] ??
                          data['deviceModel'] ??
                          '')
                      .toString()
                      .toLowerCase();

                  if (_searchQuery.isEmpty) return true;
                  final q = _searchQuery.toLowerCase();
                  return id.contains(q) ||
                      orderNo.contains(q) ||
                      client.contains(q) ||
                      device.contains(q);
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(CupertinoIcons.doc_text_fill,
                              size: 56,
                              color:
                                  kbiSecondaryLabel.withValues(alpha: 0.4)),
                          const SizedBox(height: 12),
                          Text(
                            isAr
                                ? 'لا توجد طلبات لعرض نماذجها'
                                : 'No orders found for form generation',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: kbiSecondaryLabel,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final doc = filtered[index];
                    final job = ServiceRequestModel.fromDoc(doc);
                    final data = doc.data();
                    final orderNo = data['orderNumber'] ??
                        data['orderId'] ??
                        data['trackingCode'] ??
                        job.id;
                    final clientName = data['clientName'] ??
                        data['customerName'] ??
                        job.customerName ??
                        (isAr ? 'عميل' : 'Customer');
                    final device = data['device'] ??
                        data['deviceModel'] ??
                        job.deviceName ??
                        (isAr ? 'جهاز غير محدد' : 'Unknown Device');
                    final service = data['service'] ??
                        data['serviceType'] ??
                        job.serviceName ??
                        '';
                    final date = jobDate(data);
                    final total = (data['finalAmount'] ??
                            data['totalAmount'] ??
                            data['price'] ??
                            0) as num;

                    final isCurrentActive =
                        widget.activeJob?.id == job.id;

                    return Material(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      clipBehavior: Clip.antiAlias,
                      child: InkWell(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          Navigator.of(context).push(
                            CupertinoPageRoute<void>(
                              builder: (_) => InvoiceFormScreen(
                                job: job,
                                locale: widget.locale,
                              ),
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isCurrentActive
                                  ? kbiGreen.withValues(alpha: 0.6)
                                  : kbiSeparator,
                              width: isCurrentActive ? 1.5 : 1.0,
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 46,
                                height: 46,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF00C7BE)
                                      .withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                alignment: Alignment.center,
                                child: const Icon(
                                  CupertinoIcons.doc_text_fill,
                                  color: Color(0xFF00A59D),
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          'KBI-$orderNo',
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w800,
                                            color: kbiLabel,
                                            fontFamily: 'monospace',
                                          ),
                                        ),
                                        if (isCurrentActive) ...[
                                          const SizedBox(width: 6),
                                          Container(
                                            padding:
                                                const EdgeInsets.symmetric(
                                                    horizontal: 6,
                                                    vertical: 2),
                                            decoration: BoxDecoration(
                                              color: kbiGreen
                                                  .withValues(alpha: 0.12),
                                              borderRadius:
                                                  BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              isAr ? 'الطلب الحالي' : 'ACTIVE',
                                              style: const TextStyle(
                                                fontSize: 9,
                                                fontWeight: FontWeight.w800,
                                                color: kbiGreen,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      '$clientName • $device',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: kbiLabel,
                                      ),
                                    ),
                                    if (service.toString().isNotEmpty)
                                      Text(
                                        service.toString(),
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: kbiSecondaryLabel,
                                        ),
                                      ),
                                    const SizedBox(height: 4),
                                    Text(
                                      date != null
                                          ? DateFormat('dd/MM/yyyy • hh:mm a')
                                              .format(date)
                                          : '',
                                      style: const TextStyle(
                                        fontSize: 10,
                                        color: kbiSecondaryLabel,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    'AED ${total.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: kbiLabel,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Text(
                                        isAr ? 'عرض / تعديل' : 'View / Edit',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF00A59D),
                                        ),
                                      ),
                                      const Icon(
                                        Icons.chevron_right_rounded,
                                        size: 16,
                                        color: Color(0xFF00A59D),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
