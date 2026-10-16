/**
 * Sleekblue Media Houz — Express API Server
 * Serves the React frontend (dist/) and all /api/* routes.
 * Uses file-based JSON storage (site-data.json + runtime/*.json).
 */

// Load .env in development (Node 20.6+ supports --env-file flag, but this
// covers older Node 18+ environments automatically)
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath as _ftu } from 'url'
try {
  const __envDir = dirname(_ftu(import.meta.url))
  const envText = readFileSync(resolve(__envDir, '.env'), 'utf8')
  for (const line of envText.split('\n')) {
    const clean = line.trim()
    if (!clean || clean.startsWith('#')) continue
    const eq = clean.indexOf('=')
    if (eq === -1) continue
    const key = clean.slice(0, eq).trim()
    const val = clean.slice(eq + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
} catch { /* .env not found — rely on host-level env vars */ }

import express from 'express'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import { ALL_PRODUCTS, STICKER_SIZE_PRICES, findNearestSize } from './src/data/products.js'

const PRODUCTS_BY_SLUG = new Map(ALL_PRODUCTS.map(p => [p.slug, p]))
const PRODUCTS_BY_ID   = new Map(ALL_PRODUCTS.map(p => [p.id, p]))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Config ──────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10)
const IS_PROD = process.env.NODE_ENV === 'production'

// ── Production startup guard ─────────────────────────────────────────────────
// Collect ALL missing / weak secrets before exiting so operators can fix
// everything in one deploy cycle rather than discovering issues one by one.
if (IS_PROD) {
  const fatal = []

  if (!process.env.JWT_SECRET) {
    fatal.push('  ✗ JWT_SECRET       — required; generate with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"')
  } else if (process.env.JWT_SECRET.length < 32) {
    fatal.push('  ✗ JWT_SECRET       — too short (minimum 32 characters); generate a new value with the command above')
  }

  if (!process.env.ADMIN_PASSWORD) {
    fatal.push('  ✗ ADMIN_PASSWORD   — required; set a strong password in your .env file')
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    fatal.push('  ✗ PAYSTACK_SECRET_KEY — required; find it in Paystack Dashboard → Settings → API Keys')
  }

  if (fatal.length > 0) {
    console.error('\n[FATAL] Server cannot start — the following required environment variables are missing or invalid:\n')
    fatal.forEach(msg => console.error(msg))
    console.error('\nCopy .env.example → .env, fill in every value, then restart.\n')
    process.exit(1)
  }
}

const DEV_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex')
const JWT_SECRET = process.env.JWT_SECRET || DEV_FALLBACK_SECRET
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'dev_only_change_me'
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''


// ─── Paths ───────────────────────────────────────────────────────────────────
// DATA_ROOT and UPLOADS_DIR can be overridden via environment variables so that
// persistent storage survives Hostinger redeploys (which wipe the .builds tree).
// When env vars are absent the behaviour is identical to before: all paths are
// resolved relative to __dirname, exactly as they were originally.
const DATA_ROOT   = process.env.DATA_DIR    ? path.resolve(process.env.DATA_DIR)    : __dirname
const UPLOADS_DIR = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(__dirname, 'uploads')
const DATA_FILE   = path.join(DATA_ROOT, 'site-data.json')
const RUNTIME_DIR = path.join(DATA_ROOT, 'runtime')

// Robustly locate the built frontend — walk each candidate path until one
// contains index.html. Covers Hostinger layouts where __dirname != cwd,
// and builds that land in public/ or build/ instead of dist/.
const DIST_CANDIDATES = [
  path.join(__dirname, 'dist'),
  path.join(process.cwd(), 'dist'),
  path.join(__dirname, '..', 'dist'),
  path.join(__dirname, 'public'),
  path.join(process.cwd(), 'public'),
  path.join(__dirname, 'build'),
  path.join(process.cwd(), 'build'),
]
const DIST_DIR = DIST_CANDIDATES.find(d => fs.existsSync(path.join(d, 'index.html'))) || DIST_CANDIDATES[0]

// Ensure directories exist
for (const dir of [RUNTIME_DIR, UPLOADS_DIR,
  path.join(UPLOADS_DIR, 'hero'),
  path.join(UPLOADS_DIR, 'products'),
  path.join(UPLOADS_DIR, 'variants'),
  path.join(UPLOADS_DIR, 'stickers'),
  path.join(UPLOADS_DIR, 'blog'),
  path.join(UPLOADS_DIR, 'artwork'),
  path.join(UPLOADS_DIR, 'brand'),
]) {
  fs.mkdirSync(dir, { recursive: true })
}

// ─── File-based DB (hardened for single-process Hostinger) ───────────────────
// Atomic writes via temp+rename. Critical keys (especially orders) are serialized
// through an in-process queue so concurrent requests do not interleave writes.

function readJson(filePath, defaultVal = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return typeof defaultVal === 'function' ? defaultVal() : structuredClone(defaultVal)
  }
}

function writeJson(filePath, data) {
  const tmp = filePath + '.' + crypto.randomBytes(4).toString('hex') + '.tmp'
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
    fs.renameSync(tmp, filePath)
    return true
  } catch (err) {
    console.error(`[DB WRITE ERROR] Failed to write ${filePath}:`, err.message)
    try { fs.unlinkSync(tmp) } catch {}
    return false
  }
}

const runtimePath = (name) => path.join(RUNTIME_DIR, `${name}.json`)

// Simple per-key write queue (single process only — perfect for Hostinger Business)
const _writeQueues = new Map()
function withWriteLock(key, fn) {
  const prev = _writeQueues.get(key) || Promise.resolve()
  const next = prev.then(() => fn()).catch((err) => {
    console.error(`[WRITE LOCK] ${key}:`, err.message)
  })
  // Prevent unhandled rejection from breaking the chain
  _writeQueues.set(key, next.catch(() => {}))
  return next
}

// Site data helpers
function getSiteData() { return readJson(DATA_FILE, {}) }
function patchSiteData(patch) {
  return withWriteLock('site-data', () => {
    const data = getSiteData()
    const merged = deepMerge(data, patch)
    writeJson(DATA_FILE, merged)
    return merged
  })
}
function deepMerge(target, source) {
  const out = { ...target }
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      out[k] = deepMerge(target[k], v)
    } else {
      out[k] = v
    }
  }
  return out
}

// Runtime data helpers
function getRuntimeData(name, defaultVal = []) {
  return readJson(runtimePath(name), defaultVal)
}
function setRuntimeData(name, data) {
  return withWriteLock(name, () => {
    writeJson(runtimePath(name), data)
  })
}

// ─── Admin Config ─────────────────────────────────────────────────────────────
const ADMIN_CONFIG_PATH = runtimePath('admin-config')
function getAdminConfig() {
  const cfg = readJson(ADMIN_CONFIG_PATH, null)
  if (cfg) return cfg
  // First run: hash the env password
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10)
  const newCfg = { username: ADMIN_USERNAME, passwordHash: hash }
  writeJson(ADMIN_CONFIG_PATH, newCfg)
  return newCfg
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
function logActivity(action, detail = '') {
  const log = getRuntimeData('activity-log', [])
  log.unshift({ ts: Date.now(), action, detail })
  if (log.length > 500) log.splice(500)
  setRuntimeData('activity-log', log)
}

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express()

app.set('trust proxy', 1)

// Security headers
// CSP is intentionally disabled: GA4 and Meta Pixel are injected dynamically by the
// frontend (TrackingInjector) using createElement, which cannot satisfy a strict CSP.
// All other helmet defaults (HSTS, X-Frame-Options, X-Content-Type-Options, etc.) are active.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))
app.use(compression())

