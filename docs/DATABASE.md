# Sleekblue Media Houz — Database Schema & Migration Specs

**Status:** Design only (Phase 2). Do **not** implement until Phase 1 exit criteria are met.  
**Constraint:** $0 extra — use Hostinger-included MySQL (≤ 3 GB per DB, up to 150 DBs).  
**Charset:** `utf8mb4` / `utf8mb4_unicode_ci`  
**Engine:** InnoDB  

---

## 1. Goals

1. Map today’s file-based stores to relational tables without changing public API shapes.
2. Migrate **orders first** (highest concurrency / money risk).
3. Keep CMS (`site-data.json`) on files until there is a clear need.
4. Support dual-read / dual-write during cutover and full rollback to JSON.

---

## 2. Current stores → target tables

| Current store | Target | Phase |
|---------------|--------|--------|
| `runtime/orders.json` | `orders` + `order_line_items` | **2A (first)** |
| `runtime/leads.json` | `leads` | 2B |
| `runtime/newsletter.json` | `newsletter_subscribers` | 2B |
| `runtime/pending-reviews.json` | `reviews` | 2B |
| `runtime/comments.json` | `blog_comments` | 2B |
| `runtime/referrals.json` | `referrals` | 2B |
| `runtime/activity-log.json` | `activity_log` | 2B |
| `runtime/acceptances.json` | `terms_acceptances` | 2C (optional) |
| `runtime/analytics.json` | `analytics_events` or keep file | 2C (optional; high volume) |
| `runtime/admin-config.json` | `admin_users` | 2B |
| `site-data.json` (CMS) | keep file **or** `site_documents` JSON column | 2C+ |
| `uploads/*` | filesystem (unchanged) | — |

---

## 3. Schema (MySQL)

### 3.1 Bootstrap

```sql
CREATE DATABASE IF NOT EXISTS sleekblue
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sleekblue;
```

### 3.2 Orders (Phase 2A)

```sql
CREATE TABLE orders (
  id              VARCHAR(64)  NOT NULL,
  ref             VARCHAR(64)  NOT NULL,
  status          ENUM('pending','paid','cancelled','refunded','amount_mismatch')
                  NOT NULL DEFAULT 'pending',
  payment_method  ENUM('bank','paystack','whatsapp') NOT NULL DEFAULT 'bank',

  customer_name    VARCHAR(100) NOT NULL,
  customer_phone   VARCHAR(30)  NOT NULL,
  customer_email   VARCHAR(254) NULL,
  customer_address VARCHAR(300) NOT NULL,
  customer_city    VARCHAR(100) NOT NULL,
  customer_notes   VARCHAR(1000) NULL,

  subtotal         INT NOT NULL COMMENT 'NGN whole naira',
  discount         DECIMAL(5,4) NOT NULL DEFAULT 0,
  discount_amount  INT NOT NULL DEFAULT 0,
  total            INT NOT NULL,
  amount_kobo      INT NOT NULL,

  paystack_id      VARCHAR(64) NULL,
  paystack_channel VARCHAR(32) NULL,
  paystack_currency VARCHAR(8) NULL,
  paystack_paid_at DATETIME NULL,
  paystack_raw     JSON NULL COMMENT 'optional full payload snapshot',

  created_at  DATETIME(3) NOT NULL,
  paid_at     DATETIME(3) NULL,
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
              ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_ref (ref),
  KEY idx_orders_status_created (status, created_at),
  KEY idx_orders_customer_phone (customer_phone),
  KEY idx_orders_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE order_line_items (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id    VARCHAR(64) NOT NULL,
  product_id  VARCHAR(64) NULL,
  slug        VARCHAR(100) NULL,
  name        VARCHAR(200) NOT NULL,
  size_label  VARCHAR(50) NULL,
  quantity    INT NOT NULL,
  unit_price  DECIMAL(12,2) NOT NULL,
  line_total  INT NOT NULL,

  PRIMARY KEY (id),
  KEY idx_line_order (order_id),
  CONSTRAINT fk_line_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
```

**API mapping (no client change):**

| JSON field | Column(s) |
|------------|-----------|
| `id` | `orders.id` |
| `ref` | `orders.ref` |
| `status` | `orders.status` |
| `paymentMethod` | `orders.payment_method` |
| `customer.*` | `customer_*` columns |
| `lineItems[]` | `order_line_items` rows |
| `subtotal`, `discount`, `discountAmount`, `total`, `amountKobo` | matching columns |
| `paystackData` | `paystack_*` + optional `paystack_raw` |
| `createdAt`, `paidAt` | `created_at`, `paid_at` |

