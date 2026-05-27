import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const sizes = ['3x3', '4x4', '3x4', '2x2', '3x2']

const priceTable = [
  { qty: 100, price: 'N5,000' },
  { qty: 200, price: 'N10,000' },
  { qty: 500, price: 'N22,500' },
  { qty: 1000, price: 'N40,000' },
]

const similarItems = Array(8).fill({ name: 'T-Shirt& Cap\nBranding' })

export default function ProductPage() {
  const [selectedSize, setSelectedSize] = useState('3x3')
  const [customQty, setCustomQty] = useState('')
  const navigate = useNavigate()

  return (
    <section style={{ background: '#FAF3E8', padding: '32px 24px 50px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Main product area */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr 280px',
          gap: '24px',
          marginBottom: '40px',
          alignItems: 'start',
        }}>

          {/* Left: Product image panel */}
          <div>
            {/* Main image */}
            <div style={{
              background: '#C8C8C8',
              borderRadius: '12px',
              border: '3px solid #7B2FBE',
              width: '100%',
              aspectRatio: '3/4',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '12px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a' }}>Die Cut Stickers</p>
                <p style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a' }}>NGN 3,000</p>
                <p style={{ fontSize: '12px', color: '#555' }}>per 100pcs</p>
              </div>
            </div>

            {/* Thumbnails */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  flex: 1,
                  aspectRatio: '1',
                  background: '#C8C8C8',
                  borderRadius: '6px',
                  border: i === 1 ? '2px solid #7B2FBE' : '1px solid #ddd',
                }} />
              ))}
            </div>
          </div>

          {/* Center: Product details */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#7B2FBE', marginBottom: '14px' }}>
              Product Details
            </h3>

            {/* Size options */}
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>Size:</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '20px',
                    border: 'none',
                    background: selectedSize === size ? '#7B2FBE' : '#E8E8E8',
                    color: selectedSize === size ? '#fff' : '#333',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Price table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '13px', color: '#333', fontWeight: 700, borderBottom: '1px solid #eee' }}>Quantity</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '13px', color: '#333', fontWeight: 700, borderBottom: '1px solid #eee' }}>Price (N)</th>
                </tr>
              </thead>
              <tbody>
                {priceTable.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px 12px', fontSize: '13.5px', color: '#333' }}>{row.qty}</td>
                    <td style={{ padding: '8px 12px', fontSize: '13.5px', fontWeight: 600, color: '#333' }}>{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Custom qty */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>Custom</span>
              <span style={{ fontSize: '15px', color: '#555' }}>-</span>
              <input
                type="number"
                value={customQty}
                onChange={e => setCustomQty(e.target.value)}
                style={{
                  width: '80px',
                  padding: '6px 10px',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  fontSize: '13px',
                  textAlign: 'center',
                }}
                placeholder="0"
              />
              <span style={{ fontSize: '18px', color: '#7B2FBE', fontWeight: 700, cursor: 'pointer' }}>+</span>
            </div>
          </div>

          {/* Right: Product description */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#7B2FBE', marginBottom: '14px' }}>
              Product Description
            </h3>

            {/* Most Popular badge */}
            <div style={{
              display: 'inline-block',
              background: '#7B2FBE',
              color: '#fff',
              padding: '4px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '10px',
            }}>
              Most Popular
            </div>

            <p style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a', marginBottom: '4px' }}>3x3 Die Cut Stickers</p>
            <p style={{ fontSize: '12px', color: '#777', marginBottom: '12px', fontStyle: 'italic' }}>
              Best for Zobo, Parfait, Yoghurt, Tiger Nut. etc...
            </p>

            {/* Features */}
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
              {['Waterproof', 'High quality Print', 'Strong adhesive', 'Cut to any shape of your desire', 'Easy to peel and paste on your produts'].map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '7px', fontSize: '13px', color: '#333' }}>
                  <span style={{ color: '#7B2FBE', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{
                flex: 1,
                background: '#FF6B00',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 0',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}>
                Add to cart
              </button>
              <button style={{
                flex: 1,
                background: '#fff',
                color: '#333',
                border: '1.5px solid #bbb',
                borderRadius: '8px',
                padding: '10px 0',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}>
                Checkout
              </button>
            </div>
          </div>
        </div>

        {/* Similar Items */}
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 800,
            color: '#1a1a1a',
            textAlign: 'center',
            marginBottom: '20px',
            letterSpacing: '0.5px',
          }}>SIMILAR ITEMS</h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '10px',
          }}>
            {similarItems.map((item, i) => (
              <div key={i} style={{
                background: '#fff',
                borderRadius: '10px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #eee',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  width: '100%',
                  aspectRatio: '3/4',
                  background: '#C8C8C8',
                  borderRadius: '6px',
                }} />
                <p style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  textAlign: 'center',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.3,
                }}>{item.name}</p>
                <button style={{
                  background: '#7B2FBE',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '5px 0',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '80%',
                }}>
                  Shop
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