// ─── Concurrency guard (single-process Hostinger shield) ─────────────────────
// Caps simultaneous in-flight HTTP requests so one traffic spike cannot exhaust
// the 2 CPU / 3 GB shared plan. Excess clients get 503 + Retry-After instead of
// hanging the process. Zero extra cost.
const MAX_IN_FLIGHT = Number(process.env.MAX_IN_FLIGHT || 48)
let inFlight = 0
app.use((req, res, next) => {
  if (req.path === '/api/health' || req.path === '/api/ready') return next()
  if (inFlight >= MAX_IN_FLIGHT) {
    res.setHeader('Retry-After', '2')
    return res.status(503).json({
      ok: false,
      error: 'Server is busy. Please try again in a moment.',
      code: 'OVERLOADED',
    })
  }
  inFlight += 1
  const done = () => { inFlight = Math.max(0, inFlight - 1) }
  res.on('finish', done)
  res.on('close', done)
  next()
})

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }))
const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, please try again later' } })
const passwordLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { ok: false, error: 'Too many password change attempts, please try again later' } })
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: true, skipped: true },
})
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many order attempts, please try again later' },
})

app.use('/api/newsletter', writeLimiter)
app.use('/api/subscribe-whatsapp', writeLimiter)
app.use('/api/reviews/submit', writeLimiter)
app.use('/api/referral/generate', writeLimiter)
app.use('/api/upload/artwork', writeLimiter)
app.use('/api/analytics/track', analyticsLimiter)
app.use('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many login attempts' } }))

// The `verify` callback captures the raw Buffer before JSON parsing — required
// to compute the HMAC-SHA512 signature for the Paystack webhook.
app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buf) => { req.rawBody = buf },
}))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: '7d',
  etag: true,
  setHeaders(res) {
    res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400')
  },
}))
// Serve attached assets
app.use('/assets', express.static(path.join(__dirname, 'attached_assets')))

// ─── JWT Auth Middleware ───────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!JWT_SECRET) return res.status(503).json({ error: 'Admin auth is not configured' })
  const header = req.headers['authorization'] || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const cfg = getAdminConfig()
    if (decoded.sig && decoded.sig !== cfg.passwordHash.slice(-10)) {
      return res.status(401).json({ error: 'Password changed. Please log in again.' })
    }
    req.admin = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ─── Multer ───────────────────────────────────────────────────────────────────
// ─── Input helpers ────────────────────────────────────────────────────────────
function str(val, max = 500) {
  if (typeof val !== 'string') return ''
  return val.slice(0, max).trim()
}
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

// Allowed image extensions mapped to their MIME types — double-checks that the
// file extension and the browser-reported MIME type agree, reducing spoofing risk.
const ALLOWED_IMAGE_EXT = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

const ALLOWED_ARTWORK_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.ai', '.psd', '.eps', '.zip'])

