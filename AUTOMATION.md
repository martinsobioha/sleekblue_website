# Hands-off backup & deploy

After **one-time setup**, you do not run deploy or backup by hand.

## What was added

| File | Role |
|------|------|
| `scripts/backup.sh` | Copies `site-data.json`, `runtime/`, `uploads/` into `backups/DATE/` |
| `scripts/deploy.sh` | Backup → `git pull` → `npm install` → `npm run build` → `pm2 restart` |
| `.github/workflows/deploy.yml` | On every push to `main`, SSHs to Hostinger and runs `deploy.sh` |

---

## One-time setup (you)

### A) GitHub Secrets (for auto-deploy)

GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret name | Example value |
|-------------|----------------|
| `HOSTINGER_HOST` | Your server IP or hostname |
| `HOSTINGER_USER` | SSH username from Hostinger |
| `HOSTINGER_SSH_KEY` | Private SSH key (entire key file text) |
| `HOSTINGER_APP_PATH` | Full path to the site folder on the server |
| `HOSTINGER_PORT` | `22` (only if not default) |

How to get an SSH key (if you do not have one):

```bash
# On your laptop
ssh-keygen -t ed25519 -C "github-deploy-sleekblue" -f ./sleekblue_deploy -N ""
# Put sleekblue_deploy.pub contents into Hostinger → SSH Access → authorized keys
# Put sleekblue_deploy (private) contents into GitHub secret HOSTINGER_SSH_KEY
```

### B) Hostinger cron (for nightly backup)

Hostinger hPanel → **Cron Jobs** → add:

```text
0 2 * * * cd /FULL/PATH/TO/APP && bash scripts/backup.sh >> logs/backup.log 2>&1
```

Replace `/FULL/PATH/TO/APP` with the same path as `HOSTINGER_APP_PATH`.

---

## After setup

| Event | What happens |
|-------|----------------|
| You push to `main` | GitHub Actions deploys automatically |
| Every night 02:00 | Server backs up data alone |
| Actions tab → “Run workflow” | Manual deploy without a new commit |

---

## First test (recommended once)

1. Add the four secrets  
2. GitHub → **Actions** → **Deploy to Hostinger** → **Run workflow**  
3. Watch the log; confirm the live site loads  
4. Confirm `backups/` exists on the server after a deploy or cron run  

---

## Notes

- `backups/` and `logs/` stay on the server (not committed to Git).  
- Deploy always tries a backup first (`SKIP_BACKUP=1` to skip).  
- PM2 process name expected: `sleekblue` (matches `ecosystem.config.cjs`).  
