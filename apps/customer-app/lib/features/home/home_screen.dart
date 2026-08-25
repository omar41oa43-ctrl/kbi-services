import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_service.dart';
import '../../core/theme/app_theme.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authService = ref.watch(authServiceProvider);
    final user = authService.currentUser;

    final List<Map<String, dynamic>> services = [
      {'name': 'Mobile Repair', 'icon': Icons.phone_android, 'color': AppTheme.primaryAccent},
      {'name': 'Laptop Repair', 'icon': Icons.laptop, 'color': Colors.blueAccent},
      {'name': 'Printer Repair', 'icon': Icons.print, 'color': Colors.tealAccent},
      {'name': 'TV Repair', 'icon': Icons.tv, 'color': Colors.orangeAccent},
      {'name': 'Gaming Console', 'icon': Icons.sports_esports, 'color': Colors.purpleAccent},
      {'name': 'CCTV Setup', 'icon': Icons.videocam, 'color': Colors.redAccent},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('KBI Services'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () => context.push('/profile'),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(authServiceProvider).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Section
            Text(
              'Welcome, ${user?.name ?? 'Customer'}!',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimaryDark,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'What needs fixing today?',
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.textMutedDark,
              ),
            ),
            const SizedBox(height: 24),

            // Booking Quick Access Card
            Card(
              elevation: 4,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: LinearGradient(
                    colors: [AppTheme.primaryAccent.withOpacity(0.2), Colors.transparent],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Row(
                  children: [
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Fast On-Site Repairs',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'We come to you anywhere in Abu Dhabi.',
                            style: TextStyle(fontSize: 13, color: AppTheme.textMutedDark),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () => context.push('/book'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryAccent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Book Now', style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Services Grid Section
            const Text(
              'Our Main Services',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark),
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.9,
              ),
              itemCount: services.length,
              itemBuilder: (context, index) {
                final svc = services[index];
                return InkWell(
                  onTap: () => context.push('/book?category=${Uri.encodeComponent(svc['name'])}'),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceDark,
                      border: Border.all(color: AppTheme.borderDark),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(svc['icon'], size: 36, color: svc['color']),
                        const SizedBox(height: 8),
                        Text(
                          svc['name'],
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimaryDark),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 24),

            // Navigation Options List
            const Text(
              'Quick Actions',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark),
            ),
            const SizedBox(height: 12),
            _buildActionTile(
              context,
              icon: Icons.track_changes,
              title: 'Track Active Repairs',
              subtitle: 'Check real-time repair and technician progress',
              route: '/orders',
            ),
            _buildActionTile(
              context,
              icon: Icons.security,
              title: 'Manage Warranties',
              subtitle: 'View warranty durations & request warranty services',
              route: '/warranty',
            ),
            _buildActionTile(
              context,
              icon: Icons.percent,
              title: 'Exclusive Offers',
              subtitle: 'Up to 20% off on laptop cleaning and TV mounting',
              route: '/',
              isOffer: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionTile(BuildContext context,
      {required IconData icon, required String title, required String subtitle, required String route, bool isOffer = false}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, color: isOffer ? AppTheme.warning : AppTheme.primaryAccent, size: 28),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textPrimaryDark)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textMutedDark)),
        trailing: const Icon(Icons.chevron_right, color: AppTheme.textMutedDark),
        onTap: () {
          if (route != '/') {
            context.push(route);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Offer applied automatically to your next booking!')),
            );
          }
        },
      ),
    );
  }
}
