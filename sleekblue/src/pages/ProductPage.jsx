import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { ALL_PRODUCTS, getProductDetails, calcStickerPrice, getStickerPriceTable, STICKER_SIZE_PRICES } from '../data/products'
import { PRODUCT_IMAGES, STICKER_SIZE_IMAGES } from '../data/productImages'
import { useSEO } from '../hooks/useSEO'
import { trackProductView } from '../hooks/useAnalytics'

const thumbColors = ['#C8C8C8', '#B0B0B0', '#D0D0D0']

function fmt(n) {
  return '₦' + Math.round(n).toLocaleString()
}

// Return the nearest standard sticker size for a given area (w × h)
function findNearestSize(w, h) {
  const area = w * h
  let nearest = '3x3"'
  let minDiff = Infinity
  Object.keys(STICKER_SIZE_PRICES).forEach(sizeKey => {
    const nums = sizeKey.match(/[\d.]+/g)
    if (nums && nums.length >= 2) {
      const a = parseFloat(nums[0]) * parseFloat(nums[1])
      const diff = Math.abs(a - area)
      if (diff < minDiff) { minDiff = diff; nearest = sizeKey }
    }
  })
  return nearest
}

export default function ProductPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const baseProduct = ALL_PRODUCTS.find(p => p.slug === slug) || ALL_PRODUCTS[7]

  // Dynamic SEO per product page
  const seoKey = slug === 'die-cut-stickers' ? 'dieCut' : slug === 'flex-banner' ? 'flexBanner' : slug === 'product-labels' ? 'labels' : slug
  useSEO(seoKey, { title: `${baseProduct?.name || 'Product'} — Sleekblue Media Houz`, description: `Order ${baseProduct?.name || 'custom printing'} from Sleekblue Media Houz. Premium quality, fast delivery across Nigeria.` })
  const baseDetails = getProductDetails(baseProduct.slug)

  // Admin overrides — fetched from server, applied on top of static data
  const [adminOverride, setAdminOverride] = useState(null)
  const [uploadedImages, setUploadedImages] = useState({})
  const [stickerImages, setStickerImages] = useState({})
  useEffect(() => {
    trackProductView(baseProduct.slug, baseProduct.name)
    fetch(`/api/products/${baseProduct.slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setAdminOverride(data) })
      .catch(() => {})
    fetch('/api/product-images')
      .then(r => r.ok ? r.json() : {})
      .then(d => setUploadedImages(d || {}))
      .catch(() => {})
    fetch('/api/sticker-images')
      .then(r => r.ok ? r.json() : {})
      .then(d => setStickerImages(d || {}))
      .catch(() => {})
  }, [baseProduct.slug])

  const product = adminOverride ? { ...baseProduct, ...adminOverride } : baseProduct
  const details = adminOverride
    ? { ...baseDetails, ...(adminOverride.description ? { description: adminOverride.description } : {}), ...(adminOverride.features ? { features: adminOverride.features } : {}), ...(adminOverride.badge ? { badge: adminOverride.badge } : {}) }
    : baseDetails
  const isDieCut = !!baseProduct.isDieCut

  const sizes = product.sizes || ['Standard']
  const [selectedSize, setSelectedSize] = useState(sizes[0])
  const [customQty, setCustomQty] = useState(isDieCut ? 100 : (product.priceTable[0]?.qty || 1))
  const [selectedThumb, setSelectedThumb] = useState(0)
  const [added, setAdded] = useState(false)

  // Custom size state (only for die-cut stickers)
  const [customWidth, setCustomWidth] = useState(3)
  const [customHeight, setCustomHeight] = useState(3)

  // Reset thumbnail when navigating between products
  useEffect(() => {
    setSelectedThumb(0)
    setSelectedSize(sizes[0])
    setCustomQty(isDieCut ? 100 : (product.priceTable[0]?.qty || 1))
    setAdminOverride(null)
  }, [slug])

  // For die-cut with Custom size, resolve to nearest standard for pricing
  const effectiveSize = (isDieCut && selectedSize === 'Custom')
    ? findNearestSize(customWidth, customHeight)
    : selectedSize

  // Product images — uploaded images take priority; fall back to static
  const uploadedForSlug = uploadedImages[product.slug] || []
  const serverStickerImgs = stickerImages[effectiveSize] || []
  const productImgs = isDieCut
    ? (serverStickerImgs.length > 0 ? serverStickerImgs : (STICKER_SIZE_IMAGES[effectiveSize] || []))
    : (uploadedForSlug.length > 0 ? uploadedForSlug : (PRODUCT_IMAGES[product.slug] || []))
  const hasImages = productImgs.length > 0
  const displayImgs = hasImages ? productImgs : null

  // --- Pricing logic (variant-aware) ---
  const variantPriceTable = (!isDieCut && adminOverride?.variantPrices?.[selectedSize] && adminOverride.variantPrices[selectedSize].length > 0)
    ? adminOverride.variantPrices[selectedSize]
    : null

  function getPrice(qty) {
    if (isDieCut) return calcStickerPrice(effectiveSize, qty).total
    const table = variantPriceTable || product.priceTable || []
    if (table.length === 0) return product.price * qty
    let unit = table[0].unitPrice
    for (const row of table) { if (qty >= row.qty) unit = row.unitPrice }
    return unit * qty
  }

  const currentTotal = getPrice(customQty)
  const currentUnit = customQty > 0 ? currentTotal / customQty : 0

  // Die-cut: discount info
  const stickerCalc = isDieCut ? calcStickerPrice(effectiveSize, customQty) : null
  const discountPct = stickerCalc ? Math.round(stickerCalc.discountRate * 100) : 0

  // Price table rows for display
  const activePriceTable = variantPriceTable || product.priceTable || []
  const priceRows = isDieCut
    ? getStickerPriceTable(effectiveSize)
    : activePriceTable.map(row => ({ qty: row.qty, label: row.qty.toLocaleString(), total: row.unitPrice * row.qty, unitPrice: row.unitPrice, discountRate: 0 }))

  function handleAddToCart() {
    addToCart({
      id: product.id,
      name: product.name,
      size: selectedSize === 'Custom' ? `${customWidth}×${customHeight}"` : selectedSize,
      quantity: customQty,
      price: Math.round(currentTotal / customQty),
      slug: product.slug,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  function handleCheckout() {
    handleAddToCart()
    navigate('/cart')
  }

  function clickQtyRow(qty) {
    setCustomQty(qty)
  }

  const similarProducts = ALL_PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 8)

  // Popular badge logic for die-cut sizes
  function getSizeBadge(size) {
    if (!isDieCut) return null
    if (size === '3x3"') return { label: '🔥 #1 Popular', bg: '#FF6B00', color: '#fff' }
    if (size === '3x4"') return { label: 'Popular', bg: '#7B2FBE', color: '#fff' }
    return null
  }

  return (
    <section style={{ background: '#FAF3E8', padding: '28px 16px 50px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: '#7B2FBE' }}>Home</span>
          <span>›</span>
          <span onClick={() => navigate('/store')} style={{ cursor: 'pointer', color: '#7B2FBE' }}>Store</span>
          <span>›</span>
          <span style={{ color: '#555' }}>{product.name}</span>
        </div>

        <div className="product-layout" style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: '20px', marginBottom: '40px', alignItems: 'start' }}>

          {/* LEFT — image gallery */}
          <div>
            <div style={{ background: displayImgs ? 'transparent' : thumbColors[selectedThumb], borderRadius: '12px', border: '3px solid #7B2FBE', width: '100%', aspectRatio: '3/4', marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: displayImgs ? 'flex-start' : 'flex-end', paddingBottom: displayImgs ? 0 : '16px', position: 'relative', overflow: 'hidden' }}>
              {details.badge && (
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#7B2FBE', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, fontFamily: "'HubotSans', sans-serif", zIndex: 2 }}>{details.badge}</div>
              )}
              {displayImgs ? (
                <img
                  key={selectedThumb}
                  src={displayImgs[Math.min(selectedThumb, displayImgs.length - 1)]}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '9px' }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '0 12px' }}>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a', fontFamily: "'HubotSans', sans-serif" }}>{product.name}</p>
                  <p style={{ fontWeight: 700, fontSize: '15px', color: '#7B2FBE', fontFamily: "'HubotSans', sans-serif" }}>{fmt(currentTotal)}</p>
                  <p style={{ fontSize: '11px', color: '#555' }}>for {customQty.toLocaleString()} pcs</p>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {displayImgs ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                {displayImgs.map((img, i) => {
                  const thumbSize = displayImgs.length > 4 ? '44px' : displayImgs.length > 3 ? '52px' : '70px'
                  return (
                    <div key={i} onClick={() => setSelectedThumb(i)}
                      style={{ width: thumbSize, height: thumbSize, borderRadius: '6px', border: selectedThumb === i ? '2.5px solid #7B2FBE' : '1.5px solid #ddd', cursor: 'pointer', overflow: 'hidden', background: '#ddd', flexShrink: 0 }}>
                      <img src={img} alt={`View ${i + 1}`} loading="lazy" decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                {thumbColors.map((color, i) => (
                  <div key={i} onClick={() => setSelectedThumb(i)}
                    style={{ flex: 1, aspectRatio: '1', background: color, borderRadius: '6px', border: selectedThumb === i ? '2.5px solid #7B2FBE' : '1px solid #ddd', cursor: 'pointer' }} />
                ))}
              </div>
            )}
          </div>

          {/* CENTER — details & pricing */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', marginBottom: '4px', fontFamily: "'HubotSans', sans-serif" }}>{product.name}</h1>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px', fontFamily: "'HubotSans', sans-serif" }}>{product.category}</p>

            {/* Size selector */}
            <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#333', marginBottom: '8px', fontFamily: "'HubotSans', sans-serif" }}>
              {isDieCut ? 'Size (inches):' : 'Size / Type:'}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {sizes.map(size => {
                const badge = getSizeBadge(size)
                const isSelected = selectedSize === size
                return (
                  <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <button
                      onClick={() => {
                        setSelectedSize(size)
                        setSelectedThumb(0)
                        setCustomQty(isDieCut ? 100 : (product.priceTable[0]?.qty || 1))
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: badge && !isSelected ? `1.5px solid ${badge.bg}` : 'none',
                        background: isSelected ? '#7B2FBE' : (badge ? '#FFF0E8' : '#EDEDED'),
                        color: isSelected ? '#fff' : (badge ? badge.bg : '#333'),
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: "'HubotSans', sans-serif",
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {size}
                    </button>
                    {badge && (
                      <span style={{ fontSize: '9px', background: isSelected ? '#7B2FBE' : badge.bg, color: '#fff', padding: '1px 6px', borderRadius: '8px', fontWeight: 700, lineHeight: 1.5 }}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Custom size inputs — shown only for die-cut + Custom */}
            {isDieCut && selectedSize === 'Custom' && (
              <div style={{ background: '#f8f5ff', border: '1.5px solid #d4b5ff', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px' }}>
                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#333', marginBottom: '10px', fontFamily: "'HubotSans', sans-serif" }}>
                  Enter your custom size (inches):
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px', fontFamily: "'HubotSans', sans-serif" }}>Width (in)</label>
                    <input
                      type="number" min="0.5" step="0.5" value={customWidth}
                      onChange={e => setCustomWidth(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                      style={{ width: '72px', padding: '7px 10px', border: '1.5px solid #ccc', borderRadius: '8px', fontSize: '13px', textAlign: 'center', fontFamily: "'HubotSans', sans-serif", outline: 'none' }}
                    />
                  </div>
                  <span style={{ fontSize: '18px', color: '#666', marginTop: '14px' }}>×</span>
                  <div>
                    <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px', fontFamily: "'HubotSans', sans-serif" }}>Height (in)</label>
                    <input
                      type="number" min="0.5" step="0.5" value={customHeight}
                      onChange={e => setCustomHeight(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                      style={{ width: '72px', padding: '7px 10px', border: '1.5px solid #ccc', borderRadius: '8px', fontSize: '13px', textAlign: 'center', fontFamily: "'HubotSans', sans-serif", outline: 'none' }}
                    />
                  </div>
                  <div style={{ marginTop: '14px', fontSize: '12px', color: '#555', fontFamily: "'HubotSans', sans-serif" }}>
                    → Priced as <strong style={{ color: '#7B2FBE' }}>{effectiveSize}</strong>
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: '#888', marginTop: '8px', lineHeight: 1.5, fontFamily: "'HubotSans', sans-serif" }}>
                  Price estimate based on nearest standard size. Our team will confirm exact pricing.
                </p>
              </div>
            )}

            {/* Price table */}
            <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#333', marginBottom: '8px', fontFamily: "'HubotSans', sans-serif" }}>
              Price Table{isDieCut && selectedSize === 'Custom' && <span style={{ fontSize: '11px', color: '#7B2FBE', fontWeight: 400 }}> (for {effectiveSize})</span>}
              <span style={{ fontSize: '11px', color: '#999', fontWeight: 400 }}> (click a row to set quantity)</span>
            </p>
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee', marginBottom: '18px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: '12px', color: '#555', fontWeight: 700, fontFamily: "'HubotSans', sans-serif" }}>Qty (pcs)</th>
                    <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: '12px', color: '#555', fontWeight: 700, fontFamily: "'HubotSans', sans-serif" }}>Total Price</th>
                    <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: '12px', color: '#555', fontWeight: 700, fontFamily: "'HubotSans', sans-serif" }}>Unit Price</th>
                    {isDieCut && <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: '12px', color: '#555', fontWeight: 700, fontFamily: "'HubotSans', sans-serif" }}>Discount</th>}
                  </tr>
                </thead>
                <tbody>
                  {priceRows.map((row, i) => {
                    const isActive = customQty === row.qty
                    return (
                      <tr key={i}
                        onClick={() => clickQtyRow(row.qty)}
                        style={{ borderTop: '1px solid #eee', cursor: 'pointer', background: isActive ? '#f0e8ff' : 'transparent', transition: 'background 0.15s' }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#faf5ff' }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                      >
                        <td style={{ padding: '9px 14px', fontSize: '13.5px', color: '#222', fontWeight: isActive ? 700 : 400 }}>{row.label || row.qty.toLocaleString()}</td>
                        <td style={{ padding: '9px 14px', fontSize: '13.5px', fontWeight: 700, color: isActive ? '#7B2FBE' : '#222' }}>{fmt(row.total)}</td>
                        <td style={{ padding: '9px 14px', fontSize: '13px', color: '#555' }}>{fmt(row.unitPrice)}/pc</td>
                        {isDieCut && (
                          <td style={{ padding: '9px 14px' }}>
                            {row.discountRate > 0
                              ? <span style={{ background: '#dcfce7', color: '#166534', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>{Math.round(row.discountRate * 100)}% OFF</span>
                              : <span style={{ color: '#999', fontSize: '11px' }}>—</span>
                            }
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Custom quantity */}
            <div style={{ background: '#fafafa', borderRadius: '10px', padding: '14px 16px', border: '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#333', fontFamily: "'HubotSans', sans-serif", whiteSpace: 'nowrap' }}>Custom Qty:</span>
                <button onClick={() => setCustomQty(q => Math.max(1, q - 1))}
                  style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #7B2FBE', background: '#fff', color: '#7B2FBE', fontSize: '18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <input type="number" value={customQty} min={1}
                  onChange={e => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: '80px', padding: '6px 10px', border: '1.5px solid #ccc', borderRadius: '8px', fontSize: '13px', textAlign: 'center', fontFamily: "'HubotSans', sans-serif" }} />
                <button onClick={() => setCustomQty(q => q + 1)}
                  style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#7B2FBE', color: '#fff', fontSize: '18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>Total</p>
                  <p style={{ fontSize: '17px', fontWeight: 800, color: '#7B2FBE', margin: 0, fontFamily: "'HubotSans', sans-serif" }}>{fmt(currentTotal)}</p>
                  {isDieCut && discountPct > 0 && (
                    <p style={{ fontSize: '11px', color: '#16a34a', margin: '2px 0 0', fontWeight: 600 }}>{discountPct}% bulk discount applied!</p>
                  )}
                </div>
              </div>
              {isDieCut && (
                <p style={{ fontSize: '11px', color: '#999', marginTop: '8px', fontFamily: "'HubotSans', sans-serif" }}>
                  Note: Design fee ₦3,000 (first order) · Bulk discounts apply from 500 pcs
                </p>
              )}
            </div>
          </div>

          {/* RIGHT — description */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#7B2FBE', marginBottom: '12px', fontFamily: "'HubotSans', sans-serif" }}>Product Description</h3>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.65, marginBottom: '16px', fontFamily: "'HubotSans', sans-serif" }}>{details.description}</p>

            <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#333', marginBottom: '10px', fontFamily: "'HubotSans', sans-serif" }}>Features:</p>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
              {details.features.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', fontSize: '12.5px', color: '#333', fontFamily: "'HubotSans', sans-serif" }}>
                  <span style={{ color: '#7B2FBE', fontWeight: 700, flexShrink: 0, fontSize: '14px' }}>✓</span>{f}
                </li>
              ))}
            </ul>

            {isDieCut && (
              <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: '#92400e', lineHeight: 1.5 }}>
                <strong>Bulk Discount:</strong><br />
                500 pcs = 10% off · 1,000 pcs = 20% off<br />
                2,000 pcs = 22.5% off · 3,000+ pcs = 25% off (max)
              </div>
            )}

            <button onClick={handleAddToCart}
              style={{ width: '100%', background: added ? '#16a34a' : '#FF6B00', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px', fontFamily: "'HubotSans', sans-serif", transition: 'background 0.3s' }}>
              {added ? '✓ Added to Cart!' : 'Add to Cart'}
            </button>
            <button onClick={handleCheckout}
              style={{ width: '100%', background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px', fontFamily: "'HubotSans', sans-serif" }}>
              Checkout Now
            </button>
            <a href="https://wa.me/2348065275264"
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', fontFamily: "'HubotSans', sans-serif" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Ask via WhatsApp
            </a>
          </div>
        </div>

        {/* Similar items */}
        {similarProducts.length > 0 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: '20px', letterSpacing: '0.5px', fontFamily: "'HubotSans', sans-serif" }}>SIMILAR ITEMS</h3>
            <div className="similar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
              {similarProducts.map((item, i) => {
                const simImgs = PRODUCT_IMAGES[item.slug] || []
                return (
                  <div key={i} onClick={() => navigate(`/store/${item.slug}`)}
                    style={{ background: '#fff', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', border: '1px solid #eee', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(123,47,190,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'}
                  >
                    <div style={{ width: '100%', aspectRatio: '3/4', borderRadius: '6px', overflow: 'hidden', background: '#C8C8C8' }}>
                      {simImgs[0] ? (
                        <img src={simImgs[0]} alt={item.name} loading="lazy" decoding="async"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#C8C8C8' }} />
                      )}
                    </div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', fontFamily: "'HubotSans', sans-serif" }}>{item.name}</p>
                    <button style={{ background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '20px', padding: '5px 0', fontSize: '11px', fontWeight: 600, cursor: 'pointer', width: '80%', fontFamily: "'HubotSans', sans-serif" }}>Shop</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .product-layout { grid-template-columns: 1fr 1fr !important; }
          .product-layout > div:first-child { grid-column: 1 / -1; max-width: 260px; margin: 0 auto; }
        }
        @media (max-width: 600px) {
          .product-layout { grid-template-columns: 1fr !important; }
          .product-layout > div:first-child { max-width: 100%; }
        }
        @media (max-width: 480px) {
          .similar-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}
