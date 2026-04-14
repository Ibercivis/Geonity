/// Stub for dart:io types on web. These classes are never instantiated on web
/// because all callers guard with kIsWeb.
class File {
  File(String path);
  String get path => throw UnsupportedError('File not supported on web');
  Future<bool> exists() async => false;
  bool existsSync() => false;
  Future<File> copy(String newPath) => throw UnsupportedError('File not supported on web');
}

class Directory {
  Directory(String path);
  String get path => throw UnsupportedError('Directory not supported on web');
  Future<bool> exists() async => false;
  Future<Directory> create({bool recursive = false}) =>
      throw UnsupportedError('Directory not supported on web');
}
