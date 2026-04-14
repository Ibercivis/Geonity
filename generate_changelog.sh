#!/bin/bash
# generate_changelog.sh
# Genera un entry de changelog a partir de commits convencionales.
#
# Uso:
#   ./generate_changelog.sh                  → changelog de debug (build actual)
#   ./generate_changelog.sh --prod           → changelog de producción (agrega debugs)

set -e

if [[ "${1}" == "--help" || "${1}" == "-h" ]]; then
  cat <<'EOF'
Uso: ./generate_changelog.sh [OPCIÓN]

Genera un entry de changelog a partir de commits convencionales.

Opciones:
  (sin argumentos)   Modo DEBUG — genera un entry para el build actual.
                     Lee los commits convencionales desde el último tag debug,
                     abre el editor para revisarlos y los guarda en:
                       assets/changelog/debug/debug_<version>+<build>.md
                     Crea también un tag git: debug-<version>+<build>

  --prod             Modo PRODUCCIÓN — agrega todos los entries debug de la
                     versión actual en un único borrador y abre el editor para
                     que escribas el texto final en inglés.
                     Guarda el resultado en:
                       assets/changelog/changelog.md  (prepend)
                     Crea también un tag git: v<version>

  --help, -h         Muestra esta ayuda.

Formatos de commit soportados (Conventional Commits):
  feat:      → sección "Novedades"
  fix:       → sección "Correcciones"
  perf:      → sección "Rendimiento"
  refactor:  → sección "Refactorizaciones"
  chore:     → sección "Mantenimiento"
  (otros)    → sección "Otros"

Ejemplos:
  ./generate_changelog.sh           # changelog debug del build actual
  ./generate_changelog.sh --prod    # changelog de producción v1.0.1
EOF
  exit 0
fi

PROD=false
[[ "${1}" == "--prod" ]] && PROD=true

PUBSPEC="pubspec.yaml"
CURRENT=$(grep '^version:' "$PUBSPEC" | sed 's/version: //')
VERSION=$(echo "$CURRENT" | cut -d'+' -f1)
BUILD=$(echo "$CURRENT" | cut -d'+' -f2)
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

