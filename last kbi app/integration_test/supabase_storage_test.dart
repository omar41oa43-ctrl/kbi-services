import 'dart:convert';
import 'dart:typed_data';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:integration_test/integration_test.dart';
import 'package:kbi_technician_app/firebase_options.dart';
import 'package:kbi_technician_app/src/services/storage_service.dart';

const _token = String.fromEnvironment('TEST_CUSTOM_TOKEN');
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets(
      'iPhone app uploads PNG and PDF using Firebase login and private Supabase storage',
      (tester) async {
    expect(_token, isNotEmpty);
    try {
      await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform);
    } on FirebaseException catch (e) {
      if (e.code != 'duplicate-app') rethrow;
    }
    await FirebaseAuth.instance.signInWithCustomToken(_token);
    try {
      final urls = <String>[];
      final fixtures = {
        'native-test.png': base64Decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg=='),
        'native-test.pdf': Uint8List.fromList(
            utf8.encode('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF')),
      };
      for (final fixture in fixtures.entries) {
        final progress = <double>[];
        final url = await StorageService.instance.uploadTechnicianFile(
            category: 'profile',
            fileName: fixture.key,
            bytes: fixture.value,
            onProgress: progress.add);
        urls.add(url);
        expect(Uri.parse(url).host, 'ydxbojizwxpehzfgqbku.supabase.co');
        final downloaded = await http.get(Uri.parse(url));
        expect(downloaded.statusCode, 200);
        expect(downloaded.bodyBytes, fixture.value);
        expect(progress.last, 1);
      }
      await StorageService.instance.deleteTechnicianFiles();
      for (final url in urls) {
        expect((await http.get(Uri.parse(url))).statusCode, 404);
      }
    } finally {
      await FirebaseAuth.instance.signOut();
    }
  });
}
