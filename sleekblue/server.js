import express from 'express'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const LOG_FILE        = join(__dirname, 'acceptance-log.json')
const SITE_DATA_FILE  = join(__dirname, 'site-data.json')
const ADMIN_CFG_FILE  = join(__dirname, 'admin-config.json')
const ANALYTICS_FILE  = join(__dirname, 'analytics-data.json')
const LEADS_FILE      = join(__dirname, 'leads.json')
const UPLOADS_DIR     = join(__dirname, 'uploads')

;['hero', 'products', 'site', 'blog'].forEach(sub =>
  mkdirSync(join(UPLOADS_DIR, sub), { recursive: true })
)

function makeStorage(folder) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, join(UPLOADS_DIR, folder)),
    filename: (req, file, cb) => {
      const ts  = Date.now()
      const ext = extname(file.originalname).toLowerCase() || '.jpg'
      cb(null, `${ts}${ext}`)
    },
  })
}
const heroUpload    = multer({ storage: makeStorage('hero'),    limits: { fileSize: 10 * 1024 * 1024 } })
const blogUpload    = multer({ storage: makeStorage('blog'),    limits: { fileSize: 50 * 1024 * 1024 } })
const productUpload = multer({ storage: makeStorage('products'), limits: { fileSize: 10 * 1024 * 1024 } })
const siteUpload    = multer({ storage: makeStorage('site'),    limits: { fileSize: 10 * 1024 * 1024 } })

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) { console.error('[FATAL] JWT_SECRET env var is not set. Set it before starting the server.'); process.exit(1) }
const PORT       = process.env.PORT || 3001

function readJSON(file, fallback = {}) {
  if (!existsSync(file)) return fallback
  try { return JSON.parse(readFileSync(file, 'utf-8')) } catch { return fallback }
}
function writeJSON(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2))
}
function generateId(prefix = 'SBM') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`
}
function getClientIP(req) {
  const raw = ((req.headers['x-forwarded-for'] || '') + '').split(',')[0].trim()
    || (req.socket?.remoteAddress || '')
  return raw.replace(/^::ffff:/, '')
}

// ── Analytics helpers ─────────────────────────────────────────────────────────
function readAnalytics() { return readJSON(ANALYTICS_FILE, { events: [], securityEvents: [] }) }
function writeAnalytics(data) { try { writeJSON(ANALYTICS_FILE, data) } catch { /* empty */ } }

function logSecurityEvent(type, req) {
  try {
    const data = readAnalytics()
    data.securityEvents = data.securityEvents || []
    data.securityEvents.unshift({
      id: generateId('SEC'),
      type,
      ip: getClientIP(req),
      path: req.path || '',
      method: req.method || '',
      userAgent: (req.headers['user-agent'] || '').slice(0, 120),
      timestamp: new Date().toISOString(),
    })
    data.securityEvents = data.securityEvents.slice(0, 500)
    writeAnalytics(data)
  } catch { /* empty */ }
}

// IP Geolocation — ip-api.com free tier (no key required)
const geoCache = {}
async function geolocateIP(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:') ||
      ip.startsWith('192.168') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { country: 'Local', city: 'Dev Server', region: '', lat: 0, lon: 0 }
  }
  if (geoCache[ip]) return geoCache[ip]
  try {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 4000)
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,regionName,lat,lon,status`, { signal: ctrl.signal })
    clearTimeout(timeout)
    const d = await res.json()
    if (d.status === 'success') {
      const loc = { country: d.country || 'Unknown', city: d.city || '', region: d.regionName || '', lat: d.lat || 0, lon: d.lon || 0 }
      geoCache[ip] = loc
      return loc
    }
  } catch { /* empty */ }
  return { country: 'Unknown', city: '', region: '', lat: 0, lon: 0 }
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!existsSync(ADMIN_CFG_FILE)) {
  const initialPassword = ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? null : `dev-${generateId('ADMIN')}`)
  if (!initialPassword && process.env.NODE_ENV === 'production') {
    console.error('[FATAL] ADMIN_PASSWORD env var is not set. Set it before starting the server.')
    process.exit(1)
  }
  writeJSON(ADMIN_CFG_FILE, {
    username: ADMIN_USERNAME,
    passwordHash: bcrypt.hashSync(initialPassword, 10),
  })
  if (initialPassword) {
    console.log(`[Admin] Default credentials: ${ADMIN_USERNAME} / ${initialPassword}`)
  } else {
    console.log('[Admin] Admin credentials were not initialized because ADMIN_PASSWORD is not set.')
  }
}

const app = express()

// ── Trust proxy for accurate IPs behind Replit reverse proxy ─────────────────
app.set('trust proxy', 1)

// ── Security headers via Helmet ───────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(express.json({ limit: '5mb' }))

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// ── Input sanitization — strip XSS payloads from string values ───────────────
app.use((req, res, next) => {
  function sanitize(val) {
    if (typeof val === 'string') {
      return val
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/javascript\s*:/gi, '')
        .replace(/data\s*:\s*text\/html/gi, '')
        .replace(/on\w+\s*=/gi, '')
    }
    if (Array.isArray(val)) return val.map(sanitize)
    if (val && typeof val === 'object') {
      const clean = {}
      for (const k of Object.keys(val)) clean[k] = sanitize(val[k])
      return clean
    }
    return val
  }
  if (req.body && typeof req.body === 'object') req.body = sanitize(req.body)
  next()
})

// ── Rate limiting ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  handler(req, res, next, options) {
    logSecurityEvent('rate_limit', req)
    res.status(options.statusCode).json(options.message)
  },
  skip: req => req.path.startsWith('/uploads') || req.ip === '127.0.0.1' || req.ip === '::1' || (req.ip || '').startsWith('::ffff:127.'),
})
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  handler(req, res, next, options) {
    logSecurityEvent('login_brute_force', req)
    res.status(options.statusCode).json(options.message)
  },
})
app.use('/api/', generalLimiter)
app.use('/api/admin/login', loginLimiter)

// ── Serve uploaded files ──────────────────────────────────────────────────────
app.use('/uploads', express.static(UPLOADS_DIR))

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '')
  if (!token) {
    logSecurityEvent('missing_token', req)
    return res.status(401).json({ error: 'No token' })
  }
  try {
    req.admin = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    logSecurityEvent('invalid_token', req)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CART API (in-memory, for load testing & future server-side validation)
// ─────────────────────────────────────────────────────────────────────────────
const cartStore = new Map()

// Auto-expire carts after 30 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [token, cart] of cartStore) {
    if (now - cart.updatedAt > 30 * 60 * 1000) cartStore.delete(token)
  }
}, 5 * 60 * 1000)

function getCartToken(req) {
  return req.headers['x-cart-token'] || 'anonymous'
}

// GET /api/cart — retrieve current cart
app.get('/api/cart', (req, res) => {
  const token = getCartToken(req)
  const cart = cartStore.get(token) || { items: [], updatedAt: Date.now() }
  res.json({ items: cart.items, totalItems: cart.items.reduce((s, i) => s + i.quantity, 0) })
})

// POST /api/cart — add item to cart
app.post('/api/cart', (req, res) => {
  const token = getCartToken(req)
  const { productId, quantity, size } = req.body || {}

  if (!productId || !quantity) {
    return res.status(400).json({ error: 'productId and quantity are required' })
  }

  const cart = cartStore.get(token) || { items: [], updatedAt: Date.now() }

  const existing = cart.items.find(i => i.productId === productId && i.size === size)
  if (existing) {
    existing.quantity += Number(quantity)
  } else {
    cart.items.push({
      id: generateId('CART'),
      productId: String(productId),
      quantity: Number(quantity),
      size: size || '',
      addedAt: new Date().toISOString(),
    })
  }

  cart.updatedAt = Date.now()
  cartStore.set(token, cart)
  res.json({ items: cart.items, totalItems: cart.items.reduce((s, i) => s + i.quantity, 0) })
})

