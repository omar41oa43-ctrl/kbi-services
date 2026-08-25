import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

class FcmService {
  static final FcmService instance = FcmService._();
  FcmService._();

  Future<void> init() async {
    await FirebaseMessaging.instance.requestPermission();
    FirebaseMessaging.onMessage.listen((_) {});
    FirebaseAuth.instance.authStateChanges().listen((user) async {
      if (user == null) return;
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) return;
      try {
        await FirebaseFunctions.instance.httpsCallable('technicianUpdateFcmToken').call({'token': token});
      } catch (_) {}
    });
  }
}

