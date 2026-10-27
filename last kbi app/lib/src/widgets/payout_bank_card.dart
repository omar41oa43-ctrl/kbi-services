import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../utils/bank_utils.dart';

class PayoutBankCard extends StatelessWidget {
  final Map<String, dynamic> bankDetails;
  final bool isAr;
  final VoidCallback? onEdit;

  const PayoutBankCard(
      {super.key, required this.bankDetails, required this.isAr, this.onEdit});

  @override
  Widget build(BuildContext context) {
    final bank = bankDetails['bank_name']?.toString().trim() ?? '';
    final holder = bankDetails['account_holder']?.toString().trim() ?? '';
    final iban = bankDetails['iban']?.toString().trim() ?? '';
    final complete =
        bank.isNotEmpty && holder.isNotEmpty && isValidUaeIban(iban);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Text(isAr ? 'الحساب البنكي للسحب' : 'Payout bank account',
              style: const TextStyle(
                  color: Color(0xFF9AAFB1),
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
        ),
        AspectRatio(
          aspectRatio: 1.586,
          child: Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                  color: const Color(0xFF527B7C).withValues(alpha: .5)),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF25464A),
                  Color(0xFF102C33),
                  Color(0xFF071C25)
                ],
                stops: [0, .48, 1],
              ),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withValues(alpha: .3),
                    blurRadius: 20,
                    offset: const Offset(0, 8))
              ],
            ),
            child: Stack(
              children: [
                Positioned(
                    right: -100,
                    top: -130,
                    child: Container(
                      width: 330,
                      height: 330,
                      decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: Colors.white.withValues(alpha: .055),
                              width: 35)),
                    )),
                Positioned(
                    right: -90,
                    bottom: -180,
                    child: Container(
                      width: 330,
                      height: 330,
                      decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: const Color(0xFF8BBDB9)
                                  .withValues(alpha: .07),
                              width: 1)),
                    )),
                Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                                child: Text(
                                    complete
                                        ? bank
                                        : (isAr
                                            ? 'حسابك البنكي'
                                            : 'Your bank account'),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        height: 1.1))),
                            const SizedBox(width: 12),
                            const Text('KBI',
                                style: TextStyle(
                                    color: Color(0xFFA8D9D1),
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 2)),
                          ]),
                      const Spacer(),
                      Row(children: [
                        const SizedBox(
                            width: 39,
                            height: 29,
                            child: CustomPaint(painter: _ChipPainter())),
                        const SizedBox(width: 12),
                        Transform.rotate(
                            angle: math.pi / 2,
                            child: const Icon(Icons.wifi_rounded,
                                color: Color(0xFFB7C9C8), size: 22)),
                      ]),
                      const SizedBox(height: 14),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: AlignmentDirectional.centerStart,
                        child: Text(
                            complete
                                ? maskIban(iban)
                                : 'AE•• •••• •••• •••• ••••',
                            textDirection: TextDirection.ltr,
                            style: const TextStyle(
                                color: Color(0xFFE8F3EF),
                                fontFamily: 'monospace',
                                fontSize: 20,
                                letterSpacing: 1.5)),
                      ),
                      const Spacer(),
                      Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Expanded(
                                child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                  Text(isAr ? 'صاحب الحساب' : 'ACCOUNT HOLDER',
                                      style: const TextStyle(
                                          color: Color(0xFF9FB9B8),
                                          fontSize: 8,
                                          letterSpacing: 1.2)),
                                  const SizedBox(height: 4),
                                  Text(
                                      complete
                                          ? holder
                                          : (isAr
                                              ? 'أضف بيانات البنك من الملف الشخصي'
                                              : 'Add bank details in Profile'),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          letterSpacing: .6)),
                                ])),
                            const SizedBox(width: 10),
                            const Text('IBAN\nAE / AED',
                                textAlign: TextAlign.end,
                                style: TextStyle(
                                    color: Color(0xFF9FB9B8),
                                    fontSize: 9,
                                    height: 1.5,
                                    letterSpacing: .5)),
                          ]),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        if (onEdit != null)
          Align(
              alignment: AlignmentDirectional.centerEnd,
              child: TextButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined, size: 15),
                label: Text(complete
                    ? (isAr ? 'تعديل بيانات البنك' : 'Edit bank details')
                    : (isAr ? 'إضافة بيانات البنك' : 'Add bank details')),
                style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF99D6CF),
                    textStyle: const TextStyle(fontSize: 12)),
              )),
      ],
    );
  }
}

class _ChipPainter extends CustomPainter {
  const _ChipPainter();
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final outline = RRect.fromRectAndRadius(rect, const Radius.circular(6));
    canvas.drawRRect(
        outline,
        Paint()
          ..shader = const LinearGradient(colors: [
            Color(0xFFE7D4A2),
            Color(0xFFB69C62),
            Color(0xFFF1E2BA)
          ]).createShader(rect));
    final line = Paint()
      ..color = const Color(0xFF806F47)
      ..style = PaintingStyle.stroke
      ..strokeWidth = .75;
    canvas.drawRRect(outline.deflate(.5), line);
    canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(size.width * .32, size.height * .22, size.width * .36,
                size.height * .56),
            const Radius.circular(3)),
        line);
    for (final y in [.32, .68]) {
      canvas.drawLine(Offset(0, size.height * y),
          Offset(size.width * .32, size.height * y), line);
      canvas.drawLine(Offset(size.width * .68, size.height * y),
          Offset(size.width, size.height * y), line);
    }
    canvas.drawLine(Offset(size.width * .5, 0),
        Offset(size.width * .5, size.height * .22), line);
    canvas.drawLine(Offset(size.width * .5, size.height * .78),
        Offset(size.width * .5, size.height), line);
  }

  @override
  bool shouldRepaint(covariant _ChipPainter oldDelegate) => false;
}
