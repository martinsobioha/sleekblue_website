# Sleekblue Media Houz — Team Handoff & Onboarding Guide

**Audience:** Engineers, operators, or partners taking over the fork or production.  
**Time to first useful contribution:** aim < half a day.

---

## 1. What this product is

E-commerce + CMS storefront for **Sleekblue Media Houz** (Owerri, Nigeria): stickers, print, branding products.  

- Storefront + admin CMS in one Node app  
- Paystack for online payment  
- Hosted on Hostinger Business  

Live: https://www.sleekbluemedia.com

---

## 2. Repositories

| Repo | Role |
|------|------|
| https://github.com/martinsobioha/sleekblue_website | **Production** source Hostinger deploys from |
| https://github.com/akameredon/sleekblue_website | Active fork (hardening, docs, PR source) |

Workflow: work on fork → PR → upstream `main` → deploy.

---

## 3. Quick start (local)

```bash
git clone https://github.com/akameredon/sleekblue_website.git
cd sleekblue_website
cp .env.example .env
# set JWT_SECRET, ADMIN_PASSWORD, PAYSTACK_SECRET_KEY (test keys ok locally)
npm ci
npm run build
node server.js
# or: npx pm2 start ecosystem.config.cjs
```

Open `http://localhost:3000`. Admin login uses `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

Node version: see `.nvmrc` (20.x recommended).

---

## 4. Architecture in one page

Read first:

1. [docs/ARCHITECTURE.md](./ARCHITECTURE.md) — as-built system  
2. [docs/ROADMAP.md](./ROADMAP.md) — Phase 1–5  
3. [docs/DATABASE.md](./DATABASE.md) — optional MySQL (not live yet)  
4. [docs/API_AND_SCALING.md](./API_AND_SCALING.md) — API + scale limits  
5. [docs/DEPLOYMENT_DEVOPS.md](./DEPLOYMENT_DEVOPS.md) — ship & operate  
6. [docs/RISK_AND_TESTING.md](./RISK_AND_TESTING.md) — risks & tests  

**Runtime model:** single Node process, Express serves Vite `dist/` + `/api/*`, JSON files under `DATA_DIR`/`runtime`, uploads on disk, Paystack webhook for payment confirmation.

---

## 5. Key files

| Path | Why it matters |
|------|----------------|
| `server.js` | Entire API + static hosting + hardening |
| `ecosystem.config.cjs` | PM2 production settings |
| `src/` | React admin + storefront |
| `src/data/products.js` | Catalog / pricing tables |
| `site-data.json` | CMS content (prod may use DATA_DIR copy) |
| `runtime/` | Orders, leads, etc. (prod persistent path) |
| `docs/` | This handoff set |

---

## 6. Production access (who needs what)

| Role | Needs |
|------|--------|
| Maintainer | GitHub write on upstream, Hostinger hPanel, env secrets |
| Contributor | Fork + PR |
| Operator | Health URL, backup UI, PM2/logs via hPanel or SSH if enabled |

**You may not have SSH.** Deploy path is GitHub → Hostinger integration.

---

## 7. Day-2 operations

| Task | Action |
|------|--------|
| Is site up? | `GET /api/health` |
| Deploy | Merge to upstream `main` |
| Admin password | Env + `/api/admin/password` after login |
| Export data | Admin backup endpoint |
| Orders stuck | Check Paystack dashboard + webhook logs; verify signature secret |

---

## 8. Coding norms

- Match existing Express + React style.  
- Server recomputes prices; never trust client totals.  
- Public writes are rate limited; keep it that way.  
- Prefer additive API fields.  
- No new paid infra without business approval (see roadmap).  

---

## 9. Current program status (handoff snapshot)

| Item | State |
|------|--------|
| Hardening (`withWriteLock`, process handlers, health, PM2 450M) | On fork `main` |
| Docs (architecture → risk) | On fork `docs/` |
| Upstream PR | Open / pending merge (check PR list on martinsobioha repo) |
| MySQL | Spec only — not implemented |
| Budget | Maintain Hostinger + Paystack only |

---

## 10. First-week checklist for a new engineer

- [ ] Clone fork, run locally, log into admin  
- [ ] Read ARCHITECTURE + ROADMAP  
- [ ] Trace `POST /api/orders/create` and Paystack webhook in `server.js`  
- [ ] Open live `/api/health`  
- [ ] Make a tiny docs or comment PR to learn the pipeline  

---

## 11. Contacts / ownership

| Area | Owner (fill in) |
|------|------------------|
| Upstream GitHub | martinsobioha |
| Fork / hardening PRs | akameredon |
| Hostinger billing / DNS | _business owner_ |
| Paystack business account | _business owner_ |

---

*Onboarding complete when you can run locally, explain the order+webhook path, and open a PR to upstream.*