# Agrupa commits convencionales en secciones Markdown
format_commits() {
  local commits="$1"
  local feat fix perf refactor chore other

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    if   [[ "$line" =~ ^feat(\(.+\))?!?:\ (.+) ]]; then feat+="- ${BASH_REMATCH[2]}"$'\n'
    elif [[ "$line" =~ ^fix(\(.+\))?!?:\ (.+) ]];  then fix+="- ${BASH_REMATCH[2]}"$'\n'
    elif [[ "$line" =~ ^perf(\(.+\))?!?:\ (.+) ]]; then perf+="- ${BASH_REMATCH[2]}"$'\n'
    elif [[ "$line" =~ ^refactor(\(.+\))?!?:\ (.+) ]]; then refactor+="- ${BASH_REMATCH[2]}"$'\n'
    elif [[ "$line" =~ ^chore(\(.+\))?!?:\ (.+) ]]; then chore+="- ${BASH_REMATCH[2]}"$'\n'
    else other+="- $line"$'\n'
    fi
  done <<< "$commits"

  local out=""
  [[ -n "$feat" ]]     && out+="### Novedades"$'\n'"$feat"$'\n'
  [[ -n "$fix" ]]      && out+="### Correcciones"$'\n'"$fix"$'\n'
  [[ -n "$perf" ]]     && out+="### Rendimiento"$'\n'"$perf"$'\n'
  [[ -n "$refactor" ]] && out+="### Refactorizaciones"$'\n'"$refactor"$'\n'
  [[ -n "$chore" ]]    && out+="### Mantenimiento"$'\n'"$chore"$'\n'
  [[ -n "$other" ]]    && out+="### Otros"$'\n'"$other"$'\n'

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

# ── MODO DEBUG ────────────────────────────────────────────────────────────────

if ! $PROD; then
  echo "=== Generando changelog DEBUG v${VERSION}+${BUILD} ==="

  # Commits desde el tag del último build de debug (o inicio del repo)
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

  # Fichero de borrador para que el usuario edite
  DRAFT=$(mktemp /tmp/changelog_draft.XXXXXX.md)
  cat > "$DRAFT" <<EOF
## DEBUG ${VERSION}+${BUILD} (${DATE})

${FORMATTED}
# ── Instrucciones ──────────────────────────────────────────────────────────────
# Edita el texto anterior en inglés.
# Guarda y cierra el editor para continuar.
EOF

  ${EDITOR:-nano} "$DRAFT"

  # Eliminar líneas de comentario (#) al inicio
  ENTRY=$(grep -v '^#' "$DRAFT")
  rm -f "$DRAFT"

  if [ -z "$(echo "$ENTRY" | tr -d '[:space:]')" ]; then
    echo "Entry vacío — abortado."
    exit 1
  fi

  # Guardar en fichero debug (solo español; es suficiente para QA interno)
  DEBUG_FILE="${DEBUG_DIR}/debug_${VERSION}+${BUILD}.md"
  echo "$ENTRY" > "$DEBUG_FILE"
  echo "✓ Guardado en ${DEBUG_FILE}"

  # Etiquetar en git para poder calcular rango después
  if git tag "debug-${VERSION}+${BUILD}" 2>/dev/null; then
    echo "✓ Tag git: debug-${VERSION}+${BUILD}"
  else
    echo "  (tag debug-${VERSION}+${BUILD} ya existía)"
  fi

  echo ""
  echo "Listo. Cuando hagas deploy debug, el changelog estará disponible."
  exit 0
fi

# ── MODO PRODUCCIÓN ───────────────────────────────────────────────────────────

echo "=== Generando changelog PRODUCCIÓN v${VERSION} ==="

# Recopilar todos los ficheros debug desde el último release
LAST_PROD_TAG=$(last_prod_tag)
if [ -n "$LAST_PROD_TAG" ]; then
  LAST_PROD_VERSION=$(echo "$LAST_PROD_TAG" | sed 's/^v//')
  echo "Último release: ${LAST_PROD_TAG}"
else
  echo "No hay releases previos — se usarán todos los debugs disponibles."
  LAST_PROD_VERSION=""
fi

# Juntar todos los ficheros debug en un borrador
AGGREGATED=""
DEBUG_FILES=()
for f in $(ls -v "${DEBUG_DIR}"/debug_*.md 2>/dev/null); do
  # Filtrar solo los posteriores al último prod (comparación de nombre de archivo)
  if [ -n "$LAST_PROD_VERSION" ]; then
    FILE_VERSION=$(basename "$f" | sed 's/^debug_//' | sed 's/\.md$//' | cut -d'+' -f1)
    # Incluir solo si la version del archivo == VERSION actual (misma serie de release)
    [[ "$FILE_VERSION" != "$VERSION" ]] && continue
  fi
  DEBUG_FILES+=("$f")
  AGGREGATED+=$(cat "$f")
  AGGREGATED+=$'\n\n---\n\n'
done

if [ ${#DEBUG_FILES[@]} -eq 0 ]; then
  echo "No hay ficheros debug para v${VERSION}. Escribe el changelog desde cero."
fi

DRAFT=$(mktemp /tmp/changelog_prod_draft.XXXXXX.md)
cat > "$DRAFT" <<EOF
## ${VERSION} (${DATE})

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

# Guardar en changelog único en inglés
PROD_FILE="${CHANGELOG_DIR}/changelog.md"
prepend_to_file "$PROD_FILE" "$EN_ENTRY"
echo "✓ Actualizado: ${PROD_FILE}"

# Tag de release
if git tag "v${VERSION}" 2>/dev/null; then
  echo "✓ Tag git: v${VERSION}"
else
  echo "  (tag v${VERSION} ya existía)"
fi

echo ""
echo "Changelog de producción generado para v${VERSION}."
echo "Ya puedes ejecutar: ./deploy.sh prod android|ios|all"
