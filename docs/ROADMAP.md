# Sleekblue Media Houz — Phased Roadmap (Phase 1–5)

**Constraint:** Zero additional spend unless a phase explicitly requires new budget (and business approves it).  
**Aligned with:** Hostinger Business plan, existing Paystack, fork → upstream PR workflow.

---

## Phase 1 — Stabilize on current host (NOW)

**Goal:** Reliable storefront for existing subscriptions. No new money.

| Work | Status |
|------|--------|
| Process resilience + write locks + health + PM2 limits | Done on fork `main` |
| PR to `martinsobioha/sleekblue_website` | Open (#15) — await merge + deploy |
| Verify live `/api/health` after deploy | Pending merge |
| Confirm Paystack webhook marks orders paid | Pending post-deploy test |
| Monitor Hostinger CPU / RAM / inodes via hPanel | Ongoing |

**Exit criteria:** Live health shows new fields; one successful paid order; no crash under normal traffic.

---

## Phase 2 — Use included Hostinger features (still $0 extra)

**Goal:** Reduce risk using tools already in the plan.

| Work | Notes |
|------|--------|
| Optional MySQL for orders only | Plan includes MySQL (3 GB/DB). Migrate `runtime/orders.json` first if concurrent orders stress files |
| Staging site | Use Hostinger staging / second Node slot for pre-prod |
| LiteSpeed / object cache if applicable | Only if Node stack can benefit without rewrite |
| SMTP for transactional email | Avoid sendmail 100/day cap |
| Document backup restore drill | Daily backups already included — practice restore once |

**Exit criteria:** Orders durable under concurrent writes; restore drill documented; staging path known.

**Trigger to start:** Phase 1 stable **and** evidence of write contention or inode pressure — not “because we can.”

---

## Phase 3 — Observability & quality (minimal cost)

**Goal:** Know when things break before customers do.

| Work | Notes |
|------|--------|
| Uptime monitor on `/api/health` | Prefer free tier (e.g. UptimeRobot) |
| Structured error log review | PM2 `logs/error.log` + weekly glance |
| Automated smoke tests in CI | Extend existing `npm test` / build |
| Rate-limit tuning | Already present; adjust from real abuse patterns |

**Exit criteria:** Alert within minutes of downtime; CI catches build breaks.

**Spend:** $0–few dollars/month only if free monitors are insufficient.

---

## Phase 4 — Horizontal readiness (requires budget decision)

**Goal:** Prepare for multi-process / multi-instance — **do not implement until traffic or revenue justifies.**

| Work | Notes |
|------|--------|
| Full schema for orders, customers, products overrides | Spec in DB migration doc |
| Replace file runtime store with MySQL/Postgres | Hostinger MySQL first; managed DB only if needed |
| Session/stateless API | Required before >1 Node process |
| Object storage for uploads | Only if local disk/inodes become the bottleneck |
| CDN cache rules for `dist` assets | Leverage existing free CDN carefully |

**Exit criteria:** Written migration plan + rollback; single-writer assumptions removed from design.

**Spend:** May require plan upgrade or paid DB/storage — **explicit business approval required.**

---

## Phase 5 — Scale-out (Shopify-class ambition)

**Goal:** High concurrent checkout, multi-region optional. **Not in scope under current budget.**

| Work | Notes |
|------|--------|
| Load-balanced Node or container platform | Beyond Hostinger Business |
| Managed DB + replicas | Paid |
| Queue for webhooks / emails | Paid or self-hosted complexity |
| Full observability stack | Paid |
| PCI / compliance review as needed | Process + possible cost |

**Exit criteria:** Load-tested capacity target agreed by business; runbook for incidents.

**Spend:** Material. Only after Phase 1–3 prove the product and revenue support it.

---

## Decision rules

1. **Default = Phase 1.** Do not start Phase 4–5 without budget and traffic evidence.
2. Prefer Hostinger-included MySQL (Phase 2) over external paid DB.
3. File-based store is acceptable until concurrent writes or multi-instance is required.
4. Every phase ends with a measurable exit criterion, not “more code.”

---

## Current focus

```
Phase 1 ──► merge PR #15 ──► deploy ──► health check ──► Paystack smoke test
```

Everything else waits until Phase 1 exit criteria are met.
