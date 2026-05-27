import { useNavigate } from 'react-router-dom'
import { BEST_SELLING } from '../data/products'

export default function BestSelling() {
  const navigate = useNavigate()

  return (
    <section style={{ background: '#FAF3E8', padding: '40px 24px 50px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>BEST SELLING</h2>
          <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#777', fontFamily: "'HubotSans', sans-serif", fontWeight: 400 }}>our most popular and trusted products</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          {BEST_SELLING.map((product, idx) => (
            <div key={idx}
              style={{ background: '#fff', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', border: product.highlight ? '2px solid #F5E6A3' : '1px solid #eee', boxShadow: product.highlight ? '0 2px 12px rgba(245,197,24,0.15)' : '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer' }}
              onClick={() => navigate(`/store/${product.slug || 'die-cut-stickers'}`)}
            >
              <div style={{ width: '100%', aspectRatio: '3/4', background: '#C8C8C8', borderRadius: '8px' }} />
              <div style={{ textAlign: 'center', width: '100%' }}>
                <p style={{ fontSize: '12.5px', fontWeight: 600, color: '#1a1a1a', whiteSpace: 'pre-line', lineHeight: 1.3, fontFamily: "'HubotSans', sans-serif" }}>{product.name}</p>
                {product.showPrice && (
                  <>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a', fontFamily: "'HubotSans', sans-serif" }}>{product.price}</p>
                    <p style={{ fontSize: '11px', color: '#777' }}>{product.unit}</p>
                  </>
                )}
              </div>
              <button style={{ background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '20px', padding: '6px 28px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '80%', fontFamily: "'HubotSans', sans-serif" }}
                onClick={e => { e.stopPropagation(); navigate(`/store/${product.slug || 'die-cut-stickers'}`) }}>
                Shop
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
