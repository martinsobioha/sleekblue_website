# Sleekblue Media Houz — Deployment & DevOps Strategy

**Constraint:** $0 extra tooling spend. Use GitHub + Hostinger included features.  
**Live deploy source:** `martinsobioha/sleekblue_website` (Hostinger connected).  
**Contributor fork:** `akameredon/sleekblue_website`.

---

## 1. Environments

| Env | Where | Purpose |
|-----|--------|---------|
| Local | Developer machine | `npm run dev` / `node server.js` |
| Staging (optional) | Hostinger second Node site or staging tool | Pre-prod smoke |
| Production | Hostinger Business Node app → sleekbluemedia.com | Live traffic |

No separate paid staging cluster.

---

## 2. Branch & PR flow

```
feature branch (optional)
    → akameredon/main
    → PR → martinsobioha/main
    → Hostinger auto/manual deploy
```

1. Develop on fork.  
2. Open PR to upstream `main`.  
3. CI: `.github/workflows/ci.yml` → `npm ci` → `npm run build` → `npm test`.  
4. Maintainer merges.  
5. Hostinger pulls/builds from upstream.

**Hardening + docs live on fork `main`.** Upstream PR #15 (or successor) must merge for production to receive them.

### Fork PR CI note

GitHub may **queue/cancel** Actions on fork PRs (runner acquisition / approval).  
If checks stay cancelled: maintainer **Re-run jobs** or **Approve and run workflows**. Not necessarily a code defect.

---

## 3. Build & runtime

| Step | Command / artifact |
|------|-------------------|
| Install | `npm ci` |
| Build SPA | `npm run build` → `dist/` |
| Start | PM2: `pm2 start ecosystem.config.cjs` |
| App name | `sleekblue` |
| Entry | `server.js` serves API + `dist` SPA |

### PM2 (production)

See `ecosystem.config.cjs`:

- `max_memory_restart: 450M`  
- `max_restarts: 15`, `min_uptime: 10s`  
- `kill_timeout` / `listen_timeout`  
- Logs: `./logs/out.log`, `./logs/error.log` — ensure `mkdir -p logs`

### Critical env vars (Hostinger)

| Var | Required | Purpose |
|-----|----------|---------|
| `NODE_ENV` | yes | `production` |
| `PORT` | host-set | Listen port |
| `JWT_SECRET` | yes (≥32 chars) | Admin JWT |
| `ADMIN_PASSWORD` | yes | Initial admin hash source |
| `ADMIN_USERNAME` | optional | Default `admin` |
| `PAYSTACK_SECRET_KEY` | yes | Webhooks + guard |
| `DATA_DIR` | recommended | Persistent data root (survives `.builds` wipe) |
| `UPLOADS_DIR` | recommended | Persistent uploads |

Never commit real `.env`. Use `.env.example` as template.

---

## 4. Persistent data on Hostinger

Hostinger deploys can wipe build directories. Persist outside `.builds`:

```text
DATA_DIR    → site-data.json, runtime/*.json
UPLOADS_DIR → uploads/**
```

Confirm paths via `GET /api/health` (`dataDir`, `uploadsDir`).

---

## 5. Deploy checklist (production)

1. [ ] PR merged to `martinsobioha/main`  
2. [ ] Hostinger deploy finished (hPanel / pipeline)  
3. [ ] `GET /api/health` → `ok`, `indexExists`, `paystackConfigured`  
4. [ ] Homepage loads; admin login works  
5. [ ] Test order create (and Paystack path if keys live)  
6. [ ] PM2 status: online; memory under restart threshold  
7. [ ] Logs directory writable  

### Rollback

1. Revert merge commit on upstream `main` or redeploy previous Hostinger build.  
2. File data: restore from Hostinger daily backup if deploy corrupted files.  
3. Do not delete `DATA_DIR` / uploads during rollback.

---

## 6. CI strategy

**Current:** build + test on PR/push to main.

**Recommended additions (still free on GitHub Actions minutes):**

- Fail if `npm run build` missing `dist/index.html`  
- Smoke: start server, `curl -f localhost:$PORT/api/health` (if feasible in CI)  
- Lint optional later  

Do not block merges forever on flaky hosted-runner queue failures; re-run or document exception.

---

## 7. Secrets & access

| Secret | Where |
|--------|--------|
| JWT, admin, Paystack | Hostinger env only |
| GitHub deploy keys | Hostinger / GitHub integration |
| DB password (Phase 2) | Hostinger env |

Access: least privilege; fork contributors get PR rights, not production env.

---

## 8. Monitoring (Phase 1–3)

| Signal | How ($0) |
|--------|----------|
| Liveness | External free ping on `/api/health` |
| Process | PM2 status + Hostinger resource graphs |
| Errors | `logs/error.log` |
| Backups | Hostinger daily backup UI |

Alert channel: email/Telegram from free uptime tool — optional.

---

## 9. Backup & restore

| Data | Method |
|------|--------|
| Code | Git |
| DB files / uploads | Hostinger daily backup + periodic `GET /api/admin/backup` JSON export |
| Restore drill | Once per quarter: restore to staging or local |

---

## 10. DevOps anti-patterns (avoid)

- SSHing ad-hoc edits on production without git  
- Storing secrets in repo  
- Relying on `.builds` for orders/uploads  
- Scaling to multiple Node processes before MySQL for orders  

---

*Deploy is git-centric. Production truth is upstream main + Hostinger persistent dirs + env.*
