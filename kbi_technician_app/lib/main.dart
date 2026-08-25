import 'dart:ui';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

import 'firebase_options.dart';
import 'src/app.dart';
import 'src/services/fcm_service.dart';

/// Point the app at a locally running Firebase emulator suite.
///
/// Build with `--dart-define=USE_FIREBASE_EMULATOR=true` for local development;
/// production builds leave this off and talk to the real project.
const _useEmulator = bool.fromEnvironment('USE_FIREBASE_EMULATOR');
const _emulatorHost = String.fromEnvironment(
  'FIREBASE_EMULATOR_HOST',
  defaultValue: 'localhost',
);

Future<void> _connectToEmulators() async {
  FirebaseFirestore.instance.useFirestoreEmulator(_emulatorHost, 8080);
  await FirebaseAuth.instance.useAuthEmulator(_emulatorHost, 9099);
  FirebaseFunctions.instance.useFunctionsEmulator(_emulatorHost, 5001);
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  FlutterError.onError = (details) {
    FlutterError.presentError(details);
  };
  PlatformDispatcher.instance.onError = (error, stack) {
    debugPrint('Unhandled application error: $error\n$stack');
    return true;
  };

  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    if (_useEmulator) {
      await _connectToEmulators();
    }
    try {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    } catch (e) {
      debugPrint('FCM background handler initialization note: $e');
    }
  } catch (e, stack) {
    debugPrint('Firebase initialization error: $e\n$stack');
  }

  runApp(const KbiTechnicianApp());
}
