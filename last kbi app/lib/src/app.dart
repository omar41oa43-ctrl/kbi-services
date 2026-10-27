import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
  bool _launchWelcomeSeen = false;
  bool _authShowLogin = false;
  bool _credentialsSubmitted = false;
  late final Stream<User?> _authStateStream;

  void _setLocale(Locale locale) {
    setState(() {
      _locale = locale;
    });
    unawaited(_saveLocale(locale));
  }

  Future<void> _saveLocale(Locale locale) async {
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString('app_language', locale.languageCode);
    } catch (error) {
      debugPrint('Unable to save language preference: $error');
    }
  }

  Future<void> _restoreLocale() async {
    final preferences = await SharedPreferences.getInstance();
    final languageCode = preferences.getString('app_language');
    if (!mounted || (languageCode != 'ar' && languageCode != 'en')) return;
    setState(() => _locale = Locale(languageCode!));
  }

  void _rememberAuthView(bool showLogin) {
    _authShowLogin = showLogin;
  }

  @override
  void initState() {
    super.initState();
    _authStateStream = _freshAuthenticationStream();
    unawaited(_restoreLocale().catchError((Object error) {
      debugPrint('Unable to restore language preference: $error');
    }));
    FcmService.instance.onNotificationOpened = _openNotifications;
    FcmService.instance.foregroundMessage.addListener(_showForegroundMessage);
    unawaited(FcmService.instance.init().catchError((Object error) {
      debugPrint('Notifications unavailable: $error');
    }));
  }

  Stream<User?> _freshAuthenticationStream() async* {
    // A technician must enter credentials for every new app session. Firebase
    // otherwise restores its persisted user and the welcome button can appear
    // to sign in without asking for an email or password.
    try {
      await FirebaseAuth.instance.signOut();
    } catch (error) {
      debugPrint('Could not clear the previous authentication session: $error');
    }
    yield* FirebaseAuth.instance.authStateChanges();
  }

  @override
  void dispose() {
    FcmService.instance.foregroundMessage
        .removeListener(_showForegroundMessage);
    FcmService.instance.onNotificationOpened = null;
    super.dispose();
  }

  void _openNotifications() {
    if (FirebaseAuth.instance.currentUser == null || !_credentialsSubmitted) {
      return;
    }
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
          notification?.title ??
              notification?.body ??
              (_locale.languageCode == 'ar'
                  ? 'إشعار جديد'
                  : 'New notification'),
        ),
        action: SnackBarAction(
          label: _locale.languageCode == 'ar' ? 'عرض' : 'View',
          onPressed: _openNotifications,
        ),
      ),
    );
  }

  bool _continueFromLaunchWelcome() {
    _launchWelcomeSeen = true;
    return false;
  }

  void _completeCredentialSignIn() {
    if (!mounted) return;
    setState(() {
      _launchWelcomeSeen = true;
      _authShowLogin = true;
      _credentialsSubmitted = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: appNavigatorKey,
      scaffoldMessengerKey: appScaffoldMessengerKey,
      title: 'KBI Technician',
      theme: buildKbiTheme(),
      highContrastTheme: buildKbiTheme(highContrast: true),
      themeMode: ThemeMode.dark,
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
        stream: _authStateStream,
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
              onSignedIn: _completeCredentialSignIn,
            );
          }
          if (user == null || !_credentialsSubmitted) {
            return AuthScreen(
              onLocaleChanged: _setLocale,
              locale: _locale,
              initialShowLoginForm: _authShowLogin,
              onViewChanged: _rememberAuthView,
              onSignedIn: _completeCredentialSignIn,
            );
          }
          return _TechnicianGate(
              key: ValueKey(user.uid),
              uid: user.uid,
              onLocaleChanged: _setLocale,
              locale: _locale);
        },
      ),
    );
  }
}

class _TechnicianGate extends StatefulWidget {
  final String uid;
  final Locale locale;
  final void Function(Locale) onLocaleChanged;

  const _TechnicianGate({
    super.key,
    required this.uid,
    required this.locale,
    required this.onLocaleChanged,
  });

  @override
  State<_TechnicianGate> createState() => _TechnicianGateState();
}

class _TechnicianGateState extends State<_TechnicianGate> {
  late Stream<DocumentSnapshot<Map<String, dynamic>>> _technicianStream;

  @override
  void initState() {
    super.initState();
    _technicianStream = FirebaseFirestore.instance
        .collection('technicians')
        .doc(widget.uid)
        .snapshots();
  }

  @override
  void didUpdateWidget(covariant _TechnicianGate oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.uid != widget.uid) {
      _technicianStream = FirebaseFirestore.instance
          .collection('technicians')
          .doc(widget.uid)
          .snapshots();
    }
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: _technicianStream,
      builder: (context, snap) {
        if (snap.hasError) {
          final isAr = widget.locale.languageCode == 'ar';
          return Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.cloud_off, size: 48),
                    const SizedBox(height: 16),
                    Text(
                        isAr
                            ? 'تعذر تحميل حسابك. تحقق من الاتصال.'
                            : 'Unable to load your account. Check your connection.',
                        textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: () => setState(() {
                        _technicianStream = FirebaseFirestore.instance
                            .collection('technicians')
                            .doc(widget.uid)
                            .snapshots();
                      }),
                      icon: const Icon(Icons.refresh),
                      label: Text(isAr ? 'إعادة المحاولة' : 'Retry'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }
        if (snap.connectionState == ConnectionState.waiting && !snap.hasData) {
          return const Scaffold(
            backgroundColor: kbiBlack,
            body: Center(
              child: CircularProgressIndicator(color: kbiBrand),
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
            onLocaleChanged: widget.onLocaleChanged,
            locale: widget.locale,
          );
        }

        return HomeScreen(
          onLocaleChanged: widget.onLocaleChanged,
          locale: widget.locale,
        );
      },
    );
  }
}