// DELETE /api/cart/:itemId — remove item from cart
app.delete('/api/cart/:itemId', (req, res) => {
  const token = getCartToken(req)
  const cart = cartStore.get(token)
  if (!cart) return res.status(404).json({ error: 'Cart not found' })

  cart.items = cart.items.filter(i => i.id !== req.params.itemId)
  cart.updatedAt = Date.now()
  cartStore.set(token, cart)
  res.json({ items: cart.items, totalItems: cart.items.reduce((s, i) => s + i.quantity, 0) })
})

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/accept-terms', (req, res) => {
  const records = readJSON(LOG_FILE, [])
  const record = {
    acceptanceId: generateId(),
    timestamp:    new Date().toISOString(),
    termsVersion: req.body.termsVersion || 'June 2026',
    customerName: req.body.customerName || '',
    email:        req.body.email        || '',
    phone:        req.body.phone        || '',
    ipAddress:    getClientIP(req),
    userAgent:    (req.headers['user-agent'] || '').slice(0, 200),
  }
  records.push(record)
  writeJSON(LOG_FILE, records)
  console.log('[Terms] Accepted:', record.acceptanceId, '|', record.customerName)
  res.json({ ok: true, acceptanceId: record.acceptanceId })
})

app.get('/api/settings', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.settings || {})
})

app.get('/api/products', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json({
    productOverrides: data.productOverrides || {},
    stickerPriceOverrides: data.stickerPriceOverrides || {},
  })
})

app.get('/api/products/:slug', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  const override = (data.productOverrides || {})[req.params.slug]
  res.json(override || null)
})

// ── Analytics tracking (public) ───────────────────────────────────────────────
app.post('/api/subscribe-whatsapp', (req, res) => {
  const { name, phone } = req.body || {}
  if (!phone || String(phone).replace(/\D/g, '').length < 10) {
    return res.status(400).json({ error: 'Invalid phone number' })
  }
  const leads = readJSON(LEADS_FILE, [])
  const existing = leads.find(l => l.phone.replace(/\D/g, '') === String(phone).replace(/\D/g, ''))
  if (existing) return res.json({ ok: true, duplicate: true })
  leads.push({ id: generateId('LEAD'), name: (name || '').trim(), phone: String(phone).trim(), timestamp: new Date().toISOString(), source: 'popup' })
  writeJSON(LEADS_FILE, leads)
  console.log('[Leads] New WhatsApp subscriber:', phone)
  res.json({ ok: true })
})

app.get('/api/admin/leads', requireAuth, (req, res) => {
  const leads = readJSON(LEADS_FILE, [])
  res.json([...leads].reverse())
})

app.delete('/api/admin/leads/:id', requireAuth, (req, res) => {
  const leads = readJSON(LEADS_FILE, [])
  const updated = leads.filter(l => l.id !== req.params.id)
  writeJSON(LEADS_FILE, updated)
  res.json({ ok: true })
})

app.post('/api/analytics/track', (req, res) => {
  try {
    const { type, page, slug, name, qty, price, device, referrer, userAgent, timestamp, event: evName, target } = req.body
    if (!type) return res.json({ ok: true })
    const ip = getClientIP(req)
    const eventData = {
      id: generateId('EVT'),
      type,
      page: page || '',
      slug: slug || '',
      name: name || '',
      qty: qty || null,
      price: price || null,
      event: evName || '',
      target: target || '',
      device: device || 'unknown',
      referrer: (referrer || '').slice(0, 200),
      userAgent: (userAgent || '').slice(0, 200),
      timestamp: timestamp || new Date().toISOString(),
      ip,
      location: null,
    }
    const data = readAnalytics()
    data.events = data.events || []
    data.events.unshift(eventData)
    data.events = data.events.slice(0, 10000)
    writeAnalytics(data)
    // Geo-resolve asynchronously
    geolocateIP(ip).then(location => {
      try {
        const d = readAnalytics()
        const idx = (d.events || []).findIndex(e => e.id === eventData.id)
        if (idx !== -1) { d.events[idx].location = location; writeAnalytics(d) }
      } catch { /* empty */ }
    }).catch(() => {})
  } catch { /* empty */ }
  res.json({ ok: true })
})

app.get('/api/hero', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.hero || {})
})

app.get('/api/content', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(mergeContentDefaults(data.content || {}))
})

app.get('/api/page-layout', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.pageLayout || DEFAULT_PAGE_LAYOUT)
})

app.get('/api/product-images', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.productImages || {})
})

app.get('/api/sticker-images', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.stickerImages || {})
})

app.get('/api/product-variant-images', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.productVariantImages || {})
})

app.get('/api/site-images', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.siteImages || {})
})

app.get('/api/about', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json({ ...ABOUT_DEFAULTS, ...(data.about || {}) })
})

app.put('/api/admin/about', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  data.about = { ...(data.about || {}), ...req.body }
  writeJSON(SITE_DATA_FILE, data)
  logActivity('about_updated', 'About page content updated', 'admin')
  res.json({ ok: true })
})

app.get('/api/blog', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  const now = new Date()
  const posts = (data.blogPosts || []).filter(p => {
    if (p.status !== 'published') return false
    if (p.publishAt && new Date(p.publishAt) > now) return false
    return true
  })
  res.json(posts)
})

app.get('/api/blog/:slug', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  const post = (data.blogPosts || []).find(p => p.slug === req.params.slug && p.status === 'published')
  if (!post) return res.status(404).json({ error: 'Not found' })
  res.json(post)
})

app.get('/api/seo', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.seo || {})
})

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body
  const cfg = readJSON(ADMIN_CFG_FILE, {})
  if (username !== cfg.username) return res.status(401).json({ error: 'Invalid credentials' })
  if (!bcrypt.compareSync(password, cfg.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' })
  console.log('[Admin] Login:', username)
  res.json({ ok: true, token })
})

app.get('/api/admin/acceptances', requireAuth, (req, res) => {
  res.json(readJSON(LOG_FILE, []))
})

app.get('/api/admin/site-data', requireAuth, (req, res) => {
  res.json(readJSON(SITE_DATA_FILE, {}))
})

app.put('/api/admin/products/:slug', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, { settings: {}, productOverrides: {}, stickerPriceOverrides: {} })
  data.productOverrides = data.productOverrides || {}
  data.productOverrides[req.params.slug] = req.body
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Product saved:', req.params.slug)
  res.json({ ok: true })
})

app.delete('/api/admin/products/:slug', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, { settings: {}, productOverrides: {}, stickerPriceOverrides: {} })
  data.productOverrides = data.productOverrides || {}
  delete data.productOverrides[req.params.slug]
  writeJSON(SITE_DATA_FILE, data)
  res.json({ ok: true })
})

app.put('/api/admin/sticker-prices', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, { settings: {}, productOverrides: {}, stickerPriceOverrides: {} })
  data.stickerPriceOverrides = req.body
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Sticker prices updated')
  res.json({ ok: true })
})

app.put('/api/admin/settings', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, { settings: {}, productOverrides: {}, stickerPriceOverrides: {} })
  data.settings = { ...(data.settings || {}), ...req.body }
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Settings updated')
  res.json({ ok: true })
})

