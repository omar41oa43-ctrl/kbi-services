import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart' as intl;
import '../services/technician_service.dart';
import '../theme.dart';
import '../utils/wallet_utils.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  late final Stream<DocumentSnapshot<Map<String, dynamic>>> _techStream;
  late final Stream<QuerySnapshot<Map<String, dynamic>>> _paymentsStream;

  @override
  void initState() {
    super.initState();
    _techStream = TechnicianService.instance.watchMyTechDoc();
    _paymentsStream = TechnicianService.instance.watchMyPayments();
  }

  String? _paymentJobId(Map<String, dynamic> data) {
    for (final key in ['jobId', 'bookingId', 'orderId', 'requestId']) {
      final value = data[key]?.toString().trim();
      if (value != null && value.isNotEmpty) return value;
    }
    return null;
  }

  String _formatDate(Timestamp? timestamp, bool isAr) {
    if (timestamp == null) return isAr ? 'حديثاً' : 'Recent';
    final date = timestamp.toDate().toLocal();
    final locale = isAr ? 'ar' : 'en';
    return '${intl.DateFormat('d MMM yyyy', locale).format(date)} • '
        '${intl.DateFormat('h:mm a', locale).format(date)}';
  }

  @override
  Widget build(BuildContext context) {
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          title: Text(
            isAr ? 'المحفظة' : 'Wallet',
          ),
        ),
        body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: _techStream,
          builder: (context, techSnap) {
            if (techSnap.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (techSnap.hasError) return _buildError(techSnap.error);
            final techData = techSnap.data?.data();
            final rawRate = techData?['commissionRate'];
            final double commissionRate = rawRate is num
                ? (rawRate > 1 ? rawRate.toDouble() : rawRate.toDouble() * 100)
                : 0;

            return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: _paymentsStream,
              builder: (context, paymentsSnap) {
                return StreamBuilder<
                    List<DocumentSnapshot<Map<String, dynamic>>>>(
                  stream: TechnicianService.instance.watchMyJobDocs(),
                  builder: (context, jobsSnap) {
                    if (paymentsSnap.connectionState ==
                            ConnectionState.waiting &&
                        jobsSnap.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    final payments = [...?paymentsSnap.data?.docs]
                      ..sort((a, b) {
                        final aDate = a.data()['createdAt'] as Timestamp?;
                        final bDate = b.data()['createdAt'] as Timestamp?;
                        return (bDate?.millisecondsSinceEpoch ?? 0)
                            .compareTo(aDate?.millisecondsSinceEpoch ?? 0);
                      });

                    final completedJobs = (jobsSnap.data ?? []).where((doc) {
                      final status = (doc.data()?['status'] ?? '')
                          .toString()
                          .toLowerCase();
                      return const {'completed', 'delivered', 'done'}
                          .contains(status);
                    }).toList()
                      ..sort((a, b) {
                        final aDate = (a.data()?['updatedAt'] ??
                            a.data()?['createdAt']) as Timestamp?;
                        final bDate = (b.data()?['updatedAt'] ??
                            b.data()?['createdAt']) as Timestamp?;
                        return (bDate?.millisecondsSinceEpoch ?? 0)
                            .compareTo(aDate?.millisecondsSinceEpoch ?? 0);
                      });

                    double pendingAmount = 0.0;
                    final rawManualBalance = techData?['walletBalance'] ??
                        techData?['balance'] ??
                        techData?['availableBalance'];
                    double manualBalanceOverride = rawManualBalance is num
                        ? rawManualBalance.toDouble()
                        : 0.0;
                    double walletBalance = manualBalanceOverride;
                    final paymentJobIds = payments
                        .map((doc) => _paymentJobId(doc.data()))
                        .whereType<String>()
                        .toSet();
                    final completedJobsWithoutPayment = completedJobs
                        .where((job) => !paymentJobIds.contains(job.id))
                        .toList();

                    for (final document in payments) {
                      final data = document.data();
                      final gross =
                          readFirstMeaningfulAmount(data, const ['amount']);
                      final technicianShare = readFirstMeaningfulAmount(
                        data,
                        const ['technicianShare', 'technicianAmount'],
                      );
                      final payable = technicianShare ?? gross;
                      final status =
                          (data['status'] ?? '').toString().toLowerCase();
                      if (status == 'paid' || status == 'completed') {
                        if (payable != null && manualBalanceOverride == 0) {
                          walletBalance += payable;
                        }
                      } else if (status == 'pending') {
                        if (payable != null) pendingAmount += payable;
                      }
                    }

                    // A completed order belongs in the wallet even before a
                    // separate payment document is created for it.
                    for (final job in completedJobsWithoutPayment) {
                      final payable = calculateJobPayout(
                        job.data() ?? {},
                        commissionRate,
                      );
                      if (payable != null) pendingAmount += payable;
                    }

                    return ListView(
                      padding: const EdgeInsets.only(
                          left: 16, right: 16, top: 16, bottom: 100),
                      children: [
                        // BALANCE CARD
                        _buildBalanceCard(
                          walletBalance,
                          pendingAmount,
                          commissionRate,
                          isAr,
                        ),
                        const SizedBox(height: 24),

                        // TRANSACTION HISTORY HEADER
                        Text(
                          isAr ? 'سجل المعاملات' : 'TRANSACTION HISTORY',
                          style: const TextStyle(
                              color: Colors.black54,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8),
                        ),
                        const SizedBox(height: 12),

                        // LIST OF PAYMENTS / COMPLETED REPAIRS
                        if (payments.isEmpty && completedJobs.isEmpty)
                          _buildEmptyState(isAr)
                        else ...[
                          ...payments.map((d) {
                            final data = d.data();
                            final type =
                                (data['type'] ?? 'Job Payout').toString();
                            final status =
                                (data['status'] ?? 'completed').toString();
                            final technicianShare = readFirstMeaningfulAmount(
                              data,
                              const ['technicianShare', 'technicianAmount'],
                            );
                            final amount = technicianShare ??
                                readFirstMeaningfulAmount(
                                  data,
                                  const ['amount'],
                                );
                            final timestamp = data['createdAt'] as Timestamp?;
                            final dateStr = _formatDate(timestamp, isAr);

                            return _buildTransactionItem(
                              type,
                              status,
                              amount,
                              dateStr,
                              isAr,
                            );
                          }),
                          ...completedJobsWithoutPayment.map((job) {
                            final data = job.data() ?? {};
                            final device = data['device'] ??
                                data['deviceModel'] ??
                                'Service Repair';
                            final service =
                                data['service'] ?? 'Repair Completed';
                            final payable =
                                calculateJobPayout(data, commissionRate);
                            final timestamp = (data['updatedAt'] ??
                                data['createdAt']) as Timestamp?;
                            final dateStr = _formatDate(timestamp, isAr);

                            return _buildTransactionItem(
                              '$device • $service',
                              'pending payout',
                              payable,
                              dateStr,
                              isAr,
                            );
                          }),
                        ],
                      ],
                    );
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildBalanceCard(
    double balance,
    double pending,
    double commissionRate,
    bool isAr,
  ) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF17233A), Color(0xFF0A5BB8)],
        ),
        borderRadius: const BorderRadius.all(Radius.circular(24)),
        border: Border.all(color: Colors.white24),
        boxShadow: [
          BoxShadow(
            color: kbiBlue.withValues(alpha: 0.16),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isAr ? 'رصيد المحفظة' : 'WALLET BALANCE',
            style: const TextStyle(
                color: Colors.white60,
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5),
          ),
          const SizedBox(height: 8),
          Text(
            'AED ${balance.toStringAsFixed(2)}',
            style: const TextStyle(
                color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(isAr ? 'قيد التسوية' : 'PENDING CLEARING',
                        style: const TextStyle(
                            color: Colors.white60,
                            fontSize: 9,
                            fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(
                      'AED ${pending.toStringAsFixed(2)}',
                      style: const TextStyle(
                          color: Color(0xFFFFD60A),
                          fontSize: 14,
                          fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(isAr ? 'عمولة المنصة' : 'PLATFORM FEE',
                        style: const TextStyle(
                            color: Colors.white60,
                            fontSize: 9,
                            fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(
                      commissionRate == 0
                          ? (isAr ? 'غير محددة' : 'Not configured')
                          : '${commissionRate.toStringAsFixed(commissionRate % 1 == 0 ? 0 : 1)}%',
                      textAlign: TextAlign.end,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.account_balance_wallet_outlined,
                  size: 18, color: Color(0xFF0F172A)),
              label: Text(
                isAr ? 'طلب سحب الرصيد' : 'Request Payout / Withdrawal',
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontWeight: FontWeight.w700,
                  fontSize: 13.5,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: balance <= 0
                  ? null
                  : () => _showWithdrawalDialog(context, balance, isAr),
            ),
          ),
        ],
      ),
    );
  }

  void _showWithdrawalDialog(
      BuildContext context, double availableBalance, bool isAr) {
    final amountController =
        TextEditingController(text: availableBalance.toStringAsFixed(2));
    final ibanController = TextEditingController();
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          backgroundColor: Colors.white,
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.payments_outlined,
                    color: Color(0xFF0D67E8), size: 22),
              ),
              const SizedBox(width: 10),
              Text(
                isAr ? 'طلب سحب الرصيد' : 'Request Payout',
                style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A)),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isAr
                    ? 'الرصيد المتاح للسحب: AED ${availableBalance.toStringAsFixed(2)}'
                    : 'Available for Payout: AED ${availableBalance.toStringAsFixed(2)}',
                style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: amountController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: isAr ? 'المبلغ (AED)' : 'Amount (AED)',
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: ibanController,
                decoration: InputDecoration(
                  labelText: isAr ? 'رقم الآيبان (IBAN)' : 'Bank IBAN (AE...)',
                  hintText: 'AE000000000000000000000',
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogCtx).pop(),
              child: Text(isAr ? 'إلغاء' : 'Cancel',
                  style: const TextStyle(color: Color(0xFF64748B))),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0D67E8),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: isSubmitting
                  ? null
                  : () async {
                      final amount =
                          double.tryParse(amountController.text.trim()) ?? 0;
                      if (amount <= 0 || amount > availableBalance) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                              content: Text(isAr
                                  ? 'المبلغ غير صالح'
                                  : 'Invalid amount entered')),
                        );
                        return;
                      }
                      setDialogState(() => isSubmitting = true);
                      try {
                        final user = FirebaseAuth.instance.currentUser;
                        if (user != null) {
                          await FirebaseFirestore.instance
                              .collection('payout_requests')
                              .add({
                            'technicianId': user.uid,
                            'technicianEmail': user.email,
                            'amount': amount,
                            'iban': ibanController.text.trim(),
                            'status': 'pending',
                            'createdAt': FieldValue.serverTimestamp(),
                          });
                        }
                        if (context.mounted) {
                          Navigator.of(dialogCtx).pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: const Color(0xFF16A34A),
                              content: Text(isAr
                                  ? 'تم إرسال طلب السحب بنجاح! سيتم تحويل المبلغ خلال 24 ساعة.'
                                  : 'Payout requested successfully! Processing within 24 hours.'),
                            ),
                          );
                        }
                      } catch (e) {
                        setDialogState(() => isSubmitting = false);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error: $e')),
                          );
                        }
                      }
                    },
              child: isSubmitting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : Text(isAr ? 'تأكيد السحب' : 'Submit Request',
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionItem(
    String type,
    String status,
    double? amount,
    String date,
    bool isAr,
  ) {
    Color statusColor = Colors.greenAccent;
    if (status.toLowerCase().startsWith('pending')) {
      statusColor = Colors.amberAccent;
    } else if (status.toLowerCase() == 'failed') {
      statusColor = Colors.redAccent;
    }
    final statusLabel = switch (status.toLowerCase()) {
      'pending' ||
      'pending payout' =>
        isAr ? 'بانتظار التحويل' : 'PENDING PAYOUT',
      'paid' || 'completed' => isAr ? 'تم الدفع' : 'PAID',
      'failed' => isAr ? 'فشل' : 'FAILED',
      _ => status.toUpperCase(),
    };
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        border: Border.all(color: const Color(0xFFEDEEF1)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF00C9A7).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Text('💰', style: TextStyle(fontSize: 16)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  type,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: Color(0xFF111827),
                      fontSize: 13.5,
                      fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 8,
                  runSpacing: 5,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        statusLabel,
                        style: TextStyle(
                            color: statusColor == Colors.greenAccent
                                ? const Color(0xFF059669)
                                : (statusColor == Colors.amberAccent
                                    ? const Color(0xFFD97706)
                                    : const Color(0xFFDC2626)),
                            fontSize: 9,
                            fontWeight: FontWeight.w800),
                      ),
                    ),
                    const Text('•',
                        style: TextStyle(color: Colors.black26, fontSize: 10)),
                    Text(
                      date,
                      style: const TextStyle(
                          color: Color(0xFF6B7280), fontSize: 11),
                    ),
                  ],
                ),
                const SizedBox(height: 9),
                Align(
                  alignment: AlignmentDirectional.centerEnd,
                  child: Text(
                    amount == null || amount <= 0
                        ? (isAr ? 'بانتظار التسعير' : 'Amount pending')
                        : '+AED ${amount.toStringAsFixed(0)}',
                    style: TextStyle(
                      color: amount == null || amount <= 0
                          ? const Color(0xFFD97706)
                          : const Color(0xFF059669),
                      fontSize: amount == null || amount <= 0 ? 12 : 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool isAr) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          const Icon(Icons.history_toggle_off_outlined,
              size: 48, color: Colors.black12),
          const SizedBox(height: 12),
          Text(
            isAr ? 'لا يوجد سجل معاملات بعد' : 'No transaction history yet',
            style: const TextStyle(color: Colors.black54, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildError(Object? error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_outlined,
                color: Colors.redAccent, size: 48),
            const SizedBox(height: 12),
            const Text('Wallet data could not be loaded.',
                style: TextStyle(color: Color(0xFF111318))),
            const SizedBox(height: 6),
            Text('$error',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.black87)),
          ],
        ),
      ),
    );
  }
}