### 3.3 Leads, newsletter, reviews, comments, referrals (Phase 2B)

```sql
CREATE TABLE leads (
  id            VARCHAR(64) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  phone         VARCHAR(30) NOT NULL,
  source        VARCHAR(100) NULL,
  followed_up   TINYINT(1) NOT NULL DEFAULT 0,
  followed_up_at BIGINT NULL COMMENT 'unix ms',
  ts            BIGINT NOT NULL COMMENT 'unix ms',
  PRIMARY KEY (id),
  KEY idx_leads_ts (ts)
) ENGINE=InnoDB;

CREATE TABLE newsletter_subscribers (
  id    VARCHAR(64) NOT NULL,
  email VARCHAR(254) NOT NULL,
  ts    BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_newsletter_email (email)
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id        VARCHAR(64) NOT NULL,
  name      VARCHAR(100) NOT NULL,
  body      VARCHAR(2000) NOT NULL,
  rating    TINYINT NOT NULL,
  review_date DATE NULL,
  approved  TINYINT(1) NOT NULL DEFAULT 0,
  visible   TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_reviews_approved (approved, visible)
) ENGINE=InnoDB;

CREATE TABLE blog_comments (
  id        VARCHAR(64) NOT NULL,
  slug      VARCHAR(200) NOT NULL,
  name      VARCHAR(100) NOT NULL,
  body      VARCHAR(2000) NOT NULL,
  ts        BIGINT NOT NULL,
  approved  TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_comments_slug (slug, approved)
) ENGINE=InnoDB;

CREATE TABLE referrals (
  id     VARCHAR(64) NOT NULL,
  code   VARCHAR(32) NOT NULL,
  name   VARCHAR(100) NOT NULL,
  phone  VARCHAR(30) NULL,
  email  VARCHAR(254) NULL,
  source VARCHAR(100) NULL,
  ts     BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_referral_code (code)
) ENGINE=InnoDB;

CREATE TABLE activity_log (
  id     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ts     BIGINT NOT NULL,
  action VARCHAR(100) NOT NULL,
  detail VARCHAR(500) NULL,
  PRIMARY KEY (id),
  KEY idx_activity_ts (ts)
) ENGINE=InnoDB;

CREATE TABLE admin_users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_username (username)
) ENGINE=InnoDB;
```

### 3.4 Optional analytics & terms (Phase 2C)

```sql
CREATE TABLE analytics_events (
  id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ts    BIGINT NOT NULL,
  type  VARCHAR(64) NULL,
  slug  VARCHAR(200) NULL,
  path  VARCHAR(500) NULL,
  ref   VARCHAR(200) NULL,
  name  VARCHAR(200) NULL,
  value VARCHAR(200) NULL,
  ip    VARCHAR(45) NULL,
  PRIMARY KEY (id),
  KEY idx_analytics_ts (ts),
  KEY idx_analytics_type_ts (type, ts)
) ENGINE=InnoDB;

CREATE TABLE terms_acceptances (
  id  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ts  BIGINT NOT NULL,
  ip  VARCHAR(45) NULL,
  ua  VARCHAR(500) NULL,
  PRIMARY KEY (id),
  KEY idx_terms_ts (ts)
) ENGINE=InnoDB;
```

**Note:** Analytics is append-heavy. Prefer keeping the file + cap (current behavior) until volume justifies MySQL and retention policy.

### 3.5 Optional CMS document store (later)

```sql
CREATE TABLE site_documents (
  doc_key    VARCHAR(64) NOT NULL COMMENT 'e.g. settings, hero, content',
  payload    JSON NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
             ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (doc_key)
) ENGINE=InnoDB;
```

Use only if editing conflicts on `site-data.json` become real. Until then, **leave CMS on disk**.

---

## 4. Environment

Add to Hostinger env / `.env` (never commit secrets):

```bash
# Optional — when set, order paths use MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sleekblue
DB_USER=sleekblue_app
DB_PASSWORD=  # strong secret
DB_CONNECTION_LIMIT=5

# Feature flags
ORDERS_STORE=file    # file | mysql | dual
```

`ORDERS_STORE`:

| Value | Behavior |
|-------|----------|
| `file` | Current JSON only (default) |
| `dual` | Write both; read MySQL primary, fall back file |
| `mysql` | MySQL only |

Keep connection pool small (`≤5`) on shared Hostinger.

---

## 5. Migration plan

### 5.1 Pre-flight

