import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class RequestReceivedScreen extends StatelessWidget {
  final Locale locale;
  final void Function(Locale)? onLocaleChanged;

  const RequestReceivedScreen({
    super.key,
    required this.locale,
    this.onLocaleChanged,
  });

  bool get _isArabic => locale.languageCode == 'ar';

  String _t(String en, String ar) => _isArabic ? ar : en;

  Future<void> _handleBackToWelcome(BuildContext context) async {
    try {
      await FirebaseAuth.instance.signOut();
    } catch (_) {}

    if (context.mounted) {
      Navigator.of(context).popUntil((route) => route.isFirst);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgGradient = isDark
        ? const [Color(0xFF0B0F19), Color(0xFF111827)]
        : const [Color(0xFFF8FAFC), Color(0xFFF1F5F9)];
    final cardBg = isDark ? const Color(0xFF161E2E) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF1F293D) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Directionality(
      textDirection: _isArabic ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        body: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: bgGradient,
            ),
          ),
          child: SafeArea(
            child: Column(
              children: [
                // Top Minimal Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      RichText(
                        text: TextSpan(
                          style: TextStyle(
                            color: textPrimary,
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.8,
                          ),
                          children: const [
                            TextSpan(text: 'KBI'),
                            TextSpan(
                              text: '.',
                              style: TextStyle(color: Color(0xFF18CBCB)),
                            ),
                          ],
                        ),
                      ),
                      if (onLocaleChanged != null)
                        TextButton(
                          onPressed: () {
                            final newLang = _isArabic ? 'en' : 'ar';
                            onLocaleChanged!(Locale(newLang));
                          },
                          style: TextButton.styleFrom(
                            backgroundColor: cardBg,
                            foregroundColor: textPrimary,
                            side: BorderSide(color: cardBorder),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 8,
                            ),
                          ),
                          child: Text(
                            _isArabic ? 'EN' : 'عربي',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),

                // Main Card Container
                Expanded(
                  child: Center(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 460),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 32),
                          decoration: BoxDecoration(
                            color: cardBg,
                            borderRadius: BorderRadius.circular(28),
                            border: Border.all(color: cardBorder, width: 1.2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
                                blurRadius: 24,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Hero Check Badge with Turquoise Glow
                              Container(
                                width: 84,
                                height: 84,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF18CBCB).withValues(alpha: 0.12),
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Container(
                                    width: 62,
                                    height: 62,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF18CBCB),
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: Color(0x3318CBCB),
                                          blurRadius: 16,
                                          offset: Offset(0, 6),
                                        ),
                                      ],
                                    ),
                                    child: const Icon(
                                      Icons.check_rounded,
                                      color: Colors.white,
                                      size: 38,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Title: Request Received
                              Text(
                                _t('Request Received', 'تم استلام الطلب'),
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900,
                                  color: textPrimary,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              const SizedBox(height: 12),

                              // Body Description
                              Text(
                                _t(
                                  'Your request has been received successfully.',
                                  'تم استلام طلبك بنجاح.',
                                ),
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: textPrimary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _t(
                                  'Our team will review your request and contact you shortly to confirm the details.',
                                  'سيقوم فريقنا بمراجعة طلبك والتواصل معك قريباً لتأكيد التفاصيل.',
                                ),
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13.5,
                                  color: textSecondary,
                                  height: 1.45,
                                ),
                              ),
                              const SizedBox(height: 22),

                              // Highlight Banner: Confirmation via WhatsApp or SMS
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFF0F2D2D)
                                      : const Color(0xFFF0FDFA),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: const Color(0xFF18CBCB).withValues(alpha: 0.35),
                                    width: 1,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF18CBCB).withValues(alpha: 0.15),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.chat_bubble_outline_rounded,
                                        color: Color(0xFF0D9488),
                                        size: 20,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        _t(
                                          'Confirmation will be sent via WhatsApp or SMS.',
                                          'سيتم إرسال التأكيد عبر الواتساب أو الرسائل القصيرة.',
                                        ),
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: isDark
                                              ? const Color(0xFF5EEAD4)
                                              : const Color(0xFF0F766E),
                                          height: 1.35,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 20),

                              // Flow Step Visualizer
                              _buildFlowSteps(isDark, textPrimary, textSecondary),
                              const SizedBox(height: 24),

                              // Closing Thank you message
                              Text(
                                _t('Thank you for choosing us.', 'شكراً لاختياركم لنا.'),
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w600,
                                  color: textSecondary,
                                ),
                              ),
                              const SizedBox(height: 26),

                              // Primary Action: Back to Welcome Page
                              SizedBox(
                                width: double.infinity,
                                height: 52,
                                child: ElevatedButton(
                                  onPressed: () => _handleBackToWelcome(context),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF0F172A),
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                  child: Text(
                                    _t('Back to Welcome Page', 'العودة إلى الصفحة الرئيسية'),
                                    style: const TextStyle(
                                      fontSize: 15.5,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: -0.2,
                                    ),
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
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFlowSteps(bool isDark, Color textPrimary, Color textSecondary) {
    final steps = [
      {'title': _t('Request Submitted', 'تم تقديم الطلب'), 'done': true},
      {'title': _t('Under Review', 'قيد المراجعة'), 'active': true},
      {'title': _t('WhatsApp / SMS', 'تأكيد بالرسائل'), 'pending': true},
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF101726) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(steps.length, (index) {
          final s = steps[index];
          final isDone = s['done'] == true;
          final isActive = s['active'] == true;

          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isDone
                              ? const Color(0xFF18CBCB)
                              : (isActive
                                  ? const Color(0xFF18CBCB).withValues(alpha: 0.2)
                                  : (isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0))),
                          border: isActive
                              ? Border.all(color: const Color(0xFF18CBCB), width: 2)
                              : null,
                        ),
                        child: Center(
                          child: isDone
                              ? const Icon(Icons.check, size: 16, color: Colors.white)
                              : (isActive
                                  ? Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF18CBCB),
                                        shape: BoxShape.circle,
                                      ),
                                    )
                                  : Text(
                                      '${index + 1}',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: isDark
                                            ? const Color(0xFF64748B)
                                            : const Color(0xFF94A3B8),
                                      ),
                                    )),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        s['title'] as String,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: (isDone || isActive)
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: (isDone || isActive) ? textPrimary : textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                if (index < steps.length - 1)
                  Container(
                    width: 14,
                    height: 2,
                    margin: const EdgeInsets.only(bottom: 16),
                    color: isDone
                        ? const Color(0xFF18CBCB)
                        : (isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0)),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }
}
