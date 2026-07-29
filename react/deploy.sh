#!/bin/bash
set -e

REMOTE_USER="ubuntu"
REMOTE_HOST="api.ibercivis.es"
REMOTE_PATH="/home/ubuntu/geonity"

echo "Building..."
npm run build

echo "Deploying to $REMOTE_HOST..."
rsync -avz --delete --exclude 'downloads/' dist/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

echo "Done. https://geonity.ibercivis.es"