app.put('/api/admin/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body
  const cfg = readJSON(ADMIN_CFG_FILE, {})
  if (!bcrypt.compareSync(currentPassword, cfg.passwordHash))
    return res.status(400).json({ error: 'Current password is incorrect' })
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  cfg.passwordHash = bcrypt.hashSync(newPassword, 10)
  writeJSON(ADMIN_CFG_FILE, cfg)
  console.log('[Admin] Password changed')
  res.json({ ok: true })
})

app.put('/api/admin/hero', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, { settings: {}, productOverrides: {}, stickerPriceOverrides: {}, content: {} })
  data.hero = { ...(data.hero || {}), ...req.body }
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Hero content updated')
  res.json({ ok: true })
})

app.put('/api/admin/page-layout', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, { settings: {}, productOverrides: {}, stickerPriceOverrides: {}, content: {} })
  data.pageLayout = req.body
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Page layout updated')
  res.json({ ok: true })
})

app.put('/api/admin/content', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, { settings: {}, productOverrides: {}, stickerPriceOverrides: {}, content: {} })
  data.content = { ...(data.content || {}), ...req.body }
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Content updated:', Object.keys(req.body).join(', '))
  res.json({ ok: true })
})

app.put('/api/admin/faq', requireAuth, (req, res) => {
  const { faq } = req.body
  if (!Array.isArray(faq)) return res.status(400).json({ error: 'faq must be an array' })
  const data = readJSON(SITE_DATA_FILE, { content: {} })
  data.content = { ...(data.content || {}), faq }
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] FAQ updated:', faq.length, 'items')
  res.json({ ok: true })
})

// ── Hero image uploads ────────────────────────────────────────────────────────
app.post('/api/admin/upload/hero', requireAuth, heroUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const url = `/uploads/hero/${req.file.filename}`
  const data = readJSON(SITE_DATA_FILE, {})
  data.hero = data.hero || {}
  data.hero.customSlides = data.hero.customSlides || []
  data.hero.customSlides.push(url)
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Hero slide uploaded:', url)
  res.json({ ok: true, url })
})

app.delete('/api/admin/upload/hero', requireAuth, (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'No url provided' })
  const data = readJSON(SITE_DATA_FILE, {})
  data.hero = data.hero || {}
  data.hero.customSlides = (data.hero.customSlides || []).filter(u => u !== url)
  writeJSON(SITE_DATA_FILE, data)
  try { const filename = url.replace('/uploads/hero/', ''); unlinkSync(join(UPLOADS_DIR, 'hero', filename)) } catch { /* empty */ }
  res.json({ ok: true })
})

app.put('/api/admin/upload/hero/reorder', requireAuth, (req, res) => {
  const { slides } = req.body
  if (!Array.isArray(slides)) return res.status(400).json({ error: 'slides must be array' })
  const data = readJSON(SITE_DATA_FILE, {})
  data.hero = data.hero || {}
  data.hero.customSlides = slides
  writeJSON(SITE_DATA_FILE, data)
  res.json({ ok: true })
})

// ── Extra default slides (uploaded, appear alongside built-in 4) ──────────────
app.post('/api/admin/upload/hero/extra-default', requireAuth, heroUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const url = `/uploads/hero/${req.file.filename}`
  const data = readJSON(SITE_DATA_FILE, {})
  data.hero = data.hero || {}
  data.hero.extraDefaultSlides = data.hero.extraDefaultSlides || []
  data.hero.extraDefaultSlides.push(url)
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Extra default slide added:', url)
  res.json({ ok: true, url })
})

app.delete('/api/admin/upload/hero/extra-default', requireAuth, (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'No url provided' })
  const data = readJSON(SITE_DATA_FILE, {})
  data.hero = data.hero || {}
  data.hero.extraDefaultSlides = (data.hero.extraDefaultSlides || []).filter(u => u !== url)
  data.hero.hiddenExtraDefaultSlides = (data.hero.hiddenExtraDefaultSlides || []).filter(u => u !== url)
  writeJSON(SITE_DATA_FILE, data)
  try { const filename = url.replace('/uploads/hero/', ''); unlinkSync(join(UPLOADS_DIR, 'hero', filename)) } catch { /* empty */ }
  res.json({ ok: true })
})

app.put('/api/admin/hero/extra-default-visibility', requireAuth, (req, res) => {
  const { hiddenExtraDefaultSlides } = req.body
  if (!Array.isArray(hiddenExtraDefaultSlides)) return res.status(400).json({ error: 'array required' })
  const data = readJSON(SITE_DATA_FILE, {})
  data.hero = data.hero || {}
  data.hero.hiddenExtraDefaultSlides = hiddenExtraDefaultSlides
  writeJSON(SITE_DATA_FILE, data)
  res.json({ ok: true })
})

// ── Default slide visibility ───────────────────────────────────────────────────
app.put('/api/admin/hero/default-slides', requireAuth, (req, res) => {
  const { hiddenDefaultSlides } = req.body
  if (!Array.isArray(hiddenDefaultSlides)) return res.status(400).json({ error: 'hiddenDefaultSlides must be array' })
  const data = readJSON(SITE_DATA_FILE, {})
  data.hero = data.hero || {}
  data.hero.hiddenDefaultSlides = hiddenDefaultSlides
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Default slides visibility updated:', hiddenDefaultSlides)
  res.json({ ok: true })
})

// ── Product image uploads ─────────────────────────────────────────────────────
app.post('/api/admin/upload/product/:slug', requireAuth, productUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const { slug } = req.params
  const url = `/uploads/products/${req.file.filename}`
  const data = readJSON(SITE_DATA_FILE, {})
  data.productImages = data.productImages || {}
  data.productImages[slug] = data.productImages[slug] || []
  data.productImages[slug].push(url)
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Product image uploaded:', slug, url)
  res.json({ ok: true, url })
})

app.delete('/api/admin/upload/product/:slug', requireAuth, (req, res) => {
  const { slug } = req.params
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'No url provided' })
  const data = readJSON(SITE_DATA_FILE, {})
  data.productImages = data.productImages || {}
  data.productImages[slug] = (data.productImages[slug] || []).filter(u => u !== url)
  writeJSON(SITE_DATA_FILE, data)
  try { const filename = url.replace('/uploads/products/', ''); unlinkSync(join(UPLOADS_DIR, 'products', filename)) } catch { /* empty */ }
  res.json({ ok: true })
})

// ── Sticker images ────────────────────────────────────────────────────────────
app.post('/api/admin/upload/sticker-image', requireAuth, productUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const { size } = req.body
  if (!size) return res.status(400).json({ error: 'size is required' })
  const url = `/uploads/products/${req.file.filename}`
  const data = readJSON(SITE_DATA_FILE, {})
  data.stickerImages = data.stickerImages || {}
  data.stickerImages[size] = data.stickerImages[size] || []
  if (!data.stickerImages[size].includes(url)) data.stickerImages[size].push(url)
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Sticker image uploaded for size', size, ':', url)
  res.json({ ok: true, url, size })
})

app.delete('/api/admin/sticker-image', requireAuth, (req, res) => {
  const { size, url } = req.body
  if (!size || !url) return res.status(400).json({ error: 'size and url required' })
  const data = readJSON(SITE_DATA_FILE, {})
  data.stickerImages = data.stickerImages || {}
  data.stickerImages[size] = (data.stickerImages[size] || []).filter(u => u !== url)
  writeJSON(SITE_DATA_FILE, data)
  try { const filename = url.replace('/uploads/products/', ''); unlinkSync(join(UPLOADS_DIR, 'products', filename)) } catch { /* empty */ }
  res.json({ ok: true })
})

