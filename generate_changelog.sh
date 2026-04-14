#!/bin/bash
# generate_changelog.sh
# Bumpa la versión y genera el changelog correspondiente.
#
# Uso:
#   ./generate_changelog.sh                  → bump build number + changelog debug
#   ./generate_changelog.sh --prod           → bump patch version + changelog producción

set -e

if [[ "${1}" == "--help" || "${1}" == "-h" ]]; then
  cat <<'EOF'
Uso: ./generate_changelog.sh [OPCIÓN]

Bumpa la versión en pubspec.yaml y genera el changelog correspondiente.

Opciones:
  (sin argumentos)   Modo DEBUG — incrementa el build number (+1),
                     lee los commits convencionales desde el último tag debug,
                     abre el editor para revisarlos y guarda el changelog en:
                       assets/changelog/debug/debug_<version>+<build>.md
                     Crea también un tag git: debug-<version>+<build>

  --prod             Modo PRODUCCIÓN — incrementa el patch version y resetea
                     build a 1, agrega todos los entries debug de la versión
                     anterior en un único borrador, abre el editor para que
                     escribas el texto final en inglés.
                     Guarda el resultado en:
                       assets/changelog/changelog.md  (prepend)
                     Crea también un tag git: v<nueva-version>

  --help, -h         Muestra esta ayuda.

Formatos de commit soportados (Conventional Commits):
  feat:      → New features
  fix:       → Bug fixes
  perf:      → Performance
  refactor:  → Refactoring
  chore:     → Maintenance
  (otros)    → Other

Ejemplos:
  ./generate_changelog.sh           # bump a 1.0.0+8, changelog debug
  ./generate_changelog.sh --prod    # bump a 1.0.1+1, changelog producción
EOF
  exit 0
fi

PROD=false
[[ "${1}" == "--prod" ]] && PROD=true

PUBSPEC="pubspec.yaml"
CURRENT=$(grep '^version:' "$PUBSPEC" | sed 's/version: //')
VERSION=$(echo "$CURRENT" | cut -d'+' -f1)
BUILD=$(echo "$CURRENT" | cut -d'+' -f2)

MAJOR=$(echo "$VERSION" | cut -d'.' -f1)
MINOR=$(echo "$VERSION" | cut -d'.' -f2)
PATCH=$(echo "$VERSION" | cut -d'.' -f3)

DATE=$(date +%Y-%m-%d)

CHANGELOG_DIR="assets/changelog"
DEBUG_DIR="${CHANGELOG_DIR}/debug"
mkdir -p "$DEBUG_DIR"

# ── Helpers ──────────────────────────────────────────────────────────────────

last_prod_tag() {
  git tag --sort=-version:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1
}

commits_since() {
  local since="$1"
  if [ -z "$since" ]; then
    git log --oneline --pretty=format:"%s"
  else
    git log "${since}..HEAD" --oneline --pretty=format:"%s"
  fi
}

format_commits() {
  local commits="$1"
  local feat fix perf refactor chore other

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    if   [[ "$line" =~ ^feat(\(.+\))?!?:\ (.+) ]];     then feat+="- ${BASH_REMATCH[2]}"$'\n'
    elif [[ "$line" =~ ^fix(\(.+\))?!?:\ (.+) ]];      then fix+="- ${BASH_REMATCH[2]}"$'\n'
    elif [[ "$line" =~ ^perf(\(.+\))?!?:\ (.+) ]];     then perf+="- ${BASH_REMATCH[2]}"$'\n'
    elif [[ "$line" =~ ^refactor(\(.+\))?!?:\ (.+) ]]; then refactor+="- ${BASH_REMATCH[2]}"$'\n'
    elif [[ "$line" =~ ^chore(\(.+\))?!?:\ (.+) ]];    then chore+="- ${BASH_REMATCH[2]}"$'\n'
    else other+="- $line"$'\n'
    fi
  done <<< "$commits"

  local out=""
  [[ -n "$feat" ]]     && out+="### New features"$'\n'"$feat"$'\n'
  [[ -n "$fix" ]]      && out+="### Bug fixes"$'\n'"$fix"$'\n'
  [[ -n "$perf" ]]     && out+="### Performance"$'\n'"$perf"$'\n'
  [[ -n "$refactor" ]] && out+="### Refactoring"$'\n'"$refactor"$'\n'
  [[ -n "$chore" ]]    && out+="### Maintenance"$'\n'"$chore"$'\n'
  [[ -n "$other" ]]    && out+="### Other"$'\n'"$other"$'\n'

  echo "$out"
}

prepend_to_file() {
  local file="$1"
  local content="$2"
  local tmp
  tmp=$(mktemp)
  echo "$content" > "$tmp"
  [[ -f "$file" ]] && cat "$file" >> "$tmp"
  mv "$tmp" "$file"
}

bump_version() {
  sed -i '' "s/^version: .*/version: ${1}/" "$PUBSPEC"
}

revert_version() {
  sed -i '' "s/^version: .*/version: ${CURRENT}/" "$PUBSPEC"
}

# ── MODO DEBUG ────────────────────────────────────────────────────────────────

