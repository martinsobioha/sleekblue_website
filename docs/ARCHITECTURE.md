# Sleekblue Media Houz — Architecture Document

**Repo:** `akameredon/sleekblue_website` (fork) → `martinsobioha/sleekblue_website` (live)  
**Live site:** https://www.sleekbluemedia.com  
**Last updated:** 2026-08-10  
**Constraint:** Zero additional spend. Operate within existing Hostinger Business (~$47/yr) and Paystack.

---

## 1. Purpose

Document the **current** production architecture after Hostinger hardening, and define optional future phases that only activate if budget or traffic requires them.

This is not a mandate to rebuild. It is a map of what exists, what was hardened, and what would come next *if* the business grows beyond shared hosting.

---

## 2. Current production architecture (as-built)

```
                    ┌─────────────────────────────┐
                    │  Clients (browser / mobile) │
                    └─────────────┬───────────────┘
                                  │ HTTPS
                    ┌─────────────▼───────────────┐
                    │  Hostinger (Business plan)  │
                    │  Free CDN + DDoS protection │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │  Node.js (single process)   │
                    │  PM2: sleekblue             │
                    │  max_memory_restart: 450M   │
                    │  Express 5 + Vite SPA dist  │
                    └──────┬──────────────┬───────┘
                           │              │
              ┌────────────▼──┐    ┌──────▼────────────┐
              │  File store   │    │  Paystack (SaaS)   │
              │  site-data    │    │  payments + webhook│
              │  runtime/*.json│    └───────────────────┘
              │  uploads/     │
              │  (persistent) │
              └───────────────┘
```

### 2.1 Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 SPA (Vite build → `dist/`) |
| Backend | Node.js + Express (single process) |
| Process manager | PM2 (`ecosystem.config.cjs`) |
| Persistence | File-based JSON (`site-data.json`, `runtime/*.json`) |
| Uploads | Local filesystem under persistent path |
| Payments | Paystack (already configured) |
| Hosting | Hostinger Business / Unlimited (2 CPU, 3 GB RAM, 50 GB NVMe, 600k inodes) |
| CDN / DDoS | Hostinger free CDN + enhanced DDoS |

### 2.2 Hardening already shipped (on fork `main`)

| Change | Why |
|--------|-----|
| `withWriteLock` on order / site-data writes | Prevent JSON corruption under concurrent requests |
| `uncaughtException` / `unhandledRejection` → exit | Let PM2 restart a clean process |
| Graceful `SIGTERM` / `SIGINT` shutdown | Finish in-flight requests before kill |
| HTTP timeouts (`requestTimeout`, `keepAliveTimeout`, etc.) | Protect single process from slow clients |
| `/api/health` expanded (uptime, memory, `paystackConfigured`) | Operator visibility without new tools |
| PM2 `max_memory_restart: 450M`, `max_restarts`, kill/listen timeouts | Fit 3 GB shared RAM safely |

### 2.3 Hostinger hard limits (do not ignore)

| Resource | Limit |
|----------|--------|
| CPU | 2 cores |
| RAM | 3 GB |
| Storage | 50 GB NVMe |
| Inodes | 600,000 |
| MySQL | Up to 150 DBs, 3 GB each (available, **not used yet**) |
| Node.js sites | Up to 5 |
| Bandwidth | Unlimited (marketing); I/O capped |
| Email (sendmail) | 10/min, 100/day — prefer SMTP if volume grows |

Reaching inode or memory limits can crash the site. Daily backups are included on this plan.

---

## 3. Data model (current — file-based)

No relational DB in production today.

| Store | Path / key | Contents |
|-------|------------|----------|
| Site CMS | `site-data.json` | settings, hero, content, SEO, products overrides, blog, etc. |
| Orders | `runtime/orders.json` | order records, payment status |
| Leads | `runtime/leads.json` | WhatsApp / form leads |
| Newsletter | `runtime/newsletter.json` | email subs |
| Analytics | `runtime/analytics.json` | page/product events (capped) |
| Admin config | `runtime/admin-config.json` | username + password hash |
| Uploads | `uploads/{hero,products,variants,...}` | media files |

**Write path:** atomic temp-file + rename; critical keys serialized via in-process `withWriteLock`.

**Risk:** single-process file store cannot scale to true multi-instance or multi-region without a real database.

---

## 4. API surface (summary)

Public and admin routes live in `server.js`. Notable groups:

- **Public CMS:** `/api/settings`, `/api/hero`, `/api/content`, `/api/products`, `/api/blog`, …
- **Commerce:** `/api/orders/create`, `/api/orders/:ref/status`, `/api/webhooks/paystack`
- **Leads / growth:** newsletter, WhatsApp subscribe, reviews, referral, analytics track
- **Admin:** JWT auth, CRUD for CMS, uploads, orders, backup export
- **Ops:** `GET /api/health` (no auth)

Paystack webhook verifies HMAC-SHA512 on raw body before updating order status under write lock.

---

## 5. Deployment model (current)

1. Code lands on `martinsobioha/sleekblue_website` (after PR merge).
2. Hostinger Node.js hosting builds / serves from deploy pipeline connected to that repo.
3. Persistent data and uploads must live **outside** the wiped `.builds` tree (`DATA_DIR` / `UPLOADS_DIR` env if configured).
4. PM2 runs `server.js` with `ecosystem.config.cjs`.

**PR in flight:** https://github.com/martinsobioha/sleekblue_website/pull/15  
(Includes admin/storefront fixes + hardening commits. CI previously cancelled due to GitHub runner acquisition failure — not a code failure.)

---

## 6. Capacity expectations (honest)

On **one** Node process + file JSON on Hostinger Business:

| Scenario | Expectation |
|----------|-------------|
| Normal SME traffic + occasional spikes | OK if memory stays under ~450M and inodes are healthy |
| “Shopify-scale” concurrent checkout | **Not achievable** on this plan without architectural change |
| Long-running memory growth | Mitigated by PM2 `max_memory_restart: 450M` |
| Concurrent order writes | Mitigated by `withWriteLock` (single process only) |

This document does **not** claim parity with Shopify. It claims a hardened shared-hosting storefront suitable for current subscriptions and moderate growth.

---

## 7. Guiding principles under zero extra spend

1. Prefer configuration and code resilience over new paid services.
2. Use Hostinger-included features first (CDN, backups, optional MySQL, staging).
3. Do not introduce Redis, managed Postgres, K8s, or multi-region until budget and traffic justify them.
4. Measure via `/api/health` and Hostinger hPanel before expanding.

---

## 8. Related documents (roadmap)

| Doc | Status |
|-----|--------|
| This architecture | **This file** |
| Phased roadmap (Phase 1–5) | Next |
| Database schema & migration (optional MySQL) | Planned |
| API contract & scaling design | Planned |
| Deployment & DevOps strategy | Planned |
| Team handoff & onboarding | Planned |
| Risk mitigation & testing | Planned |

---

## 9. Immediate operator checklist

- [ ] Merge PR #15 when maintainer is ready (re-run CI if still cancelled on runner error).
- [ ] After deploy, open `https://www.sleekbluemedia.com/api/health` and confirm `uptimeSeconds`, `memory`, `paystackConfigured`.
- [ ] Ensure `logs/` exists if PM2 file logging is used.
- [ ] Confirm persistent `DATA_DIR` / `UPLOADS_DIR` survive Hostinger rebuilds.
- [ ] Spot-check one Paystack order end-to-end (create → pay → webhook → paid).

---

*Sleekblue Media Houz — constrained, production-first architecture. No extra cost required to operate Phase 1.*
