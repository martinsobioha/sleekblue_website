import { useState, useEffect, useCallback } from 'react'
import logo from '@assets/SLEEKBLUE_LOGO_1779927359068.jpg'
import { ALL_PRODUCTS, STICKER_SIZE_PRICES, getProductDetails } from '../data/products'
import { AnalyticsView, ReportsView } from '../components/AdminAnalytics'
import TiptapEditor from '../components/TiptapEditor'

const PRI = '#7B2FBE'
const PRI_LIGHT = '#f0e8ff'
const ACC = '#FF6B00'
const SIDEBAR_W = '220px'

function authH(token) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

function fmt(n) { return '₦' + Math.round(n).toLocaleString() }

// ─── Shared UI ───────────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
  return <div className={`rounded-[20px] bg-white p-6 shadow-sm ${className}`}>{children}</div>
}
function Btn({ children, onClick, variant = 'primary', disabled, className = '' }) {
  const variants = {
    primary: 'bg-[#7B2FBE] text-white hover:bg-[#6826a2] border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-transparent',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent',
    ghost: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold cursor-pointer transition disabled:opacity-55 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${className}`}>
      {children}
    </button>
  )
}
function Input({ label, value, onChange, type = 'text', placeholder, rows, className = '', readOnly }) {
  const base = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#7B2FBE] focus:ring-2 focus:ring-[#7B2FBE]/20 disabled:bg-slate-50'
  return (
    <div className={`mb-4 ${className}`}>
      {label && <label className="block text-xs font-semibold text-slate-600 mb-2">{label}</label>}
      {rows ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          readOnly={readOnly}
          className={`${base} resize-vertical`} />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={base} />
      )}
    </div>
  )
}
function Badge({ children, color = PRI, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${className}`} style={{ background: `${color}20`, color }}>
      {children}
    </span>
  )
}
function SaveBar({ onSave, onCancel, saving, saved, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 mt-5 ${className}`}>
      <Btn onClick={onSave} disabled={saving} className="min-w-[200px]">
        {saving ? 'Publishing…' : '🚀 Publish to Website'}
      </Btn>
      {onCancel && <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>}
      {saved && <span className="text-sm font-semibold text-emerald-700">✓ Published! Changes are now live.</span>}
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
    <div className="min-h-screen bg-[linear-gradient(135deg,#5a1fa0_0%,#7B2FBE_60%,#9c4de0_100%)] flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-[20px] bg-white p-10 shadow-[0_24px_64px_rgba(0,0,0,0.22)]">
        <div className="text-center mb-7">
          <img src={logo} alt="Sleekblue" className="mx-auto h-14 rounded-xl bg-white p-1" />
          <h2 className="mt-4 text-xl font-black text-slate-900">Admin Panel</h2>
          <p className="mt-2 text-sm text-slate-500">Sign in to manage your website</p>
        </div>
        <form onSubmit={handleLogin}>
          <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" />
          {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
          <Btn onClick={handleLogin} disabled={loading} className="w-full py-3">
            {loading ? 'Signing in…' : '🔐 Sign In'}
          </Btn>
        </form>
        <p className="mt-5 text-center text-[11px] text-slate-400">Sleekblue Media Houz — Admin Access</p>
      </div>
    </div>
  )
}

// ─── Image Manager ────────────────────────────────────────────────────────────
const DEFAULT_SLIDE_LABELS = ['Hero Slide 1', 'Hero Slide 2', 'Hero Slide 3', 'Hero Slide 4']

function ImageManager({ token }) {
  const [tab, setTab] = useState('hero')
  const [heroSlides, setHeroSlides] = useState([])
  const [hiddenDefaultSlides, setHiddenDefaultSlides] = useState([])
  const [extraDefaultSlides, setExtraDefaultSlides] = useState([])
  const [hiddenExtraDefaultSlides, setHiddenExtraDefaultSlides] = useState([])
  const [defaultSlidesMsg, setDefaultSlidesMsg] = useState('')
  const [extraDefaultUploading, setExtraDefaultUploading] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroMsg, setHeroMsg] = useState('')
  const [products, setProducts] = useState(ALL_PRODUCTS)
  const [selectedSlug, setSelectedSlug] = useState(ALL_PRODUCTS[0]?.slug || '')
  const [productImages, setProductImages] = useState({})
  const [prodUploading, setProdUploading] = useState(false)
  const [prodMsg, setProdMsg] = useState('')
  const [dragIdx, setDragIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const [variantImages, setVariantImages] = useState({})
  const [selectedVariant, setSelectedVariant] = useState('')
  const [variantUploading, setVariantUploading] = useState(false)
  const [variantMsg, setVariantMsg] = useState('')

  useEffect(() => {
    fetch('/api/hero').then(r => r.ok ? r.json() : {}).then(d => {
      setHeroSlides(d.customSlides || [])
      setHiddenDefaultSlides(d.hiddenDefaultSlides || [])
      setExtraDefaultSlides(d.extraDefaultSlides || [])
      setHiddenExtraDefaultSlides(d.hiddenExtraDefaultSlides || [])
    })
    fetch('/api/product-images').then(r => r.ok ? r.json() : {}).then(d => setProductImages(d))
    fetch('/api/product-variant-images').then(r => r.ok ? r.json() : {}).then(d => setVariantImages(d))
  }, [])

  async function toggleDefaultSlide(idx) {
    const next = hiddenDefaultSlides.includes(idx)
      ? hiddenDefaultSlides.filter(i => i !== idx)
      : [...hiddenDefaultSlides, idx]
    setHiddenDefaultSlides(next)
    await fetch('/api/admin/hero/default-slides', { method: 'PUT', headers: authH(token), body: JSON.stringify({ hiddenDefaultSlides: next }) })
    setDefaultSlidesMsg('✓ Saved')
    setTimeout(() => setDefaultSlidesMsg(''), 2000)
  }

  async function toggleExtraDefaultSlide(url) {
    const next = hiddenExtraDefaultSlides.includes(url)
      ? hiddenExtraDefaultSlides.filter(u => u !== url)
      : [...hiddenExtraDefaultSlides, url]
    setHiddenExtraDefaultSlides(next)
    await fetch('/api/admin/hero/extra-default-visibility', { method: 'PUT', headers: authH(token), body: JSON.stringify({ hiddenExtraDefaultSlides: next }) })
    setDefaultSlidesMsg('✓ Saved')
    setTimeout(() => setDefaultSlidesMsg(''), 2000)
  }

  async function uploadExtraDefaultSlide(e) {
    const file = e.target.files[0]; if (!file) return
    setExtraDefaultUploading(true)
    const fd = new FormData(); fd.append('image', file)
    const res = await fetch('/api/admin/upload/hero/extra-default', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    const data = await res.json()
    if (data.ok) {
      setExtraDefaultSlides(s => [...s, data.url])
      setDefaultSlidesMsg('✓ Slide added!')
      setTimeout(() => setDefaultSlidesMsg(''), 2000)
    }
    setExtraDefaultUploading(false); e.target.value = ''
  }

  async function deleteExtraDefaultSlide(url) {
    if (!confirm('Delete this extra default slide?')) return
    await fetch('/api/admin/upload/hero/extra-default', { method: 'DELETE', headers: authH(token), body: JSON.stringify({ url }) })
    setExtraDefaultSlides(s => s.filter(u => u !== url))
    setHiddenExtraDefaultSlides(s => s.filter(u => u !== url))
  }

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

  async function uploadVariantImage(e) {
    const file = e.target.files[0]; if (!file || !selectedSlug || !selectedVariant) return
    setVariantUploading(true); setVariantMsg('')
    const fd = new FormData(); fd.append('image', file); fd.append('variant', selectedVariant)
    const res = await fetch(`/api/admin/upload/product-variant/${selectedSlug}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    const data = await res.json()
    if (data.ok) {
      setVariantImages(prev => ({
        ...prev,
        [selectedSlug]: { ...(prev[selectedSlug] || {}), [selectedVariant]: [...((prev[selectedSlug] || {})[selectedVariant] || []), data.url] }
      }))
      setVariantMsg('✓ Variant image uploaded!')
    } else setVariantMsg('✗ Upload failed: ' + (data.error || ''))
    setVariantUploading(false); e.target.value = ''
  }

  async function deleteVariantImage(slug, variant, url) {
    if (!confirm('Delete this variant image?')) return
    await fetch(`/api/admin/upload/product-variant/${slug}`, { method: 'DELETE', headers: authH(token), body: JSON.stringify({ variant, url }) })
    setVariantImages(prev => ({
      ...prev,
      [slug]: { ...(prev[slug] || {}), [variant]: ((prev[slug] || {})[variant] || []).filter(u => u !== url) }
    }))
  }

  const tabs = [
    { id: 'hero',    label: '🖼️ Hero Slides' },
    { id: 'product', label: '🛍️ Product Images' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Image Manager</h2>
        <p className="text-sm text-slate-500">Upload, replace, reorder, and delete images across your website.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-[#7B2FBE] text-white shadow-[#7B2FBE]/20' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hero' && (
        <div className="space-y-6">
          <Card className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#7B2FBE] mb-2">Hero Slideshow Images</h3>
              <p className="text-sm text-slate-500">Upload new hero slide images. They will replace the default slides on the homepage. Drag or use ▲▼ to reorder. Recommended: landscape images (1920×600px or similar).</p>
            </div>
            <label className={`inline-flex items-center gap-2 rounded-2xl bg-[#7B2FBE] px-4 py-3 text-sm font-semibold text-white transition ${heroUploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              {heroUploading ? '⏳ Uploading…' : '⬆️ Upload Slide Image'}
              <input type="file" accept="image/*" className="hidden" onChange={uploadHeroSlide} disabled={heroUploading} />
            </label>
            {heroMsg && <p className={`text-sm mt-2 ${heroMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>{heroMsg}</p>}
          </Card>

          <Card className="space-y-4 border border-[#e0d6f5] bg-[#f8f8ff]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#7B2FBE] mb-1">🖼️ Default Built-in Slides</h3>
                <p className="text-xs text-slate-500 leading-5">
                  {heroSlides.length > 0 ? 'Custom slides are active — defaults are hidden behind them.' : 'Shown when no custom slides are uploaded. Hide, restore, or add more below.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {defaultSlidesMsg && <span className="text-sm text-emerald-600">{defaultSlidesMsg}</span>}
                <label className={`inline-flex items-center gap-2 rounded-2xl bg-[#7B2FBE] px-4 py-2 text-sm font-semibold text-white ${extraDefaultUploading ? 'opacity-60' : 'cursor-pointer'}`}>
                  {extraDefaultUploading ? '⏳ Adding…' : '➕ Add More Slides'}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadExtraDefaultSlide} disabled={extraDefaultUploading} />
                </label>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {DEFAULT_SLIDE_LABELS.map((label, i) => {
                const isHidden = hiddenDefaultSlides.includes(i)
                return (
                  <div key={i} className={`rounded-2xl overflow-hidden border transition ${isHidden ? 'border-slate-200 opacity-50' : 'border-[#7B2FBE]/40'}`}>
                    <div className={`p-4 text-center ${isHidden ? 'bg-slate-100' : 'bg-[#f0e8ff]'}`}>
                      <div className="text-3xl mb-1">🖼️</div>
                      <p className="text-xs font-semibold text-[#7B2FBE] mb-1">{label}</p>
                      <p className="text-[10px] text-slate-400">Built-in slide</p>
                    </div>
                    <div className="bg-white p-3">
                      <button
                        onClick={() => toggleDefaultSlide(i)}
                        className={`w-full rounded-xl px-3 py-2 text-[11px] font-semibold ${isHidden ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-700'}`}>
                        {isHidden ? '✓ Restore' : '✗ Hide'}
                      </button>
                    </div>
                  </div>
                )
              })}

              {extraDefaultSlides.map((url, i) => {
                const isHidden = hiddenExtraDefaultSlides.includes(url)
                return (
                  <div key={url} className={`rounded-2xl overflow-hidden border transition ${isHidden ? 'border-slate-200 opacity-50' : 'border-emerald-200'}`}>
                    <div className="relative h-28 overflow-hidden bg-slate-100">
                      <img src={url} alt={`Extra slide ${i + 1}`} className="h-full w-full object-cover" />
                      {isHidden && <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[11px] font-semibold text-white">HIDDEN</div>}
                    </div>
                    <div className="bg-white p-3">
                      <p className="text-[11px] font-semibold text-emerald-600 mb-2">Extra Slide {i + 1}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleExtraDefaultSlide(url)}
                          className={`flex-1 rounded-xl px-3 py-2 text-[10px] font-semibold ${isHidden ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-700'}`}>
                          {isHidden ? '✓ Restore' : '✗ Hide'}
                        </button>
                        <button
                          onClick={() => deleteExtraDefaultSlide(url)}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-[10px] font-semibold text-white">
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              <label className={`rounded-2xl border-2 border-dashed border-[#7B2FBE]/60 flex min-h-[150px] flex-col items-center justify-center gap-2 p-6 text-center transition ${extraDefaultUploading ? 'opacity-60' : 'hover:bg-slate-50'}`}>
                <span className="text-3xl">➕</span>
                <span className="text-[11px] font-semibold text-[#7B2FBE]">Add More Default Slides</span>
                <input type="file" accept="image/*" className="hidden" onChange={uploadExtraDefaultSlide} disabled={extraDefaultUploading} />
              </label>
            </div>
          </Card>

          {heroSlides.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {heroSlides.map((url, i) => (
                <div
                  key={url}
                  draggable
                  onDragStart={e => onHeroDragStart(e, i)}
                  onDragOver={e => onHeroDragOver(e, i)}
                  onDrop={e => onHeroDrop(e, i)}
                  onDragEnd={onHeroDragEnd}
                  className={`rounded-[18px] overflow-hidden border bg-white transition ${dragOverIdx === i ? 'border-[#7B2FBE] shadow-[0_0_0_3px_rgba(123,47,190,0.18)]' : 'border-slate-200 shadow-sm'} ${dragIdx === i ? 'opacity-50' : ''}`}>
                  <div className="relative">
                    <img src={url} alt={`Slide ${i + 1}`} className="h-[160px] w-full object-cover" />
                    <div className="absolute left-2 top-2 rounded-xl bg-black/60 px-2 py-1 text-[11px] font-semibold text-white">Slide {i + 1}</div>
                  </div>
                  <div className="flex items-center gap-2 p-3">
                    <span className="flex-1 text-[11px] text-slate-500">⠿ drag to reorder</span>
                    <button
                      onClick={() => moveHero(i, -1)}
                      disabled={i === 0}
                      className="rounded-xl bg-[#f0e8ff] px-2 py-1 text-[11px] font-semibold text-[#7B2FBE] disabled:opacity-40">
                      ▲
                    </button>
                    <button
                      onClick={() => moveHero(i, 1)}
                      disabled={i === heroSlides.length - 1}
                      className="rounded-xl bg-[#f0e8ff] px-2 py-1 text-[11px] font-semibold text-[#7B2FBE] disabled:opacity-40">
                      ▼
                    </button>
                    <button
                      onClick={() => deleteHeroSlide(url)}
                      className="rounded-xl bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'product' && (
        <div className="space-y-6">
          <Card className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#7B2FBE] mb-2">Product Images</h3>
              <p className="text-sm text-slate-500">Select a product, then upload images for it. Uploaded images appear first on the product page.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedSlug}
                onChange={e => { setSelectedSlug(e.target.value); setProdMsg('') }}
                className="min-w-[220px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#7B2FBE] focus:ring-2 focus:ring-[#7B2FBE]/20">
                {products.map(p => (
                  <option key={p.slug} value={p.slug}>{p.name}</option>
                ))}
              </select>
              <label className={`inline-flex items-center gap-2 rounded-2xl bg-[#7B2FBE] px-4 py-3 text-sm font-semibold text-white ${prodUploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                {prodUploading ? '⏳ Uploading…' : '⬆️ Upload Image'}
                <input type="file" accept="image/*" className="hidden" onChange={uploadProductImage} disabled={prodUploading} />
              </label>
            </div>
            {prodMsg && <p className={`text-sm mt-2 ${prodMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>{prodMsg}</p>}
          </Card>

          {selectedSlug && (
            <Card className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">General images for: <span className="text-[#7B2FBE]">{products.find(p => p.slug === selectedSlug)?.name}</span></h4>
                <p className="text-xs text-slate-500">Shown when no size-specific image is uploaded. Acts as the default for all variants.</p>
              </div>
              {!(productImages[selectedSlug]?.length)
                ? <p className="text-sm text-slate-500">No general images uploaded yet.</p>
                : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {(productImages[selectedSlug] || []).map((url, i) => (
                      <div key={url} className="relative overflow-hidden rounded-2xl border border-slate-200">
                        <img src={url} alt={`product ${i + 1}`} className="aspect-[3/4] w-full object-cover" />
                        <button
                          onClick={() => deleteProductImage(selectedSlug, url)}
                          className="absolute right-2 top-2 rounded-xl bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
                          🗑
                        </button>
                        {i === 0 && <div className="absolute left-2 bottom-2 rounded-xl bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white">Main</div>}
                      </div>
                    ))}
                  </div>
                )}
            </Card>
          )}

          {(() => {
            const selProduct = products.find(p => p.slug === selectedSlug)
            if (!selProduct || !selProduct.sizes?.length) return null
            const slugVariants = selProduct.sizes
            const activeVariant = selectedVariant || slugVariants[0]
            const variantImgsForVariant = (variantImages[selectedSlug] || {})[activeVariant] || []
            return (
              <Card className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#7B2FBE] mb-1">📐 Variant / Type Images</h3>
                  <p className="text-sm text-slate-500">Upload a specific image for each size or type. These override the general product image when that variant is selected by the customer.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={activeVariant}
                    onChange={e => { setSelectedVariant(e.target.value); setVariantMsg('') }}
                    className="min-w-[200px] rounded-2xl border border-[#7B2FBE]/30 bg-[#f0e8ff] px-4 py-3 text-sm outline-none focus:border-[#7B2FBE] focus:ring-2 focus:ring-[#7B2FBE]/20">
                    {slugVariants.map(v => (
                      <option key={v} value={v}>{v} {((variantImages[selectedSlug] || {})[v] || []).length > 0 ? '✓' : ''}</option>
                    ))}
                  </select>
                  <label className={`inline-flex items-center gap-2 rounded-2xl bg-[#7B2FBE] px-4 py-3 text-sm font-semibold text-white ${variantUploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                    {variantUploading ? '⏳ Uploading…' : `⬆️ Upload for "${activeVariant}"`}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { setSelectedVariant(activeVariant); uploadVariantImage(e) }} disabled={variantUploading} />
                  </label>
                </div>
                {variantMsg && <p className={`text-sm ${variantMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>{variantMsg}</p>}

                {variantImgsForVariant.length === 0
                  ? <p className="text-sm text-slate-500">No images for "{activeVariant}" yet — falls back to general product image.</p>
                  : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {variantImgsForVariant.map((url, i) => (
                        <div key={url} className="relative overflow-hidden rounded-2xl border border-[#7B2FBE]/30">
                          <img src={url} alt={`${activeVariant} ${i + 1}`} className="aspect-[3/4] w-full object-cover" />
                          <button
                            onClick={() => deleteVariantImage(selectedSlug, activeVariant, url)}
                            className="absolute right-2 top-2 rounded-xl bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
                            🗑
                          </button>
                          {i === 0 && <div className="absolute left-2 bottom-2 rounded-xl bg-[#7B2FBE] px-2 py-1 text-[10px] font-semibold text-white">Main</div>}
                        </div>
                      ))}
                    </div>
                  )}

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">All variants overview:</p>
                  <div className="flex flex-wrap gap-2">
                    {slugVariants.map(v => {
                      const count = ((variantImages[selectedSlug] || {})[v] || []).length
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${count > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                          {v} {count > 0 ? `(${count})` : '—'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )
          })()}
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
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900 mb-1">Page Editor</h2>
          <p className="text-sm text-slate-500 mb-4">Drag and drop sections to reorder the homepage, or toggle them on/off.</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === t.id ? 'bg-[#7B2FBE] text-white shadow-[#7B2FBE]/20' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-100'}`}>
                {t.label}
              </button>
            ))}
            <a href="/" target="_blank" rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              View Live Site ↗
            </a>
        </div>
      </div>

      {activeTab === 'layout' && (
        <div>
          <Card className="mb-4 p-4">
            <p className="text-sm text-slate-500 m-0">
              💡 <strong>Drag</strong> the cards below to reorder homepage sections. <strong>Toggle</strong> the switch to show or hide each section. Click <strong>Save Layout</strong> when done.
            </p>
          </Card>
          <div className="space-y-3 mb-5">
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
                  className={`rounded-2xl border p-4 flex items-center gap-4 cursor-grab transition ${isDraggingThis ? 'bg-[#eef2ff] border-[#7B2FBE88] opacity-50 shadow-sm' : isOver ? 'bg-[#eef2ff] border-[#7B2FBE] shadow-sm' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <span className="text-2xl text-slate-400 flex-shrink-0">⠿</span>
                  <div className="w-10 h-10 rounded-xl bg-[#f0e8ff] flex items-center justify-center text-2xl flex-shrink-0">{section.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-sm font-semibold text-slate-900">{section.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{section.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                      className="rounded-xl bg-[#f0efff] px-3 py-2 text-[13px] font-semibold text-[#7B2FBE] disabled:cursor-not-allowed disabled:opacity-40">▲</button>
                    <button onClick={() => moveSection(idx, 1)} disabled={idx === layout.length - 1}
                      className="rounded-xl bg-[#f0efff] px-3 py-2 text-[13px] font-semibold text-[#7B2FBE] disabled:cursor-not-allowed disabled:opacity-40">▼</button>
                    <div onClick={() => toggleVisible(section.id)} className="relative w-11 h-6 cursor-pointer flex-shrink-0">
                      <div className={`absolute inset-0 rounded-full transition ${section.visible ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      <div className={`absolute top-1 ${section.visible ? 'left-5' : 'left-1'} h-4 w-4 rounded-full bg-white shadow-sm transition-all`} />
                    </div>
                    <span className={`text-[11px] font-semibold ${section.visible ? 'text-emerald-600' : 'text-slate-400'} w-11`}>{section.visible ? 'Visible' : 'Hidden'}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Btn onClick={saveLayout} disabled={saving}>{saving ? 'Saving…' : '💾 Save Layout'}</Btn>
            {saved && <span className="text-sm font-semibold text-emerald-700">✓ Layout saved! Refresh the site to see changes.</span>}
          </div>
        </div>
      )}

      {activeTab === 'hero' && (
        <Card>
          <h3 className="text-sm font-bold text-[#7B2FBE] mb-2">Hero Banner Text Overlay</h3>
          <p className="text-sm text-slate-500 mb-4">
            These texts will appear overlaid on the hero slideshow. Leave blank to use the default image-baked text.
          </p>
          <Input label="Main Headline" value={heroData.headline} onChange={e => setHeroData(d => ({ ...d, headline: e.target.value }))} placeholder="e.g. Premium Print. Zero Stress." />
          <Input label="Sub-headline" value={heroData.subheadline} onChange={e => setHeroData(d => ({ ...d, subheadline: e.target.value }))} placeholder="e.g. Die-cut stickers, Flex printing, Corporate branding…" rows={2} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Button 1 Label" value={heroData.btn1} onChange={e => setHeroData(d => ({ ...d, btn1: e.target.value }))} placeholder="Print Sticker" />
            <Input label="Button 2 Label" value={heroData.btn2} onChange={e => setHeroData(d => ({ ...d, btn2: e.target.value }))} placeholder="Print Flex" />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <Btn onClick={saveHero} disabled={heroSaving}>{heroSaving ? 'Saving…' : '💾 Save Hero Text'}</Btn>
            {heroSaved && <span className="text-sm font-semibold text-emerald-700">✓ Saved! Refresh the site to see changes.</span>}
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
    { id: 'faq',            icon: '❓', label: 'FAQ Manager' },
    { id: 'seo',            icon: '🔍', label: 'SEO Manager' },
    { id: 'settings',       icon: '⚙️', label: 'Site Settings' },
    { id: 'acceptances',    icon: '📋', label: 'T&C Acceptances', badge: counts.acceptances },
    { id: 'security',       icon: '🔑', label: 'Security' },
    { id: 'analytics',      icon: '📈', label: 'Analytics' },
    { id: 'reports',        icon: '💰', label: 'Reports' },
    { id: 'leads',          icon: '📲', label: 'WA Leads', badge: counts.leads || 0 },
    { id: 'promo-banner',   icon: '📣', label: 'Promo Banner' },
    { id: 'activity-log',   icon: '📜', label: 'Activity Log' },
    { id: 'seo-agent',      icon: '🤖', label: 'SEO Agent' },
    { id: 'growth',         icon: '🚀', label: 'Growth Dashboard' },
    { id: 'newsletter',      icon: '📧', label: 'Newsletter' },
    { id: 'comments',        icon: '💬', label: 'Comments' },
    { id: 'reviews-pending', icon: '⭐', label: 'Reviews Pending' },
    { id: 'referrals',       icon: '🔗', label: 'Referrals' },
  ]
  return (
    <div className="w-[220px] min-h-screen flex-shrink-0 bg-[#7B2FBE] flex flex-col">
      <div className="px-4 py-5 border-b border-white/15 text-center">
        <img src={logo} alt="Sleekblue" className="mx-auto h-10 rounded-xl bg-white p-1" />
        <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-white/75">Admin Panel</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {items.map(item => {
          const active = view === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${active ? 'bg-white/20 border-l-4 border-white text-white font-semibold' : 'border-l-4 border-transparent text-slate-100 hover:bg-white/10'}`}>
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <span className="flex-1 text-sm">{item.label}</span>
              {item.badge > 0 && <span className="rounded-full bg-[#FF6B00] px-2 py-0.5 text-[10px] font-semibold text-white">{item.badge}</span>}
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/15">
        <Btn variant="ghost" onClick={onLogout} className="w-full bg-white/10 text-white border-white/20 hover:bg-white/15">🚪 Log Out</Btn>
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
      <h2 className="text-2xl font-black text-slate-900 mb-6">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-7">
        {stats.map((s, i) => (
          <Card key={i} className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: s.color + '20', color: s.color }}>{s.icon}</div>
            <div>
              <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Recent T&amp;C Acceptances</h3>
        {recent.length === 0
          ? <p className="text-sm text-slate-500">No acceptances yet.</p>
          : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    {['Name', 'Email', 'Phone', 'IP Address', 'Date & Time', 'ID'].map(h => (
                      <th key={h} className="whitespace-nowrap py-2.5 px-3 text-left text-xs font-semibold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => (
                    <tr key={i} className="border-t border-slate-200">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{r.customerName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.email}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.phone}</td>
                      <td className="py-2.5 px-3 text-xs text-slate-500 font-mono">{r.ipAddress}</td>
                      <td className="py-2.5 px-3 text-xs text-slate-500 whitespace-nowrap">{new Date(r.timestamp).toLocaleString()}</td>
                      <td className="py-2.5 px-3"><Badge>{r.acceptanceId?.slice(0,16)}</Badge></td>
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
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button onClick={onCancel} className="text-2xl text-slate-500 hover:text-slate-700">←</button>
        <h2 className="text-xl font-black text-slate-900 m-0">Edit: {baseProduct.name}</h2>
        {override && <Badge color="#16a34a">Has overrides</Badge>}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Basic Information</h3>
          <Input label="Product Name" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Category" value={category} onChange={e => setCategory(e.target.value)} />
          <Input label="Badge Label (e.g. Best Seller)" value={badge} onChange={e => setBadge(e.target.value)} />
          <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Features List</h3>
          {features.map((f, i) => (
            <div key={i} className="flex flex-wrap gap-2 mb-2">
              <input value={f} onChange={e => updateFeature(i, e.target.value)}
                placeholder={`Feature ${i+1}`}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none" />
              <button onClick={() => removeFeature(i)} className="rounded-2xl bg-rose-100 px-3 text-sm font-semibold text-rose-700">×</button>
            </div>
          ))}
          <Btn variant="ghost" onClick={addFeature} className="mt-1">+ Add Feature</Btn>
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Available Sizes / Types</h3>
          {sizes.map((s, i) => (
            <div key={i} className="flex flex-wrap gap-2 mb-2">
              <input value={s} onChange={e => updateSize(i, e.target.value)}
                placeholder={`Size/Type ${i+1}`}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none" />
              <button onClick={() => removeSize(i)} className="rounded-2xl bg-rose-100 px-3 text-sm font-semibold text-rose-700">×</button>
            </div>
          ))}
          <Btn variant="ghost" onClick={addSize} className="mt-1">+ Add Size</Btn>
        </Card>

        {!isDieCut && (
          <Card>
            <h3 className="text-sm font-bold text-[#7B2FBE] mb-1">Price Table</h3>
            <p className="text-sm text-slate-500 mb-4">Enter quantity and unit price per piece (in ₦)</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="py-2.5 px-3 text-left font-semibold text-slate-700">Qty (pcs)</th>
                    <th className="py-2.5 px-3 text-left font-semibold text-slate-700">Unit Price (₦/pc)</th>
                    <th className="py-2.5 px-3 text-left font-semibold text-slate-700">Total</th>
                    <th className="py-2.5 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {priceTable.map((row, i) => (
                    <tr key={i} className="border-t border-slate-200">
                      <td className="py-2.5 px-3">
                        <input type="number" value={row.qty} onChange={e => updateRow(i, 'qty', e.target.value)}
                          className="w-20 rounded-2xl border border-slate-200 px-2 py-1 text-sm text-center text-slate-900" />
                      </td>
                      <td className="py-2.5 px-3">
                        <input type="number" value={row.unitPrice} onChange={e => updateRow(i, 'unitPrice', e.target.value)}
                          className="w-24 rounded-2xl border border-slate-200 px-2 py-1 text-sm text-center text-slate-900" />
                      </td>
                      <td className="py-2.5 px-3 text-[#7B2FBE] font-semibold">{fmt(row.qty * row.unitPrice)}</td>
                      <td className="py-2.5 px-3">
                        <button onClick={() => removeRow(i)} className="rounded-2xl bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Btn variant="ghost" onClick={addRow} className="mt-2">+ Add Row</Btn>
          </Card>
        )}
        {isDieCut && (
          <Card>
            <h3 className="text-sm font-bold text-[#7B2FBE] mb-2">Die-Cut Sticker Pricing</h3>
            <p className="text-sm text-slate-500">
              Sticker prices are managed in the <strong className="text-[#7B2FBE]">Sticker Prices</strong> section. Click it in the sidebar to edit the full price matrix.
            </p>
          </Card>
        )}

        {!isDieCut && sizes.filter(Boolean).length > 1 && (
          <Card className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#7B2FBE] mb-1">Per-Variant Pricing</h3>
                <p className="text-sm text-slate-500">Set a different price table for each size/type variant</p>
              </div>
              <button type="button" onClick={() => { const v = !useVariantPricing; setUseVariantPricing(v); if (v) syncVariantSizes(sizes) }}
                className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700">
                <span className="relative block h-5 w-10 rounded-full">
                  <span className={`absolute inset-0 rounded-full transition ${useVariantPricing ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  <span className={`absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-all ${useVariantPricing ? 'left-6' : 'left-1'}`} />
                </span>
                <span className={useVariantPricing ? 'text-emerald-600' : 'text-slate-400'}>{useVariantPricing ? '✓ Enabled' : 'Disabled'}</span>
              </button>
            </div>
            {!useVariantPricing && (
              <p className="text-sm text-slate-500">Currently using the shared Price Table above for all sizes. Toggle on to set individual prices per size.</p>
            )}
            {useVariantPricing && (
              <div className="grid gap-4 xl:grid-cols-3 mt-3">
                {sizes.filter(Boolean).map(size => (
                  <div key={size} className="rounded-2xl border p-4 bg-[#f0e8ff66] border-[#7B2FBE66]">
                    <h4 className="text-xs font-bold text-[#7B2FBE] mb-2">📐 {size}</h4>
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#e9e7ff]">
                          <th className="py-1.5 px-2 text-left">Qty</th>
                          <th className="py-1.5 px-2 text-left">Unit ₦</th>
                          <th className="py-1.5 px-2 text-left">Total</th>
                          <th className="py-1.5 px-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {(variantPrices[size] || []).map((row, i) => (
                          <tr key={i} className="border-t border-[#e8dfff]">
                            <td className="py-1.5 px-2">
                              <input type="number" value={row.qty} onChange={e => updateVRow(size, i, 'qty', e.target.value)}
                                className="w-16 rounded-2xl border border-slate-200 px-2 py-1 text-xs text-center text-slate-900" />
                            </td>
                            <td className="py-1.5 px-2">
                              <input type="number" value={row.unitPrice} onChange={e => updateVRow(size, i, 'unitPrice', e.target.value)}
                                className="w-20 rounded-2xl border border-slate-200 px-2 py-1 text-xs text-center text-slate-900" />
                            </td>
                            <td className="py-1.5 px-2 text-xs font-semibold text-[#7B2FBE] whitespace-nowrap">{fmt(row.qty * row.unitPrice)}</td>
                            <td className="py-1.5 px-2">
                              <button onClick={() => removeVRow(size, i)} className="rounded-xl bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={() => addVRow(size)} className="mt-3 rounded-2xl bg-[#f0e8ff] border border-[#7B2FBE66] px-3 py-2 text-xs font-semibold text-[#7B2FBE]">
                      + Add Row
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 mt-5">
        <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '💾 Save Changes'}</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        {override && <Btn variant="danger" onClick={handleReset} className="ml-auto">↺ Reset to Original</Btn>}
        {saved && <span className="text-sm font-semibold text-emerald-700">✓ Saved!</span>}
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-2xl font-black text-slate-900 m-0">Products</h2>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search products…"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none shadow-sm w-full max-w-xs" />
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                {['Product Name', 'Category', 'Base Price', 'Status', 'Actions'].map(h => (
                  <th key={h} className="whitespace-nowrap py-3 px-4 text-left font-semibold text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const hasOverride = !!productOverrides[p.slug]
                const priceTbl = p.priceTable || []
                const basePrice = priceTbl.length > 0 ? `₦${(priceTbl[0].unitPrice).toLocaleString()}/pc` : (p.price ? `₦${Number(p.price).toLocaleString()}` : '—')
                return (
                  <tr key={p.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500">{p.category}</td>
                    <td className="py-3 px-4 text-slate-600">{basePrice}</td>
                    <td className="py-3 px-4">
                      {hasOverride ? <Badge color="#16a34a">Edited</Badge> : <Badge color="#888">Original</Badge>}
                    </td>
                    <td className="py-3 px-4">
                      <Btn onClick={() => setEditingSlug(p.slug)} className="px-4 py-2 text-xs">✏️ Edit</Btn>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
      <h2 className="text-2xl font-black text-slate-900 mb-2">Die-Cut Sticker Prices</h2>
      <p className="text-sm text-slate-500 mb-5">
        Edit base prices for all sticker sizes. Bulk discounts (500+, 1000+) are applied automatically. You can also upload showcase images per size.
      </p>

      {/* Price table */}
      <Card className="mb-4">
        <h3 className="text-sm font-bold text-[#7B2FBE] mb-3">💰 Price Matrix</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="py-3 px-4 text-left font-semibold text-slate-700">Size</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-700">100 pcs (₦ total)</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-700">500 pcs (₦ total)</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-700">1,000 pcs (₦ total)</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-700">Unit @ 100</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(prices).map(([size, p]) => {
                const isChanged = JSON.stringify(p) !== JSON.stringify(base[size] || {})
                return (
                  <tr key={size} className={`${isChanged ? 'bg-emerald-50' : ''} border-t border-slate-200`}>
                    <td className="py-3 px-4 font-semibold text-slate-900">{size}</td>
                    {['p100', 'p500', 'p1000'].map(field => (
                      <td key={field} className="py-3 px-4">
                        <input type="number" value={p[field]} onChange={e => update(size, field, e.target.value)}
                          className="w-28 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-center text-slate-900" />
                      </td>
                    ))}
                    <td className="py-3 px-4 text-sm font-semibold text-[#7B2FBE]">₦{(p.p100 / 100).toLocaleString()}/pc</td>
                    <td className="py-3 px-4">
                      {isChanged ? <Badge color="#16a34a">Modified</Badge> : <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-200">
          <input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder='Add new size (e.g. 5x5")'
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none" />
          <Btn variant="ghost" onClick={addSize}>+ Add Size</Btn>
        </div>
        <SaveBar onSave={handleSave} saving={saving} saved={saved} />
      </Card>

      {/* Sticker size image gallery */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#7B2FBE] mb-1">🖼️ Sticker Showcase Images</h3>
            <p className="text-sm text-slate-500">Upload photos per sticker size — shown on the product page when customers pick that size</p>
          </div>
          <button onClick={() => setShowImages(!showImages)}
            className="rounded-2xl border border-[#7B2FBE66] bg-[#f0e8ff] px-4 py-2 text-sm font-semibold text-[#7B2FBE] hover:bg-[#e8dfff] transition">
            {showImages ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>

        {showImages && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Object.keys(prices).map(size => {
              const imgs = stickerImages[size] || []
              return (
                <div key={size} className="rounded-2xl border border-[#7B2FBE66] bg-[#f8f4ff] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-[#7B2FBE]">📐 {size}</h4>
                    <Badge color={imgs.length > 0 ? '#16a34a' : '#888'}>{imgs.length} photo{imgs.length !== 1 ? 's' : ''}</Badge>
                  </div>
                  {imgs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {imgs.map((url, i) => (
                        <div key={i} className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200">
                          <img src={url} alt={`${size} sticker`} className="h-full w-full object-cover" />
                          <button onClick={() => deleteStickerImg(size, url)}
                            className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-700 text-[10px] text-white shadow-sm">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="block cursor-pointer">
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={e => { Array.from(e.target.files).forEach(f => uploadStickerImg(size, f)) }} />
                    <span className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-semibold ${uploading === size ? 'border-slate-400 bg-slate-400 text-white' : 'border-dashed border-[#7B2FBE] bg-white text-[#7B2FBE]'}`}>
                      {uploading === size ? '⏳ Uploading…' : '⬆ Upload Images'}
                    </span>
                  </label>
                  <p className="mt-2 text-xs text-slate-500 text-center">
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
    ga4Id: '', metaPixelId: '',
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
      <h2 className="text-[20px] font-extrabold text-slate-900 mb-5">Site Settings</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Contact Information</h3>
          <Input label="Company Name" value={form.companyName} onChange={e => set('companyName', e.target.value)} />
          <Input label="Phone Number" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+2348065275264" />
          <Input label="WhatsApp Number (digits only)" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="2348065275264" />
          <Input label="Email Address" value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@sleekbluemediahouz.com" />
          <Input label="Address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Lagos, Nigeria" />
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Homepage Content</h3>
          <Input label="Hero Title" value={form.heroTitle} onChange={e => set('heroTitle', e.target.value)} placeholder="Premium Print, Branding & Design" />
          <Input label="Hero Subtitle" value={form.heroSubtitle} onChange={e => set('heroSubtitle', e.target.value)} placeholder="Zero Stress. Fast Turnaround." />
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Brand Colours</h3>
          <p className="text-sm text-slate-500 mb-4 leading-6">
            Choose your brand colours. Changes are saved and applied to new content. Contact your developer to apply site-wide.
          </p>
          <div className="flex flex-wrap gap-5">
            <div className="min-w-[220px]">
              <label className="block text-[12px] font-semibold text-slate-600 mb-2">Primary Colour</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                  className="h-11 w-12 rounded-[10px] border border-slate-300 p-1 cursor-pointer" />
                <input value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                  className="w-[100px] rounded-2xl border border-slate-300 px-3 py-2 text-sm font-mono" />
                <div className="h-10 w-10 rounded-2xl border border-slate-200" style={{ background: form.primaryColor }} />
              </div>
            </div>
            <div className="min-w-[220px]">
              <label className="block text-[12px] font-semibold text-slate-600 mb-2">Accent Colour</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.accentColor} onChange={e => set('accentColor', e.target.value)}
                  className="h-11 w-12 rounded-[10px] border border-slate-300 p-1 cursor-pointer" />
                <input value={form.accentColor} onChange={e => set('accentColor', e.target.value)}
                  className="w-[100px] rounded-2xl border border-slate-300 px-3 py-2 text-sm font-mono" />
                <div className="h-10 w-10 rounded-2xl border border-slate-200" style={{ background: form.accentColor }} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-[#7B2FBE] mb-3">Current Settings Preview</h3>
          <div className="bg-slate-100 rounded-2xl p-4 text-sm text-slate-600 leading-7">
            <div><strong>Phone:</strong> {form.phone || '—'}</div>
            <div><strong>WhatsApp:</strong> {form.whatsapp ? `https://wa.me/${form.whatsapp}` : '—'}</div>
            <div><strong>Email:</strong> {form.email || '—'}</div>
            <div><strong>Hero:</strong> {form.heroTitle}</div>
            <div><strong>Subtitle:</strong> {form.heroSubtitle}</div>
          </div>
        </Card>
      </div>
      <Card className="mt-4 bg-[#f5f0ff] border border-[#d4b5ff]">
        <h3 className="text-sm font-bold text-[#7B2FBE] mb-2">📊 Analytics Tracking</h3>
        <p className="text-sm text-slate-500 mb-4 leading-6">
          Enter your Google Analytics 4 Measurement ID and/or Meta Pixel ID. Scripts are injected automatically once saved.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Google Analytics 4 ID" value={form.ga4Id} onChange={e => set('ga4Id', e.target.value)} placeholder="G-XXXXXXXXXX" />
          <Input label="Meta Pixel ID" value={form.metaPixelId} onChange={e => set('metaPixelId', e.target.value)} placeholder="1234567890" />
        </div>
        {form.ga4Id && <p className="text-[11px] text-emerald-600 mt-2">✓ GA4 tracking active after save</p>}
        {form.metaPixelId && <p className="text-[11px] text-emerald-600 mt-1">✓ Meta Pixel active after save</p>}
      </Card>

      <Card className="mt-4 bg-[#eff9ff] border border-[#bae6fd]">
        <h3 className="text-sm font-bold text-[#0369a1] mb-2">💾 Data Backup</h3>
        <p className="text-sm text-slate-600 mb-3 leading-6">Download a complete backup of all site data as JSON. Save a copy before making major changes.</p>
        <button onClick={async () => {
          try {
            const res = await fetch('/api/admin/backup', { headers: authH(token) })
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = `sleekblue-backup-${new Date().toISOString().slice(0,10)}.json`; a.click()
            URL.revokeObjectURL(url)
          } catch {}
        }}
          className="rounded-2xl bg-[#0369a1] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#055a8c]">
          ⬇ Download Backup
        </button>
      </Card>
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">T&amp;C Acceptances</h2>
          <p className="text-sm text-slate-500">{acceptances.length} total records</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name, email, phone…"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#7B2FBE] focus:ring-2 focus:ring-[#7B2FBE]/20 w-[260px]" />
          <Btn variant="success" onClick={exportCSV}>⬇ Export CSV</Btn>
        </div>
      </div>
      <Card className="p-0 overflow-hidden">
        {sorted.length === 0
          ? <p className="p-6 text-center text-slate-500">No records found.</p>
          : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    {['#', 'Name', 'Email', 'Phone', 'IP Address', 'Date & Time', 'Version', 'Acceptance ID'].map(h => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-bold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, i) => (
                    <tr key={i} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-500">{acceptances.length - i}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{r.customerName}</td>
                      <td className="px-4 py-3 text-slate-700">{r.email}</td>
                      <td className="px-4 py-3 text-slate-700">{r.phone}</td>
                      <td className="px-4 py-3 text-[11px] font-mono text-slate-500">{r.ipAddress}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(r.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge>{r.termsVersion}</Badge></td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{r.acceptanceId}</td>
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
      <h2 className="text-[20px] font-extrabold text-slate-900 mb-5">Security</h2>
      <div className="max-w-xl">
        <Card>
          <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Change Admin Password</h3>
          <Input label="Current Password" type="password" value={current} onChange={e => setCurrent(e.target.value)} />
          <Input label="New Password" type="password" value={next} onChange={e => setNext(e.target.value)} />
          <Input label="Confirm New Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          {msg && (
            <div className={`rounded-2xl mb-3 px-4 py-3 text-sm ${msg.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {msg.text}
            </div>
          )}
          <Btn onClick={handleChange} disabled={saving}>{saving ? 'Changing…' : '🔑 Change Password'}</Btn>
        </Card>
        <Card className="mt-4 bg-amber-50 border border-amber-200">
          <h4 className="text-sm font-bold text-amber-900 mb-2">⚠️ Security Reminder</h4>
          <p className="text-sm text-amber-900 leading-7">
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
      <Card className="mb-4">
        <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Trust Bar Text</h3>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_2fr]">
          <Input label="Star Rating Text" value={d.rating} onChange={e => setD({ ...d, rating: e.target.value })} placeholder="5.0/5" />
          <Input label="Review Count" value={d.reviewCount} onChange={e => setD({ ...d, reviewCount: e.target.value })} placeholder="500+" />
          <Input label="Tagline (ALL CAPS recommended)" value={d.tagline} onChange={e => setD({ ...d, tagline: e.target.value })} placeholder="TRUSTED BY GLOBAL BRANDS" />
        </div>
      </Card>
      <Card className="mb-4">
        <h3 className="text-sm font-bold text-[#7B2FBE] mb-1">Partner Logos</h3>
        <p className="text-sm text-slate-500 mb-4">Upload your own logo images, toggle visibility, edit names, and reorder. Pre-loaded logos shown by default.</p>
        {d.partners.map((p, i) => (
          <div key={i} className={`flex flex-wrap items-center gap-2 rounded-2xl border p-3 ${p.visible !== false ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-100'}`}>
            {p.url ? (
              <img src={p.url} alt={p.name} className="h-10 w-12 rounded-xl border border-slate-200 object-contain bg-white flex-shrink-0" />
            ) : (
              <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-slate-200 text-[10px] text-slate-500 flex-shrink-0">LOGO</div>
            )}
            <label className="cursor-pointer flex-shrink-0">
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadLogo(i, e.target.files[0])} />
              <span className={`inline-block rounded-xl border px-3 py-2 text-[11px] font-semibold ${uploading === i ? 'bg-slate-400 text-white border-slate-400' : 'bg-[#f0efff] text-[#7B2FBE] border-[#7B2FBE]/30'}`}>
                {uploading === i ? '⏳' : '⬆ Upload'}
              </span>
            </label>
            <button onClick={() => togglePartner(i)} className={`rounded-xl px-3 py-2 text-[12px] font-semibold text-white ${p.visible !== false ? 'bg-emerald-600' : 'bg-slate-400'}`}>{p.visible !== false ? '✓ Visible' : '✗ Hidden'}</button>
            <input value={p.name} onChange={e => updatePartnerName(i, e.target.value)}
              className="min-w-[80px] flex-1 rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none" />
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => movePartner(i, -1)} disabled={i === 0} className="rounded-xl bg-[#f0efff] px-2 text-[11px] font-semibold text-[#7B2FBE]">▲</button>
              <button onClick={() => movePartner(i, 1)} disabled={i === d.partners.length - 1} className="rounded-xl bg-[#f0efff] px-2 text-[11px] font-semibold text-[#7B2FBE]">▼</button>
              <button onClick={() => removePartner(i)} className="rounded-xl bg-rose-100 px-2 text-[12px] font-semibold text-rose-600">×</button>
            </div>
          </div>
        ))}
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-600 mb-2">+ Add New Brand Logo</p>
          <div className="flex flex-wrap items-center gap-3">
            <input value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="Brand name (e.g. Dangote Group)"
              className="min-w-[160px] flex-1 rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none" />
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && addNewBrand(e.target.files[0])} />
              <span className={`inline-block rounded-2xl px-4 py-2 text-sm font-semibold ${uploading === 'new' ? 'bg-slate-400 text-white' : 'bg-[#FF6B00] text-white'}`}>
                {uploading === 'new' ? 'Uploading…' : '⬆ Upload Logo & Add'}
              </span>
            </label>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Enter brand name above, then click to select logo image (PNG, JPG, max 10MB). Click 🚀 Publish to go live.</p>
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
      <Card className="mb-4">
        <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Section Heading</h3>
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <Input label="Heading" value={heading} onChange={e => setHeading(e.target.value)} placeholder="BEST SELLING" />
          <Input label="Sub-heading" value={subheading} onChange={e => setSubheading(e.target.value)} placeholder="our most popular and trusted products" />
        </div>
      </Card>
      <Card className="mb-4">
        <h3 className="text-sm font-bold text-[#7B2FBE] mb-1">Featured Products</h3>
        <p className="text-sm text-slate-500 mb-4">Reorder, toggle visibility, or edit the displayed price text for each product.</p>
        {items.map((item, i) => (
          <div key={i} className={`flex flex-wrap items-center gap-2 rounded-2xl border p-3 ${item.visible !== false ? 'border-[#e0d6f5] bg-white' : 'border-slate-200 bg-slate-100'}`}>
            <button onClick={() => toggleItem(i)} className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white ${item.visible !== false ? 'bg-[#7B2FBE]' : 'bg-slate-400'}`}>
              {item.visible !== false ? '✓ Show' : '✗ Hide'}
            </button>
            <span className="min-w-[100px] flex-1 text-sm font-semibold text-slate-800">{item.name}</span>
            <input value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} placeholder="From ₦22,500"
              className="w-[130px] rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none" />
            <input value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} placeholder="per 500pcs"
              className="w-[110px] rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none" />
            <div className="flex gap-1">
              <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="rounded-xl bg-[#f0efff] px-2 text-[11px] font-semibold text-[#7B2FBE]">▲</button>
              <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} className="rounded-xl bg-[#f0efff] px-2 text-[11px] font-semibold text-[#7B2FBE]">▼</button>
              <button onClick={() => removeItem(i)} className="rounded-xl bg-rose-100 px-2 text-[12px] font-semibold text-rose-600">×</button>
            </div>
          </div>
        ))}
        <div className="mt-3 flex flex-wrap gap-3">
          <input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="Type product slug or name to add…"
            className="flex-1 min-w-[220px] rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
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
      <Card className="mb-4">
        <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Section Heading</h3>
        <div className="grid gap-4 md:grid-cols-[3fr_1fr_1fr]">
          <Input label="Section Heading" value={heading} onChange={e => setHeading(e.target.value)} placeholder="Customers love Sleekblue" />
          <Input label="Rating Text" value={rating} onChange={e => setRating(e.target.value)} placeholder="5.0/5" />
          <Input label="Review Count" value={reviewCount} onChange={e => setReviewCount(e.target.value)} placeholder="500+" />
        </div>
      </Card>
      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-bold text-[#7B2FBE]">Testimonials ({testimonials.length})</h3>
          <Btn onClick={() => setAdding(!adding)} variant={adding ? 'ghost' : 'primary'} className="px-4 py-2 text-sm">{adding ? 'Cancel' : '+ Add Testimonial'}</Btn>
        </div>
        {adding && (
          <div className="mb-4 rounded-2xl border border-[#7B2FBE]/20 bg-[#f0efff] p-4">
            <h4 className="mb-3 text-sm font-bold text-[#7B2FBE]">New Testimonial</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Customer Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emeka Okafor" />
              <Input label="Location (optional)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Lagos, Nigeria" />
            </div>
            <div className="mb-3">
              <label className="mb-2 block text-xs font-semibold text-slate-600">Star Rating</label>
              <div className="flex flex-wrap items-center gap-2">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setForm({ ...form, rating: s })}
                    className={`rounded-2xl px-3 py-2 text-sm font-bold ${s <= form.rating ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-600'}`}>
                    ★
                  </button>
                ))}
                <span className="text-xs text-slate-500">{form.rating} stars</span>
              </div>
            </div>
            <Input label="Review Text *" value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="What did the customer say?" rows={3} />
            <Btn onClick={addT} className="mt-2">+ Add This Testimonial</Btn>
          </div>
        )}
        {testimonials.length === 0 && !adding && (
          <p className="text-center text-sm text-slate-400 p-5">No testimonials yet. Click "+ Add Testimonial" to create your first one.</p>
        )}
        {testimonials.map((t, i) => (
          <div key={i} className={`mb-3 rounded-2xl border p-4 ${t.visible !== false ? 'border-[#e0d6f5] bg-white' : 'border-slate-200 bg-slate-100'}`}>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[220px]">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <input value={t.name} onChange={e => updateT(i, 'name', e.target.value)}
                    className="min-w-[160px] rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none" />
                  <input value={t.location || ''} onChange={e => updateT(i, 'location', e.target.value)} placeholder="Location"
                    className="min-w-[140px] rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-500 outline-none" />
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => updateT(i, 'rating', s)}
                        className={`rounded-xl px-2 text-[11px] ${s <= (t.rating||5) ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-500'}`}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <textarea value={t.text} onChange={e => updateT(i, 'text', e.target.value)} rows={2}
                  className="min-h-[84px] w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none resize-vertical" />
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={() => toggleT(i)} className={`rounded-2xl px-3 py-2 text-xs font-semibold ${t.visible !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{t.visible !== false ? '✓ Visible' : '✗ Hidden'}</button>
                <button onClick={() => moveT(i, -1)} disabled={i === 0} className="rounded-2xl bg-[#f0efff] px-3 py-2 text-xs font-semibold text-[#7B2FBE]">▲</button>
                <button onClick={() => moveT(i, 1)} disabled={i === testimonials.length - 1} className="rounded-2xl bg-[#f0efff] px-3 py-2 text-xs font-semibold text-[#7B2FBE]">▼</button>
                <button onClick={() => removeT(i)} className="rounded-2xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-600">×</button>
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
      <Card className="mb-4">
        <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Footer Tagline</h3>
        <Input label="Tagline Text" value={tagline} onChange={e => setTagline(e.target.value)} rows={3} placeholder="Premium print, branding & design solutions…" />
      </Card>
      <Card className="mb-4">
        <h3 className="text-sm font-bold text-[#7B2FBE] mb-1">Services List</h3>
        <p className="text-sm text-slate-500 mb-4">These appear in the "Services" column in the footer. Reorder or edit as needed.</p>
        {services.map((s, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 mb-2">
            <input value={s} onChange={e => updateService(i, e.target.value)}
              className="flex-1 rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none" />
            <button onClick={() => moveService(i, -1)} disabled={i === 0} className="rounded-xl bg-[#f0efff] px-3 py-2 text-[11px] font-semibold text-[#7B2FBE]">▲</button>
            <button onClick={() => moveService(i, 1)} disabled={i === services.length - 1} className="rounded-xl bg-[#f0efff] px-3 py-2 text-[11px] font-semibold text-[#7B2FBE]">▼</button>
            <button onClick={() => removeService(i)} className="rounded-xl bg-rose-100 px-3 py-2 text-[11px] font-semibold text-rose-600">×</button>
          </div>
        ))}
        <Btn variant="ghost" onClick={() => setServices([...services, ''])} className="mt-2">+ Add Service</Btn>
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
      <Card className="mb-4">
        <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Contact Information</h3>
        <p className="text-sm text-slate-500 mb-4 leading-7">
          These details appear in the footer, WhatsApp links, and contact sections across the entire website. Click 🚀 Publish to push changes live.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Company Name" value={form.companyName || ''} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="Sleekblue Media Houz" />
          <Input label="Phone Number (with country code)" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+234 806 527 5264" />
          <Input label="WhatsApp Number (digits only, no +)" value={form.whatsapp || ''} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="2348065275264" />
          <Input label="Email Address" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="info@sleekbluemediahouz.com" />
          <Input label="Address / Location" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Lagos, Nigeria" />
        </div>
        <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600 leading-7">
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
      <div className="mb-5">
        <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">Content Management</h2>
        <p className="text-sm text-slate-500">Edit every text section and content block visible on the website. Click 🚀 Publish to push any section live.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${tab === t.id ? 'bg-[#7B2FBE] text-white' : 'bg-white text-slate-600 shadow-sm'}`}>
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
    authorName: '', authorBio: '', publishAt: '',
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
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Btn variant="ghost" onClick={onCancel} className="px-4 py-2">← Back</Btn>
        <h2 className="text-[20px] font-extrabold text-slate-900 m-0">
          {isNew ? '✍️ New Blog Post' : '✏️ Edit Post'}
        </h2>
        {!isNew && <Badge color={form.status === 'published' ? '#16a34a' : '#f59e0b'}>{form.status === 'published' ? 'Published' : 'Draft'}</Badge>}
      </div>
      {msg && <div className={`mb-4 rounded-2xl px-4 py-3 text-sm ${msg.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg.text}</div>}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Post Details</h3>
            <Input label="Post Title *" value={form.title} onChange={e => { set('title', e.target.value); if (!post?.slug) set('slug', slugify(e.target.value)) }} placeholder="Enter a compelling title…" />
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="URL Slug" value={form.slug} onChange={e => set('slug', slugify(e.target.value))} placeholder="url-friendly-slug" />
              <Input label="Category" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Branding Tips" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              <Input label="Tags (comma separated)" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="stickers, branding, tips" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Author Name" value={form.authorName || ''} onChange={e => set('authorName', e.target.value)} placeholder="e.g. Sleekblue Team" />
              <Input label="Schedule Publish At (optional)" type="datetime-local" value={form.publishAt || ''} onChange={e => set('publishAt', e.target.value)} />
            </div>
            <Input label="Author Bio (optional)" value={form.authorBio || ''} onChange={e => set('authorBio', e.target.value)} rows={2} placeholder="Brief bio shown at the bottom of the post…" />
            <Input label="Excerpt / Summary" value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} placeholder="A short summary that appears on the blog list page…" />
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Content</h3>
            <p className="text-sm text-slate-500 mb-4">Use the rich text editor below — format headings, bold, lists, links, and more.</p>
            <TiptapEditor
              value={form.content}
              onChange={v => set('content', v)}
              placeholder="Write your full blog post here…"
              height={460}
            />
          </Card>
        </div>

        <Card>
          <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Cover Image</h3>
          {form.coverImage && (
            <div className="relative mb-3 overflow-hidden rounded-2xl">
              <img src={form.coverImage} alt="Cover" className="block h-[160px] w-full object-cover" />
              <button onClick={() => set('coverImage', '')} className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white">×</button>
            </div>
          )}
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadMedia(e.target.files[0], 'coverImage')} />
            <div className="rounded-2xl border border-slate-300 bg-slate-50 p-5 text-center">
              <div className="text-2xl mb-2">🖼️</div>
              <p className="text-sm text-slate-500">{uploading ? 'Uploading…' : 'Click to upload cover image'}</p>
            </div>
          </label>
          <Input label="Or enter image URL" value={form.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="https://…" className="mt-3" />
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Media Files</h3>
          <p className="text-sm text-slate-500 mb-3">Upload additional images that appear in a gallery at the bottom of the post.</p>
          {form.mediaFiles?.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-3 mb-3">
              {form.mediaFiles.map((url, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-2xl">
                  <img src={url} alt={`Media ${i+1}`} className="h-full w-full object-cover" />
                  <button onClick={() => set('mediaFiles', form.mediaFiles.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white">×</button>
                </div>
              ))}
            </div>
          )}
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => Array.from(e.target.files).forEach(f => uploadMedia(f, 'media'))} />
            <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">⬆ Upload images (select multiple)</p>
            </div>
          </label>
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Video</h3>
          <Input label="YouTube URL or direct video URL" value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=…" />
          {form.videoUrl && <p className="mt-2 text-[11px] text-emerald-600">✓ Video will be embedded in the post</p>}
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-[#7B2FBE] mb-4">Audio</h3>
          {form.audioUrl && (
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-[#f5f0ff] p-3 text-sm text-[#7B2FBE]">
              <span>🎙️ Audio uploaded</span>
              <button onClick={() => set('audioUrl', '')} className="text-rose-600">×</button>
            </div>
          )}
          <label className="block cursor-pointer mb-3">
            <input type="file" accept="audio/*" className="hidden" onChange={e => e.target.files[0] && uploadMedia(e.target.files[0], 'audioUrl')} />
            <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">🎙️ Upload audio file (MP3, WAV…)</p>
            </div>
          </label>
          <Input label="Or enter audio URL" value={form.audioUrl} onChange={e => set('audioUrl', e.target.value)} placeholder="https://…" />
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5 mt-6">
        <Btn onClick={() => handleSave('published')} disabled={saving} className="min-w-[160px] bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving…' : '🚀 Publish Post'}</Btn>
        <Btn variant="ghost" onClick={() => handleSave('draft')} disabled={saving}>💾 Save as Draft</Btn>
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">Blog Manager</h2>
          <p className="text-sm text-slate-500">{localPosts.filter(p => p.status === 'published').length} published · {localPosts.filter(p => p.status === 'draft').length} drafts · Drag rows to reorder</p>
        </div>
        <Btn onClick={() => setCreating(true)}>✍️ New Blog Post</Btn>
      </div>

      {localPosts.length === 0 && (
        <Card className="text-center p-16">
          <div className="text-4xl mb-4">✍️</div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No blog posts yet</h3>
          <p className="text-sm text-slate-500 mb-5">Create your first post to engage your audience and boost SEO.</p>
          <Btn onClick={() => setCreating(true)}>✍️ Create First Post</Btn>
        </Card>
      )}

      {localPosts.map((post, idx) => (
        <div key={post.id} draggable onDragStart={e => handleDragStart(e, idx)} onDragOver={e => { e.preventDefault(); setDragOver(idx) }} onDrop={e => handleDrop(e, idx)} onDragLeave={() => setDragOver(null)}
          className={`mb-2 flex min-w-0 flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-border ${dragOver === idx ? 'border-2 border-[#7B2FBE]' : 'border-2 border-transparent'}`}>
          <div className="text-slate-400 text-xl flex-shrink-0 cursor-grab select-none">⠿</div>
          {post.coverImage
            ? <img src={post.coverImage} alt="" className="h-[40px] w-[56px] rounded-lg object-cover flex-shrink-0" />
            : <div className="flex h-[40px] w-[56px] items-center justify-center rounded-lg bg-[#f0e8ff] text-lg flex-shrink-0">✍️</div>
          }
          <div className="min-w-[120px] flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-slate-900">{post.title || 'Untitled'}</span>
              <Badge color={post.status === 'published' ? '#16a34a' : '#f59e0b'}>{post.status === 'published' ? 'Published' : 'Draft'}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
              {post.category && <span>{post.category}</span>}
              {post.date && <span>{post.date}</span>}
              {post.videoUrl && <span>🎬</span>}
              {post.audioUrl && <span>🎙️</span>}
              {post.mediaFiles?.length > 0 && <span>🖼️{post.mediaFiles.length}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Btn variant="ghost" onClick={() => setEditing(post)} className="px-3 py-2 text-sm">✏️ Edit</Btn>
            <Btn variant="danger" onClick={() => handleDelete(post.id)} disabled={deleting === post.id} className="px-3 py-2 text-sm">{deleting === post.id ? '…' : '🗑️'}</Btn>
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
      <div className="mb-5">
        <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">About Us Page</h2>
        <p className="text-sm text-slate-500">Edit every section of the About Us page. Click 🚀 Publish to go live.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${tab === t.id ? 'bg-[#7B2FBE] text-white' : 'bg-white text-slate-600 shadow-sm'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hero' && (
        <Card>
          <h3 className="mb-4 text-sm font-bold text-[#7B2FBE]">Hero Section</h3>
          <Input label="Hero Title" value={d.heroTitle} onChange={e => set('heroTitle', e.target.value)} placeholder="About Sleekblue Media Houz" />
          <Input label="Hero Subtitle" value={d.heroSubtitle} onChange={e => set('heroSubtitle', e.target.value)} rows={2} placeholder="We print for the biggest brands…" />
        </Card>
      )}

      {tab === 'content' && (
        <>
          <Card className="mb-4">
            <h3 className="mb-4 text-sm font-bold text-[#7B2FBE]">Who We Are</h3>
            <Input label="Section Title" value={d.whoWeAreTitle} onChange={e => set('whoWeAreTitle', e.target.value)} />
            <Input label="Content" value={d.whoWeAre} onChange={e => set('whoWeAre', e.target.value)} rows={5} />
          </Card>
          <Card>
            <h3 className="mb-4 text-sm font-bold text-[#7B2FBE]">Our Mission</h3>
            <Input label="Section Title" value={d.missionTitle} onChange={e => set('missionTitle', e.target.value)} />
            <Input label="Content" value={d.mission} onChange={e => set('mission', e.target.value)} rows={4} />
          </Card>
        </>
      )}

      {tab === 'values' && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-[#7B2FBE]">Values / What Sets Us Apart</h3>
            <Btn onClick={addValue} className="px-4 py-2 text-sm">+ Add Value</Btn>
          </div>
          <Input label="Section Title" value={d.valuesTitle} onChange={e => set('valuesTitle', e.target.value)} placeholder="What Sets Us Apart" />
          {d.values.map((v, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[60px_1fr_1fr_36px] mb-2 items-start rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <input value={v.icon} onChange={e => updateValue(i, 'icon', e.target.value)} className="rounded-2xl border border-slate-300 px-2 py-1 text-2xl text-center" />
              <input value={v.title} onChange={e => updateValue(i, 'title', e.target.value)} placeholder="Title" className="rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none" />
              <input value={v.desc} onChange={e => updateValue(i, 'desc', e.target.value)} placeholder="Description" className="rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none" />
              <button onClick={() => removeValue(i)} className="rounded-2xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-600">×</button>
            </div>
          ))}
        </Card>
      )}

      {tab === 'serve' && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-[#7B2FBE]">Who We Serve</h3>
            <Btn onClick={() => set('whoWeServe', [...d.whoWeServe, ''])} className="px-4 py-2 text-sm">+ Add</Btn>
          </div>
          <Input label="Section Title" value={d.whoWeServeTitle} onChange={e => set('whoWeServeTitle', e.target.value)} />
          {d.whoWeServe.map((s, i) => (
            <div key={i} className="mb-2 flex flex-wrap items-center gap-2">
              <input value={s} onChange={e => updateServe(i, e.target.value)} className="flex-1 rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none" />
              <button onClick={() => removeServe(i)} className="rounded-2xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-600">×</button>
            </div>
          ))}
        </Card>
      )}

      {tab === 'stats' && (
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-[#7B2FBE]">Stats Bar</h3>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={d.showStats} onChange={e => set('showStats', e.target.checked)} /> Show stats bar
              </label>
              <Btn onClick={() => set('stats', [...d.stats, { value: '0', label: 'New Stat' }])} className="px-4 py-2 text-sm">+ Add Stat</Btn>
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-4">Purple stats bar shown just below the hero banner.</p>
          {d.stats.map((s, i) => (
            <div key={i} className="mb-2 flex flex-wrap items-center gap-2">
              <input value={s.value} onChange={e => updateStat(i, 'value', e.target.value)} placeholder="500+" className="w-[100px] rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none" />
              <input value={s.label} onChange={e => updateStat(i, 'label', e.target.value)} placeholder="Happy Clients" className="flex-1 rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none" />
              <button onClick={() => removeStat(i)} className="rounded-2xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-600">×</button>
            </div>
          ))}
        </Card>
      )}

      {tab === 'cta' && (
        <Card>
          <h3 className="mb-4 text-sm font-bold text-[#7B2FBE]">Call to Action Section</h3>
          <Input label="CTA Title" value={d.ctaTitle} onChange={e => set('ctaTitle', e.target.value)} placeholder="Ready to Print?" />
          <Input label="CTA Text" value={d.ctaText} onChange={e => set('ctaText', e.target.value)} rows={2} placeholder="Call us or chat on WhatsApp…" />
          <p className="mt-[-8px] text-[11px] text-slate-400">Phone and WhatsApp numbers are pulled from Site Settings → Contact Information.</p>
        </Card>
      )}

      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  )
}

// ─── SEO Manager ──────────────────────────────────────────────────────────────
// ─── WhatsApp Leads ───────────────────────────────────────────────────────────
function LeadsView({ token }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/admin/leads', { headers: authH(token) })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setLeads(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function deleteLead(id) {
    await fetch(`/api/admin/leads/${id}`, { method: 'DELETE', headers: authH(token) })
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  async function followUp(id) {
    const res = await fetch(`/api/admin/leads/${id}/follow-up`, { method: 'PATCH', headers: authH(token) })
    const data = await res.json()
    setLeads(prev => prev.map(l => l.id === id ? { ...l, followedUp: data.followedUp, followedUpAt: data.followedUp ? new Date().toISOString() : null } : l))
  }

  function exportCSV() {
    const rows = [['Name', 'Phone', 'Date'], ...leads.map(l => [l.name || '', l.phone, new Date(l.timestamp).toLocaleDateString('en-NG')])]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'sleekblue-wa-leads.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function copyAll() {
    const text = leads.map(l => `${l.name ? l.name + ' — ' : ''}${l.phone}`).join('\n')
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
  }

  function fmt(ts) {
    try { return new Date(ts).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return ts }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">📲 WhatsApp Leads</h2>
          <p className="text-sm text-slate-500">Customers who subscribed via the WhatsApp deals popup</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={copyAll} className="bg-emerald-600 text-white font-semibold text-sm">{copied ? '✓ Copied!' : '📋 Copy All Numbers'}</Btn>
          <Btn onClick={exportCSV} className="bg-[#7B2FBE] text-white font-semibold text-sm">⬇️ Export CSV</Btn>
        </div>
      </div>

      {loading ? (
        <Card><p className="text-sm text-slate-500 m-0">Loading…</p></Card>
      ) : leads.length === 0 ? (
        <Card className="text-center p-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-lg font-bold text-slate-900 mb-2">No subscribers yet</p>
          <p className="text-sm text-slate-500">The WhatsApp deals popup is live on your site. Subscribers will appear here.</p>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm font-extrabold text-emerald-700 mb-1">{leads.length} Subscriber{leads.length !== 1 ? 's' : ''}</p>
              <p className="text-sm text-slate-600">You can broadcast deals to all these numbers on WhatsApp</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {leads.map((lead, i) => (
              <Card key={lead.id || i} className="flex flex-wrap items-center gap-4 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-lg flex-shrink-0">👤</div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-semibold text-slate-900 mb-1">
                    {lead.name || <span className="text-slate-400 font-normal">No name</span>}
                  </p>
                  <p className="text-sm font-semibold text-emerald-600">{lead.phone}</p>
                </div>
                <p className="text-xs text-slate-500 text-right min-w-[90px]">{fmt(lead.timestamp)}</p>
                <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  className="rounded-2xl bg-emerald-600 px-3 py-2 text-[12px] font-semibold text-white whitespace-nowrap">💬 Chat</a>
                <button onClick={() => followUp(lead.id)}
                  className={`rounded-2xl px-3 py-2 text-[12px] font-semibold whitespace-nowrap ${lead.followedUp ? 'border border-emerald-300 bg-emerald-50 text-emerald-700' : 'border border-slate-300 bg-white text-slate-700'}`}>
                  {lead.followedUp ? '✓ Done' : '📞 Follow Up'}
                </button>
                <button onClick={() => deleteLead(lead.id)}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-600">🗑</button>
              </Card>
            ))}
          </div>
        </>
      )}

      <Card className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <h3 className="text-sm font-bold text-emerald-700 mb-2">💡 How to use these leads</h3>
        <ul className="space-y-2 text-sm text-slate-600 pl-4">
          <li>Copy all numbers and paste into a WhatsApp broadcast list to send bulk deals</li>
          <li>Export to CSV and import into a CRM or email tool</li>
          <li>Directly chat with individual customers using the "Chat" button</li>
          <li>The popup shows 18 seconds after visiting or after scrolling 35% down the page</li>
        </ul>
      </Card>
    </div>
  )
}

// ─── FAQ Manager ──────────────────────────────────────────────────────────────
const DEFAULT_FAQ_ITEMS = [
  { question: 'What types of printing services does Sleekblue Media Houz offer?', answer: 'We offer a wide range of premium printing and branding services including die-cut stickers, flex banners, flyers & posters, business cards, rollup stands, T-shirts & caps, product labels, vehicle branding, signage & billboards, burial brochures, and corporate graphic design.' },
  { question: 'What is the minimum order quantity?', answer: "Minimum order quantities vary by product. For die-cut stickers, our minimum is 100 pieces. For flyers and business cards, it's typically 50–100 pieces. Flex banners and rollup stands can be ordered as a single piece." },
  { question: 'How long does production and delivery take?', answer: 'Standard production takes 1–3 business days for most products. Rush orders can be completed in 24 hours for an additional fee. We deliver nationwide across Nigeria, with delivery typically taking 1–3 extra days depending on your location.' },
  { question: 'Do you offer custom design services?', answer: "Yes! Our in-house design team can create professional artwork for any of our products — from logo design and full brand identity packages to individual print files. Design turnaround is usually 24–48 hours." },
  { question: 'Do you deliver nationwide across Nigeria?', answer: "Absolutely. We deliver to all 36 states and the FCT via trusted courier partners. Whether you're in Lagos, Abuja, Port Harcourt, Kano, or anywhere else in Nigeria, we'll get your prints to you safely." },
  { question: 'How do I place an order and what payment methods do you accept?', answer: 'You can place an order directly on our website or chat with us on WhatsApp at +234 806 527 5264. We accept bank transfers, mobile payments, and online card payments. Once payment is confirmed, your order goes straight to production.' },
]

function FaqView({ token }) {
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const [addMode, setAddMode] = useState(false)

  useEffect(() => {
    fetch('/api/content')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setItems(d?.faq?.length ? d.faq : DEFAULT_FAQ_ITEMS) })
      .catch(() => setItems(DEFAULT_FAQ_ITEMS))
  }, [])

  async function save(updated) {
    setSaving(true)
    const list = updated || items
    await fetch('/api/admin/faq', { method: 'PUT', headers: authH(token), body: JSON.stringify({ faq: list }) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  function deleteItem(i) {
    const next = items.filter((_, idx) => idx !== i)
    setItems(next); save(next)
  }

  function addItem() {
    if (!newQ.trim() || !newA.trim()) return
    const next = [...items, { question: newQ.trim(), answer: newA.trim() }]
    setItems(next); setNewQ(''); setNewA(''); setAddMode(false); save(next)
  }

  function updateItem(i, field, val) {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it)
    setItems(next)
  }

  function moveItem(i, dir) {
    if (i + dir < 0 || i + dir >= items.length) return
    const next = [...items]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    setItems(next); save(next)
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">❓ FAQ Manager</h2>
        <p className="text-sm text-slate-500 m-0">Manage the FAQ section shown on your homepage. These questions are also embedded as schema markup for Google featured snippets.</p>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {items.map((item, i) => (
          <Card key={i} className="relative">
            {editIdx === i ? (
              <>
                <Input label="Question" value={item.question} onChange={e => updateItem(i, 'question', e.target.value)} />
                <Input label="Answer" rows={3} value={item.answer} onChange={e => updateItem(i, 'answer', e.target.value)} />
                <div className="mt-1 flex flex-wrap gap-2">
                  <Btn onClick={() => { setEditIdx(null); save() }} className="bg-[#7B2FBE] text-white font-semibold">✓ Save</Btn>
                  <Btn variant="ghost" onClick={() => setEditIdx(null)}>Cancel</Btn>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <p className="text-[13.5px] font-bold text-slate-900 mb-1">{item.question}</p>
                    <p className="text-[12.5px] leading-6 text-slate-600 m-0">{item.answer}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button onClick={() => moveItem(i, -1)} disabled={i === 0} title="Move up"
                      className={`rounded-2xl border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[12px] ${i === 0 ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-slate-200'}`}>↑</button>
                    <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} title="Move down"
                      className={`rounded-2xl border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[12px] ${i === items.length - 1 ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-slate-200'}`}>↓</button>
                    <button onClick={() => setEditIdx(i)}
                      className="rounded-2xl border border-[#7B2FBE]/20 bg-[#f0e8ff] px-2.5 py-1.5 text-[12px] font-semibold text-[#7B2FBE]">✏️</button>
                    <button onClick={() => deleteItem(i)}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[12px] text-rose-600">🗑</button>
                  </div>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>

      {addMode ? (
        <Card className="bg-[#f9f5ff] border-[1.5px] border-[#7B2FBE]/20">
          <h4 className="text-[13px] font-bold text-[#7B2FBE] mb-4">Add New Question</h4>
          <Input label="Question" value={newQ} onChange={e => setNewQ(e.target.value)} placeholder="e.g. Do you do same-day delivery?" />
          <Input label="Answer" rows={3} value={newA} onChange={e => setNewA(e.target.value)} placeholder="Enter the detailed answer…" />
          <div className="mt-2 flex flex-wrap gap-3">
            <Btn onClick={addItem} className="bg-[#7B2FBE] text-white font-semibold">✓ Add Question</Btn>
            <Btn variant="ghost" onClick={() => { setAddMode(false); setNewQ(''); setNewA('') }}>Cancel</Btn>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAddMode(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#7B2FBE]/50 bg-white px-5 py-4 text-sm font-semibold text-[#7B2FBE]">
          + Add New FAQ Question
        </button>
      )}

      <Card className="mt-4 rounded-2xl bg-[#f9f5ff] p-4">
        <h3 className="mb-2 text-sm font-bold text-[#7B2FBE]">💡 About FAQ Schema</h3>
        <p className="text-sm leading-7 text-slate-600">
          These FAQ items are automatically embedded as <strong>FAQPage schema markup</strong> in your homepage. This helps Google show your Q&A directly in search results as featured snippets, driving more traffic without paid ads. Aim for 6–10 clear, helpful questions.
        </p>
      </Card>

      {(saved || saving) && (
        <div className={`fixed bottom-6 right-6 z-[9999] rounded-xl px-5 py-3 text-sm font-semibold text-white ${saving ? 'bg-slate-600' : 'bg-emerald-600'}`}>
          {saving ? '⏳ Saving…' : '✓ FAQ saved!'}
        </div>
      )}
    </div>
  )
}

// ─── Newsletter Manager ────────────────────────────────────────────────────────
function NewsletterView({ token }) {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/newsletter', { headers: authH(token) })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setSubs(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function exportCSV() {
    const rows = [['Email', 'Name', 'Date'], ...subs.map(s => [s.email, s.name || '', new Date(s.timestamp).toLocaleDateString('en-NG')])]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sleekblue-newsletter.csv'; a.click(); URL.revokeObjectURL(url)
  }

  async function del(id) {
    await fetch(`/api/admin/newsletter/${id}`, { method: 'DELETE', headers: authH(token) })
    setSubs(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">📧 Newsletter Subscribers</h2>
          <p className="text-sm text-slate-500">{subs.length} subscriber{subs.length !== 1 ? 's' : ''} collected</p>
        </div>
        <Btn onClick={exportCSV} className="bg-[#7B2FBE] text-white font-semibold text-sm">⬇ Export CSV</Btn>
      </div>
      {loading ? <Card><p className="text-sm text-slate-500 m-0">Loading…</p></Card> : subs.length === 0 ? (
        <Card className="text-center p-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-lg font-bold text-slate-900 mb-2">No subscribers yet</p>
          <p className="text-sm text-slate-500">Add the newsletter widget to your site to start collecting emails.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {subs.map((s, i) => (
            <Card key={s.id || i} className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-lg bg-[#7B2FBE]/10">📧</div>
              <div className="flex-1 min-w-[180px]">
                <p className="text-sm font-semibold text-slate-900 mb-1">{s.email}</p>
                {s.name && <p className="text-sm text-slate-500 m-0">{s.name}</p>}
              </div>
              <p className="text-xs text-slate-500">{new Date(s.timestamp).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <button onClick={() => del(s.id)} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">🗑</button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Comments Moderator ────────────────────────────────────────────────────────
function CommentsView({ token }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/admin/comments', { headers: authH(token) })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setComments(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function approve(id) {
    await fetch(`/api/admin/comments/${id}/approve`, { method: 'PATCH', headers: authH(token) })
    setComments(prev => prev.map(c => c.id === id ? { ...c, approved: true } : c))
  }

  async function del(id) {
    await fetch(`/api/admin/comments/${id}`, { method: 'DELETE', headers: authH(token) })
    setComments(prev => prev.filter(c => c.id !== id))
  }

  const visible = comments.filter(c => filter === 'all' ? true : filter === 'pending' ? !c.approved : c.approved)
  const pending = comments.filter(c => !c.approved).length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">💬 Comment Moderation</h2>
          <p className="text-sm text-slate-500">{pending} pending approval · {comments.length} total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'approved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${filter === f ? 'border border-[#7B2FBE] bg-[#7B2FBE] text-white' : 'border border-slate-300 bg-white text-slate-600'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {loading ? <Card><p className="text-sm text-slate-500 m-0">Loading…</p></Card> : visible.length === 0 ? (
        <Card className="text-center p-12">
          <p className="text-lg font-bold text-slate-900 m-0">No comments here</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map(c => (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base ${c.approved ? 'bg-emerald-100 border border-emerald-200 text-emerald-700' : 'bg-amber-100 border border-amber-200 text-amber-700'}`}>
                  {c.approved ? '✓' : '⏳'}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-semibold text-[#7B2FBE]">on /{c.slug}</span>
                    <span className="text-[11px] text-slate-400">{new Date(c.timestamp).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {c.approved && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">✓ Approved</span>}
                  </div>
                  <p className="text-sm leading-7 text-slate-700">{c.comment}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!c.approved && (
                    <button onClick={() => approve(c.id)} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">✓ Approve</button>
                  )}
                  <button onClick={() => del(c.id)} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">🗑</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Reviews Pending ───────────────────────────────────────────────────────────
function ReviewsPendingView({ token }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/reviews', { headers: authH(token) })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setReviews(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function approve(id) {
    await fetch(`/api/admin/reviews/${id}/approve`, { method: 'PATCH', headers: authH(token) })
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  async function del(id) {
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE', headers: authH(token) })
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">⭐ Pending Reviews</h2>
        <p className="text-sm text-slate-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''} awaiting approval. Approved reviews appear on the homepage.</p>
      </div>
      {loading ? <Card><p className="text-sm text-slate-500 m-0">Loading…</p></Card> : reviews.length === 0 ? (
        <Card className="text-center p-12">
          <div className="text-4xl mb-3">⭐</div>
          <p className="text-lg font-bold text-slate-900 mb-2">No pending reviews</p>
          <p className="text-sm text-slate-500">New review submissions will appear here.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map(r => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl">👤</div>
                <div className="flex-1 min-w-[180px]">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-900">{r.name}</span>
                    {r.location && <span className="text-xs text-slate-500">📍 {r.location}</span>}
                    <span className="text-sm">{'★'.repeat(r.rating || 5)}</span>
                    <span className="text-xs text-slate-400">{new Date(r.timestamp).toLocaleDateString('en-NG')}</span>
                  </div>
                  <p className="text-sm leading-7 text-slate-700">{r.text}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => approve(r.id)} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">✓ Approve</button>
                  <button onClick={() => del(r.id)} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">✗ Reject</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Referrals Manager ─────────────────────────────────────────────────────────
function ReferralsView({ token }) {
  const [refs, setRefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', contact: '' })
  const [creating, setCreating] = useState(false)
  const [newRef, setNewRef] = useState(null)

  useEffect(() => {
    fetch('/api/admin/referrals', { headers: authH(token) })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setRefs(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function create() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/referral/generate', { method: 'POST', headers: { ...authH(token), 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (data.ok) { setNewRef(data); setRefs(prev => [{ id: data.code, code: data.code, name: form.name, contact: form.contact, createdAt: new Date().toISOString(), clicks: 0 }, ...prev]); setForm({ name: '', contact: '' }) }
    } catch {}
    setCreating(false)
  }

  async function del(id) {
    await fetch(`/api/admin/referrals/${id}`, { method: 'DELETE', headers: authH(token) })
    setRefs(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">🔗 Referral Links</h2>
        <p className="text-sm text-slate-500">Create unique referral links for partners and track their performance.</p>
      </div>

      <Card className="mb-5">
        <h3 className="mb-4 text-sm font-bold text-[#7B2FBE]">Generate New Referral Link</h3>
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] items-end">
          <Input label="Partner Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Tunde Bakare" />
          <Input label="Contact (optional)" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Phone or email" />
          <button onClick={create} disabled={creating || !form.name.trim()}
            className="rounded-2xl bg-[#7B2FBE] px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50">
            {creating ? '⏳' : '+ Create'}
          </button>
        </div>
        {newRef && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="mb-2 text-xs font-bold text-emerald-700">✓ Link created!</p>
            <p className="text-sm text-slate-600 break-words">
              <strong>URL:</strong> {newRef.url}
            </p>
            <button onClick={() => navigator.clipboard.writeText(newRef.url)}
              className="mt-3 rounded-2xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white">
              📋 Copy Link
            </button>
          </div>
        )}
      </Card>

      {loading ? <Card><p className="text-sm text-slate-500 m-0">Loading…</p></Card> : refs.length === 0 ? (
        <Card className="text-center p-8">
          <p className="text-lg font-bold text-slate-900 m-0">No referral links yet</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {refs.map(r => (
            <Card key={r.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex-1 min-w-[180px]">
                <p className="text-sm font-semibold text-slate-900 mb-1">{r.name}</p>
                <p className="mb-1 text-sm font-mono text-slate-500">
                  sleekbluemediahouz.com?ref=<strong className="text-[#7B2FBE]">{r.code}</strong>
                </p>
                {r.contact && <p className="text-xs text-slate-400">{r.contact}</p>}
              </div>
              <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-center">
                <p className="text-xl font-extrabold text-[#7B2FBE] mb-1">{r.clicks || 0}</p>
                <p className="text-[10px] text-slate-500">Clicks</p>
              </div>
              <button onClick={() => navigator.clipboard.writeText(`https://sleekbluemediahouz.com?ref=${r.code}`)}
                className="rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-[#7B2FBE]">📋</button>
              <button onClick={() => del(r.id)} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">🗑</button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SEO Agent ────────────────────────────────────────────────────────────────
function SeoAgentView({ token }) {
  const [audit, setAudit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  function fetchAudit() {
    setLoading(true)
    fetch('/api/admin/seo-audit', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setAudit(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchAudit() }, [])

  function scoreColor(s) {
    if (s >= 80) return '#22c55e'
    if (s >= 55) return '#f59e0b'
    return '#ef4444'
  }

  function scoreLabel(s) {
    if (s >= 80) return 'Good'
    if (s >= 55) return 'Needs Work'
    return 'Critical'
  }

  function sevIcon(sev) {
    if (sev === 'critical') return { icon: '🔴', color: '#ef4444' }
    if (sev === 'warn')     return { icon: '🟡', color: '#f59e0b' }
    return { icon: '🔵', color: '#60a5fa' }
  }

  if (loading) return <div className="p-10 text-center text-slate-500">Running SEO audit…</div>
  if (!audit) return <div className="p-10 text-center text-rose-500">Failed to load audit.</div>

  const allPages = [...(audit.pages || []), ...(audit.posts || [])]

  return (
    <div className="mx-auto max-w-[960px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">🤖 SEO Agent</h2>
          <p className="text-sm text-slate-500">Automated audit across all pages and blog posts</p>
        </div>
        <button onClick={fetchAudit} className="rounded-2xl bg-[#7B2FBE] px-5 py-3 text-sm font-semibold text-white">↻ Re-scan</button>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-4 mb-7">
        {[
          { label: 'Overall Score', value: `${audit.avgScore}`, unit: '/100', color: scoreColor(audit.avgScore) },
          { label: 'Pages Audited', value: audit.total, unit: 'pages', color: '#6366f1' },
          { label: 'Critical Issues', value: audit.critical, unit: 'issues', color: '#ef4444' },
          { label: 'Warnings', value: audit.warnings, unit: 'warnings', color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="rounded-[12px] bg-white p-5 shadow-sm" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="text-3xl font-bold" style={{ color: k.color }}>
              {k.value}
              <span className="ml-1 text-sm font-normal text-slate-400">{k.unit}</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Score dial */}
      <div className="rounded-[12px] bg-white p-6 shadow-sm mb-7">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Page-by-Page Scores</h3>
        <div className="flex flex-col gap-3">
          {allPages.map(p => (
            <div key={p.key}>
              <button
                type="button"
                onClick={() => setExpanded(expanded === p.key ? null : p.key)}
                className="flex w-full items-center gap-3 border-b border-slate-200 py-2 text-left text-sm text-slate-700"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: scoreColor(p.score) }}>
                  {p.score}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">{p.label}</div>
                  <div className="text-xs text-slate-500">{p.path}</div>
                </div>
                <span className="rounded-full border px-3 py-1 text-[11px] font-semibold" style={{ background: scoreColor(p.score) + '20', color: scoreColor(p.score) }}>{scoreLabel(p.score)}</span>
                <span className="text-xs text-slate-500">
                  {p.issues.length} issue{p.issues.length !== 1 ? 's' : ''} · {p.passes.length} passed · {expanded === p.key ? '▲' : '▼'}
                </span>
              </button>

              {expanded === p.key && (
                <div className="mt-3 flex flex-col gap-4 pl-14 md:flex-row md:gap-6 md:pl-0">
                  <div className="flex-1">
                    {p.issues.length > 0 && (
                      <>
                        <div className="mb-2 text-xs font-semibold text-slate-500">Issues</div>
                        {p.issues.map((iss, i) => {
                          const { icon, color } = sevIcon(iss.sev)
                          return (
                            <div key={i} className="flex items-start gap-2 text-sm text-slate-700 mb-1">
                              <span>{icon}</span>
                              <span style={{ color }}>{iss.msg}</span>
                            </div>
                          )
                        })}
                      </>
                    )}
                  </div>
                  <div className="flex-1">
                    {p.passes.length > 0 && (
                      <>
                        <div className="mb-2 text-xs font-semibold text-slate-500">Passing</div>
                        {p.passes.map((pass, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-slate-700 mb-1">
                            <span>✅</span>
                            <span className="text-emerald-600">{pass}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 text-xs font-semibold text-slate-500">Current Meta</div>
                    <div className="text-sm text-slate-700"><strong>Title:</strong> {p.seo.title || <em className="text-rose-500">none</em>}</div>
                    <div className="mt-2 text-sm text-slate-700"><strong>Desc:</strong> {p.seo.description ? p.seo.description.slice(0, 80) + '…' : <em className="text-rose-500">none</em>}</div>
                    {p.seo.canonical && <div className="mt-2 text-sm text-slate-700"><strong>Canonical:</strong> ✓</div>}
                    {p.seo.ogImage && <div className="mt-2 text-sm text-slate-700"><strong>OG Image:</strong> ✓</div>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-[12px] bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">💡 Top Recommendations</h3>
        <div className="flex flex-col gap-3">
          {audit.critical > 0 && (
            <div className="rounded-xl border-l-4 border-rose-500 bg-rose-50 p-4 text-sm text-slate-700">
              <strong className="text-rose-600">Critical:</strong> {audit.critical} page{audit.critical !== 1 ? 's are' : ' is'} missing meta title or description — fix these first for maximum SEO impact. Go to <strong>SEO Manager</strong> to set them.
            </div>
          )}
          {audit.warnings > 0 && (
            <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-slate-700">
              <strong className="text-amber-600">Warnings:</strong> {audit.warnings} warning{audit.warnings !== 1 ? 's' : ''} found — check title/description length and add missing canonical/OG image fields.
            </div>
          )}
          <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm text-slate-700">
            <strong className="text-emerald-600">Best practice:</strong> All blog posts should have cover images (used as OG image). Add an Author Name to posts for Article schema credibility.
          </div>
          <div className="rounded-xl border-l-4 border-indigo-500 bg-indigo-50 p-4 text-sm text-slate-700">
            <strong className="text-indigo-600">Growth tip:</strong> Publish at least 2 blog posts/month targeting local keywords like "printing company Owerri" or "die-cut stickers Nigeria" to build organic traffic.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Growth Dashboard ──────────────────────────────────────────────────────────
function GrowthDashboardView({ token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    fetch('/api/admin/growth', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-10 text-center text-slate-500">Loading growth data…</div>
  if (!data) return <div className="p-10 text-center text-rose-500">Failed to load growth data.</div>

  const { summary, viewsByDay, leadsByDay, topPages, topProducts, blogPerf, deviceCounts, topCities } = data
  const maxViews = Math.max(...viewsByDay.map(d => d.views), 1)
  const maxLeads = Math.max(...leadsByDay.map(d => d.leads), 1)
  const maxPageViews = Math.max(...(topPages || []).map(p => p.views), 1)
  const maxBlogViews = Math.max(...(blogPerf || []).map(p => p.views), 1)
  const totalDevice = Object.values(deviceCounts || {}).reduce((s, v) => s + v, 0) || 1

  const TABS = ['overview', 'traffic', 'products', 'blog', 'locations']

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">🚀 Growth Dashboard</h2>
          <p className="text-sm text-slate-500">Last 30 days — updated in real time</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-4 mb-7">
        {[
          { label: 'Page Views (30d)', value: summary.totalViews30.toLocaleString(), icon: '👁️', color: '#6366f1' },
          { label: 'New Leads (30d)',  value: summary.totalLeads30.toLocaleString(),  icon: '📲', color: '#22c55e' },
          { label: 'Quote Events',     value: summary.totalQuotes30.toLocaleString(), icon: '📝', color: '#f59e0b' },
          { label: 'Total Leads',      value: summary.totalLeads.toLocaleString(),    icon: '🏆', color: '#ec4899' },
        ].map(k => (
          <div key={k.label} className="rounded-[12px] bg-white p-5 shadow-sm" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="text-3xl font-bold" style={{ color: k.color }}>{k.icon}</div>
            <div className="mt-3 text-3xl font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="mt-2 text-xs text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${tab === t ? 'bg-[#7B2FBE] text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="flex flex-col gap-5">
          {/* Page views chart */}
          <div className="rounded-[12px] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">📈 Page Views — Last 30 Days</h3>
            <div className="flex items-end gap-1 h-[100px] pb-1">
              {viewsByDay.map((d, i) => (
                <div key={i} className="flex-1" title={`${d.date}: ${d.views} views`}>
                  <div className="mx-0 h-full rounded-t-[3px] bg-[#6366f1] transition-all duration-300" style={{ height: `${Math.round((d.views / maxViews) * 90)}px`, opacity: d.views === 0 ? 0.2 : 1 }} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-slate-400">
              <span>{viewsByDay[0]?.date?.slice(5)}</span>
              <span>{viewsByDay[14]?.date?.slice(5)}</span>
              <span>{viewsByDay[29]?.date?.slice(5)}</span>
            </div>
          </div>

          {/* Leads chart */}
          <div className="rounded-[12px] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">📲 New Leads — Last 30 Days</h3>
            <div className="flex items-end gap-1 h-[80px] pb-1">
              {leadsByDay.map((d, i) => (
                <div key={i} className="flex-1" title={`${d.date}: ${d.leads} leads`}>
                  <div className="mx-0 h-full rounded-t-[3px] bg-emerald-500 transition-all duration-300" style={{ height: `${Math.round((d.leads / maxLeads) * 72)}px`, opacity: d.leads === 0 ? 0.2 : 1 }} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-slate-400">
              <span>{leadsByDay[0]?.date?.slice(5)}</span>
              <span>{leadsByDay[14]?.date?.slice(5)}</span>
              <span>{leadsByDay[29]?.date?.slice(5)}</span>
            </div>
          </div>

          {/* Device breakdown */}
          <div className="rounded-[12px] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">📱 Device Breakdown</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(deviceCounts || {}).map(([device, count]) => {
                const pct = Math.round((count / totalDevice) * 100)
                const COLORS = { desktop: '#6366f1', mobile: '#22c55e', tablet: '#f59e0b', unknown: '#94a3b8' }
                const color = COLORS[device] || '#94a3b8'
                return (
                  <div key={device} className="min-w-[120px] rounded-[10px] bg-slate-50 p-4 text-center">
                    <div className="mb-1 text-2xl">{device === 'mobile' ? '📱' : device === 'desktop' ? '🖥️' : '📟'}</div>
                    <div className="text-2xl font-bold" style={{ color }}>{pct}%</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-500">{device}</div>
                    <div className="text-xs text-slate-400">{count.toLocaleString()} visits</div>
                  </div>
                )
              })}
              {Object.keys(deviceCounts || {}).length === 0 && <div className="text-sm text-slate-400">No device data yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Traffic Tab */}
      {tab === 'traffic' && (
        <div className="rounded-[12px] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Top Pages by Views (30d)</h3>
          {topPages.length === 0 ? <div className="text-sm text-slate-400">No page view data yet.</div> : (
            <div className="space-y-3 text-sm text-slate-700">
              {topPages.map(p => (
                <div key={p.page}>
                  <div className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                    <span>{p.page || '/'}</span>
                    <span className="text-[#6366f1] font-semibold">{p.views.toLocaleString()}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#6366f1] transition-all" style={{ width: `${Math.round((p.views / maxPageViews) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {tab === 'products' && (
        <div className="rounded-[12px] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Top Products by Views (30d)</h3>
          {topProducts.length === 0 ? <div className="text-sm text-slate-400">No product view events yet. Product views are tracked when customers open a product page.</div> : (
            <div className="space-y-3 text-sm text-slate-700">
              {topProducts.map(p => (
                <div key={p.slug}>
                  <div className="mb-1 flex items-center justify-between font-medium text-slate-700">
                    <span>{p.name}</span>
                    <span className="text-[#f59e0b] font-semibold">{p.views.toLocaleString()} views</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#f59e0b] transition-all" style={{ width: `${Math.round((p.views / Math.max(...topProducts.map(x => x.views), 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blog Tab */}
      {tab === 'blog' && (
        <div className="rounded-[12px] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Blog Post Performance</h3>
          {blogPerf.length === 0 ? <div className="text-sm text-slate-400">No published blog posts yet.</div> : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-500">
                    {['Post Title', 'Date', 'Views', 'Bar'].map(h => (
                      <th key={h} className="border-b border-slate-200 px-3 py-2 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blogPerf.map(p => (
                    <tr key={p.slug} className="border-b border-slate-200 last:border-0">
                      <td className="px-3 py-2 font-medium text-slate-900">{p.title}</td>
                      <td className="px-3 py-2 text-slate-500">{(p.date || '').slice(0, 10)}</td>
                      <td className="px-3 py-2 text-emerald-600 font-semibold">{p.views}</td>
                      <td className="px-3 py-2 w-32">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round((p.views / maxBlogViews) * 100)}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Locations Tab */}
      {tab === 'locations' && (
        <div className="rounded-[12px] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Top Visitor Cities (30d)</h3>
          {topCities.length === 0 ? <div className="text-sm text-slate-400">No location data yet.</div> : (
            <div className="space-y-3 text-sm text-slate-700">
              {topCities.map(c => (
                <div key={c.city}>
                  <div className="mb-1 flex items-center justify-between font-medium text-slate-700">
                    <span>📍 {c.city}</span>
                    <span className="text-rose-500 font-semibold">{c.views.toLocaleString()} visits</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.round((c.views / Math.max(...topCities.map(x => x.views), 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SEO Manager (existing) ────────────────────────────────────────────────────
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
      <div className="mb-5">
        <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">🔍 SEO Manager</h2>
        <p className="text-sm text-slate-500 m-0">Set meta titles and descriptions for each page. These help Google rank your site higher.</p>
      </div>

      {/* Page tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SEO_PAGES.map(p => (
          <button key={p.key} onClick={() => setActivePage(p.key)}
            className={`rounded-2xl px-4 py-2 text-[12px] font-semibold transition shadow-sm ${activePage === p.key ? 'bg-[#7B2FBE] text-white' : 'bg-white text-slate-600'}`}>
            {p.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[#7B2FBE] mb-1">{page?.label}</h3>
            <p className="text-xs text-slate-500 m-0">URL: {page?.path}</p>
          </div>
        </div>

        <Input label="Meta Title"
          value={entry.title || ''}
          onChange={e => set(activePage, 'title', e.target.value)}
          placeholder="e.g. Sleekblue Media Houz — Premium Printing in Nigeria" />
        <p className={`text-[11px] mb-3 ${entry.title?.length > 60 ? 'text-rose-600' : 'text-slate-400'}`}>
          {(entry.title || '').length}/60 characters {entry.title?.length > 60 ? '⚠️ Too long — Google truncates at 60' : '✓ Good length'}
        </p>

        <Input label="Meta Description" rows={3}
          value={entry.description || ''}
          onChange={e => set(activePage, 'description', e.target.value)}
          placeholder="A brief, compelling description of this page (150–160 characters ideal)" />
        <p className={`text-[11px] mb-3 ${((entry.description?.length || 0) > 160) ? 'text-rose-600' : 'text-slate-400'}`}>
          {(entry.description || '').length}/160 characters {(entry.description?.length || 0) > 160 ? '⚠️ Too long' : (entry.description?.length || 0) > 120 ? '✓ Good' : (entry.description?.length || 0) > 0 ? '⚠️ Too short' : ''}
        </p>

        <Input label="Keywords (comma separated)"
          value={entry.keywords || ''}
          onChange={e => set(activePage, 'keywords', e.target.value)}
          placeholder="die cut stickers Nigeria, flex banner printing Lagos, branded merchandise" />

        {/* Google preview */}
        {(entry.title || entry.description) && (
          <div className="mt-2 rounded-[10px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-2">Google Preview</p>
            <p className="text-[18px] text-[#1a0dab] mb-1 leading-tight font-sans">{entry.title || 'Page Title'}</p>
            <p className="text-sm text-[#006621] mb-1 font-sans">sleekbluemediahouz.com{page?.path}</p>
            <p className="text-sm text-slate-700 leading-[1.55] font-sans">{entry.description || 'Meta description will appear here…'}</p>
          </div>
        )}
      </Card>

      {/* SEO Tips */}
      <Card className="mt-4 bg-[#f9f5ff]">
        <h3 className="text-sm font-bold text-[#7B2FBE] mb-3">💡 SEO Tips for Sleekblue</h3>
        <ul className="m-0 list-disc pl-5 text-sm leading-7 text-slate-700">
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

// ─── Promo Banner ─────────────────────────────────────────────────────────────
function PromoBannerView({ token }) {
  const [form, setForm] = useState({ enabled: false, text: '', link: '', color: '#7B2FBE', bgColor: '#f5f0ff' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/promo-banner').then(r => r.ok ? r.json() : null).then(d => { if (d) setForm(d) }).catch(() => {})
  }, [])

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function save() {
    setSaving(true)
    await fetch('/api/admin/promo-banner', { method: 'PUT', headers: authH(token), body: JSON.stringify(form) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">📣 Promo Banner</h2>
        <p className="text-sm text-slate-500 m-0">Shows a coloured announcement bar at the top of every page on your website.</p>
      </div>
      <Card>
        <div className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 ${form.enabled ? 'bg-green-100 border-green-200' : 'bg-[#f9f9f9] border-[#eee]'}`}>
          <label className="flex flex-1 cursor-pointer items-center gap-3">
            <input type="checkbox" checked={form.enabled} onChange={e => set('enabled', e.target.checked)} className="h-4 w-4 cursor-pointer" />
            <span className={`text-sm font-semibold ${form.enabled ? 'text-emerald-600' : 'text-slate-500'}`}>
              {form.enabled ? '✓ Banner is LIVE on your site' : '✗ Banner is hidden'}
            </span>
          </label>
        </div>
        <Input label="Banner Text" value={form.text} onChange={e => set('text', e.target.value)} placeholder="🎉 FREE delivery on orders above ₦50,000 this week only!" />
        <Input label="Link URL (optional)" value={form.link || ''} onChange={e => set('link', e.target.value)} placeholder="/quote or https://wa.me/..." />
        <div className="grid gap-5 mb-4 md:grid-cols-2">
          {[['Text Color', 'color'], ['Background Color', 'bgColor']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-[12px] font-semibold text-slate-600 mb-2">{label}</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form[key]} onChange={e => set(key, e.target.value)} className="h-[42px] w-[50px] rounded-[10px] border border-slate-300 p-1 cursor-pointer" />
                <input value={form[key]} onChange={e => set(key, e.target.value)} className="w-[100px] rounded-2xl border border-slate-300 px-3 py-2 text-sm font-mono" />
                <div className="h-10 w-10 rounded-2xl border border-slate-200" style={{ background: form[key] }} />
              </div>
            </div>
          ))}
        </div>
        {form.text && (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-2">Preview</p>
            <div className="mb-2 rounded-2xl border p-4 text-center" style={{ background: form.bgColor, borderColor: form.color + '20' }}>
              <p className="m-0 text-[13.5px] font-semibold" style={{ color: form.color }}>
                {form.text}
                {form.link && <span className="ml-3 underline">Learn more →</span>}
              </p>
            </div>
          </>
        )}
      </Card>
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  )
}

// ─── Activity Log ──────────────────────────────────────────────────────────────
function ActivityLogView({ token }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    fetch('/api/admin/activity-log', { headers: authH(token) })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setLogs(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">📜 Activity Log</h2>
          <p className="text-sm text-slate-500 m-0">Recent admin actions — last 200 entries</p>
        </div>
        <Btn variant="ghost" onClick={load}>↻ Refresh</Btn>
      </div>
      {loading ? (
        <Card><p className="m-0 text-sm text-slate-500">Loading…</p></Card>
      ) : logs.length === 0 ? (
        <Card className="text-center p-12">
          <div className="text-4xl mb-3">📜</div>
          <p className="text-base font-semibold text-slate-900 mb-1">No activity recorded yet</p>
          <p className="text-sm text-slate-500 m-0">Activity will appear here as you manage content and settings.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  {['Time', 'Action', 'Detail', 'User'].map(h => (
                    <th key={h} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3"><Badge>{log.action}</Badge></td>
                    <td className="max-w-[320px] px-4 py-3 text-slate-600 break-words">{log.detail}</td>
                    <td className="px-4 py-3 text-slate-500">{log.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('sbm_admin_token') || '')
  const [view, setView] = useState('dashboard')
  const [siteData, setSiteData] = useState({ settings: {}, productOverrides: {}, stickerPriceOverrides: {}, acceptances: [], content: {}, blogPosts: [], heroSlides: 0, leads: [] })
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async (tok = token) => {
    if (!tok) return
    setLoading(true)
    try {
      const [dataRes, accRes, contentRes, blogRes, heroRes, leadsRes] = await Promise.all([
        fetch('/api/admin/site-data', { headers: { Authorization: `Bearer ${tok}` } }),
        fetch('/api/admin/acceptances', { headers: { Authorization: `Bearer ${tok}` } }),
        fetch('/api/content'),
        fetch('/api/admin/blog', { headers: { Authorization: `Bearer ${tok}` } }),
        fetch('/api/hero'),
        fetch('/api/admin/leads', { headers: { Authorization: `Bearer ${tok}` } }),
      ])
      if (dataRes.status === 401) { handleLogout(); return }
      const data = await dataRes.json()
      const acceptances = await accRes.json()
      const content = contentRes.ok ? await contentRes.json() : {}
      const blogPosts = blogRes.ok ? await blogRes.json() : []
      const heroData = heroRes.ok ? await heroRes.json() : {}
      const leads = leadsRes.ok ? await leadsRes.json() : []
      setSiteData({
        settings:             data.settings             || {},
        productOverrides:     data.productOverrides     || {},
        stickerPriceOverrides:data.stickerPriceOverrides || {},
        acceptances:          Array.isArray(acceptances) ? acceptances : [],
        content,
        blogPosts:            Array.isArray(blogPosts) ? blogPosts : [],
        heroSlides:           (heroData.customSlides || []).length,
        leads:                Array.isArray(leads) ? leads : [],
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
    leads: (siteData.leads || []).length,
  }

  return (
    <div className="flex min-h-screen font-['HubotSans',sans-serif]">
      <Sidebar view={view} setView={setView} counts={counts} onLogout={handleLogout} />
      <main className="flex-1 bg-slate-100 p-7 lg:p-8 overflow-y-auto min-h-screen">
        {loading && view === 'dashboard' && (
          <div className="text-center py-16 text-slate-500">Loading…</div>
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
            {view === 'faq'            && <FaqView token={token} />}
            {view === 'seo'            && <SeoView token={token} />}
            {view === 'content'        && <ContentView token={token} content={siteData.content} settings={siteData.settings} onDataChanged={fetchAll} />}
            {view === 'settings'       && <SettingsView token={token} settings={siteData.settings} onDataChanged={fetchAll} />}
            {view === 'acceptances'    && <AcceptancesView acceptances={siteData.acceptances} />}
            {view === 'security'       && <SecurityView token={token} />}
            {view === 'analytics'      && <AnalyticsView token={token} />}
            {view === 'reports'        && <ReportsView token={token} />}
            {view === 'leads'          && <LeadsView token={token} />}
            {view === 'promo-banner'   && <PromoBannerView token={token} />}
            {view === 'activity-log'   && <ActivityLogView token={token} />}
            {view === 'seo-agent'      && <SeoAgentView token={token} />}
            {view === 'growth'          && <GrowthDashboardView token={token} />}
            {view === 'newsletter'      && <NewsletterView token={token} />}
            {view === 'comments'        && <CommentsView token={token} />}
            {view === 'reviews-pending' && <ReviewsPendingView token={token} />}
            {view === 'referrals'       && <ReferralsView token={token} />}
          </>
        )}
      </main>
    </div>
  )
}
