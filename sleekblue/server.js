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

const JWT_SECRET = process.env.JWT_SECRET || 'sbm_admin_jwt_secret_2026'
const PORT       = process.env.TERMS_PORT || 3001

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
function writeAnalytics(data) { try { writeJSON(ANALYTICS_FILE, data) } catch {} }

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
  } catch {}
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
  } catch {}
  return { country: 'Unknown', city: '', region: '', lat: 0, lon: 0 }
}

if (!existsSync(ADMIN_CFG_FILE)) {
  writeJSON(ADMIN_CFG_FILE, {
    username: 'admin',
    passwordHash: bcrypt.hashSync('Sleekblue2026!', 10),
  })
  console.log('[Admin] Default credentials: admin / Sleekblue2026!')
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
      } catch {}
    }).catch(() => {})
  } catch {}
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

app.get('/api/blog', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  const posts = (data.blogPosts || []).filter(p => p.status === 'published')
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
  try { const filename = url.replace('/uploads/hero/', ''); unlinkSync(join(UPLOADS_DIR, 'hero', filename)) } catch {}
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
  try { const filename = url.replace('/uploads/hero/', ''); unlinkSync(join(UPLOADS_DIR, 'hero', filename)) } catch {}
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
  try { const filename = url.replace('/uploads/products/', ''); unlinkSync(join(UPLOADS_DIR, 'products', filename)) } catch {}
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
  try { const filename = url.replace('/uploads/products/', ''); unlinkSync(join(UPLOADS_DIR, 'products', filename)) } catch {}
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
  try { const filename = url.replace('/uploads/products/', ''); unlinkSync(join(UPLOADS_DIR, 'products', filename)) } catch {}
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
      } catch {}
    }
    try {
      const hour = new Date(e.timestamp).getHours()
      if (!isNaN(hour)) hourMap[hour] = (hourMap[hour] || 0) + 1
    } catch {}
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

app.listen(PORT, () => console.log(`Sleekblue API server running on port ${PORT}`))
