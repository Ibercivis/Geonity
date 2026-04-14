import 'dart:convert';

/// Parses a server error response body into a human-readable string.
/// Handles DRF formats:
///   {"field": ["msg"]}  →  "field: msg"
///   {"detail": "msg"}   →  "msg"
///   {"error": "msg"}    →  "msg"
///   "plain string"      →  "plain string"
String parseServerError(String responseBody) {
  if (responseBody.isEmpty) return '';
  try {
    final decoded = jsonDecode(responseBody);
    if (decoded is String) return decoded;
    if (decoded is Map) {
      // Single "detail" or "error" key
      if (decoded.containsKey('detail')) return decoded['detail'].toString();
      if (decoded.containsKey('error')) return decoded['error'].toString();
      // Field errors — join them all
      final parts = <String>[];
      decoded.forEach((key, value) {
        if (value is List) {
          parts.add(value.map((e) => e.toString()).join(', '));
        } else {
          parts.add(value.toString());
        }
      });
      return parts.join('\n');
    }
  } catch (_) {}
  return responseBody;
}
