import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../config/app_config.dart';

class SubscriptionRequiredScreen extends StatefulWidget {
  final Locale locale;
  final void Function(Locale) onLocaleChanged;

  const SubscriptionRequiredScreen(
      {super.key, required this.onLocaleChanged, required this.locale});

  @override
  State<SubscriptionRequiredScreen> createState() =>
      _SubscriptionRequiredScreenState();
}

class _SubscriptionRequiredScreenState
    extends State<SubscriptionRequiredScreen> {
  bool _checking = false;
  bool _requesting = false;

  Future<void> _requestActivation() async {
    setState(() => _requesting = true);
    try {
      try {
        await FirebaseFunctions.instance
            .httpsCallable('technicianRequestActivation')
            .call({'channel': 'app'});
      } on FirebaseFunctionsException catch (error) {
        if (!{'not-found', 'unavailable', 'internal'}.contains(error.code)) {
          rethrow;
        }
        final uid = FirebaseAuth.instance.currentUser?.uid;
        if (uid == null) throw StateError('Your session expired.');
        await FirebaseFirestore.instance
            .collection('activation_requests')
            .doc(uid)
            .set({
          'userId': uid,
          'status': 'pending',
          'channel': 'app',
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Activation request sent to operations.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to send request: $error')),
        );
      }
    } finally {
      if (mounted) setState(() => _requesting = false);
    }
  }

  Future<void> _checkStatus() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;

    setState(() {
      _checking = true;
    });

    try {
      final doc = await FirebaseFirestore.instance
          .collection('technicians')
          .doc(uid)
          .get();
      final data = doc.data();
      final isApproved = data?['isApproved'] == true;
      final isActive = data?['isActive'] == true;
      final subscriptionStatus =
          (data?['subscriptionStatus'] ?? 'inactive').toString();

      if (mounted) {
        if (isApproved && isActive && subscriptionStatus == 'active') {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Subscription activated! Loading app...'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                  'Subscription is still inactive. Please contact the administrator.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error checking status: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _checking = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xF2FFFFFF),
        appBar: AppBar(
          backgroundColor: const Color(0xF2FFFFFF),
          elevation: 0,
          title: Text(
            isAr ? 'الاشتراك مطلوب' : 'Subscription Required',
            style: const TextStyle(
                fontWeight: FontWeight.bold, color: Colors.black, fontSize: 18),
          ),
          actions: [
            Container(
              margin: const EdgeInsets.symmetric(vertical: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: const BoxDecoration(
                color: Color(0xFF1E2633),
                borderRadius: BorderRadius.all(Radius.circular(24)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: widget.locale.languageCode,
                  dropdownColor: const Color(0xF2FFFFFF),
                  icon: const Icon(Icons.keyboard_arrow_down,
                      color: Colors.cyanAccent, size: 18),
                  items: const [
                    DropdownMenuItem(
                        value: 'en',
                        child: Text('EN',
                            style:
                                TextStyle(color: Colors.black, fontSize: 13))),
                    DropdownMenuItem(
                        value: 'ar',
                        child: Text('AR',
                            style:
                                TextStyle(color: Colors.black, fontSize: 13))),
                  ],
                  onChanged: (v) {
                    if (v == null) return;
                    widget.onLocaleChanged(Locale(v));
                  },
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: () => FirebaseAuth.instance.signOut(),
              icon: const Icon(Icons.logout, color: Colors.redAccent),
              tooltip: isAr ? 'تسجيل الخروج' : 'Log out',
            ),
            const SizedBox(width: 12),
          ],
        ),
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF111318),
                  borderRadius: const BorderRadius.all(Radius.circular(24)),
                  border: Border.all(color: const Color(0xFF1E2633)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.orangeAccent.withValues(alpha: 0.08),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.warning_amber_rounded,
                        color: Colors.orangeAccent,
                        size: 48,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      isAr
                          ? 'حسابك غير نشط حالياً'
                          : 'Your Account is Inactive',
                      style: const TextStyle(
                          color: Colors.black,
                          fontSize: 18,
                          fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      isAr
                          ? 'اشتراكك غير فعال حالياً في النظام. يرجى التواصل مع الإدارة لتفعيل اشتراكك وحسابك لتتمكن من تلقي عروض العمل.'
                          : 'Your subscription is currently inactive. Please contact the administration to activate your account and start receiving jobs.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          color: Colors.black54, fontSize: 13, height: 1.5),
                    ),
                    const SizedBox(height: 24),
                    _checking
                        ? const CircularProgressIndicator(
                            color: Colors.cyanAccent)
                        : Column(
                            children: [
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.cyanAccent,
                                  foregroundColor: Colors.white,
                                  minimumSize: const Size.fromHeight(48),
                                  shape: const RoundedRectangleBorder(
                                      borderRadius: BorderRadius.all(
                                          Radius.circular(24))),
                                  elevation: 0,
                                ),
                                onPressed: _checkStatus,
                                icon: const Icon(Icons.refresh),
                                label: Text(
                                  isAr
                                      ? 'تحقق من الحالة / إعادة المحاولة'
                                      : 'Check Status / Retry',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold),
                                ),
                              ),
                              const SizedBox(height: 12),
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  minimumSize: const Size.fromHeight(48),
                                  shape: const RoundedRectangleBorder(
                                      borderRadius: BorderRadius.all(
                                          Radius.circular(24))),
                                ),
                                onPressed:
                                    _requesting ? null : _requestActivation,
                                icon: _requesting
                                    ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2))
                                    : const Icon(Icons.outgoing_mail),
                                label: Text(isAr
                                    ? 'إرسال طلب تفعيل'
                                    : 'Request Activation'),
                              ),
                              const SizedBox(height: 12),
                              OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.white,
                                  side: const BorderSide(
                                      color: Color(0xFF1E2633)),
                                  minimumSize: const Size.fromHeight(48),
                                  shape: const RoundedRectangleBorder(
                                      borderRadius: BorderRadius.all(
                                          Radius.circular(24))),
                                ),
                                onPressed: () {
                                  showDialog(
                                    context: context,
                                    builder: (context) => AlertDialog(
                                      backgroundColor: const Color(0xF2FFFFFF),
                                      shape: const RoundedRectangleBorder(
                                        borderRadius: BorderRadius.all(
                                            Radius.circular(24)),
                                        side: BorderSide(
                                            color: Color(0xFF1E2633)),
                                      ),
                                      title: Text(
                                          isAr
                                              ? 'تفاصيل الدعم'
                                              : 'Support Details',
                                          style: const TextStyle(
                                              color: Colors.black)),
                                      content: Text(
                                        isAr
                                            ? 'لطلب التفعيل، أرسل طلباً من التطبيق أو تواصل مع فريق العمليات عبر ${AppConfig.operationsEmail}.'
                                            : 'Request activation in the app or contact KBI Operations at ${AppConfig.operationsEmail}.',
                                        style: const TextStyle(
                                            color: Colors.black87,
                                            fontSize: 13,
                                            height: 1.5),
                                      ),
                                      actions: [
                                        TextButton(
                                          onPressed: () =>
                                              Navigator.pop(context),
                                          child: const Text('OK',
                                              style: TextStyle(
                                                  color: Colors.cyanAccent)),
                                        )
                                      ],
                                    ),
                                  );
                                },
                                icon: const Icon(Icons.info_outline),
                                label: Text(
                                    isAr ? 'عرض التفاصيل' : 'View Details'),
                              ),
                            ],
                          ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
