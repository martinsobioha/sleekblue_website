#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Sleekblue Media Houz — deploy from GitHub main
# Pulls latest code, installs deps, builds frontend, restarts PM2.
#
# Usage:
#   bash scripts/deploy.sh
# Optional:
#   SKIP_BACKUP=1 bash scripts/deploy.sh   # skip pre-deploy backup
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p logs
echo "[deploy] $(date -Iseconds) starting in $ROOT"

# 1) Safety backup (unless skipped)
if [ "${SKIP_BACKUP:-0}" != "1" ] && [ -f "$ROOT/scripts/backup.sh" ]; then
  echo "[deploy] running pre-deploy backup…"
  bash "$ROOT/scripts/backup.sh" || echo "[deploy] backup warned (continuing)"
fi

# 2) Latest code
echo "[deploy] git pull origin main…"
git fetch origin main
git pull --ff-only origin main

# 3) Dependencies
echo "[deploy] npm install…"
if [ -f package-lock.json ]; then
  npm ci --omit=dev || npm install --omit=dev
else
  npm install --omit=dev
fi

# 4) Frontend build
echo "[deploy] npm run build…"
npm run build

# 5) Ensure dirs exist
mkdir -p logs runtime uploads

# 6) Restart app (PM2)
echo "[deploy] restarting PM2…"
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe sleekblue >/dev/null 2>&1; then
    pm2 restart sleekblue --update-env
  elif [ -f "$ROOT/ecosystem.config.cjs" ]; then
    pm2 start "$ROOT/ecosystem.config.cjs"
  else
    pm2 start server.js --name sleekblue
  fi
  pm2 save || true
else
  echo "[deploy] WARNING: pm2 not found — start the app manually (npm start)"
fi

echo "[deploy] $(date -Iseconds) finished OK"
