import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/api_client.dart';

class WarrantyScreen extends StatefulWidget {
  const WarrantyScreen({super.key});

  @override
  State<WarrantyScreen> createState() => _WarrantyScreenState();
}

class _WarrantyScreenState extends State<WarrantyScreen> {
  List<dynamic> _warranties = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadWarranties();
  }

  Future<void> _loadWarranties() async {
    final client = ApiClient();
    final response = await client.get('/api/customer/warranty');
    setState(() {
      _warranties = response['warranties'] ?? [];
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Warranty Management'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryAccent))
          : _warranties.isEmpty
              ? const Center(
                  child: Text('No active device warranties found.', style: TextStyle(color: AppTheme.textMutedDark)),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(20.0),
                  itemCount: _warranties.length,
                  itemBuilder: (context, index) {
                    final warranty = _warranties[index];
                    final order = warranty['order'] ?? {};
                    final device = order['devices'] != null && order['devices'].isNotEmpty
                        ? order['devices'][0]
                        : {'brand': 'Unknown', 'model': 'Device'};

                    final status = warranty['status'] ?? 'ACTIVE';
                    final expiryDate = DateTime.parse(warranty['endDate']);
                    final daysLeft = expiryDate.difference(DateTime.now()).inDays;

                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${device['brand']} ${device['model']}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.textPrimaryDark),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.success.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    status,
                                    style: const TextStyle(color: AppTheme.success, fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text('Order Number: ${order['orderNumber'] ?? 'KBI-XXXXXX'}', style: const TextStyle(color: AppTheme.textMutedDark, fontSize: 13)),
                            const SizedBox(height: 4),
                            Text('Warranty Start: ${warranty['startDate'].split('T')[0]}', style: const TextStyle(color: AppTheme.textMutedDark, fontSize: 13)),
                            Text('Warranty Expiry: ${warranty['endDate'].split('T')[0]}', style: const TextStyle(color: AppTheme.textMutedDark, fontSize: 13)),
                            const Divider(color: AppTheme.borderDark, height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '$daysLeft Days Left',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.warning, fontSize: 14),
                                ),
                                ElevatedButton(
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Warranty Service Requested! Support will contact you shortly.')),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primaryAccent,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  ),
                                  child: const Text('Request Service', style: TextStyle(color: Colors.white, fontSize: 12)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
