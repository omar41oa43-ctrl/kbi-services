import 'package:flutter/material.dart';

import '../theme.dart';

/// Owns the controller until the dialog route finishes its exit animation.
/// The Future from showDialog completes when pop is called, before that happens.
class PasswordResetDialog extends StatefulWidget {
  const PasswordResetDialog({
    super.key,
    required this.initialEmail,
    required this.isArabic,
  });

  final String initialEmail;
  final bool isArabic;

  @override
  State<PasswordResetDialog> createState() => _PasswordResetDialogState();
}

class _PasswordResetDialogState extends State<PasswordResetDialog> {
  late final TextEditingController _email;

  @override
  void initState() {
    super.initState();
    _email = TextEditingController(text: widget.initialEmail);
  }

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final panelColor = isDark ? kbiSurfaceRaised : const Color(0xFFFCFEFE);
    final labelColor = isDark ? kbiLabel : const Color(0xFF102426);
    final secondaryColor = isDark ? kbiSecondaryLabel : const Color(0xFF536568);
    final isAr = widget.isArabic;
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: AlertDialog(
        backgroundColor: panelColor,
        title: Text(isAr ? 'استعادة كلمة المرور' : 'Reset password',
            style: TextStyle(color: labelColor, fontWeight: FontWeight.bold)),
        content: TextField(
          controller: _email,
          style: TextStyle(color: labelColor),
          keyboardType: TextInputType.emailAddress,
          textDirection: TextDirection.ltr,
          autofocus: true,
          decoration: InputDecoration(
            labelText: isAr ? 'البريد الإلكتروني' : 'Email address',
            labelStyle: TextStyle(color: secondaryColor),
            enabledBorder: UnderlineInputBorder(
              borderSide: BorderSide(
                color: secondaryColor.withValues(alpha: 0.45),
              ),
            ),
            focusedBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: kbiBrand),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(isAr ? 'إلغاء' : 'Cancel',
                style: TextStyle(color: secondaryColor)),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: kbiBrand),
            onPressed: () => Navigator.pop(context, _email.text.trim()),
            child: Text(isAr ? 'إرسال الطلب' : 'Send request'),
          ),
        ],
      ),
    );
  }
}
