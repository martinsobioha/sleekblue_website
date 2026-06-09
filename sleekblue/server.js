import express from 'express'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const LOG_FILE        = join(__dirname, 'acceptance-log.json')
const SITE_DATA_FILE  = join(__dirname, 'site-data.json')
const ADMIN_CFG_FILE  = join(__dirname, 'admin-config.json')

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

if (!existsSync(ADMIN_CFG_FILE)) {
  writeJSON(ADMIN_CFG_FILE, {
    username: 'admin',
    passwordHash: bcrypt.hashSync('Sleekblue2026!', 10),
  })
  console.log('[Admin] Default credentials: admin / Sleekblue2026!')
}

const app = express()
app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    req.admin = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ── Public: Terms acceptance ──────────────────────────────────────────
app.post('/api/accept-terms', (req, res) => {
  const records = readJSON(LOG_FILE, [])
  const record = {
    acceptanceId: generateId(),
    timestamp:    new Date().toISOString(),
    termsVersion: req.body.termsVersion || 'June 2026',
    customerName: req.body.customerName || '',
    email:        req.body.email        || '',
    phone:        req.body.phone        || '',
    ipAddress:    (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim(),
    userAgent:    req.headers['user-agent'] || '',
  }
  records.push(record)
  writeJSON(LOG_FILE, records)
  console.log('[Terms] Accepted:', record.acceptanceId, '|', record.customerName)
  res.json({ ok: true, acceptanceId: record.acceptanceId })
})

// ── Public: Settings ─────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.settings || {})
})

// ── Public: Products with overrides applied ───────────────────────────
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

// ── Admin: Login ──────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body
  const cfg = readJSON(ADMIN_CFG_FILE, {})
  if (username !== cfg.username) return res.status(401).json({ error: 'Invalid credentials' })
  if (!bcrypt.compareSync(password, cfg.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' })
  console.log('[Admin] Login:', username)
  res.json({ ok: true, token })
})

// ── Admin: Acceptances ────────────────────────────────────────────────
app.get('/api/admin/acceptances', requireAuth, (req, res) => {
  res.json(readJSON(LOG_FILE, []))
})

// ── Admin: Products CRUD ──────────────────────────────────────────────
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

// ── Admin: Sticker prices ─────────────────────────────────────────────
app.put('/api/admin/sticker-prices', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, { settings: {}, productOverrides: {}, stickerPriceOverrides: {} })
  data.stickerPriceOverrides = req.body
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Sticker prices updated')
  res.json({ ok: true })
})

// ── Admin: Settings ───────────────────────────────────────────────────
app.put('/api/admin/settings', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, { settings: {}, productOverrides: {}, stickerPriceOverrides: {} })
  data.settings = { ...(data.settings || {}), ...req.body }
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Settings updated')
  res.json({ ok: true })
})

// ── Admin: Change password ─────────────────────────────────────────────
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

// ── Content defaults ──────────────────────────────────────────────────────────
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
}

function mergeContentDefaults(saved) {
  return {
    trustBar: {
      ...DEFAULT_CONTENT.trustBar,
      ...(saved.trustBar || {}),
      partners: saved.trustBar?.partners || DEFAULT_CONTENT.trustBar.partners,
    },
    bestSelling:           saved.bestSelling           || DEFAULT_CONTENT.bestSelling,
    bestSelling_heading:   saved.bestSelling_heading   || DEFAULT_CONTENT.bestSelling_heading,
    bestSelling_subheading:saved.bestSelling_subheading|| DEFAULT_CONTENT.bestSelling_subheading,
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
  }
}

// ── Public: Site content ──────────────────────────────────────────────────────
app.get('/api/content', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(mergeContentDefaults(data.content || {}))
})

// ── Admin: Site content ───────────────────────────────────────────────────────
app.put('/api/admin/content', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, { settings: {}, productOverrides: {}, stickerPriceOverrides: {}, content: {} })
  data.content = { ...(data.content || {}), ...req.body }
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Content updated:', Object.keys(req.body).join(', '))
  res.json({ ok: true })
})

// ── Public: Page layout ───────────────────────────────────────────────────────
const DEFAULT_PAGE_LAYOUT = [
  { id: 'hero',        label: 'Hero Banner',    icon: '🖼️',  visible: true },
  { id: 'trustBar',    label: 'Trust Bar',      icon: '⭐',  visible: true },
  { id: 'bestSelling', label: 'Best Selling',   icon: '🛍️', visible: true },
  { id: 'reviews',     label: 'Customer Reviews', icon: '💬', visible: true },
]

app.get('/api/page-layout', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.pageLayout || DEFAULT_PAGE_LAYOUT)
})

// ── Admin: Page layout ────────────────────────────────────────────────────────
app.put('/api/admin/page-layout', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, { settings: {}, productOverrides: {}, stickerPriceOverrides: {}, content: {} })
  data.pageLayout = req.body
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Page layout updated')
  res.json({ ok: true })
})

// ── Admin: Hero content ───────────────────────────────────────────────────────
app.get('/api/hero', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.hero || {})
})

app.put('/api/admin/hero', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, { settings: {}, productOverrides: {}, stickerPriceOverrides: {}, content: {} })
  data.hero = { ...(data.hero || {}), ...req.body }
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Hero content updated')
  res.json({ ok: true })
})

app.listen(PORT, () => console.log(`Sleekblue API server running on port ${PORT}`))