// ── Product variant images (per slug + per size/type) ─────────────────────────
app.post('/api/admin/upload/product-variant/:slug', requireAuth, productUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const { slug } = req.params
  const { variant } = req.body
  if (!variant) return res.status(400).json({ error: 'variant is required' })
  const url = `/uploads/products/${req.file.filename}`
  const data = readJSON(SITE_DATA_FILE, {})
  data.productVariantImages = data.productVariantImages || {}
  data.productVariantImages[slug] = data.productVariantImages[slug] || {}
  data.productVariantImages[slug][variant] = data.productVariantImages[slug][variant] || []
  data.productVariantImages[slug][variant].push(url)
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Variant image uploaded:', slug, variant, url)
  res.json({ ok: true, url })
})

app.delete('/api/admin/upload/product-variant/:slug', requireAuth, (req, res) => {
  const { slug } = req.params
  const { variant, url } = req.body
  if (!variant || !url) return res.status(400).json({ error: 'variant and url required' })
  const data = readJSON(SITE_DATA_FILE, {})
  data.productVariantImages = data.productVariantImages || {}
  data.productVariantImages[slug] = data.productVariantImages[slug] || {}
  data.productVariantImages[slug][variant] = (data.productVariantImages[slug][variant] || []).filter(u => u !== url)
  writeJSON(SITE_DATA_FILE, data)
  try { const filename = url.replace('/uploads/products/', ''); unlinkSync(join(UPLOADS_DIR, 'products', filename)) } catch { /* empty */ }
  res.json({ ok: true })
})

// ── Site & brand images ───────────────────────────────────────────────────────
app.post('/api/admin/upload/brand-logo', requireAuth, siteUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const url = `/uploads/site/${req.file.filename}`
  console.log('[Admin] Brand logo uploaded:', url)
  res.json({ ok: true, url })
})

app.post('/api/admin/upload/site', requireAuth, siteUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const { key } = req.body
  if (!key) return res.status(400).json({ error: 'key is required' })
  const url = `/uploads/site/${req.file.filename}`
  const data = readJSON(SITE_DATA_FILE, {})
  data.siteImages = data.siteImages || {}
  data.siteImages[key] = url
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Site image uploaded:', key, url)
  res.json({ ok: true, url })
})

// ── About ─────────────────────────────────────────────────────────────────────
app.put('/api/admin/about', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  data.about = { ...(data.about || {}), ...req.body }
  writeJSON(SITE_DATA_FILE, data)
  res.json({ ok: true })
})

// ── Blog ──────────────────────────────────────────────────────────────────────
app.get('/api/admin/blog', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.blogPosts || [])
})

app.post('/api/admin/blog', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  data.blogPosts = data.blogPosts || []
  const post = {
    id: generateId('POST'),
    title: req.body.title || 'Untitled',
    slug: req.body.slug || req.body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || generateId('post'),
    status: req.body.status || 'draft',
    category: req.body.category || '',
    date: req.body.date || new Date().toISOString().split('T')[0],
    excerpt: req.body.excerpt || '',
    content: req.body.content || '',
    coverImage: req.body.coverImage || '',
    tags: req.body.tags || [],
    videoUrl: req.body.videoUrl || '',
    audioUrl: req.body.audioUrl || '',
    mediaFiles: req.body.mediaFiles || [],
    authorName: req.body.authorName || '',
    authorBio: req.body.authorBio || '',
    publishAt: req.body.publishAt || '',
    viewCount: 0,
    order: data.blogPosts.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  data.blogPosts.unshift(post)
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Blog post created:', post.id)
  res.json({ ok: true, post })
})

app.put('/api/admin/blog/:id', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  const idx = (data.blogPosts || []).findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  data.blogPosts[idx] = { ...data.blogPosts[idx], ...req.body, updatedAt: new Date().toISOString() }
  writeJSON(SITE_DATA_FILE, data)
  res.json({ ok: true, post: data.blogPosts[idx] })
})

app.delete('/api/admin/blog/:id', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  data.blogPosts = (data.blogPosts || []).filter(p => p.id !== req.params.id)
  writeJSON(SITE_DATA_FILE, data)
  res.json({ ok: true })
})

app.put('/api/admin/blog/reorder', requireAuth, (req, res) => {
  const { posts } = req.body
  if (!Array.isArray(posts)) return res.status(400).json({ error: 'posts must be array' })
  const data = readJSON(SITE_DATA_FILE, {})
  data.blogPosts = posts
  writeJSON(SITE_DATA_FILE, data)
  res.json({ ok: true })
})

app.post('/api/admin/upload/blog', requireAuth, blogUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const url = `/uploads/blog/${req.file.filename}`
  const type = req.file.mimetype.startsWith('audio/') ? 'audio' : req.file.mimetype.startsWith('video/') ? 'video' : 'image'
  console.log('[Admin] Blog media uploaded:', url)
  res.json({ ok: true, url, type })
})

// ── SEO ───────────────────────────────────────────────────────────────────────
app.put('/api/admin/seo', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  data.seo = { ...(data.seo || {}), ...req.body }
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] SEO settings saved')
  res.json({ ok: true, seo: data.seo })
})

// ── Analytics (admin) ─────────────────────────────────────────────────────────
app.get('/api/admin/analytics', requireAuth, (req, res) => {
  const raw = readAnalytics()
  const events = raw.events || []
  const securityEvents = (raw.securityEvents || []).slice(0, 200)

  const pageViews = {}
  const productViews = {}
  const cartAdds = {}
  const locationMap = {}
  const deviceMap = {}
  const hourMap = {}
  const referrerMap = {}
  const dailyMap = {}
  const ipSet = new Set()
  let totalPageViews = 0

  events.forEach(e => {
    if (e.ip) ipSet.add(e.ip)
    const device = e.device || 'unknown'
    deviceMap[device] = (deviceMap[device] || 0) + 1
    if (e.referrer && e.referrer.trim() && !e.referrer.includes(req.hostname || 'localhost')) {
      try {
        const hostname = new URL(e.referrer).hostname
        if (hostname) referrerMap[hostname] = (referrerMap[hostname] || 0) + 1
      } catch { /* empty */ }
    }
    try {
      const hour = new Date(e.timestamp).getHours()
      if (!isNaN(hour)) hourMap[hour] = (hourMap[hour] || 0) + 1
    } catch { /* empty */ }
    const day = (e.timestamp || '').slice(0, 10)
    if (day) dailyMap[day] = (dailyMap[day] || 0) + 1
    if (e.location?.country && e.location.country !== 'Unknown' && e.location.country !== 'Local') {
      const key = e.location.city ? `${e.location.city}, ${e.location.country}` : e.location.country
      locationMap[key] = (locationMap[key] || 0) + 1
    }
    if (e.type === 'pageview' && e.page) {
      pageViews[e.page] = (pageViews[e.page] || 0) + 1
      totalPageViews++
    } else if (e.type === 'product_view' && e.slug) {
      if (!productViews[e.slug]) productViews[e.slug] = { count: 0, name: e.name || e.slug }
      productViews[e.slug].count++
    } else if (e.type === 'cart_add' && e.slug) {
      if (!cartAdds[e.slug]) cartAdds[e.slug] = { count: 0, qty: 0, name: e.name || e.slug }
      cartAdds[e.slug].count++
      cartAdds[e.slug].qty += e.qty || 1
    }
  })

  res.json({
    totalEvents: events.length,
    totalPageViews,
    uniqueVisitors: ipSet.size,
    pageViews,
    productViews,
    cartAdds,
    locationMap,
    deviceMap,
    hourMap,
    referrerMap,
    dailyMap,
    recentEvents: events.slice(0, 100),
    securityEvents,
    quoteRequests: events.filter(e => e.type === 'quote_request').slice(0, 200),
  })
})