// BUG 2 FIX: default fieldName changed from 'file' to 'image' to match
// ImageManager.jsx / StickerPrices.jsx / ContentCMS.jsx which all append field 'image'.
function makeUploader(subdir, { fieldName = 'image', allowAudio = false, allowArtwork = false, maxMB = 10 } = {}) {
  const storage = multer.diskStorage({
    destination: path.join(UPLOADS_DIR, subdir),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.bin'
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`)
    },
  })
  return multer({
    storage,
    limits: { fileSize: maxMB * 1024 * 1024, files: 1 },
    fileFilter: (_, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      if (allowArtwork) {
        const ok = ALLOWED_ARTWORK_EXT.has(ext)
        return cb(ok ? null : new Error(`Disallowed file extension: ${ext}`), ok)
      }
      const expectedMime = ALLOWED_IMAGE_EXT[ext]
      const isImage = expectedMime && file.mimetype === expectedMime
      const isAudio = allowAudio && /^audio\/(mpeg|mp4|ogg|wav|webm)$/.test(file.mimetype) && /\.(mp3|mp4|ogg|wav|webm)$/i.test(file.originalname)
      const ok = isImage || isAudio
      cb(ok ? null : new Error(`Unsupported or mismatched file type: ${file.mimetype}`), ok)
    },
  }).single(fieldName)
}

const heroUploader    = makeUploader('hero')
const productUploader = makeUploader('products')
const variantUploader = makeUploader('variants')
const stickerUploader = makeUploader('stickers')
// BUG 2 FIX: BlogCMS.jsx sends fd.append('file', ...) so must stay on 'file'
const blogUploader    = makeUploader('blog', { fieldName: 'file', allowAudio: true, maxMB: 20 })
const artworkUploader = makeUploader('artwork', { fieldName: 'artwork', allowArtwork: true, maxMB: 20 })
const brandUploader   = makeUploader('brand')

function uploadMiddleware(uploader) {
  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err) return res.status(400).json({ ok: false, error: err.message })
      next()
    })
  }
}

// ─── Public API Routes ────────────────────────────────────────────────────────

// Settings (GA4, Meta Pixel, WhatsApp, etc.)
app.get('/api/settings', (_, res) => {
  const d = getSiteData()
  res.json(d.settings || {})
})

// Page layout
app.get('/api/page-layout', (_, res) => {
  const d = getSiteData()
  res.json(d.pageLayout || {})
})

// Hero
app.get('/api/hero', (_, res) => {
  const d = getSiteData()
  res.json(d.hero || {})
})

// Content (reviews, trustBar, footer, FAQ, bestSelling)
app.get('/api/content', (_, res) => {
  const d = getSiteData()
  res.json(d.content || {})
})

// SEO metadata
app.get('/api/seo', (_, res) => {
  const d = getSiteData()
  res.json(d.seo || {})
})

// Promo banner
app.get('/api/promo-banner', (_, res) => {
  const d = getSiteData()
  res.json(d.promoBanner || null)
})

// About page
app.get('/api/about', (_, res) => {
  const d = getSiteData()
  res.json(d.about || {})
})

// All product overrides (used by ComparisonPage)
app.get('/api/products', (_, res) => {
  const d = getSiteData()
  res.json({ productOverrides: d.productOverrides || {} })
})

// Single product override
app.get('/api/products/:slug', (req, res) => {
  const d = getSiteData()
  const overrides = (d.productOverrides || {})[req.params.slug] || null
  res.json(overrides)
})

// Product view stats (stub — returns 0)
app.get('/api/product/views/:slug', (req, res) => {
  const analytics = getRuntimeData('analytics', [])
  const slug = req.params.slug
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const views7d = analytics.filter(e => e.type === 'product_view' && e.slug === slug && e.ts > cutoff).length
  res.json({ views7d })
})

// Custom product images
app.get('/api/product-images', (_, res) => {
  const d = getSiteData()
  res.json(d.productImages || {})
})

// Variant images
app.get('/api/product-variant-images', (_, res) => {
  const d = getSiteData()
  res.json(d.variantImages || {})
})

// Sticker size images
app.get('/api/sticker-images', (_, res) => {
  const d = getSiteData()
  res.json(d.stickerImages || {})
})

// Blog posts (public — only approved)
app.get('/api/blog', (_, res) => {
  const d = getSiteData()
  const posts = (d.blogPosts || []).filter(p => p.published !== false)
  res.json(posts)
})

app.get('/api/blog/:slug', (req, res) => {
  const d = getSiteData()
  const post = (d.blogPosts || []).find(p => p.slug === req.params.slug)
  if (!post) return res.status(404).json({ error: 'Not found' })
  res.json(post)
})

app.post('/api/blog/:slug/view', (req, res) => {
  // Under ad traffic, never block the response on a view-counter write
  res.json({ ok: true })
  const mem = process.memoryUsage().heapUsed / (1024 * 1024)
  if (mem > 380 || inFlight > Math.floor(MAX_IN_FLIGHT * 0.85)) return
  try {
    const d = getSiteData()
    const posts = d.blogPosts || []
    const idx = posts.findIndex(p => p.slug === req.params.slug)
    if (idx >= 0) {
      posts[idx].views = (posts[idx].views || 0) + 1
      patchSiteData({ blogPosts: posts })
    }
  } catch (err) {
    console.error('[blog view] persist skipped:', err && err.message)
  }
})

app.get('/api/blog/:slug/comments', (req, res) => {
  const comments = getRuntimeData('comments', [])
  const approved = comments.filter(c => c.slug === req.params.slug && c.approved)
  res.json(approved)
})

app.post('/api/blog/:slug/comment', (req, res) => {
  const name    = str(req.body.name, 100)
  const comment = str(req.body.comment, 2000)
  if (!name || !comment) return res.status(400).json({ error: 'Name and comment required' })
  const slug = str(req.params.slug, 200)
  const comments = getRuntimeData('comments', [])
  const entry = { id: `CMT-${Date.now()}`, slug, name, comment, ts: Date.now(), approved: false }
  comments.unshift(entry)
  setRuntimeData('comments', comments)
  res.json({ ok: true })
})

// Newsletter subscribe
app.post('/api/newsletter', (req, res) => {
  const email = str(req.body.email, 254)
  if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Valid email required' })
  const subs = getRuntimeData('newsletter', [])
  if (!subs.find(s => s.email === email)) {
    subs.push({ id: `NL-${Date.now()}`, email, ts: Date.now() })
    setRuntimeData('newsletter', subs)
  }
  res.json({ ok: true })
})

// WhatsApp lead
app.post('/api/subscribe-whatsapp', (req, res) => {
  const name  = str(req.body.name, 100)
  const phone = str(req.body.phone, 30)
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' })
  if (!/^[\d\s\+\-\(\)]{7,20}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone number' })
  const leads = getRuntimeData('leads', [])
  leads.unshift({
    id: `LEAD-${Date.now()}`,
    name, phone,
    source: 'whatsapp-popup',
    ts: Date.now(),
    followedUp: false,
  })
  setRuntimeData('leads', leads)
  res.json({ ok: true })
})

// Review submit
app.post('/api/reviews/submit', (req, res) => {
  const name   = str(req.body.name, 100)
  const text   = str(req.body.text, 2000)
  const rating = Math.min(5, Math.max(1, parseInt(req.body.rating) || 5))
  if (!name || !text) return res.status(400).json({ error: 'Name and review required' })
  const reviews = getRuntimeData('pending-reviews', [])
  reviews.unshift({ id: `REV-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`, name, text, rating, date: new Date().toISOString(), approved: false, visible: false })
  setRuntimeData('pending-reviews', reviews)
  res.json({ ok: true })
})

// Analytics track — fail-soft under memory/concurrency pressure (orders always win)
const ANALYTICS_ALLOWED = [
  'type', 'slug', 'path', 'page', 'ref', 'name', 'value', 'qty', 'price',
  'device', 'referrer', 'details', 'event', 'target',
]
app.post('/api/analytics/track', (req, res) => {
  const entry = { ts: Date.now(), ip: req.ip }
  for (const key of ANALYTICS_ALLOWED) {
    if (req.body[key] !== undefined && req.body[key] !== null) {
      entry[key] = typeof req.body[key] === 'number' ? req.body[key] : str(String(req.body[key]), 300)
    }
  }
  // Normalize client field names / types
  if (!entry.path && entry.page) entry.path = entry.page
  if (entry.type === 'pageview') entry.type = 'page_view'
  if (entry.qty != null) entry.qty = Math.max(1, parseInt(entry.qty, 10) || 1)

  const heapMB = process.memoryUsage().heapUsed / (1024 * 1024)
  if (heapMB > 380 || inFlight > Math.floor(MAX_IN_FLIGHT * 0.85)) {
    return res.json({ ok: true, skipped: true })
  }
  try {
    const analytics = getRuntimeData('analytics', [])
    analytics.unshift(entry)
    if (analytics.length > 5000) analytics.splice(5000)
    setRuntimeData('analytics', analytics)
  } catch (err) {
    console.error('[analytics] persist failed:', err && err.message)
  }
  res.json({ ok: true })
})

// Artwork upload
app.post('/api/upload/artwork', uploadMiddleware(artworkUploader), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file' })
  res.json({ ok: true, url: `/uploads/artwork/${req.file.filename}` })
})

// Referral generate (public)
app.post('/api/referral/generate', (req, res) => {
  const name   = str(req.body.name, 100)
  const phone  = str(req.body.phone, 30)
  const email  = str(req.body.email, 254)
  const source = str(req.body.source, 100)
  if (!name) return res.status(400).json({ error: 'Name required' })
  const code = `SB-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
  const referrals = getRuntimeData('referrals', [])
  referrals.unshift({ id: `REF-${Date.now()}`, code, name, phone, email, source, ts: Date.now() })
  setRuntimeData('referrals', referrals)
  res.json({ ok: true, code })
})

// ─── Server-Side Pricing ──────────────────────────────────────────────────────
// Prices imported from src/data/products.js

function calcStickerUnitPrice(size, qty) {
  const s = STICKER_SIZE_PRICES[size] || STICKER_SIZE_PRICES['3x3"']
  const unitAt100  = s.p100  / 100
  const unitAt500  = s.p500  / 500
  const unitAt1000 = s.p1000 / 1000
  if (qty >= 3000) return unitAt100 * 0.75
  if (qty >= 2000) return unitAt100 * 0.775
  if (qty >= 1000) return unitAt1000
  if (qty >= 500)  return unitAt500
  return unitAt100
}

function serverGetDiscount(subtotal) {
  if (subtotal >= 100000) return 0.15
  if (subtotal >= 50000)  return 0.10
  if (subtotal >= 20000)  return 0.05
  return 0
}

function computeServerTotal(items) {
  const d = getSiteData()
  const overrides = d.productOverrides || {}
  const lineItems = []
  let subtotal = 0

  for (const item of items) {
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1))
    const prod = PRODUCTS_BY_SLUG.get(item.slug) || PRODUCTS_BY_ID.get(item.id)
    let unitPrice = 0

    if (prod && prod.isDieCut) {
      let effectiveSize = item.size
      if (!effectiveSize || !STICKER_SIZE_PRICES[effectiveSize]) {
        const nums = String(item.size || '').match(/[\d.]+/g)
        if (nums && nums.length >= 2) {
          effectiveSize = findNearestSize(parseFloat(nums[0]), parseFloat(nums[1]))
        } else {
          effectiveSize = '3x3"'
        }
      }
      unitPrice = calcStickerUnitPrice(effectiveSize, qty)
    } else if (prod) {
      const override = overrides[prod.slug || prod.id]
      const adminPrice = override && override.basePrice ? Number(override.basePrice) : null
      if (adminPrice !== null && !isNaN(adminPrice) && adminPrice > 0) {
        unitPrice = adminPrice
      } else {
        const table = prod.priceTable || []
        if (table.length > 0) {
          unitPrice = table[0].unitPrice
          for (const row of table) {
            if (qty >= row.qty) unitPrice = row.unitPrice
          }
        } else {
          unitPrice = prod.price || 0
        }
      }
    } else {
      unitPrice = Math.max(0, Number(item.price) || 0)
    }

    const lineTotal = Math.round(unitPrice * qty)
    subtotal += lineTotal
    lineItems.push({
      id: item.id || (prod ? prod.id : null),
      slug: str(item.slug || (prod ? prod.slug : ''), 100),
      name: str(item.name || (prod ? prod.name : ''), 200),
      size: str(item.size || '', 50) || null,
      quantity: qty,
      unitPrice: Math.round(unitPrice * 100) / 100,
      lineTotal
    })
  }

  const discount = serverGetDiscount(subtotal)
  const discountAmount = Math.round(subtotal * discount)
  const total = subtotal - discountAmount
  return { subtotal, discount, discountAmount, total, lineItems }
}

