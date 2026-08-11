# Sleekblue Media Houz — API Contract & Scaling Design

**Status:** Design reference (Phase 1–4).  
**Constraint:** $0 extra on Phase 1–2. Scaling beyond single process requires Phase 4 budget approval.  
**Base URL (prod):** `https://www.sleekbluemedia.com`

---

## 1. API principles

1. JSON request/response unless noted (uploads are multipart).
2. Public routes: no auth. Admin routes: `Authorization: Bearer <jwt>`.
3. Money amounts in **whole NGN** (and `amountKobo` = NGN × 100 for Paystack).
4. Do not change response field names without a versioned migration.
5. Errors: `{ "error": "message" }` or `{ "ok": false, "error": "message" }` with appropriate HTTP status.

---

## 2. Auth

| Item | Contract |
|------|----------|
| Login | `POST /api/admin/login` body `{ username, password }` → `{ ok, token }` |
| Token | JWT, ~7d expiry; payload includes username + password-hash tail `sig` |
| Use | Header `Authorization: Bearer <token>` |
| Password change | `PUT /api/admin/password` (rate limited) |
| Failure | `401` invalid/expired; `503` if JWT not configured |

---

## 3. Public API contract (summary)

### CMS / content

| Method | Path | Response shape (high level) |
|--------|------|------------------------------|
| GET | `/api/settings` | settings object |
| GET | `/api/page-layout` | layout object |
| GET | `/api/hero` | hero object |
| GET | `/api/content` | content object (reviews, trustBar, FAQ, …) |
| GET | `/api/seo` | seo object |
| GET | `/api/promo-banner` | banner or `null` |
| GET | `/api/about` | about object |
| GET | `/api/products` | `{ productOverrides }` |
| GET | `/api/products/:slug` | override object or null |
| GET | `/api/product-images` | map slug → urls |
| GET | `/api/product-variant-images` | map `slug::variant` → urls |
| GET | `/api/sticker-images` | map size → urls |
| GET | `/api/blog` | published posts array |
| GET | `/api/blog/:slug` | post or 404 |
| POST | `/api/blog/:slug/view` | `{ ok: true }` |
| GET | `/api/blog/:slug/comments` | approved comments |
| POST | `/api/blog/:slug/comment` | `{ ok: true }` (pending approval) |

### Commerce

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/orders/create` | Body: `{ items, customer, paymentMethod }`. Server recomputes totals. Returns `{ ok, orderId, ref, total, amountKobo }`. Rate limited. |
| PATCH | `/api/orders/:ref/status` | **Admin only.** status ∈ pending\|paid\|cancelled\|refunded |
| POST | `/api/webhooks/paystack` | Raw body + `x-paystack-signature` HMAC-SHA512. Always ack quickly; update under write lock / DB txn |

**Create order — customer required:** `name`, `phone`, `address`, `city`.  
**paymentMethod:** `bank` \| `paystack` \| `whatsapp` (default bank).

**Line item input (client):** slug/id, quantity, optional size, optional client price (ignored when catalog known).  
**Line item output:** id, slug, name, size, quantity, unitPrice, lineTotal.

### Growth / leads

| Method | Path |
|--------|------|
| POST | `/api/newsletter` `{ email }` |
| POST | `/api/subscribe-whatsapp` `{ name, phone }` |
| POST | `/api/reviews/submit` `{ name, text, rating }` |
| POST | `/api/referral/generate` `{ name, phone?, email?, source? }` → `{ ok, code }` |
| POST | `/api/analytics/track` whitelisted fields only |
| POST | `/api/terms/accept` |
| POST | `/api/upload/artwork` multipart |

### Ops

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/health` | No auth. Includes `ok`, `status`, `uptimeSeconds`, `memory`, `paystackConfigured`, paths, `indexExists` |

---

## 4. Admin API contract (summary)

All require Bearer JWT unless noted.

| Area | Methods |
|------|---------|
| Site aggregate | `GET /api/admin/site-data` |
| Settings / SEO / layout / hero / content / FAQ / about / promo | PUT variants under `/api/admin/...` |
| Products | `PUT/DELETE /api/admin/products/:slug` |
| Uploads | hero, product, variant, sticker, blog, brand-logo |
| Reviews / comments | list, approve, delete |
| Leads / newsletter / referrals | list, delete, follow-up |
| Orders | `GET /api/admin/orders` |
| Analytics / growth / activity / acceptances / SEO audit | GET (+ clear analytics) |
| Backup | `GET /api/admin/backup` JSON download |

Exact paths match `server.js` admin section; treat that file as source of truth for path strings.

---

## 5. Error & status codes

| Code | When |
|------|------|
| 200 | Success |
| 400 | Validation / bad input |
| 401 | Auth failure / bad webhook signature |
| 404 | Missing resource |
| 429 | Rate limit |
| 500 | Unexpected server error |
| 503 | Frontend missing or auth not configured |

---

## 6. Rate limits (current)

| Scope | Window | Max |
|-------|--------|-----|
| Global `/api/*` | 15 min | 300 |
| Public writes (newsletter, WhatsApp, reviews, referral, artwork) | 15 min | 30 |
| Admin login | 15 min | 20 |
| Password change | 15 min | 5 |

Scaling note: limits are **per process**. Multiple processes need a shared store (Redis) before raising concurrency — Phase 4 only.

---

## 7. Scaling design

### 7.1 Current capacity model (Phase 1)

```
1 × Node process (PM2)
  + file JSON (+ write locks)
  + Hostinger 2 CPU / 3 GB RAM
  + free CDN
```

**Fits:** SME traffic, occasional spikes, current subscriptions.  
**Does not fit:** Shopify-class concurrent checkout on this host alone.

### 7.2 Vertical levers (still $0 or included)

| Lever | Effect |
|-------|--------|
| PM2 450M restart | Contain memory leaks |
| Write locks / future MySQL orders | Safer concurrent order writes |
| CDN for hashed `/assets/*` | Offload static |
| Health monitoring | Faster incident response |
| Staging slot | Safer deploys |

### 7.3 Horizontal path (Phase 4 — budget required)

| Step | Requirement |
|------|-------------|
| 1. MySQL (or managed DB) for mutable state | No shared filesystem writes across nodes |
| 2. Stateless Node (JWT already mostly stateless) | No in-memory order queues as source of truth |
| 3. Shared session/rate-limit store if needed | Redis or equivalent |
| 4. Uploads on object storage or networked FS | Inode + local disk limits |
| 5. Load balancer + N Node processes | Beyond Business single-app comfort |
| 6. Queue for webhooks/email | Absorb Paystack retries / SMTP |

### 7.4 What stays single-process safe

- JWT admin auth  
- Server-side price computation  
- Paystack verify-then-update pattern  
- SPA static assets via CDN  

### 7.5 Explicit non-goals under current budget

- Multi-region active-active  
- Auto-scaling groups  
- Full PCI scope redesign beyond Paystack-hosted checkout  

---

## 8. Versioning policy

- **No URL version prefix today** (`/api/v1`).  
- Breaking changes: dual-run old+new fields ≥ 30 days, or admin-only first.  
- Additive fields on `/api/health` and order objects are preferred over renames.

---

## 9. Contract test ideas (CI)

- `POST /api/orders/create` rejects empty cart and missing customer fields.  
- Health returns `ok: true` and `paystackConfigured` boolean.  
- Webhook rejects bad signature with 401.  
- Admin routes without token return 401.

---

*API shapes are defined by production `server.js`. This doc is the human contract; code wins if they diverge — then update this file.*