app.delete('/api/admin/analytics/clear', requireAuth, (req, res) => {
  writeAnalytics({ events: [], securityEvents: [] })
  console.log('[Admin] Analytics data cleared')
  res.json({ ok: true })
})

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_CONTENT = {
  trustBar: {
    rating: '5.0/5', reviewCount: '500+', tagline: 'TRUSTED BY GLOBAL BRANDS',
    partners: [
      { key: 'UBA', name: 'UBA', visible: true },
      { key: 'MTN', name: 'MTN', visible: true },
      { key: 'HERO', name: 'HERO', visible: true },
      { key: 'IMO_DIGITAL', name: 'Imo Digital City Limited', visible: true },
      { key: 'NNPC', name: 'NNPC', visible: true },
      { key: 'SEPLAT', name: 'Seplat Energy', visible: true },
    ],
  },
  bestSelling: [
    { id: 6,  name: 'Die Cut Stickers',    slug: 'die-cut-stickers',  price: 'From ₦22,500', unit: 'per 500pcs', visible: true },
    { id: 1,  name: 'Flex Banner',         slug: 'flex-banner',       price: 'From ₦5,000',  unit: 'per piece',  visible: true },
    { id: 29, name: 'Burial Brochure',     slug: 'burial-brochure',   price: 'From ₦6,000',  unit: 'per 50pcs',  visible: true },
    { id: 30, name: 'Flyers & Posters',    slug: 'flyers-posters',    price: 'From ₦3,500',  unit: 'per 100pcs', visible: true },
    { id: 31, name: 'Rollup Stand',        slug: 'rollup-stand',      price: 'From ₦25,000', unit: 'per piece',  visible: true },
    { id: 32, name: 'T-Shirt & Cap',       slug: 't-shirt-cap',       price: 'From ₦5,000',  unit: 'per 10pcs',  visible: true },
    { id: 33, name: 'Signage & Billboard', slug: 'signage',           price: 'From ₦35,000', unit: 'per piece',  visible: true },
    { id: 27, name: 'Corporate Branding',  slug: 'graphic-design',    price: 'From ₦10,000', unit: 'per design', visible: true },
    { id: 9,  name: 'Business Card',       slug: 'business-card',     price: 'From ₦5,000',  unit: 'per 100pcs', visible: true },
    { id: 26, name: 'T-Shirts',            slug: 't-shirts',          price: 'From ₦5,000',  unit: 'per 10pcs',  visible: true },
  ],
  bestSelling_heading: 'BEST SELLING',
  bestSelling_subheading: 'our most popular and trusted products',
  reviews: { heading: 'Customers love Sleekblue', rating: '5.0/5', reviewCount: '500+', testimonials: [] },
  footer: {
    tagline: 'Premium print, branding & design solutions for businesses across Nigeria. Fast turnaround, zero stress.',
    services: ['Die Cut Stickers', 'Flex Banners', 'Business Cards', 'Vehicle Branding', 'Logo & Branding', 'T-Shirts & Caps', 'Rollup Stands', 'Burial Brochures'],
  },
  faq: [
    { question: 'What types of printing services does Sleekblue Media Houz offer?', answer: 'We offer a wide range of premium printing and branding services including die-cut stickers, flex banners, flyers & posters, business cards, rollup stands, T-shirts & caps, product labels, vehicle branding, signage & billboards, burial brochures, and corporate graphic design.' },
    { question: 'What is the minimum order quantity?', answer: 'Minimum order quantities vary by product. For die-cut stickers, our minimum is 100 pieces. For flyers and business cards, it\'s typically 50–100 pieces. Flex banners and rollup stands can be ordered as a single piece.' },
    { question: 'How long does production and delivery take?', answer: 'Standard production takes 1–3 business days for most products. Rush orders can be completed in 24 hours for an additional fee. We deliver nationwide across Nigeria, with delivery typically taking 1–3 extra days depending on your location.' },
    { question: 'Do you offer custom design services?', answer: 'Yes! Our in-house design team can create professional artwork for any of our products — from logo design and full brand identity packages to individual print files. Design turnaround is usually 24–48 hours.' },
    { question: 'Do you deliver nationwide across Nigeria?', answer: 'Absolutely. We deliver to all 36 states and the FCT via trusted courier partners. Whether you\'re in Lagos, Abuja, Port Harcourt, Kano, or anywhere else in Nigeria, we\'ll get your prints to you safely.' },
    { question: 'How do I place an order and what payment methods do you accept?', answer: 'You can place an order directly on our website or chat with us on WhatsApp at +234 806 527 5264. We accept bank transfers, mobile payments, and online card payments. Once payment is confirmed, your order goes straight to production.' },
  ],
}

function mergeContentDefaults(saved) {
  return {
    trustBar: {
      ...DEFAULT_CONTENT.trustBar,
      ...(saved.trustBar || {}),
      partners: saved.trustBar?.partners || DEFAULT_CONTENT.trustBar.partners,
    },
    bestSelling:            saved.bestSelling            || DEFAULT_CONTENT.bestSelling,
    bestSelling_heading:    saved.bestSelling_heading    || DEFAULT_CONTENT.bestSelling_heading,
    bestSelling_subheading: saved.bestSelling_subheading || DEFAULT_CONTENT.bestSelling_subheading,
    reviews: {
      ...DEFAULT_CONTENT.reviews,
      ...(saved.reviews || {}),
      testimonials: saved.reviews?.testimonials || [],
    },
    footer: {
      ...DEFAULT_CONTENT.footer,
      ...(saved.footer || {}),
      services: saved.footer?.services || DEFAULT_CONTENT.footer.services,
    },
    faq: saved.faq || DEFAULT_CONTENT.faq,
  }
}

const DEFAULT_PAGE_LAYOUT = [
  { id: 'hero',        label: 'Hero Banner',      icon: '🖼️',  visible: true },
  { id: 'trustBar',    label: 'Trust Bar',         icon: '⭐',  visible: true },
  { id: 'bestSelling', label: 'Best Selling',      icon: '🛍️', visible: true },
  { id: 'reviews',     label: 'Customer Reviews',  icon: '💬', visible: true },
  { id: 'faq',         label: 'FAQ Section',       icon: '❓',  visible: true },
]

const ABOUT_DEFAULTS = {
  heroTitle: 'About Sleekblue Media Houz',
  heroSubtitle: 'We print for the biggest brands — and yours is next.',
  whoWeAreTitle: 'Who We Are',
  whoWeAre: 'Sleekblue Media Houz is a premium printing and corporate branding company dedicated to helping businesses of all sizes — from solopreneurs to big brands — communicate their identity with clarity and confidence.',
  missionTitle: 'Our Mission',
  mission: 'To deliver premium printing with zero stress — high quality output, fast turnaround, and reliable service that empowers small businesses and enterprise brands alike to stand out in their market.',
  valuesTitle: 'What Sets Us Apart',
  values: [
    { icon: '🎯', title: 'Precision', desc: 'Every cut, every print is executed to exact specifications.' },
    { icon: '⚡', title: 'Speed', desc: 'Fast turnaround without compromising on quality.' },
    { icon: '💎', title: 'Quality', desc: 'Waterproof, durable materials that last and impress.' },
    { icon: '🤝', title: 'Trust', desc: 'Trusted by UBA, MTN, HERO, NNPC, Seplat, and 500+ brands.' },
    { icon: '💰', title: 'Value', desc: 'Bulk discounts for growing businesses.' },
    { icon: '🛠️', title: 'Support', desc: '24/7 customer care and WhatsApp-first communication.' },
  ],
  whoWeServeTitle: 'Who We Serve',
  whoWeServe: ['Solopreneurs & Micro Businesses', 'Small Business Owners', 'Growth Business Enterprises', 'Big Brands & Corporate Organizations'],
  ctaTitle: 'Ready to Print?',
  ctaText: 'Call us or chat on WhatsApp — we respond fast.',
  stats: [
    { value: '500+', label: 'Happy Clients' },
    { value: '5★', label: 'Google Rating' },
    { value: '10+', label: 'Years Experience' },
    { value: '24/7', label: 'Support' },
  ],
  showStats: true,
}

