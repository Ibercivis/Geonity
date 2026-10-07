#!/bin/bash
# deploy.sh
# Builds and uploads the app. The version must already be bumped by generate_changelog.sh.
#
# Usage:
#   ./deploy.sh debug android              → debug APK → scp to the server
#   ./deploy.sh debug ios                  → debug IPA → scp to the server
#   ./deploy.sh prod android               → release APK (arm64) → scp to the server
#   ./deploy.sh prod android --store       → release AAB → ready for the Play Store
#   ./deploy.sh prod ios                   → release IPA → scp to the server
#   ./deploy.sh prod ios --store           → release IPA → ready for the App Store
#   ./deploy.sh prod all                   → arm64 APK + IPA → scp to the server
#   ./deploy.sh prod all --store           → AAB + IPA → ready for the stores

set -e

if [[ "${1}" == "--help" || "${1}" == "-h" ]]; then
  cat <<'EOF'
Usage: ./deploy.sh [MODE] [PLATFORM] [--store]

Builds the app and uploads it to the server.
The version must already be bumped by generate_changelog.sh.

Modes:
  debug    Builds a debug APK/IPA with the current version in pubspec.yaml.
  prod     Builds a release with the current version in pubspec.yaml.

Platforms:
  android  Build for Android
  ios      Build for iOS
  all      Build for both platforms (prod mode only)

Options:
  --store    (prod only) Instead of uploading to the server with scp, leave
             the artifacts ready to be uploaded manually to the stores:
               Android → build/app/outputs/bundle/release/app-release.aab
                         (Play Console)
               iOS     → build/ios/ipa/*.ipa
                         (Transporter.app o Xcode → Distribute App)
             Bumps the build number before building (the stores reject
             repeated builds).
  --help, -h   Show this help.

Behaviour:
  - Aborts if there is no changelog for the current version.
  - Without --store: builds and uploads to the server with scp.
  - With --store: builds and leaves the artifact ready for the store.

Correct flow:
  1. ./generate_changelog.sh [--prod]        <- bumps the version + generates the changelog
  2. ./deploy.sh [debug|prod] [platform]     <- builds and uploads to the server
     ./deploy.sh prod [platform] --store     <- builds for manual upload to the store

Examples:
  ./deploy.sh debug android
  ./deploy.sh prod android
  ./deploy.sh prod android --store
  ./deploy.sh prod ios --store
  ./deploy.sh prod all
  ./deploy.sh prod all --store
EOF
  exit 0
fi

MODE="${1:-debug}"
PLATFORM="${2:-android}"
STORE=false
[[ "${3}" == "--store" ]] && STORE=true

# ── Validation ────────────────────────────────────────────────────────────────

if [[ "$MODE" != "debug" && "$MODE" != "prod" ]]; then
  echo "Usage: ./deploy.sh [debug|prod] [android|ios|all]"
  echo "     ./deploy.sh --help  for more information"
  exit 1
fi

if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" && "$PLATFORM" != "all" ]]; then
  echo "Usage: ./deploy.sh [debug|prod] [android|ios|all]"
  echo "     ./deploy.sh --help  for more information"
  exit 1
fi

if [[ "$MODE" == "debug" && "$PLATFORM" == "all" ]]; then
  echo "Debug mode does not support 'all'. Use 'android' or 'ios'."
  echo "     ./deploy.sh --help  for more information"
  exit 1
fi

if [[ "$STORE" == true && "$MODE" != "prod" ]]; then
  echo "✗ --store is only valid in prod mode."
  echo "     ./deploy.sh --help  for more information"
  exit 1
fi

# ── Read the current version ───────────────────────────────────────────────────────

PUBSPEC="pubspec.yaml"
CURRENT=$(grep '^version:' "$PUBSPEC" | sed 's/version: //')
VERSION=$(echo "$CURRENT" | cut -d'+' -f1)
BUILD=$(echo "$CURRENT" | cut -d'+' -f2)

echo "Version: $CURRENT [${MODE}/${PLATFORM}]"

# ── Bump the build number for the Store ─────────────────────────────────────────────

if [[ "$STORE" == true ]]; then
  NEW_BUILD=$((BUILD + 1))
  NEW_VERSION="${VERSION}+${NEW_BUILD}"
  sed -i '' "s/^version: .*/version: ${NEW_VERSION}/" "$PUBSPEC"
  BUILD=$NEW_BUILD
  CURRENT=$NEW_VERSION
  echo "✓ Build bumped → $CURRENT"
