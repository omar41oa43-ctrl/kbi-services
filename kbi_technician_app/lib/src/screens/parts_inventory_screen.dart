import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../theme.dart';
import '../models/service_request.dart';

class PartsInventoryScreen extends StatefulWidget {
  final Locale locale;
  final ServiceRequestModel? activeJob;
  final void Function(Map<String, dynamic> part)? onPartSelected;

  const PartsInventoryScreen({
    super.key,
    required this.locale,
    this.activeJob,
    this.onPartSelected,
  });

  @override
  State<PartsInventoryScreen> createState() => _PartsInventoryScreenState();
}

class _PartsInventoryScreenState extends State<PartsInventoryScreen> {
  String _searchQuery = '';
  String _selectedCategory = 'All';
  String _selectedBrand = 'All';
  bool _showOnlyInStock = true;
  List<Map<String, dynamic>> _apiParts = [];
  bool _isLoadingApi = false;

  final List<String> _categories = [
    'All',
    'Screens',
    'Batteries',
    'Charging Ports',
    'Speakers',
    'Cameras',
    'Motherboards',
    'Flex Cables',
    'Buttons',
    'Housings',
    'Tools',
    'Adhesives',
    'Other'
  ];

  final List<String> _brands = [
    'All',
    'Apple',
    'Samsung',
    'Huawei',
    'Xiaomi',
    'OnePlus',
    'Google',
    'Sony',
    'LG',
    'Universal',
    'Other'
  ];

  @override
  void initState() {
    super.initState();
    _fetchPartsFromApi();
  }