1. Phase 1 live and stable (health + Paystack smoke test).
2. Create MySQL DB + user in hPanel (included).
3. Apply schema SQL above (2A tables minimum).
4. Snapshot files: copy `runtime/orders.json` (and others as needed) off-box.
5. Confirm Hostinger daily backup is green.

### 5.2 Offline import (orders example)

One-shot script (run once on server or via SSH):

1. Read `runtime/orders.json`.
2. For each order: `INSERT` into `orders` + `order_line_items` in a transaction.
3. Log skipped duplicates on `ref` unique key.
4. Verify `COUNT(*)` matches JSON length (minus skips).

Pseudo:

```text
BEGIN
  for order in orders_json:
    INSERT orders (...)
    for line in order.lineItems:
      INSERT order_line_items (...)
COMMIT
```

### 5.3 Dual-write cutover

1. Deploy code with `ORDERS_STORE=dual`.
2. New creates / status / webhooks write **MySQL + file**.
3. Reads prefer MySQL; on miss, read file and optionally backfill.
4. Run 48–72h; compare counts and spot-check refs.
5. Switch `ORDERS_STORE=mysql`.
6. Keep file as cold backup for one billing cycle, then archive.

### 5.4 Rollback

| Stage | Action |
|-------|--------|
| Before `mysql`-only | Set `ORDERS_STORE=file`, restart PM2 |
| After dual issues | Same; file remains source of truth |
| After mysql-only with bad data | Restore `orders.json` from snapshot; set `file`; fix import; retry |

Never drop JSON backups until rollback window ends.

### 5.5 Order of store migrations

1. **orders** (money path)  
2. **leads / newsletter / referrals**  
3. **reviews / comments / activity_log / admin_users**  
4. analytics / terms / CMS only if needed  

---

## 6. Application change surface (when implementing)

Minimal touch points in `server.js` (or extracted `db/` module):

| Function today | Change |
|----------------|--------|
| `getRuntimeData('orders')` | Repository: `listOrders()` |
| `setRuntimeData('orders', …)` / write lock block | `insertOrder` / `updateOrderStatus` transactions |
| Paystack webhook order update | Single transaction by `ref` |
| Admin `GET /api/admin/orders` | `SELECT` + join line items → same JSON shape |

**Do not change** response JSON field names. Clients stay compatible.

Suggested module layout (future):

```text
src/db/
  pool.js          # mysql2 pool from env
  ordersRepo.js    # CRUD + webhook update
  migrate/
    001_orders.sql
    import-orders.mjs
```

Use `mysql2/promise` (or similar) only when Phase 2 starts — not required for Phase 1.

---

## 7. Indexing & size guards

- Orders: filter by `status`, `created_at`, `ref` (unique), phone lookup.
- Cap admin list queries with `LIMIT` / pagination when row count grows.
- Hostinger DB size limit **3 GB** per database — orders + lines stay small for SME volume; analytics is the risk (prefer file + cap or TTL delete).
- InnoDB + short transactions; avoid holding locks across Paystack HTTP calls (verify signature first, then short DB txn — already the pattern).

---

## 8. Security

- DB user: least privilege (`SELECT/INSERT/UPDATE` on `sleekblue.*` only; no `DROP`).
- Password only in Hostinger env, not in git.
- No public exposure of MySQL port.
- Continue Paystack HMAC verification before any status write.

---

## 9. Testing checklist (when implementing)

- [ ] Empty DB: create order → row + lines present  
- [ ] Webhook success → `paid` + `paid_at`  
- [ ] Webhook amount mismatch → `amount_mismatch`  
- [ ] Dual mode: kill MySQL briefly → file still accepts creates (or fails closed — document chosen behavior)  
- [ ] Import script idempotent on second run (unique `ref`)  
- [ ] Rollback to `ORDERS_STORE=file` restores prior behavior  
- [ ] Admin orders list matches previous JSON shape  

---

## 10. What we are explicitly not doing (now)

- No paid managed Postgres / PlanetScale / etc.
- No multi-region replication
- No full CMS migration to SQL in Phase 2A
- No code cutover until Phase 1 is done and business sees order-file pain

---

## 11. Relation to roadmap

| Roadmap phase | This doc |
|---------------|----------|
| Phase 1 | File store + hardening only |
| Phase 2 | Apply **§3.2 orders** + dual-write when triggered |
| Phase 2B–C | Remaining tables as needed |
| Phase 4 | Stateless multi-process assumes DB (this schema) |

---

*Design-only. Hostinger MySQL included. Zero extra cost to prepare; implementation is a deliberate Phase 2 decision.*
