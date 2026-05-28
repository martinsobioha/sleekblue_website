import { useNavigate } from 'react-router-dom'
import { BEST_SELLING } from '../data/products'

export default function BestSelling() {
  const navigate = useNavigate()

  return (
    <section style={{ background: '#FAF3E8', padding: '40px 16px 50px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>BEST SELLING</h2>
          <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#777', fontFamily: "'HubotSans', sans-serif", fontWeight: 400 }}>our most popular and trusted products</p>
        </div>
        <div className="best-selling-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          {BEST_SELLING.map((product, idx) => (
            <div key={idx}
              style={{ background: '#fff', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', border: idx === 0 ? '2px solid #F5C518' : '1px solid #eee', boxShadow: idx === 0 ? '0 2px 12px rgba(245,197,24,0.18)' : '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onClick={() => navigate(`/store/${product.slug}`)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 18px rgba(123,47,190,0.15)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = idx === 0 ? '0 2px 12px rgba(245,197,24,0.18)' : '0 1px 4px rgba(0,0,0,0.05)'}
            >
              <div style={{ width: '100%', aspectRatio: '3/4', background: idx % 2 === 0 ? '#C8C8C8' : '#B8B8B8', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                {idx === 0 && (
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#F5C518', color: '#1a1a1a', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700 }}>Most Popular</div>
                )}
              </div>
              <div style={{ textAlign: 'center', width: '100%' }}>
                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, fontFamily: "'HubotSans', sans-serif", marginBottom: '3px' }}>{product.name}</p>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#7B2FBE', fontFamily: "'HubotSans', sans-serif", margin: 0 }}>{product.price}</p>
                <p style={{ fontSize: '10.5px', color: '#888', margin: 0 }}>{product.unit}</p>
              </div>
              <button
                style={{ background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '20px', padding: '7px 0', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', width: '85%', fontFamily: "'HubotSans', sans-serif" }}
                onClick={e => { e.stopPropagation(); navigate(`/store/${product.slug}`) }}
              >
                Shop Now
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .best-selling-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .best-selling-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .best-selling-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}
