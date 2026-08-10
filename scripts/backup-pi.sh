#!/bin/sh
set -eu

stamp=$(date +%Y-%m-%d_%H-%M-%S)
docker compose exec -T api node --no-warnings=ExperimentalWarning server/backup.mjs "/data/backups/kairos-$stamp.sqlite"
echo "Backup saved to data/backups/kairos-$stamp.sqlite"
