#!/bin/bash
# generate_changelog.sh
# Bumps the version and generates the matching changelog.
#
# Usage:
#   ./generate_changelog.sh                  → bump build number + debug changelog
#   ./generate_changelog.sh --prod           → bump patch version + production changelog

set -e

if [[ "${1}" == "--help" || "${1}" == "-h" ]]; then
  cat <<'EOF'
Usage: ./generate_changelog.sh [OPTION]

Bumps the version in pubspec.yaml and generates the matching changelog.

Options:
  (no arguments)     DEBUG mode — increments the build number (+1),
                     reads the conventional commits since the last debug tag,
                     opens the editor so you can review them and saves the changelog to:
                       assets/changelog/debug/debug_<version>+<build>.md
                     Also creates a git tag: debug-<version>+<build>

  --prod             PRODUCTION mode — increments the patch version and resets
                     the build to 1, gathers all the debug entries of the
                     previous version into a single draft and opens the editor
                     so you can write the final text in English.
                     Saves the result to:
                       assets/changelog/changelog.md  (prepended)
                     Also creates a git tag: v<new-version>

  --help, -h         Show this help.

Supported commit formats (Conventional Commits):
  feat:      → New features
  fix:       → Bug fixes
  perf:      → Performance
  refactor:  → Refactoring
  chore:     → Maintenance
  (others)   → Other

Examples:
  ./generate_changelog.sh           # bump to 1.0.0+8, debug changelog
  ./generate_changelog.sh --prod    # bump to 1.0.1+1, production changelog
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

# ── DEBUG MODE ────────────────────────────────────────────────────────────────

if ! $PROD; then
  NEW_BUILD=$((BUILD + 1))
  NEW_VERSION="${VERSION}+${NEW_BUILD}"

  echo "=== DEBUG changelog: $CURRENT → $NEW_VERSION ==="

  LAST_DEBUG_TAG=$(git tag --sort=-version:refname | grep -E "^debug-${VERSION}\+[0-9]+" | head -1)
  RAW_COMMITS=$(commits_since "$LAST_DEBUG_TAG")

  if [ -z "$RAW_COMMITS" ]; then
    echo "There are no new commits since ${LAST_DEBUG_TAG:-the beginning}."
    echo "Do you want to write the entry manually? (y/N)"
    read -r MANUAL
    if [[ "$MANUAL" =~ ^[yY]$ ]]; then
      RAW_COMMITS="# Write the changes here (delete this line)"
    else
      echo "Aborted."
      exit 0
    fi
  fi

  FORMATTED=$(format_commits "$RAW_COMMITS")

  DRAFT=$(mktemp /tmp/changelog_draft.XXXXXX.md)
  cat > "$DRAFT" <<EOF
## DEBUG ${NEW_VERSION} (${DATE})

${FORMATTED}
;; ── Instructions ───────────────────────────────────────────────────────────────
;; Edit the text above (in English).
;; Save and close the editor to continue.
EOF

  ${EDITOR:-nano} "$DRAFT"

  ENTRY=$(grep -v '^;;' "$DRAFT")
  rm -f "$DRAFT"

  if [ -z "$(echo "$ENTRY" | tr -d '[:space:]')" ]; then
    echo "Empty entry — aborted."
    exit 1
  fi

  # Bump the version
  bump_version "$NEW_VERSION"
  echo "✓ Version: $CURRENT → $NEW_VERSION"

  # Save the changelog
  DEBUG_FILE="${DEBUG_DIR}/debug_${NEW_VERSION}.md"
  echo "$ENTRY" > "$DEBUG_FILE"
  echo "✓ Saved to ${DEBUG_FILE}"

  # Tag git
  if git tag "debug-${NEW_VERSION}" 2>/dev/null; then
    echo "✓ Tag git: debug-${NEW_VERSION}"
  else
    echo "  (tag debug-${NEW_VERSION} already existed)"
  fi

  echo ""
  echo "Done. Now run: ./deploy.sh debug android|ios"
  exit 0
fi

# ── PRODUCTION MODE ───────────────────────────────────────────────────────────

NEW_PATCH=$((PATCH + 1))
NEW_BUILD=$((BUILD + 1))
NEW_VERSION="${MAJOR}.${MINOR}.${NEW_PATCH}+${NEW_BUILD}"

echo "=== PRODUCTION changelog: $CURRENT → $NEW_VERSION ==="

LAST_PROD_TAG=$(last_prod_tag)
if [ -n "$LAST_PROD_TAG" ]; then
  echo "Last release: ${LAST_PROD_TAG}"
else
  echo "There are no previous releases — all the available debug entries will be used."
fi

# Gather all the debug files of the current version
AGGREGATED=""
DEBUG_FILES=()
for f in $(ls -v "${DEBUG_DIR}"/debug_${VERSION}+*.md 2>/dev/null); do
  DEBUG_FILES+=("$f")
  AGGREGATED+=$(cat "$f")
  AGGREGATED+=$'\n\n---\n\n'
done

if [ ${#DEBUG_FILES[@]} -eq 0 ]; then
  echo "There are no debug files for v${VERSION}. Write the changelog from scratch."
fi

DRAFT=$(mktemp /tmp/changelog_prod_draft.XXXXXX.md)
cat > "$DRAFT" <<EOF
## ${MAJOR}.${MINOR}.${NEW_PATCH} (${DATE})

${AGGREGATED}
;; ── Instructions ───────────────────────────────────────────────────────────────
;; The above is the aggregation of the debug entries. Edit it (in English) so it
;; becomes a clean text that end users can read.
;; Remove duplicates and technical jargon, and group by topic.
;; Save and close to continue.
EOF

${EDITOR:-nano} "$DRAFT"
EN_ENTRY=$(grep -v '^;;' "$DRAFT")
rm -f "$DRAFT"

if [ -z "$(echo "$EN_ENTRY" | tr -d '[:space:]')" ]; then
  echo "Empty entry — aborted."
  exit 1
fi

# Bump the version
bump_version "$NEW_VERSION"
echo "✓ Version: $CURRENT → $NEW_VERSION"

# Save the production changelog
PROD_FILE="${CHANGELOG_DIR}/changelog.md"
prepend_to_file "$PROD_FILE" "$EN_ENTRY"
echo "✓ Updated: ${PROD_FILE}"

# Tag git
if git tag "v${MAJOR}.${MINOR}.${NEW_PATCH}" 2>/dev/null; then
  echo "✓ Tag git: v${MAJOR}.${MINOR}.${NEW_PATCH}"
else
  echo "  (tag v${MAJOR}.${MINOR}.${NEW_PATCH} already existed)"
fi

# Archive the debug entries of the previous version
ARCHIVE_DIR="${DEBUG_DIR}/archived"
mkdir -p "$ARCHIVE_DIR"
for f in "${DEBUG_DIR}"/debug_${VERSION}+*.md; do
  [[ -f "$f" ]] && mv "$f" "$ARCHIVE_DIR/" && echo "  → archived: $(basename "$f")"
done

echo ""
echo "Done. Now run: ./deploy.sh prod android|ios|all"
