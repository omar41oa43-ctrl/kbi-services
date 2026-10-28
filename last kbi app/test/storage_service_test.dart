import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kbi_technician_app/src/services/storage_service.dart';

void main() {
  const base = 'https://example.supabase.co/functions/v1/technician-files';
  const id = '12345678-1234-1234-1234-123456789abc';
  test(
      'signed uploads send Firebase credentials only to the broker and confirm before success',
      () async {
    final calls = <String>[];
    final progress = <double>[];
    final client = MockClient((request) async {
      calls.add(request.method);
      if (calls.length == 1) {
        expect(request.headers['Authorization'], 'Bearer firebase-token');
        expect(jsonDecode(request.body)['category'], 'profile');
        return http.Response(
            jsonEncode({
              'id': id,
              'uploadUrl':
                  'https://example.supabase.co/storage/v1/object/upload/sign/file?token=upload-secret',
              'fileUrl': '$base/$id?token=download-secret'
            }),
            200);
      }
      if (calls.length == 2) {
        expect(request.headers.containsKey('Authorization'), false);
        expect(request.bodyBytes, [1, 2, 3]);
        return http.Response('{}', 200);
      }
      expect(request.url.toString(), '$base/$id/complete');
      return http.Response('{"success":true}', 200);
    });
    final service = StorageService.forTesting(
        client: client,
        getIdToken: () async => 'firebase-token',
        fileServiceUrl: base);
    expect(
        await service.uploadTechnicianFile(
            category: 'profile',
            fileName: 'photo.png',
            bytes: Uint8List.fromList([1, 2, 3]),
            onProgress: progress.add),
        '$base/$id?token=download-secret');
    expect(calls, ['POST', 'PUT', 'POST']);
    expect(progress.last, 1);
  });
  test('failed uploads never report success or send completion', () async {
    var calls = 0;
    final client = MockClient((request) async {
      calls++;
      if (calls == 1) {
        return http.Response(
            jsonEncode({
              'id': id,
              'uploadUrl':
                  'https://example.supabase.co/storage/v1/object/upload/sign/file',
              'fileUrl': '$base/$id?token=x'
            }),
            200);
      }
      return http.Response('quota exceeded', 413);
    });
    final service = StorageService.forTesting(
        client: client, getIdToken: () async => 'token', fileServiceUrl: base);
    await expectLater(
        service.uploadTechnicianFile(
            category: 'profile',
            fileName: 'a.jpg',
            bytes: Uint8List.fromList([1])),
        throwsStateError);
    expect(calls, 2);
  });
  test(
      'an untrusted upload destination is rejected before file bytes leave the device',
      () async {
    var calls = 0;
    final client = MockClient((request) async {
      calls++;
      return http.Response(
          jsonEncode({
            'id': id,
            'uploadUrl': 'https://attacker.example/upload',
            'fileUrl': '$base/$id?token=x'
          }),
          200);
    });
    final service = StorageService.forTesting(
        client: client, getIdToken: () async => 'token', fileServiceUrl: base);
    await expectLater(
        service.uploadTechnicianFile(
            category: 'profile',
            fileName: 'a.jpg',
            bytes: Uint8List.fromList([1])),
        throwsStateError);
    expect(calls, 1);
  });
}
