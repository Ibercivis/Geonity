#!/bin/bash
# deploy.sh
# Compila y sube la app. La versión ya debe estar bumpeada por generate_changelog.sh.
#
# Uso:
#   ./deploy.sh debug android              → APK debug → scp servidor
#   ./deploy.sh debug ios                  → IPA debug → scp servidor
#   ./deploy.sh prod android               → APK arm64 release → scp servidor
#   ./deploy.sh prod android --store       → AAB release → listo para Play Store
#   ./deploy.sh prod ios                   → IPA release → scp servidor
#   ./deploy.sh prod all                   → APK arm64 + IPA → scp servidor

set -e

if [[ "${1}" == "--help" || "${1}" == "-h" ]]; then
  cat <<'EOF'
Uso: ./deploy.sh [MODE] [PLATFORM] [--store]

Compila y sube la app al servidor.
La versión ya debe estar bumpeada por generate_changelog.sh.

Modos:
  debug    Compila APK/IPA de debug con la versión actual de pubspec.yaml.
  prod     Compila release con la versión actual de pubspec.yaml.

Plataformas:
  android  Compila para Android
  ios      Compila para iOS
  all      Compila para ambas plataformas (solo en modo prod)

Opciones:
  --store    (solo prod android) Genera AAB para Play Store en lugar de
             APK arm64 para el servidor. El fichero queda en:
               build/app/outputs/bundle/release/app-release.aab
             y NO se sube por scp — hay que subirlo manualmente a Play Console.
  --help, -h   Muestra esta ayuda.

Comportamiento:
  - Aborta si el changelog para la versión actual no existe.
  - Sin --store: compila APK arm64 y lo sube por scp al servidor.
  - Con --store: compila AAB y lo deja listo en build/ para Play Store.

Flujo correcto:
  1. ./generate_changelog.sh [--prod]        ← bumpa versión + genera changelog
  2. ./deploy.sh [debug|prod] [platform]     ← compila y sube al servidor
     ./deploy.sh prod android --store        ← compila AAB para Play Store

Ejemplos:
  ./deploy.sh debug android
  ./deploy.sh prod android
  ./deploy.sh prod android --store
  ./deploy.sh prod all
EOF
  exit 0
fi

MODE="${1:-debug}"
PLATFORM="${2:-android}"
STORE=false
[[ "${3}" == "--store" ]] && STORE=true

# ── Validación ────────────────────────────────────────────────────────────────

if [[ "$MODE" != "debug" && "$MODE" != "prod" ]]; then
  echo "Uso: ./deploy.sh [debug|prod] [android|ios|all]"
  echo "     ./deploy.sh --help  para más información"
  exit 1
fi

if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" && "$PLATFORM" != "all" ]]; then
  echo "Uso: ./deploy.sh [debug|prod] [android|ios|all]"
  echo "     ./deploy.sh --help  para más información"
  exit 1
fi

if [[ "$MODE" == "debug" && "$PLATFORM" == "all" ]]; then
  echo "Modo debug no admite 'all'. Usa 'android' o 'ios'."
  echo "     ./deploy.sh --help  para más información"
  exit 1
fi

if [[ "$STORE" == true && ( "$MODE" != "prod" || "$PLATFORM" != "android" ) ]]; then
  echo "✗ --store solo es válido con: ./deploy.sh prod android --store"
  exit 1
fi

# ── Leer versión actual ───────────────────────────────────────────────────────

PUBSPEC="pubspec.yaml"
CURRENT=$(grep '^version:' "$PUBSPEC" | sed 's/version: //')
VERSION=$(echo "$CURRENT" | cut -d'+' -f1)
BUILD=$(echo "$CURRENT" | cut -d'+' -f2)

echo "Versión: $CURRENT [${MODE}/${PLATFORM}]"

# ── Verificar changelog ───────────────────────────────────────────────────────

CHANGELOG_DIR="assets/changelog"
DEBUG_DIR="${CHANGELOG_DIR}/debug"

if [[ "$MODE" == "debug" ]]; then
  EXPECTED="${DEBUG_DIR}/debug_${VERSION}+${BUILD}.md"
  if [[ ! -f "$EXPECTED" ]]; then
    echo "✗ No hay changelog para v${VERSION}+${BUILD}."
    echo "  Ejecuta primero: ./generate_changelog.sh"
    exit 1
  fi
else
  PROD_CHANGELOG="${CHANGELOG_DIR}/changelog.md"
  if [[ ! -f "$PROD_CHANGELOG" ]]; then
    echo "✗ No hay changelog de producción."
    echo "  Ejecuta primero: ./generate_changelog.sh --prod"
    exit 1
  fi
  if ! grep -q "## ${VERSION}" "$PROD_CHANGELOG"; then
    echo "✗ El changelog no tiene entrada para v${VERSION}."
    echo "  Ejecuta primero: ./generate_changelog.sh --prod"
    exit 1
  fi
fi

# ── Compilar ──────────────────────────────────────────────────────────────────

compile_android() {
  if [[ "$MODE" == "prod" && "$STORE" == true ]]; then
    echo "Compilando AAB (Play Store)..."
    flutter build appbundle --release
    OUTPUT="build/app/outputs/bundle/release/app-release.aab"
  elif [[ "$MODE" == "prod" ]]; then
    echo "Compilando APK release (arm64)..."
    flutter build apk --release --target-platform android-arm64
    OUTPUT="build/app/outputs/flutter-apk/app-release.apk"
  else
    echo "Compilando APK (debug)..."
    flutter build apk --debug
    OUTPUT="build/app/outputs/flutter-apk/app-debug.apk"
  fi
}

compile_ios() {
  if [[ "$MODE" == "prod" ]]; then
    echo "Compilando iOS (release archive)..."
    flutter build ipa --release
    OUTPUT=$(find build/ios/ipa -name "*.ipa" 2>/dev/null | head -1)
  else
    echo "Compilando iOS (debug)..."
    flutter build ios --debug --no-codesign
    OUTPUT="build/ios/iphoneos/Runner.app"
  fi
}

upload() {
  local file="$1"
  if [[ -z "$file" || ! -e "$file" ]]; then
    echo "✗ No se encontró el artefacto: $file"
    exit 1
  fi
  echo "Subiendo $(basename "$file") al servidor..."
  scp -r "$file" ubuntu@api.ibercivis.es:/home/ubuntu/geonity/downloads/
  echo "✓ Upload completado: $(basename "$file")"
}

ANDROID_OK=false
IOS_OK=false

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
  if compile_android; then
    ANDROID_OK=true
    ANDROID_OUTPUT="$OUTPUT"
  else
    echo "✗ Error al compilar Android"
    exit 1
  fi
fi

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
  if compile_ios; then
    IOS_OK=true
    IOS_OUTPUT="$OUTPUT"
  else
    echo "✗ Error al compilar iOS"
    exit 1
  fi
fi

# ── Subir ─────────────────────────────────────────────────────────────────────

if $ANDROID_OK; then
  if $STORE; then
    echo ""
    echo "✓ AAB listo para Play Store:"
    echo "  $(pwd)/${ANDROID_OUTPUT}"
    echo ""
    echo "  Sube manualmente en: https://play.google.com/console"
    echo "  App → Producción → Crear nueva versión → Subir AAB"
  else
    upload "$ANDROID_OUTPUT"
  fi
fi

$IOS_OK && upload "$IOS_OUTPUT"

echo ""
echo "✓ Deploy completado — v${CURRENT} [${MODE}/${PLATFORM}${STORE:+ store}]"
