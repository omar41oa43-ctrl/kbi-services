import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../theme.dart';

/// Keeps full labels and amounts readable on small phones and with larger text.
class DashboardOverview extends StatelessWidget {
  final int jobsToday;
  final int completedJobs;
  final double earningsToday;
  final int activeJobs;
  final bool isArabic;
  final VoidCallback? onOpenWallet;

  const DashboardOverview({
    super.key,
    required this.jobsToday,
    required this.completedJobs,
    required this.earningsToday,
    required this.activeJobs,
    this.isArabic = false,
    this.onOpenWallet,
  });

  @override
  Widget build(BuildContext context) {
    final cards = [
      _Metric(
        icon: CupertinoIcons.briefcase,
        value: '$jobsToday',
        label: isArabic ? 'طلبات اليوم' : 'Jobs today',
        detail: isArabic ? '$completedJobs مكتمل' : '$completedJobs completed',
      ),
      _Metric(
        icon: CupertinoIcons.creditcard,
        value: 'AED ${earningsToday.toStringAsFixed(2)}',
        label: isArabic ? 'أرباح اليوم' : 'Earnings today',
        detail: isArabic ? 'من الطلبات المكتملة' : 'From completed jobs',
      ),
      _Metric(
        icon: CupertinoIcons.clock,
        value: '$activeJobs',
        label: isArabic ? 'طلبات نشطة اليوم' : 'Active jobs today',
        detail: isArabic ? 'بانتظار الإكمال' : 'Awaiting completion',
      ),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          Expanded(
            child: Text(
              isArabic ? 'نظرة عامة على اليوم' : 'Today’s overview',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          if (onOpenWallet != null)
            TextButton(
              onPressed: onOpenWallet,
              child: Text(isArabic ? 'المحفظة' : 'Wallet'),
            ),
        ]),
        const SizedBox(height: 12),
        LayoutBuilder(builder: (context, constraints) {
          final largeText = MediaQuery.textScalerOf(context).scale(14) > 17;
          final stacked = constraints.maxWidth < 430 || largeText;
          if (stacked) {
            return Column(children: [
              for (var i = 0; i < cards.length; i++) ...[
                if (i > 0) const SizedBox(height: 10),
                cards[i],
              ],
            ]);
          }
          return IntrinsicHeight(
            child:
                Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              for (var i = 0; i < cards.length; i++) ...[
                if (i > 0) const SizedBox(width: 12),
                Expanded(child: cards[i]),
              ],
            ]),
          );
        }),
      ],
    );
  }
}

class _Metric extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final String detail;

  const _Metric(
      {required this.icon,
      required this.value,
      required this.label,
      required this.detail});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: kbiSurfaceRaised,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: kbiSeparator),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                  child: Text(label,
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: kbiSecondaryLabel))),
              const SizedBox(width: 8),
              Icon(icon, color: kbiBrand, size: 20),
            ]),
            const SizedBox(height: 12),
            Text(value, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 4),
            Text(detail,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: kbiSecondaryLabel)),
          ],
        ),
      ),
    );
  }
}
