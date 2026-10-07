#!/usr/bin/env bash
# Deploys the admin panel and records which version was deployed.
#
#   npm run deploy                       builds and deploys (requires no uncommitted changes in admin/)
#   bash scripts/deploy.sh --dry-run     builds and shows what rsync would change, without touching the server
#   bash scripts/deploy.sh --allow-dirty deploys even with uncommitted changes (marked "dirty", no tag)
#
# What it leaves behind:
#   - dist/version.json  ->  https://<host>/version.json  (commit, branch, date, whether it was dirty, who)
#   - a git tag  admin/deploy-YYYY-MM-DD-HHMM  on the deployed commit (not created for a dirty deploy)
#   - a line in ~/geonity-admin-deploys.log on the server (outside the folder that rsync --delete cleans)
#
# The server (REMOTE_HOST) is a machine shared with other projects: this script only writes to REMOTE_DIR
# and to that log.
set -Eeuo pipefail

REMOTE_USER="${REMOTE_USER:-ubuntu}"
REMOTE_HOST="${REMOTE_HOST:-geonity-admin.ibercivis.es}"
REMOTE_DIR="${REMOTE_DIR:-/home/ubuntu/geonity-backend}"
REMOTE_LOG="${REMOTE_LOG:-/home/ubuntu/geonity-admin-deploys.log}"
SSH_TARGET="${REMOTE_USER}@${REMOTE_HOST}"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

ALLOW_DIRTY=0
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --allow-dirty) ALLOW_DIRTY=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help) sed -n '2,14p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "Unknown option: $arg (use --help)" >&2; exit 2 ;;
  esac
done

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 1; }
}
require_cmd npm
require_cmd rsync
require_cmd ssh
require_cmd git

cd "$PROJECT_DIR"

COMMIT="$(git rev-parse HEAD)"
SHORT="$(git rev-parse --short HEAD)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
WHO="$(git config user.name || whoami)"

# 1. What gets deployed must be reproducible: no uncommitted changes in admin/.
DIRTY_FILES="$(git status --porcelain -- .)"
DIRTY=false
if [ -n "$DIRTY_FILES" ]; then
  DIRTY=true
  if [ "$ALLOW_DIRTY" -eq 0 ]; then
    echo "✗ There are uncommitted changes in admin/ (the deploy could not be rebuilt from git):" >&2
    echo "$DIRTY_FILES" | head -15 >&2
    COUNT="$(echo "$DIRTY_FILES" | wc -l | tr -d ' ')"
    [ "$COUNT" -gt 15 ] && echo "  … and $((COUNT - 15)) more" >&2
    echo >&2
    echo "Commit them, or use --allow-dirty (it will be recorded as \"dirty\")." >&2
    exit 1
  fi
  echo "⚠ Deploying with uncommitted changes (--allow-dirty): it will be marked as dirty."
fi

# 2. Build and put the version inside the build.
echo "==> Building $SHORT ($BRANCH)..."
npm run build

BUILT_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cat > dist/version.json <<JSON
{
  "app": "geonity-admin",
  "commit": "$COMMIT",
  "short": "$SHORT",
  "branch": "$BRANCH",
  "dirty": $DIRTY,
  "builtAt": "$BUILT_AT",
  "deployedBy": "$WHO"
}
JSON

# 3. Upload.
if [ "$DRY_RUN" -eq 1 ]; then
  echo "==> Dry run: this would change on ${SSH_TARGET}:${REMOTE_DIR}/ (nothing is touched):"
  rsync -avzn --delete dist/ "${SSH_TARGET}:${REMOTE_DIR}/"
  exit 0
fi

echo "==> Syncing dist/ to ${SSH_TARGET}:${REMOTE_DIR}/"
rsync -avz --delete dist/ "${SSH_TARGET}:${REMOTE_DIR}/"

# 4. Record the deploy (if any of this fails the deploy is already done: warn and carry on).
TAG="admin/deploy-$(date -u +%Y-%m-%d-%H%M)"
ssh "$SSH_TARGET" "echo '$BUILT_AT admin $SHORT branch=$BRANCH dirty=$DIRTY by=$WHO' >> $REMOTE_LOG" \
  || echo "⚠ Could not write the log on the server."
if [ "$DIRTY" = false ]; then
  if git tag -a "$TAG" -m "Admin deploy $SHORT ($BUILT_AT)"; then
    git push origin "$TAG" 2>/dev/null && echo "Tag $TAG pushed." || echo "Tag $TAG created locally (run: git push origin $TAG)."
  else
    echo "⚠ Could not create the tag $TAG."
  fi
else
  echo "Dirty deploy: no tag is created."
fi

echo "==> Done: https://${REMOTE_HOST}/   (version: https://${REMOTE_HOST}/version.json)"