fi

# ── Check the changelog ───────────────────────────────────────────────────────

CHANGELOG_DIR="assets/changelog"
DEBUG_DIR="${CHANGELOG_DIR}/debug"

if [[ "$MODE" == "debug" ]]; then
  EXPECTED="${DEBUG_DIR}/debug_${VERSION}+${BUILD}.md"
  if [[ ! -f "$EXPECTED" ]]; then
    echo "✗ There is no changelog for v${VERSION}+${BUILD}."
    echo "  Run first: ./generate_changelog.sh"
    exit 1
  fi
else
  PROD_CHANGELOG="${CHANGELOG_DIR}/changelog.md"
  if [[ ! -f "$PROD_CHANGELOG" ]]; then
    echo "✗ There is no production changelog."
    echo "  Run first: ./generate_changelog.sh --prod"
    exit 1
  fi
  if ! grep -q "## ${VERSION}" "$PROD_CHANGELOG"; then
    echo "✗ The changelog has no entry for v${VERSION}."
    echo "  Run first: ./generate_changelog.sh --prod"
    exit 1
  fi
fi

# ── Build ──────────────────────────────────────────────────────────────────

compile_android() {
  if [[ "$MODE" == "prod" && "$STORE" == true ]]; then
    echo "Building AAB (Play Store)..."
    flutter build appbundle --release
    OUTPUT="build/app/outputs/bundle/release/app-release.aab"
  elif [[ "$MODE" == "prod" ]]; then
    echo "Building release APK (arm64)..."
    flutter build apk --release --target-platform android-arm64
    OUTPUT="build/app/outputs/flutter-apk/app-release.apk"
  else
    echo "Building APK (debug)..."
    flutter build apk --debug
    OUTPUT="build/app/outputs/flutter-apk/app-debug.apk"
  fi
}

compile_ios() {
  if [[ "$MODE" == "prod" ]]; then
    echo "Building iOS (release archive)..."
    rm -f build/ios/ipa/*.ipa 2>/dev/null
    flutter build ipa --release
    OUTPUT=$(find build/ios/ipa -name "*.ipa" 2>/dev/null | head -1)
  else
    echo "Building iOS (debug)..."
    flutter build ios --debug --no-codesign
    OUTPUT="build/ios/iphoneos/Runner.app"
  fi
}

upload() {
  local file="$1"
  if [[ -z "$file" || ! -e "$file" ]]; then
    echo "✗ Artifact not found: $file"
    exit 1
  fi
  echo "Uploading $(basename "$file") to the server..."
  scp -r "$file" ubuntu@api.ibercivis.es:/home/ubuntu/geonity/downloads/
  echo "✓ Upload complete: $(basename "$file")"
}

ANDROID_OK=false
IOS_OK=false

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
  if compile_android; then
    ANDROID_OK=true
    ANDROID_OUTPUT="$OUTPUT"
  else
    echo "✗ Android build failed"
    exit 1
  fi
fi

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
  if compile_ios; then
    IOS_OK=true
    IOS_OUTPUT="$OUTPUT"
  else
    echo "✗ iOS build failed"
    exit 1
  fi
fi

# ── Upload ─────────────────────────────────────────────────────────────────────

if $ANDROID_OK; then
  if $STORE; then
    echo ""
    echo "✓ AAB ready for the Play Store:"
    echo "  $(pwd)/${ANDROID_OUTPUT}"
    echo ""
    echo "  Upload it manually at: https://play.google.com/console"
    echo "  App → Production → Create new release → Upload AAB"
  else
    upload "$ANDROID_OUTPUT"
  fi
fi

if $IOS_OK; then
  if $STORE; then
    echo ""
    echo "✓ IPA ready for the App Store:"
    echo "  $(pwd)/${IOS_OUTPUT}"
    echo ""
    echo "  Upload it manually with one of these options:"
    echo "    1. Transporter.app → drag the .ipa in"
    echo "    2. Xcode → Window → Organizer → Distribute App → App Store Connect"
    echo "    3. xcrun altool --upload-app --type ios --file <ipa> \\"
    echo "         --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>"
  else
    upload "$IOS_OUTPUT"
  fi
fi

echo ""
echo "✓ Deploy complete — v${CURRENT} [${MODE}/${PLATFORM}${STORE:+ store}]"