// ─── Orders ────────────────────────────────────────────────────────────────────
app.post('/api/orders/create', orderLimiter, async (req, res) => {
  const { items, customer, paymentMethod } = req.body
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ ok: false, error: 'Cart is empty' })
  
  const name    = str(customer?.name || '', 100)
  const phone   = str(customer?.phone || '', 30)
  const email   = str(customer?.email || '', 254)
  const address = str(customer?.address || '', 300)
  const city    = str(customer?.city || '', 100)
  const notes   = str(customer?.notes || '', 1000)
  const method  = ['bank', 'paystack', 'whatsapp'].includes(paymentMethod) ? paymentMethod : 'bank'

  if (!name || !phone || !address || !city) return res.status(400).json({ ok: false, error: 'Missing required customer fields' })

  const { subtotal, discount, discountAmount, total, lineItems } = computeServerTotal(items)
  const ref = `SBM-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
  
  const order = {
    id: `ORD-${Date.now()}`,
    ref,
    status: 'pending',
    paymentMethod: method,
    customer: { name, phone, email, address, city, notes },
    lineItems,
    subtotal,
    discount,
    discountAmount,
    total,
    amountKobo: total * 100,
    createdAt: new Date().toISOString(),
    paidAt: null,
    paystackData: null,
  }

  // Serialize order writes to avoid interleaving on the file-based store
  await withWriteLock('orders', () => {
    const orders = getRuntimeData('orders', [])
    orders.unshift(order)
    if (orders.length > 5000) orders.splice(5000)
    writeJson(runtimePath('orders'), orders)
  })
  logActivity('order_created', `${ref} — ₦${total}`)

  res.json({ ok: true, orderId: order.id, ref, total, amountKobo: order.amountKobo })
})

app.patch('/api/orders/:ref/status', requireAuth, async (req, res) => {
  const { status } = req.body
  if (!['pending', 'paid', 'cancelled', 'refunded'].includes(status)) return res.status(400).json({ error: 'Invalid status' })

  let found = false
  await withWriteLock('orders', () => {
    const orders = getRuntimeData('orders', [])
    const idx = orders.findIndex(o => o.ref === req.params.ref)
    if (idx < 0) return
    found = true
    orders[idx].status = status
    if (status === 'paid') orders[idx].paidAt = new Date().toISOString()
    writeJson(runtimePath('orders'), orders)
  })

  if (!found) return res.status(404).json({ error: 'Order not found' })
  logActivity('order_status_updated', `${req.params.ref} → ${status}`)
  res.json({ ok: true })
})


// ─── Verify Paystack payment for a single order (admin) ───────────────────────
// Use when webhook was missed. Calls Paystack Transaction Verify API.
app.post('/api/admin/orders/:ref/verify-paystack', requireAuth, async (req, res) => {
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(503).json({ ok: false, error: 'PAYSTACK_SECRET_KEY not configured' })
  }

  const ref = str(req.params.ref || '', 80)
  if (!ref) return res.status(400).json({ ok: false, error: 'Missing order ref' })

  const orders = getRuntimeData('orders', [])
  const order = orders.find(o => o.ref === ref)
  if (!order) return res.status(404).json({ ok: false, error: 'Order not found' })
  if (order.paymentMethod !== 'paystack') {
    return res.status(400).json({ ok: false, error: 'Only Paystack orders can be verified this way' })
  }
  if (order.status === 'paid') {
    return res.json({ ok: true, alreadyPaid: true, status: 'paid', order })
  }

  let paystackRes
  try {
    paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (err) {
    return res.status(502).json({ ok: false, error: 'Could not reach Paystack', detail: String(err?.message || err) })
  }

  const body = await paystackRes.json().catch(() => ({}))
  if (!paystackRes.ok || !body.status) {
    return res.status(400).json({
      ok: false,
      error: body.message || 'Paystack verification failed',
      paystack: body,
    })
  }

  const data = body.data || {}
  if (data.status !== 'success') {
    return res.json({
      ok: true,
      paid: false,
      status: data.status || 'unknown',
      message: `Paystack reports status: ${data.status || 'unknown'} (not success)`,
      paystack: { status: data.status, amount: data.amount, channel: data.channel },
    })
  }

  const chargedKobo = data.amount
  let resultStatus = 'paid'
  let updated = null

  await withWriteLock('orders', () => {
    const list = getRuntimeData('orders', [])
    const idx = list.findIndex(o => o.ref === ref)
    if (idx < 0) return
    if (list[idx].status === 'paid') {
      updated = list[idx]
      return
    }
    if (chargedKobo !== list[idx].amountKobo) {
      list[idx].status = 'amount_mismatch'
      resultStatus = 'amount_mismatch'
      list[idx].paystackData = data
      writeJson(runtimePath('orders'), list)
      logActivity('order_amount_mismatch', `${ref} (verify)`)
      updated = list[idx]
      return
    }
    list[idx].status = 'paid'
    list[idx].paidAt = data.paid_at || new Date().toISOString()
    list[idx].paystackData = {
      id: data.id,
      channel: data.channel,
      currency: data.currency,
      paidAt: data.paid_at,
      verifiedAt: new Date().toISOString(),
    }
    writeJson(runtimePath('orders'), list)
    logActivity('order_paid', `${ref} (verify)`)
    updated = list[idx]
  })

  if (!updated) return res.status(404).json({ ok: false, error: 'Order not found during update' })

  res.json({
    ok: true,
    paid: resultStatus === 'paid',
    status: resultStatus,
    order: updated,
    message: resultStatus === 'paid'
      ? 'Payment confirmed with Paystack. Order marked paid.'
      : resultStatus === 'amount_mismatch'
        ? 'Paystack charged a different amount than this order total.'
        : 'Updated',
  })
})

// ─── Bulk verify all pending Paystack orders ──────────────────────────────────
app.post('/api/admin/orders/verify-paystack-pending', requireAuth, async (req, res) => {
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(503).json({ ok: false, error: 'PAYSTACK_SECRET_KEY not configured' })
  }

  const pending = getRuntimeData('orders', []).filter(
    o => o.paymentMethod === 'paystack' && o.status === 'pending'
  )
  const results = []

  for (const order of pending.slice(0, 50)) {
    try {
      const paystackRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(order.ref)}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      )
      const body = await paystackRes.json().catch(() => ({}))
      const data = body.data || {}
      if (!body.status || data.status !== 'success') {
        results.push({ ref: order.ref, paid: false, status: data.status || 'not_found' })
        continue
      }
      let final = 'pending'
      await withWriteLock('orders', () => {
        const list = getRuntimeData('orders', [])
        const idx = list.findIndex(o => o.ref === order.ref)
        if (idx < 0 || list[idx].status === 'paid') return
        if (data.amount !== list[idx].amountKobo) {
          list[idx].status = 'amount_mismatch'
          list[idx].paystackData = data
          final = 'amount_mismatch'
        } else {
          list[idx].status = 'paid'
          list[idx].paidAt = data.paid_at || new Date().toISOString()
          list[idx].paystackData = {
            id: data.id,
            channel: data.channel,
            currency: data.currency,
            paidAt: data.paid_at,
            verifiedAt: new Date().toISOString(),
          }
          final = 'paid'
          logActivity('order_paid', `${order.ref} (bulk-verify)`)
        }
        writeJson(runtimePath('orders'), list)
      })
      results.push({ ref: order.ref, paid: final === 'paid', status: final })
    } catch (err) {
      results.push({ ref: order.ref, paid: false, status: 'error', error: String(err?.message || err) })
    }
  }

  res.json({
    ok: true,
    checked: results.length,
    paidCount: results.filter(r => r.paid).length,
    results,
  })
})

// ─── Paystack Webhook ─────────────────────────────────────────────────────────
app.post('/api/webhooks/paystack', async (req, res) => {
  const sig = req.headers['x-paystack-signature']
  if (!PAYSTACK_SECRET_KEY || !sig || !req.rawBody) return res.status(400).json({ error: 'Webhook unconfigured or invalid' })

  const expected = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(req.rawBody).digest('hex')
  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const event = req.body
  // Acknowledge immediately so Paystack does not retry while we process
  res.json({ ok: true })

  if (event.event !== 'charge.success' || event.data?.status !== 'success') return

  const ref = event.data?.reference
  if (!ref) return

  await withWriteLock('orders', () => {
    const orders = getRuntimeData('orders', [])
    const idx = orders.findIndex(o => o.ref === ref)
    if (idx < 0 || orders[idx].status === 'paid') return

    const chargedKobo = event.data?.amount
    if (chargedKobo !== orders[idx].amountKobo) {
      orders[idx].status = 'amount_mismatch'
      orders[idx].paystackData = event.data
      writeJson(runtimePath('orders'), orders)
      logActivity('order_amount_mismatch', `${ref}`)
      return
    }

    orders[idx].status = 'paid'
    orders[idx].paidAt = new Date().toISOString()
    orders[idx].paystackData = {
      id: event.data?.id,
      channel: event.data?.channel,
      currency: event.data?.currency,
      paidAt: event.data?.paid_at,
    }
    writeJson(runtimePath('orders'), orders)
    logActivity('order_paid', `${ref}`)
  })
})

// ─── Admin Auth ────────────────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body
  const cfg = getAdminConfig()
  if (username !== cfg.username) {
    logActivity('login_failed', `username: ${username}`)
    return res.status(401).json({ ok: false, error: 'Invalid credentials' })
  }
  const valid = bcrypt.compareSync(password, cfg.passwordHash)
  if (!valid) {
    logActivity('login_failed', `username: ${username}`)
    return res.status(401).json({ ok: false, error: 'Invalid credentials' })
  }
  const token = jwt.sign({ username, sig: cfg.passwordHash.slice(-10) }, JWT_SECRET, { expiresIn: '7d' })
  logActivity('login', `username: ${username}`)
  res.json({ ok: true, token })
})

app.put('/api/admin/password', passwordLimiter, requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body
  const cfg = getAdminConfig()
  if (!bcrypt.compareSync(currentPassword, cfg.passwordHash)) {
    return res.status(400).json({ ok: false, error: 'Current password incorrect' })
  }
  cfg.passwordHash = bcrypt.hashSync(newPassword, 10)
  writeJson(ADMIN_CONFIG_PATH, cfg)
  logActivity('password_changed')
  res.json({ ok: true })
})

// ─── Admin — Aggregated Site Data ─────────────────────────────────────────────
app.get('/api/admin/site-data', requireAuth, (_, res) => {
  const d = getSiteData()
  const leads = getRuntimeData('leads', [])
  const newsletter = getRuntimeData('newsletter', [])
  const reviews = getRuntimeData('pending-reviews', [])
  res.json({ ...d, leads, newsletter, reviews })
})

// ─── Admin — Settings ─────────────────────────────────────────────────────────
app.put('/api/admin/settings', requireAuth, (req, res) => {
  patchSiteData({ settings: req.body })
  logActivity('settings_updated')
  res.json({ ok: true })
})

// ─── Admin — SEO ──────────────────────────────────────────────────────────────
app.put('/api/admin/seo', requireAuth, (req, res) => {
  patchSiteData({ seo: req.body })
  logActivity('seo_updated')
  res.json({ ok: true })
})

// ─── Admin — Page Layout ──────────────────────────────────────────────────────
app.put('/api/admin/page-layout', requireAuth, (req, res) => {
  patchSiteData({ pageLayout: req.body })
  logActivity('page_layout_updated')
  res.json({ ok: true })
})

// ─── Admin — Hero ─────────────────────────────────────────────────────────────
app.put('/api/admin/hero', requireAuth, (req, res) => {
  const d = getSiteData()
  const hero = { ...(d.hero || {}), ...req.body }
  patchSiteData({ hero })
  logActivity('hero_updated')
  res.json({ ok: true })
})

app.put('/api/admin/hero/default-slides', requireAuth, (req, res) => {
  const d = getSiteData()
  const hero = { ...(d.hero || {}), hiddenDefaultSlides: req.body.hiddenDefaultSlides || [] }
  patchSiteData({ hero })
  res.json({ ok: true })
})

app.put('/api/admin/hero/extra-default-visibility', requireAuth, (req, res) => {
  const d = getSiteData()
  const hero = { ...(d.hero || {}), hiddenExtraDefaultSlides: req.body.hiddenExtraDefaultSlides || [] }
  patchSiteData({ hero })
  res.json({ ok: true })
})

// Hero image uploads
app.post('/api/admin/upload/hero', requireAuth, uploadMiddleware(heroUploader), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file' })
  const url = `/uploads/hero/${req.file.filename}`
  const d = getSiteData()
  const hero = d.hero || {}
  const customSlides = [...(hero.customSlides || []), { url, label: req.body.label || '' }]
  patchSiteData({ hero: { ...hero, customSlides } })
  logActivity('hero_image_uploaded', url)
  res.json({ ok: true, url })
})

app.delete('/api/admin/upload/hero', requireAuth, (req, res) => {
  const { url } = req.body
  const d = getSiteData()
  const hero = d.hero || {}
  const customSlides = (hero.customSlides || []).filter(s => s.url !== url)
  patchSiteData({ hero: { ...hero, customSlides } })
  // Try to delete file
  tryDeleteUpload(url)
  logActivity('hero_image_deleted', url)
  res.json({ ok: true })
})

app.put('/api/admin/upload/hero/reorder', requireAuth, (req, res) => {
  const { slides } = req.body
  const d = getSiteData()
  patchSiteData({ hero: { ...(d.hero || {}), customSlides: slides } })
  res.json({ ok: true })
})

// Extra default slides
app.post('/api/admin/upload/hero/extra-default', requireAuth, uploadMiddleware(heroUploader), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file' })
  const url = `/uploads/hero/${req.file.filename}`
  const d = getSiteData()
  const hero = d.hero || {}
  const extraDefaultSlides = [...(hero.extraDefaultSlides || []), url]
  patchSiteData({ hero: { ...hero, extraDefaultSlides } })
  res.json({ ok: true, url })
})

app.delete('/api/admin/upload/hero/extra-default', requireAuth, (req, res) => {
  const { url } = req.body
  const d = getSiteData()
  const hero = d.hero || {}
  const extraDefaultSlides = (hero.extraDefaultSlides || []).filter(u => u !== url)
  patchSiteData({ hero: { ...hero, extraDefaultSlides } })
  tryDeleteUpload(url)
  res.json({ ok: true })
})

// ─── Admin — Products ─────────────────────────────────────────────────────────
app.put('/api/admin/products/:slug', requireAuth, (req, res) => {
  const d = getSiteData()
  const overrides = d.productOverrides || {}
  overrides[req.params.slug] = { ...(overrides[req.params.slug] || {}), ...req.body }
  patchSiteData({ productOverrides: overrides })
  logActivity('product_updated', req.params.slug)
  res.json({ ok: true })
})

app.delete('/api/admin/products/:slug', requireAuth, (req, res) => {
  const d = getSiteData()
  const overrides = d.productOverrides || {}
  delete overrides[req.params.slug]
  writeJson(DATA_FILE, { ...d, productOverrides: overrides })
  logActivity('product_override_deleted', req.params.slug)
  res.json({ ok: true })
})

// ─── Admin — Product Image Uploads ────────────────────────────────────────────
app.post('/api/admin/upload/product/:slug', requireAuth, uploadMiddleware(productUploader), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file' })
  const url = `/uploads/products/${req.file.filename}`
  const d = getSiteData()
  const productImages = d.productImages || {}
  productImages[req.params.slug] = [...(productImages[req.params.slug] || []), url]
  patchSiteData({ productImages })
  logActivity('product_image_uploaded', req.params.slug)
  res.json({ ok: true, url })
})

app.delete('/api/admin/upload/product/:slug', requireAuth, (req, res) => {
  const { url } = req.body
  const d = getSiteData()
  const productImages = d.productImages || {}
  productImages[req.params.slug] = (productImages[req.params.slug] || []).filter(u => u !== url)
  patchSiteData({ productImages })
  tryDeleteUpload(url)
  res.json({ ok: true })
})

// ─── Admin — Variant Image Uploads ────────────────────────────────────────────
app.post('/api/admin/upload/product-variant/:slug', requireAuth, uploadMiddleware(variantUploader), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file' })
  const url = `/uploads/variants/${req.file.filename}`
  const variant = req.body.variant || 'default'
  const d = getSiteData()
  const variantImages = d.variantImages || {}
  const key = `${req.params.slug}::${variant}`
  variantImages[key] = [...(variantImages[key] || []), url]
  patchSiteData({ variantImages })
  res.json({ ok: true, url })
})

app.delete('/api/admin/upload/product-variant/:slug', requireAuth, (req, res) => {
  const { url, variant = 'default' } = req.body
  const d = getSiteData()
  const variantImages = d.variantImages || {}
  const key = `${req.params.slug}::${variant}`
  variantImages[key] = (variantImages[key] || []).filter(u => u !== url)
  patchSiteData({ variantImages })
  tryDeleteUpload(url)
  res.json({ ok: true })
})

// ─── Admin — Sticker Images & Prices ─────────────────────────────────────────
app.post('/api/admin/upload/sticker-image', requireAuth, uploadMiddleware(stickerUploader), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file' })
  const url = `/uploads/stickers/${req.file.filename}`
  const size = req.body.size || 'unknown'
  const d = getSiteData()
  const stickerImages = d.stickerImages || {}
  stickerImages[size] = [...(stickerImages[size] || []), url]
  patchSiteData({ stickerImages })
  res.json({ ok: true, url })
})

app.delete('/api/admin/sticker-image', requireAuth, (req, res) => {
  const { size, url } = req.body
  const d = getSiteData()
  const stickerImages = d.stickerImages || {}
  stickerImages[size] = (stickerImages[size] || []).filter(u => u !== url)
  patchSiteData({ stickerImages })
  tryDeleteUpload(url)
  res.json({ ok: true })
})

app.put('/api/admin/sticker-prices', requireAuth, (req, res) => {
  patchSiteData({ stickerPriceOverrides: req.body })
  logActivity('sticker_prices_updated')
  res.json({ ok: true })
})

// ─── Admin — Content (TrustBar, Reviews, Footer, FAQ, BestSelling) ────────────
app.get('/api/admin/reviews', requireAuth, (_, res) => {
  const pending = getRuntimeData('pending-reviews', [])
  res.json(pending)
})

app.patch('/api/admin/reviews/:id/approve', requireAuth, (req, res) => {
  const pending = getRuntimeData('pending-reviews', [])
  const idx = pending.findIndex(r => r.id === req.params.id)
  if (idx < 0) return res.status(404).json({ error: 'Not found' })
  pending[idx].approved = true
  pending[idx].visible = true
  // Also add to site-data reviews
  const d = getSiteData()
  const content = d.content || {}
  const reviews = content.reviews || {}
  const testimonials = [...(reviews.testimonials || []), { ...pending[idx] }]
  patchSiteData({ content: { ...content, reviews: { ...reviews, testimonials } } })
  setRuntimeData('pending-reviews', pending)
  logActivity('review_approved', req.params.id)
  res.json({ ok: true })
})

app.delete('/api/admin/reviews/:id', requireAuth, (req, res) => {
  const pending = getRuntimeData('pending-reviews', [])
  setRuntimeData('pending-reviews', pending.filter(r => r.id !== req.params.id))
  res.json({ ok: true })
})

app.put('/api/admin/content', requireAuth, (req, res) => {
  const d = getSiteData()
  const content = deepMerge(d.content || {}, req.body)
  patchSiteData({ content })
  logActivity('content_updated')
  res.json({ ok: true })
})

app.put('/api/admin/faq', requireAuth, (req, res) => {
  const d = getSiteData()
  const content = { ...(d.content || {}), faq: req.body.faq }
  patchSiteData({ content })
  logActivity('faq_updated')
  res.json({ ok: true })
})

// Promo banner
app.put('/api/admin/promo-banner', requireAuth, (req, res) => {
  patchSiteData({ promoBanner: req.body })
  logActivity('promo_banner_updated')
  res.json({ ok: true })
})

// ─── Admin — About ─────────────────────────────────────────────────────────────
app.put('/api/admin/about', requireAuth, (req, res) => {
  patchSiteData({ about: req.body })
  logActivity('about_updated')
  res.json({ ok: true })
})

// ─── Admin — Blog ──────────────────────────────────────────────────────────────
app.get('/api/admin/blog', requireAuth, (_, res) => {
  const d = getSiteData()
  res.json(d.blogPosts || [])
})

app.post('/api/admin/blog', requireAuth, (req, res) => {
  const d = getSiteData()
  const posts = d.blogPosts || []
  const post = {
    id: `POST-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
  }
  posts.unshift(post)
  patchSiteData({ blogPosts: posts })
  logActivity('blog_post_created', post.title)
  res.json({ ok: true, post })
})

