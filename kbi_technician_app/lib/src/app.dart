import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import 'screens/approval_pending_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';
import 'screens/subscription_required_screen.dart';
import 'services/fcm_service.dart';
import 'theme.dart';

class KbiTechnicianApp extends StatefulWidget {
  const KbiTechnicianApp({super.key});

  @override
  State<KbiTechnicianApp> createState() => _KbiTechnicianAppState();
}

class _KbiTechnicianAppState extends State<KbiTechnicianApp> {
  Locale _locale = const Locale('en');

  void _setLocale(Locale locale) {
    setState(() {
      _locale = locale;
    });
  }

  @override
  void initState() {
    super.initState();
    FcmService.instance.init();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KBI Technician',
      theme: buildKbiTheme(),
      debugShowCheckedModeBanner: false,
      locale: _locale,
      home: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, snap) {
          final user = snap.data;
          if (user == null) {
            return AuthScreen(onLocaleChanged: _setLocale, locale: _locale);
          }
          return _TechnicianGate(uid: user.uid, onLocaleChanged: _setLocale, locale: _locale);
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
    final techRef = FirebaseFirestore.instance.collection('technicians').doc(uid);
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: techRef.snapshots(),
      builder: (context, snap) {
        if (snap.hasError) {
          return Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red, size: 60),
                    const SizedBox(height: 16),
                    Text(
                      'Database Error:\n${snap.error}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.redAccent, fontSize: 16),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => FirebaseAuth.instance.signOut(),
                      child: const Text('Log out'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }
        if (!snap.hasData) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        final data = snap.data?.data();
        final isApproved = data?['isApproved'] == true;
        final isActive = data?['isActive'] == true;
        final subscriptionStatus = (data?['subscriptionStatus'] ?? 'inactive').toString();

        if (!isApproved) {
          return ApprovalPendingScreen(onLocaleChanged: onLocaleChanged, locale: locale);
        }

        if (!isActive || subscriptionStatus != 'active') {
          return SubscriptionRequiredScreen(onLocaleChanged: onLocaleChanged, locale: locale);
        }

        return HomeScreen(onLocaleChanged: onLocaleChanged, locale: locale);
      },
    );
  }
}

