#!/bin/bash
# Deploys the React front end to production and records which version was deployed.
#
#   ./deploy.sh                 builds and deploys (requires no uncommitted changes in react/)
#   ./deploy.sh --dry-run       builds and shows what rsync would change, without touching the server
#   ./deploy.sh --allow-dirty   deploys even with uncommitted changes (it is marked as "dirty")
#
# What it leaves behind:
#   - dist/version.json  ->  https://geonity.ibercivis.es/version.json  (commit, branch, date, whether it was dirty, who)
#   - a git tag  deploy/react/YYYY-MM-DD-HHMM  on the deployed commit (not created for a dirty deploy)
#   - a line in /home/ubuntu/geonity-deploys.log on the server (outside the folder that rsync --delete cleans)
set -euo pipefail
cd "$(dirname "$0")"

REMOTE_USER="ubuntu"
REMOTE_HOST="api.ibercivis.es"
REMOTE_PATH="/home/ubuntu/geonity"
REMOTE_LOG="/home/ubuntu/geonity-deploys.log"

ALLOW_DIRTY=0
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --allow-dirty) ALLOW_DIRTY=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help) sed -n '2,13p' "$0"; exit 0 ;;
    *) echo "Unknown option: $arg (use --help)"; exit 2 ;;
  esac
done

COMMIT="$(git rev-parse HEAD)"
SHORT="$(git rev-parse --short HEAD)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
WHO="$(git config user.name || whoami)"

# 1. What gets deployed must be reproducible: no uncommitted changes in react/.
DIRTY_FILES="$(git status --porcelain -- . )"
DIRTY=false
if [ -n "$DIRTY_FILES" ]; then
  DIRTY=true
  if [ "$ALLOW_DIRTY" -eq 0 ]; then
    echo "✗ There are uncommitted changes in react/ (the deploy could not be rebuilt from git):"
    echo "$DIRTY_FILES" | head -15
    COUNT="$(echo "$DIRTY_FILES" | wc -l | tr -d ' ')"
    [ "$COUNT" -gt 15 ] && echo "  … and $((COUNT - 15)) more"
    echo
    echo "Commit them, or use --allow-dirty (it will be recorded as \"dirty\")."
    exit 1
  fi
  echo "⚠ Deploying with uncommitted changes (--allow-dirty): it will be marked as dirty."
fi

# 2. Build and put the version inside the build.
echo "Building $SHORT ($BRANCH)..."
npm run build

BUILT_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cat > dist/version.json <<JSON
{
  "app": "geonity-react",
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
  echo "Dry run: this would change on $REMOTE_HOST (nothing is touched):"
  rsync -avzn --delete --exclude 'downloads/' dist/ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
  exit 0
fi

echo "Deploying to $REMOTE_HOST..."
rsync -avz --delete --exclude 'downloads/' dist/ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

# 4. Record the deploy (if any of this fails the deploy is already done: warn and carry on).
TAG="deploy/react/$(date -u +%Y-%m-%d-%H%M)"
ssh "$REMOTE_USER@$REMOTE_HOST" "echo '$BUILT_AT react $SHORT branch=$BRANCH dirty=$DIRTY by=$WHO' >> $REMOTE_LOG" \
  || echo "⚠ Could not write the log on the server."
if [ "$DIRTY" = false ]; then
  git tag -a "$TAG" -m "React deploy $SHORT ($BUILT_AT)" \
    && { git push origin "$TAG" 2>/dev/null && echo "Tag $TAG pushed." || echo "Tag $TAG created locally (run: git push origin $TAG)."; } \
    || echo "⚠ Could not create the tag $TAG."
else
  echo "Dirty deploy: no tag is created."
fi

echo "Done. https://geonity.ibercivis.es   (version: https://geonity.ibercivis.es/version.json)"