app.put('/api/admin/blog/:id', requireAuth, (req, res) => {
  const d = getSiteData()
  const posts = d.blogPosts || []
  const idx = posts.findIndex(p => p.id === req.params.id)
  if (idx < 0) return res.status(404).json({ error: 'Not found' })
  posts[idx] = { ...posts[idx], ...req.body, updatedAt: new Date().toISOString() }
  patchSiteData({ blogPosts: posts })
  logActivity('blog_post_updated', posts[idx].title)
  res.json({ ok: true })
})

app.delete('/api/admin/blog/:id', requireAuth, (req, res) => {
  const d = getSiteData()
  const posts = (d.blogPosts || []).filter(p => p.id !== req.params.id)
  patchSiteData({ blogPosts: posts })
  logActivity('blog_post_deleted', req.params.id)
  res.json({ ok: true })
})

app.put('/api/admin/blog/reorder', requireAuth, (req, res) => {
  patchSiteData({ blogPosts: req.body.posts })
  res.json({ ok: true })
})

app.post('/api/admin/upload/blog', requireAuth, uploadMiddleware(blogUploader), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file' })
  res.json({ ok: true, url: `/uploads/blog/${req.file.filename}` })
})

// ─── Admin — Brand Logo Upload ─────────────────────────────────────────────────
app.post('/api/admin/upload/brand-logo', requireAuth, uploadMiddleware(brandUploader), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file' })
  const url = `/uploads/brand/${req.file.filename}`
  patchSiteData({ brandLogo: url })
  logActivity('brand_logo_uploaded', url)
  res.json({ ok: true, url })
})

