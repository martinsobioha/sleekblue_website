/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect, no-unused-vars, no-empty, no-dupe-keys, no-use-before-define */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { ALL_PRODUCTS, getProductDetails, calcStickerPrice, getStickerPriceTable, STICKER_SIZE_PRICES, findNearestSize } from '../data/products'
import { PRODUCT_IMAGES, STICKER_SIZE_IMAGES } from '../data/productImages'
import { useSEO } from '../hooks/useSEO'
import { trackProductView } from '../hooks/useAnalytics'
import Breadcrumb from '../components/Breadcrumb'

const thumbColors = ['#C8C8C8', '#B0B0B0', '#D0D0D0']

function fmt(n) {
  return '₦' + Math.round(n).toLocaleString()
}

function getYoutubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/)
  return m ? m[1] : ''
}

export default function ProductPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const baseProduct = ALL_PRODUCTS.find(p => p.slug === slug) || ALL_PRODUCTS[7]

  const seoKey = slug === 'die-cut-stickers' ? 'dieCut' : slug === 'flex-banner' ? 'flexBanner' : slug === 'product-labels' ? 'labels' : slug
  useSEO(seoKey, { title: `${baseProduct?.name || 'Product'} — Sleekblue Media Houz`, description: `Order ${baseProduct?.name || 'custom printing'} from Sleekblue Media Houz. Premium quality, fast delivery across Nigeria.` })
  const baseDetails = getProductDetails(baseProduct.slug)

  const [adminOverride, setAdminOverride] = useState(null)
  const [uploadedImages, setUploadedImages] = useState({})
  const [stickerImages, setStickerImages] = useState({})
  const [variantImages, setVariantImages] = useState({})
  const [selectedSize, setSelectedSize] = useState((baseProduct.sizes || ['Standard'])[0])
  const [customQty, setCustomQty] = useState(baseProduct.isDieCut ? 100 : (baseProduct.priceTable?.[0]?.qty || 1))
  const [selectedThumb, setSelectedThumb] = useState(0)
  const [added, setAdded] = useState(false)
  const [artworkFile, setArtworkFile] = useState(null)
  const [artworkUploading, setArtworkUploading] = useState(false)
  const [artworkDone, setArtworkDone] = useState(false)
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [views7d, setViews7d] = useState(0)
  const [inWishlist, setInWishlist] = useState(false)
  const [customWidth, setCustomWidth] = useState(3)
  const [customHeight, setCustomHeight] = useState(3)

  useEffect(() => {
    trackProductView(baseProduct.slug, baseProduct.name)
    fetch(`/api/products/${baseProduct.slug}`).then(r => r.ok ? r.json() : null).then(data => { if (data) setAdminOverride(data) }).catch(() => {})
    fetch('/api/product-images').then(r => r.ok ? r.json() : {}).then(d => setUploadedImages(d || {})).catch(() => {})
    fetch('/api/sticker-images').then(r => r.ok ? r.json() : {}).then(d => setStickerImages(d || {})).catch(() => {})
    fetch('/api/product-variant-images').then(r => r.ok ? r.json() : {}).then(d => setVariantImages(d || {})).catch(() => {})
    fetch(`/api/product/views/${baseProduct.slug}`).then(r => r.ok ? r.json() : { views7d: 0 }).then(d => setViews7d(d.views7d || 0)).catch(() => {})
    try { setInWishlist((JSON.parse(localStorage.getItem('sbm_wishlist') || '[]')).includes(baseProduct.slug)) } catch {}
  }, [baseProduct.slug])

  const product = adminOverride ? { ...baseProduct, ...adminOverride } : baseProduct
  const details = adminOverride
    ? { ...baseDetails, ...(adminOverride.description ? { description: adminOverride.description } : {}), ...(adminOverride.features ? { features: adminOverride.features } : {}), ...(adminOverride.badge ? { badge: adminOverride.badge } : {}) }
    : baseDetails
  const isDieCut = !!baseProduct.isDieCut
  const sizes = product.sizes || ['Standard']

  useEffect(() => {
    setSelectedThumb(0)
    setSelectedSize(sizes[0])
    setCustomQty(isDieCut ? 100 : (product.priceTable?.[0]?.qty || 1))
    setAdminOverride(null)
  }, [slug])

  const effectiveSize = (isDieCut && selectedSize === 'Custom') ? findNearestSize(customWidth, customHeight) : selectedSize
  const uploadedForSlug = uploadedImages[product.slug] || []
  const serverStickerImgs = stickerImages[effectiveSize] || []
  const variantSpecificImgs = !isDieCut ? (variantImages[`${product.slug}::${selectedSize}`] || []) : []
  const productImgs = isDieCut
    ? (serverStickerImgs.length > 0 ? serverStickerImgs : (STICKER_SIZE_IMAGES[effectiveSize] || []))
    : (variantSpecificImgs.length > 0 ? variantSpecificImgs : (uploadedForSlug.length > 0 ? uploadedForSlug : (PRODUCT_IMAGES[product.slug] || [])))
  const displayImgs = productImgs.length > 0 ? productImgs : null

  const variantPriceTable = (!isDieCut && adminOverride?.variantPrices?.[selectedSize]?.length > 0)
    ? adminOverride.variantPrices[selectedSize] : null

  function getPrice(qty) {
    if (isDieCut) return calcStickerPrice(effectiveSize, qty).total
    const table = variantPriceTable || product.priceTable || []
    if (table.length === 0) return product.price * qty
    let unit = table[0].unitPrice
    for (const row of table) { if (qty >= row.qty) unit = row.unitPrice }
    return unit * qty
  }

  const currentTotal = getPrice(customQty)
  const stickerCalc = isDieCut ? calcStickerPrice(effectiveSize, customQty) : null
  const discountPct = stickerCalc ? Math.round(stickerCalc.discountRate * 100) : 0
  const activePriceTable = variantPriceTable || product.priceTable || []
  const priceRows = isDieCut
    ? getStickerPriceTable(effectiveSize)
    : activePriceTable.map(row => ({ qty: row.qty, label: row.qty.toLocaleString(), total: row.unitPrice * row.qty, unitPrice: row.unitPrice, discountRate: 0 }))

  function handleAddToCart() {
    addToCart({ id: product.id, name: product.name, size: selectedSize === 'Custom' ? `${customWidth}×${customHeight}"` : selectedSize, quantity: customQty, price: Math.round(currentTotal / customQty), slug: product.slug })
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  return (
    <section className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Store', href: '/store' }, { label: product.name }]} />
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
          <div className="space-y-3">
            <div className={`relative flex flex-col items-center overflow-hidden rounded-[1rem] border-4 border-violet-700 ${displayImgs ? 'justify-start pb-0 bg-transparent' : 'justify-end pb-4'} aspect-[3/4]`} style={{ background: displayImgs ? 'transparent' : thumbColors[selectedThumb] }}>
              {displayImgs ? (
                <img key={selectedThumb} src={displayImgs[Math.min(selectedThumb, displayImgs.length - 1)]} alt={product.name} loading="lazy" decoding="async" className="h-full w-full object-cover rounded-[0.55rem]" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-slate-200') }} />
              ) : (
                <div className="flex h-full w-full items-end justify-center px-3 pb-3 text-center">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{product.name}</p>
                    <p className="text-sm font-bold text-violet-700">{fmt(currentTotal)}</p>
                  </div>
                </div>
              )}
            </div>
            {displayImgs && (
              <div className="flex flex-wrap gap-2 mt-2">
                {displayImgs.map((img, i) => (
                  <button key={i} type="button" onClick={() => setSelectedThumb(i)} className={`${displayImgs.length > 4 ? 'h-11 w-11' : 'h-14 w-14'} overflow-hidden rounded-xl ${selectedThumb === i ? 'ring-2 ring-violet-600' : 'border border-slate-300'} bg-slate-200`}>
                    <img src={img} alt={`View ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-[1rem] bg-white p-5 shadow-sm">
            <h1 className="text-xl font-black text-slate-900 mb-2">{product.name}</h1>
            <p className="text-sm text-slate-500 mb-4">{product.category}</p>
            <p className="mb-3 text-sm font-semibold text-slate-800">{isDieCut ? 'Size (inches):' : 'Size / Type:'}</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {sizes.map(size => (
                <button key={size} type="button" onClick={() => { setSelectedSize(size); setSelectedThumb(0); setCustomQty(isDieCut ? 100 : (product.priceTable?.[0]?.qty || 1)) }} className={`rounded-full px-4 py-2 text-xs font-semibold ${selectedSize === size ? 'bg-violet-700 text-white' : 'bg-slate-100 text-slate-900'}`}>{size}</button>
              ))}
            </div>
            <div className="mb-5 overflow-hidden rounded-[1rem] border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100"><tr><th className="px-4 py-3 text-left">Qty</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Unit</th></tr></thead>
                <tbody>
                  {priceRows.map((row, i) => (
                    <tr key={i} onClick={() => setCustomQty(row.qty)} className={`cursor-pointer border-t ${customQty === row.qty ? 'bg-violet-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3">{row.label || row.qty.toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-violet-700">{fmt(row.total)}</td>
                      <td className="px-4 py-3">{fmt(row.unitPrice)}/pc</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setCustomQty(q => Math.max(1, q - 1))} className="h-10 w-10 rounded-full border-2 border-violet-700 text-xl font-bold text-violet-700">−</button>
              <input type="number" value={customQty} min={1} onChange={e => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 rounded-2xl border px-3 py-2 text-center text-sm" />
              <button type="button" onClick={() => setCustomQty(q => q + 1)} className="h-10 w-10 rounded-full bg-violet-700 text-xl font-bold text-white">+</button>
              <div className="ml-auto text-right"><p className="text-xs text-slate-500">Total</p><p className="text-lg font-bold text-violet-700">{fmt(currentTotal)}</p></div>
            </div>
          </div>
          <div className="rounded-[1rem] bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-violet-700">Product Description</h3>
            <p className="mb-4 text-sm leading-7 text-slate-600">{details.description}</p>
            <ul className="mb-5 space-y-2">{details.features.map((f, i) => (<li key={i} className="flex gap-2 text-sm text-slate-700"><span className="text-violet-700">✓</span><span>{f}</span></li>))}</ul>
            <button onClick={handleAddToCart} className={`mb-3 w-full rounded-[1rem] px-4 py-3 text-sm font-bold text-white ${added ? 'bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'}`}>{added ? '✓ Added!' : 'Add to Cart'}</button>
            <button onClick={() => { handleAddToCart(); navigate('/cart') }} className="mb-3 w-full rounded-[1rem] bg-violet-700 px-4 py-3 text-sm font-bold text-white hover:bg-violet-800">Checkout Now</button>
            <a href="https://wa.me/2348065275264" target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center rounded-[1rem] bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700">Ask via WhatsApp</a>
          </div>
        </div>
      </div>
    </section>
  )
}
