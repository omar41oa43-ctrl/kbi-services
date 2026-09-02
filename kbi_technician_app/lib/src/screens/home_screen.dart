import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme.dart';
import '../widgets/liquid_glass.dart';
import 'dashboard_screen.dart';
import 'jobs_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';
import 'wallet_screen.dart';

class HomeScreen extends StatefulWidget {
  final Locale locale;
  final void Function(Locale) onLocaleChanged;
  final int initialIndex;

  const HomeScreen({
    super.key,
    required this.onLocaleChanged,
    required this.locale,
    this.initialIndex = 0,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const _wideLayoutBreakpoint = 720.0;

  late int _index;
  late List<Widget> _pages;
  late final Stream<List<ConnectivityResult>> _connectivityStream;
  List<ConnectivityResult> _lastConnectivity = const [ConnectivityResult.wifi];
  Stream<QuerySnapshot<Map<String, dynamic>>>? _notificationsStream;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _buildPages();
    _connectivityStream = Connectivity().onConnectivityChanged;
    Connectivity().checkConnectivity().then((res) {
      if (mounted) setState(() => _lastConnectivity = res);
    });
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid != null) {
      _notificationsStream = FirebaseFirestore.instance
          .collection('notifications')
          .where('userId', isEqualTo: uid)
          .where('isRead', isEqualTo: false)
          .limit(100)
          .snapshots();
    }
  }