// ─── Admin — Leads ─────────────────────────────────────────────────────────────
app.get('/api/admin/leads', requireAuth, (_, res) => {
  res.json(getRuntimeData('leads', []))
})

app.delete('/api/admin/leads/:id', requireAuth, (req, res) => {
  const leads = getRuntimeData('leads', []).filter(l => l.id !== req.params.id)
  setRuntimeData('leads', leads)
  res.json({ ok: true })
})

app.patch('/api/admin/leads/:id/follow-up', requireAuth, (req, res) => {
  const leads = getRuntimeData('leads', [])
  const idx = leads.findIndex(l => l.id === req.params.id)
  if (idx < 0) return res.status(404).json({ error: 'Not found' })
  leads[idx].followedUp = !leads[idx].followedUp
  leads[idx].followedUpAt = leads[idx].followedUp ? Date.now() : null
  setRuntimeData('leads', leads)
  logActivity('lead_follow_up', req.params.id)
  res.json({ ok: true, followedUp: leads[idx].followedUp })
})

// ─── Admin — Newsletter ────────────────────────────────────────────────────────
app.get('/api/admin/newsletter', requireAuth, (_, res) => {
  res.json(getRuntimeData('newsletter', []))
})

app.delete('/api/admin/newsletter/:id', requireAuth, (req, res) => {
  const subs = getRuntimeData('newsletter', []).filter(s => s.id !== req.params.id)
  setRuntimeData('newsletter', subs)
  res.json({ ok: true })
})

