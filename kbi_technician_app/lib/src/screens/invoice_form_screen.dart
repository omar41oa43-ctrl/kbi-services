import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/service_request.dart';
import '../theme.dart';
import 'parts_inventory_screen.dart';

class InvoiceItem {
  String description;
  String partNo;
  int qty;
  double total;

  InvoiceItem({
    required this.description,
    required this.partNo,
    required this.qty,
    required this.total,
  });

  Map<String, dynamic> toMap() => {
        'description': description,
        'partNo': partNo,
        'qty': qty,
        'total': total,
      };

  factory InvoiceItem.fromMap(Map<String, dynamic> map) => InvoiceItem(
        description: map['description']?.toString() ?? '',
        partNo: map['partNo']?.toString() ?? '',
        qty: (map['qty'] as num?)?.toInt() ?? 1,
        total: (map['total'] as num?)?.toDouble() ?? 0.0,
      );
}

class InvoiceFormScreen extends StatefulWidget {
  final ServiceRequestModel job;
  final Locale locale;

  const InvoiceFormScreen({
    super.key,
    required this.job,
    required this.locale,
  });

  @override
  State<InvoiceFormScreen> createState() => _InvoiceFormScreenState();
}

class _InvoiceFormScreenState extends State<InvoiceFormScreen> {
  late TextEditingController _orderNoController;
  late TextEditingController _invoiceNoController;
  late TextEditingController _issuedToController;
  late TextEditingController _locationController;
  late TextEditingController _dateController;
  late TextEditingController _receivedByController;
  late TextEditingController _signatureController;
  late TextEditingController _phoneNumController;

