import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/api_client.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<dynamic> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    final client = ApiClient();
    final response = await client.get('/api/customer/orders');
    setState(() {
      _orders = response['orders'] ?? [];
      _isLoading = false;
    });
  }

  List<dynamic> _filterOrders(String statusType) {
    if (statusType == 'ACTIVE') {
      return _orders.where((o) => o['status'] != 'COMPLETED' && o['status'] != 'CANCELLED').toList();
    } else if (statusType == 'COMPLETED') {
      return _orders.where((o) => o['status'] == 'COMPLETED').toList();
    } else {
      return _orders.where((o) => o['status'] == 'CANCELLED').toList();
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return AppTheme.warning;
      case 'QUOTED':
        return AppTheme.primaryAccent;
      case 'APPROVED':
      case 'COMPLETED':
        return AppTheme.success;
      case 'CANCELLED':
        return AppTheme.danger;
      default:
        return AppTheme.textMutedDark;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Repairs'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primaryAccent,
          tabs: const [
            Tab(text: 'Active'),
            Tab(text: 'Completed'),
            Tab(text: 'Cancelled'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryAccent))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOrderList(_filterOrders('ACTIVE')),
                _buildOrderList(_filterOrders('COMPLETED')),
                _buildOrderList(_filterOrders('CANCELLED')),
              ],
            ),
    );
  }

  Widget _buildOrderList(List<dynamic> ordersList) {
    if (ordersList.isEmpty) {
      return const Center(
        child: Text(
          'No repair orders found.',
          style: TextStyle(color: AppTheme.textMutedDark),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: ordersList.length,
      itemBuilder: (context, index) {
        final order = ordersList[index];
        final device = order['devices'] != null && order['devices'].isNotEmpty
            ? order['devices'][0]
            : {'brand': 'Unknown', 'model': 'Device'};
        
        final status = order['status'] ?? 'PENDING';
        final isQuoted = status == 'QUOTED';
        
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      order['orderNumber'] ?? 'KBI-XXXXXX',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.textPrimaryDark),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(status).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        status,
                        style: TextStyle(color: _getStatusColor(status), fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  '${device['brand']} ${device['model']}',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textPrimaryDark),
                ),
                const SizedBox(height: 4),
                Text(
                  order['description'] ?? 'No description provided.',
                  style: const TextStyle(color: AppTheme.textMutedDark, fontSize: 13),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Date: ${order['createdAt'].split('T')[0]}',
                      style: const TextStyle(color: AppTheme.textMutedDark, fontSize: 12),
                    ),
                    if (isQuoted)
                      ElevatedButton(
                        onPressed: () => _showQuoteDialog(order['id']),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryAccent,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        ),
                        child: const Text('Review Quote & Approve', style: TextStyle(color: Colors.white, fontSize: 12)),
                      )
                    else if (status == 'APPROVED')
                      ElevatedButton.icon(
                        onPressed: () => context.push('/tracking/${order['id']}'),
                        icon: const Icon(Icons.map, size: 16, color: Colors.white),
                        label: const Text('Track Tech', style: TextStyle(color: Colors.white, fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.success,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      )
                    else if (status == 'COMPLETED')
                      Row(
                        children: [
                          OutlinedButton(
                            onPressed: () => context.push('/payment/${order['id']}?amount=450'),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppTheme.primaryAccent),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('Invoice/Pay', style: TextStyle(color: AppTheme.primaryAccent, fontSize: 12)),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () => context.push('/review/${order['id']}'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.success,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('Write Review', style: TextStyle(color: Colors.white, fontSize: 12)),
                          ),
                        ],
                      )
                    else
                      const SizedBox(),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: () => context.push('/chat/${order['id']}'),
                      icon: const Icon(Icons.chat_bubble_outline, size: 16, color: AppTheme.primaryAccent),
                      label: const Text('Chat with Technician', style: TextStyle(color: AppTheme.primaryAccent, fontSize: 12)),
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

  Future<void> _showQuoteDialog(String orderId) async {
    final client = ApiClient();
    final details = await client.get('/api/customer/orders/$orderId');
    final quote = details['order']?['quotes']?[0] ?? {
      'repairCost': 250.0,
      'partsCost': 150.0,
      'laborCost': 100.0,
      'discount': 50.0,
      'finalPrice': 450.0,
      'notes': 'Charging port assembly needs replacement'
    };

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Quote Details',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark),
              ),
              const SizedBox(height: 16),
              _buildQuoteItem('Parts Cost', 'AED ${quote['partsCost']}'),
              _buildQuoteItem('Labor Cost', 'AED ${quote['laborCost']}'),
              _buildQuoteItem('Discount', '- AED ${quote['discount']}', isDiscount: true),
              const Divider(color: AppTheme.borderDark, height: 24),
              _buildQuoteItem('Final Price', 'AED ${quote['finalPrice']}', isTotal: true),
              const SizedBox(height: 12),
              Text(
                'Notes: ${quote['notes']}',
                style: const TextStyle(fontSize: 12, color: AppTheme.textMutedDark, fontStyle: FontStyle.italic),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Quote rejected. Technician will contact you.')),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTheme.danger),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('Reject', style: TextStyle(color: AppTheme.danger)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        Navigator.pop(context);
                        await client.post('/api/customer/orders/$orderId/approve-quote', {});
                        _loadOrders();
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Quote Approved! Technician is assigned.')),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.success,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('Approve', style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuoteItem(String label, String value, {bool isDiscount = false, bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: isTotal ? 16 : 14, fontWeight: isTotal ? FontWeight.bold : FontWeight.normal, color: isTotal ? AppTheme.textPrimaryDark : AppTheme.textMutedDark)),
          Text(
            value,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: FontWeight.bold,
              color: isTotal
                  ? AppTheme.textPrimaryDark
                  : isDiscount
                      ? AppTheme.success
                      : AppTheme.textPrimaryDark,
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}
