#!/bin/bash
# deploy.sh
#
# Uso:
#   ./deploy.sh debug android          → APK debug
#   ./deploy.sh debug ios              → IPA debug (simulador / Ad Hoc)
#   ./deploy.sh prod android           → AAB release
#   ./deploy.sh prod ios               → IPA release (archive)
#   ./deploy.sh prod all               → AAB + IPA release

set -e

if [[ "${1}" == "--help" || "${1}" == "-h" ]]; then
  cat <<'EOF'
Uso: ./deploy.sh [MODE] [PLATFORM]

Compila y sube la app al servidor. Requiere que el changelog esté generado
antes de ejecutar (usa generate_changelog.sh si no lo está).

Modos:
  debug    Incrementa el build number (+1). Genera APK/IPA de debug.
  prod     Incrementa el patch version y resetea build a 1.
           Genera AAB (Android) o IPA (iOS) de release.

Plataformas:
  android  Compila para Android  (debug → APK, prod → AAB)
  ios      Compila para iOS      (debug → Runner.app, prod → IPA)
  all      Compila para ambas plataformas (solo disponible en modo prod)

Opciones:
  --help, -h   Muestra esta ayuda.

Comportamiento:
  - Si el changelog no existe para la versión/modo, el script aborta
    indicando qué comando ejecutar primero.
  - Si la compilación falla, revierte automáticamente la versión en pubspec.yaml.
  - En modo prod, archiva los ficheros de changelog debug en debug/archived/.

Ejemplos:
  ./deploy.sh debug android        # APK debug, bump build number
  ./deploy.sh debug ios            # iOS debug, bump build number
  ./deploy.sh prod android         # AAB release, bump patch version
  ./deploy.sh prod ios             # IPA release, bump patch version
  ./deploy.sh prod all             # AAB + IPA release, bump patch version
EOF
  exit 0
fi

MODE="${1:-debug}"
PLATFORM="${2:-android}"

# ── Validación de argumentos ──────────────────────────────────────────────────

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

# ── Leer versión actual ───────────────────────────────────────────────────────

PUBSPEC="pubspec.yaml"
CURRENT=$(grep '^version:' "$PUBSPEC" | sed 's/version: //')
VERSION=$(echo "$CURRENT" | cut -d'+' -f1)
BUILD=$(echo "$CURRENT" | cut -d'+' -f2)

MAJOR=$(echo "$VERSION" | cut -d'.' -f1)
MINOR=$(echo "$VERSION" | cut -d'.' -f2)
PATCH=$(echo "$VERSION" | cut -d'.' -f3)

# ── Verificar changelog ───────────────────────────────────────────────────────

CHANGELOG_DIR="assets/changelog"
DEBUG_DIR="${CHANGELOG_DIR}/debug"

if [[ "$MODE" == "debug" ]]; then
  NEXT_BUILD=$((BUILD + 1))
  EXPECTED_CHANGELOG="${DEBUG_DIR}/debug_${VERSION}+${NEXT_BUILD}.md"

  # Permitir también el build actual (si ya se generó el changelog y no se bumpeó aún)
  CURRENT_CHANGELOG="${DEBUG_DIR}/debug_${VERSION}+${BUILD}.md"

  if [[ ! -f "$EXPECTED_CHANGELOG" && ! -f "$CURRENT_CHANGELOG" ]]; then
    echo "✗ No hay changelog para esta versión debug."
    echo "  Ejecuta primero: ./generate_changelog.sh"
    echo "  (esperado: ${EXPECTED_CHANGELOG} o ${CURRENT_CHANGELOG})"
    exit 1
  fi
else
  # Prod: verificar que existe el changelog de producción con la versión que se va a publicar
  NEXT_PATCH=$((PATCH + 1))
  PROD_CHANGELOG="${CHANGELOG_DIR}/changelog_es.md"

  if [[ ! -f "$PROD_CHANGELOG" ]]; then
    echo "✗ No hay changelog de producción."
    echo "  Ejecuta primero: ./generate_changelog.sh --prod"
    exit 1
  fi

  # Comprobar que el changelog tiene una entrada para la nueva versión
  NEXT_VERSION="${MAJOR}.${MINOR}.${NEXT_PATCH}"
  if ! grep -q "## ${NEXT_VERSION}" "$PROD_CHANGELOG"; then
    echo "✗ El changelog de producción no tiene entrada para v${NEXT_VERSION}."
    echo "  Ejecuta primero: ./generate_changelog.sh --prod"
    exit 1
  fi
fi

# ── Incrementar versión ───────────────────────────────────────────────────────

if [[ "$MODE" == "prod" ]]; then
  PATCH=$((PATCH + 1))
  BUILD=1
  NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}+${BUILD}"
else
  BUILD=$((BUILD + 1))
  NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}+${BUILD}"
fi

sed -i '' "s/^version: .*/version: ${NEW_VERSION}/" "$PUBSPEC"
echo "Versión: $CURRENT → $NEW_VERSION"

# ── Función de compilación ────────────────────────────────────────────────────

compile_android() {
  if [[ "$MODE" == "prod" ]]; then
    echo "Compilando AAB (release)..."
    flutter build appbundle --release
    OUTPUT="build/app/outputs/bundle/release/app-release.aab"
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

revert_version() {
  echo "Revirtiendo versión a $CURRENT..."
  sed -i '' "s/^version: .*/version: ${CURRENT}/" "$PUBSPEC"
}

# ── Compilar ──────────────────────────────────────────────────────────────────

ANDROID_OK=false
IOS_OK=false

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
  if compile_android; then
    ANDROID_OK=true
    ANDROID_OUTPUT="$OUTPUT"
  else
    echo "✗ Error al compilar Android"
    revert_version
    exit 1
  fi
fi

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
  if compile_ios; then
    IOS_OK=true
    IOS_OUTPUT="$OUTPUT"
  else
    echo "✗ Error al compilar iOS"
    revert_version
    exit 1
  fi
fi

# ── Subir artefactos ──────────────────────────────────────────────────────────

$ANDROID_OK && upload "$ANDROID_OUTPUT"
$IOS_OK     && upload "$IOS_OUTPUT"

# ── Limpiar ficheros debug tras release prod ──────────────────────────────────

if [[ "$MODE" == "prod" ]]; then
  echo "Archivando changelogs debug de v${VERSION}..."
  ARCHIVE_DIR="${DEBUG_DIR}/archived"
  mkdir -p "$ARCHIVE_DIR"
  for f in "${DEBUG_DIR}"/debug_${VERSION}+*.md; do
    [[ -f "$f" ]] && mv "$f" "$ARCHIVE_DIR/" && echo "  → $(basename "$f")"
  done
fi

echo ""
echo "✓ Deploy completado — v${NEW_VERSION} [${MODE}/${PLATFORM}]"