// ── Activity log ──────────────────────────────────────────────────────────────
const ACTIVITY_FILE = join(__dirname, 'activity-log.json')
function logActivity(action, detail, user = 'admin') {
  try {
    const log = readJSON(ACTIVITY_FILE, [])
    log.unshift({ id: generateId('ACT'), action, detail, user, timestamp: new Date().toISOString() })
    writeJSON(ACTIVITY_FILE, log.slice(0, 500))
  } catch { /* empty */ }
}

// ── Artwork upload (public — customers send print files) ───────────────────────
mkdirSync(join(UPLOADS_DIR, 'artwork'), { recursive: true })
const artworkUpload = multer({ storage: makeStorage('artwork'), limits: { fileSize: 25 * 1024 * 1024 } })

app.post('/api/upload/artwork', artworkUpload.single('artwork'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ ok: true, url: `/uploads/artwork/${req.file.filename}` })
})

// ── Blog view counter ──────────────────────────────────────────────────────────
app.post('/api/blog/:slug/view', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  const idx = (data.blogPosts || []).findIndex(p => p.slug === req.params.slug && p.status === 'published')
  if (idx !== -1) {
    data.blogPosts[idx].viewCount = (data.blogPosts[idx].viewCount || 0) + 1
    writeJSON(SITE_DATA_FILE, data)
  }
  res.json({ ok: true })
})

// ── Promo banner (public) ──────────────────────────────────────────────────────
app.get('/api/promo-banner', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.promoBanner || { enabled: false, text: '', link: '', color: '#7B2FBE', bgColor: '#f5f0ff' })
})

// ── Promo banner (admin) ───────────────────────────────────────────────────────
app.put('/api/admin/promo-banner', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  data.promoBanner = { ...(data.promoBanner || {}), ...req.body }
  writeJSON(SITE_DATA_FILE, data)
  logActivity('promo_banner', req.body.enabled ? 'enabled' : 'disabled')
  res.json({ ok: true })
})

// ── Admin backup ───────────────────────────────────────────────────────────────
app.get('/api/admin/backup', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  const filename = `sleekblue-backup-${new Date().toISOString().slice(0, 10)}.json`
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Content-Type', 'application/json')
  logActivity('backup_download', filename)
  res.send(JSON.stringify(data, null, 2))
})

// ── Activity log (admin) ───────────────────────────────────────────────────────
app.get('/api/admin/activity-log', requireAuth, (req, res) => {
  res.json(readJSON(ACTIVITY_FILE, []).slice(0, 200))
})

// ── Bulk product image upload ──────────────────────────────────────────────────
app.post('/api/admin/upload/product/:slug/bulk', requireAuth, productUpload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files' })
  const { slug } = req.params
  const data = readJSON(SITE_DATA_FILE, {})
  data.productImages = data.productImages || {}
  data.productImages[slug] = data.productImages[slug] || []
  const urls = req.files.map(f => `/uploads/products/${f.filename}`)
  data.productImages[slug].push(...urls)
  writeJSON(SITE_DATA_FILE, data)
  logActivity('bulk_image_upload', `${urls.length} images for ${slug}`)
  res.json({ ok: true, urls })
})

// ── Sitemap ────────────────────────────────────────────────────────────────────
const SITEMAP_PRODUCT_SLUGS = [
  'die-cut-stickers','product-labels','flex-banner','backlit-banner','canvas-banner',
  'flyers-posters','business-card','letterhead','compliment-slip','invoice-receipt',
  'burial-brochure','rollup-stand','double-sided-rollup','x-banner','pop-up-banner',
  'vehicle-branding','t-shirts','t-shirt-cap','branded-bags','signage','billboard',
  'graphic-design','brand-identity','social-media-design','packaging-design',
]

app.get('/sitemap.xml', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  const BASE = 'https://sleekbluemediahouz.com'
  const now = new Date()
  const posts = (data.blogPosts || []).filter(p => p.status === 'published' && (!p.publishAt || new Date(p.publishAt) <= now))
  const staticPages = ['', '/store', '/about', '/blog', '/quote', '/price-list']
  const urls = [
    ...staticPages.map(p => `  <url><loc>${BASE}${p}</loc><changefreq>weekly</changefreq><priority>${p === '' ? '1.0' : '0.8'}</priority></url>`),
    ...SITEMAP_PRODUCT_SLUGS.map(s => `  <url><loc>${BASE}/store/${s}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`),
    ...posts.map(p => `  <url><loc>${BASE}/blog/${p.slug}</loc><lastmod>${(p.updatedAt || p.date || '').slice(0,10) || new Date().toISOString().slice(0,10)}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`),
  ]
  res.setHeader('Content-Type', 'application/xml')
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`)
})

// ── robots.txt ─────────────────────────────────────────────────────────────────
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send('User-agent: *\nAllow: /\nDisallow: /sbm-control-2026\nDisallow: /api/\n\nSitemap: https://sleekbluemediahouz.com/sitemap.xml\n')
})

// ── RSS feed ───────────────────────────────────────────────────────────────────
app.get('/feed.xml', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  const BASE = 'https://sleekbluemediahouz.com'
  const now = new Date()
  const posts = (data.blogPosts || []).filter(p => p.status === 'published' && (!p.publishAt || new Date(p.publishAt) <= now)).slice(0, 20)
  const items = posts.map(p => [
    '    <item>',
    `      <title><![CDATA[${p.title}]]></title>`,
    `      <link>${BASE}/blog/${p.slug}</link>`,
    `      <guid>${BASE}/blog/${p.slug}</guid>`,
    `      <pubDate>${new Date(p.date || p.createdAt || Date.now()).toUTCString()}</pubDate>`,
    `      <description><![CDATA[${p.excerpt || ''}]]></description>`,
    p.coverImage ? `      <enclosure url="${BASE}${p.coverImage}" type="image/jpeg" length="0" />` : '',
    '    </item>',
  ].filter(Boolean).join('\n')).join('\n')
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>Sleekblue Media Houz Blog</title>\n    <link>${BASE}/blog</link>\n    <description>Printing tips, branding guides and business insights from Sleekblue Media Houz</description>\n    <language>en-ng</language>\n    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml" />\n${items}\n  </channel>\n</rss>`)
})

// ── SEO Agent audit ────────────────────────────────────────────────────────────
const STATIC_PAGES = [
  { key: 'home',       label: 'Homepage',          path: '/' },
  { key: 'store',      label: 'Store',              path: '/store' },
  { key: 'about',      label: 'About Us',           path: '/about' },
  { key: 'blog',       label: 'Blog',               path: '/blog' },
  { key: 'quote',      label: 'Request a Quote',    path: '/quote' },
  { key: 'dieCut',     label: 'Die-Cut Stickers',   path: '/store/die-cut-stickers' },
  { key: 'flexBanner', label: 'Flex Banner',         path: '/store/flex-banner' },
  { key: 'labels',     label: 'Product Labels',      path: '/store/product-labels' },
]