// ─── Admin — Comments ──────────────────────────────────────────────────────────
app.get('/api/admin/comments', requireAuth, (_, res) => {
  res.json(getRuntimeData('comments', []))
})

app.patch('/api/admin/comments/:id/approve', requireAuth, (req, res) => {
  const comments = getRuntimeData('comments', [])
  const idx = comments.findIndex(c => c.id === req.params.id)
  if (idx >= 0) { comments[idx].approved = true; setRuntimeData('comments', comments) }
  res.json({ ok: true })
})

app.delete('/api/admin/comments/:id', requireAuth, (req, res) => {
  setRuntimeData('comments', getRuntimeData('comments', []).filter(c => c.id !== req.params.id))
  res.json({ ok: true })
})

// ─── Admin — Referrals ────────────────────────────────────────────────────────
app.get('/api/admin/referrals', requireAuth, (_, res) => {
  res.json(getRuntimeData('referrals', []))
})

app.delete('/api/admin/referrals/:id', requireAuth, (req, res) => {
  setRuntimeData('referrals', getRuntimeData('referrals', []).filter(r => r.id !== req.params.id))
  res.json({ ok: true })
})

// ─── Admin — Analytics ────────────────────────────────────────────────────────
app.get('/api/admin/analytics', requireAuth, (_, res) => {
  const analytics = getRuntimeData('analytics', [])
  const pageViews = {}
  const productViews = {}
  const cartAdds = {}
  const quoteRequests = []
  const locationMap = {}
  const deviceMap = {}
  const referrerMap = {}
  const hourMap = {}
  const dailyMap = {}
  const visitorKeys = new Set()
  const securityEvents = []
  const recentEvents = []

  for (const e of analytics) {
    const type = e.type === 'pageview' ? 'page_view' : e.type
    const path = e.path || e.page || '/'
    const day = e.ts ? new Date(e.ts).toISOString().slice(0, 10) : null
    const hour = e.ts ? new Date(e.ts).getHours() : null
    const device = e.device || 'unknown'
    const loc = e.location || (e.city && e.country ? `${e.city}, ${e.country}` : e.country) || null

    if (e.ip) visitorKeys.add(String(e.ip))
    if (device) deviceMap[device] = (deviceMap[device] || 0) + 1
    if (hour != null) hourMap[hour] = (hourMap[hour] || 0) + 1
    if (day) dailyMap[day] = (dailyMap[day] || 0) + 1
    if (loc) locationMap[loc] = (locationMap[loc] || 0) + 1
    if (e.referrer) {
      try {
        const host = new URL(e.referrer).hostname || e.referrer
        referrerMap[host] = (referrerMap[host] || 0) + 1
      } catch {
        referrerMap[e.referrer] = (referrerMap[e.referrer] || 0) + 1
      }
    }

    if (type === 'page_view') {
      pageViews[path] = (pageViews[path] || 0) + 1
    } else if (type === 'product_view') {
      const slug = e.slug || 'unknown'
      if (!productViews[slug]) productViews[slug] = { name: e.name || slug, count: 0 }
      productViews[slug].count += 1
      if (e.name) productViews[slug].name = e.name
    } else if (type === 'cart_add') {
      const slug = e.slug || 'unknown'
      if (!cartAdds[slug]) cartAdds[slug] = { name: e.name || slug, count: 0, qty: 0 }
      cartAdds[slug].count += 1
      cartAdds[slug].qty += Number(e.qty) || 1
      if (e.name) cartAdds[slug].name = e.name
    } else if (type === 'quote_request') {
      quoteRequests.push({
        slug: e.slug,
        details: e.details,
        timestamp: e.ts ? new Date(e.ts).toISOString() : null,
        device: e.device,
        location: loc ? { country: loc } : null,
      })
    } else if (type === 'security_event') {
      securityEvents.push(e)
    }

    if (recentEvents.length < 30) {
      recentEvents.push({
        type: type || e.type,
        slug: e.slug,
        name: e.name,
        page: path,
        device: e.device,
        location: loc ? { city: '', country: loc } : null,
        timestamp: e.ts ? new Date(e.ts).toISOString() : null,
      })
    }
  }

  res.json({
    totalEvents: analytics.length,
    totalPageViews: Object.values(pageViews).reduce((a, b) => a + b, 0),
    uniqueVisitors: visitorKeys.size,
    pageViews,
    productViews,
    cartAdds,
    quoteRequests,
    locationMap,
    deviceMap,
    referrerMap,
    hourMap,
    dailyMap,
    recentEvents,
    securityEvents,
    // backward compatible
    events: analytics.slice(0, 200),
    security: securityEvents,
  })
})

app.delete('/api/admin/analytics/clear', requireAuth, (_, res) => {
  setRuntimeData('analytics', [])
  logActivity('analytics_cleared')
  res.json({ ok: true })
})

// ─── Admin — Growth ────────────────────────────────────────────────────────────
app.get('/api/admin/growth', requireAuth, (_, res) => {
  const analytics = getRuntimeData('analytics', [])
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  // Daily page views (last 30 days)
  const daily = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(now - i * day)
    daily[d.toISOString().slice(0, 10)] = 0
  }
  analytics.filter(e => e.type === 'page_view' && e.ts > now - 30 * day).forEach(e => {
    const key = new Date(e.ts).toISOString().slice(0, 10)
    if (key in daily) daily[key]++
  })

  // Top pages
  const pageCounts = {}
  analytics.filter(e => e.type === 'page_view').forEach(e => {
    if (e.page) pageCounts[e.page] = (pageCounts[e.page] || 0) + 1
  })
  const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([page, count]) => ({ page, count }))

  // Top products
  const productCounts = {}
  analytics.filter(e => e.type === 'product_view').forEach(e => {
    if (e.slug) productCounts[e.slug] = (productCounts[e.slug] || 0) + 1
  })
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([slug, count]) => ({ slug, count }))

  // Device breakdown
  const devices = {}
  analytics.forEach(e => {
    if (e.device) devices[e.device] = (devices[e.device] || 0) + 1
  })

  res.json({ daily: Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0])).map(([date, views]) => ({ date, views })), topPages, topProducts, devices })
})

// ─── Admin — Orders ────────────────────────────────────────────────────────────
app.get('/api/admin/orders', requireAuth, (_, res) => {
  res.json(getRuntimeData('orders', []))
})

// ─── Admin — Activity Log ─────────────────────────────────────────────────────
app.get('/api/admin/activity-log', requireAuth, (_, res) => {
  res.json(getRuntimeData('activity-log', []))
})

// ─── Admin — T&C Acceptances ─────────────────────────────────────────────────
app.get('/api/admin/acceptances', requireAuth, (_, res) => {
  res.json(getRuntimeData('acceptances', []))
})

// Log T&C acceptance (public)
app.post('/api/terms/accept', (req, res) => {
  const acceptances = getRuntimeData('acceptances', [])
  acceptances.unshift({ ts: Date.now(), ip: req.ip, ua: req.headers['user-agent'] })
  if (acceptances.length > 5000) acceptances.splice(5000)
  setRuntimeData('acceptances', acceptances)
  res.json({ ok: true })
})

// ─── Admin — SEO Audit ────────────────────────────────────────────────────────
app.get('/api/admin/seo-audit', requireAuth, (_, res) => {
  const d = getSiteData()
  const seo = d.seo || {}
  const issues = []
  const posts = d.blogPosts || []
  posts.forEach(p => {
    if (!p.metaTitle) issues.push({ type: 'missing_meta_title', slug: p.slug })
    if (!p.metaDesc) issues.push({ type: 'missing_meta_desc', slug: p.slug })
  })
  res.json({ seo, issues, postCount: posts.length })
})

