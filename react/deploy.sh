#!/bin/bash
# Despliega el front de React en producción y deja constancia de qué versión se ha desplegado.
#
#   ./deploy.sh                 construye y despliega (exige que no haya cambios sin commitear en react/)
#   ./deploy.sh --dry-run       construye y enseña qué cambiaría el rsync, sin tocar el servidor
#   ./deploy.sh --allow-dirty   despliega aunque haya cambios sin commitear (queda marcado como «dirty»)
#
# Qué deja:
#   - dist/version.json  →  https://geonity.ibercivis.es/version.json  (commit, rama, fecha, si estaba sucio, quién)
#   - una etiqueta de git  deploy/react/AAAA-MM-DD-HHMM  en el commit desplegado (no se crea si estaba sucio)
#   - una línea en /home/ubuntu/geonity-deploys.log del servidor (fuera de la carpeta que borra rsync --delete)
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
    *) echo "Opción desconocida: $arg (usa --help)"; exit 2 ;;
  esac
done

COMMIT="$(git rev-parse HEAD)"
SHORT="$(git rev-parse --short HEAD)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
WHO="$(git config user.name || whoami)"

# 1. Qué se va a desplegar tiene que poder reconstruirse: sin cambios sin commitear en react/.
DIRTY_FILES="$(git status --porcelain -- . )"
DIRTY=false
if [ -n "$DIRTY_FILES" ]; then
  DIRTY=true
  if [ "$ALLOW_DIRTY" -eq 0 ]; then
    echo "✗ Hay cambios sin commitear en react/ (el despliegue no se podría reconstruir desde git):"
    echo "$DIRTY_FILES" | head -15
    COUNT="$(echo "$DIRTY_FILES" | wc -l | tr -d ' ')"
    [ "$COUNT" -gt 15 ] && echo "  … y $((COUNT - 15)) más"
    echo
    echo "Haz commit, o usa --allow-dirty (quedará registrado como «dirty»)."
    exit 1
  fi
  echo "⚠ Desplegando con cambios sin commitear (--allow-dirty): quedará marcado como dirty."
fi

# 2. Construir y dejar la versión dentro del build.
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

# 3. Subir.
if [ "$DRY_RUN" -eq 1 ]; then
  echo "Dry run: esto cambiaría en $REMOTE_HOST (no se toca nada):"
  rsync -avzn --delete --exclude 'downloads/' dist/ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
  exit 0
fi

echo "Deploying to $REMOTE_HOST..."
rsync -avz --delete --exclude 'downloads/' dist/ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

# 4. Dejar constancia (si algo de esto falla, el despliegue ya está hecho: se avisa y se sigue).
TAG="deploy/react/$(date -u +%Y-%m-%d-%H%M)"
ssh "$REMOTE_USER@$REMOTE_HOST" "echo '$BUILT_AT react $SHORT branch=$BRANCH dirty=$DIRTY by=$WHO' >> $REMOTE_LOG" \
  || echo "⚠ No se pudo escribir el registro en el servidor."
if [ "$DIRTY" = false ]; then
  git tag -a "$TAG" -m "Despliegue de React $SHORT ($BUILT_AT)" \
    && { git push origin "$TAG" 2>/dev/null && echo "Etiqueta $TAG subida." || echo "Etiqueta $TAG creada en local (haz: git push origin $TAG)."; } \
    || echo "⚠ No se pudo crear la etiqueta $TAG."
else
  echo "Despliegue sucio: no se crea etiqueta."
fi

echo "Done. https://geonity.ibercivis.es   (versión: https://geonity.ibercivis.es/version.json)"
