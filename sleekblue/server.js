import express from 'express'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const LOG_FILE        = join(__dirname, 'acceptance-log.json')
const SITE_DATA_FILE  = join(__dirname, 'site-data.json')
const ADMIN_CFG_FILE  = join(__dirname, 'admin-config.json')
const UPLOADS_DIR     = join(__dirname, 'uploads')

// Ensure upload directories exist
;['hero', 'products', 'site', 'blog'].forEach(sub =>
  mkdirSync(join(UPLOADS_DIR, sub), { recursive: true })
)

// Multer storage — files go to uploads/<folder>/
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

// Serve uploaded files as static assets
app.use('/uploads', express.static(UPLOADS_DIR))

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

// ── Admin: Image uploads ──────────────────────────────────────────────────────

// Upload hero slide image
app.post('/api/admin/upload/hero', requireAuth, heroUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const url = `/uploads/hero/${req.file.filename}`
  // Add to hero slides list in site-data
  const data = readJSON(SITE_DATA_FILE, {})
  data.hero = data.hero || {}
  data.hero.customSlides = data.hero.customSlides || []
  data.hero.customSlides.push(url)
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] Hero slide uploaded:', url)
  res.json({ ok: true, url })
})

// Delete hero slide
app.delete('/api/admin/upload/hero', requireAuth, (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'No url provided' })
  const data = readJSON(SITE_DATA_FILE, {})
  data.hero = data.hero || {}
  data.hero.customSlides = (data.hero.customSlides || []).filter(u => u !== url)
  writeJSON(SITE_DATA_FILE, data)
  // Try to delete the actual file
  try {
    const filename = url.replace('/uploads/hero/', '')
    unlinkSync(join(UPLOADS_DIR, 'hero', filename))
  } catch {}
  res.json({ ok: true })
})

// Reorder hero slides
app.put('/api/admin/upload/hero/reorder', requireAuth, (req, res) => {
  const { slides } = req.body
  if (!Array.isArray(slides)) return res.status(400).json({ error: 'slides must be array' })
  const data = readJSON(SITE_DATA_FILE, {})
  data.hero = data.hero || {}
  data.hero.customSlides = slides
  writeJSON(SITE_DATA_FILE, data)
  res.json({ ok: true })
})

// Upload product image
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

// Delete product image
app.delete('/api/admin/upload/product/:slug', requireAuth, (req, res) => {
  const { slug } = req.params
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'No url provided' })
  const data = readJSON(SITE_DATA_FILE, {})
  data.productImages = data.productImages || {}
  data.productImages[slug] = (data.productImages[slug] || []).filter(u => u !== url)
  writeJSON(SITE_DATA_FILE, data)
  try {
    const filename = url.replace('/uploads/products/', '')
    unlinkSync(join(UPLOADS_DIR, 'products', filename))
  } catch {}
  res.json({ ok: true })
})

// Get all product images (uploaded ones)
app.get('/api/product-images', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.productImages || {})
})

// Sticker size images — upload and retrieve
app.get('/api/sticker-images', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.stickerImages || {})
})

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
  try {
    const filename = url.replace('/uploads/products/', '')
    unlinkSync(join(UPLOADS_DIR, 'products', filename))
  } catch {}
  res.json({ ok: true })
})

// Upload brand/partner logo (returns URL only — stored via content save)
app.post('/api/admin/upload/brand-logo', requireAuth, siteUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const url = `/uploads/site/${req.file.filename}`
  console.log('[Admin] Brand logo uploaded:', url)
  res.json({ ok: true, url })
})

// Upload site image (logo, etc)
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

// Get site images
app.get('/api/site-images', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.siteImages || {})
})

// ── Public: About page ────────────────────────────────────────────────────────
const ABOUT_DEFAULTS = {
  heroTitle: 'About Sleekblue Media Houz',
  heroSubtitle: 'We print for the biggest brands — and yours is next.',
  whoWeAreTitle: 'Who We Are',
  whoWeAre: 'Sleekblue Media Houz is a premium printing and corporate branding company dedicated to helping businesses of all sizes — from solopreneurs to big brands — communicate their identity with clarity and confidence. We specialize in die-cut stickers, flex printing, large format printing, corporate branding, and a wide range of promotional materials.',
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

app.get('/api/about', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json({ ...ABOUT_DEFAULTS, ...(data.about || {}) })
})

app.put('/api/admin/about', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  data.about = { ...(data.about || {}), ...req.body }
  writeJSON(SITE_DATA_FILE, data)
  res.json({ ok: true })
})

// ── Public: Blog ──────────────────────────────────────────────────────────────
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

// ── Admin: Blog ───────────────────────────────────────────────────────────────
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

// Upload blog media (images, audio, video files)
app.post('/api/admin/upload/blog', requireAuth, blogUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const url = `/uploads/blog/${req.file.filename}`
  const type = req.file.mimetype.startsWith('audio/') ? 'audio' : req.file.mimetype.startsWith('video/') ? 'video' : 'image'
  console.log('[Admin] Blog media uploaded:', url)
  res.json({ ok: true, url, type })
})

// ─── SEO Settings ─────────────────────────────────────────────────────────────
app.get('/api/seo', (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  res.json(data.seo || {})
})

app.put('/api/admin/seo', requireAuth, (req, res) => {
  const data = readJSON(SITE_DATA_FILE, {})
  data.seo = { ...(data.seo || {}), ...req.body }
  writeJSON(SITE_DATA_FILE, data)
  console.log('[Admin] SEO settings saved')
  res.json({ ok: true, seo: data.seo })
})

app.listen(PORT, () => console.log(`Sleekblue API server running on port ${PORT}`))
