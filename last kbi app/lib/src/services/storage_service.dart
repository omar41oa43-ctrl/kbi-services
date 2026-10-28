import 'dart:typed_data';
import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class StorageService {
  StorageService._();

  StorageService.forTesting(
      {required http.Client client,
      required Future<String?> Function() getIdToken,
      required String fileServiceUrl})
      : _client = client,
        _getIdToken = getIdToken,
        _fileServiceUrl = fileServiceUrl;

  http.Client? _client;
  Future<String?> Function()? _getIdToken;
  String? _fileServiceUrl;

  static final instance = StorageService._();
  static const maxUploadBytes = 10 * 1024 * 1024;
  static const allowedExtensions = {'pdf', 'jpg', 'jpeg', 'png'};

  Future<String> uploadTechnicianFile({
    required String category,
    required String fileName,
    required Uint8List bytes,
    void Function(double progress)? onProgress,
  }) async {
    if (bytes.isEmpty) {
      throw const FormatException('The selected file is empty.');
    }
    if (bytes.length > maxUploadBytes) {
      throw const FormatException('Files must be 10 MB or smaller.');
    }

    final extension = _extension(fileName);
    if (!allowedExtensions.contains(extension)) {
      throw const FormatException(
          'Only PDF, JPG, JPEG, and PNG files are allowed.');
    }

    final serviceUrl = _fileServiceUrl ?? AppConfig.technicianFileServiceUrl;
    if (serviceUrl.isNotEmpty) {
      return _uploadWithFileService(
          serviceUrl: serviceUrl,
          category: category,
          fileName: fileName,
          bytes: bytes,
          onProgress: onProgress);
    }
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) throw StateError('You must be signed in to upload files.');

    final safeName = fileName.replaceAll(RegExp(r'[^A-Za-z0-9._-]'), '_');
    final objectName = '${DateTime.now().millisecondsSinceEpoch}_$safeName';
    final reference = FirebaseStorage.instance
        .ref()
        .child('technicians/$uid/$category/$objectName');

    final task = reference.putData(
      bytes,
      SettableMetadata(
        contentType: _contentType(extension),
        customMetadata: {'ownerUid': uid, 'category': category},
      ),
    );
    final subscription = task.snapshotEvents.listen((snapshot) {
      if (snapshot.totalBytes > 0) {
        onProgress?.call(snapshot.bytesTransferred / snapshot.totalBytes);
      }
    });
    try {
      await task;
    } finally {
      await subscription.cancel();
    }
    return reference.getDownloadURL();
  }

  Future<String> _uploadWithFileService(
      {required String serviceUrl,
      required String category,
      required String fileName,
      required Uint8List bytes,
      void Function(double)? onProgress}) async {
    final user = _getIdToken == null ? FirebaseAuth.instance.currentUser : null;
    final token = await (_getIdToken?.call() ?? user?.getIdToken());
    if (token == null || token.isEmpty) {
      throw StateError('You must be signed in to upload files.');
    }
    final client = _client ?? http.Client();
    final headers = {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json'
    };
    Map<String, dynamic> responseBody(http.Response response) {
      Map<String, dynamic> body;
      try {
        body = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (_) {
        throw StateError('File service unavailable. Please try again.');
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw StateError(body['error']?.toString() ?? 'Unable to upload file.');
      }
      return body;
    }

    try {
      onProgress?.call(0);
      final prepared = responseBody(await client
          .post(Uri.parse(serviceUrl),
              headers: headers,
              body: jsonEncode({
                'category': category,
                'fileName': fileName,
                'size': bytes.length
              }))
          .timeout(const Duration(seconds: 30)));
      final uploadUrl = Uri.tryParse(prepared['uploadUrl']?.toString() ?? '');
      final fileUrl = Uri.tryParse(prepared['fileUrl']?.toString() ?? '');
      final base = Uri.parse(serviceUrl);
      final id = prepared['id']?.toString() ?? '';
      if (uploadUrl == null ||
          fileUrl == null ||
          uploadUrl.scheme != 'https' ||
          uploadUrl.host != base.host ||
          fileUrl.scheme != 'https' ||
          fileUrl.host != base.host ||
          !RegExp(r'^[0-9a-f-]{36}$').hasMatch(id)) {
        throw StateError('Invalid file service response.');
      }
      onProgress?.call(0.1);
      final uploaded = await client
          .put(uploadUrl,
              headers: {
                'Content-Type': _contentType(_extension(fileName)),
                'x-upsert': 'false'
              },
              body: bytes)
          .timeout(const Duration(minutes: 2));
      if (uploaded.statusCode < 200 || uploaded.statusCode >= 300) {
        throw StateError('Upload failed. Please try again.');
      }
      onProgress?.call(0.9);
      responseBody(await client
          .post(Uri.parse('$serviceUrl/$id/complete'), headers: headers)
          .timeout(const Duration(seconds: 30)));
      onProgress?.call(1);
      return fileUrl.toString();
    } finally {
      if (_client == null) client.close();
    }
  }

  Future<void> deleteTechnicianFiles() async {
    final serviceUrl = _fileServiceUrl ?? AppConfig.technicianFileServiceUrl;
    if (serviceUrl.isEmpty) return;
    final user = _getIdToken == null ? FirebaseAuth.instance.currentUser : null;
    final token = await (_getIdToken?.call() ?? user?.getIdToken());
    if (token == null || token.isEmpty) {
      throw StateError('You must be signed in.');
    }
    final client = _client ?? http.Client();
    try {
      final response = await client.delete(Uri.parse(serviceUrl), headers: {
        'Authorization': 'Bearer $token'
      }).timeout(const Duration(seconds: 60));
      if (response.statusCode != 200) {
        throw StateError('Unable to remove account files. Please try again.');
      }
    } finally {
      if (_client == null) client.close();
    }
  }

  String _extension(String fileName) {
    final separator = fileName.lastIndexOf('.');
    if (separator < 0 || separator == fileName.length - 1) return '';
    return fileName.substring(separator + 1).toLowerCase();
  }

  String _contentType(String extension) => switch (extension) {
        'pdf' => 'application/pdf',
        'jpg' || 'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        _ => 'application/octet-stream',
      };
}
