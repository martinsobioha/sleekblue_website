import { useNavigate } from 'react-router-dom'

const products = [
  { id: 1, name: 'Die Cut Stickers', highlight: true },
  { id: 2, name: 'Flex Banner', highlight: false },
  { id: 3, name: 'Burial Brochure', highlight: false },
  { id: 4, name: 'Flyers & Posters', highlight: false },
  { id: 5, name: 'Rollup Stand', highlight: false },
  { id: 6, name: 'T-Shirt& Cap\nBranding', highlight: false },
  { id: 7, name: 'Signage & Billboard', highlight: false },
  { id: 8, name: 'Corporate Branding', highlight: false },
  { id: 9, name: 'Die Cut Stickers', price: 'NGN 3,000', unit: 'per 100pcs', highlight: false },
  { id: 10, name: 'Die Cut Stickers', price: 'NGN 3,000', unit: 'per 100pcs', highlight: false },
]

export default function BestSelling() {
  const navigate = useNavigate()

  return (
    <section style={{ background: '#FAF3E8', padding: '40px 24px 50px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#1a1a1a',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}>BEST SELLING</h2>
          <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#777' }}>our most popular and trusted products</p>
        </div>

        {/* Product grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '14px',
        }}>
          {products.map(product => (
            <div
              key={product.id}
              style={{
                background: '#fff',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                border: product.highlight ? '2px solid #F5E6A3' : '1px solid #eee',
                boxShadow: product.highlight ? '0 2px 12px rgba(245,197,24,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              onClick={() => navigate('/product')}
            >
              {/* Placeholder image */}
              <div style={{
                width: '100%',
                aspectRatio: '3/4',
                background: '#C8C8C8',
                borderRadius: '8px',
              }} />

              {/* Product name */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <p style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: product.price ? '2px' : '0',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.3,
                }}>
                  {product.name}
                </p>
                {product.price && (
                  <>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a' }}>{product.price}</p>
                    <p style={{ fontSize: '11px', color: '#777' }}>{product.unit}</p>
                  </>
                )}
              </div>

              {/* Shop button */}
              <button
                style={{
                  background: '#7B2FBE',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '6px 28px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '80%',
                }}
                onClick={e => { e.stopPropagation(); navigate('/product') }}
              >
                Shop
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
