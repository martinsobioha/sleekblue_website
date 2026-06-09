import { useState, useEffect } from 'react'
import { FaStar } from 'react-icons/fa'

const DEFAULT_REVIEWS = {
  heading: 'Customers love Sleekblue',
  rating: '5.0/5',
  reviewCount: '500+',
  testimonials: [],
}

export default function Reviews() {
  const [data, setData] = useState(DEFAULT_REVIEWS)

  useEffect(() => {
    fetch('/api/content')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.reviews) setData({ ...DEFAULT_REVIEWS, ...d.reviews }) })
      .catch(() => {})
  }, [])

  const visibleTestimonials = (data.testimonials || []).filter(t => t.visible !== false)

  return (
    <section style={{ background: '#FAF3E8', padding: '40px 24px 60px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#7B2FBE', textDecoration: 'underline', textDecorationColor: '#7B2FBE', marginBottom: '10px' }}>
          {data.heading}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[1,2,3,4,5].map(i => <FaStar key={i} size={20} color="#F5A623" />)}
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>{data.rating} based on {data.reviewCount} reviews</span>
        </div>

        {visibleTestimonials.length > 0 ? (
          <div className="reviews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {visibleTestimonials.map((t, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '22px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1px solid #eee', textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
                  {[1,2,3,4,5].map(s => <FaStar key={s} size={14} color={s <= (t.rating || 5) ? '#F5A623' : '#ddd'} />)}
                </div>
                <p style={{ fontSize: '13px', color: '#333', lineHeight: 1.65, fontFamily: "'HubotSans', sans-serif", marginBottom: '14px', fontStyle: 'italic' }}>"{t.text}"</p>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a', margin: 0, fontFamily: "'HubotSans', sans-serif" }}>{t.name}</p>
                  {t.location && <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0', fontFamily: "'HubotSans', sans-serif" }}>{t.location}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="reviews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: '#fff', borderRadius: '10px', height: '110px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #eee' }} />
            ))}
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 768px) { .reviews-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 1024px) { .reviews-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </section>
  )
}
