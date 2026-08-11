# Sleekblue — Engineering Hardening for Launch Traffic

**Purpose:** Make the **code** as resilient as possible on Hostinger Business (2 CPU, 3 GB RAM, single Node process) before Meta/Facebook-scale ad views.  
**Constraint:** $0 extra infrastructure. No Redis, no multi-node, no paid CDN upgrade.

---

## 1. Honest capacity math (important)

| Input | Realistic estimate |
|-------|-------------------|
| Ad impressions / views | ~100,000 over a campaign period (not one second) |
| Click-through to site | ~0.5–2% → **500–2,000 visits** |
| Peak concurrent browsers | Often **tens**, not thousands, if ads are paced |
| Orders | A few % of visits → tens to low hundreds over the campaign |

**What this host can do well**

- Serve SPA + API for paced campaigns  
- Survive short spikes with **503 + Retry-After** instead of total crash  
- Protect order writes with locks + rate limits  
- Restart cleanly via PM2 if memory grows  

**What this host cannot do**

- Shopify-level **sustained** concurrent checkout  
- Unlimited analytics disk writes under bot floods  
- Multi-region failover  

**Engineering goal:** Prefer **degrade gracefully** (skip analytics, 503 overload) over **silent corruption or process death**.

---

## 2. Hardening already on the fork

| Layer | Control |
|-------|---------|
| Process | `uncaughtException` / `unhandledRejection` → exit; PM2 restart |
| Memory | PM2 `max_memory_restart: 450M` |
| Shutdown | SIGTERM/SIGINT graceful close |
| HTTP | `requestTimeout` / `headersTimeout` / `keepAliveTimeout` |
| Orders | `withWriteLock('orders')` + atomic JSON writes |
| Paystack | HMAC verify before mutation |
| API abuse | Global + write + login rate limits |
| Static | Long-cache hashed assets; no-cache `index.html` |

### Added for launch-scale ad traffic (this pass)

| Control | Behavior |
|---------|----------|
| **In-flight concurrency cap** (`MAX_IN_FLIGHT`, default 48) | Excess requests → `503` + `Retry-After: 2` + `OVERLOADED` |
| **Order limiter** | Max 20 creates / 15 min / IP |
| **Analytics limiter** | Max 120 tracks / 15 min / IP; fail-soft |
| **Analytics shed load** | If heap > ~380MB or in-flight high → accept beacon, **skip disk write** |
| **Analytics cap** | Store at most 5,000 events (was 10,000) |
| **Uploads cache** | `Cache-Control` 7 days to cut repeat bandwidth |
| **`GET /api/ready`** | Ultra-light probe for uptime under load |
| **Health** | Reports `inFlight` / `maxInFlight` |

---

## 3. Env knobs (Hostinger, optional)

```bash
MAX_IN_FLIGHT=48          # lower (e.g. 32) if CPU pegs; raise only if stable
NODE_ENV=production
DATA_DIR=...              # persistent
UPLOADS_DIR=...           # persistent
```

---

## 4. Deploy path (required for production)

1. Code is on **`akameredon/sleekblue_website` `main`**.  
2. Merge into **`martinsobioha/sleekblue_website`** (PR).  
3. Hostinger redeploy.  
4. Verify:

```text
GET /api/health   → ok, memory, paystackConfigured, inFlight
GET /api/ready    → { ok: true, ready: true }
```

5. Smoke: homepage, one order create, Paystack webhook if used.

Until merge, **production still runs the older server**.

---

## 5. Ad traffic playbook (engineering)

| Phase | Action |
|-------|--------|
| Before ads | Merge + deploy hardening; smoke test |
| First 24h ads | Watch Hostinger CPU/RAM; watch `/api/health` memory + inFlight |
| If many 503 OVERLOADED | Pace Meta budget / day-part ads; do **not** remove concurrency cap |
| If memory restarts often | Lower analytics; check upload sizes; keep PM2 450M |
| Bots hitting track | Expected — analytics shed load is intentional |

---

## 6. What we will **not** fake

- Claiming “never goes down under any load” on shared 3 GB hosting  
- Removing rate limits to “handle more” (that causes crashes)  
- Multi-instance Node without MySQL for orders (Phase 2+)  

If sustained concurrent demand exceeds this plan, the **honest** next step is Hostinger plan upgrade and/or orders in MySQL (see `DATABASE.md`) — that is a **budget** decision, not a missing `if` statement.

---

## 7. Developer verification checklist

- [ ] `MAX_IN_FLIGHT`, `orderLimiter`, `analyticsLimiter` present in `server.js`  
- [ ] `GET /api/ready` returns JSON  
- [ ] Order create still works under normal use  
- [ ] Flood of `/api/analytics/track` does not block `/api/orders/create`  
- [ ] PM2 still restarts on crash  
- [ ] Upstream merge completed before major ad spend  

---

*Bulletproof on this budget means controlled degradation and protected money paths — not infinite scale.*