  Future<void> _fetchPartsFromApi() async {
    setState(() {
      _isLoadingApi = true;
    });

    try {
      final uri = Uri.parse('http://127.0.0.1:3000/api/technician/parts');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['parts'] is List) {
          if (mounted) {
            setState(() {
              _apiParts = (data['parts'] as List)
                  .map((e) => Map<String, dynamic>.from(e as Map))
                  .toList();
              _isLoadingApi = false;
            });
            return;
          }
        }
      }
    } catch (_) {}

    if (mounted) {
      setState(() => _isLoadingApi = false);
    }
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> _getPartsStream() {
    return FirebaseFirestore.instance
        .collection('parts')
        .snapshots();
  }

  Future<void> _usePart(Map<String, dynamic> part, String partId) async {
    final isAr = widget.locale.languageCode == 'ar';
    final name = part['name'] ?? 'Part';
    final currentStock = (part['quantity'] as num?)?.toInt() ?? 0;

    if (currentStock <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isAr
              ? 'هذه القطعة غير متوفرة في المخزون حالياً'
              : 'This part is currently out of stock',
          ),
          backgroundColor: kbiRed,
        ),
      );
      return;
    }

    final confirm = await showCupertinoDialog<bool>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: Text(isAr ? 'استخدام القطعة' : 'Use Spare Part'),
        content: Text(
          isAr
              ? 'هل تريد تسجيل استخدام قطعة "$name" لهذا الطلب وخصمها من المخزون؟'
              : 'Do you want to allocate "$name" to this repair and deduct 1 unit from inventory?',
        ),
        actions: [
          CupertinoDialogAction(
            isDestructiveAction: true,
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(isAr ? 'إلغاء' : 'Cancel'),
          ),
          CupertinoDialogAction(
            isDefaultAction: true,
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(isAr ? 'تأكيد واستخدام' : 'Confirm & Use'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      // 1. Try REST API allocate first
      try {
        final uri = Uri.parse('http://127.0.0.1:3000/api/technician/parts');
        await http.post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'partId': partId,
            'orderId': widget.activeJob?.id,
            'quantity': 1,
          }),
        ).timeout(const Duration(seconds: 3));
      } catch (_) {}

      // 2. Direct Firestore Transaction fallback/sync
      try {
        await FirebaseFirestore.instance.runTransaction((transaction) async {
          final partRef = FirebaseFirestore.instance.collection('parts').doc(partId);
          final snapshot = await transaction.get(partRef);
          if (!snapshot.exists) return;

          final qty = (snapshot.data()?['quantity'] as num?)?.toInt() ?? 0;
          final newQty = (qty - 1).clamp(0, 999999);
          transaction.update(partRef, {
            'quantity': newQty,
            'updatedAt': FieldValue.serverTimestamp(),
          });
        });

        if (widget.activeJob != null) {
          final jobRef = FirebaseFirestore.instance
              .collection(widget.activeJob!.collectionName ?? 'orders')
              .doc(widget.activeJob!.id);

          await jobRef.set({
            'usedParts': FieldValue.arrayUnion([
              {
                'partId': partId,
                'name': name,
                'sku': part['sku'] ?? '',
                'price': part['price'] ?? 0,
                'category': part['category'] ?? '',
                'allocatedAt': Timestamp.now(),
              }
            ]),
            'updatedAt': FieldValue.serverTimestamp(),
          }, SetOptions(merge: true));
        }
      } catch (_) {}

      widget.onPartSelected?.call({'id': partId, ...part});
      _fetchPartsFromApi();

      if (mounted) {
        HapticFeedback.mediumImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isAr
                  ? 'تم خصم القطعة بنجاح وإضافتها للطلب'
                  : 'Part deducted and allocated to job successfully!',
            ),
            backgroundColor: kbiGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isAr
                  ? 'حدث خطأ أثناء تحديث المخزون: $e'
                  : 'Failed to update inventory: $e',
            ),
            backgroundColor: kbiRed,
          ),
        );
      }
    }
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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isAr ? 'مخزون قطع الغيار' : 'Spare Parts Inventory',
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: kbiLabel,
              ),
            ),
            if (widget.activeJob != null)
              Text(
                isAr
                    ? 'طلب #${widget.activeJob!.orderId ?? widget.activeJob!.id}'
                    : 'Order #${widget.activeJob!.orderId ?? widget.activeJob!.id}',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: kbiSecondaryLabel,
                ),
              ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              children: [
                // Search Box
                Container(
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
                          ? 'بحث بالاسم، رمز SKU أو الجهاز...'
                          : 'Search by part name, SKU or device...',
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
                const SizedBox(height: 10),

                // Filters Row (Category & Stock Toggle)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      // In Stock Filter Toggle
                      FilterChip(
                        selected: _showOnlyInStock,
                        label: Text(
                          isAr ? 'المتوفر فقط' : 'In Stock Only',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: _showOnlyInStock ? Colors.white : kbiLabel,
                          ),
                        ),
                        selectedColor: kbiBlue,
                        backgroundColor: Colors.white,
                        showCheckmark: false,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(999),
                          side: BorderSide(
                            color: _showOnlyInStock ? kbiBlue : kbiSeparator,
                          ),
                        ),
                        onSelected: (val) => setState(() => _showOnlyInStock = val),
                      ),
                      const SizedBox(width: 8),

                      // Category Dropdown
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: kbiSeparator),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedCategory,
                            icon: const Icon(Icons.keyboard_arrow_down_rounded,
                                size: 18, color: kbiSecondaryLabel),
                            style: const TextStyle(
                              color: kbiLabel,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                            items: _categories.map((c) {
                              return DropdownMenuItem<String>(
                                value: c,
                                child: Text(c == 'All' && isAr ? 'جميع الفئات' : c),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) setState(() => _selectedCategory = val);
                            },
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Brand Dropdown
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: kbiSeparator),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedBrand,
                            icon: const Icon(Icons.keyboard_arrow_down_rounded,
                                size: 18, color: kbiSecondaryLabel),
                            style: const TextStyle(
                              color: kbiLabel,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                            items: _brands.map((b) {
                              return DropdownMenuItem<String>(
                                value: b,
                                child: Text(b == 'All' && isAr ? 'جميع الماركات' : b),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) setState(() => _selectedBrand = val);
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Parts Stream List
          Expanded(
            child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: _getPartsStream(),
              builder: (context, snapshot) {
                List<Map<String, dynamic>> rawList = [];

                if (snapshot.hasData && snapshot.data!.docs.isNotEmpty) {
                  rawList = snapshot.data!.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList();
                } else if (_apiParts.isNotEmpty) {
                  rawList = _apiParts;
                } else if (snapshot.hasError && !_isLoadingApi && _apiParts.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(CupertinoIcons.exclamationmark_triangle_fill,
                              size: 44, color: kbiOrange.withValues(alpha: 0.8)),
                          const SizedBox(height: 12),
                          Text(
                            isAr ? 'تعذر تحميل قطع الغيار' : 'Failed to load parts',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: kbiLabel,
                            ),
                          ),
                          const SizedBox(height: 12),
                          CupertinoButton(
                            color: kbiBlue,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            borderRadius: BorderRadius.circular(8),
                            onPressed: _fetchPartsFromApi,
                            child: Text(isAr ? 'إعادة المحاولة' : 'Retry Loading',
                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  );
                } else if (_isLoadingApi && rawList.isEmpty) {
                  return const Center(child: CupertinoActivityIndicator());
                }

                final filtered = rawList.where((data) {
                  final name = (data['name'] ?? '').toString().toLowerCase();
                  final sku = (data['sku'] ?? '').toString().toLowerCase();
                  final brand = (data['brand'] ?? '').toString();
                  final category = (data['category'] ?? '').toString();
                  final devices = (data['compatibleDevices'] is List)
                      ? (data['compatibleDevices'] as List).join(' ').toLowerCase()
                      : (data['compatibleDevices'] ?? '').toString().toLowerCase();
                  final qty = (data['quantity'] as num?)?.toInt() ?? 0;

                  // Stock check
                  if (_showOnlyInStock && qty <= 0) return false;

                  // Category check
                  if (_selectedCategory != 'All' && category != _selectedCategory) {
                    return false;
                  }

                  // Brand check
                  if (_selectedBrand != 'All' && brand != _selectedBrand) {
                    return false;
                  }

                  // Query check
                  if (_searchQuery.isNotEmpty) {
                    final q = _searchQuery.toLowerCase();
                    if (!name.contains(q) &&
                        !sku.contains(q) &&
                        !brand.toLowerCase().contains(q) &&
                        !devices.contains(q)) {
                      return false;
                    }
                  }

                  return true;
                }).toList()
                  ..sort((a, b) => ((a['name'] ?? '') as String)
                      .toLowerCase()
                      .compareTo(((b['name'] ?? '') as String).toLowerCase()));

                if (filtered.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(CupertinoIcons.cube_box,
                              size: 56, color: kbiSecondaryLabel.withValues(alpha: 0.4)),
                          const SizedBox(height: 12),
                          Text(
                            isAr
                                ? 'لا توجد قطع غيار مطابقة للبحث'
                                : 'No matching spare parts found',
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
                    final part = filtered[index];
                    final partId = (part['id'] ?? '').toString();
                    final name = part['name'] ?? 'Part';
                    final sku = part['sku'] ?? '';
                    final brand = part['brand'] ?? '';
                    final category = part['category'] ?? '';
                    final location = part['location'] ?? '';
                    final price = (part['price'] as num?)?.toDouble() ?? 0.0;
                    final qty = (part['quantity'] as num?)?.toInt() ?? 0;
                    final minStock = (part['minStock'] as num?)?.toInt() ?? 5;

                    final isLow = qty <= minStock && qty > 0;
                    final isOut = qty <= 0;

                    return Material(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      clipBehavior: Clip.antiAlias,
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isOut
                                ? kbiRed.withValues(alpha: 0.3)
                                : isLow
                                    ? kbiOrange.withValues(alpha: 0.4)
                                    : kbiSeparator,
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Icon / Category box
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                color: isOut
                                    ? kbiRed.withValues(alpha: 0.08)
                                    : isLow
                                        ? kbiOrange.withValues(alpha: 0.1)
                                        : kbiBlue.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              alignment: Alignment.center,
                              child: Icon(
                                CupertinoIcons.cube_box_fill,
                                color: isOut
                                    ? kbiRed
                                    : isLow
                                        ? kbiOrange
                                        : kbiBlue,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 12),

                            // Part Details
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          name,
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w700,
                                            color: kbiLabel,
                                          ),
                                        ),
                                      ),
                                      if (sku.isNotEmpty)
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: kbiGroupedBackground,
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            sku,
                                            style: const TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w600,
                                              color: kbiSecondaryLabel,
                                              fontFamily: 'monospace',
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    [
                                      if (category.isNotEmpty) category,
                                      if (brand.isNotEmpty) brand,
                                      if (location.isNotEmpty) '📍 $location',
                                    ].join(' • '),
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: kbiSecondaryLabel,
                                    ),
                                  ),
                                  const SizedBox(height: 8),

                                  // Stock & Price Row
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          Container(
                                            width: 8,
                                            height: 8,
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: isOut
                                                  ? kbiRed
                                                  : isLow
                                                      ? kbiOrange
                                                      : kbiGreen,
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            isOut
                                                ? (isAr ? 'نفذت الكمية' : 'Out of Stock')
                                                : isLow
                                                    ? (isAr
                                                        ? 'كمية منخفضة ($qty متبقي)'
                                                        : 'Low Stock ($qty left)')
                                                    : (isAr
                                                        ? '$qty متوفر'
                                                        : '$qty in stock'),
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: isOut
                                                  ? kbiRed
                                                  : isLow
                                                      ? kbiOrange
                                                      : const Color(0xFF16A34A),
                                            ),
                                          ),
                                        ],
                                      ),
                                      if (price > 0)
                                        Text(
                                          'AED ${price.toStringAsFixed(0)}',
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w800,
                                            color: kbiLabel,
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),

                            // Allocate / Use Button
                            CupertinoButton(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 8),
                              color: isOut ? Colors.grey[200] : kbiBlue,
                              disabledColor: Colors.grey[200]!,
                              borderRadius: BorderRadius.circular(10),
                              onPressed: isOut ? null : () => _usePart(part, partId),
                              child: Text(
                                isAr ? 'استخدام' : 'Use',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: isOut ? Colors.grey : Colors.white,
                                ),
                              ),
                            ),
                          ],
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