if ! $PROD; then
  NEW_BUILD=$((BUILD + 1))
  NEW_VERSION="${VERSION}+${NEW_BUILD}"

  echo "=== Changelog DEBUG: $CURRENT → $NEW_VERSION ==="

  LAST_DEBUG_TAG=$(git tag --sort=-version:refname | grep -E "^debug-${VERSION}\+[0-9]+" | head -1)
  RAW_COMMITS=$(commits_since "$LAST_DEBUG_TAG")

  if [ -z "$RAW_COMMITS" ]; then
    echo "No hay commits nuevos desde ${LAST_DEBUG_TAG:-el inicio}."
    echo "¿Quieres escribir el entry manualmente? (s/N)"
    read -r MANUAL
    if [[ "$MANUAL" =~ ^[sS]$ ]]; then
      RAW_COMMITS="# Escribe los cambios aquí (elimina esta línea)"
    else
      echo "Abortado."
      exit 0
    fi
  fi

  FORMATTED=$(format_commits "$RAW_COMMITS")

  DRAFT=$(mktemp /tmp/changelog_draft.XXXXXX.md)
  cat > "$DRAFT" <<EOF
## DEBUG ${NEW_VERSION} (${DATE})

${FORMATTED}
# ── Instrucciones ──────────────────────────────────────────────────────────────
# Edita el texto anterior en inglés.
# Guarda y cierra el editor para continuar.
EOF

  ${EDITOR:-nano} "$DRAFT"

  ENTRY=$(grep -v '^#' "$DRAFT")
  rm -f "$DRAFT"

  if [ -z "$(echo "$ENTRY" | tr -d '[:space:]')" ]; then
    echo "Entry vacío — abortado."
    exit 1
  fi

  # Bump versión
  bump_version "$NEW_VERSION"
  echo "✓ Versión: $CURRENT → $NEW_VERSION"

  # Guardar changelog
  DEBUG_FILE="${DEBUG_DIR}/debug_${NEW_VERSION}.md"
  echo "$ENTRY" > "$DEBUG_FILE"
  echo "✓ Guardado en ${DEBUG_FILE}"

  # Tag git
  if git tag "debug-${NEW_VERSION}" 2>/dev/null; then
    echo "✓ Tag git: debug-${NEW_VERSION}"
  else
    echo "  (tag debug-${NEW_VERSION} ya existía)"
  fi

  echo ""
  echo "Listo. Ahora ejecuta: ./deploy.sh debug android|ios"
  exit 0
fi

# ── MODO PRODUCCIÓN ───────────────────────────────────────────────────────────

NEW_PATCH=$((PATCH + 1))
NEW_VERSION="${MAJOR}.${MINOR}.${NEW_PATCH}+1"

echo "=== Changelog PRODUCCIÓN: $CURRENT → $NEW_VERSION ==="

LAST_PROD_TAG=$(last_prod_tag)
if [ -n "$LAST_PROD_TAG" ]; then
  echo "Último release: ${LAST_PROD_TAG}"
else
  echo "No hay releases previos — se usarán todos los debugs disponibles."
fi

# Agregar todos los ficheros debug de la versión actual
AGGREGATED=""
DEBUG_FILES=()
for f in $(ls -v "${DEBUG_DIR}"/debug_${VERSION}+*.md 2>/dev/null); do
  DEBUG_FILES+=("$f")
  AGGREGATED+=$(cat "$f")
  AGGREGATED+=$'\n\n---\n\n'
done

if [ ${#DEBUG_FILES[@]} -eq 0 ]; then
  echo "No hay ficheros debug para v${VERSION}. Escribe el changelog desde cero."
fi

DRAFT=$(mktemp /tmp/changelog_prod_draft.XXXXXX.md)
cat > "$DRAFT" <<EOF
## ${MAJOR}.${MINOR}.${NEW_PATCH} (${DATE})

${AGGREGATED}
# ── Instrucciones ──────────────────────────────────────────────────────────────
# Lo anterior es la agregación de los debugs. Edítalo en inglés para que sea
# un texto limpio y legible para el usuario final.
# Elimina duplicados, tecnicismos, y agrupa por tema.
# Guarda y cierra para continuar.
EOF

${EDITOR:-nano} "$DRAFT"
EN_ENTRY=$(grep -v '^#' "$DRAFT")
rm -f "$DRAFT"

if [ -z "$(echo "$EN_ENTRY" | tr -d '[:space:]')" ]; then
  echo "Entry vacío — abortado."
  exit 1
fi

# Bump versión
bump_version "$NEW_VERSION"
echo "✓ Versión: $CURRENT → $NEW_VERSION"

# Guardar changelog de producción
PROD_FILE="${CHANGELOG_DIR}/changelog.md"
prepend_to_file "$PROD_FILE" "$EN_ENTRY"
echo "✓ Actualizado: ${PROD_FILE}"

# Tag git
if git tag "v${MAJOR}.${MINOR}.${NEW_PATCH}" 2>/dev/null; then
  echo "✓ Tag git: v${MAJOR}.${MINOR}.${NEW_PATCH}"
else
  echo "  (tag v${MAJOR}.${MINOR}.${NEW_PATCH} ya existía)"
fi

# Archivar debugs de la versión anterior
ARCHIVE_DIR="${DEBUG_DIR}/archived"
mkdir -p "$ARCHIVE_DIR"
for f in "${DEBUG_DIR}"/debug_${VERSION}+*.md; do
  [[ -f "$f" ]] && mv "$f" "$ARCHIVE_DIR/" && echo "  → archivado: $(basename "$f")"
done

echo ""
echo "Listo. Ahora ejecuta: ./deploy.sh prod android|ios|all"
