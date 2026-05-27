import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { ALL_PRODUCTS } from '../data/products'

const priceTable = [
  { qty: 100, price: 'N5,000', unitPrice: 50 },
  { qty: 200, price: 'N10,000', unitPrice: 50 },
  { qty: 500, price: 'N22,500', unitPrice: 45 },
  { qty: 1000, price: 'N40,000', unitPrice: 40 },
]

const thumbColors = ['#C8C8C8', '#B0B0B0', '#D5D5D5']

export default function ProductPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const product = ALL_PRODUCTS.find(p => p.slug === slug) || ALL_PRODUCTS[5]
  const sizes = product.sizes || ['3x3', '4x4', '3x4', '2x2', '3x2']

  const [selectedSize, setSelectedSize] = useState(sizes[0])
  const [customQty, setCustomQty] = useState(100)
  const [selectedThumb, setSelectedThumb] = useState(0)
  const [added, setAdded] = useState(false)

  function getPrice(qty) {
    const table = product.priceTable || priceTable
    let unit = table[0]?.unitPrice || 50
    for (const row of table) {
      if (qty >= row.qty) unit = row.unitPrice
    }
    return unit * qty
  }

  function handleAddToCart() {
    addToCart({
      id: product.id,
      name: product.name,
      size: selectedSize,
      quantity: customQty,
      price: getPrice(1),
      totalPrice: getPrice(customQty),
      slug: product.slug,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleCheckout() {
    handleAddToCart()
    navigate('/cart')
  }

  const similarProducts = ALL_PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 8)

  return (
    <section style={{ background: '#FAF3E8', padding: '32px 24px 50px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: '24px', marginBottom: '40px', alignItems: 'start' }}>

          {/* Left: image panel */}
          <div>
            <div style={{ background: thumbColors[selectedThumb], borderRadius: '12px', border: '3px solid #7B2FBE', width: '100%', aspectRatio: '3/4', marginBottom: '10px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a', fontFamily: "'HubotSans', sans-serif" }}>{product.name}</p>
                <p style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a' }}>₦{product.price.toLocaleString()}</p>
                <p style={{ fontSize: '12px', color: '#555' }}>per 100pcs</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {thumbColors.map((color, i) => (
                <div key={i} onClick={() => setSelectedThumb(i)}
                  style={{ flex: 1, aspectRatio: '1', background: color, borderRadius: '6px', border: selectedThumb === i ? '2px solid #7B2FBE' : '1px solid #ddd', cursor: 'pointer', transition: 'border 0.2s' }} />
              ))}
            </div>
          </div>

          {/* Center: product details */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#7B2FBE', marginBottom: '14px', fontFamily: "'HubotSans', sans-serif" }}>Product Details</h3>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#333', marginBottom: '8px', fontFamily: "'HubotSans', sans-serif" }}>Size:</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
              {sizes.map(size => (
                <button key={size} onClick={() => setSelectedSize(size)}
                  style={{ padding: '5px 14px', borderRadius: '20px', border: 'none', background: selectedSize === size ? '#7B2FBE' : '#E8E8E8', color: selectedSize === size ? '#fff' : '#333', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: "'HubotSans', sans-serif" }}>
                  {size}
                </button>
              ))}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '13px', color: '#333', fontWeight: 700, borderBottom: '1px solid #eee', fontFamily: "'HubotSans', sans-serif" }}>Quantity</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '13px', color: '#333', fontWeight: 700, borderBottom: '1px solid #eee', fontFamily: "'HubotSans', sans-serif" }}>Price (N)</th>
                </tr>
              </thead>
              <tbody>
                {priceTable.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee', background: customQty >= row.qty ? '#f9f5ff' : 'transparent' }}>
                    <td style={{ padding: '8px 12px', fontSize: '13.5px', color: '#333' }}>{row.qty}</td>
                    <td style={{ padding: '8px 12px', fontSize: '13.5px', fontWeight: 600, color: '#333' }}>{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Custom quantity with active +/- */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#333', fontFamily: "'HubotSans', sans-serif" }}>Custom</span>
              <button onClick={() => setCustomQty(q => Math.max(1, q - 1))}
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid #7B2FBE', background: '#fff', color: '#7B2FBE', fontSize: '18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>−</button>
              <input type="number" value={customQty} min={1}
                onChange={e => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: '72px', padding: '6px 10px', border: '1.5px solid #ccc', borderRadius: '6px', fontSize: '13px', textAlign: 'center', fontFamily: "'HubotSans', sans-serif" }} />
              <button onClick={() => setCustomQty(q => q + 1)}
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#7B2FBE', color: '#fff', fontSize: '18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
              <span style={{ fontSize: '13px', color: '#555' }}>Total: <strong style={{ color: '#7B2FBE' }}>₦{getPrice(customQty).toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Right: description */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#7B2FBE', marginBottom: '14px', fontFamily: "'HubotSans', sans-serif" }}>Product Description</h3>
            <div style={{ display: 'inline-block', background: '#7B2FBE', color: '#fff', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '10px', fontFamily: "'HubotSans', sans-serif" }}>Most Popular</div>
            <p style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a', marginBottom: '4px', fontFamily: "'HubotSans', sans-serif" }}>{selectedSize} {product.name}</p>
            <p style={{ fontSize: '12px', color: '#777', marginBottom: '12px', fontStyle: 'italic' }}>Best for Zobo, Parfait, Yoghurt, Tiger Nut. etc...</p>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
              {['Waterproof', 'High quality Print', 'Strong adhesive', 'Cut to any shape of your desire', 'Easy to peel and paste on your products'].map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '7px', fontSize: '13px', color: '#333', fontFamily: "'HubotSans', sans-serif", fontWeight: 400 }}>
                  <span style={{ color: '#7B2FBE', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleAddToCart}
                style={{ flex: 1, background: added ? '#28a745' : '#FF6B00', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 0', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.3s', fontFamily: "'HubotSans', sans-serif" }}>
                {added ? '✓ Added!' : 'Add to cart'}
              </button>
              <button onClick={handleCheckout}
                style={{ flex: 1, background: '#fff', color: '#333', border: '1.5px solid #bbb', borderRadius: '8px', padding: '10px 0', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', fontFamily: "'HubotSans', sans-serif" }}>
                Checkout
              </button>
            </div>
          </div>
        </div>

        {/* Similar items */}
        {similarProducts.length > 0 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: '20px', letterSpacing: '0.5px', fontFamily: "'HubotSans', sans-serif" }}>SIMILAR ITEMS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(similarProducts.length, 8)}, 1fr)`, gap: '10px' }}>
              {similarProducts.map((item, i) => (
                <div key={i} onClick={() => navigate(`/store/${item.slug}`)}
                  style={{ background: '#fff', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', border: '1px solid #eee', cursor: 'pointer' }}>
                  <div style={{ width: '100%', aspectRatio: '3/4', background: '#C8C8C8', borderRadius: '6px' }} />
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', fontFamily: "'HubotSans', sans-serif" }}>{item.name}</p>
                  <button style={{ background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '20px', padding: '5px 0', fontSize: '11px', fontWeight: 600, cursor: 'pointer', width: '80%', fontFamily: "'HubotSans', sans-serif" }}>Shop</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
