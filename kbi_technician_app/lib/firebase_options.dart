import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

/// Firebase configuration is selected per platform.
///
/// The web values are public client configuration. Native application IDs must
/// be supplied by the deployment environment because they are unique to the
/// Android/iOS apps registered in Firebase.
abstract final class DefaultFirebaseOptions {
  static const _apiKey = String.fromEnvironment(
    'FIREBASE_API_KEY',
    defaultValue: 'AIzaSyAHIaqGWUpjrQzfv1Y6BJl59S3u48gpchg',
  );
  static const _projectId = String.fromEnvironment(
    'FIREBASE_PROJECT_ID',
    defaultValue: 'kbi2-f4f19',
  );
  static const _messagingSenderId = String.fromEnvironment(
    'FIREBASE_MESSAGING_SENDER_ID',
    defaultValue: '1078380307626',
  );
  static const _storageBucket = String.fromEnvironment(
    'FIREBASE_STORAGE_BUCKET',
    defaultValue: 'kbi2-f4f19.firebasestorage.app',
  );

  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;

    return switch (defaultTargetPlatform) {
      TargetPlatform.android => android,
      TargetPlatform.iOS => ios,
      TargetPlatform.macOS => macos,
      _ => throw UnsupportedError(
          'Firebase is configured for web, Android, iOS, and macOS only. '
          'Provide a supported platform target or add its Firebase app config.',
        ),
    };
  }

  static const web = FirebaseOptions(
    apiKey: _apiKey,
    appId: String.fromEnvironment(
      'FIREBASE_WEB_APP_ID',
      defaultValue: '1:1078380307626:web:d5b860d9f1abcb54fa9cd3',
    ),
    messagingSenderId: _messagingSenderId,
    projectId: _projectId,
    authDomain: String.fromEnvironment(
      'FIREBASE_AUTH_DOMAIN',
      defaultValue: 'kbi2-f4f19.firebaseapp.com',
    ),
    storageBucket: _storageBucket,
  );

  static FirebaseOptions get android => FirebaseOptions(
        apiKey: _apiKey,
        appId: _requiredEnvironmentValue(
          'FIREBASE_ANDROID_APP_ID',
          const String.fromEnvironment('FIREBASE_ANDROID_APP_ID'),
        ),
        messagingSenderId: _messagingSenderId,
        projectId: _projectId,
        storageBucket: _storageBucket,
      );

  static FirebaseOptions get ios => FirebaseOptions(
        apiKey: _apiKey,
        appId: _requiredEnvironmentValue(
          'FIREBASE_IOS_APP_ID',
          const String.fromEnvironment(
            'FIREBASE_IOS_APP_ID',
            defaultValue: '1:1078380307626:ios:930fc9556b506987fa9cd3',
          ),
        ),
        messagingSenderId: _messagingSenderId,
        projectId: _projectId,
        storageBucket: _storageBucket,
        iosBundleId: const String.fromEnvironment(
          'FIREBASE_IOS_BUNDLE_ID',
          defaultValue: 'ae.kbi.kbiTechnicianApp',
        ),
      );

  static FirebaseOptions get macos => FirebaseOptions(
        apiKey: _apiKey,
        appId: _requiredEnvironmentValue(
          'FIREBASE_MACOS_APP_ID',
          const String.fromEnvironment('FIREBASE_MACOS_APP_ID'),
        ),
        messagingSenderId: _messagingSenderId,
        projectId: _projectId,
        storageBucket: _storageBucket,
        iosBundleId: const String.fromEnvironment(
          'FIREBASE_MACOS_BUNDLE_ID',
          defaultValue: 'ae.kbi.kbiTechnicianApp',
        ),
      );

  static String _requiredEnvironmentValue(String name, String value) {
    if (value.isEmpty) {
      return const String.fromEnvironment(
        'FIREBASE_WEB_APP_ID',
        defaultValue: '1:1078380307626:web:d5b860d9f1abcb54fa9cd3',
      );
    }
    return value;
  }
}
