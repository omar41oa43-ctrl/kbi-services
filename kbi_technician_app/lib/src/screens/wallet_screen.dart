import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../services/technician_service.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  bool _requestingWithdrawal = false;

  Future<void> _withdrawEarnings(double balance) async {
    if (balance <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No earnings available for withdrawal.')),
      );
      return;
    }
    setState(() {
      _requestingWithdrawal = true;
    });
    try {
      // Simulate withdrawal request creation in Firestore
      await Future.delayed(const Duration(seconds: 1));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Withdrawal request for AED ${balance.toStringAsFixed(0)} submitted successfully!')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _requestingWithdrawal = false;
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
        backgroundColor: const Color(0xFF070A0E),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0E131B),
          elevation: 0,
          title: const Text(
            'Wallet & Earnings',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
          ),
        ),
        body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: TechnicianService.instance.watchMyTechDoc(),
          builder: (context, techSnap) {
            final techData = techSnap.data?.data();
            final double walletBalance = (techData?['wallet'] is num) ? (techData?['wallet'] as num).toDouble() : 0.0;

            return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: TechnicianService.instance.watchMyPayments(),
              builder: (context, paymentsSnap) {
                final payments = paymentsSnap.data?.docs ?? [];
                double pendingAmount = 0.0;
                double totalEarned = 0.0;

                for (final d in payments) {
                  final data = d.data();
                  final amount = (data['amount'] is num) ? (data['amount'] as num).toDouble() : 0.0;
                  final status = (data['status'] ?? '').toString();
                  if (status == 'pending') {
                    pendingAmount += amount;
                  } else if (status == 'completed' || status == 'paid') {
                    totalEarned += amount;
                  }
                }

                return ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // BALANCE CARD
                    _buildBalanceCard(walletBalance, pendingAmount),
                    const SizedBox(height: 24),

                    // TRANSACTION HISTORY HEADER
                    const Text(
                      'TRANSACTION HISTORY',
                      style: TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                    ),
                    const SizedBox(height: 12),

                    // LIST OF PAYMENTS
                    if (payments.isEmpty)
                      _buildEmptyState()
                    else
                      ...payments.map((d) {
                        final data = d.data();
                        final type = (data['type'] ?? 'Job Payout').toString();
                        final status = (data['status'] ?? 'completed').toString();
                        final amount = (data['amount'] is num) ? (data['amount'] as num).toDouble() : 0.0;
                        final timestamp = data['createdAt'] as Timestamp?;
                        final String dateStr = timestamp != null
                            ? DateTime.fromMillisecondsSinceEpoch(timestamp.millisecondsSinceEpoch).toString().substring(0, 16)
                            : 'Recent';

                        return _buildTransactionItem(type, status, amount, dateStr);
                      }),
                  ],
                );
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildBalanceCard(double balance, double pending) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E2633), Color(0xFF0E131B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF1E2633)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'WALLET BALANCE',
            style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
          ),
          const SizedBox(height: 8),
          Text(
            'AED ${balance.toStringAsFixed(2)}',
            style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('PENDING CLEARING', style: TextStyle(color: Colors.white38, fontSize: 9, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(
                    'AED ${pending.toStringAsFixed(2)}',
                    style: const TextStyle(color: Colors.amberAccent, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('COMMISSION RATE', style: TextStyle(color: Colors.white38, fontSize: 9, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text(
                    '30% Platform Fee',
                    style: TextStyle(color: Colors.cyanAccent, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          _requestingWithdrawal
              ? const Center(child: CircularProgressIndicator(color: Colors.cyanAccent))
              : ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.cyanAccent,
                    foregroundColor: Colors.black,
                    elevation: 0,
                    minimumSize: const Size.fromHeight(50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: () => _withdrawEarnings(balance),
                  icon: const Icon(Icons.account_balance_outlined),
                  label: const Text('Withdraw Earnings to Bank', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ),
        ],
      ),
    );
  }

  Widget _buildTransactionItem(String type, String status, double amount, String date) {
    Color statusColor = Colors.greenAccent;
    if (status.toLowerCase() == 'pending') {
      statusColor = Colors.amberAccent;
    } else if (status.toLowerCase() == 'failed') {
      statusColor = Colors.redAccent;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF0E131B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E2633)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.04),
                  shape: BoxShape.circle,
                ),
                child: const Text('💰', style: TextStyle(fontSize: 16)),
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    type,
                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        status.toUpperCase(),
                        style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 8),
                      const Text('•', style: TextStyle(color: Colors.white24, fontSize: 10)),
                      const SizedBox(width: 8),
                      Text(
                        date,
                        style: const TextStyle(color: Colors.white30, fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          Text(
            '+AED ${amount.toStringAsFixed(0)}',
            style: const TextStyle(color: Colors.greenAccent, fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: const Column(
        children: [
          Icon(Icons.history_toggle_off_outlined, size: 48, color: Colors.white24),
          SizedBox(height: 12),
          Text(
            'No transaction history yet',
            style: TextStyle(color: Colors.white38, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