function scorePage(seo = {}) {
  const issues = []
  const passes = []
  let score = 0

  const title = (seo.title || '').trim()
  const desc  = (seo.description || '').trim()
  const canon = (seo.canonical || '').trim()
  const ogImg = (seo.ogImage || '').trim()

  if (!title)                  { issues.push({ sev: 'critical', msg: 'Missing meta title' }) }
  else if (title.length < 30)  { issues.push({ sev: 'warn', msg: `Title too short (${title.length} chars — aim 50-60)` }); score += 15 }
  else if (title.length > 65)  { issues.push({ sev: 'warn', msg: `Title too long (${title.length} chars — aim 50-60)` }); score += 15 }
  else                         { passes.push('Title length is optimal'); score += 25 }

  if (!desc)                   { issues.push({ sev: 'critical', msg: 'Missing meta description' }) }
  else if (desc.length < 100)  { issues.push({ sev: 'warn', msg: `Description too short (${desc.length} chars — aim 150-160)` }); score += 10 }
  else if (desc.length > 170)  { issues.push({ sev: 'warn', msg: `Description too long (${desc.length} chars — trim to 160)` }); score += 10 }
  else                         { passes.push('Description length is optimal'); score += 25 }

  if (!canon)  { issues.push({ sev: 'warn', msg: 'No canonical URL set' }) }
  else         { passes.push('Canonical URL present'); score += 20 }

  if (!ogImg)  { issues.push({ sev: 'warn', msg: 'No Open Graph image set' }) }
  else         { passes.push('OG image present'); score += 20 }

  if (title && title.toLowerCase().includes('sleekblue')) { passes.push('Brand in title'); score += 5 }
  else if (title) { issues.push({ sev: 'info', msg: 'Consider adding brand name to title' }) }

  if (title && desc) {
    const kw = title.split(' ')[0].toLowerCase()
    if (desc.toLowerCase().includes(kw)) { passes.push('Primary keyword in description'); score += 5 }
    else { issues.push({ sev: 'info', msg: 'Primary keyword not found in description' }) }
  }

  return { score: Math.min(score, 100), issues, passes }
}

app.get('/api/admin/seo-audit', requireAuth, (req, res) => {
  const data  = readJSON(SITE_DATA_FILE, {})
  const seo   = data.seo || {}
  const now   = new Date()

  const pages = STATIC_PAGES.map(p => {
    const audit = scorePage(seo[p.key] || {})
    return { ...p, seo: seo[p.key] || {}, ...audit }
  })

  const posts = (data.blogPosts || [])
    .filter(p => p.status === 'published' && (!p.publishAt || new Date(p.publishAt) <= now))
    .slice(0, 20)
    .map(p => {
      const fakeSeo = { title: p.title, description: p.excerpt, canonical: `https://sleekbluemediahouz.com/blog/${p.slug}`, ogImage: p.coverImage }
      const audit = scorePage(fakeSeo)
      return { key: p.slug, label: p.title, path: `/blog/${p.slug}`, seo: fakeSeo, ...audit }
    })

  const all    = [...pages, ...posts]
  const total  = all.length
  const avgScore = total ? Math.round(all.reduce((s, p) => s + p.score, 0) / total) : 0
  const critical = all.reduce((n, p) => n + p.issues.filter(i => i.sev === 'critical').length, 0)
  const warnings = all.reduce((n, p) => n + p.issues.filter(i => i.sev === 'warn').length, 0)

  res.json({ pages, posts, avgScore, critical, warnings, total })
})

// ── Growth Dashboard ────────────────────────────────────────────────────────────
app.get('/api/admin/growth', requireAuth, (req, res) => {
  const analytics  = readAnalytics()
  const events     = analytics.events || []
  const leads      = readJSON(LEADS_FILE, [])
  const data       = readJSON(SITE_DATA_FILE, {})
  const now        = new Date()
  const msDay      = 86400000
  const days30     = 30

  // Build last-30-days date keys
  const dateKeys = []
  for (let i = days30 - 1; i >= 0; i--) {
    dateKeys.push(new Date(now - i * msDay).toISOString().slice(0, 10))
  }
  const cutoff = new Date(now - days30 * msDay)

  // Daily page views
  const viewsByDay = {}
  dateKeys.forEach(d => { viewsByDay[d] = 0 })
  events.filter(e => e.type === 'pageview' && new Date(e.timestamp) >= cutoff)
    .forEach(e => {
      const d = e.timestamp.slice(0, 10)
      if (viewsByDay[d] !== undefined) viewsByDay[d]++
    })

  // Daily leads
  const leadsByDay = {}
  dateKeys.forEach(d => { leadsByDay[d] = 0 })
  leads.filter(l => new Date(l.timestamp) >= cutoff)
    .forEach(l => {
      const d = (l.timestamp || '').slice(0, 10)
      if (leadsByDay[d] !== undefined) leadsByDay[d]++
    })

  // Top pages
  const pageCounts = {}
  events.filter(e => e.type === 'pageview' && new Date(e.timestamp) >= cutoff)
    .forEach(e => { pageCounts[e.page || '/'] = (pageCounts[e.page || '/'] || 0) + 1 })
  const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([page, views]) => ({ page, views }))

  // Top products by view events
  const productCounts = {}
  events.filter(e => e.type === 'product_view' && e.slug && new Date(e.timestamp) >= cutoff)
    .forEach(e => { productCounts[e.slug] = (productCounts[e.slug] || 0) + 1 })
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([slug, views]) => ({ slug, name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), views }))

  // Blog post performance (views stored in blogPosts)
  const blogPerf = (data.blogPosts || [])
    .filter(p => p.status === 'published')
    .map(p => ({ slug: p.slug, title: p.title, views: p.viewCount || 0, date: p.date }))
    .sort((a, b) => b.views - a.views).slice(0, 8)

  // Device breakdown
  const deviceCounts = {}
  events.filter(e => e.type === 'pageview' && new Date(e.timestamp) >= cutoff)
    .forEach(e => { const d = e.device || 'unknown'; deviceCounts[d] = (deviceCounts[d] || 0) + 1 })

  // City breakdown
  const cityCounts = {}
  events.filter(e => e.type === 'pageview' && new Date(e.timestamp) >= cutoff && e.location?.city)
    .forEach(e => {
      const key = `${e.location.city}, ${e.location.region || e.location.country}`
      cityCounts[key] = (cityCounts[key] || 0) + 1
    })
  const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([city, views]) => ({ city, views }))

  // Quote requests (events with type cart_add or quote_request)
  const quotesCount = events.filter(e => (e.type === 'quote_request' || e.type === 'cart_add') && new Date(e.timestamp) >= cutoff).length

  const totalViews30 = Object.values(viewsByDay).reduce((s, v) => s + v, 0)
  const totalLeads30 = Object.values(leadsByDay).reduce((s, v) => s + v, 0)

  res.json({
    dateKeys,
    viewsByDay: dateKeys.map(d => ({ date: d, views: viewsByDay[d] })),
    leadsByDay: dateKeys.map(d => ({ date: d, leads: leadsByDay[d] })),
    topPages, topProducts, blogPerf, deviceCounts, topCities,
    summary: { totalViews30, totalLeads30, totalQuotes30: quotesCount, totalLeads: leads.length }
  })
})

// ── Newsletter ─────────────────────────────────────────────────────────────────
const NEWSLETTER_FILE     = join(__dirname, 'newsletter.json')
const COMMENTS_FILE       = join(__dirname, 'comments.json')
const REVIEWS_PENDING_FILE= join(__dirname, 'reviews-pending.json')
const REFERRALS_FILE      = join(__dirname, 'referrals.json')