// ─── Admin — Backup ────────────────────────────────────────────────────────────
app.get('/api/admin/backup', requireAuth, (_, res) => {
  const siteData = getSiteData()
  const backup = {
    exportedAt: new Date().toISOString(),
    siteData,
    leads: getRuntimeData('leads', []),
    newsletter: getRuntimeData('newsletter', []),
    reviews: getRuntimeData('pending-reviews', []),
    comments: getRuntimeData('comments', []),
    referrals: getRuntimeData('referrals', []),
    analytics: getRuntimeData('analytics', []),
    activityLog: getRuntimeData('activity-log', []),
  }
  logActivity('backup_downloaded')
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="sleekblue-backup-${Date.now()}.json"`)
  res.json(backup)
})

// ─── Util ──────────────────────────────────────────────────────────────────────
function tryDeleteUpload(url) {
  try {
    if (url && url.startsWith('/uploads/')) {
      // Strip the leading "/uploads" prefix and resolve under UPLOADS_DIR so
      // that the correct file is deleted even when UPLOADS_DIR != __dirname/uploads.
      const rel = url.slice('/uploads'.length) // e.g. "/hero/file.png"
      fs.unlinkSync(path.join(UPLOADS_DIR, rel))
    }
  } catch { /* ignore */ }
}

// ─── Health helper (shared by route + startup log) ───────────────────────────
function getHealthInfo() {
  const indexExists = fs.existsSync(path.join(DIST_DIR, 'index.html'))
  const candidates = DIST_CANDIDATES.map(d => ({
    path: d,
    indexExists: fs.existsSync(path.join(d, 'index.html')),
  }))
  let filesInDist = []
  try {
    if (fs.existsSync(DIST_DIR)) {
      filesInDist = fs.readdirSync(DIST_DIR).slice(0, 20)
    }
  } catch { /* ignore */ }

  const mem = process.memoryUsage()
  return {
    ok: true,
    status: 'alive',
    uptimeSeconds: Math.floor(process.uptime()),
    node: process.version,
    env: process.env.NODE_ENV || 'development',
    memory: {
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    },
    paystackConfigured: Boolean(PAYSTACK_SECRET_KEY),
    cwd: process.cwd(),
    dirname: __dirname,
    distDir: DIST_DIR,
    uploadsDir: UPLOADS_DIR,
    dataDir: DATA_ROOT,
    indexExists,
    candidates,
    filesInDist,
    timestamp: new Date().toISOString(),
  }
}

// GET /api/health — public diagnostic endpoint (no auth required)
// Used by Hostinger / uptime monitors / operators. Keep it fast and allocation-light.
app.get('/api/health', (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const info = getHealthInfo()
  info.inFlight = inFlight
  info.maxInFlight = MAX_IN_FLIGHT
  res.json(info)
})

// Ultra-light liveness for uptime pings under ad traffic
app.get('/api/ready', (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  if (inFlight >= MAX_IN_FLIGHT) {
    return res.status(503).json({ ok: false, ready: false, inFlight })
  }
  res.json({ ok: true, ready: true, inFlight, uptimeSeconds: Math.floor(process.uptime()) })
})

// ─── Serve Frontend ────────────────────────────────────────────────────────────
const distExists = fs.existsSync(DIST_DIR)
if (distExists) {
  // Hashed assets (JS/CSS bundles with content-hash in filename) get long cache.
  // Everything else (index.html, sw.js, manifest.json) must NEVER be cached so
  // the browser always fetches the freshest shell and service worker.
  app.use(express.static(DIST_DIR, {
    maxAge: 0,
    etag: true,
    setHeaders(res, filePath) {
      const isHashedAsset = /\/assets\/[^/]+-[a-zA-Z0-9]{8,}\.(js|css|woff2?|ttf|svg|png|jpg|jpeg|webp|ico)$/.test(filePath)
      if (isHashedAsset) {
        // Hashed filenames = content-addressed = safe to cache for a year
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      } else {
        // index.html, sw.js, manifest.json — MUST revalidate every request
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')
      }
    },
  }))
  // SPA fallback — only serve index.html for GET/HEAD requests that are not API calls.
  // Uses sendFile with { root } (the safe form that avoids the send-module NotFoundError),
  // with a readFileSync fallback in case sendFile still errors on this host.
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()

    const indexHtml = path.join(DIST_DIR, 'index.html')
    if (!fs.existsSync(indexHtml)) {
      return res.status(503).json({
        error: 'Frontend not available',
        detail: `index.html not found at ${indexHtml}`,
        distDir: DIST_DIR,
      })
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')

    // Primary: sendFile with { root } avoids the absolute-path NotFoundError bug
    res.sendFile('index.html', { root: DIST_DIR }, (err) => {
      if (!err) return // sent successfully
      // Fallback: read and stream the file directly
      try {
        const html = fs.readFileSync(indexHtml, 'utf8')
        res.status(200).type('html').send(html)
      } catch (readErr) {
        res.status(500).json({
          error: 'Failed to serve frontend',
          detail: readErr.message,
          distDir: DIST_DIR,
        })
      }
    })
  })
} else {
  app.get('/', (_, res) => res.json({
    status: 'API running',
    note: 'Frontend not built yet. Run: npm run build',
    docs: 'API available at /api/*',
  }))
}

// ─── Process Resilience (Hostinger Business / single-process hardening) ───────
// Keep the process from dying silently and give PM2 a clean signal so it can
// restart us cleanly. Zero extra cost. Critical on shared hosting.

process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', err && err.stack ? err.stack : err)
  // Exit so PM2 brings up a clean process. Do not continue after unknown state.
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] unhandledRejection:', reason)
  process.exit(1)
})

let isShuttingDown = false
function gracefulShutdown(signal) {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log(`[Sleekblue API] Received ${signal} — shutting down gracefully...`)
  server.close(() => {
    console.log('[Sleekblue API] HTTP server closed')
    process.exit(0)
  })
  // Force exit if close hangs (Hostinger can be aggressive with signals)
  setTimeout(() => {
    console.error('[Sleekblue API] Forced exit after graceful timeout')
    process.exit(1)
  }, 7000).unref()
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// ─── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Sleekblue API] Running on http://0.0.0.0:${PORT}`)
  console.log(`[Sleekblue API] NODE_ENV=${process.env.NODE_ENV || 'development'}`)
  console.log(`[Sleekblue API] Admin username: ${ADMIN_USERNAME}`)
  const health = getHealthInfo()
  console.log(`[Sleekblue API] DIST_DIR : ${health.distDir}`)
  console.log(`[Sleekblue API] index.html: ${health.indexExists ? 'FOUND ✓' : 'NOT FOUND ✗'}`)
  console.log(`[Sleekblue API] cwd       : ${health.cwd}`)
  console.log(`[Sleekblue API] __dirname : ${health.dirname}`)
  console.log('[Sleekblue API] Candidates:')
  health.candidates.forEach(c => console.log(`  ${c.indexExists ? '✓' : '✗'}  ${c.path}`))
  if (health.filesInDist.length) console.log(`[Sleekblue API] Files in dist: ${health.filesInDist.join(', ')}`)
  if (!health.indexExists) console.warn('[Sleekblue API] ⚠ Frontend not built or dist path is wrong — SPA routes will return 503')
  if (!process.env.JWT_SECRET) console.warn('[Sleekblue API] ⚠ JWT_SECRET not set in environment!')
  if (!process.env.ADMIN_PASSWORD) console.warn('[Sleekblue API] ⚠ ADMIN_PASSWORD not set in environment!')
  if (!PAYSTACK_SECRET_KEY) console.warn('[Sleekblue API] ⚠ PAYSTACK_SECRET_KEY not set — webhooks will be rejected')
})

// Bound timeouts to protect the single process under slow clients / load
server.keepAliveTimeout = 65_000
server.headersTimeout = 70_000
server.requestTimeout = 30_000
server.timeout = 60_000
