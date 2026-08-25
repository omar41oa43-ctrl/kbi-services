import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_service.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/api_client.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _historyTabController;
  List<dynamic> _orders = [];
  List<dynamic> _warranties = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _historyTabController = TabController(length: 3, vsync: this);
    _loadHistoryData();
  }

  Future<void> _loadHistoryData() async {
    final client = ApiClient();
    final ordersResponse = await client.get('/api/customer/orders');
    final warrantyResponse = await client.get('/api/customer/warranty');
    
    setState(() {
      _orders = ordersResponse['orders'] ?? [];
      _warranties = warrantyResponse['warranties'] ?? [];
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final authService = ref.watch(authServiceProvider);
    final user = authService.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryAccent))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profile Header Info
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 36,
                        backgroundColor: AppTheme.primaryAccent,
                        child: Icon(Icons.person, size: 40, color: Colors.white),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(user?.name ?? 'John Doe', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
                          const SizedBox(height: 4),
                          Text(user?.email ?? 'john@example.com', style: const TextStyle(color: AppTheme.textMutedDark, fontSize: 13)),
                          Text(user?.phone ?? '0501234567', style: const TextStyle(color: AppTheme.textMutedDark, fontSize: 13)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Saved Addresses Section
                  const Text('Saved Addresses', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
                  const SizedBox(height: 12),
                  _buildAddressTile('Home', 'Villa 45, Street 12, Al Reem Island, Abu Dhabi'),
                  _buildAddressTile('Office', 'Level 14, HQ Building, Yas Island, Abu Dhabi'),
                  const SizedBox(height: 28),

                  // History Tabs
                  const Text('History Ledger', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
                  const SizedBox(height: 12),
                  TabBar(
                    controller: _historyTabController,
                    indicatorColor: AppTheme.primaryAccent,
                    labelColor: AppTheme.textPrimaryDark,
                    unselectedLabelColor: AppTheme.textMutedDark,
                    tabs: const [
                      Tab(text: 'Repairs'),
                      Tab(text: 'Payments'),
                      Tab(text: 'Warranties'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 220,
                    child: TabBarView(
                      controller: _historyTabController,
                      children: [
                        _buildRepairsHistoryList(),
                        _buildPaymentsHistoryList(),
                        _buildWarrantiesHistoryList(),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildAddressTile(String label, String address) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.location_on_outlined, color: AppTheme.primaryAccent),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textPrimaryDark)),
        subtitle: Text(address, style: const TextStyle(fontSize: 12, color: AppTheme.textMutedDark)),
        trailing: IconButton(
          icon: const Icon(Icons.edit_outlined, size: 18),
          onPressed: () {},
        ),
      ),
    );
  }

  Widget _buildRepairsHistoryList() {
    if (_orders.isEmpty) {
      return const Center(child: Text('No repair history.', style: TextStyle(color: AppTheme.textMutedDark)));
    }
    return ListView.builder(
      itemCount: _orders.length,
      itemBuilder: (context, index) {
        final order = _orders[index];
        return ListTile(
          title: Text(order['orderNumber'] ?? 'KBI-XXXXXX', style: const TextStyle(fontSize: 14, color: AppTheme.textPrimaryDark)),
          subtitle: Text(order['status'] ?? 'PENDING', style: const TextStyle(fontSize: 12)),
          trailing: Text(order['createdAt'].split('T')[0], style: const TextStyle(color: AppTheme.textMutedDark, fontSize: 12)),
        );
      },
    );
  }

  Widget _buildPaymentsHistoryList() {
    final completedPayments = _orders.where((o) => o['status'] == 'COMPLETED').toList();
    if (completedPayments.isEmpty) {
      return const Center(child: Text('No payment logs.', style: TextStyle(color: AppTheme.textMutedDark)));
    }
    return ListView.builder(
      itemCount: completedPayments.length,
      itemBuilder: (context, index) {
        final payment = completedPayments[index];
        return ListTile(
          leading: const Icon(Icons.check_circle, color: AppTheme.success, size: 20),
          title: Text(payment['orderNumber'] ?? 'KBI-XXXXXX', style: const TextStyle(fontSize: 14, color: AppTheme.textPrimaryDark)),
          subtitle: const Text('CREDIT_CARD', style: TextStyle(fontSize: 12)),
          trailing: const Text('AED 450.00', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.success)),
        );
      },
    );
  }

  Widget _buildWarrantiesHistoryList() {
    if (_warranties.isEmpty) {
      return const Center(child: Text('No warranties active.', style: TextStyle(color: AppTheme.textMutedDark)));
    }
    return ListView.builder(
      itemCount: _warranties.length,
      itemBuilder: (context, index) {
        final warranty = _warranties[index];
        return ListTile(
          title: Text(warranty['notes'] ?? 'Device Warranty', style: const TextStyle(fontSize: 14, color: AppTheme.textPrimaryDark)),
          subtitle: Text('Expires: ${warranty['endDate'].split('T')[0]}', style: const TextStyle(fontSize: 12)),
          trailing: Text(warranty['status'] ?? 'ACTIVE', style: const TextStyle(color: AppTheme.success, fontSize: 12, fontWeight: FontWeight.bold)),
        );
      },
    );
  }

  @override
  void dispose() {
    _historyTabController.dispose();
    super.dispose();
  }
}
