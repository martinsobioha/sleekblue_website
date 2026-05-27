import { useNavigate } from 'react-router-dom'
import { ALL_PRODUCTS } from '../data/products'

export default function StorePage() {
  const navigate = useNavigate()

  return (
    <section style={{ background: '#FAF3E8', padding: '40px 24px 60px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase', marginBottom: '8px', fontFamily: "'HubotSans', sans-serif" }}>Our Store</h1>
        <p style={{ fontSize: '13px', color: '#777', marginBottom: '32px', fontWeight: 400 }}>Browse all our printing and branding products</p>

        {['Flex Printing/Large Format','Label Stickers','Corporate Branding'].map(cat => {
          const items = ALL_PRODUCTS.filter(p => p.category === cat)
          return (
            <div key={cat} style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#7B2FBE', marginBottom: '16px', fontFamily: "'HubotSans', sans-serif", borderBottom: '2px solid #7B2FBE', paddingBottom: '6px', display: 'inline-block' }}>{cat}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
                {items.map(product => (
                  <div key={product.id}
                    style={{ background: '#fff', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', border: '1px solid #eee', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                    onClick={() => navigate(`/store/${product.slug}`)}
                  >
                    <div style={{ width: '100%', aspectRatio: '3/4', background: '#C8C8C8', borderRadius: '8px' }} />
                    <p style={{ fontSize: '12.5px', fontWeight: 600, color: '#1a1a1a', textAlign: 'center', fontFamily: "'HubotSans', sans-serif" }}>{product.name}</p>
                    <p style={{ fontSize: '12px', color: '#555', fontWeight: 500 }}>From ₦{product.price.toLocaleString()}</p>
                    <button style={{ background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '20px', padding: '6px 0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '80%', fontFamily: "'HubotSans', sans-serif" }}
                      onClick={e => { e.stopPropagation(); navigate(`/store/${product.slug}`) }}>
                      Shop
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
