import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: "AIzaSyAHIaqGWUpjrQzfv1Y6BJl59S3u48gpchg",
      authDomain: "kbi2-f4f19.firebaseapp.com",
      projectId: "kbi2-f4f19",
      storageBucket: "kbi2-f4f19.firebasestorage.app",
      messagingSenderId: "1078380307626",
      appId: "1:1078380307626:web:d5b860d9f1abcb54fa9cd3",
    ),
  );
  runApp(
    const ProviderScope(
      child: KbiCustomerApp(),
    ),
  );
}

class KbiCustomerApp extends ConsumerWidget {
  const KbiCustomerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'KBI Services Customer',
      theme: AppTheme.darkTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
