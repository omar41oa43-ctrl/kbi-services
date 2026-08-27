import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart' as intl;
import '../services/technician_service.dart';
import '../utils/wallet_utils.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  late final Stream<DocumentSnapshot<Map<String, dynamic>>> _techStream;
  late final Stream<QuerySnapshot<Map<String, dynamic>>> _paymentsStream;
  String _selectedFilter = 'ALL'; // 'ALL', 'COMPLETED', 'PENDING'

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
        backgroundColor: const Color(0xFFF8FAFC),
        body: SafeArea(
          bottom: false,
          child: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
            stream: _techStream,
            builder: (context, techSnap) {
              if (techSnap.connectionState == ConnectionState.waiting) {
                return const Center(
                  child: CupertinoActivityIndicator(radius: 14),
                );
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
                        return const Center(
                          child: CupertinoActivityIndicator(radius: 14),
                        );
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

                      for (final job in completedJobsWithoutPayment) {
                        final payable = calculateJobPayout(
                          job.data() ?? {},
                          commissionRate,
                        );
                        if (payable != null) pendingAmount += payable;
                      }

                      // Build unified transaction list
                      final List<Map<String, dynamic>> allTransactions = [];

                      for (final d in payments) {
                        final data = d.data();
                        final type = (data['type'] ?? 'Job Payout').toString();
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
                        allTransactions.add({
                          'title': type,
                          'status': status,
                          'amount': amount,
                          'date': dateStr,
                          'isJob': false,
                        });
                      }

                      for (final job in completedJobsWithoutPayment) {
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
                        allTransactions.add({
                          'title': '$device • $service',
                          'status': 'pending payout',
                          'amount': payable,
                          'date': dateStr,
                          'isJob': true,
                        });
                      }

                      final filteredTransactions = allTransactions.where((item) {
                        if (_selectedFilter == 'COMPLETED') {
                          final st = (item['status'] as String).toLowerCase();
                          return st == 'paid' || st == 'completed';
                        }
                        if (_selectedFilter == 'PENDING') {
                          final st = (item['status'] as String).toLowerCase();
                          return st.startsWith('pending');
                        }
                        return true;
                      }).toList();

                      return CustomScrollView(
                        physics: const BouncingScrollPhysics(),
                        slivers: [
                          // Header App Bar
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        isAr ? 'المحفظة' : 'Wallet',
                                        style: const TextStyle(
                                          color: Color(0xFF0F172A),
                                          fontSize: 26,
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: -0.6,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        isAr
                                            ? 'إدارة الأرباح وسحب المستحقات'
                                            : 'Earnings & Payout Overview',
                                        style: const TextStyle(
                                          color: Color(0xFF64748B),
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(
                                          color: const Color(0xFFE2E8F0)),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black
                                              .withValues(alpha: 0.03),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: IconButton(
                                      icon: const Icon(
                                        CupertinoIcons.creditcard,
                                        size: 20,
                                        color: Color(0xFF0284C7),
                                      ),
                                      onPressed: () {
                                        HapticFeedback.lightImpact();
                                        if (walletBalance > 0) {
                                          _showWithdrawalDialog(
                                              context, walletBalance, isAr);
                                        } else {
                                          ScaffoldMessenger.of(context)
                                              .showSnackBar(
                                            SnackBar(
                                              content: Text(isAr
                                                  ? 'لا يوجد رصيد متاح للسحب حالياً'
                                                  : 'No available balance to withdraw yet'),
                                              behavior:
                                                  SnackBarBehavior.floating,
                                              shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(10)),
                                            ),
                                          );
                                        }
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // PREMIUM WALLET CARD
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 18, vertical: 6),
                              child: _buildModernWalletCard(
                                balance: walletBalance,
                                pending: pendingAmount,
                                commissionRate: commissionRate,
                                completedCount: completedJobs.length,
                                isAr: isAr,
                              ),
                            ),
                          ),

                          // QUICK STATS SUMMARY ROW
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(18, 14, 18, 14),
                              child: Row(
                                children: [
                                  // Stat 1: Total Completed Repairs
                                  Expanded(
                                    child: _buildStatMiniCard(
                                      icon: CupertinoIcons.checkmark_seal_fill,
                                      iconColor: const Color(0xFF10B981),
                                      bgColor: const Color(0xFFECFDF5),
                                      value: '${completedJobs.length}',
                                      label: isAr ? 'أعمال منجزة' : 'Jobs Done',
                                      isAr: isAr,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  // Stat 2: Active Payouts
                                  Expanded(
                                    child: _buildStatMiniCard(
                                      icon: CupertinoIcons.clock_fill,
                                      iconColor: const Color(0xFFF59E0B),
                                      bgColor: const Color(0xFFFFFBEB),
                                      value: 'AED ${pendingAmount.toStringAsFixed(0)}',
                                      label: isAr ? 'مستحقات معلقة' : 'Pending',
                                      isAr: isAr,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  // Stat 3: Commission / Split
                                  Expanded(
                                    child: _buildStatMiniCard(
                                      icon: CupertinoIcons.percent,
                                      iconColor: const Color(0xFF6366F1),
                                      bgColor: const Color(0xFFEEF2FF),
                                      value: commissionRate == 0
                                          ? (isAr ? '0%' : '0%')
                                          : '${commissionRate.toStringAsFixed(0)}%',
                                      label: isAr ? 'نسبة العمولة' : 'Tech Split',
                                      isAr: isAr,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // TRANSACTION HISTORY TITLE & FILTERS
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    isAr ? 'سجل المعاملات' : 'Transaction History',
                                    style: const TextStyle(
                                      color: Color(0xFF0F172A),
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                  // Filter Pills (All / Completed / Pending)
                                  Row(
                                    children: [
                                      _buildFilterPill('ALL', isAr ? 'الكل' : 'All'),
                                      const SizedBox(width: 6),
                                      _buildFilterPill('PENDING', isAr ? 'معلقة' : 'Pending'),
                                      const SizedBox(width: 6),
                                      _buildFilterPill('COMPLETED', isAr ? 'مكتملة' : 'Paid'),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // TRANSACTION LIST
                          if (filteredTransactions.isEmpty)
                            SliverToBoxAdapter(
                              child: _buildEmptyState(isAr),
                            )
                          else
                            SliverPadding(
                              padding: const EdgeInsets.fromLTRB(18, 4, 18, 110),
                              sliver: SliverList(
                                delegate: SliverChildBuilderDelegate(
                                  (context, index) {
                                    final item = filteredTransactions[index];
                                    return _buildModernTransactionItem(
                                      title: item['title'] as String,
                                      status: item['status'] as String,
                                      amount: item['amount'] as double?,
                                      date: item['date'] as String,
                                      isAr: isAr,
                                    );
                                  },
                                  childCount: filteredTransactions.length,
                                ),
                              ),
                            ),
                        ],
                      );
                    },
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }

  // ===========================================================================
  // 1. MODERN WALLET CARD (Apple Card inspired with depth & subtle glass)
  // ===========================================================================
  Widget _buildModernWalletCard({
    required double balance,
    required double pending,
    required double commissionRate,
    required int completedCount,
    required bool isAr,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(26),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF0A192F),
            Color(0xFF0F3260),
            Color(0xFF0284C7),
          ],
          stops: [0.0, 0.55, 1.0],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0284C7).withValues(alpha: 0.28),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
          BoxShadow(
            color: const Color(0xFF0A192F).withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Background ambient circles
          Positioned(
            top: -40,
            right: isAr ? null : -40,
            left: isAr ? -40 : null,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.06),
              ),
            ),
          ),
          Positioned(
            bottom: -30,
            left: isAr ? null : -20,
            right: isAr ? -20 : null,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF38BDF8).withValues(alpha: 0.12),
              ),
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top row: Brand & Status Chip
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: Colors.white.withValues(alpha: 0.15)),
                          ),
                          child: Row(
                            children: [
                              const Icon(CupertinoIcons.shield_fill,
                                  size: 13, color: Color(0xFF38BDF8)),
                              const SizedBox(width: 5),
                              Text(
                                isAr ? 'محفظة الفني المعتمد' : 'KBI Verified Tech',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    // Currency Chip
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3.5),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'AED • UAE',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Available Balance Big Display
                Text(
                  isAr ? 'الرصيد المتاح للسحب' : 'AVAILABLE BALANCE',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      'AED ${balance.toStringAsFixed(2)}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 34,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -1,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Sub Info Bar (Pending + Commission)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.22),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                        color: Colors.white.withValues(alpha: 0.08)),
                  ),
                  child: Row(
                    children: [
                      // Pending clearing
                      Expanded(
                        child: Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Color(0xFFFBBF24),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    isAr ? 'قيد المعالجة' : 'Pending Payout',
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.6),
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 1),
                                  Text(
                                    'AED ${pending.toStringAsFixed(2)}',
                                    style: const TextStyle(
                                      color: Color(0xFFFBBF24),
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        height: 24,
                        width: 1,
                        color: Colors.white.withValues(alpha: 0.12),
                      ),
                      const SizedBox(width: 14),
                      // Platform Split
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isAr ? 'حصة المنصة' : 'Platform Fee',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.6),
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 1),
                            Text(
                              commissionRate == 0
                                  ? (isAr ? '0% (مجاني)' : '0% (Free)')
                                  : '${commissionRate.toStringAsFixed(commissionRate % 1 == 0 ? 0 : 1)}%',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Request Payout Button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: balance <= 0
                        ? () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(isAr
                                    ? 'الرصيد المتاح حالياً 0 درهم، لا يمكن تقديم طلب سحب'
                                    : 'Available balance is AED 0.00, payout request unavailable'),
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10)),
                              ),
                            );
                          }
                        : () => _showWithdrawalDialog(context, balance, isAr),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF0F172A),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          CupertinoIcons.arrow_down_circle_fill,
                          size: 19,
                          color: Color(0xFF0284C7),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          isAr ? 'طلب سحب الرصيد البنكي' : 'Request Payout / Withdrawal',
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ],
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

  // ===========================================================================
  // 2. MINI STATS CARD
  // ===========================================================================
  Widget _buildStatMiniCard({
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required String value,
    required String label,
    required bool isAr,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Icon(icon, color: iconColor, size: 15),
            ),
          ),
          const SizedBox(height: 10),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value,
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 15,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.3,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 3. FILTER PILL
  // ===========================================================================
  Widget _buildFilterPill(String code, String label) {
    final isSelected = _selectedFilter == code;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _selectedFilter = code);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0284C7) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? const Color(0xFF0284C7) : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : const Color(0xFF64748B),
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
          ),
        ),
      ),
    );
  }

  // ===========================================================================
  // 4. MODERN TRANSACTION ITEM
  // ===========================================================================
  Widget _buildModernTransactionItem({
    required String title,
    required String status,
    required double? amount,
    required String date,
    required bool isAr,
  }) {
    final cleanStatus = status.toLowerCase();
    final isPending = cleanStatus.startsWith('pending');
    final isCompleted = cleanStatus == 'paid' || cleanStatus == 'completed';

    Color statusBadgeBg = isPending
        ? const Color(0xFFFEF3C7)
        : (isCompleted ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2));
    Color statusBadgeText = isPending
        ? const Color(0xFFB45309)
        : (isCompleted ? const Color(0xFF15803D) : const Color(0xFFB91C1C));
    String statusText = isPending
        ? (isAr ? 'بانتظار الصرف' : 'Pending Payout')
        : (isCompleted ? (isAr ? 'تم التحويل' : 'Paid') : (isAr ? 'فشل' : 'Failed'));

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Circular Icon
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isPending
                  ? const Color(0xFFFFFBEB)
                  : const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isPending
                    ? const Color(0xFFFDE68A)
                    : const Color(0xFFBBF7D0),
              ),
            ),
            child: Center(
              child: Icon(
                isPending
                    ? CupertinoIcons.hourglass_bottomhalf_fill
                    : CupertinoIcons.money_dollar_circle_fill,
                color: isPending
                    ? const Color(0xFFD97706)
                    : const Color(0xFF16A34A),
                size: 22,
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Title, Date & Badge
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: statusBadgeBg,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        statusText,
                        style: TextStyle(
                          color: statusBadgeText,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '•',
                      style: TextStyle(
                          color: Colors.black.withValues(alpha: 0.2),
                          fontSize: 10),
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        date.split('•').first.trim(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(width: 8),

          // Amount
          Text(
            amount == null || amount <= 0
                ? (isAr ? 'قيد التقدير' : 'Pending')
                : '+AED ${amount.toStringAsFixed(0)}',
            style: TextStyle(
              color: amount == null || amount <= 0
                  ? const Color(0xFFD97706)
                  : const Color(0xFF10B981),
              fontSize: 15,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.3,
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 5. WITHDRAWAL POPUP DIALOG
  // ===========================================================================
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
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          backgroundColor: Colors.white,
          titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
          contentPadding: const EdgeInsets.symmetric(horizontal: 20),
          actionsPadding: const EdgeInsets.fromLTRB(20, 12, 20, 18),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: const Color(0xFFE0F2FE),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(CupertinoIcons.arrow_down_circle_fill,
                    color: Color(0xFF0284C7), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  isAr ? 'طلب سحب الأرباح' : 'Request Payout',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isAr ? 'الرصيد المتاح للسحب:' : 'Available to withdraw:',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      'AED ${availableBalance.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0284C7),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: amountController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: isAr ? 'المبلغ (درهم)' : 'Amount (AED)',
                  prefixIcon: const Icon(CupertinoIcons.money_dollar, size: 18),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: ibanController,
                decoration: InputDecoration(
                  labelText: isAr ? 'رقم الآيبان (IBAN)' : 'Bank IBAN (AE...)',
                  hintText: 'AE000000000000000000000',
                  prefixIcon: const Icon(CupertinoIcons.creditcard, size: 18),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogCtx).pop(),
              child: Text(
                isAr ? 'إلغاء' : 'Cancel',
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0284C7),
                foregroundColor: Colors.white,
                elevation: 0,
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
                                ? 'المبلغ غير صالح أو يتجاوز الرصيد المتاح'
                                : 'Invalid amount or exceeds available balance'),
                          ),
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
                              backgroundColor: const Color(0xFF10B981),
                              content: Text(isAr
                                  ? 'تم إرسال طلب السحب بنجاح! سيتم تحويل المبلغ لحسابك البنكي خلال 24 ساعة.'
                                  : 'Payout request sent! Transfer will be processed within 24 hours.'),
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
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
                          strokeWidth: 2, color: Colors.white),
                    )
                  : Text(
                      isAr ? 'تأكيد السحب' : 'Submit Request',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isAr) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: const BoxDecoration(
              color: Color(0xFFF1F5F9),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              CupertinoIcons.tray,
              size: 28,
              color: Color(0xFF94A3B8),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            isAr ? 'لا يوجد سجل معاملات بعد' : 'No transaction history yet',
            style: const TextStyle(
              color: Color(0xFF475569),
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            isAr
                ? 'ستظهر هنا أرباح الطلبات المكتملة وعمليات السحب'
                : 'Completed repairs and payouts will appear here',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 12,
            ),
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
            const Icon(CupertinoIcons.exclamationmark_triangle,
                color: Colors.redAccent, size: 44),
            const SizedBox(height: 12),
            const Text(
              'Wallet data could not be loaded.',
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '$error',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
