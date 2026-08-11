# Sleekblue Media Houz — Risk Mitigation & Testing Strategy

**Constraint:** Prefer free/process controls over paid tools.  
**Phase 1 focus:** Survive Hostinger shared limits; protect orders and auth.

---

## 1. Risk register

| ID | Risk | Impact | Likelihood | Mitigation (current / planned) |
|----|------|--------|------------|--------------------------------|
| R1 | Process crash / OOM on 3 GB host | Downtime | Medium | PM2 `max_memory_restart: 450M`; uncaughtException exit + restart |
| R2 | Concurrent writes corrupt `orders.json` | Lost/wrong orders | Medium | `withWriteLock` + atomic write; Phase 2 MySQL for orders |
| R3 | Deploy wipes data under `.builds` | Data loss | Medium | `DATA_DIR` / `UPLOADS_DIR` on persistent storage |
| R4 | Inode exhaustion (600k) | Uploads/site break | Low–Med | Monitor inodes; prune unused uploads; avoid tiny-file explosion |
| R5 | Paystack webhook forgery | Fraudulent “paid” | Low | HMAC-SHA512 on raw body; timing-safe compare |
| R6 | Amount mismatch paid vs order | Revenue/support issues | Low | Status `amount_mismatch`; no auto-paid |
| R7 | Admin credential leak | Full CMS takeover | Low | Strong `JWT_SECRET` / password; HTTPS; rate-limited login |
| R8 | CI stuck on fork PR | Merge delay | Medium | Maintainer re-run / approve workflows; not a product outage |
| R9 | Single process limit under spike | Slow/errors | Medium | Rate limits; CDN static; honest capacity (not Shopify-scale) |
| R10 | Backup never tested | Long recovery | Medium | Quarterly restore drill; admin JSON backup |
| R11 | Secret in git | Breach | Low | `.gitignore` `.env`; env only on host |
| R12 | Email volume blocked | Lost notifications | Low | Prefer SMTP over sendmail limits |

---

## 2. Security controls (active)

- Helmet (CSP off intentionally for third-party pixels)  
- Rate limits on `/api` and sensitive writes  
- JWT admin auth + password hash binding (`sig`)  
- Paystack signature verification before order mutation  
- Upload extension/MIME checks  
- Production boot fails closed if secrets missing  

---

## 3. Testing strategy

### 3.1 Layers

| Layer | What | Where |
|-------|------|--------|
| Unit | Price helpers, pure utils | `npm test` / `tests/` |
| Build | SPA compiles | `npm run build` in CI |
| Contract | Health, order validation, webhook 401 | CI or script |
| Smoke (prod) | Health, homepage, admin login, one order path | Manual / free uptime |
| Load | Optional k6/artillery later | Only if investigating spikes |

### 3.2 CI (required bar)

From `.github/workflows/ci.yml`:

1. `npm ci`  
2. `npm run build`  
3. `npm test`  

PRs should not merge with failing build/test when runners work.

### 3.3 Smoke checklist (post-deploy)

- [ ] `GET /api/health` → `ok: true`, `indexExists: true`  
- [ ] `paystackConfigured: true` on production  
- [ ] Homepage 200  
- [ ] Admin login  
- [ ] Create order (bank path) appears in admin orders  
- [ ] Paystack test/live payment marks `paid` (staging or small live test)  

### 3.4 Regression priorities

1. Order create + webhook  
2. Admin auth  
3. Product price overrides still applied server-side  
4. File upload to persistent uploads dir  
5. SPA routes (refresh on deep link)  

---

## 4. Incident response (lightweight)

| Severity | Example | Response |
|----------|---------|----------|
| P1 | Site down, checkout broken | Check health, PM2/Hostinger status, last deploy; rollback if needed |
| P2 | Payments not confirming | Paystack dashboard, webhook URL, secret, logs |
| P3 | CMS glitch, non-checkout bug | Ticket, fix via PR |

**Comms:** Business owner + maintainer; status via WhatsApp/email as per team norm.

**Data:** Do not “fix” `orders.json` by hand without snapshot copy first.

---

## 5. Monitoring thresholds (guidance)

| Metric | Watch |
|--------|--------|
| Memory (health / PM2) | Approach to 450M restarts → investigate leak |
| Hostinger CPU | Sustained peg → rate limits / optimize / Phase 2 |
| Inodes | > 70% of 600k → cleanup |
| Error log rate | Spike after deploy → rollback candidate |
| Uptime checks | 2+ failures → page owner |

---

## 6. Test data & secrets

- Local: Paystack **test** keys only.  
- Never copy production `orders.json` to public forks.  
- Anonymize if sharing backups with contractors.  

---

## 7. Phase-gated testing

| Phase | Extra testing |
|-------|----------------|
| 1 | Smoke + CI + health |
| 2 (MySQL) | Dual-write reconciliation, rollback drill, import idempotency (see DATABASE.md) |
| 3 | Uptime alerts, expanded CI smoke |
| 4+ | Load test with agreed RPS target |

---

## 8. Definition of “done” for a release

1. CI green (or documented runner exception + manual build/test)  
2. Merged to upstream `main`  
3. Deployed  
4. Smoke checklist passed  
5. No open P1 from the release  

---

*Risk management here is operational discipline on shared hosting—not an enterprise GRC program. Revisit if revenue or compliance scope changes.*
