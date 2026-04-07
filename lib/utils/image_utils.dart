import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import '../config/app_config.dart';

/// M1: Shared helper to build full image URLs from relative API paths.
String getImageUrl(String? imagePath) {
  if (imagePath == null || imagePath.isEmpty) return '';
  if (imagePath.startsWith('http')) return imagePath;
  final cleanPath = imagePath.startsWith('/') ? imagePath : '/$imagePath';
  return '${AppConfig.baseUrl}$cleanPath';
}

/// Compresses [file] to a max of 2 MB (JPEG quality reduced iteratively).
/// Returns the compressed file, or the original if already under the limit.
Future<File> compressImageIfNeeded(File file) async {
  const maxBytes = 2 * 1024 * 1024; // 2 MB
  final originalSize = await file.length();
  if (originalSize <= maxBytes) return file;

  try {
    final dir = await getTemporaryDirectory();
    final targetPath = p.join(dir.path, 'compressed_${p.basename(file.path)}');

    final result = await FlutterImageCompress.compressAndGetFile(
      file.absolute.path,
      targetPath,
      quality: 85,
      format: CompressFormat.jpeg,
    );

    if (result == null) return file;

    // If still over limit, try lower quality
    final compressedFile = File(result.path);
    if (await compressedFile.length() > maxBytes) {
      final result2 = await FlutterImageCompress.compressAndGetFile(
        file.absolute.path,
        targetPath,
        quality: 60,
        format: CompressFormat.jpeg,
      );
      if (result2 != null) return File(result2.path);
    }

    return compressedFile;
  } catch (e) {
    debugPrint('Image compression error: $e');
    return file;
  }
}
