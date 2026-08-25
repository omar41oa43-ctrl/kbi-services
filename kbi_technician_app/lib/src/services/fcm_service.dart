import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

import '../../firebase_options.dart';
import '../config/app_config.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
}

class FcmService {
  static final FcmService instance = FcmService._();
  FcmService._();

  final ValueNotifier<RemoteMessage?> foregroundMessage = ValueNotifier(null);
  StreamSubscription<User?>? _authSubscription;
  StreamSubscription<String>? _tokenSubscription;
  StreamSubscription<RemoteMessage>? _messageSubscription;
  StreamSubscription<RemoteMessage>? _openedSubscription;
  bool _initialized = false;

  VoidCallback? onNotificationOpened;

  Future<void> init() async {
    if (_initialized || !_isSupportedPlatform) return;
    _initialized = true;

    _messageSubscription = FirebaseMessaging.onMessage.listen((message) {
      foregroundMessage.value = message;
    });
    _openedSubscription = FirebaseMessaging.onMessageOpenedApp.listen((_) {
      onNotificationOpened?.call();
    });

    final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        onNotificationOpened?.call();
      });
    }

    _authSubscription =
        FirebaseAuth.instance.authStateChanges().listen((user) async {
      if (user == null) {
        await _tokenSubscription?.cancel();
        _tokenSubscription = null;
        return;
      }

      try {
        final tech = await FirebaseFirestore.instance
            .collection('technicians')
            .doc(user.uid)
            .get();
        if (tech.data()?['notificationsEnabled'] == true) {
          await enableForCurrentUser(requestPermission: false);
        }
      } catch (error) {
        debugPrint('Unable to restore notification registration: $error');
      }
    });
  }

  Future<bool> enableForCurrentUser({bool requestPermission = true}) async {
    if (!_isSupportedPlatform) return false;
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return false;

    NotificationSettings settings;
    if (requestPermission) {
      settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
    } else {
      settings = await FirebaseMessaging.instance.getNotificationSettings();
    }

    final allowed =
        settings.authorizationStatus == AuthorizationStatus.authorized ||
            settings.authorizationStatus == AuthorizationStatus.provisional;
    if (!allowed) return false;

    if (kIsWeb && AppConfig.webVapidKey.isEmpty) {
      throw StateError(
        'FIREBASE_WEB_VAPID_KEY is required to enable web push notifications.',
      );
    }

    String? token;
    try {
      if (defaultTargetPlatform == TargetPlatform.iOS) {
        final apnsToken = await FirebaseMessaging.instance.getAPNSToken();
        if (apnsToken == null) {
          debugPrint('Notice: APNS token not yet available on this device/simulator. In-app notifications remain active.');
        }
      }
      token = await FirebaseMessaging.instance.getToken(
        vapidKey: kIsWeb ? AppConfig.webVapidKey : null,
      );
    } catch (tokenErr) {
      debugPrint('FCM getToken handled notice (e.g. simulator without APNS): $tokenErr');
    }

    if (token != null && token.isNotEmpty) {
      await _saveToken(token);
      await _tokenSubscription?.cancel();
      _tokenSubscription = FirebaseMessaging.instance.onTokenRefresh.listen(
        (newToken) => _saveToken(newToken),
        onError: (Object error) {
          debugPrint('FCM token refresh failed: $error');
        },
      );
    }
    return true;
  }

  Future<void> disableForCurrentUser() async {
    if (!_isSupportedPlatform) return;
    await _tokenSubscription?.cancel();
    _tokenSubscription = null;
    try {
      await FirebaseMessaging.instance.deleteToken();
      final uid = FirebaseAuth.instance.currentUser?.uid;
      if (uid != null) {
        await FirebaseFirestore.instance.collection('technicians').doc(uid).set({
          'fcmToken': null,
          'notificationsEnabled': false,
          'updatedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      }
      await FirebaseFunctions.instance
          .httpsCallable('technicianUpdateFcmToken')
          .call({'token': null, 'enabled': false});
    } catch (error) {
      debugPrint('Unable to disable notifications: $error');
    }
  }

  Future<void> _saveToken(String token) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid != null) {
      try {
        await FirebaseFirestore.instance.collection('technicians').doc(uid).set({
          'fcmToken': token,
          'notificationsEnabled': true,
          'updatedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      } catch (firestoreErr) {
        debugPrint('Direct Firestore FCM save notice: $firestoreErr');
      }
    }
    try {
      await FirebaseFunctions.instance
          .httpsCallable('technicianUpdateFcmToken')
          .call({'token': token, 'enabled': true});
    } catch (funcErr) {
      debugPrint('Cloud Function technicianUpdateFcmToken notice: $funcErr');
    }
  }

  bool get _isSupportedPlatform =>
      kIsWeb ||
      defaultTargetPlatform == TargetPlatform.android ||
      defaultTargetPlatform == TargetPlatform.iOS ||
      defaultTargetPlatform == TargetPlatform.macOS;

  Future<void> dispose() async {
    await _authSubscription?.cancel();
    await _tokenSubscription?.cancel();
    await _messageSubscription?.cancel();
    await _openedSubscription?.cancel();
    foregroundMessage.dispose();
  }
}
