#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Sleekblue Media Houz — automatic data backup
# Safe to run via cron. Does NOT change the live site.
#
# Usage:
#   bash scripts/backup.sh
# Cron example (daily 02:00):
#   0 2 * * * cd /home/USER/domains/YOURDOMAIN/public_html && bash scripts/backup.sh >> logs/backup.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# Project root = parent of scripts/
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

KEEP="${BACKUP_KEEP:-14}"          # how many dated backups to keep
STAMP="$(date +%Y-%m-%d_%H-%M-%S)"
DEST="$ROOT/backups/$STAMP"

mkdir -p "$DEST" "$ROOT/logs"

echo "[backup] $(date -Iseconds) starting → $DEST"

# Core data files / folders (skip if missing so script never fails hard)
copy_if_exists() {
  local src="$1"
  local name="$2"
  if [ -e "$src" ]; then
    cp -a "$src" "$DEST/$name"
    echo "[backup]   ✓ $name"
  else
    echo "[backup]   · skipped (not found): $name"
  fi
}

copy_if_exists "$ROOT/site-data.json" "site-data.json"
copy_if_exists "$ROOT/runtime"        "runtime"
copy_if_exists "$ROOT/uploads"        "uploads"

# Lightweight marker
echo "backed_up_at=$STAMP" > "$DEST/BACKUP_INFO.txt"
echo "host=$(hostname 2>/dev/null || echo unknown)" >> "$DEST/BACKUP_INFO.txt"

# Prune old backups (keep newest $KEEP)
if [ -d "$ROOT/backups" ]; then
  mapfile -t OLD < <(ls -1dt "$ROOT/backups"/*/ 2>/dev/null | tail -n +"$((KEEP + 1))" || true)
  for d in "${OLD[@]:-}"; do
    [ -n "${d:-}" ] || continue
    rm -rf "$d"
    echo "[backup]   pruned $d"
  done
fi

echo "[backup] done — kept last $KEEP backups under $ROOT/backups/"
