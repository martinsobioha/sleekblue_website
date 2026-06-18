import { useNavigate } from 'react-router-dom'
import { ALL_PRODUCTS } from '../data/products'
import { PRODUCT_IMAGES } from '../data/productImages'
import { useSEO } from '../hooks/useSEO'
import Breadcrumb from '../components/Breadcrumb'

export default function StorePage() {
  const navigate = useNavigate()
  useSEO('store', { title: 'Our Store — Sleekblue Media Houz', description: 'Shop all our printing and branding products — die-cut stickers, flex banners, business cards, t-shirts and more. Fast delivery across Nigeria.' })
  const categories = ['Flex Printing/Large Format', 'Label Stickers', 'Corporate Branding']

  return (
    <section style={{ background: '#FAF3E8', padding: '32px 16px 60px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Store' }]} />
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>Our Store</h1>
        <p style={{ fontSize: '13px', color: '#777', marginBottom: '32px', fontWeight: 400 }}>Browse all our printing and branding products</p>

        {categories.map(cat => {
          const items = ALL_PRODUCTS.filter(p => p.category === cat)
          return (
            <div key={cat} style={{ marginBottom: '44px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#7B2FBE', fontFamily: "'HubotSans', sans-serif" }}>{cat}</h2>
                <div style={{ flex: 1, height: '1px', background: '#e0d6f5' }} />
              </div>
              <div className="store-grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
                {items.map(product => {
                  const imgs = PRODUCT_IMAGES[product.slug] || []
                  return (
                    <div key={product.id}
                      style={{ background: '#fff', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', border: '1px solid #eee', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                      onClick={() => navigate(`/store/${product.slug}`)}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 18px rgba(123,47,190,0.13)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'}
                    >
                      <div style={{ width: '100%', aspectRatio: '3/4', borderRadius: '8px', overflow: 'hidden', background: '#C8C8C8' }}>
                        {imgs[0] ? (
                          <img
                            src={imgs[0]}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#C8C8C8' }} />
                        )}
                      </div>
                      <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#1a1a1a', textAlign: 'center', fontFamily: "'HubotSans', sans-serif" }}>{product.name}</p>
                      <p style={{ fontSize: '12px', color: '#7B2FBE', fontWeight: 600 }}>From ₦{product.price.toLocaleString()}</p>
                      <button
                        style={{ background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '20px', padding: '7px 0', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', width: '85%', fontFamily: "'HubotSans', sans-serif" }}
                        onClick={e => { e.stopPropagation(); navigate(`/store/${product.slug}`) }}
                      >
                        Shop Now
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .store-grid-5 { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .store-grid-5 { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .store-grid-5 { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}
