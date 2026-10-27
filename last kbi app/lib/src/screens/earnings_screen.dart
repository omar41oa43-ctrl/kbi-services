import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../services/technician_service.dart';
import '../theme.dart';
import '../utils/wallet_utils.dart';

class EarningsScreen extends StatelessWidget {
  const EarningsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        appBar: AppBar(title: Text(isAr ? 'الأرباح' : 'Earnings')),
        body: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: TechnicianService.instance.watchMyPayments(),
          builder: (context, snap) {
            if (snap.hasError) {
              return Center(
                  child: Text(isAr
                      ? 'تعذر تحميل الأرباح. تحقق من الاتصال.'
                      : 'Unable to load earnings. Check your connection.'));
            }
            if (!snap.hasData) {
              return const Center(child: CircularProgressIndicator());
            }
            final docs = snap.data!.docs;
            double total = 0;
            for (final d in docs) {
              total += readFirstMeaningfulAmount(d.data(), ['amount']) ?? 0;
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(isAr ? 'الإجمالي' : 'Total',
                            style: const TextStyle(color: kbiSecondaryLabel)),
                        const SizedBox(height: 6),
                        Text('AED ${total.toStringAsFixed(2)}',
                            style: Theme.of(context).textTheme.headlineMedium),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                ...docs.map((d) {
                  final data = d.data();
                  final type = (data['type'] ?? '').toString();
                  final status = (data['status'] ?? '').toString();
                  final amount =
                      readFirstMeaningfulAmount(data, ['amount']) ?? 0;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Card(
                      child: ListTile(
                        title: Text(type),
                        subtitle: Text(status),
                        trailing: Text('AED ${amount.toStringAsFixed(0)}'),
                      ),
                    ),
                  );
                }),
              ],
            );
          },
        ),
      ),
    );
  }
}
