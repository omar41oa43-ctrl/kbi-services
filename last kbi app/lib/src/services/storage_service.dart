import 'dart:typed_data';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';

class StorageService {
  StorageService._();

  static final instance = StorageService._();
  static const maxUploadBytes = 10 * 1024 * 1024;
  static const allowedExtensions = {'pdf', 'jpg', 'jpeg', 'png'};

  Future<String> uploadTechnicianFile({
    required String category,
    required String fileName,
    required Uint8List bytes,
    void Function(double progress)? onProgress,
  }) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) throw StateError('You must be signed in to upload files.');
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
