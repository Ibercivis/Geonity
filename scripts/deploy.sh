#!/usr/bin/env bash
set -Eeuo pipefail

REMOTE_USER="${REMOTE_USER:-ubuntu}"
REMOTE_HOST="${REMOTE_HOST:-geonity-admin.ibercivis.es}"
REMOTE_DIR="${REMOTE_DIR:-/home/ubuntu/geonity-backend}"
SSH_TARGET="${REMOTE_USER}@${REMOTE_HOST}"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 1; }
}

require_cmd npm
require_cmd rsync
require_cmd ssh

cd "$PROJECT_DIR"

echo "==> Building..."
npm run build

echo "==> Syncing dist/ to ${SSH_TARGET}:${REMOTE_DIR}/"
rsync -avz --delete dist/ "${SSH_TARGET}:${REMOTE_DIR}/"

echo "==> Done: https://${REMOTE_HOST}/"