  @override
  void didUpdateWidget(covariant HomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.locale != widget.locale) _buildPages();
  }

  void _buildPages() {
    _pages = [
      DashboardScreen(
        onLocaleChanged: widget.onLocaleChanged,
        locale: widget.locale,
        onNavigate: _selectTab,
      ),
      JobsScreen(
        onLocaleChanged: widget.onLocaleChanged,
        locale: widget.locale,
      ),
      const WalletScreen(),
      const NotificationsScreen(),
      ProfileScreen(
        onLocaleChanged: widget.onLocaleChanged,
        locale: widget.locale,
      ),
    ];
  }

  void _selectTab(int index) {
    if (index == _index || index < 0 || index >= _pages.length) return;
    HapticFeedback.selectionClick();
    setState(() => _index = index);
  }

  @override
  Widget build(BuildContext context) {
    final isAr = widget.locale.languageCode == 'ar';

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
        stream: _notificationsStream,
        builder: (context, notificationsSnap) {
          final unread = notificationsSnap.data?.docs.length ?? 0;
          return LayoutBuilder(builder: (context, constraints) {
            final useSidebar = constraints.maxWidth >= _wideLayoutBreakpoint;
            if (useSidebar) {
              return Scaffold(
                backgroundColor: Colors.transparent,
                body: Row(
                  children: [
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 8, 16),
                        child: _NavigationGlass(
                          axis: Axis.vertical,
                          selectedIndex: _index,
                          unread: unread,
                          isAr: isAr,
                          onSelected: _selectTab,
                        ),
                      ),
                    ),
                    Expanded(
                      child: _pageBody(),
                    ),
                  ],
                ),
              );
            }

            return Scaffold(
              backgroundColor: Colors.transparent,
              extendBody: false,
              body: SafeArea(
                bottom: false,
                child: LiquidGlassBackdrop(child: _pageBody()),
              ),
              bottomNavigationBar: DecoratedBox(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.98),
                  border: const Border(
                    top: BorderSide(color: Color(0xFFE5E7EB), width: 0.7),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 18,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: SafeArea(
                  top: false,
                  minimum: const EdgeInsets.fromLTRB(8, 4, 8, 4),
                  child: _NavigationGlass(
                    axis: Axis.horizontal,
                    selectedIndex: _index,
                    unread: unread,
                    isAr: isAr,
                    onSelected: _selectTab,
                  ),
                ),
              ),
            );
          });
        },
      ),
    );
  }

  Widget _pageBody() {
    return StreamBuilder<List<ConnectivityResult>>(
      stream: _connectivityStream,
      initialData: _lastConnectivity,
      builder: (context, snapshot) {
        final results = snapshot.data ?? _lastConnectivity;
        final isOffline = results.isNotEmpty &&
            results.every((result) => result == ConnectivityResult.none);
        return Stack(
          children: [
            Positioned.fill(
              child: IndexedStack(index: _index, children: _pages),
            ),
            if (isOffline)
              PositionedDirectional(
                bottom: 14,
                start: 16,
                end: 16,
                child: Center(
                  child: Semantics(
                    liveRegion: true,
                    label: widget.locale.languageCode == 'ar'
                        ? 'أنت غير متصل. ستتم مزامنة التغييرات لاحقاً.'
                        : 'You are offline. Changes will sync later.',
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 420),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 9,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xEB1C1C1E),
                        borderRadius: BorderRadius.circular(999),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.18),
                            blurRadius: 14,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.cloud_off_rounded,
                            color: Colors.white,
                            size: 15,
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              widget.locale.languageCode == 'ar'
                                  ? 'غير متصل • ستتم المزامنة تلقائياً'
                                  : 'Offline • changes sync automatically',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _NavigationGlass extends StatelessWidget {
  final Axis axis;
  final int selectedIndex;
  final int unread;
  final bool isAr;
  final ValueChanged<int> onSelected;

  const _NavigationGlass({
    required this.axis,
    required this.selectedIndex,
    required this.unread,
    required this.isAr,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final destinations = [
      (
        icon: CupertinoIcons.house,
        selectedIcon: CupertinoIcons.house_fill,
        en: 'Home',
        ar: 'الرئيسية',
      ),
      (
        icon: CupertinoIcons.doc_text,
        selectedIcon: CupertinoIcons.doc_text_fill,
        en: 'Orders',
        ar: 'الطلبات',
      ),
      (
        icon: CupertinoIcons.creditcard,
        selectedIcon: CupertinoIcons.creditcard_fill,
        en: 'Wallet',
        ar: 'المحفظة',
      ),
      (
        icon: CupertinoIcons.bell,
        selectedIcon: CupertinoIcons.bell_fill,
        en: 'Inbox',
        ar: 'الإشعارات',
      ),
      (
        icon: CupertinoIcons.person_crop_circle,
        selectedIcon: CupertinoIcons.person_crop_circle_fill,
        en: 'Profile',
        ar: 'حسابي',
      ),
    ];

    final children = List.generate(destinations.length, (index) {
      final destination = destinations[index];
      return _NavigationItem(
        selected: selectedIndex == index,
        icon: destination.icon,
        selectedIcon: destination.selectedIcon,
        label: isAr ? destination.ar : destination.en,
        badgeCount: index == 3 ? unread : 0,
        axis: axis,
        onTap: () => onSelected(index),
      );
    });

    final navigationContent = axis == Axis.horizontal
        ? Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: children.map((child) => Expanded(child: child)).toList(),
          )
        : LayoutBuilder(
            builder: (context, constraints) {
              final showLogo = constraints.maxHeight >= 430;
              return SingleChildScrollView(
                child: SizedBox(
                  width: 76,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (showLogo)
                        Container(
                          width: 40,
                          height: 40,
                          margin: const EdgeInsets.only(bottom: 14),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [kbiBlue, kbiBlueDark],
                            ),
                            borderRadius: BorderRadius.circular(13),
                            boxShadow: [
                              BoxShadow(
                                color: kbiBlue.withValues(alpha: 0.28),
                                blurRadius: 14,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          alignment: Alignment.center,
                          child: const Text(
                            'K',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ...children,
                    ],
                  ),
                ),
              );
            },
          );

    if (axis == Axis.horizontal) return navigationContent;

    return LiquidGlassSurface(
      borderRadius: BorderRadius.circular(26),
      blur: 30,
      tint: Colors.white.withValues(alpha: 0.9),
      borderColor: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      child: navigationContent,
    );
  }
}

class _NavigationItem extends StatelessWidget {
  final bool selected;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final int badgeCount;
  final Axis axis;
  final VoidCallback onTap;

  const _NavigationItem({
    required this.selected,
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.badgeCount,
    required this.axis,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.disableAnimationsOf(context) ||
        MediaQuery.accessibleNavigationOf(context);
    final duration =
        reduceMotion ? Duration.zero : const Duration(milliseconds: 200);

    return Semantics(
      button: true,
      selected: selected,
      label: label,
      child: Tooltip(
        message: label,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: onTap,
            child: AnimatedContainer(
              duration: duration,
              curve: Curves.easeOutCubic,
              constraints: BoxConstraints(
                minHeight: axis == Axis.horizontal ? 54 : 62,
                minWidth: 48,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 5),
              decoration: BoxDecoration(
                color: selected
                    ? kbiBlue.withValues(alpha: 0.09)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      AnimatedSwitcher(
                        duration: duration,
                        child: Icon(
                          selected ? selectedIcon : icon,
                          key: ValueKey(selected),
                          size: 22,
                          color: selected ? kbiBlue : const Color(0xFF94A3B8),
                        ),
                      ),
                      if (badgeCount > 0)
                        PositionedDirectional(
                          top: -6,
                          end: -8,
                          child: Container(
                            constraints: const BoxConstraints(minWidth: 16),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 3,
                              vertical: 1,
                            ),
                            decoration: BoxDecoration(
                              color: kbiBlue,
                              borderRadius: BorderRadius.circular(999),
                              border:
                                  Border.all(color: Colors.white, width: 1.5),
                            ),
                            child: Text(
                              badgeCount > 99 ? '99+' : '$badgeCount',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 8.5,
                                height: 1.2,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: selected ? kbiBlue : const Color(0xFF94A3B8),
                      fontSize: 11,
                      height: 1.1,
                      fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
