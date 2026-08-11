import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PRI, PRI_LIGHT, ACC, SIDEBAR_W, authH, fmt, Card, Btn, Input, Badge, SaveBar } from './AdminUI';
import { ALL_PRODUCTS, STICKER_SIZE_PRICES, getProductDetails } from '../../data/products';
import TiptapEditor from '../../components/TiptapEditor';
import logo from '@assets/SLEEKBLUE_LOGO_1779927359068.webp';

const DEFAULT_SLIDE_LABELS = ['Hero Slide 1', 'Hero Slide 2', 'Hero Slide 3', 'Hero Slide 4']

export function ImageManager({ token }) {
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
    setDefaultSlidesMsg('Saved')
    setTimeout(() => setDefaultSlidesMsg(''), 2000)
  }

  async function toggleExtraDefaultSlide(url) {
    const next = hiddenExtraDefaultSlides.includes(url)
      ? hiddenExtraDefaultSlides.filter(u => u !== url)
      : [...hiddenExtraDefaultSlides, url]
    setHiddenExtraDefaultSlides(next)
    await fetch('/api/admin/hero/extra-default-visibility', { method: 'PUT', headers: authH(token), body: JSON.stringify({ hiddenExtraDefaultSlides: next }) })
    setDefaultSlidesMsg('Saved')
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
      setDefaultSlidesMsg('Slide added!')
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
    if (data.ok) { setHeroSlides(s => [...s, data.url]); setHeroMsg('Slide uploaded!') }
    else setHeroMsg('Upload failed: ' + (data.error || ''))
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
      setProdMsg('Image uploaded!')
    } else setProdMsg('Upload failed: ' + (data.error || ''))
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
      const key = `${selectedSlug}::${selectedVariant}`
      setVariantImages(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), data.url]
      }))
      setVariantMsg('Variant image uploaded!')
    } else setVariantMsg('Upload failed: ' + (data.error || ''))
    setVariantUploading(false); e.target.value = ''
  }

  async function deleteVariantImage(slug, variant, url) {
    if (!confirm('Delete this variant image?')) return
    await fetch(`/api/admin/upload/product-variant/${slug}`, { method: 'DELETE', headers: authH(token), body: JSON.stringify({ variant, url }) })
    const key = `${slug}::${variant}`
    setVariantImages(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(u => u !== url)
    }))
  }

  const tabs = [
    { id: 'hero',    label: 'Hero Slides' },
    { id: 'product', label: 'Product Images' },
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
              <p className="text-sm text-slate-500">Upload new hero slide images. They will replace the default slides on the homepage. Drag or use arrows to reorder. Recommended: landscape images (1920x600px or similar).</p>
            </div>
            <label className={`inline-flex items-center gap-2 rounded-2xl bg-[#7B2FBE] px-4 py-3 text-sm font-semibold text-white transition ${heroUploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              {heroUploading ? 'Uploading...' : 'Upload Slide Image'}
              <input type="file" accept="image/*" className="hidden" onChange={uploadHeroSlide} disabled={heroUploading} />
            </label>
            {heroMsg && <p className={`text-sm mt-2 ${heroMsg.includes('failed') ? 'text-rose-600' : 'text-emerald-600'}`}>{heroMsg}</p>}
          </Card>

          <Card className="space-y-4 border border-[#e0d6f5] bg-[#f8f8ff]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#7B2FBE] mb-1">Default Built-in Slides</h3>
                <p className="text-xs text-slate-500 leading-5">
                  {heroSlides.length > 0 ? 'Custom slides are active - defaults are hidden behind them.' : 'Shown when no custom slides are uploaded. Hide, restore, or add more below.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {defaultSlidesMsg && <span className="text-sm text-emerald-600">{defaultSlidesMsg}</span>}
                <label className={`inline-flex items-center gap-2 rounded-2xl bg-[#7B2FBE] px-4 py-2 text-sm font-semibold text-white ${extraDefaultUploading ? 'opacity-60' : 'cursor-pointer'}`}>
                  {extraDefaultUploading ? 'Adding...' : 'Add More slides'}
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
                      <div className="text-3xl mb-1">#</div>
                      <p className="text-xs font-semibold text-[#7B2FBE] mb-1">{label}</p>
                      <p className="text-[10px] text-slate-400">Built-in slide</p>
                    </div>
                    <div className="bg-white p-3">
                      <button
                        onClick={() => toggleDefaultSlide(i)}
                        className={`w-full rounded-xl px-3 py-2 text-[11px] font-semibold ${isHidden ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-700'}`}>
                        {isHidden ? 'Restore' : 'Hide'}
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
                          {isHidden ? 'Restore' : 'Hide'}
                        </button>
                        <button
                          onClick={() => deleteExtraDefaultSlide(url)}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-[10px] font-semibold text-white">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              <label className={`rounded-2xl border-2 border-dashed border-[#7B2FBE]/60 flex min-h-[150px] flex-col items-center justify-center gap-2 p-6 text-center transition ${extraDefaultUploading ? 'opacity-60' : 'hover:bg-slate-50'}`}>
                <span className="text-3xl">+</span>
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
                    <span className="flex-1 text-[11px] text-slate-500">drag to reorder</span>
                    <button
                      onClick={() => moveHero(i, -1)}
                      disabled={i === 0}
                      className="rounded-xl bg-[#f0e8ff] px-2 py-1 text-[11px] font-semibold text-[#7B2FBE] disabled:opacity-40">
                      Up
                    </button>
                    <button
                      onClick={() => moveHero(i, 1)}
                      disabled={i === heroSlides.length - 1}
                      className="rounded-xl bg-[#f0e8ff] px-2 py-1 text-[11px] font-semibold text-[#7B2FBE] disabled:opacity-40">
                      Down
                    </button>
                    <button
                      onClick={() => deleteHeroSlide(url)}
                      className="rounded-xl bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                      Delete
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
                {prodUploading ? 'Uploading...' : 'Upload Image'}
                <input type="file" accept="image/*" className="hidden" onChange={uploadProductImage} disabled={prodUploading} />
              </label>
            </div>
            {prodMsg && <p className={`text-sm mt-2 ${prodMsg.includes('failed') ? 'text-rose-600' : 'text-emerald-600'}`}>{prodMsg}</p>}
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
                          Delete
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
            const variantImgsForVariant = variantImages[`${selectedSlug}::${activeVariant}`] || []
            return (
              <Card className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#7B2FBE] mb-1">Variant / Type Images</h3>
                  <p className="text-sm text-slate-500">Upload a specific image for each size or type. These override the general product image when that variant is selected by the customer.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={activeVariant}
                    onChange={e => { setSelectedVariant(e.target.value); setVariantMsg('') }}
                    className="min-w-[200px] rounded-2xl border border-[#7B2FBE]/30 bg-[#f0e8ff] px-4 py-3 text-sm outline-none focus:border-[#7B2FBE] focus:ring-2 focus:ring-[#7B2FBE]/20">
                    {slugVariants.map(v => (
                      <option key={v} value={v}>{v} {(variantImages[`${selectedSlug}::${v}`] || []).length > 0 ? 'yes' : ''}</option>
                    ))}
                  </select>
                  <label className={`inline-flex items-center gap-2 rounded-2xl bg-[#7B2FBE] px-4 py-3 text-sm font-semibold text-white ${variantUploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                    {variantUploading ? 'Uploading...' : `Upload for "${activeVariant}"`}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { setSelectedVariant(activeVariant); uploadVariantImage(e) }} disabled={variantUploading} />
                  </label>
                </div>
                {variantMsg && <p className={`text-sm ${variantMsg.includes('failed') ? 'text-rose-600' : 'text-emerald-600'}`}>{variantMsg}</p>}

                {variantImgsForVariant.length === 0
                  ? <p className="text-sm text-slate-500">No images for this variant yet - falls back to general product image.</p>
                  : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {variantImgsForVariant.map((url, i) => (
                        <div key={url} className="relative overflow-hidden rounded-2xl border border-[#7B2FBE]/30">
                          <img src={url} alt={`${activeVariant} ${i + 1}`} className="aspect-[3/4] w-full object-cover" />
                          <button
                            onClick={() => deleteVariantImage(selectedSlug, activeVariant, url)}
                            className="absolute right-2 top-2 rounded-xl bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
                            Delete
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
                      const count = (variantImages[`${selectedSlug}::${v}`] || []).length
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${count > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                          {v} {count > 0 ? `(${count})` : '-'}
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
