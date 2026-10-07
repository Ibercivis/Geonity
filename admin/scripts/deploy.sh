#!/usr/bin/env bash
# Despliega el panel de administración y deja constancia de qué versión se ha desplegado.
#
#   npm run deploy                       construye y despliega (exige que no haya cambios sin commitear en admin/)
#   bash scripts/deploy.sh --dry-run     construye y enseña qué cambiaría el rsync, sin tocar el servidor
#   bash scripts/deploy.sh --allow-dirty despliega aunque haya cambios sin commitear (queda marcado «dirty», sin etiqueta)
#
# Qué deja:
#   - dist/version.json  →  https://<host>/version.json  (commit, rama, fecha, si estaba sucio, quién)
#   - una etiqueta de git  admin/deploy-AAAA-MM-DD-HHMM  en el commit desplegado (no se crea si estaba sucio)
#   - una línea en ~/geonity-admin-deploys.log del servidor (fuera de la carpeta que borra rsync --delete)
#
# El servidor (REMOTE_HOST) es una máquina compartida con otros proyectos: este script solo escribe en REMOTE_DIR
# y en ese registro.
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
    *) echo "Opción desconocida: $arg (usa --help)" >&2; exit 2 ;;
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

# 1. Lo desplegado tiene que poder reconstruirse: sin cambios sin commitear en admin/.
DIRTY_FILES="$(git status --porcelain -- .)"
DIRTY=false
if [ -n "$DIRTY_FILES" ]; then
  DIRTY=true
  if [ "$ALLOW_DIRTY" -eq 0 ]; then
    echo "✗ Hay cambios sin commitear en admin/ (el despliegue no se podría reconstruir desde git):" >&2
    echo "$DIRTY_FILES" | head -15 >&2
    COUNT="$(echo "$DIRTY_FILES" | wc -l | tr -d ' ')"
    [ "$COUNT" -gt 15 ] && echo "  … y $((COUNT - 15)) más" >&2
    echo >&2
    echo "Haz commit, o usa --allow-dirty (quedará registrado como «dirty»)." >&2
    exit 1
  fi
  echo "⚠ Desplegando con cambios sin commitear (--allow-dirty): quedará marcado como dirty."
fi

# 2. Construir y dejar la versión dentro del build.
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

# 3. Subir.
if [ "$DRY_RUN" -eq 1 ]; then
  echo "==> Dry run: esto cambiaría en ${SSH_TARGET}:${REMOTE_DIR}/ (no se toca nada):"
  rsync -avzn --delete dist/ "${SSH_TARGET}:${REMOTE_DIR}/"
  exit 0
fi

echo "==> Syncing dist/ to ${SSH_TARGET}:${REMOTE_DIR}/"
rsync -avz --delete dist/ "${SSH_TARGET}:${REMOTE_DIR}/"

# 4. Constancia (si algo de esto falla, el despliegue ya está hecho: se avisa y se sigue).
TAG="admin/deploy-$(date -u +%Y-%m-%d-%H%M)"
ssh "$SSH_TARGET" "echo '$BUILT_AT admin $SHORT branch=$BRANCH dirty=$DIRTY by=$WHO' >> $REMOTE_LOG" \
  || echo "⚠ No se pudo escribir el registro en el servidor."
if [ "$DIRTY" = false ]; then
  if git tag -a "$TAG" -m "Despliegue del admin $SHORT ($BUILT_AT)"; then
    git push origin "$TAG" 2>/dev/null && echo "Etiqueta $TAG subida." || echo "Etiqueta $TAG creada en local (haz: git push origin $TAG)."
  else
    echo "⚠ No se pudo crear la etiqueta $TAG."
  fi
else
  echo "Despliegue sucio: no se crea etiqueta."
fi

echo "==> Done: https://${REMOTE_HOST}/   (versión: https://${REMOTE_HOST}/version.json)"
