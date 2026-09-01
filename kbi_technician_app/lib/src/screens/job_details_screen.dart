import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart' as fmap;
import 'package:latlong2/latlong.dart' as ll;
import 'package:qr_flutter/qr_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/service_request.dart';
import '../services/storage_service.dart';
import '../services/technician_service.dart';
import '../theme.dart';
import '../utils/job_utils.dart';
import '../widgets/liquid_glass.dart';
import 'parts_inventory_screen.dart';
import 'invoice_form_screen.dart';

class JobDetailsScreen extends StatefulWidget {
  final ServiceRequestModel job;

  const JobDetailsScreen({super.key, required this.job});

  @override
  State<JobDetailsScreen> createState() => _JobDetailsScreenState();
}

class _JobDetailsScreenState extends State<JobDetailsScreen>
    with SingleTickerProviderStateMixin {
  late ServiceRequestModel _job;
  late TabController _tabController;
  bool _isUpdating = false;
  bool _isSatelliteMode = false;
  final fmap.MapController _mapController = fmap.MapController();

  // Diagnostics & Checklist state: Map<ItemName, Status> where Status is 'PASS', 'FAIL', or 'NA'
  final Map<String, String> _checklist = {
    'Screen Touch & Multi-Touch Response': 'PASS',
    'Face ID / Touch ID Biometrics': 'PASS',
    'Front & Rear Cameras + Flash': 'PASS',
    'Charging Port & Power Draw': 'PASS',
    'Microphone, Earpiece & Speakers': 'PASS',
    'Physical Buttons & Haptic Engine': 'PASS',
    'Wi-Fi, Bluetooth & Cellular Signal': 'PASS',
  };

  final List<String> _beforePhotos = [];
  final List<String> _afterPhotos = [];

  // Signature points
  final List<Offset?> _signaturePoints = [];
  bool _signatureCaptured = false;

  // Payment method selection
  String _selectedPaymentMethod =
      'Cash Received'; // 'Cash Received', 'POS Terminal', 'Paid Online'

  String? _preferredNavigationApp;

  bool get _isArabic =>
      Localizations.localeOf(context).languageCode.toLowerCase() == 'ar';

  String _text(String english, String arabic) => _isArabic ? arabic : english;

  String _localizedChecklistItem(String item) {
    if (!_isArabic) return item;
    return const {
          'Screen Touch & Multi-Touch Response':
              'استجابة الشاشة واللمس المتعدد',
          'Face ID / Touch ID Biometrics': 'بصمة الوجه أو الإصبع',
          'Front & Rear Cameras + Flash': 'الكاميرات الأمامية والخلفية والفلاش',
          'Charging Port & Power Draw': 'منفذ الشحن واستهلاك الطاقة',
          'Microphone, Earpiece & Speakers':
              'الميكروفون وسماعة الأذن ومكبرات الصوت',
          'Physical Buttons & Haptic Engine': 'الأزرار والاهتزاز',
          'Wi-Fi, Bluetooth & Cellular Signal':
              'الواي فاي والبلوتوث وشبكة الهاتف',
        }[item] ??
        item;
  }

  String get _orderReference => compactOrderReference(
        {'orderId': _job.orderId},
        documentId: _job.id,
      );

  @override
  void initState() {
    super.initState();
    _job = widget.job;
    _tabController = TabController(length: 3, vsync: this);
    _loadPreferredNavigationApp();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _updateJobStatus(String nextStatus) async {
    setState(() => _isUpdating = true);
    try {
      final docId = _job.id;
      final coll = _job.collectionName ?? 'orders';
      final isDone = nextStatus.toLowerCase() == 'completed' ||
          nextStatus.toLowerCase() == 'cancelled';
      final isAccepted = nextStatus.toLowerCase() == 'accepted';

      final updatePayload = <String, dynamic>{
        'status': nextStatus,
        'checklist': _checklist,
        'beforePhotos': _beforePhotos,
        'afterPhotos': _afterPhotos,
        'hasSignature': _signatureCaptured,
        'paymentMethod': _selectedPaymentMethod,
        'updatedAt': FieldValue.serverTimestamp(),
      };
      if (isAccepted) {
        updatePayload['acceptedAt'] = FieldValue.serverTimestamp();
      }
      if (isDone) {
        updatePayload['completedAt'] = FieldValue.serverTimestamp();
      }

      // 1. Update in the primary collection
      try {
        await FirebaseFirestore.instance.collection(coll).doc(docId).set(
              updatePayload,
              SetOptions(merge: true),
            );
      } catch (err) {
        debugPrint(
            'Primary collection update failed ($coll), trying fallback: $err');
        final otherColl = coll == 'orders' ? 'bookings' : 'orders';
        await FirebaseFirestore.instance.collection(otherColl).doc(docId).set(
              updatePayload,
              SetOptions(merge: true),
            );
      }

      // 2. Safely sync technician active status
      final uid = TechnicianService.instance.uid;
      if (uid != null) {
        try {
          await FirebaseFirestore.instance
              .collection('technicians')
              .doc(uid)
              .set({
            'currentJob': isDone ? null : docId,
            'currentOrder': isDone ? null : docId,
            'status': isDone ? 'AVAILABLE' : 'ON_JOB',
            'updatedAt': FieldValue.serverTimestamp(),
          }, SetOptions(merge: true));
        } catch (techErr) {
          debugPrint('Technician doc active status update notice: $techErr');
        }
      }

      setState(() {
        _job = _job.copyWith(status: nextStatus);
      });

      if (mounted) {
        HapticFeedback.mediumImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text(
              Localizations.localeOf(context).languageCode == 'ar'
                  ? 'تم تحديث الحالة إلى ${localizedJobStatusLabel(nextStatus, isArabic: true)}'
                  : 'Status updated to ${jobStatusLabel(nextStatus)}',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Failed to update status: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUpdating = false);
    }
  }

  Future<void> _pickPhoto(bool isBefore) async {
    final title = isBefore
        ? 'Before-Repair Inspection Photo'
        : 'After-Repair Quality Photo';
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFE0F2FE),
                  child:
                      Icon(Icons.camera_alt_rounded, color: Color(0xFF0284C7)),
                ),
                title: const Text('Take a Photo (Camera)',
                    style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: const Text('Capture clear photo with device camera',
                    style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFDCFCE7),
                  child: Icon(Icons.photo_library_rounded,
                      color: Color(0xFF16A34A)),
                ),
                title: const Text('Upload from Gallery / Files',
                    style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: const Text('Select an existing photo from library',
                    style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
            ],
          ),
        ),
      ),
    );

    if (source == null) return;

    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: source,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 85,
      );
      if (picked == null) return;

      final bytes = await picked.readAsBytes();
      if (bytes.isEmpty) return;

      String downloadUrl;
      try {
        downloadUrl = await StorageService.instance.uploadTechnicianFile(
          category: isBefore ? 'job_before' : 'job_after',
          fileName: picked.name.isNotEmpty
              ? picked.name
              : 'inspection_${DateTime.now().millisecondsSinceEpoch}.jpg',
          bytes: bytes,
        );
      } catch (storageErr) {
        debugPrint(
            'Firebase Storage upload notice, saving as data URI: $storageErr');
        downloadUrl = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      }

      setState(() {
        if (isBefore) {
          _beforePhotos.add(downloadUrl);
        } else {
          _afterPhotos.add(downloadUrl);
        }
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text(
                '${isBefore ? "Before-repair" : "After-repair"} photo added successfully!'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Photo upload failed: $e')),
        );
      }
    }
  }

  Future<void> _makePhoneCall(String? phone) async {
    if (phone == null || phone.isEmpty) return;
    final cleanPhone = phone.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri.parse('tel:$cleanPhone');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  // --- ONE-TAP WHATSAPP WITH TEMPLATES ---
  void _showWhatsAppTemplatesSheet(BuildContext context) {
    final customerName = _job.customerName ?? 'Customer';
    final customerPhone = _job.customerPhone ?? '+971502491034';
    final cleanPhone = customerPhone.replaceAll(RegExp(r'[^\d]'), '');
    final orderRef = _orderReference;
    final deviceModel = _job.deviceName?.trim().isNotEmpty == true
        ? _job.deviceName!
        : (_job.type.isNotEmpty ? _job.type : 'your device');

    final templates = [
      {
        'title': '🚗 On My Way (ETA 15 mins)',
        'subtitle': 'أنا في الطريق (الوصول خلال ١٥ دقيقة)',
        'text':
            'Hello $customerName, this is your KBI technician. I am on my way to your location for Order #$orderRef. Estimated arrival is 15 minutes. Please let me know if there are any building or gate access instructions!',
      },
      {
        'title': '🏢 Arrived at Building / Gate',
        'subtitle': 'وصلت عند المبنى / البوابة',
        'text':
            'Hello $customerName, I have arrived at your building entrance for Order #$orderRef ($deviceModel). Please let me know if you would like me to come up.',
      },
      {
        'title': '🛠️ Repair Completed & Tested',
        'subtitle': 'تم الانتهاء من التصليح والفحص بنجاح',
        'text':
            'Hello $customerName, the repair for your $deviceModel (Order #$orderRef) has been completed successfully and passed all diagnostic checks. Ready for handover and testing with you!',
      },
      {
        'title': '💬 Blank Direct Chat',
        'subtitle': 'فتح محادثة مباشرة',
        'text': '',
      },
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
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
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF25D366).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.chat_rounded,
                          color: Color(0xFF25D366), size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Quick WhatsApp Message',
                            style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: Color(0xFF0F172A)),
                          ),
                          Text(
                            'To: $customerName ($customerPhone)',
                            style: const TextStyle(
                                color: Color(0xFF64748B), fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 10),
                ...templates.map((tpl) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: InkWell(
                      onTap: () async {
                        Navigator.pop(ctx);
                        final text = tpl['text']!;
                        final uri = text.isNotEmpty
                            ? Uri.parse(
                                'https://wa.me/$cleanPhone?text=${Uri.encodeComponent(text)}')
                            : Uri.parse('https://wa.me/$cleanPhone');
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri,
                              mode: LaunchMode.externalApplication);
                        }
                      },
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    tpl['title']!,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13.5,
                                        color: Color(0xFF0F172A)),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    tpl['subtitle']!,
                                    style: const TextStyle(
                                        color: Color(0xFF64748B),
                                        fontSize: 11.5),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.arrow_forward_ios_rounded,
                                size: 14, color: Color(0xFF94A3B8)),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }

  // --- MULTI-GPS NAVIGATION LAUNCHER SHEET ---
  Future<void> _loadPreferredNavigationApp() async {
    final preferences = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _preferredNavigationApp =
          preferences.getString('preferred_navigation_app');
    });
  }

  String get _preferredNavigationLabel => switch (_preferredNavigationApp) {
        'google' => 'Google Maps',
        'apple' => 'Apple Maps',
        'waze' => 'Waze',
        _ => _text('Choose map app', 'اختر تطبيق الخرائط'),
      };

  Future<void> _startNavigation(
    double? lat,
    double? lng, {
    String? address,
  }) async {
    if (_preferredNavigationApp == null) {
      _showNavigationPicker(context, lat, lng, address: address);
      return;
    }
    await _launchNavigation(
      _preferredNavigationApp!,
      lat,
      lng,
      address: address,
    );
  }

  Future<void> _launchNavigation(
    String app,
    double? lat,
    double? lng, {
    String? address,
    bool remember = false,
  }) async {
    final hasCoords = lat != null && lng != null && (lat != 0 || lng != 0);
    final targetAddress = address?.trim().isNotEmpty == true
        ? address!.trim()
        : (_job.address?.trim().isNotEmpty == true
            ? _job.address!.trim()
            : 'Abu Dhabi, UAE');
    final encodedAddress = Uri.encodeComponent(targetAddress);
    Uri uri;

    switch (app) {
      case 'google':
        uri = hasCoords
            ? Uri.parse(
                'comgooglemaps://?daddr=$lat,$lng&directionsmode=driving')
            : Uri.parse(
                'https://www.google.com/maps/dir/?api=1&destination=$encodedAddress');
        if (!await canLaunchUrl(uri) && hasCoords) {
          uri = Uri.parse(
              'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng');
        }
      case 'waze':
        uri = hasCoords
            ? Uri.parse('waze://?ll=$lat,$lng&navigate=yes')
            : Uri.parse('https://waze.com/ul?q=$encodedAddress&navigate=yes');
        if (!await canLaunchUrl(uri) && hasCoords) {
          uri = Uri.parse('https://waze.com/ul?ll=$lat,$lng&navigate=yes');
        }
      default:
        uri = hasCoords
            ? Uri.parse('http://maps.apple.com/?daddr=$lat,$lng&dirflg=d')
            : Uri.parse(
                'http://maps.apple.com/?daddr=$encodedAddress&dirflg=d');
    }

    if (remember) {
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString('preferred_navigation_app', app);
      if (mounted) setState(() => _preferredNavigationApp = app);
    }

    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_text(
            'Could not open $_preferredNavigationLabel.',
            'تعذر فتح $_preferredNavigationLabel.',
          )),
        ),
      );
    }
  }

  void _showNavigationPicker(BuildContext context, double? lat, double? lng,
      {String? address}) {
    final targetAddress = address?.trim().isNotEmpty == true
        ? address!.trim()
        : (_job.address?.trim().isNotEmpty == true
            ? _job.address!.trim()
            : 'Abu Dhabi, UAE');

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
                Row(
                  children: [
                    const Icon(Icons.directions_rounded,
                        color: Color(0xFF0284C7), size: 22),
                    const SizedBox(width: 10),
                    Text(
                      _text(
                          'Turn-by-Turn GPS Navigation', 'الملاحة خطوة بخطوة'),
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: Color(0xFF0F172A)),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  targetAddress,
                  style:
                      const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 16),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 12),

                // 1. Google Maps
                _buildNavOptionTile(
                  icon: Icons.map_rounded,
                  color: const Color(0xFF4285F4),
                  title: _text('Google Maps (Driving Traffic)',
                      'خرائط Google (حركة المرور)'),
                  subtitle: _text('Live traffic & turn-by-turn routing',
                      'حركة مرور مباشرة وإرشادات خطوة بخطوة'),
                  onTap: () async {
                    Navigator.pop(ctx);
                    await _launchNavigation('google', lat, lng,
                        address: targetAddress, remember: true);
                  },
                ),

                // 2. Apple Maps
                _buildNavOptionTile(
                  icon: Icons.explore_rounded,
                  color: const Color(0xFF0F172A),
                  title: _text('Apple Maps (iOS Native)', 'خرائط Apple'),
                  subtitle: _text('Turn-by-turn guidance with Siri audio',
                      'إرشادات صوتية خطوة بخطوة'),
                  onTap: () async {
                    Navigator.pop(ctx);
                    await _launchNavigation('apple', lat, lng,
                        address: targetAddress, remember: true);
                  },
                ),

                // 3. Waze
                _buildNavOptionTile(
                  icon: Icons.navigation_rounded,
                  color: const Color(0xFF33CCFF),
                  title: _text('Waze Navigation', 'الملاحة عبر Waze'),
                  subtitle: _text('Community speed traps & live hazard alerts',
                      'تنبيهات مباشرة للطريق والمخاطر'),
                  onTap: () async {
                    Navigator.pop(ctx);
                    await _launchNavigation('waze', lat, lng,
                        address: targetAddress, remember: true);
                  },
                ),

                // 4. Copy Address
                _buildNavOptionTile(
                  icon: Icons.copy_rounded,
                  color: const Color(0xFF64748B),
                  title: _text('Copy Address to Clipboard', 'نسخ العنوان'),
                  subtitle: targetAddress,
                  onTap: () {
                    Navigator.pop(ctx);
                    _copyAddressToClipboard(targetAddress);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildNavOptionTile({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13.5,
                            color: Color(0xFF0F172A))),
                    Text(subtitle,
                        style: const TextStyle(
                            color: Color(0xFF64748B), fontSize: 11),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded,
                  size: 14, color: Color(0xFF94A3B8)),
            ],
          ),
        ),
      ),
    );
  }

  void _copyAddressToClipboard(String? address) {
    if (address == null || address.trim().isEmpty) return;
    Clipboard.setData(ClipboardData(text: address.trim()));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFF10B981),
          content: Text(_text(
            'Address copied to clipboard!',
            'تم نسخ العنوان.',
          )),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  // --- SEND WHATSAPP WARRANTY RECEIPT ---
  Future<void> _sendWhatsAppWarrantyReceipt() async {
    final customerName = _job.customerName ?? 'Customer';
    final customerPhone = _job.customerPhone ?? '+971502491034';
    final cleanPhone = customerPhone.replaceAll(RegExp(r'[^\d]'), '');
    final orderRef = _orderReference;
    final device = _job.deviceName?.trim().isNotEmpty == true
        ? _job.deviceName!
        : (_job.type.isNotEmpty ? _job.type : 'Smartphone / Laptop');
    final service = _job.serviceName ?? 'Screen & Component Repair';
    final amount = _job.totalAmount ?? 250.0;

    final receiptText = '''
🧾 *KBI SERVICES UAE - OFFICIAL SERVICE RECEIPT*
━━━━━━━━━━━━━━━━━━━━
📌 *Order Reference:* #$orderRef
👤 *Customer:* $customerName
📱 *Device:* $device
🔧 *Service Performed:* $service
💳 *Payment Status:* Paid ($selectedPaymentLabel)
💰 *Total Amount:* AED ${amount.toStringAsFixed(2)}
━━━━━━━━━━━━━━━━━━━━
🛡️ *6-MONTH KBI WARRANTY INCLUDED:*
• Replaced parts & service labor covered for 6 months.
• Instant on-site doorstep support across UAE.
• Need follow-up support? Reply directly to this chat!

Thank you for choosing KBI Services!
''';

    final uri = Uri.parse(
        'https://wa.me/$cleanPhone?text=${Uri.encodeComponent(receiptText)}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  // --- TECHNICIAN RATING QR CODE MODAL ---
  void _showRatingQrModal(BuildContext context) {
    const techName = 'Rashad';
    final orderRef = _orderReference;
    const ratingUrl = 'https://g.page/r/CWG_uPaqr-MjEAI/review';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.star_rounded,
                          color: Color(0xFFF59E0B), size: 24),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Customer Rating & Review',
                      style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                          color: Color(0xFF0F172A)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Ask the customer to scan with their camera to rate your service',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 12.5),
                ),
                const SizedBox(height: 20),

                // QR Code Container
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border:
                        Border.all(color: const Color(0xFFE2E8F0), width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.06),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: QrImageView(
                    data: ratingUrl,
                    version: QrVersions.auto,
                    size: 200.0,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Color(0xFF0F172A),
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Technician Profile badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.verified_user_rounded,
                          color: Color(0xFF10B981), size: 16),
                      const SizedBox(width: 6),
                      Text(
                        '$techName • Order #$orderRef',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: Color(0xFF1E293B)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Action buttons: Copy Link & Open in Browser
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Clipboard.setData(
                            const ClipboardData(text: ratingUrl),
                          );
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              backgroundColor: Color(0xFF10B981),
                              content: Text('Rating link copied to clipboard!'),
                            ),
                          );
                        },
                        icon: const Icon(Icons.copy_rounded, size: 16),
                        label: const Text('Copy Link',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 13)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          minimumSize: const Size.fromHeight(44),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () async {
                          Navigator.pop(ctx);
                          final uri = Uri.parse(ratingUrl);
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri,
                                mode: LaunchMode.externalApplication);
                          }
                        },
                        icon:
                            const Icon(Icons.open_in_browser_rounded, size: 16),
                        label: const Text('Open Review',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 13)),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          minimumSize: const Size.fromHeight(44),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String get selectedPaymentLabel {
    switch (_selectedPaymentMethod) {
      case 'POS Terminal':
        return 'Card / POS Terminal';
      case 'Paid Online':
        return 'Apple Pay / Online Link';
      default:
        return 'Cash on Delivery';
    }
  }

  void _showJobActions() {
    showCupertinoModalPopup<void>(
      context: context,
      builder: (sheetContext) => CupertinoActionSheet(
        title: Text(
          Localizations.localeOf(context).languageCode == 'ar'
              ? 'إجراءات الطلب $_orderReference'
              : 'Order $_orderReference actions',
        ),
        message: Text(
          localizedJobStatusLabel(
            _job.status,
            isArabic: Localizations.localeOf(context).languageCode == 'ar',
          ),
        ),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(sheetContext);
              _showNavigationPicker(
                context,
                _job.lat,
                _job.lng,
                address: _job.address,
              );
            },
            child: const Text('Choose navigation app'),
          ),
          if (_job.address?.trim().isNotEmpty == true)
            CupertinoActionSheetAction(
              onPressed: () {
                Navigator.pop(sheetContext);
                _copyAddressToClipboard(_job.address!);
              },
              child: const Text('Copy address'),
            ),
          if (_job.customerPhone?.trim().isNotEmpty == true)
            CupertinoActionSheetAction(
              onPressed: () {
                Navigator.pop(sheetContext);
                _makePhoneCall(_job.customerPhone!);
              },
              child: const Text('Call customer'),
            ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(sheetContext),
          child: const Text('Cancel'),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    final hasCoords = (_job.lat != null &&
        _job.lng != null &&
        (_job.lat != 0 || _job.lng != 0));
    const defaultAbuDhabi = ll.LatLng(24.4539, 54.3773);
    final point = hasCoords ? ll.LatLng(_job.lat!, _job.lng!) : defaultAbuDhabi;

    final nextAction = localizedJobNextActionTitle(
      _job.status,
      isArabic: isAr,
    );
    final nextStatusKey = jobNextStatusKey(_job.status);
    final currentStep = jobStatusStepIndex(_job.status);
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: kbiGroupedBackground,
        appBar: AppBar(
          elevation: 0,
          backgroundColor: Colors.transparent,
          foregroundColor: kbiLabel,
          title: Text(
            isAr ? 'الطلب $_orderReference' : 'Order $_orderReference',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 17),
          ),
          actions: [
            IconButton(
              tooltip: isAr ? 'إجراءات إضافية' : 'More actions',
              onPressed: _showJobActions,
              icon: const Icon(CupertinoIcons.ellipsis, size: 22),
            ),
            const SizedBox(width: 8),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(50),
            child: Container(
              height: 38,
              margin: const EdgeInsets.fromLTRB(16, 2, 16, 10),
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: const Color(0xFFE5E5EA).withValues(alpha: 0.72),
                borderRadius: BorderRadius.circular(11),
              ),
              child: TabBar(
                controller: _tabController,
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                indicator: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(9),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                labelColor: kbiLabel,
                unselectedLabelColor: kbiSecondaryLabel,
                labelStyle: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
                tabs: [
                  Tab(text: isAr ? 'نظرة عامة' : 'Overview'),
                  Tab(text: isAr ? 'الفحص' : 'Diagnostics'),
                  Tab(text: isAr ? 'الإنهاء' : 'Closeout'),
                ],
              ),
            ),
          ),
        ),
        bottomNavigationBar: nextAction != null && nextStatusKey != null
            ? _buildPrimaryActionBar(nextAction, nextStatusKey)
            : null,
        body: TabBarView(
          controller: _tabController,
          children: [
            // Tab 1: Overview & Interactive Map
            _buildOverviewTab(currentStep, point, hasCoords),

            // Tab 2: Multi-Point Quality Assurance & Photos
            _buildDiagnosticsTab(),

            // Tab 3: Billing, Payment & Customer Digital Sign-off
            _buildBillingAndSignTab(),
          ],
        ),
      ),
    );
  }

  // --- TAB 1: OVERVIEW ---
  Widget _buildOverviewTab(int currentStep, ll.LatLng point, bool hasCoords) {
    final addressText = _job.address?.trim().isNotEmpty == true
        ? _job.address!
        : _text('Address not provided', 'العنوان غير متوفر');

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Status Stepper
        _buildStatusStepper(currentStep),
        const SizedBox(height: 16),

        // Quick Customer Action Strip
        _buildCustomerContactCard(point),
        const SizedBox(height: 16),

        // Service & Fault Description Card with Prominent Assigned Price
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _job.deviceName?.trim().isNotEmpty == true
                              ? _job.deviceName!
                              : (_job.type.isNotEmpty
                                  ? _job.type
                                  : _text('Device Repair', 'صيانة جهاز')),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                            height: 1.25,
                          ),
                        ),
                        if (_job.serviceName != null &&
                            _job.serviceName!.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            localizedJobContentLabel(
                              _job.serviceName!,
                              isArabic: _isArabic,
                            ),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Prominent Assigned Order Price Badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0284C7).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color:
                              const Color(0xFF0284C7).withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          _text('ORDER PRICE', 'قيمة الطلب'),
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0284C7),
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 1),
                        Text(
                          'AED ${(_job.totalAmount ?? 0).toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0284C7),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (_job.description.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  _job.description,
                  style: const TextStyle(
                      color: Color(0xFF475569), fontSize: 13.5, height: 1.4),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Dedicated Customer Location & Navigation Card
        _buildCustomerLocationCard(point, addressText, hasCoords),
      ],
    );
  }

  // Dedicated Customer Location Card with Map and Navigation
  Widget _buildCustomerLocationCard(
      ll.LatLng point, String addressText, bool hasCoords) {
    final isAr = _isArabic;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.location_on_rounded,
                      color: Color(0xFF0284C7), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    isAr ? 'موقع العميل' : 'Customer Location',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF0284C7).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  hasCoords
                      ? (isAr ? '📍 موقع مثبت' : '📍 GPS PINNED')
                      : (isAr ? '📍 العنوان فقط' : '📍 ADDRESS ONLY'),
                  style: const TextStyle(
                    color: Color(0xFF0284C7),
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                const Icon(Icons.home_work_outlined,
                    size: 18, color: Color(0xFF64748B)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    addressText,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.copy_rounded,
                      size: 18, color: Color(0xFF64748B)),
                  onPressed: () => _copyAddressToClipboard(addressText),
                  tooltip: isAr ? 'نسخ العنوان' : 'Copy Address',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Embedded Interactive OpenStreetMap with Satellite Toggle
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Container(
              height: 230,
              width: double.infinity,
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFCBD5E1)),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Stack(
                children: [
                  if (hasCoords)
                    fmap.FlutterMap(
                      mapController: _mapController,
                      options: fmap.MapOptions(
                        initialCenter: point,
                        initialZoom: 15.5,
                        interactionOptions: const fmap.InteractionOptions(
                          flags: fmap.InteractiveFlag.all,
                        ),
                      ),
                      children: [
                        fmap.TileLayer(
                          urlTemplate: _isSatelliteMode
                              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                              : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                          subdomains: _isSatelliteMode
                              ? const []
                              : const ['a', 'b', 'c', 'd'],
                          userAgentPackageName: 'ae.kbi.kbiTechnicianApp',
                          maxZoom: 19,
                        ),
                        fmap.MarkerLayer(
                          markers: [
                            fmap.Marker(
                              point: point,
                              width: 140,
                              height: 82,
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0F172A)
                                          .withValues(alpha: 0.94),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                          color: const Color(0xFF38BDF8)
                                              .withValues(alpha: 0.6)),
                                      boxShadow: const [
                                        BoxShadow(
                                            color: Colors.black45,
                                            blurRadius: 8,
                                            offset: Offset(0, 3)),
                                      ],
                                    ),
                                    child: Text(
                                      _job.customerName?.split(' ').first ??
                                          (isAr ? 'العميل' : 'Customer'),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  const Icon(
                                    Icons.location_on_rounded,
                                    color: Color(0xFFFF453A),
                                    size: 40,
                                    shadows: [
                                      Shadow(
                                          color: Colors.black54, blurRadius: 8),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    )
                  else
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [Color(0xFF0F172A), Color(0xFF172554)],
                          ),
                        ),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(CupertinoIcons.location_slash,
                                  color: Color(0xFF38BDF8), size: 34),
                              const SizedBox(height: 10),
                              Text(
                                isAr
                                    ? 'لم يثبّت العميل موقعه على الخريطة'
                                    : 'Customer map pin is not available',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  // Satellite / Street Mode Toggle + Recenter in top right
                  if (hasCoords)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          InkWell(
                            onTap: () => setState(
                                () => _isSatelliteMode = !_isSatelliteMode),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F172A)
                                    .withValues(alpha: 0.85),
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: const [
                                  BoxShadow(
                                      color: Colors.black26,
                                      blurRadius: 4,
                                      offset: Offset(0, 2)),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    _isSatelliteMode
                                        ? Icons.map_rounded
                                        : Icons.satellite_alt_rounded,
                                    color: Colors.white,
                                    size: 14,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    _isSatelliteMode
                                        ? (isAr ? 'الخريطة' : 'Street')
                                        : (isAr
                                            ? 'القمر الصناعي'
                                            : 'Satellite'),
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          InkWell(
                            onTap: () => _mapController.move(point, 16.0),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F172A)
                                    .withValues(alpha: 0.85),
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: const [
                                  BoxShadow(
                                      color: Colors.black26,
                                      blurRadius: 4,
                                      offset: Offset(0, 2)),
                                ],
                              ),
                              child: const Icon(Icons.my_location_rounded,
                                  color: Colors.white, size: 16),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Turn-by-Turn GPS Navigation Launcher
          FilledButton.icon(
            onPressed: () =>
                _startNavigation(_job.lat, _job.lng, address: addressText),
            icon: const Icon(Icons.navigation_rounded, size: 18),
            label: Text(
              '${isAr ? 'بدء الملاحة' : 'Start navigation'} • $_preferredNavigationLabel',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
            style: FilledButton.styleFrom(
              backgroundColor: kbiBlue,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              minimumSize: const Size.fromHeight(46),
            ),
          ),
        ],
      ),
    );
  }

  // Quick Customer Contact Card
  Widget _buildCustomerContactCard(ll.LatLng point) {
    final customerName = _job.customerName ?? _text('Customer', 'العميل');
    final customerPhone =
        _job.customerPhone ?? _text('Phone not provided', 'الرقم غير متوفر');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: const Color(0xFFF1F5F9),
                child: Text(
                  customerName.isNotEmpty
                      ? customerName.substring(0, 1).toUpperCase()
                      : 'C',
                  style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontWeight: FontWeight.bold,
                      fontSize: 16),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      customerName,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      customerPhone,
                      style: const TextStyle(
                          color: Color(0xFF64748B), fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 12),
          // 3 Action Buttons Row: Call, WhatsApp Templates, GPS Directions
          Row(
            children: [
              Expanded(
                child: _buildContactActionButton(
                  icon: Icons.phone_rounded,
                  label: _text('Call', 'اتصال'),
                  color: const Color(0xFF10B981),
                  onTap: () => _makePhoneCall(customerPhone),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildContactActionButton(
                  icon: Icons.chat_rounded,
                  label: _text('WhatsApp', 'واتساب'),
                  color: const Color(0xFF25D366),
                  onTap: () => _showWhatsAppTemplatesSheet(context),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildContactActionButton(
                  icon: Icons.directions_rounded,
                  label: _text('Navigate', 'الملاحة'),
                  color: kbiBlue,
                  onTap: () => _startNavigation(_job.lat, _job.lng,
                      address: _job.address),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContactActionButton(
      {required IconData icon,
      required String label,
      required Color color,
      required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                  color: color, fontWeight: FontWeight.w700, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  // --- TAB 2: DIAGNOSTICS & MULTI-POINT QA ---
  Widget _buildDiagnosticsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Multi-Point Inspection Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.checklist_rtl_rounded,
                      color: Color(0xFF0284C7), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    _text('Multi-Point Quality Assurance',
                        'فحص الجودة متعدد النقاط'),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: Color(0xFF0F172A)),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                _text(
                  'Verify device components before opening and after reassembly.',
                  'تحقق من مكونات الجهاز قبل الفتح وبعد إعادة التجميع.',
                ),
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
              ),
              const SizedBox(height: 14),
              const Divider(height: 1, color: Color(0xFFF1F5F9)),
              const SizedBox(height: 10),
              ..._checklist.keys.map((key) {
                final status = _checklist[key] ?? 'PASS';
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          _localizedChecklistItem(key),
                          style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1E293B)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // 3-way toggle chips: PASS, FAIL, NA
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _buildQaChip(key, 'PASS', _text('Pass', 'سليم'),
                              const Color(0xFF10B981), status == 'PASS'),
                          const SizedBox(width: 4),
                          _buildQaChip(key, 'FAIL', _text('Fail', 'عطل'),
                              const Color(0xFFEF4444), status == 'FAIL'),
                          const SizedBox(width: 4),
                          _buildQaChip(key, 'NA', _text('N/A', 'لا ينطبق'),
                              const Color(0xFF94A3B8), status == 'NA'),
                        ],
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Used Replacement Parts Card
        _buildUsedPartsSection(),
        const SizedBox(height: 16),

        // Before Repair Photos Card
        _buildPhotoSection(
          title: _text('📷 Before-Repair Photos (Inspection)',
              '📷 صور ما قبل الصيانة (الفحص)'),
          photos: _beforePhotos,
          onAdd: () => _pickPhoto(true),
          onDelete: (index) => setState(() => _beforePhotos.removeAt(index)),
        ),
        const SizedBox(height: 16),

        // After Repair Photos Card
        _buildPhotoSection(
          title: _text('✨ After-Repair Photos (Quality Proof)',
              '✨ صور ما بعد الصيانة (إثبات الجودة)'),
          photos: _afterPhotos,
          onAdd: () => _pickPhoto(false),
          onDelete: (index) => setState(() => _afterPhotos.removeAt(index)),
        ),
      ],
    );
  }

  Widget _buildUsedPartsSection() {
    final docId = _job.id;
    final coll = _job.collectionName ?? 'orders';

    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream:
          FirebaseFirestore.instance.collection(coll).doc(docId).snapshots(),
      builder: (context, snapshot) {
        final data = snapshot.data?.data();
        final usedParts = (data?['usedParts'] as List<dynamic>?) ?? [];

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(CupertinoIcons.cube_box_fill,
                          color: kbiOrange, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        _text('Replacement Parts Used', 'قطع الغيار المستخدمة'),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  TextButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        CupertinoPageRoute<void>(
                          builder: (_) => PartsInventoryScreen(
                            locale: Localizations.localeOf(context),
                            activeJob: _job,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.add_circle_outline_rounded,
                        size: 16, color: kbiBlue),
                    label: Text(
                      _text('Use Part', 'استخدام قطعة'),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: kbiBlue,
                      ),
                    ),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      visualDensity: VisualDensity.compact,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                _text(
                  'Select spare parts from inventory to deduct stock and attach to this order.',
                  'اختر قطع الغيار من المخزون لإضافتها إلى الطلب وخصم الكمية.',
                ),
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
              ),
              const SizedBox(height: 12),
              if (usedParts.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      const Icon(CupertinoIcons.cube_box,
                          color: Color(0xFF94A3B8), size: 28),
                      const SizedBox(height: 6),
                      Text(
                        _text('No parts allocated yet', 'لم تُضف قطع غيار بعد'),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _text(
                          'Tap "Use Part" above to choose from live inventory',
                          'اضغط «استخدام قطعة» للاختيار من المخزون',
                        ),
                        style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ),
                )
              else
                Column(
                  children: usedParts.map<Widget>((p) {
                    final partMap = p is Map<String, dynamic>
                        ? p
                        : Map<String, dynamic>.from(p as Map);
                    final name =
                        partMap['name'] ?? _text('Spare Part', 'قطعة غيار');
                    final sku = partMap['sku'] ?? '';
                    final price = (partMap['price'] as num?)?.toDouble() ?? 0.0;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: kbiOrange.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                                CupertinoIcons.checkmark_seal_fill,
                                color: kbiOrange,
                                size: 16),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  name,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                                if (sku.isNotEmpty)
                                  Text(
                                    'SKU: $sku',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: Color(0xFF64748B),
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          if (price > 0)
                            Text(
                              'AED ${price.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQaChip(
      String key, String value, String label, Color color, bool isSelected) {
    return InkWell(
      onTap: () {
        setState(() => _checklist[key] = value);
      },
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? color : color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
              color: isSelected ? color : color.withValues(alpha: 0.2)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : color,
            fontSize: 11,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }

  ImageProvider _getImageProvider(String urlOrData) {
    final clean = urlOrData.trim();
    if (clean.startsWith('data:image')) {
      try {
        final commaIndex = clean.indexOf(',');
        if (commaIndex != -1) {
          final bytes = base64Decode(clean.substring(commaIndex + 1));
          return MemoryImage(bytes);
        }
      } catch (_) {}
    }
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return NetworkImage(clean);
    }
    return const AssetImage('assets/images/kbi_icon.png');
  }

  void _showFullPhoto(String urlOrData, String title) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Container(
                color: Colors.black,
                child: Image(
                  image: _getImageProvider(urlOrData),
                  fit: BoxFit.contain,
                ),
              ),
            ),
            IconButton(
              onPressed: () => Navigator.pop(ctx),
              icon: const CircleAvatar(
                backgroundColor: Colors.black54,
                child: Icon(Icons.close_rounded, color: Colors.white, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhotoSection({
    required String title,
    required List<String> photos,
    required VoidCallback onAdd,
    required void Function(int index) onDelete,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFF0F172A))),
              IconButton(
                onPressed: onAdd,
                tooltip: _text('Add Photo (Camera / Gallery)',
                    'إضافة صورة (الكاميرا أو المعرض)'),
                icon: const Icon(Icons.add_a_photo_outlined,
                    color: Color(0xFF0284C7), size: 20),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (photos.isEmpty)
            InkWell(
              onTap: onAdd,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 22),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: const Color(0xFFCBD5E1), style: BorderStyle.solid),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.add_photo_alternate_rounded,
                        color: Color(0xFF0284C7), size: 32),
                    const SizedBox(height: 8),
                    Text(
                      _text(
                          'Take Photo or Upload Image', 'التقط صورة أو ارفعها'),
                      style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0284C7)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _text('Tap to choose Camera or Photo Gallery',
                          'اضغط لاختيار الكاميرا أو معرض الصور'),
                      style: const TextStyle(
                          fontSize: 11, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
            )
          else
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                ...List.generate(photos.length, (index) {
                  final photo = photos[index];
                  return Stack(
                    clipBehavior: Clip.none,
                    children: [
                      GestureDetector(
                        onTap: () => _showFullPhoto(photo, title),
                        child: Container(
                          width: 84,
                          height: 84,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFCBD5E1)),
                            image: DecorationImage(
                              image: _getImageProvider(photo),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        top: -6,
                        right: -6,
                        child: GestureDetector(
                          onTap: () => onDelete(index),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.redAccent,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                    color: Colors.black26,
                                    blurRadius: 4,
                                    offset: Offset(0, 1)),
                              ],
                            ),
                            child: const Icon(Icons.close_rounded,
                                color: Colors.white, size: 12),
                          ),
                        ),
                      ),
                    ],
                  );
                }),
                InkWell(
                  onTap: onAdd,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: const Color(0xFF0284C7), width: 1.2),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.add_a_photo_rounded,
                            color: Color(0xFF0284C7), size: 22),
                        const SizedBox(height: 4),
                        Text(
                          _text('Add More', 'إضافة المزيد'),
                          style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0284C7)),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  // --- TAB 3: BILLING, PAYMENT & DIGITAL SIGN-OFF ---
  Widget _buildBillingAndSignTab() {
    final amount = _job.totalAmount ?? 250.0;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Invoice Breakdown Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.receipt_long_rounded,
                          color: Color(0xFF00C7BE), size: 20),
                      const SizedBox(width: 8),
                      Text(_text('Work Order Invoice', 'فاتورة أمر العمل'),
                          style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: Color(0xFF0F172A))),
                    ],
                  ),
                  TextButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        CupertinoPageRoute<void>(
                          builder: (_) => InvoiceFormScreen(
                            job: _job,
                            locale: Localizations.localeOf(context),
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.description_outlined,
                        size: 16, color: Color(0xFF00C7BE)),
                    label: Text(
                      _text('Official Form', 'النموذج الرسمي'),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF00C7BE),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _buildInvoiceRow(
                  _text('Diagnostic & Service Labor', 'الفحص وأجرة الصيانة'),
                  'AED ${(amount * 0.4).toStringAsFixed(2)}'),
              const SizedBox(height: 8),
              _buildInvoiceRow(
                  _text('OEM Replacement Parts', 'قطع الغيار الأصلية'),
                  'AED ${(amount * 0.6).toStringAsFixed(2)}'),
              const Divider(height: 20, color: Color(0xFFF1F5F9)),
              _buildInvoiceRow(
                  _text('Total Amount Due', 'إجمالي المبلغ المستحق'),
                  'AED ${amount.toStringAsFixed(2)}',
                  isBold: true),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Payment Method Selector
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_text('Payment Settlement Method', 'طريقة تحصيل المبلغ'),
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFF0F172A))),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildPaymentChip('Cash Received', Icons.payments_outlined,
                      _text('Cash on Hand', 'نقدًا')),
                  _buildPaymentChip('POS Terminal', Icons.credit_card_outlined,
                      _text('Card / POS Machine', 'بطاقة / جهاز الدفع')),
                  _buildPaymentChip('Paid Online', Icons.phone_iphone_rounded,
                      _text('Apple Pay / Online', 'دفع إلكتروني')),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Digital Customer Signature Pad
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.draw_outlined,
                            color: Color(0xFF0284C7), size: 18),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            _text('Digital Sign-Off', 'التوقيع الرقمي'),
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13.5,
                                color: Color(0xFF0F172A)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextButton.icon(
                        onPressed: () => _openFullscreenSignaturePad(),
                        icon: const Icon(Icons.fullscreen_rounded, size: 16),
                        label: Text(_text('Expand', 'تكبير'),
                            style: const TextStyle(fontSize: 11)),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          minimumSize: const Size(0, 32),
                        ),
                      ),
                      if (_signaturePoints.isNotEmpty)
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _signaturePoints.clear();
                              _signatureCaptured = false;
                            });
                          },
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            minimumSize: const Size(0, 32),
                          ),
                          child: Text(_text('Clear', 'مسح'),
                              style: const TextStyle(
                                  color: Colors.redAccent, fontSize: 11)),
                        ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  height: 160,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _signatureCaptured
                          ? const Color(0xFF10B981)
                          : const Color(0xFFCBD5E1),
                      width: _signatureCaptured ? 1.5 : 1.0,
                    ),
                  ),
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: Listener(
                          behavior: HitTestBehavior.opaque,
                          onPointerDown: (event) {
                            setState(() {
                              _signaturePoints.add(event.localPosition);
                              _signatureCaptured = true;
                            });
                          },
                          onPointerMove: (event) {
                            setState(() {
                              _signaturePoints.add(event.localPosition);
                              _signatureCaptured = true;
                            });
                          },
                          onPointerUp: (event) {
                            setState(() => _signaturePoints.add(null));
                          },
                          child: CustomPaint(
                            painter: _SignaturePainter(_signaturePoints),
                            size: Size.infinite,
                          ),
                        ),
                      ),
                      if (_signaturePoints.isEmpty)
                        Center(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.edit_outlined,
                                  color: Color(0xFF94A3B8), size: 18),
                              const SizedBox(width: 6),
                              Text(
                                _text('Sign with finger above',
                                    'وقّع بإصبعك في المساحة أعلاه'),
                                style: const TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _signatureCaptured
                    ? _text(
                        '✓ Customer Signature Recorded (6-Month Warranty Activated)',
                        '✓ تم تسجيل توقيع العميل وتفعيل ضمان ٦ أشهر')
                    : _text('Please ask customer to sign with finger above',
                        'يرجى مطالبة العميل بالتوقيع أعلاه'),
                style: TextStyle(
                  color: _signatureCaptured
                      ? const Color(0xFF10B981)
                      : const Color(0xFF94A3B8),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Customer QR Code Rating Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.qr_code_2_rounded,
                      color: Color(0xFFF59E0B), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    _text('Customer 5-Star Rating QR Code',
                        'رمز تقييم العميل بخمس نجوم'),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Color(0xFF0F172A)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                _text(
                  'Show your personal QR code on-site so customer can rate your service and tip.',
                  'اعرض رمزك للعميل ليقيّم الخدمة بعد إنجازها.',
                ),
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () => _showRatingQrModal(context),
                icon: const Icon(Icons.qr_code_scanner_rounded, size: 18),
                label: Text(
                  _text('Display Rating QR Code', 'عرض رمز التقييم'),
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 13),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFF59E0B),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  minimumSize: const Size.fromHeight(44),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Send WhatsApp Digital Warranty Receipt Button
        OutlinedButton.icon(
          onPressed: _sendWhatsAppWarrantyReceipt,
          icon: const Icon(Icons.share_rounded,
              color: Color(0xFF25D366), size: 18),
          label: Text(
            _text('Send Official WhatsApp Warranty Receipt',
                'إرسال إيصال الضمان عبر واتساب'),
            style: const TextStyle(
                color: Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
                fontSize: 13),
          ),
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: Color(0xFF25D366)),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            minimumSize: const Size.fromHeight(46),
            backgroundColor: const Color(0xFF25D366).withValues(alpha: 0.05),
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentChip(String id, IconData icon, String label) {
    final isSelected = _selectedPaymentMethod == id;
    return InkWell(
      onTap: () => setState(() => _selectedPaymentMethod = id),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF0284C7).withValues(alpha: 0.1)
              : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color:
                isSelected ? const Color(0xFF0284C7) : const Color(0xFFE2E8F0),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 15,
                color: isSelected
                    ? const Color(0xFF0284C7)
                    : const Color(0xFF64748B)),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isSelected
                    ? const Color(0xFF0284C7)
                    : const Color(0xFF334155),
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInvoiceRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: TextStyle(
                color:
                    isBold ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                fontSize: isBold ? 14 : 13,
                fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
        Text(value,
            style: TextStyle(
                color:
                    isBold ? const Color(0xFF10B981) : const Color(0xFF0F172A),
                fontSize: isBold ? 16 : 13,
                fontWeight: isBold ? FontWeight.w800 : FontWeight.w600)),
      ],
    );
  }

  Future<void> _confirmPrimaryAction(String actionTitle, String nextKey) async {
    if (normalizeJobStatus(nextKey) == 'completed') {
      final failedChecks =
          _checklist.values.where((value) => value == 'FAIL').length;
      final confirmed = await showCupertinoDialog<bool>(
        context: context,
        builder: (dialogContext) => CupertinoAlertDialog(
          title: Text(_text('Complete this job?', 'إنهاء هذا الطلب؟')),
          content: Text(
            failedChecks > 0
                ? _text(
                    '$failedChecks diagnostic checks are marked FAIL. The closeout record will be saved.',
                    'تم تحديد $failedChecks من عناصر الفحص كعطل. سيتم حفظ سجل الإنهاء.')
                : _text(
                    'Diagnostics, photos, payment selection, and signature status will be saved to the order.',
                    'سيتم حفظ الفحص والصور وطريقة الدفع والتوقيع في الطلب.'),
          ),
          actions: [
            CupertinoDialogAction(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: Text(_text('Review', 'مراجعة')),
            ),
            CupertinoDialogAction(
              isDefaultAction: true,
              onPressed: () => Navigator.pop(dialogContext, true),
              child: Text(_text('Complete', 'إنهاء')),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }
    await _updateJobStatus(nextKey);
  }

  Widget _buildPrimaryActionBar(String actionTitle, String nextKey) {
    return SafeArea(
      minimum: const EdgeInsets.fromLTRB(12, 0, 12, 10),
      child: LiquidGlassSurface(
        borderRadius: BorderRadius.circular(22),
        padding: const EdgeInsets.all(10),
        child: Semantics(
          button: true,
          label: actionTitle,
          child: SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _isUpdating
                  ? null
                  : () => _confirmPrimaryAction(actionTitle, nextKey),
              icon: _isUpdating
                  ? const SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Icon(CupertinoIcons.arrow_right_circle_fill,
                      size: 19),
              label: Text(
                _isUpdating ? _text('Saving', 'جارٍ الحفظ') : actionTitle,
              ),
            ),
          ),
        ),
      ),
    );
  }

  // --- PROGRESS STEPPER ---
  Widget _buildStatusStepper(int currentStep) {
    final steps = _isArabic
        ? const ['مقبول', 'في الطريق', 'تم الوصول', 'جارٍ العمل']
        : const ['Accepted', 'En Route', 'Arrived', 'Working'];
    final flowStep = currentStep - 1;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(steps.length, (index) {
              final isPassed = index < flowStep;
              final isCurrent = index == flowStep;
              final isReached = isPassed || isCurrent;
              return Expanded(
                child: Column(
                  children: [
                    Row(
                      children: [
                        if (index > 0)
                          Expanded(
                            child: Container(
                              height: 3,
                              color: index <= flowStep
                                  ? kbiGreen
                                  : const Color(0xFFD1D1D6),
                            ),
                          ),
                        Container(
                          width: isCurrent ? 22 : 20,
                          height: isCurrent ? 22 : 20,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isPassed ? kbiGreen : Colors.white,
                            border: Border.all(
                              color: isReached
                                  ? kbiGreen
                                  : const Color(0xFFC7C7CC),
                              width: isCurrent ? 3 : 2,
                            ),
                          ),
                          child: isPassed && !isCurrent
                              ? const Icon(Icons.check,
                                  size: 10, color: Colors.white)
                              : null,
                        ),
                        if (index < steps.length - 1)
                          Expanded(
                            child: Container(
                              height: 3,
                              color: index < flowStep
                                  ? kbiGreen
                                  : const Color(0xFFD1D1D6),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      steps[index],
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight:
                            isCurrent ? FontWeight.bold : FontWeight.normal,
                        color: isCurrent
                            ? kbiLabel
                            : (isPassed ? kbiGreen : kbiSecondaryLabel),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  void _openFullscreenSignaturePad() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (dialogCtx, setDialogState) {
            return Dialog(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20)),
              insetPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.draw_rounded, color: Color(0xFF0284C7)),
                            SizedBox(width: 8),
                            Text(
                              'Customer Sign-Off Pad',
                              style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF0F172A)),
                            ),
                          ],
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(dialogCtx),
                          icon: const Icon(Icons.close_rounded),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Please ask the customer to sign on the canvas below using their finger.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 14),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        height: 280,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFCBD5E1)),
                        ),
                        child: Stack(
                          children: [
                            Positioned.fill(
                              child: Listener(
                                behavior: HitTestBehavior.opaque,
                                onPointerDown: (event) {
                                  setDialogState(() {
                                    _signaturePoints.add(event.localPosition);
                                    _signatureCaptured = true;
                                  });
                                  setState(() {});
                                },
                                onPointerMove: (event) {
                                  setDialogState(() {
                                    _signaturePoints.add(event.localPosition);
                                    _signatureCaptured = true;
                                  });
                                  setState(() {});
                                },
                                onPointerUp: (event) {
                                  setDialogState(
                                      () => _signaturePoints.add(null));
                                  setState(() {});
                                },
                                child: CustomPaint(
                                  painter: _SignaturePainter(_signaturePoints),
                                  size: Size.infinite,
                                ),
                              ),
                            ),
                            if (_signaturePoints.isEmpty)
                              const Center(
                                child: Text(
                                  '✍️ Draw signature here with finger',
                                  style: TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              setDialogState(() {
                                _signaturePoints.clear();
                                _signatureCaptured = false;
                              });
                              setState(() {});
                            },
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.redAccent,
                              side: const BorderSide(color: Color(0xFFFCA5A5)),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: const Text('Clear Pad'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: FilledButton(
                            onPressed: () {
                              Navigator.pop(dialogCtx);
                            },
                            style: FilledButton.styleFrom(
                              backgroundColor: const Color(0xFF0F172A),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: const Text('Save & Apply Signature'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

// Custom Painter for Customer Signature
class _SignaturePainter extends CustomPainter {
  final List<Offset?> points;

  _SignaturePainter(this.points);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0F172A)
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 3.2;

    for (int i = 0; i < points.length; i++) {
      if (points[i] != null) {
        if (i < points.length - 1 && points[i + 1] != null) {
          canvas.drawLine(points[i]!, points[i + 1]!, paint);
        } else if (i == points.length - 1 || points[i + 1] == null) {
          canvas.drawCircle(points[i]!, 1.6, paint);
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SignaturePainter oldDelegate) => true;
}
