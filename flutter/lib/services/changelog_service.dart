import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ChangelogService {
  static const _key = 'last_seen_version';

  /// Returns true if the app version is newer than the last seen version,
  /// and updates the stored version to the current one.
  static Future<bool> checkAndMarkSeen() async {
    final info = await PackageInfo.fromPlatform();
    final current = info.version;
    final prefs = await SharedPreferences.getInstance();
    final lastSeen = prefs.getString(_key);

    if (lastSeen == null || lastSeen != current) {
      await prefs.setString(_key, current);
      return lastSeen != null; // only show if was already installed before
    }
    return false;
  }
}
