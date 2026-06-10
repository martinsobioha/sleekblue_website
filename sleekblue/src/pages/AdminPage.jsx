import { useState, useEffect, useCallback } from 'react'
import logo from '@assets/SLEEKBLUE_LOGO_1779927359068.jpg'
import { ALL_PRODUCTS, STICKER_SIZE_PRICES, getProductDetails } from '../data/products'

const PRI = '#7B2FBE'
const PRI_LIGHT = '#f0e8ff'
const ACC = '#FF6B00'
const SIDEBAR_W = '220px'

function authH(token) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

function fmt(n) { return '₦' + Math.round(n).toLocaleString() }

// ─── Shared UI ───────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', ...style }}>{children}</div>
}
function Btn({ children, onClick, variant = 'primary', disabled, style }) {
  const bg = variant === 'primary' ? PRI : variant === 'danger' ? '#dc2626' : variant === 'success' ? '#16a34a' : '#fff'
  const color = variant === 'ghost' ? '#555' : '#fff'
  const border = variant === 'ghost' ? '1.5px solid #ddd' : 'none'
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: disabled ? '#ccc' : bg, color: disabled ? '#888' : color, border, borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: "'HubotSans',sans-serif", transition: 'opacity 0.15s', ...style }}>
      {children}
    </button>
  )
}
function Input({ label, value, onChange, type = 'text', placeholder, rows, style, readOnly }) {
  const base = { width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none', boxSizing: 'border-box', background: readOnly ? '#f9f9f9' : '#fff', ...style }
  return (
    <div style={{ marginBottom: '14px' }}>
      {label && <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '5px', fontFamily: "'HubotSans',sans-serif" }}>{label}</label>}
      {rows
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ ...base, resize: 'vertical' }} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} style={base} />
      }
    </div>
  )
}
function Badge({ children, color = PRI }) {
  return <span style={{ background: color + '20', color, borderRadius: '12px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, fontFamily: "'HubotSans',sans-serif" }}>{children}</span>
}
function SaveBar({ onSave, onCancel, saving, saved }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
      <Btn onClick={onSave} disabled={saving} style={{ background: saving ? '#aaa' : '#16a34a', minWidth: '200px' }}>
        {saving ? 'Publishing…' : '🚀 Publish to Website'}
      </Btn>
      {onCancel && <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>}
      {saved && <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>✓ Published! Changes are now live.</span>}
    </div>
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return }
      localStorage.setItem('sbm_admin_token', data.token)
      onLogin(data.token)
    } catch {
      setError('Cannot connect to server. Make sure the app is running.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #5a1fa0 0%, #7B2FBE 60%, #9c4de0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '40px 36px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src={logo} alt="Sleekblue" style={{ height: '56px', borderRadius: '8px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', margin: '14px 0 4px', fontFamily: "'HubotSans',sans-serif" }}>Admin Panel</h2>
          <p style={{ fontSize: '13px', color: '#888', fontFamily: "'HubotSans',sans-serif", margin: 0 }}>Sign in to manage your website</p>
        </div>
        <form onSubmit={handleLogin}>
          <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" />
          {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px', fontFamily: "'HubotSans',sans-serif" }}>{error}</p>}
          <Btn onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? 'Signing in…' : '🔐 Sign In'}
          </Btn>
        </form>
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#bbb', marginTop: '16px', fontFamily: "'HubotSans',sans-serif" }}>
          Sleekblue Media Houz — Admin Access
        </p>
      </div>
    </div>
  )
}

// ─── Image Manager ────────────────────────────────────────────────────────────
function ImageManager({ token }) {
  const [tab, setTab] = useState('hero')
  const [heroSlides, setHeroSlides] = useState([])
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroMsg, setHeroMsg] = useState('')
  const [products, setProducts] = useState(ALL_PRODUCTS)
  const [selectedSlug, setSelectedSlug] = useState(ALL_PRODUCTS[0]?.slug || '')
  const [productImages, setProductImages] = useState({})
  const [prodUploading, setProdUploading] = useState(false)
  const [prodMsg, setProdMsg] = useState('')
  const [dragIdx, setDragIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  useEffect(() => {
    fetch('/api/hero').then(r => r.ok ? r.json() : {}).then(d => setHeroSlides(d.customSlides || []))
    fetch('/api/product-images').then(r => r.ok ? r.json() : {}).then(d => setProductImages(d))
  }, [])

  // ── Hero slide upload
  async function uploadHeroSlide(e) {
    const file = e.target.files[0]; if (!file) return
    setHeroUploading(true); setHeroMsg('')
    const fd = new FormData(); fd.append('image', file)
    const res = await fetch('/api/admin/upload/hero', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    const data = await res.json()
    if (data.ok) { setHeroSlides(s => [...s, data.url]); setHeroMsg('✓ Slide uploaded!') }
    else setHeroMsg('✗ Upload failed: ' + (data.error || ''))
    setHeroUploading(false); e.target.value = ''
  }

  async function deleteHeroSlide(url) {
    if (!confirm('Delete this hero slide?')) return
    await fetch('/api/admin/upload/hero', { method: 'DELETE', headers: authH(token), body: JSON.stringify({ url }) })
    setHeroSlides(s => s.filter(u => u !== url))
  }

  async function saveHeroOrder(slides) {
    setHeroSlides(slides)
    await fetch('/api/admin/upload/hero/reorder', { method: 'PUT', headers: authH(token), body: JSON.stringify({ slides }) })
  }

  function onHeroDragStart(e, i) { setDragIdx(i); e.dataTransfer.effectAllowed = 'move' }
  function onHeroDragOver(e, i) { e.preventDefault(); setDragOverIdx(i) }
  function onHeroDrop(e, i) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return }
    const next = [...heroSlides]; const [m] = next.splice(dragIdx, 1); next.splice(i, 0, m)
    saveHeroOrder(next); setDragIdx(null); setDragOverIdx(null)
  }
  function onHeroDragEnd() { setDragIdx(null); setDragOverIdx(null) }

  function moveHero(i, dir) {
    const next = [...heroSlides]; const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]; saveHeroOrder(next)
  }

  // ── Product image upload
  async function uploadProductImage(e) {
    const file = e.target.files[0]; if (!file || !selectedSlug) return
    setProdUploading(true); setProdMsg('')
    const fd = new FormData(); fd.append('image', file)
    const res = await fetch(`/api/admin/upload/product/${selectedSlug}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    const data = await res.json()
    if (data.ok) {
      setProductImages(prev => ({ ...prev, [selectedSlug]: [...(prev[selectedSlug] || []), data.url] }))
      setProdMsg('✓ Image uploaded!')
    } else setProdMsg('✗ Upload failed: ' + (data.error || ''))
    setProdUploading(false); e.target.value = ''
  }

  async function deleteProductImage(slug, url) {
    if (!confirm('Delete this product image?')) return
    await fetch(`/api/admin/upload/product/${slug}`, { method: 'DELETE', headers: authH(token), body: JSON.stringify({ url }) })
    setProductImages(prev => ({ ...prev, [slug]: (prev[slug] || []).filter(u => u !== url) }))
  }

  const tabs = [
    { id: 'hero',    label: '🖼️ Hero Slides' },
    { id: 'product', label: '🛍️ Product Images' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px', fontFamily: "'HubotSans',sans-serif" }}>Image Manager</h2>
        <p style={{ color: '#888', fontSize: '13px', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Upload, replace, reorder, and delete images across your website.</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab === t.id ? PRI : '#fff', color: tab === t.id ? '#fff' : '#555', fontWeight: tab === t.id ? 700 : 500, fontSize: '13px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', fontFamily: "'HubotSans',sans-serif", transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hero' && (
        <div>
          <Card style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '8px', fontFamily: "'HubotSans',sans-serif" }}>Hero Slideshow Images</h3>
            <p style={{ fontSize: '12.5px', color: '#888', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>
              Upload new hero slide images. They will replace the default slides on the homepage. Drag or use ▲▼ to reorder. Recommended: landscape images (1920×600px or similar).
            </p>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: PRI, color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: "'HubotSans',sans-serif" }}>
              {heroUploading ? '⏳ Uploading…' : '⬆️ Upload Slide Image'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadHeroSlide} disabled={heroUploading} />
            </label>
            {heroMsg && <p style={{ fontSize: '12px', color: heroMsg.startsWith('✓') ? '#16a34a' : '#dc2626', margin: '8px 0 0', fontFamily: "'HubotSans',sans-serif" }}>{heroMsg}</p>}
          </Card>

          {heroSlides.length === 0
            ? <Card><p style={{ color: '#aaa', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", margin: 0 }}>No custom slides uploaded yet. The default built-in slides will be used.</p></Card>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                {heroSlides.map((url, i) => (
                  <div key={url} draggable
                    onDragStart={e => onHeroDragStart(e, i)}
                    onDragOver={e => onHeroDragOver(e, i)}
                    onDrop={e => onHeroDrop(e, i)}
                    onDragEnd={onHeroDragEnd}
                    style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: dragOverIdx === i ? `0 0 0 3px ${PRI}` : '0 1px 6px rgba(0,0,0,0.08)', border: `2px solid ${dragOverIdx === i ? PRI : '#eee'}`, opacity: dragIdx === i ? 0.5 : 1, cursor: 'grab', transition: 'all 0.15s' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={url} alt={`Slide ${i+1}`} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, fontFamily: "'HubotSans',sans-serif" }}>Slide {i+1}</div>
                    </div>
                    <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#bbb', fontFamily: "'HubotSans',sans-serif", flex: 1 }}>⠿ drag to reorder</span>
                      <button onClick={() => moveHero(i, -1)} disabled={i === 0} style={{ background: PRI_LIGHT, border: 'none', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', color: PRI, fontSize: '11px', opacity: i === 0 ? 0.4 : 1 }}>▲</button>
                      <button onClick={() => moveHero(i, 1)} disabled={i === heroSlides.length-1} style={{ background: PRI_LIGHT, border: 'none', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', color: PRI, fontSize: '11px', opacity: i === heroSlides.length-1 ? 0.4 : 1 }}>▼</button>
                      <button onClick={() => deleteHeroSlide(url)} style={{ background: '#fee2e2', border: 'none', borderRadius: '5px', padding: '4px 10px', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '13px' }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {tab === 'product' && (
        <div>
          <Card style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '12px', fontFamily: "'HubotSans',sans-serif" }}>Product Images</h3>
            <p style={{ fontSize: '12.5px', color: '#888', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>
              Select a product, then upload images for it. Uploaded images appear first on the product page.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={selectedSlug} onChange={e => { setSelectedSlug(e.target.value); setProdMsg('') }}
                style={{ padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none', minWidth: '220px' }}>
                {products.map(p => (
                  <option key={p.slug} value={p.slug}>{p.name}</option>
                ))}
              </select>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: PRI, color: '#fff', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: "'HubotSans',sans-serif" }}>
                {prodUploading ? '⏳ Uploading…' : '⬆️ Upload Image'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadProductImage} disabled={prodUploading} />
              </label>
            </div>
            {prodMsg && <p style={{ fontSize: '12px', color: prodMsg.startsWith('✓') ? '#16a34a' : '#dc2626', margin: '8px 0 0', fontFamily: "'HubotSans',sans-serif" }}>{prodMsg}</p>}
          </Card>

          {selectedSlug && (
            <Card>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px', fontFamily: "'HubotSans',sans-serif" }}>
                Uploaded images for: <span style={{ color: PRI }}>{products.find(p => p.slug === selectedSlug)?.name}</span>
              </h4>
              {!(productImages[selectedSlug]?.length)
                ? <p style={{ color: '#aaa', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", margin: 0 }}>No custom images uploaded for this product yet.</p>
                : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                    {(productImages[selectedSlug] || []).map((url, i) => (
                      <div key={url} style={{ borderRadius: '10px', overflow: 'hidden', border: '2px solid #eee', position: 'relative' }}>
                        <img src={url} alt={`product ${i+1}`} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
                        <button onClick={() => deleteProductImage(selectedSlug, url)}
                          style={{ position: 'absolute', top: '6px', right: '6px', background: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '13px' }}>🗑</button>
                        {i === 0 && <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: '#16a34a', color: '#fff', borderRadius: '5px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, fontFamily: "'HubotSans',sans-serif" }}>Main</div>}
                      </div>
                    ))}
                  </div>
                )
              }
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page Editor ──────────────────────────────────────────────────────────────
function PageEditorView({ token }) {
  const DEFAULT_LAYOUT = [
    { id: 'hero',        label: 'Hero Banner',       icon: '🖼️',  visible: true, description: 'The main slideshow at the top of the homepage' },
    { id: 'trustBar',    label: 'Trust Bar',          icon: '⭐',  visible: true, description: 'Star rating and partner logos strip' },
    { id: 'bestSelling', label: 'Best Selling',       icon: '🛍️', visible: true, description: 'Product grid showcasing your best sellers' },
    { id: 'reviews',     label: 'Customer Reviews',   icon: '💬', visible: true, description: 'Testimonials and ratings from customers' },
  ]
  const [layout, setLayout] = useState(DEFAULT_LAYOUT)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [heroData, setHeroData] = useState({ headline: '', subheadline: '', btn1: '', btn2: '' })
  const [heroSaving, setHeroSaving] = useState(false)
  const [heroSaved, setHeroSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('layout')

  useEffect(() => {
    fetch('/api/page-layout')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d) && d.length) setLayout(d.map(s => ({ ...DEFAULT_LAYOUT.find(x => x.id === s.id), ...s }))) })
      .catch(() => {})
    fetch('/api/hero')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setHeroData({ headline: d.headline || '', subheadline: d.subheadline || '', btn1: d.btn1 || '', btn2: d.btn2 || '' }) })
      .catch(() => {})
  }, [])

  function toggleVisible(id) {
    setLayout(l => l.map(s => s.id === id ? { ...s, visible: !s.visible } : s))
  }

  function onDragStart(e, idx) {
    setDragging(idx)
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDragOver(e, idx) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(idx)
  }
  function onDrop(e, idx) {
    e.preventDefault()
    if (dragging === null || dragging === idx) { setDragging(null); setDragOver(null); return }
    const next = [...layout]
    const [moved] = next.splice(dragging, 1)
    next.splice(idx, 0, moved)
    setLayout(next)
    setDragging(null)
    setDragOver(null)
  }
  function onDragEnd() { setDragging(null); setDragOver(null) }

  function moveSection(idx, dir) {
    const next = [...layout]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setLayout(next)
  }

  async function saveLayout() {
    setSaving(true); setSaved(false)
    await fetch('/api/admin/page-layout', {
      method: 'PUT', headers: authH(token),
      body: JSON.stringify(layout.map(({ id, visible }) => ({ id, visible }))),
    })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  async function saveHero() {
    setHeroSaving(true); setHeroSaved(false)
    await fetch('/api/admin/hero', { method: 'PUT', headers: authH(token), body: JSON.stringify(heroData) })
    setHeroSaving(false); setHeroSaved(true); setTimeout(() => setHeroSaved(false), 3000)
  }

  const tabs = [
    { id: 'layout', label: '⠿ Section Order & Visibility' },
    { id: 'hero',   label: '🖼️ Hero Banner Text' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px', fontFamily: "'HubotSans',sans-serif" }}>Page Editor</h2>
        <p style={{ color: '#888', fontSize: '13px', margin: '0 0 16px', fontFamily: "'HubotSans',sans-serif" }}>Drag and drop sections to reorder the homepage, or toggle them on/off.</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === t.id ? PRI : '#fff', color: activeTab === t.id ? '#fff' : '#555', fontWeight: activeTab === t.id ? 700 : 500, fontSize: '13px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', fontFamily: "'HubotSans',sans-serif", transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
          <a href="/" target="_blank" rel="noopener noreferrer"
            style={{ marginLeft: 'auto', padding: '9px 18px', borderRadius: '8px', background: '#fff', border: '1.5px solid #ddd', color: '#555', fontSize: '13px', fontWeight: 600, fontFamily: "'HubotSans',sans-serif", textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            👁️ Preview Site
          </a>
        </div>
      </div>

      {activeTab === 'layout' && (
        <div>
          <Card style={{ marginBottom: '16px', padding: '16px 20px' }}>
            <p style={{ fontSize: '12.5px', color: '#888', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>
              💡 <strong>Drag</strong> the cards below to reorder homepage sections. <strong>Toggle</strong> the switch to show or hide each section. Click <strong>Save Layout</strong> when done.
            </p>
          </Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {layout.map((section, idx) => {
              const isDraggingThis = dragging === idx
              const isOver = dragOver === idx
              return (
                <div key={section.id}
                  draggable
                  onDragStart={e => onDragStart(e, idx)}
                  onDragOver={e => onDragOver(e, idx)}
                  onDrop={e => onDrop(e, idx)}
                  onDragEnd={onDragEnd}
                  style={{
                    background: isDraggingThis ? '#f0e8ff' : isOver ? '#e8f0ff' : '#fff',
                    border: `2px solid ${isOver ? PRI : isDraggingThis ? PRI + '88' : '#eee'}`,
                    borderRadius: '12px',
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    cursor: 'grab',
                    transition: 'all 0.15s',
                    opacity: isDraggingThis ? 0.5 : 1,
                    boxShadow: isOver ? `0 0 0 3px ${PRI}22` : '0 1px 4px rgba(0,0,0,0.06)',
                    userSelect: 'none',
                  }}>
                  <span style={{ fontSize: '22px', color: '#bbb', cursor: 'grab', flexShrink: 0 }}>⠿</span>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: PRI_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{section.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#1a1a1a', fontFamily: "'HubotSans',sans-serif" }}>{section.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888', fontFamily: "'HubotSans',sans-serif" }}>{section.description}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                      style={{ background: PRI_LIGHT, border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: PRI, fontSize: '13px', opacity: idx === 0 ? 0.4 : 1 }}>▲</button>
                    <button onClick={() => moveSection(idx, 1)} disabled={idx === layout.length - 1}
                      style={{ background: PRI_LIGHT, border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: idx === layout.length - 1 ? 'not-allowed' : 'pointer', color: PRI, fontSize: '13px', opacity: idx === layout.length - 1 ? 0.4 : 1 }}>▼</button>
                    <div onClick={() => toggleVisible(section.id)}
                      style={{ position: 'relative', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '12px', background: section.visible ? '#16a34a' : '#ccc', transition: 'background 0.2s' }} />
                      <div style={{ position: 'absolute', top: '4px', left: section.visible ? '23px' : '4px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: section.visible ? '#16a34a' : '#aaa', fontFamily: "'HubotSans',sans-serif", width: '42px' }}>
                      {section.visible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Btn onClick={saveLayout} disabled={saving}>{saving ? 'Saving…' : '💾 Save Layout'}</Btn>
            {saved && <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>✓ Layout saved! Refresh the site to see changes.</span>}
          </div>
        </div>
      )}

      {activeTab === 'hero' && (
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '6px', fontFamily: "'HubotSans',sans-serif" }}>Hero Banner Text Overlay</h3>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>
            These texts will appear overlaid on the hero slideshow. Leave blank to use the default image-baked text.
          </p>
          <Input label="Main Headline" value={heroData.headline} onChange={e => setHeroData(d => ({ ...d, headline: e.target.value }))} placeholder="e.g. Premium Print. Zero Stress." />
          <Input label="Sub-headline" value={heroData.subheadline} onChange={e => setHeroData(d => ({ ...d, subheadline: e.target.value }))} placeholder="e.g. Die-cut stickers, Flex printing, Corporate branding…" rows={2} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label="Button 1 Label" value={heroData.btn1} onChange={e => setHeroData(d => ({ ...d, btn1: e.target.value }))} placeholder="Print Sticker" />
            <Input label="Button 2 Label" value={heroData.btn2} onChange={e => setHeroData(d => ({ ...d, btn2: e.target.value }))} placeholder="Print Flex" />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
            <Btn onClick={saveHero} disabled={heroSaving}>{heroSaving ? 'Saving…' : '💾 Save Hero Text'}</Btn>
            {heroSaved && <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>✓ Saved! Refresh the site to see changes.</span>}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, counts, onLogout }) {
  const items = [
    { id: 'dashboard',      icon: '📊', label: 'Dashboard' },
    { id: 'page-editor',    icon: '🧩', label: 'Page Editor' },
    { id: 'image-manager',  icon: '🖼️', label: 'Image Manager' },
    { id: 'products',       icon: '🛍️', label: 'Products',  badge: counts.products },
    { id: 'sticker-prices', icon: '🏷️', label: 'Sticker Prices' },
    { id: 'blog',           icon: '✍️', label: 'Blog',       badge: counts.blogPosts || 0 },
    { id: 'about',          icon: '📖', label: 'About Us' },
    { id: 'content',        icon: '🎨', label: 'Content CMS' },
    { id: 'seo',            icon: '🔍', label: 'SEO Manager' },
    { id: 'settings',       icon: '⚙️', label: 'Site Settings' },
    { id: 'acceptances',    icon: '📋', label: 'T&C Acceptances', badge: counts.acceptances },
    { id: 'security',       icon: '🔑', label: 'Security' },
  ]
  return (
    <div style={{ width: SIDEBAR_W, minHeight: '100vh', background: PRI, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
        <img src={logo} alt="Sleekblue" style={{ height: '42px', borderRadius: '6px', background: '#fff', padding: '4px' }} />
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', margin: '8px 0 0', fontFamily: "'HubotSans',sans-serif", letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Panel</p>
      </div>
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {items.map(item => {
          const active = view === item.id
          return (
            <div key={item.id} onClick={() => setView(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 18px', cursor: 'pointer', background: active ? 'rgba(255,255,255,0.18)' : 'transparent', borderLeft: active ? '3px solid #fff' : '3px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => !active && (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
              onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: active ? 700 : 500, fontFamily: "'HubotSans',sans-serif", flex: 1 }}>{item.label}</span>
              {item.badge > 0 && <span style={{ background: ACC, color: '#fff', borderRadius: '10px', padding: '1px 8px', fontSize: '10px', fontWeight: 700 }}>{item.badge}</span>}
            </div>
          )
        })}
      </nav>
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <Btn variant="ghost" onClick={onLogout} style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
          🚪 Log Out
        </Btn>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardView({ siteData }) {
  const acceptances = siteData.acceptances || []
  const recent = [...acceptances].reverse().slice(0, 8)
  const publishedPosts = (siteData.blogPosts || []).filter(p => p.status === 'published').length
  const draftPosts = (siteData.blogPosts || []).filter(p => p.status === 'draft').length
  const stats = [
    { label: 'Total Products', value: ALL_PRODUCTS.length, icon: '🛍️', color: PRI },
    { label: 'T&C Acceptances', value: acceptances.length, icon: '📋', color: '#16a34a' },
    { label: 'Published Blog Posts', value: publishedPosts, icon: '✍️', color: '#2563eb' },
    { label: 'Draft Posts', value: draftPosts, icon: '📝', color: '#f59e0b' },
    { label: 'Products with Overrides', value: Object.keys(siteData.productOverrides || {}).length, icon: '✏️', color: ACC },
    { label: 'Hero Slides', value: (siteData.heroSlides || 0), icon: '🖼️', color: '#ec4899' },
  ]
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', marginBottom: '20px', fontFamily: "'HubotSans',sans-serif" }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {stats.map((s, i) => (
          <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: '28px', fontWeight: 800, color: s.color, margin: 0, fontFamily: "'HubotSans',sans-serif" }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: '#888', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>{s.label}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Recent T&amp;C Acceptances</h3>
        {recent.length === 0
          ? <p style={{ color: '#888', fontSize: '13px' }}>No acceptances yet.</p>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#f8f8f8' }}>
                    {['Name', 'Email', 'Phone', 'IP Address', 'Date & Time', 'ID'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#555', fontFamily: "'HubotSans',sans-serif", whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }}>{r.customerName}</td>
                      <td style={{ padding: '9px 12px', color: '#555' }}>{r.email}</td>
                      <td style={{ padding: '9px 12px', color: '#555' }}>{r.phone}</td>
                      <td style={{ padding: '9px 12px', color: '#888', fontFamily: 'monospace', fontSize: '11px' }}>{r.ipAddress}</td>
                      <td style={{ padding: '9px 12px', color: '#888', whiteSpace: 'nowrap' }}>{new Date(r.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '9px 12px' }}><Badge>{r.acceptanceId?.slice(0,16)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Card>
    </div>
  )
}

// ─── Product Editor ───────────────────────────────────────────────────────────
function ProductEditor({ token, slug, baseProduct, override, onSaved, onCancel }) {
  const baseDetails = getProductDetails(slug)
  const merged = { ...baseProduct, ...baseDetails, ...(override || {}) }

  const [name, setName]             = useState(merged.name || '')
  const [category, setCategory]     = useState(merged.category || '')
  const [badge, setBadge]           = useState(merged.badge || '')
  const [description, setDescription] = useState(merged.description || '')
  const [features, setFeatures]     = useState(merged.features ? [...merged.features] : [])
  const [priceTable, setPriceTable] = useState(merged.priceTable ? JSON.parse(JSON.stringify(merged.priceTable)) : [])
  const [sizes, setSizes]           = useState(merged.sizes ? [...merged.sizes] : [])
  const [useVariantPricing, setUseVariantPricing] = useState(!!merged.variantPrices)
  const [variantPrices, setVariantPrices] = useState(() => {
    if (merged.variantPrices) return JSON.parse(JSON.stringify(merged.variantPrices))
    const vp = {}
    ;(merged.sizes || []).filter(Boolean).forEach(s => { vp[s] = JSON.parse(JSON.stringify(merged.priceTable || [])) })
    return vp
  })
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  function updateFeature(i, val) { const f = [...features]; f[i] = val; setFeatures(f) }
  function removeFeature(i)      { setFeatures(features.filter((_, idx) => idx !== i)) }
  function addFeature()          { setFeatures([...features, '']) }

  function updateSize(i, val) { const s = [...sizes]; s[i] = val; setSizes(s) }
  function removeSize(i)      { setSizes(sizes.filter((_, idx) => idx !== i)) }
  function addSize()          { setSizes([...sizes, '']) }

  function updateRow(i, field, val) {
    const t = JSON.parse(JSON.stringify(priceTable))
    t[i][field] = field === 'qty' || field === 'unitPrice' ? (parseFloat(val) || 0) : val
    setPriceTable(t)
  }
  function removeRow(i) { setPriceTable(priceTable.filter((_, idx) => idx !== i)) }
  function addRow()     { setPriceTable([...priceTable, { qty: 100, unitPrice: 0 }]) }

  function updateVRow(size, i, field, val) {
    setVariantPrices(prev => ({ ...prev, [size]: prev[size].map((r, idx) => idx === i ? { ...r, [field]: parseFloat(val) || 0 } : r) }))
  }
  function removeVRow(size, i) {
    setVariantPrices(prev => ({ ...prev, [size]: prev[size].filter((_, idx) => idx !== i) }))
  }
  function addVRow(size) {
    setVariantPrices(prev => ({ ...prev, [size]: [...(prev[size] || []), { qty: 100, unitPrice: 0 }] }))
  }
  function syncVariantSizes(newSizes) {
    setVariantPrices(prev => {
      const vp = { ...prev }
      newSizes.filter(Boolean).forEach(s => { if (!vp[s]) vp[s] = JSON.parse(JSON.stringify(priceTable)) })
      return vp
    })
  }

  async function handleSave() {
    setSaving(true); setSaved(false)
    const payload = { name, category, badge, description, features, priceTable, sizes, variantPrices: useVariantPricing ? variantPrices : null }
    await fetch(`/api/admin/products/${slug}`, {
      method: 'PUT', headers: authH(token), body: JSON.stringify(payload),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    onSaved()
  }

  async function handleReset() {
    if (!confirm('Remove all overrides and restore original data for this product?')) return
    await fetch(`/api/admin/products/${slug}`, { method: 'DELETE', headers: authH(token) })
    onSaved(); onCancel()
  }

  const isDieCut = !!baseProduct.isDieCut

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#888' }}>←</button>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Edit: {baseProduct.name}</h2>
        {override && <Badge color="#16a34a">Has overrides</Badge>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Basic Information</h3>
          <Input label="Product Name" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Category" value={category} onChange={e => setCategory(e.target.value)} />
          <Input label="Badge Label (e.g. Best Seller)" value={badge} onChange={e => setBadge(e.target.value)} />
          <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
        </Card>

        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Features List</h3>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input value={f} onChange={e => updateFeature(i, e.target.value)}
                placeholder={`Feature ${i+1}`}
                style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
              <button onClick={() => removeFeature(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '0 12px', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
            </div>
          ))}
          <Btn variant="ghost" onClick={addFeature} style={{ marginTop: '4px' }}>+ Add Feature</Btn>
        </Card>

        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>
            Available Sizes / Types
          </h3>
          {sizes.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input value={s} onChange={e => updateSize(i, e.target.value)}
                placeholder={`Size/Type ${i+1}`}
                style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
              <button onClick={() => removeSize(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '0 12px', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
            </div>
          ))}
          <Btn variant="ghost" onClick={addSize} style={{ marginTop: '4px' }}>+ Add Size</Btn>
        </Card>

        {!isDieCut && (
          <Card>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '4px', fontFamily: "'HubotSans',sans-serif" }}>Price Table</h3>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Enter quantity and unit price per piece (in ₦)</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>Qty (pcs)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>Unit Price (₦/pc)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {priceTable.map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: '6px 10px' }}>
                        <input type="number" value={row.qty} onChange={e => updateRow(i, 'qty', e.target.value)}
                          style={{ width: '80px', padding: '6px 8px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input type="number" value={row.unitPrice} onChange={e => updateRow(i, 'unitPrice', e.target.value)}
                          style={{ width: '100px', padding: '6px 8px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '6px 10px', color: '#7B2FBE', fontWeight: 700 }}>{fmt(row.qty * row.unitPrice)}</td>
                      <td style={{ padding: '6px 10px' }}>
                        <button onClick={() => removeRow(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Btn variant="ghost" onClick={addRow} style={{ marginTop: '10px' }}>+ Add Row</Btn>
          </Card>
        )}
        {isDieCut && (
          <Card>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '8px', fontFamily: "'HubotSans',sans-serif" }}>Die-Cut Sticker Pricing</h3>
            <p style={{ fontSize: '12.5px', color: '#888', fontFamily: "'HubotSans',sans-serif" }}>
              Sticker prices are managed in the <strong style={{ color: PRI }}>Sticker Prices</strong> section. Click it in the sidebar to edit the full price matrix.
            </p>
          </Card>
        )}

        {!isDieCut && sizes.filter(Boolean).length > 1 && (
          <Card style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, margin: '0 0 3px', fontFamily: "'HubotSans',sans-serif" }}>Per-Variant Pricing</h3>
                <p style={{ fontSize: '12px', color: '#888', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Set a different price table for each size/type variant</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#333', fontFamily: "'HubotSans',sans-serif" }}
                onClick={() => { const v = !useVariantPricing; setUseVariantPricing(v); if (v) syncVariantSizes(sizes) }}>
                <div style={{ position: 'relative', width: '40px', height: '22px', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '11px', background: useVariantPricing ? '#16a34a' : '#ccc', transition: 'background 0.2s' }} />
                  <div style={{ position: 'absolute', top: '3px', left: useVariantPricing ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
                <span style={{ color: useVariantPricing ? '#16a34a' : '#aaa' }}>{useVariantPricing ? '✓ Enabled' : 'Disabled'}</span>
              </div>
            </div>
            {!useVariantPricing && (
              <p style={{ fontSize: '12.5px', color: '#aaa', fontFamily: "'HubotSans',sans-serif", margin: 0 }}>Currently using the shared Price Table above for all sizes. Toggle on to set individual prices per size.</p>
            )}
            {useVariantPricing && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '8px' }}>
                {sizes.filter(Boolean).map(size => (
                  <div key={size} style={{ border: `1.5px solid ${PRI}40`, borderRadius: '10px', padding: '14px', background: PRI_LIGHT + '40' }}>
                    <h4 style={{ color: PRI, margin: '0 0 10px', fontSize: '13px', fontWeight: 700, fontFamily: "'HubotSans',sans-serif" }}>📐 {size}</h4>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f0e8ff' }}>
                          <th style={{ padding: '5px 8px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif" }}>Qty</th>
                          <th style={{ padding: '5px 8px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif" }}>Unit ₦</th>
                          <th style={{ padding: '5px 8px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif" }}>Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(variantPrices[size] || []).map((row, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #e8dfff' }}>
                            <td style={{ padding: '4px 6px' }}>
                              <input type="number" value={row.qty} onChange={e => updateVRow(size, i, 'qty', e.target.value)}
                                style={{ width: '68px', padding: '4px 6px', border: '1.5px solid #ddd', borderRadius: '5px', fontSize: '12px', textAlign: 'center' }} />
                            </td>
                            <td style={{ padding: '4px 6px' }}>
                              <input type="number" value={row.unitPrice} onChange={e => updateVRow(size, i, 'unitPrice', e.target.value)}
                                style={{ width: '84px', padding: '4px 6px', border: '1.5px solid #ddd', borderRadius: '5px', fontSize: '12px', textAlign: 'center' }} />
                            </td>
                            <td style={{ padding: '4px 6px', color: PRI, fontWeight: 700, fontFamily: "'HubotSans',sans-serif", whiteSpace: 'nowrap' }}>{fmt(row.qty * row.unitPrice)}</td>
                            <td style={{ padding: '4px 6px' }}>
                              <button onClick={() => removeVRow(size, i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={() => addVRow(size)} style={{ marginTop: '8px', background: PRI_LIGHT, border: `1px solid ${PRI}40`, borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', color: PRI, fontSize: '12px', fontWeight: 600, fontFamily: "'HubotSans',sans-serif" }}>+ Add Row</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
        <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '💾 Save Changes'}</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        {override && <Btn variant="danger" onClick={handleReset} style={{ marginLeft: 'auto' }}>↺ Reset to Original</Btn>}
        {saved && <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>✓ Saved!</span>}
      </div>
    </div>
  )
}

// ─── Products List ────────────────────────────────────────────────────────────
function ProductsView({ token, productOverrides, onDataChanged }) {
  const [editingSlug, setEditingSlug] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = ALL_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  if (editingSlug) {
    const base = ALL_PRODUCTS.find(p => p.slug === editingSlug) || {}
    const details = base
    return (
      <ProductEditor
        token={token} slug={editingSlug}
        baseProduct={details}
        override={productOverrides[editingSlug]}
        onSaved={onDataChanged}
        onCancel={() => setEditingSlug(null)}
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Products</h2>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search products…"
          style={{ padding: '9px 14px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', width: '240px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              {['Product Name', 'Category', 'Base Price', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#555', fontFamily: "'HubotSans',sans-serif", whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const hasOverride = !!productOverrides[p.slug]
              const priceTbl = p.priceTable || []
              const basePrice = priceTbl.length > 0 ? `₦${(priceTbl[0].unitPrice).toLocaleString()}/pc` : (p.price ? `₦${Number(p.price).toLocaleString()}` : '—')
              return (
                <tr key={p.id} style={{ borderTop: '1px solid #f0f0f0' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '11px 16px', fontWeight: 600, color: '#1a1a1a' }}>{p.name}</td>
                  <td style={{ padding: '11px 16px', color: '#888' }}>{p.category}</td>
                  <td style={{ padding: '11px 16px', color: '#555' }}>{basePrice}</td>
                  <td style={{ padding: '11px 16px' }}>
                    {hasOverride ? <Badge color="#16a34a">Edited</Badge> : <Badge color="#888">Original</Badge>}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <Btn onClick={() => setEditingSlug(p.slug)} style={{ padding: '6px 14px', fontSize: '12px' }}>✏️ Edit</Btn>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── Sticker Prices ───────────────────────────────────────────────────────────
function StickerPricesView({ token, stickerPriceOverrides, onDataChanged }) {
  const base = STICKER_SIZE_PRICES
  const merged = { ...base, ...stickerPriceOverrides }
  const [prices, setPrices] = useState(JSON.parse(JSON.stringify(merged)))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newSize, setNewSize] = useState('')
  const [stickerImages, setStickerImages] = useState({})
  const [uploading, setUploading] = useState(null)
  const [showImages, setShowImages] = useState(false)

  useEffect(() => {
    fetch('/api/sticker-images').then(r => r.ok ? r.json() : {}).then(setStickerImages).catch(() => {})
  }, [])

  async function uploadStickerImg(size, file) {
    setUploading(size)
    const fd = new FormData(); fd.append('image', file); fd.append('size', size)
    const res = await fetch('/api/admin/upload/sticker-image', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    const json = await res.json()
    setUploading(null)
    if (json.url) setStickerImages(prev => ({ ...prev, [size]: [...(prev[size] || []), json.url] }))
  }

  async function deleteStickerImg(size, url) {
    if (!confirm('Remove this image?')) return
    await fetch('/api/admin/sticker-image', { method: 'DELETE', headers: authH(token), body: JSON.stringify({ size, url }) })
    setStickerImages(prev => ({ ...prev, [size]: (prev[size] || []).filter(u => u !== url) }))
  }

  function update(size, field, val) {
    setPrices(prev => ({ ...prev, [size]: { ...prev[size], [field]: parseFloat(val) || 0 } }))
  }

  function addSize() {
    if (!newSize.trim()) return
    setPrices(prev => ({ ...prev, [newSize.trim()]: { p100: 0, p500: 0, p1000: 0 } }))
    setNewSize('')
  }

  async function handleSave() {
    setSaving(true); setSaved(false)
    await fetch('/api/admin/sticker-prices', {
      method: 'PUT', headers: authH(token), body: JSON.stringify(prices),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    onDataChanged()
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', marginBottom: '6px', fontFamily: "'HubotSans',sans-serif" }}>Die-Cut Sticker Prices</h2>
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px', fontFamily: "'HubotSans',sans-serif" }}>
        Edit base prices for all sticker sizes. Bulk discounts (500+, 1000+) are applied automatically. You can also upload showcase images per size.
      </p>

      {/* Price table */}
      <Card style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>💰 Price Matrix</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>Size</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>100 pcs (₦ total)</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>500 pcs (₦ total)</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>1,000 pcs (₦ total)</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>Unit @ 100</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(prices).map(([size, p]) => {
                const isChanged = JSON.stringify(p) !== JSON.stringify(base[size] || {})
                return (
                  <tr key={size} style={{ borderTop: '1px solid #eee', background: isChanged ? '#f0fdf4' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1a1a1a' }}>{size}</td>
                    {['p100', 'p500', 'p1000'].map(field => (
                      <td key={field} style={{ padding: '8px 14px' }}>
                        <input type="number" value={p[field]} onChange={e => update(size, field, e.target.value)}
                          style={{ width: '110px', padding: '7px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', textAlign: 'center', fontFamily: "'HubotSans',sans-serif" }} />
                      </td>
                    ))}
                    <td style={{ padding: '10px 14px', color: PRI, fontWeight: 700 }}>₦{(p.p100 / 100).toLocaleString()}/pc</td>
                    <td style={{ padding: '10px 14px' }}>{isChanged ? <Badge color="#16a34a">Modified</Badge> : <span style={{ color: '#ccc', fontSize: '11px' }}>—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
          <input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder='Add new size (e.g. 5x5")'
            style={{ padding: '8px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
          <Btn variant="ghost" onClick={addSize}>+ Add Size</Btn>
        </div>
        <SaveBar onSave={handleSave} saving={saving} saved={saved} />
      </Card>

      {/* Sticker size image gallery */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, margin: '0 0 3px', fontFamily: "'HubotSans',sans-serif" }}>🖼️ Sticker Showcase Images</h3>
            <p style={{ fontSize: '12px', color: '#888', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Upload photos per sticker size — shown on the product page when customers pick that size</p>
          </div>
          <button onClick={() => setShowImages(!showImages)}
            style={{ background: PRI_LIGHT, border: `1px solid ${PRI}40`, color: PRI, borderRadius: '8px', padding: '7px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'HubotSans',sans-serif" }}>
            {showImages ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>

        {showImages && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {Object.keys(prices).map(size => {
              const imgs = stickerImages[size] || []
              return (
                <div key={size} style={{ border: `1.5px solid ${PRI}30`, borderRadius: '10px', padding: '14px', background: '#faf5ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: PRI, margin: 0, fontFamily: "'HubotSans',sans-serif" }}>📐 {size}</h4>
                    <Badge color={imgs.length > 0 ? '#16a34a' : '#888'}>{imgs.length} photo{imgs.length !== 1 ? 's' : ''}</Badge>
                  </div>
                  {/* Uploaded images */}
                  {imgs.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {imgs.map((url, i) => (
                        <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1.5px solid #ddd' }}>
                          <img src={url} alt={`${size} sticker`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={() => deleteStickerImg(size, url)}
                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label style={{ cursor: 'pointer', display: 'block' }}>
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                      onChange={e => { Array.from(e.target.files).forEach(f => uploadStickerImg(size, f)) }} />
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: uploading === size ? '#aaa' : '#fff', border: `1.5px dashed ${uploading === size ? '#aaa' : PRI}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: uploading === size ? '#fff' : PRI, fontFamily: "'HubotSans',sans-serif" }}>
                      {uploading === size ? '⏳ Uploading…' : '⬆ Upload Images'}
                    </span>
                  </label>
                  <p style={{ fontSize: '11px', color: '#aaa', margin: '6px 0 0', textAlign: 'center', fontFamily: "'HubotSans',sans-serif" }}>
                    {imgs.length === 0 ? 'Using built-in photo' : 'Custom photos active ✓'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Site Settings ────────────────────────────────────────────────────────────
function SettingsView({ token, settings, onDataChanged }) {
  const [form, setForm] = useState({
    phone: '', whatsapp: '', primaryColor: '#7B2FBE', accentColor: '#FF6B00',
    heroTitle: '', heroSubtitle: '', companyName: '', email: '', address: '',
    ...settings,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setForm(prev => ({ ...prev, ...settings })) }, [settings])

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

  async function handleSave() {
    setSaving(true); setSaved(false)
    await fetch('/api/admin/settings', {
      method: 'PUT', headers: authH(token), body: JSON.stringify(form),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    onDataChanged()
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', marginBottom: '20px', fontFamily: "'HubotSans',sans-serif" }}>Site Settings</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Contact Information</h3>
          <Input label="Company Name" value={form.companyName} onChange={e => set('companyName', e.target.value)} />
          <Input label="Phone Number" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+2348065275264" />
          <Input label="WhatsApp Number (digits only)" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="2348065275264" />
          <Input label="Email Address" value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@sleekbluemediahouz.com" />
          <Input label="Address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Lagos, Nigeria" />
        </Card>

        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Homepage Content</h3>
          <Input label="Hero Title" value={form.heroTitle} onChange={e => set('heroTitle', e.target.value)} placeholder="Premium Print, Branding & Design" />
          <Input label="Hero Subtitle" value={form.heroSubtitle} onChange={e => set('heroSubtitle', e.target.value)} placeholder="Zero Stress. Fast Turnaround." />
        </Card>

        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Brand Colours</h3>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px', fontFamily: "'HubotSans',sans-serif", lineHeight: 1.5 }}>
            Choose your brand colours. Changes are saved and applied to new content. Contact your developer to apply site-wide.
          </p>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '8px', fontFamily: "'HubotSans',sans-serif" }}>Primary Colour</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                  style={{ width: '50px', height: '42px', border: '1.5px solid #ddd', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                <input value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                  style={{ width: '100px', padding: '9px 10px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace' }} />
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: form.primaryColor, border: '1px solid #eee' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '8px', fontFamily: "'HubotSans',sans-serif" }}>Accent Colour</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="color" value={form.accentColor} onChange={e => set('accentColor', e.target.value)}
                  style={{ width: '50px', height: '42px', border: '1.5px solid #ddd', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                <input value={form.accentColor} onChange={e => set('accentColor', e.target.value)}
                  style={{ width: '100px', padding: '9px 10px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace' }} />
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: form.accentColor, border: '1px solid #eee' }} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '8px', fontFamily: "'HubotSans',sans-serif" }}>Current Settings Preview</h3>
          <div style={{ background: '#f8f8f8', borderRadius: '8px', padding: '14px', fontSize: '12.5px', color: '#555', fontFamily: "'HubotSans',sans-serif", lineHeight: 1.7 }}>
            <div><strong>Phone:</strong> {form.phone || '—'}</div>
            <div><strong>WhatsApp:</strong> {form.whatsapp ? `https://wa.me/${form.whatsapp}` : '—'}</div>
            <div><strong>Email:</strong> {form.email || '—'}</div>
            <div><strong>Hero:</strong> {form.heroTitle}</div>
            <div><strong>Subtitle:</strong> {form.heroSubtitle}</div>
          </div>
        </Card>
      </div>
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  )
}