app.post('/api/newsletter', (req, res) => {
  const { email, name } = req.body || {}
  if (!email || !/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'Valid email required' })
  const list = readJSON(NEWSLETTER_FILE, [])
  if (list.find(s => s.email.toLowerCase() === email.toLowerCase())) return res.json({ ok: true, already: true })
  list.unshift({ id: generateId('NL'), email, name: name || '', timestamp: new Date().toISOString() })
  writeJSON(NEWSLETTER_FILE, list)
  logActivity('newsletter_subscribe', `${name || email} subscribed to newsletter`, 'public')
  res.json({ ok: true })
})
app.get('/api/admin/newsletter', requireAuth, (req, res) => res.json(readJSON(NEWSLETTER_FILE, [])))
app.delete('/api/admin/newsletter/:id', requireAuth, (req, res) => {
  writeJSON(NEWSLETTER_FILE, readJSON(NEWSLETTER_FILE, []).filter(s => s.id !== req.params.id))
  res.json({ ok: true })
})

// ── Blog comments ──────────────────────────────────────────────────────────────
app.get('/api/blog/:slug/comments', (req, res) => {
  const all = readJSON(COMMENTS_FILE, {})
  res.json((all[req.params.slug] || []).filter(c => c.approved))
})
app.post('/api/blog/:slug/comment', (req, res) => {
  const { name, comment } = req.body || {}
  if (!name || !comment) return res.status(400).json({ error: 'Name and comment required' })
  const all = readJSON(COMMENTS_FILE, {})
  const slug = req.params.slug
  if (!all[slug]) all[slug] = []
  const entry = { id: generateId('CMT'), slug, name, comment, timestamp: new Date().toISOString(), approved: false }
  all[slug].unshift(entry)
  writeJSON(COMMENTS_FILE, all)
  logActivity('comment_submitted', `${name} commented on ${slug}`, 'public')
  res.json({ ok: true, id: entry.id })
})
app.get('/api/admin/comments', requireAuth, (req, res) => {
  const all = readJSON(COMMENTS_FILE, {})
  const flat = Object.values(all).flat().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  res.json(flat)
})
app.patch('/api/admin/comments/:id/approve', requireAuth, (req, res) => {
  const all = readJSON(COMMENTS_FILE, {})
  for (const slug in all) {
    const idx = all[slug].findIndex(c => c.id === req.params.id)
    if (idx !== -1) { all[slug][idx].approved = true; writeJSON(COMMENTS_FILE, all); return res.json({ ok: true }) }
  }
  res.status(404).json({ error: 'Comment not found' })
})
app.delete('/api/admin/comments/:id', requireAuth, (req, res) => {
  const all = readJSON(COMMENTS_FILE, {})
  for (const slug in all) all[slug] = (all[slug] || []).filter(c => c.id !== req.params.id)
  writeJSON(COMMENTS_FILE, all)
  res.json({ ok: true })
})

// ── Review submissions ─────────────────────────────────────────────────────────
app.post('/api/reviews/submit', (req, res) => {
  const { name, rating, text, location } = req.body || {}
  if (!name || !text) return res.status(400).json({ error: 'Name and review required' })
  const list = readJSON(REVIEWS_PENDING_FILE, [])
  const entry = { id: generateId('REV'), name, rating: parseInt(rating) || 5, text, location: location || '', timestamp: new Date().toISOString() }
  list.unshift(entry)
  writeJSON(REVIEWS_PENDING_FILE, list)
  logActivity('review_submitted', `${name} submitted a review`, 'public')
  res.json({ ok: true })
})
app.get('/api/admin/reviews', requireAuth, (req, res) => res.json(readJSON(REVIEWS_PENDING_FILE, [])))
app.patch('/api/admin/reviews/:id/approve', requireAuth, (req, res) => {
  const list = readJSON(REVIEWS_PENDING_FILE, [])
  const rev = list.find(r => r.id === req.params.id)
  if (!rev) return res.status(404).json({ error: 'Not found' })
  const data = readJSON(SITE_DATA_FILE, {})
  data.content = data.content || {}
  data.content.reviews = data.content.reviews || {}
  data.content.reviews.testimonials = data.content.reviews.testimonials || []
  data.content.reviews.testimonials.unshift({ id: rev.id, name: rev.name, rating: rev.rating, text: rev.text, location: rev.location, visible: true })
  writeJSON(SITE_DATA_FILE, data)
  writeJSON(REVIEWS_PENDING_FILE, list.filter(r => r.id !== req.params.id))
  logActivity('review_approved', `Review by ${rev.name} approved`, 'admin')
  res.json({ ok: true })
})
app.delete('/api/admin/reviews/:id', requireAuth, (req, res) => {
  writeJSON(REVIEWS_PENDING_FILE, readJSON(REVIEWS_PENDING_FILE, []).filter(r => r.id !== req.params.id))
  res.json({ ok: true })
})

// ── Referral system ────────────────────────────────────────────────────────────
app.post('/api/referral/generate', requireAuth, (req, res) => {
  const { name, contact } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Name required' })
  const list = readJSON(REFERRALS_FILE, [])
  const code = `SBM-${Math.random().toString(36).slice(2,8).toUpperCase()}`
  const entry = { id: generateId('REF'), code, name, contact: contact || '', createdAt: new Date().toISOString(), clicks: 0, referredLeads: 0 }
  list.unshift(entry)
  writeJSON(REFERRALS_FILE, list)
  logActivity('referral_created', `Referral link created for ${name}`, 'admin')
  res.json({ ok: true, code, url: `https://sleekbluemediahouz.com?ref=${code}` })
})
app.get('/api/referral/track/:code', (req, res) => {
  const list = readJSON(REFERRALS_FILE, [])
  const idx = list.findIndex(r => r.code === req.params.code)
  if (idx !== -1) { list[idx].clicks = (list[idx].clicks || 0) + 1; writeJSON(REFERRALS_FILE, list) }
  res.json({ ok: true })
})
app.get('/api/admin/referrals', requireAuth, (req, res) => res.json(readJSON(REFERRALS_FILE, [])))
app.delete('/api/admin/referrals/:id', requireAuth, (req, res) => {
  writeJSON(REFERRALS_FILE, readJSON(REFERRALS_FILE, []).filter(r => r.id !== req.params.id))
  res.json({ ok: true })
})

// ── Lead follow-up toggle ──────────────────────────────────────────────────────
app.patch('/api/admin/leads/:id/follow-up', requireAuth, (req, res) => {
  const leads = readJSON(LEADS_FILE, [])
  const idx = leads.findIndex(l => l.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' })
  leads[idx].followedUp = !leads[idx].followedUp
  leads[idx].followedUpAt = leads[idx].followedUp ? new Date().toISOString() : null
  writeJSON(LEADS_FILE, leads)
  res.json({ ok: true, followedUp: leads[idx].followedUp })
})

// ── Social proof — product view count (7-day) ──────────────────────────────────
app.get('/api/product/views/:slug', (req, res) => {
  const analytics = readAnalytics()
  const slug = req.params.slug
  const cutoff = new Date(Date.now() - 7 * 86400000)
  const views7d = (analytics.events || []).filter(e => e.type === 'product_view' && e.slug === slug && new Date(e.timestamp) >= cutoff).length
  res.json({ slug, views7d })
})

// ── Health and deployment checks ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sleekblue', timestamp: new Date().toISOString() })
})

// ── Serve React frontend (production build) ───────────────────────────────────
const DIST_DIR = join(__dirname, 'dist')
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, {
    maxAge: '1h',
    immutable: false,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache')
      }
    },
  }))
  // All non-API routes → React app (handles client-side routing)
  app.get('{*splat}', (req, res) => {
    res.sendFile(join(DIST_DIR, 'index.html'))
  })
} else {
  app.get('{*splat}', (req, res) => {
    res.status(503).json({ error: 'Frontend not built. Run: npm run build' })
  })
}

app.listen(PORT, () => console.log(`Sleekblue API server running on port ${PORT}`))