  List<InvoiceItem> _items = [];
  bool _isSaving = false;
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    _initControllers();
    _loadExistingFormData();
  }

  void _initControllers() {
    final now = DateTime.now();
    final defaultDate = DateFormat('dd/MM/yyyy').format(now);
    final orderNo = widget.job.orderId ?? widget.job.id;
    final shortNo = orderNo.length > 8 ? orderNo.substring(orderNo.length - 8) : orderNo;

    _orderNoController = TextEditingController(text: shortNo.toUpperCase());
    _invoiceNoController = TextEditingController(text: 'INV-$shortNo'.toUpperCase());
    _issuedToController = TextEditingController(text: widget.job.customerName ?? '');
    _locationController = TextEditingController(text: widget.job.address ?? 'Abu Dhabi, UAE');
    _dateController = TextEditingController(text: defaultDate);
    _receivedByController = TextEditingController(text: widget.job.customerName ?? '');
    _signatureController = TextEditingController(text: 'Customer Digital Sign');
    _phoneNumController = TextEditingController(text: widget.job.customerPhone ?? '');

    // Default primary item from service & device
    final service = widget.job.serviceName ?? widget.job.type;
    final device = widget.job.deviceName ?? '';
    final desc = device.isNotEmpty ? '$service - $device' : service;
    final totalAmt = widget.job.totalAmount ?? 250.0;

    _items = [
      InvoiceItem(
        description: desc.isNotEmpty ? desc : 'Hardware Diagnostic & Repair',
        partNo: 'SRV-01',
        qty: 1,
        total: totalAmt,
      ),
    ];
  }

  Future<void> _loadExistingFormData() async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection(widget.job.collectionName ?? 'orders')
          .doc(widget.job.id)
          .get();

      if (doc.exists && doc.data() != null) {
        final data = doc.data()!;
        final invoiceData = data['officialInvoice'] as Map<String, dynamic>?;

        if (invoiceData != null) {
          setState(() {
            if (invoiceData['orderNo'] != null) _orderNoController.text = invoiceData['orderNo'];
            if (invoiceData['invoiceNo'] != null) _invoiceNoController.text = invoiceData['invoiceNo'];
            if (invoiceData['issuedTo'] != null) _issuedToController.text = invoiceData['issuedTo'];
            if (invoiceData['location'] != null) _locationController.text = invoiceData['location'];
            if (invoiceData['date'] != null) _dateController.text = invoiceData['date'];
            if (invoiceData['receivedBy'] != null) _receivedByController.text = invoiceData['receivedBy'];
            if (invoiceData['signature'] != null) _signatureController.text = invoiceData['signature'];
            if (invoiceData['phoneNum'] != null) _phoneNumController.text = invoiceData['phoneNum'];

            final rawItems = invoiceData['items'] as List<dynamic>?;
            if (rawItems != null && rawItems.isNotEmpty) {
              _items = rawItems.map((e) => InvoiceItem.fromMap(Map<String, dynamic>.from(e as Map))).toList();
            }
          });
        }
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _orderNoController.dispose();
    _invoiceNoController.dispose();
    _issuedToController.dispose();
    _locationController.dispose();
    _dateController.dispose();
    _receivedByController.dispose();
    _signatureController.dispose();
    _phoneNumController.dispose();
    super.dispose();
  }

  double get _subtotal => _items.fold(0.0, (currentSum, i) => currentSum + i.total);
  double get _total => _subtotal;

  void _addItem() {
    setState(() {
      _items.add(
        InvoiceItem(
          description: 'OEM Replacement Part',
          partNo: 'PRT-${_items.length + 1}',
          qty: 1,
          total: 100.0,
        ),
      );
    });
  }

  void _removeItem(int index) {
    if (_items.length <= 1) return;
    setState(() => _items.removeAt(index));
  }

  void _openPartsPicker() {
    Navigator.of(context).push(
      CupertinoPageRoute<void>(
        builder: (_) => PartsInventoryScreen(
          locale: widget.locale,
          activeJob: widget.job,
          onPartSelected: (part) {
            final name = part['name'] ?? 'Part';
            final sku = part['sku'] ?? 'OEM';
            final price = (part['price'] as num?)?.toDouble() ?? 0.0;
            setState(() {
              _items.add(
                InvoiceItem(
                  description: name.toString(),
                  partNo: sku.toString(),
                  qty: 1,
                  total: price > 0 ? price : 50.0,
                ),
              );
            });
          },
        ),
      ),
    );
  }

  Future<void> _saveInvoice() async {
    setState(() => _isSaving = true);
    final isAr = widget.locale.languageCode == 'ar';

    try {
      final invoicePayload = {
        'orderNo': _orderNoController.text.trim(),
        'invoiceNo': _invoiceNoController.text.trim(),
        'issuedTo': _issuedToController.text.trim(),
        'location': _locationController.text.trim(),
        'date': _dateController.text.trim(),
        'receivedBy': _receivedByController.text.trim(),
        'signature': _signatureController.text.trim(),
        'phoneNum': _phoneNumController.text.trim(),
        'items': _items.map((i) => i.toMap()).toList(),
        'subtotal': _subtotal,
        'total': _total,
        'updatedAt': FieldValue.serverTimestamp(),
      };

      await FirebaseFirestore.instance
          .collection(widget.job.collectionName ?? 'orders')
          .doc(widget.job.id)
          .set({
        'officialInvoice': invoicePayload,
        'finalAmount': _total,
        'totalAmount': _total,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      setState(() {
        _isSaving = false;
        _isEditing = false;
      });

      if (mounted) {
        HapticFeedback.mediumImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isAr
                  ? 'تم حفظ الفاتورة بنجاح في قاعدة البيانات'
                  : 'Invoice saved successfully to database!',
            ),
            backgroundColor: kbiGreen,
          ),
        );
      }
    } catch (e) {
      setState(() => _isSaving = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save invoice: $e'),
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
      backgroundColor: const Color(0xFFE2E8F0),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color(0xFF00C7BE),
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          isAr ? 'نموذج الفاتورة الرسمي' : 'Official KBI Invoice',
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
        ),
        actions: [
          TextButton.icon(
            onPressed: () => setState(() => _isEditing = !_isEditing),
            icon: Icon(
              _isEditing ? Icons.visibility_rounded : Icons.edit_rounded,
              color: Colors.white,
              size: 18,
            ),
            label: Text(
              _isEditing ? (isAr ? 'معاينة' : 'Preview') : (isAr ? 'تعديل' : 'Edit'),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          IconButton(
            icon: _isSaving
                ? const CupertinoActivityIndicator(color: Colors.white)
                : const Icon(Icons.save_rounded, color: Colors.white),
            tooltip: 'Save Invoice',
            onPressed: _isSaving ? null : _saveInvoice,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 620),
            child: Column(
              children: [
                // Top Action Banner when editing
                if (_isEditing)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.edit_note_rounded, color: Color(0xFF00C7BE)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            isAr
                                ? 'وضع التعديل مفعل: يمكنك تغيير الحقول وإضافة قطع الغيار'
                                : 'Edit Mode Active: Tap fields to modify or add spare parts.',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: _openPartsPicker,
                          style: TextButton.styleFrom(
                            backgroundColor: const Color(0xFF00C7BE),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          ),
                          child: Text(
                            isAr ? '+ قطعة غيار' : '+ Add Part',
                            style: const TextStyle(
                              color: Color(0xFF0F172A),
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // THE EXACT INVOICE DOCUMENT
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.12),
                        blurRadius: 18,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // 1. CYAN HEADER
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
                        decoration: const BoxDecoration(
                          color: Color(0xFF00C7BE),
                          borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
                        ),
                        child: const Column(
                          children: [
                            Text(
                              'KBI.',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.5,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'GLOBAL TECHNOLOGIES',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 2.0,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // 2. COMPANY DETAILS & ORDER / INVOICE NO
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            // Left: Company Contacts
                            const Expanded(
                              flex: 5,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('TEL : +971502491034',
                                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF0F172A))),
                                  Text('P.O. BOX : 88888',
                                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF0F172A))),
                                  Text('UNITED ARAB EMIRATES',
                                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF0F172A))),
                                  Text('EMIRATE : ABU DHABI',
                                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF0F172A))),
                                  Text('EMAIL :',
                                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF0F172A))),
                                  Text('INFO@KBI.SERVICES',
                                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF0F172A))),
                                ],
                              ),
                            ),

                            // Center: INVOICE title
                            const Expanded(
                              flex: 3,
                              child: Center(
                                child: Text(
                                  'INVOICE',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF00C7BE),
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ),
                            ),

                            // Right: ORDER NO
                            Expanded(
                              flex: 5,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Text('ORDER NO : KBI ',
                                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF0F172A))),
                                      _isEditing
                                          ? SizedBox(
                                              width: 70,
                                              height: 24,
                                              child: TextField(
                                                controller: _orderNoController,
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                                decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.all(2)),
                                              ),
                                            )
                                          : Text(
                                              _orderNoController.text,
                                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                                            ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      // 3. ISSUED TO, INVOICE NO, LOCATION, DATE
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Row(
                                    children: [
                                      const Text('ISSUED TO: ',
                                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF0F172A))),
                                      Expanded(
                                        child: _isEditing
                                            ? TextField(
                                                controller: _issuedToController,
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                                decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.all(2)),
                                              )
                                            : Text(
                                                _issuedToController.text,
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, decoration: TextDecoration.underline),
                                              ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      const Text('INVOICE NO: ',
                                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF0F172A))),
                                      _isEditing
                                          ? SizedBox(
                                              width: 90,
                                              height: 24,
                                              child: TextField(
                                                controller: _invoiceNoController,
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                                decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.all(2)),
                                              ),
                                            )
                                          : Text(
                                              _invoiceNoController.text,
                                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                                            ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Row(
                                    children: [
                                      const Text('LOCATION : ',
                                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF0F172A))),
                                      Expanded(
                                        child: _isEditing
                                            ? TextField(
                                                controller: _locationController,
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                                decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.all(2)),
                                              )
                                            : Text(
                                                _locationController.text,
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                              ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    const Text('DATE: ',
                                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF0F172A))),
                                    _isEditing
                                        ? SizedBox(
                                            width: 85,
                                            height: 24,
                                            child: TextField(
                                              controller: _dateController,
                                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                              decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.all(2)),
                                            ),
                                          )
                                        : Text(
                                            _dateController.text,
                                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                                          ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // 4. ITEMS TABLE (CYAN HEADER & BORDERED CELLS)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: const Color(0xFF00C7BE), width: 1.5),
                          ),
                          child: Column(
                            children: [
                              // Table Header
                              Container(
                                color: const Color(0xFF00C7BE),
                                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                                child: const Row(
                                  children: [
                                    Expanded(
                                      flex: 5,
                                      child: Text(
                                        'DESCRIPTION',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11),
                                      ),
                                    ),
                                    Expanded(
                                      flex: 2,
                                      child: Text(
                                        'PART NO.',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11),
                                      ),
                                    ),
                                    Expanded(
                                      flex: 1,
                                      child: Text(
                                        'QTY',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11),
                                      ),
                                    ),
                                    Expanded(
                                      flex: 2,
                                      child: Text(
                                        'TOTAL',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Table Rows
                              ..._items.asMap().entries.map((entry) {
                                final idx = entry.key;
                                final item = entry.value;

                                return Container(
                                  decoration: BoxDecoration(
                                    border: Border(
                                      top: BorderSide(color: const Color(0xFF00C7BE).withValues(alpha: 0.4)),
                                    ),
                                  ),
                                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                                  child: Row(
                                    children: [
                                      // Description
                                      Expanded(
                                        flex: 5,
                                        child: _isEditing
                                            ? TextField(
                                                controller: TextEditingController(text: item.description),
                                                onChanged: (val) => item.description = val,
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                                decoration: const InputDecoration(isDense: true, border: InputBorder.none),
                                              )
                                            : Text(item.description,
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                                      ),
                                      // Part No
                                      Expanded(
                                        flex: 2,
                                        child: _isEditing
                                            ? TextField(
                                                controller: TextEditingController(text: item.partNo),
                                                onChanged: (val) => item.partNo = val,
                                                textAlign: TextAlign.center,
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                                decoration: const InputDecoration(isDense: true, border: InputBorder.none),
                                              )
                                            : Text(item.partNo,
                                                textAlign: TextAlign.center,
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF0F172A))),
                                      ),
                                      // Qty
                                      Expanded(
                                        flex: 1,
                                        child: _isEditing
                                            ? TextField(
                                                controller: TextEditingController(text: item.qty.toString()),
                                                keyboardType: TextInputType.number,
                                                onChanged: (val) {
                                                  final q = int.tryParse(val) ?? 1;
                                                  setState(() => item.qty = q);
                                                },
                                                textAlign: TextAlign.center,
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                                decoration: const InputDecoration(isDense: true, border: InputBorder.none),
                                              )
                                            : Text(item.qty.toString(),
                                                textAlign: TextAlign.center,
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                                      ),
                                      // Total
                                      Expanded(
                                        flex: 2,
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.end,
                                          children: [
                                            Expanded(
                                              child: _isEditing
                                                  ? TextField(
                                                      controller: TextEditingController(text: item.total.toStringAsFixed(0)),
                                                      keyboardType: TextInputType.number,
                                                      textAlign: TextAlign.end,
                                                      onChanged: (val) {
                                                        final t = double.tryParse(val) ?? 0.0;
                                                        setState(() => item.total = t);
                                                      },
                                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                                      decoration: const InputDecoration(isDense: true, border: InputBorder.none),
                                                    )
                                                  : Text(
                                                      item.total.toStringAsFixed(2),
                                                      textAlign: TextAlign.end,
                                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                                                    ),
                                            ),
                                            if (_isEditing)
                                              InkWell(
                                                onTap: () => _removeItem(idx),
                                                child: const Padding(
                                                  padding: EdgeInsets.only(left: 4),
                                                  child: Icon(Icons.delete_outline_rounded, size: 16, color: Colors.red),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),

                              // Add item row when editing
                              if (_isEditing)
                                InkWell(
                                  onTap: _addItem,
                                  child: Container(
                                    color: const Color(0xFFF8FAFC),
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    child: const Center(
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.add_circle_outline, size: 14, color: Color(0xFF00C7BE)),
                                          SizedBox(width: 4),
                                          Text('Add Item Line',
                                              style: TextStyle(fontSize: 11, color: Color(0xFF00C7BE), fontWeight: FontWeight.bold)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),

                              // Table Footer: SUBTOTAL & TOTAL
                              Container(
                                color: const Color(0xFF00C7BE),
                                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('SUBTOTAL :  AED ${_subtotal.toStringAsFixed(2)}',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11)),
                                    Text('TOTAL :  AED ${_total.toStringAsFixed(2)}',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 5. BOTTOM SECTION: SIGNATURE & TERMS & BANK DETAILS
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Left: Customer Received & Sign
                            Expanded(
                              flex: 4,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('RECEIVED BY:', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: Color(0xFF0F172A))),
                                  _isEditing
                                      ? TextField(
                                          controller: _receivedByController,
                                          style: const TextStyle(fontSize: 10),
                                          decoration: const InputDecoration(isDense: true),
                                        )
                                      : Text(_receivedByController.text,
                                          style: const TextStyle(fontSize: 10, decoration: TextDecoration.underline)),
                                  const SizedBox(height: 8),
                                  const Text('SIGNATURE:', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: Color(0xFF0F172A))),
                                  _isEditing
                                      ? TextField(
                                          controller: _signatureController,
                                          style: const TextStyle(fontSize: 10),
                                          decoration: const InputDecoration(isDense: true),
                                        )
                                      : Text(_signatureController.text,
                                          style: const TextStyle(fontSize: 10, decoration: TextDecoration.underline)),
                                  const SizedBox(height: 8),
                                  const Text('PHONE NUM :', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: Color(0xFF0F172A))),
                                  _isEditing
                                      ? TextField(
                                          controller: _phoneNumController,
                                          style: const TextStyle(fontSize: 10),
                                          decoration: const InputDecoration(isDense: true),
                                        )
                                      : Text(_phoneNumController.text,
                                          style: const TextStyle(fontSize: 10, decoration: TextDecoration.underline)),
                                  const SizedBox(height: 12),
                                  const Text('RECEIVED IN GOOD CONDITION',
                                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 9, color: Color(0xFF0F172A))),
                                ],
                              ),
                            ),

                            // Center: TERMS & CONDITIONS
                            const Expanded(
                              flex: 4,
                              child: Padding(
                                padding: EdgeInsets.symmetric(horizontal: 6),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Text('TERMS & CONDITIONS',
                                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: Color(0xFF0F172A))),
                                    SizedBox(height: 4),
                                    Text(
                                      'Please send payment within 20 days of receiving this invoice.\nThere will be a 10% interest charge per month on late invoices.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(fontSize: 8.5, color: Color(0xFF334155), height: 1.3),
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            // Right: BANK DETAILS
                            const Expanded(
                              flex: 4,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text('BANK DETAILS', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: Color(0xFF0F172A))),
                                  SizedBox(height: 4),
                                  Text('ACCOUNT HOLDER: KBI GLOBAL TECHNOLOGIES',
                                      textAlign: TextAlign.end,
                                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 7.5, color: Color(0xFF0F172A))),
                                  Text('IBAN: AE068090000000000623369',
                                      textAlign: TextAlign.end,
                                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 7.5, color: Color(0xFF0F172A))),
                                  Text('ACCOUNT NUMBER: 623369',
                                      textAlign: TextAlign.end,
                                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 7.5, color: Color(0xFF0F172A))),
                                  Text('CURRENCY: AED',
                                      textAlign: TextAlign.end,
                                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 7.5, color: Color(0xFF0F172A))),
                                  Text('SWIFT CODE: EMDVAEADXXX',
                                      textAlign: TextAlign.end,
                                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 7.5, color: Color(0xFF0F172A))),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      // 6. BRAND LOGOS & STAMP FOOTER
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                        decoration: const BoxDecoration(
                          color: Color(0xFF00C7BE),
                          borderRadius: BorderRadius.vertical(bottom: Radius.circular(8)),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('HP • APPLE • LG • DELL • SAMSUNG • IFIXIT',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 10,
                                  letterSpacing: 1.5,
                                )),
                            Text('KBI SEAL VERIFIED',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 9,
                                )),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Big Save Button at bottom
                CupertinoButton(
                  color: const Color(0xFF00C7BE),
                  borderRadius: BorderRadius.circular(14),
                  onPressed: _isSaving ? null : _saveInvoice,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.check_circle_rounded, color: Colors.white),
                      const SizedBox(width: 8),
                      Text(
                        isAr ? 'حفظ وتأكيد نموذج الفاتورة' : 'Save & Confirm Invoice Form',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