// ─── Acceptances ──────────────────────────────────────────────────────────────
function AcceptancesView({ acceptances }) {
  const [search, setSearch] = useState('')
  const filtered = acceptances.filter(r =>
    (r.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.phone || '').includes(search)
  )
  const sorted = [...filtered].reverse()

  function exportCSV() {
    const headers = ['Acceptance ID', 'Date & Time', 'Name', 'Email', 'Phone', 'IP Address', 'Terms Version']
    const rows = acceptances.map(r => [
      r.acceptanceId, r.timestamp, r.customerName, r.email, r.phone, r.ipAddress, r.termsVersion,
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'terms-acceptances.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px', fontFamily: "'HubotSans',sans-serif" }}>T&amp;C Acceptances</h2>
          <p style={{ color: '#888', fontSize: '13px', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>{acceptances.length} total records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name, email, phone…"
            style={{ padding: '9px 14px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', width: '260px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
          <Btn variant="success" onClick={exportCSV}>⬇ Export CSV</Btn>
        </div>
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {sorted.length === 0
          ? <p style={{ padding: '24px', color: '#888', textAlign: 'center', fontFamily: "'HubotSans',sans-serif" }}>No records found.</p>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#f8f8f8' }}>
                    {['#', 'Name', 'Email', 'Phone', 'IP Address', 'Date & Time', 'Version', 'Acceptance ID'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#555', fontFamily: "'HubotSans',sans-serif", whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 14px', color: '#bbb', fontWeight: 700 }}>{acceptances.length - i}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{r.customerName}</td>
                      <td style={{ padding: '10px 14px', color: '#555' }}>{r.email}</td>
                      <td style={{ padding: '10px 14px', color: '#555' }}>{r.phone}</td>
                      <td style={{ padding: '10px 14px', color: '#888', fontFamily: 'monospace', fontSize: '11px' }}>{r.ipAddress}</td>
                      <td style={{ padding: '10px 14px', color: '#888', whiteSpace: 'nowrap' }}>{new Date(r.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '10px 14px' }}><Badge>{r.termsVersion}</Badge></td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '10px', color: '#aaa' }}>{r.acceptanceId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Card>
    </div>
  )
}

// ─── Security ─────────────────────────────────────────────────────────────────
function SecurityView({ token }) {
  const [current, setCurrent]   = useState('')
  const [next, setNext]         = useState('')
  const [confirm, setConfirm]   = useState('')
  const [msg, setMsg]           = useState(null)
  const [saving, setSaving]     = useState(false)

  async function handleChange() {
    setMsg(null)
    if (next !== confirm) { setMsg({ type: 'error', text: 'New passwords do not match.' }); return }
    if (next.length < 6)  { setMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return }
    setSaving(true)
    const res = await fetch('/api/admin/password', {
      method: 'PUT', headers: authH(token), body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setMsg({ type: 'error', text: data.error || 'Failed.' }); return }
    setMsg({ type: 'success', text: 'Password changed successfully!' })
    setCurrent(''); setNext(''); setConfirm('')
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', marginBottom: '20px', fontFamily: "'HubotSans',sans-serif" }}>Security</h2>
      <div style={{ maxWidth: '440px' }}>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Change Admin Password</h3>
          <Input label="Current Password" type="password" value={current} onChange={e => setCurrent(e.target.value)} />
          <Input label="New Password" type="password" value={next} onChange={e => setNext(e.target.value)} />
          <Input label="Confirm New Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          {msg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', background: msg.type === 'error' ? '#fee2e2' : '#dcfce7', color: msg.type === 'error' ? '#dc2626' : '#16a34a', fontSize: '13px', fontFamily: "'HubotSans',sans-serif" }}>
              {msg.text}
            </div>
          )}
          <Btn onClick={handleChange} disabled={saving}>{saving ? 'Changing…' : '🔑 Change Password'}</Btn>
        </Card>
        <Card style={{ marginTop: '16px', background: '#fffbeb', border: '1px solid #fde68a' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', marginBottom: '8px', fontFamily: "'HubotSans',sans-serif" }}>⚠️ Security Reminder</h4>
          <p style={{ fontSize: '12.5px', color: '#78350f', lineHeight: 1.6, margin: 0, fontFamily: "'HubotSans',sans-serif" }}>
            Keep your admin password secure. Do not share it with anyone. The admin panel gives full access to all site data and settings.
          </p>
        </Card>
      </div>
    </div>
  )
}

// ─── Content CMS ──────────────────────────────────────────────────────────────
function TrustBarEditor({ token, data, onDataChanged }) {
  const def = { rating: '5.0/5', reviewCount: '500+', tagline: 'TRUSTED BY GLOBAL BRANDS', partners: [
    { key: 'UBA', name: 'UBA', visible: true }, { key: 'MTN', name: 'MTN', visible: true },
    { key: 'HERO', name: 'HERO', visible: true }, { key: 'IMO_DIGITAL', name: 'Imo Digital City Limited', visible: true },
    { key: 'NNPC', name: 'NNPC', visible: true }, { key: 'SEPLAT', name: 'Seplat Energy', visible: true },
  ]}
  const [d, setD] = useState({ ...def, ...(data || {}), partners: (data?.partners || def.partners) })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(null)
  const [newBrandName, setNewBrandName] = useState('')

  function togglePartner(i) { const p = [...d.partners]; p[i] = { ...p[i], visible: !p[i].visible }; setD({ ...d, partners: p }) }
  function updatePartnerName(i, v) { const p = [...d.partners]; p[i] = { ...p[i], name: v }; setD({ ...d, partners: p }) }
  function movePartner(i, dir) { const p = [...d.partners], j = i + dir; if (j < 0 || j >= p.length) return;[p[i], p[j]] = [p[j], p[i]]; setD({ ...d, partners: p }) }
  function removePartner(i) { if (!confirm('Remove this brand logo?')) return; setD({ ...d, partners: d.partners.filter((_, idx) => idx !== i) }) }

  async function uploadLogo(i, file) {
    setUploading(i)
    const fd = new FormData(); fd.append('image', file)
    const res = await fetch('/api/admin/upload/brand-logo', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    const json = await res.json()
    setUploading(null)
    if (json.url) {
      const p = [...d.partners]; p[i] = { ...p[i], url: json.url }; setD({ ...d, partners: p })
    }
  }

  async function addNewBrand(file) {
    if (!newBrandName.trim()) { alert('Enter a brand name first.'); return }
    setUploading('new')
    const fd = new FormData(); fd.append('image', file)
    const res = await fetch('/api/admin/upload/brand-logo', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    const json = await res.json()
    setUploading(null)
    if (json.url) {
      const key = 'CUSTOM_' + Date.now()
      setD({ ...d, partners: [...d.partners, { key, name: newBrandName.trim(), url: json.url, visible: true }] })
      setNewBrandName('')
    }
  }

  async function save() {
    setSaving(true)
    await fetch('/api/admin/content', { method: 'PUT', headers: authH(token), body: JSON.stringify({ trustBar: d }) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000); onDataChanged()
  }

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Trust Bar Text</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '14px' }}>
          <Input label="Star Rating Text" value={d.rating} onChange={e => setD({ ...d, rating: e.target.value })} placeholder="5.0/5" />
          <Input label="Review Count" value={d.reviewCount} onChange={e => setD({ ...d, reviewCount: e.target.value })} placeholder="500+" />
          <Input label="Tagline (ALL CAPS recommended)" value={d.tagline} onChange={e => setD({ ...d, tagline: e.target.value })} placeholder="TRUSTED BY GLOBAL BRANDS" />
        </div>
      </Card>
      <Card style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '4px', fontFamily: "'HubotSans',sans-serif" }}>Partner Logos</h3>
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Upload your own logo images, toggle visibility, edit names, and reorder. Pre-loaded logos shown by default.</p>
        {d.partners.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '10px 12px', background: p.visible !== false ? '#f0fdf4' : '#f9f9f9', borderRadius: '8px', border: `1px solid ${p.visible !== false ? '#bbf7d0' : '#eee'}`, flexWrap: 'wrap' }}>
            {/* Logo preview */}
            {p.url ? (
              <img src={p.url} alt={p.name} style={{ width: '48px', height: '32px', objectFit: 'contain', borderRadius: '4px', background: '#fff', border: '1px solid #eee', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '48px', height: '32px', background: '#e9e9e9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#aaa', flexShrink: 0, fontFamily: "'HubotSans',sans-serif" }}>LOGO</div>
            )}
            {/* Upload button */}
            <label style={{ cursor: 'pointer', flexShrink: 0 }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadLogo(i, e.target.files[0])} />
              <span style={{ display: 'inline-block', background: uploading === i ? '#aaa' : PRI_LIGHT, color: PRI, border: `1px solid ${PRI}40`, borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, fontFamily: "'HubotSans',sans-serif", whiteSpace: 'nowrap' }}>
                {uploading === i ? '⏳' : '⬆ Upload'}
              </span>
            </label>
            <button onClick={() => togglePartner(i)} style={{ background: p.visible !== false ? '#16a34a' : '#ddd', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', fontFamily: "'HubotSans',sans-serif", minWidth: '76px' }}>
              {p.visible !== false ? '✓ Visible' : '✗ Hidden'}
            </button>
            <input value={p.name} onChange={e => updatePartnerName(i, e.target.value)}
              style={{ flex: 1, minWidth: '80px', padding: '7px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
            <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
              <button onClick={() => movePartner(i, -1)} disabled={i === 0} style={{ background: PRI_LIGHT, border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '11px', color: PRI }}>▲</button>
              <button onClick={() => movePartner(i, 1)} disabled={i === d.partners.length - 1} style={{ background: PRI_LIGHT, border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '11px', color: PRI }}>▼</button>
              <button onClick={() => removePartner(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '12px' }}>×</button>
            </div>
          </div>
        ))}
        {/* Add New Brand */}
        <div style={{ marginTop: '16px', padding: '14px', background: '#fafafa', borderRadius: '8px', border: '1.5px dashed #ddd' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#555', margin: '0 0 10px', fontFamily: "'HubotSans',sans-serif" }}>+ Add New Brand Logo</p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="Brand name (e.g. Dangote Group)"
              style={{ flex: 1, minWidth: '160px', padding: '8px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
            <label style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && addNewBrand(e.target.files[0])} />
              <span style={{ display: 'inline-block', background: uploading === 'new' ? '#aaa' : ACC, color: '#fff', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, fontFamily: "'HubotSans',sans-serif", cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {uploading === 'new' ? 'Uploading…' : '⬆ Upload Logo & Add'}
              </span>
            </label>
          </div>
          <p style={{ fontSize: '11px', color: '#aaa', margin: '8px 0 0', fontFamily: "'HubotSans',sans-serif" }}>Enter brand name above, then click to select logo image (PNG, JPG, max 10MB). Click 🚀 Publish to go live.</p>
        </div>
      </Card>
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  )
}

function BestSellingEditor({ token, data, onDataChanged }) {
  const [heading, setHeading] = useState(data?.bestSelling_heading || 'BEST SELLING')
  const [subheading, setSubheading] = useState(data?.bestSelling_subheading || 'our most popular and trusted products')
  const [items, setItems] = useState(data?.bestSelling || [])
  const [newSlug, setNewSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggleItem(i) { const a = [...items]; a[i] = { ...a[i], visible: a[i].visible === false ? true : false }; setItems(a) }
  function updateItem(i, f, v) { const a = [...items]; a[i] = { ...a[i], [f]: v }; setItems(a) }
  function removeItem(i) { if (confirm('Remove this item from Best Selling?')) setItems(items.filter((_, idx) => idx !== i)) }
  function moveItem(i, dir) { const a = [...items], j = i + dir; if (j < 0 || j >= a.length) return;[a[i], a[j]] = [a[j], a[i]]; setItems(a) }
  function addItem() {
    const p = ALL_PRODUCTS.find(pr => pr.slug === newSlug.trim() || pr.name.toLowerCase() === newSlug.trim().toLowerCase())
    if (!p) return alert('Product not found. Enter a valid product slug or name.')
    if (items.find(it => it.slug === p.slug)) return alert('Already in list.')
    setItems([...items, { id: p.id, name: p.name, slug: p.slug, price: `From ₦${(p.priceTable?.[0]?.unitPrice * (p.priceTable?.[0]?.qty || 1) || p.price || 0).toLocaleString()}`, unit: 'per piece', visible: true }])
    setNewSlug('')
  }

  async function save() {
    setSaving(true)
    await fetch('/api/admin/content', { method: 'PUT', headers: authH(token), body: JSON.stringify({ bestSelling: items, bestSelling_heading: heading, bestSelling_subheading: subheading }) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000); onDataChanged()
  }

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Section Heading</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
          <Input label="Heading" value={heading} onChange={e => setHeading(e.target.value)} placeholder="BEST SELLING" />
          <Input label="Sub-heading" value={subheading} onChange={e => setSubheading(e.target.value)} placeholder="our most popular and trusted products" />
        </div>
      </Card>
      <Card style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '6px', fontFamily: "'HubotSans',sans-serif" }}>Featured Products</h3>
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Reorder, toggle visibility, or edit the displayed price text for each product.</p>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', padding: '10px 12px', background: item.visible !== false ? '#fff' : '#f9f9f9', borderRadius: '8px', border: `1px solid ${item.visible !== false ? '#e0d6f5' : '#eee'}`, flexWrap: 'wrap' }}>
            <button onClick={() => toggleItem(i)} style={{ background: item.visible !== false ? PRI : '#ddd', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontWeight: 700, fontSize: '11px', minWidth: '76px', fontFamily: "'HubotSans',sans-serif" }}>
              {item.visible !== false ? '✓ Show' : '✗ Hide'}
            </button>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', fontFamily: "'HubotSans',sans-serif", flex: 1, minWidth: '100px' }}>{item.name}</span>
            <input value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} placeholder="From ₦22,500"
              style={{ width: '130px', padding: '6px 8px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '12px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
            <input value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} placeholder="per 500pcs"
              style={{ width: '110px', padding: '6px 8px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '12px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => moveItem(i, -1)} disabled={i === 0} style={{ background: PRI_LIGHT, border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', color: PRI, fontSize: '11px' }}>▲</button>
              <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} style={{ background: PRI_LIGHT, border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', color: PRI, fontSize: '11px' }}>▼</button>
              <button onClick={() => removeItem(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '12px' }}>×</button>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="Type product slug or name to add…"
            style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }}
            onKeyDown={e => e.key === 'Enter' && addItem()} />
          <Btn variant="ghost" onClick={addItem}>+ Add Product</Btn>
        </div>
      </Card>
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  )
}

function TestimonialsEditor({ token, data, onDataChanged }) {
  const [heading, setHeading] = useState(data?.heading || 'Customers love Sleekblue')
  const [rating, setRating] = useState(data?.rating || '5.0/5')
  const [reviewCount, setReviewCount] = useState(data?.reviewCount || '500+')
  const [testimonials, setTestimonials] = useState(data?.testimonials || [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name: '', location: '', rating: 5, text: '', visible: true })
  const [adding, setAdding] = useState(false)

  function updateT(i, f, v) { const a = [...testimonials]; a[i] = { ...a[i], [f]: v }; setTestimonials(a) }
  function removeT(i) { if (confirm('Remove this testimonial?')) setTestimonials(testimonials.filter((_, idx) => idx !== i)) }
  function moveT(i, dir) { const a = [...testimonials], j = i + dir; if (j < 0 || j >= a.length) return;[a[i], a[j]] = [a[j], a[i]]; setTestimonials(a) }
  function toggleT(i) { const a = [...testimonials]; a[i] = { ...a[i], visible: a[i].visible !== false ? false : true }; setTestimonials(a) }
  function addT() {
    if (!form.name.trim() || !form.text.trim()) return alert('Name and review text are required.')
    setTestimonials([...testimonials, { ...form }])
    setForm({ name: '', location: '', rating: 5, text: '', visible: true }); setAdding(false)
  }

  async function save() {
    setSaving(true)
    await fetch('/api/admin/content', { method: 'PUT', headers: authH(token), body: JSON.stringify({ reviews: { heading, rating, reviewCount, testimonials } }) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000); onDataChanged()
  }

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Section Heading</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', gap: '14px' }}>
          <Input label="Section Heading" value={heading} onChange={e => setHeading(e.target.value)} placeholder="Customers love Sleekblue" />
          <Input label="Rating Text" value={rating} onChange={e => setRating(e.target.value)} placeholder="5.0/5" />
          <Input label="Review Count" value={reviewCount} onChange={e => setReviewCount(e.target.value)} placeholder="500+" />
        </div>
      </Card>
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Testimonials ({testimonials.length})</h3>
          <Btn onClick={() => setAdding(!adding)} variant={adding ? 'ghost' : 'primary'} style={{ padding: '7px 14px', fontSize: '12px' }}>{adding ? 'Cancel' : '+ Add Testimonial'}</Btn>
        </div>
        {adding && (
          <div style={{ background: PRI_LIGHT, borderRadius: '10px', padding: '16px', marginBottom: '16px', border: `1.5px solid ${PRI}30` }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: PRI, marginBottom: '12px', fontFamily: "'HubotSans',sans-serif" }}>New Testimonial</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input label="Customer Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emeka Okafor" />
              <Input label="Location (optional)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Lagos, Nigeria" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '5px', fontFamily: "'HubotSans',sans-serif" }}>Star Rating</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setForm({ ...form, rating: s })}
                    style={{ background: s <= form.rating ? '#F5A623' : '#eee', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>★</button>
                ))}
                <span style={{ alignSelf: 'center', fontSize: '12px', color: '#888', fontFamily: "'HubotSans',sans-serif" }}>{form.rating} stars</span>
              </div>
            </div>
            <Input label="Review Text *" value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="What did the customer say?" rows={3} />
            <Btn onClick={addT} style={{ marginTop: '4px' }}>+ Add This Testimonial</Btn>
          </div>
        )}
        {testimonials.length === 0 && !adding && (
          <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '20px', fontFamily: "'HubotSans',sans-serif" }}>No testimonials yet. Click "+ Add Testimonial" to create your first one.</p>
        )}
        {testimonials.map((t, i) => (
          <div key={i} style={{ padding: '12px 14px', background: t.visible !== false ? '#fff' : '#f9f9f9', borderRadius: '8px', border: `1px solid ${t.visible !== false ? '#e0d6f5' : '#eee'}`, marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input value={t.name} onChange={e => updateT(i, 'name', e.target.value)}
                    style={{ padding: '5px 8px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', fontWeight: 700, fontFamily: "'HubotSans',sans-serif", outline: 'none', width: '160px' }} />
                  <input value={t.location || ''} onChange={e => updateT(i, 'location', e.target.value)} placeholder="Location"
                    style={{ padding: '5px 8px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '12px', fontFamily: "'HubotSans',sans-serif", outline: 'none', width: '140px', color: '#888' }} />
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => updateT(i, 'rating', s)}
                        style={{ background: s <= (t.rating||5) ? '#F5A623' : '#eee', border: 'none', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', fontSize: '12px' }}>★</button>
                    ))}
                  </div>
                </div>
                <textarea value={t.text} onChange={e => updateT(i, 'text', e.target.value)} rows={2}
                  style={{ width: '100%', padding: '6px 8px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '12.5px', fontFamily: "'HubotSans',sans-serif", outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: '#333' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                <button onClick={() => toggleT(i)} style={{ background: t.visible !== false ? '#dcfce7' : '#f9f9f9', border: 'none', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: t.visible !== false ? '#16a34a' : '#999', fontFamily: "'HubotSans',sans-serif", whiteSpace: 'nowrap' }}>{t.visible !== false ? '✓ Visible' : '✗ Hidden'}</button>
                <button onClick={() => moveT(i, -1)} disabled={i === 0} style={{ background: PRI_LIGHT, border: 'none', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', color: PRI, fontSize: '11px' }}>▲</button>
                <button onClick={() => moveT(i, 1)} disabled={i === testimonials.length - 1} style={{ background: PRI_LIGHT, border: 'none', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', color: PRI, fontSize: '11px' }}>▼</button>
                <button onClick={() => removeT(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '12px' }}>×</button>
              </div>
            </div>
          </div>
        ))}
      </Card>
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  )
}

function FooterEditor({ token, data, onDataChanged }) {
  const [tagline, setTagline] = useState(data?.tagline || 'Premium print, branding & design solutions for businesses across Nigeria. Fast turnaround, zero stress.')
  const [services, setServices] = useState(data?.services || ['Die Cut Stickers', 'Flex Banners', 'Business Cards', 'Vehicle Branding', 'Logo & Branding', 'T-Shirts & Caps', 'Rollup Stands', 'Burial Brochures'])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function updateService(i, v) { const s = [...services]; s[i] = v; setServices(s) }
  function removeService(i) { setServices(services.filter((_, idx) => idx !== i)) }
  function moveService(i, dir) { const s = [...services], j = i + dir; if (j < 0 || j >= s.length) return;[s[i], s[j]] = [s[j], s[i]]; setServices(s) }

  async function save() {
    setSaving(true)
    await fetch('/api/admin/content', { method: 'PUT', headers: authH(token), body: JSON.stringify({ footer: { tagline, services } }) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000); onDataChanged()
  }

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Footer Tagline</h3>
        <Input label="Tagline Text" value={tagline} onChange={e => setTagline(e.target.value)} rows={3} placeholder="Premium print, branding & design solutions…" />
      </Card>
      <Card style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '6px', fontFamily: "'HubotSans',sans-serif" }}>Services List</h3>
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>These appear in the "Services" column in the footer. Reorder or edit as needed.</p>
        {services.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <input value={s} onChange={e => updateService(i, e.target.value)}
              style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
            <button onClick={() => moveService(i, -1)} disabled={i === 0} style={{ background: PRI_LIGHT, border: 'none', borderRadius: '4px', padding: '4px 9px', cursor: 'pointer', color: PRI, fontSize: '11px' }}>▲</button>
            <button onClick={() => moveService(i, 1)} disabled={i === services.length - 1} style={{ background: PRI_LIGHT, border: 'none', borderRadius: '4px', padding: '4px 9px', cursor: 'pointer', color: PRI, fontSize: '11px' }}>▼</button>
            <button onClick={() => removeService(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '5px', padding: '4px 9px', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
          </div>
        ))}
        <Btn variant="ghost" onClick={() => setServices([...services, ''])} style={{ marginTop: '6px' }}>+ Add Service</Btn>
      </Card>
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  )
}

function ContactInfoEditor({ token, settings, onDataChanged }) {
  const [form, setForm] = useState({
    phone: '', whatsapp: '', email: '', address: '', companyName: '',
    ...(settings || {}),
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setForm(prev => ({ ...prev, ...(settings || {}) })) }, [settings])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/settings', { method: 'PUT', headers: authH(token), body: JSON.stringify(form) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000); onDataChanged()
  }

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Contact Information</h3>
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px', fontFamily: "'HubotSans',sans-serif", lineHeight: 1.5 }}>
          These details appear in the footer, WhatsApp links, and contact sections across the entire website. Click 🚀 Publish to push changes live.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="Company Name" value={form.companyName || ''} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="Sleekblue Media Houz" />
          <Input label="Phone Number (with country code)" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+234 806 527 5264" />
          <Input label="WhatsApp Number (digits only, no +)" value={form.whatsapp || ''} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="2348065275264" />
          <Input label="Email Address" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="info@sleekbluemediahouz.com" />
          <Input label="Address / Location" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Lagos, Nigeria" />
        </div>
        <div style={{ marginTop: '16px', background: '#f8f8f8', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', color: '#555', fontFamily: "'HubotSans',sans-serif", lineHeight: 1.7 }}>
          <strong>Live preview:</strong><br/>
          📞 {form.phone || '(not set)'} &nbsp;|&nbsp; 💬 wa.me/{form.whatsapp || '(not set)'} &nbsp;|&nbsp; 📍 {form.address || '(not set)'}
          {form.email && <> &nbsp;|&nbsp; ✉️ {form.email}</>}
        </div>
      </Card>
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  )
}

function ContentView({ token, content, settings, onDataChanged }) {
  const [tab, setTab] = useState('contact')
  const tabs = [
    { id: 'contact', label: '📞 Contact Info' },
    { id: 'trustBar', label: '⭐ Trust Bar' },
    { id: 'bestSelling', label: '🛍️ Best Selling' },
    { id: 'testimonials', label: '💬 Testimonials' },
    { id: 'footer', label: '🔻 Footer' },
  ]
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px', fontFamily: "'HubotSans',sans-serif" }}>Content Management</h2>
        <p style={{ color: '#888', fontSize: '13px', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Edit every text section and content block visible on the website. Click 🚀 Publish to push any section live.</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab === t.id ? PRI : '#fff', color: tab === t.id ? '#fff' : '#555', fontWeight: tab === t.id ? 700 : 500, fontSize: '13px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', fontFamily: "'HubotSans',sans-serif", transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'contact'     && <ContactInfoEditor  token={token} settings={settings}        onDataChanged={onDataChanged} />}
      {tab === 'trustBar'    && <TrustBarEditor    token={token} data={content.trustBar}   onDataChanged={onDataChanged} />}
      {tab === 'bestSelling' && <BestSellingEditor  token={token} data={content}             onDataChanged={onDataChanged} />}
      {tab === 'testimonials'&& <TestimonialsEditor token={token} data={content.reviews}    onDataChanged={onDataChanged} />}
      {tab === 'footer'      && <FooterEditor       token={token} data={content.footer}     onDataChanged={onDataChanged} />}
    </div>
  )
}

// ─── Blog CMS ─────────────────────────────────────────────────────────────────
function BlogPostEditor({ token, post, onSaved, onCancel }) {
  const isNew = !post?.id
  const [form, setForm] = useState({
    title: '', slug: '', status: 'draft', category: '', date: new Date().toISOString().split('T')[0],
    excerpt: '', content: '', coverImage: '', tags: '', videoUrl: '', audioUrl: '', mediaFiles: [],
    ...(post || {}),
    tags: Array.isArray(post?.tags) ? post.tags.join(', ') : (post?.tags || ''),
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState(null)

  function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function uploadMedia(file, field) {
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/admin/upload/blog', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    const json = await res.json()
    setUploading(false)
    if (!json.url) return
    if (field === 'coverImage') set('coverImage', json.url)
    else if (field === 'audioUrl') set('audioUrl', json.url)
    else set('mediaFiles', [...(form.mediaFiles || []), json.url])
  }

  async function handleSave(statusOverride) {
    setSaving(true); setMsg(null)
    const payload = {
      ...form,
      status: statusOverride || form.status,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      slug: form.slug || slugify(form.title),
    }
    const url = isNew ? '/api/admin/blog' : `/api/admin/blog/${post.id}`
    const method = isNew ? 'POST' : 'PUT'
    const res = await fetch(url, { method, headers: authH(token), body: JSON.stringify(payload) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setMsg({ type: 'error', text: data.error || 'Failed to save.' }); return }
    setMsg({ type: 'success', text: statusOverride === 'published' ? '✓ Post published!' : '✓ Saved as draft.' })
    setTimeout(() => { onSaved(); }, 1200)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <Btn variant="ghost" onClick={onCancel} style={{ padding: '7px 14px' }}>← Back</Btn>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>
          {isNew ? '✍️ New Blog Post' : '✏️ Edit Post'}
        </h2>
        {!isNew && <Badge color={form.status === 'published' ? '#16a34a' : '#f59e0b'}>{form.status === 'published' ? 'Published' : 'Draft'}</Badge>}
      </div>
      {msg && <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', background: msg.type === 'error' ? '#fee2e2' : '#dcfce7', color: msg.type === 'error' ? '#dc2626' : '#16a34a', fontSize: '13px', fontFamily: "'HubotSans',sans-serif" }}>{msg.text}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Card>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: PRI, marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Post Details</h3>
            <Input label="Post Title *" value={form.title} onChange={e => { set('title', e.target.value); if (!post?.slug) set('slug', slugify(e.target.value)) }} placeholder="Enter a compelling title…" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Input label="URL Slug" value={form.slug} onChange={e => set('slug', slugify(e.target.value))} placeholder="url-friendly-slug" />
              <Input label="Category" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Branding Tips" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              <Input label="Tags (comma separated)" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="stickers, branding, tips" />
            </div>
            <Input label="Excerpt / Summary" value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} placeholder="A short summary that appears on the blog list page…" />
          </Card>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <Card>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: PRI, marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Content</h3>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '10px', fontFamily: "'HubotSans',sans-serif" }}>Write your full blog post content below. Use double line breaks for new paragraphs.</p>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={16} placeholder="Write your full blog post here…"
              style={{ width: '100%', padding: '12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '14px', fontFamily: "'HubotSans',sans-serif", outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7, color: '#333' }} />
          </Card>
        </div>

        <Card>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: PRI, marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Cover Image</h3>
          {form.coverImage && (
            <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
              <img src={form.coverImage} alt="Cover" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', display: 'block' }} />
              <button onClick={() => set('coverImage', '')} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</button>
            </div>
          )}
          <label style={{ display: 'block', cursor: 'pointer' }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadMedia(e.target.files[0], 'coverImage')} />
            <div style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '18px', textAlign: 'center', background: '#fafafa', cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>🖼️</div>
              <p style={{ fontSize: '12px', color: '#888', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>{uploading ? 'Uploading…' : 'Click to upload cover image'}</p>
            </div>
          </label>
          <Input label="Or enter image URL" value={form.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="https://…" style={{ marginTop: '10px' }} />
        </Card>

        <Card>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: PRI, marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Media Files</h3>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px', fontFamily: "'HubotSans',sans-serif" }}>Upload additional images that appear in a gallery at the bottom of the post.</p>
          {form.mediaFiles?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
              {form.mediaFiles.map((url, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', aspectRatio: '1' }}>
                  <img src={url} alt={`Media ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => set('mediaFiles', form.mediaFiles.filter((_, idx) => idx !== i))}
                    style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', lineHeight: 1, padding: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}
          <label style={{ display: 'block', cursor: 'pointer' }}>
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => Array.from(e.target.files).forEach(f => uploadMedia(f, 'media'))} />
            <div style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '14px', textAlign: 'center', background: '#fafafa', cursor: 'pointer' }}>
              <p style={{ fontSize: '12px', color: '#888', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>⬆ Upload images (select multiple)</p>
            </div>
          </label>
        </Card>

        <Card>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: PRI, marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Video</h3>
          <Input label="YouTube URL or direct video URL" value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=…" />
          {form.videoUrl && <p style={{ fontSize: '11px', color: '#16a34a', fontFamily: "'HubotSans',sans-serif", margin: '-8px 0 0' }}>✓ Video will be embedded in the post</p>}
        </Card>

        <Card>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: PRI, marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Audio</h3>
          {form.audioUrl && (
            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f5f0ff', borderRadius: '6px', padding: '8px 12px' }}>
              <span style={{ fontSize: '12px', color: PRI, fontFamily: "'HubotSans',sans-serif", flex: 1 }}>🎙️ Audio uploaded</span>
              <button onClick={() => set('audioUrl', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '14px' }}>×</button>
            </div>
          )}
          <label style={{ display: 'block', cursor: 'pointer', marginBottom: '10px' }}>
            <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadMedia(e.target.files[0], 'audioUrl')} />
            <div style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '14px', textAlign: 'center', background: '#fafafa', cursor: 'pointer' }}>
              <p style={{ fontSize: '12px', color: '#888', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>🎙️ Upload audio file (MP3, WAV…)</p>
            </div>
          </label>
          <Input label="Or enter audio URL" value={form.audioUrl} onChange={e => set('audioUrl', e.target.value)} placeholder="https://…" />
        </Card>
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #eee', flexWrap: 'wrap' }}>
        <Btn onClick={() => handleSave('published')} disabled={saving} style={{ background: '#16a34a', minWidth: '160px' }}>
          {saving ? 'Saving…' : '🚀 Publish Post'}
        </Btn>
        <Btn variant="ghost" onClick={() => handleSave('draft')} disabled={saving}>
          💾 Save as Draft
        </Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

function BlogView({ token, posts, onDataChanged }) {
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [localPosts, setLocalPosts] = useState(posts || [])

  useEffect(() => { setLocalPosts(posts || []) }, [posts])

  async function handleDelete(id) {
    if (!confirm('Delete this blog post? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE', headers: authH(token) })
    setDeleting(null)
    onDataChanged()
  }

  async function handleReorder(newOrder) {
    setLocalPosts(newOrder)
    await fetch('/api/admin/blog/reorder', { method: 'PUT', headers: authH(token), body: JSON.stringify({ posts: newOrder }) })
    onDataChanged()
  }

  function handleDragStart(e, idx) { e.dataTransfer.setData('idx', idx) }
  function handleDrop(e, dropIdx) {
    const dragIdx = parseInt(e.dataTransfer.getData('idx'))
    if (dragIdx === dropIdx) return
    const reordered = [...localPosts]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(dropIdx, 0, moved)
    handleReorder(reordered)
    setDragOver(null)
  }

  if (creating) return <BlogPostEditor token={token} post={null} onSaved={() => { setCreating(false); onDataChanged() }} onCancel={() => setCreating(false)} />
  if (editing) return <BlogPostEditor token={token} post={editing} onSaved={() => { setEditing(null); onDataChanged() }} onCancel={() => setEditing(null)} />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px', fontFamily: "'HubotSans',sans-serif" }}>Blog Manager</h2>
          <p style={{ color: '#888', fontSize: '13px', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>{localPosts.filter(p => p.status === 'published').length} published · {localPosts.filter(p => p.status === 'draft').length} drafts · Drag rows to reorder</p>
        </div>
        <Btn onClick={() => setCreating(true)}>✍️ New Blog Post</Btn>
      </div>

      {localPosts.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>✍️</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px', fontFamily: "'HubotSans',sans-serif" }}>No blog posts yet</h3>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px', fontFamily: "'HubotSans',sans-serif" }}>Create your first post to engage your audience and boost SEO.</p>
          <Btn onClick={() => setCreating(true)}>✍️ Create First Post</Btn>
        </Card>
      )}

      {localPosts.map((post, idx) => (
        <div key={post.id} draggable onDragStart={e => handleDragStart(e, idx)} onDragOver={e => { e.preventDefault(); setDragOver(idx) }} onDrop={e => handleDrop(e, idx)} onDragLeave={() => setDragOver(null)}
          style={{ background: '#fff', borderRadius: '10px', padding: '16px 18px', marginBottom: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'grab', border: dragOver === idx ? `2px solid ${PRI}` : '2px solid transparent', transition: 'border 0.15s', flexWrap: 'wrap' }}>
          {/* Drag handle */}
          <div style={{ color: '#ccc', fontSize: '18px', flexShrink: 0, cursor: 'grab', userSelect: 'none' }}>⠿</div>
          {/* Cover thumbnail */}
          {post.coverImage
            ? <img src={post.coverImage} alt="" style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
            : <div style={{ width: '56px', height: '40px', background: '#f0e8ff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>✍️</div>
          }
          <div style={{ flex: 1, minWidth: '120px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', fontFamily: "'HubotSans',sans-serif" }}>{post.title || 'Untitled'}</span>
              <Badge color={post.status === 'published' ? '#16a34a' : '#f59e0b'}>{post.status === 'published' ? 'Published' : 'Draft'}</Badge>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {post.category && <span style={{ fontSize: '11px', color: '#888', fontFamily: "'HubotSans',sans-serif" }}>{post.category}</span>}
              {post.date && <span style={{ fontSize: '11px', color: '#aaa', fontFamily: "'HubotSans',sans-serif" }}>{post.date}</span>}
              {post.videoUrl && <span style={{ fontSize: '11px', color: '#aaa' }}>🎬</span>}
              {post.audioUrl && <span style={{ fontSize: '11px', color: '#aaa' }}>🎙️</span>}
              {post.mediaFiles?.length > 0 && <span style={{ fontSize: '11px', color: '#aaa' }}>🖼️{post.mediaFiles.length}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <Btn variant="ghost" onClick={() => setEditing(post)} style={{ padding: '6px 14px', fontSize: '12px' }}>✏️ Edit</Btn>
            <Btn variant="danger" onClick={() => handleDelete(post.id)} disabled={deleting === post.id} style={{ padding: '6px 14px', fontSize: '12px' }}>{deleting === post.id ? '…' : '🗑️'}</Btn>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── About Us Editor ──────────────────────────────────────────────────────────
const ABOUT_DEF = {
  heroTitle: 'About Sleekblue Media Houz', heroSubtitle: 'We print for the biggest brands — and yours is next.',
  whoWeAreTitle: 'Who We Are', whoWeAre: 'Sleekblue Media Houz is a premium printing and corporate branding company dedicated to helping businesses of all sizes communicate their identity with clarity and confidence.',
  missionTitle: 'Our Mission', mission: 'To deliver premium printing with zero stress — high quality output, fast turnaround, and reliable service.',
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
  ctaTitle: 'Ready to Print?', ctaText: 'Call us or chat on WhatsApp — we respond fast.',
  stats: [{ value: '500+', label: 'Happy Clients' }, { value: '5★', label: 'Google Rating' }, { value: '10+', label: 'Years Experience' }, { value: '24/7', label: 'Support' }],
  showStats: true,
}

function AboutView({ token }) {
  const [d, setD] = useState(ABOUT_DEF)
  const [tab, setTab] = useState('hero')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/about').then(r => r.ok ? r.json() : null).then(data => {
      if (data) setD({ ...ABOUT_DEF, ...data, values: data.values || ABOUT_DEF.values, whoWeServe: data.whoWeServe || ABOUT_DEF.whoWeServe, stats: data.stats || ABOUT_DEF.stats })
    }).catch(() => {})
  }, [])

  function set(k, v) { setD(p => ({ ...p, [k]: v })) }
  function updateValue(i, f, v) { const a = [...d.values]; a[i] = { ...a[i], [f]: v }; set('values', a) }
  function removeValue(i) { set('values', d.values.filter((_, idx) => idx !== i)) }
  function addValue() { set('values', [...d.values, { icon: '⭐', title: 'New Value', desc: 'Description here.' }]) }
  function updateStat(i, f, v) { const a = [...d.stats]; a[i] = { ...a[i], [f]: v }; set('stats', a) }
  function removeStat(i) { set('stats', d.stats.filter((_, idx) => idx !== i)) }
  function updateServe(i, v) { const a = [...d.whoWeServe]; a[i] = v; set('whoWeServe', a) }
  function removeServe(i) { set('whoWeServe', d.whoWeServe.filter((_, idx) => idx !== i)) }

  async function save() {
    setSaving(true)
    await fetch('/api/admin/about', { method: 'PUT', headers: authH(token), body: JSON.stringify(d) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  const tabs = [
    { id: 'hero', label: '🏠 Hero' },
    { id: 'content', label: '📝 Content' },
    { id: 'values', label: '⭐ Values' },
    { id: 'serve', label: '👥 Who We Serve' },
    { id: 'stats', label: '📊 Stats Bar' },
    { id: 'cta', label: '📞 CTA' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px', fontFamily: "'HubotSans',sans-serif" }}>About Us Page</h2>
        <p style={{ color: '#888', fontSize: '13px', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Edit every section of the About Us page. Click 🚀 Publish to go live.</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab === t.id ? PRI : '#fff', color: tab === t.id ? '#fff' : '#555', fontWeight: tab === t.id ? 700 : 500, fontSize: '13px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', fontFamily: "'HubotSans',sans-serif" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hero' && (
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Hero Section</h3>
          <Input label="Hero Title" value={d.heroTitle} onChange={e => set('heroTitle', e.target.value)} placeholder="About Sleekblue Media Houz" />
          <Input label="Hero Subtitle" value={d.heroSubtitle} onChange={e => set('heroSubtitle', e.target.value)} rows={2} placeholder="We print for the biggest brands…" />
        </Card>
      )}

      {tab === 'content' && (
        <>
          <Card style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Who We Are</h3>
            <Input label="Section Title" value={d.whoWeAreTitle} onChange={e => set('whoWeAreTitle', e.target.value)} />
            <Input label="Content" value={d.whoWeAre} onChange={e => set('whoWeAre', e.target.value)} rows={5} />
          </Card>
          <Card>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Our Mission</h3>
            <Input label="Section Title" value={d.missionTitle} onChange={e => set('missionTitle', e.target.value)} />
            <Input label="Content" value={d.mission} onChange={e => set('mission', e.target.value)} rows={4} />
          </Card>
        </>
      )}

      {tab === 'values' && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Values / What Sets Us Apart</h3>
            <Btn onClick={addValue} style={{ padding: '6px 14px', fontSize: '12px' }}>+ Add Value</Btn>
          </div>
          <Input label="Section Title" value={d.valuesTitle} onChange={e => set('valuesTitle', e.target.value)} placeholder="What Sets Us Apart" />
          {d.values.map((v, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 36px', gap: '10px', marginBottom: '10px', alignItems: 'flex-start', padding: '12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
              <input value={v.icon} onChange={e => updateValue(i, 'icon', e.target.value)} style={{ padding: '8px 6px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '20px', textAlign: 'center', fontFamily: "'HubotSans',sans-serif" }} />
              <input value={v.title} onChange={e => updateValue(i, 'title', e.target.value)} placeholder="Title" style={{ padding: '9px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
              <input value={v.desc} onChange={e => updateValue(i, 'desc', e.target.value)} placeholder="Description" style={{ padding: '9px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
              <button onClick={() => removeValue(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '9px', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
            </div>
          ))}
        </Card>
      )}

      {tab === 'serve' && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Who We Serve</h3>
            <Btn onClick={() => set('whoWeServe', [...d.whoWeServe, ''])} style={{ padding: '6px 14px', fontSize: '12px' }}>+ Add</Btn>
          </div>
          <Input label="Section Title" value={d.whoWeServeTitle} onChange={e => set('whoWeServeTitle', e.target.value)} />
          {d.whoWeServe.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input value={s} onChange={e => updateServe(i, e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
              <button onClick={() => removeServe(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
            </div>
          ))}
        </Card>
      )}

      {tab === 'stats' && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Stats Bar</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#555', fontFamily: "'HubotSans',sans-serif", cursor: 'pointer' }}>
                <input type="checkbox" checked={d.showStats} onChange={e => set('showStats', e.target.checked)} /> Show stats bar
              </label>
              <Btn onClick={() => set('stats', [...d.stats, { value: '0', label: 'New Stat' }])} style={{ padding: '6px 14px', fontSize: '12px' }}>+ Add Stat</Btn>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Purple stats bar shown just below the hero banner.</p>
          {d.stats.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
              <input value={s.value} onChange={e => updateStat(i, 'value', e.target.value)} placeholder="500+" style={{ width: '100px', padding: '8px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none', fontWeight: 700 }} />
              <input value={s.label} onChange={e => updateStat(i, 'label', e.target.value)} placeholder="Happy Clients" style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
              <button onClick={() => removeStat(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
            </div>
          ))}
        </Card>
      )}

      {tab === 'cta' && (
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Call to Action Section</h3>
          <Input label="CTA Title" value={d.ctaTitle} onChange={e => set('ctaTitle', e.target.value)} placeholder="Ready to Print?" />
          <Input label="CTA Text" value={d.ctaText} onChange={e => set('ctaText', e.target.value)} rows={2} placeholder="Call us or chat on WhatsApp…" />
          <p style={{ fontSize: '11px', color: '#888', fontFamily: "'HubotSans',sans-serif", marginTop: '-8px' }}>Phone and WhatsApp numbers are pulled from Site Settings → Contact Information.</p>
        </Card>
      )}

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  )
}

// ─── SEO Manager ──────────────────────────────────────────────────────────────
const SEO_PAGES = [
  { key: 'home',     label: '🏠 Homepage',        path: '/' },
  { key: 'store',    label: '🛍️ Store',            path: '/store' },
  { key: 'about',    label: '📖 About Us',         path: '/about' },
  { key: 'blog',     label: '✍️ Blog',             path: '/blog' },
  { key: 'quote',    label: '📝 Request a Quote',  path: '/quote' },
  { key: 'dieCut',   label: '🏷️ Die-Cut Stickers', path: '/store/die-cut-stickers' },
  { key: 'flexBanner',label: '📢 Flex Banner',     path: '/store/flex-banner' },
  { key: 'labels',   label: '🔖 Product Labels',   path: '/store/product-labels' },
]

function SeoView({ token }) {
  const [seo, setSeo] = useState({})
  const [activePage, setActivePage] = useState('home')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/seo').then(r => r.ok ? r.json() : {}).then(setSeo).catch(() => {})
  }, [])

  function set(pageKey, field, value) {
    setSeo(prev => ({
      ...prev,
      [pageKey]: { ...(prev[pageKey] || {}), [field]: value }
    }))
  }

  async function save() {
    setSaving(true)
    await fetch('/api/admin/seo', { method: 'PUT', headers: authH(token), body: JSON.stringify(seo) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  const page = SEO_PAGES.find(p => p.key === activePage)
  const entry = seo[activePage] || {}

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px', fontFamily: "'HubotSans',sans-serif" }}>🔍 SEO Manager</h2>
        <p style={{ color: '#888', fontSize: '13px', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Set meta titles and descriptions for each page. These help Google rank your site higher.</p>
      </div>

      {/* Page tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {SEO_PAGES.map(p => (
          <button key={p.key} onClick={() => setActivePage(p.key)}
            style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activePage === p.key ? PRI : '#fff', color: activePage === p.key ? '#fff' : '#555', fontWeight: activePage === p.key ? 700 : 500, fontSize: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', fontFamily: "'HubotSans',sans-serif" }}>
            {p.label}
          </button>
        ))}
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, margin: '0 0 3px', fontFamily: "'HubotSans',sans-serif" }}>{page?.label}</h3>
            <p style={{ fontSize: '11px', color: '#aaa', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>URL: {page?.path}</p>
          </div>
        </div>

        <Input label="Meta Title"
          value={entry.title || ''}
          onChange={e => set(activePage, 'title', e.target.value)}
          placeholder="e.g. Sleekblue Media Houz — Premium Printing in Nigeria" />
        <p style={{ fontSize: '11px', color: entry.title?.length > 60 ? '#dc2626' : '#aaa', margin: '-10px 0 14px', fontFamily: "'HubotSans',sans-serif" }}>
          {(entry.title || '').length}/60 characters {entry.title?.length > 60 ? '⚠️ Too long — Google truncates at 60' : '✓ Good length'}
        </p>

        <Input label="Meta Description" rows={3}
          value={entry.description || ''}
          onChange={e => set(activePage, 'description', e.target.value)}
          placeholder="A brief, compelling description of this page (150–160 characters ideal)" />
        <p style={{ fontSize: '11px', color: (entry.description?.length || 0) > 160 ? '#dc2626' : '#aaa', margin: '-10px 0 14px', fontFamily: "'HubotSans',sans-serif" }}>
          {(entry.description || '').length}/160 characters {(entry.description?.length || 0) > 160 ? '⚠️ Too long' : (entry.description?.length || 0) > 120 ? '✓ Good' : (entry.description?.length || 0) > 0 ? '⚠️ Too short' : ''}
        </p>

        <Input label="Keywords (comma separated)"
          value={entry.keywords || ''}
          onChange={e => set(activePage, 'keywords', e.target.value)}
          placeholder="die cut stickers Nigeria, flex banner printing Lagos, branded merchandise" />

        {/* Google preview */}
        {(entry.title || entry.description) && (
          <div style={{ marginTop: '8px', background: '#f9f9fb', borderRadius: '10px', padding: '16px', border: '1px solid #e8e8e8' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'HubotSans',sans-serif" }}>Google Preview</p>
            <p style={{ fontSize: '18px', color: '#1a0dab', margin: '0 0 3px', lineHeight: 1.3, fontFamily: 'Arial, sans-serif' }}>{entry.title || 'Page Title'}</p>
            <p style={{ fontSize: '13px', color: '#006621', margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }}>sleekbluemediahouz.com{page?.path}</p>
            <p style={{ fontSize: '13px', color: '#545454', margin: 0, lineHeight: 1.55, fontFamily: 'Arial, sans-serif' }}>{entry.description || 'Meta description will appear here…'}</p>
          </div>
        )}
      </Card>

      {/* SEO Tips */}
      <Card style={{ marginTop: '16px', background: '#f9f5ff' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: PRI, marginBottom: '12px', fontFamily: "'HubotSans',sans-serif" }}>💡 SEO Tips for Sleekblue</h3>
        <ul style={{ fontSize: '12px', color: '#555', lineHeight: 1.8, paddingLeft: '18px', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>
          <li>Include keywords like <strong>"die cut stickers Nigeria"</strong>, <strong>"flex banner Lagos"</strong>, <strong>"printing company Nigeria"</strong></li>
          <li>Keep meta titles under <strong>60 characters</strong> and descriptions under <strong>160 characters</strong></li>
          <li>Each page should have a <strong>unique</strong> title and description</li>
          <li>Mention your city/location — <strong>"Lagos printing company"</strong> gets local search traffic</li>
          <li>After saving, use <strong>Google Search Console</strong> to track your rankings</li>
        </ul>
      </Card>

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('sbm_admin_token') || '')
  const [view, setView] = useState('dashboard')
  const [siteData, setSiteData] = useState({ settings: {}, productOverrides: {}, stickerPriceOverrides: {}, acceptances: [], content: {}, blogPosts: [], heroSlides: 0 })
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async (tok = token) => {
    if (!tok) return
    setLoading(true)
    try {
      const [dataRes, accRes, contentRes, blogRes, heroRes] = await Promise.all([
        fetch('/api/admin/site-data', { headers: { Authorization: `Bearer ${tok}` } }),
        fetch('/api/admin/acceptances', { headers: { Authorization: `Bearer ${tok}` } }),
        fetch('/api/content'),
        fetch('/api/admin/blog', { headers: { Authorization: `Bearer ${tok}` } }),
        fetch('/api/hero'),
      ])
      if (dataRes.status === 401) { handleLogout(); return }
      const data = await dataRes.json()
      const acceptances = await accRes.json()
      const content = contentRes.ok ? await contentRes.json() : {}
      const blogPosts = blogRes.ok ? await blogRes.json() : []
      const heroData = heroRes.ok ? await heroRes.json() : {}
      setSiteData({
        settings:             data.settings             || {},
        productOverrides:     data.productOverrides     || {},
        stickerPriceOverrides:data.stickerPriceOverrides || {},
        acceptances:          Array.isArray(acceptances) ? acceptances : [],
        content,
        blogPosts:            Array.isArray(blogPosts) ? blogPosts : [],
        heroSlides:           (heroData.customSlides || []).length,
      })
    } catch {}
    setLoading(false)
  }, [token])

  useEffect(() => { if (token) fetchAll(token) }, [token])

  function handleLogin(tok) {
    setToken(tok)
    localStorage.setItem('sbm_admin_token', tok)
  }
  function handleLogout() {
    setToken('')
    localStorage.removeItem('sbm_admin_token')
  }

  if (!token) return <LoginScreen onLogin={handleLogin} />

  const counts = {
    products: ALL_PRODUCTS.length,
    acceptances: siteData.acceptances.length,
    blogPosts: (siteData.blogPosts || []).length,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'HubotSans',sans-serif" }}>
      <Sidebar view={view} setView={setView} counts={counts} onLogout={handleLogout} />
      <main style={{ flex: 1, background: '#f5f5f5', padding: '28px 28px 40px', overflowY: 'auto', minHeight: '100vh' }}>
        {loading && view === 'dashboard' && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>Loading…</div>
        )}
        {!loading && (
          <>
            {view === 'dashboard'      && <DashboardView siteData={siteData} />}
            {view === 'page-editor'    && <PageEditorView token={token} />}
            {view === 'image-manager'  && <ImageManager token={token} />}
            {view === 'products'       && <ProductsView token={token} productOverrides={siteData.productOverrides} onDataChanged={fetchAll} />}
            {view === 'sticker-prices' && <StickerPricesView token={token} stickerPriceOverrides={siteData.stickerPriceOverrides} onDataChanged={fetchAll} />}
            {view === 'blog'           && <BlogView token={token} posts={siteData.blogPosts} onDataChanged={fetchAll} />}
            {view === 'about'          && <AboutView token={token} />}
            {view === 'seo'            && <SeoView token={token} />}
            {view === 'content'        && <ContentView token={token} content={siteData.content} settings={siteData.settings} onDataChanged={fetchAll} />}
            {view === 'settings'       && <SettingsView token={token} settings={siteData.settings} onDataChanged={fetchAll} />}
            {view === 'acceptances'    && <AcceptancesView acceptances={siteData.acceptances} />}
            {view === 'security'       && <SecurityView token={token} />}
          </>
        )}
      </main>
    </div>
  )
}
