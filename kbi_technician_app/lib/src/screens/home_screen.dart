import 'dart:ui';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../i18n.dart';
import 'dashboard_screen.dart';
import 'jobs_screen.dart';
import 'wallet_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  final Locale locale;
  final void Function(Locale) onLocaleChanged;

  const HomeScreen({super.key, required this.onLocaleChanged, required this.locale});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    final isAr = widget.locale.languageCode == 'ar';

    final pages = [
      DashboardScreen(onLocaleChanged: widget.onLocaleChanged, locale: widget.locale),
      JobsScreen(onLocaleChanged: widget.onLocaleChanged, locale: widget.locale),
      const WalletScreen(),
      const NotificationsScreen(),
      ProfileScreen(onLocaleChanged: widget.onLocaleChanged, locale: widget.locale),
    ];

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFF070A0E),
        body: Stack(
          children: [
            // Preserves state of all tab pages using IndexedStack
            IndexedStack(
              index: _index,
              children: pages,
            ),
            
            // Floating Glassmorphic Bottom Navigation Bar
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0E131B).withOpacity(0.8),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.08),
                        width: 1.2,
                      ),
                    ),
                    child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                      stream: uid != null
                          ? FirebaseFirestore.instance
                              .collection('notifications')
                              .where('userId', isEqualTo: uid)
                              .where('isRead', isEqualTo: false)
                              .snapshots()
                          : const Stream.empty(),
                      builder: (context, notificationsSnap) {
                        final unreadNotificationsCount = notificationsSnap.data?.docs.length ?? 0;

                        return Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildNavItem(0, Icons.home_outlined, Icons.home, 'Home', 0),
                            _buildNavItem(1, Icons.assignment_outlined, Icons.assignment, 'Jobs', 0),
                            _buildNavItem(2, Icons.account_balance_wallet_outlined, Icons.account_balance_wallet, 'Wallet', 0),
                            _buildNavItem(3, Icons.notifications_outlined, Icons.notifications, 'Inbox', unreadNotificationsCount),
                            _buildNavItem(4, Icons.person_outline, Icons.person, 'Profile', 0),
                          ],
                        );
                      },
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData outlineIcon, IconData filledIcon, String label, int badgeCount) {
    final isSelected = _index == index;
    
    return InkWell(
      onTap: () {
        setState(() {
          _index = index;
        });
      },
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.cyanAccent.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isSelected ? filledIcon : outlineIcon,
                  color: isSelected ? Colors.cyanAccent : Colors.white38,
                  size: 22,
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: TextStyle(
                    color: isSelected ? Colors.cyanAccent : Colors.white38,
                    fontSize: 10,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ],
            ),
            if (badgeCount > 0)
              Positioned(
                top: -2,
                right: -2,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.redAccent,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Text(
                    badgeCount.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
