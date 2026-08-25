import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'src/app.dart';

Future<void> main() async {
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
  runApp(const KbiTechnicianApp());
}
