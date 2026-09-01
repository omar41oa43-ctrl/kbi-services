import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/request_received_screen.dart';
import 'services/fcm_service.dart';
import 'theme.dart';
import 'widgets/liquid_glass.dart';

final appNavigatorKey = GlobalKey<NavigatorState>();
final appScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

class KbiTechnicianApp extends StatefulWidget {
  const KbiTechnicianApp({super.key});

  @override
  State<KbiTechnicianApp> createState() => _KbiTechnicianAppState();
}

class _KbiTechnicianAppState extends State<KbiTechnicianApp> {
  Locale _locale = const Locale('en');
  bool _launchWelcomeSeen = true;
  bool _authShowLogin = true;

  void _setLocale(Locale locale) {
    setState(() {
      _locale = locale;
    });
  }

  void _rememberAuthView(bool showLogin) {
    _authShowLogin = showLogin;
  }

  @override
  void initState() {
    super.initState();
    FcmService.instance.onNotificationOpened = _openNotifications;
    FcmService.instance.foregroundMessage.addListener(_showForegroundMessage);
    FcmService.instance.init();
  }

  @override
  void dispose() {
    FcmService.instance.foregroundMessage
        .removeListener(_showForegroundMessage);
    super.dispose();
  }

  void _openNotifications() {
    final navigator = appNavigatorKey.currentState;
    if (navigator == null) return;
    navigator.push(
      MaterialPageRoute<void>(builder: (_) => const NotificationsScreen()),
    );
  }

  void _showForegroundMessage() {
    final message = FcmService.instance.foregroundMessage.value;
    if (message == null) return;
    final notification = message.notification;
    appScaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(
        content: Text(
          notification?.title ?? notification?.body ?? 'New notification',
        ),
        action: SnackBarAction(
          label: 'View',
          onPressed: _openNotifications,
        ),
      ),
    );
  }

  bool _continueFromLaunchWelcome() {
    _launchWelcomeSeen = true;
    final hasSignedInUser = FirebaseAuth.instance.currentUser != null;
    if (hasSignedInUser) setState(() {});
    return hasSignedInUser;
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: appNavigatorKey,
      scaffoldMessengerKey: appScaffoldMessengerKey,
      title: 'KBI Technician',
      theme: buildKbiTheme(),
      highContrastTheme: buildKbiTheme(highContrast: true),
      themeAnimationDuration: const Duration(milliseconds: 240),
      themeAnimationCurve: Curves.easeOutCubic,
      debugShowCheckedModeBanner: false,
      locale: _locale,
      supportedLocales: const [Locale('en'), Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      builder: (context, child) => LiquidGlassBackdrop(child: child),
      home: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          final user = snap.data;
          if (!_launchWelcomeSeen) {
            return AuthScreen(
              onLocaleChanged: _setLocale,
              locale: _locale,
              onWelcomeContinue: _continueFromLaunchWelcome,
              initialShowLoginForm: _authShowLogin,
              onViewChanged: _rememberAuthView,
            );
          }
          if (user == null) {
            return AuthScreen(
              onLocaleChanged: _setLocale,
              locale: _locale,
              initialShowLoginForm: _authShowLogin,
              onViewChanged: _rememberAuthView,
            );
          }
          return _TechnicianGate(
              uid: user.uid, onLocaleChanged: _setLocale, locale: _locale);
        },
      ),
    );
  }
}

class _TechnicianGate extends StatelessWidget {
  final String uid;
  final Locale locale;
  final void Function(Locale) onLocaleChanged;

  const _TechnicianGate({
    required this.uid,
    required this.locale,
    required this.onLocaleChanged,
  });

  @override
  Widget build(BuildContext context) {
    final techRef =
        FirebaseFirestore.instance.collection('technicians').doc(uid);
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: techRef.snapshots(),
      builder: (context, snap) {
        if (snap.hasError) {
          // If profile doc is not yet provisioned in Firestore or awaiting initial approval
          return RequestReceivedScreen(
            onLocaleChanged: onLocaleChanged,
            locale: locale,
          );
        }
        if (snap.connectionState == ConnectionState.waiting && !snap.hasData) {
          return const Scaffold(
            backgroundColor: Color(0xFF0F172A),
            body: Center(
              child: CircularProgressIndicator(color: Color(0xFF0066FF)),
            ),
          );
        }
        final data = snap.data?.data();
        final rawStatus = (data?['status'] ?? data?['approvalStatus'] ?? '')
            .toString()
            .toUpperCase()
            .trim();
        final isApproved =
            (rawStatus == 'APPROVED' || data?['isApproved'] == true) &&
                data?['isActive'] != false &&
                data?['appAccessEnabled'] != false &&
                data?['isSuspended'] != true &&
                data?['isLocked'] != true &&
                rawStatus != 'SUSPENDED' &&
                rawStatus != 'REJECTED' &&
                rawStatus != 'DISABLED';

        if (data == null || !isApproved) {
          return RequestReceivedScreen(
            onLocaleChanged: onLocaleChanged,
            locale: locale,
          );
        }

        return HomeScreen(onLocaleChanged: onLocaleChanged, locale: locale);
      },
    );
  }
}
