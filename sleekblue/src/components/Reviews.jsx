import { useState, useEffect, useRef } from 'react'
import { FaStar } from 'react-icons/fa'

const DEFAULT_REVIEWS = {
  heading: 'Customers love Sleekblue',
  rating: '5.0/5',
  reviewCount: '500+',
  googleReviewUrl: 'https://share.google/OwMhndIizA29kGair',
  testimonials: [],
}

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function Reviews() {
  const [data, setData] = useState(DEFAULT_REVIEWS)

  useEffect(() => {
    fetch('/api/content')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.reviews) setData({ ...DEFAULT_REVIEWS, ...d.reviews }) })
      .catch(() => {})
  }, [])

  const googleUrl = data.googleReviewUrl || DEFAULT_REVIEWS.googleReviewUrl
  const cards = (data.testimonials || []).filter(t => t.visible !== false)
  const hasCards = cards.length > 0

  if (!hasCards) {
    // No reviews yet — show Google CTA only
    return (
      <section style={{ background: '#FAF3E8', padding: '40px 24px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#7B2FBE', marginBottom: '10px', fontFamily: "'HubotSans', sans-serif" }}>
          {data.heading}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[1,2,3,4,5].map(i => <FaStar key={i} size={20} color="#F5A623" />)}
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#333', fontFamily: "'HubotSans', sans-serif" }}>
            {data.rating} · {data.reviewCount} happy clients
          </span>
        </div>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {googleUrl && (
            <a href={googleUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#4285F4', color: '#fff', borderRadius: '24px', padding: '11px 24px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', fontFamily: "'HubotSans', sans-serif" }}>
              <GoogleIcon /> View Our Google Reviews
            </a>
          )}
          {googleUrl && (
            <a href={googleUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fff', color: '#4285F4', border: '1.5px solid #4285F4', borderRadius: '24px', padding: '11px 24px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', fontFamily: "'HubotSans', sans-serif" }}>
              ✍️ Leave us a Review
            </a>
          )}
        </div>
      </section>
    )
  }

  return (
    <section style={{ background: '#FAF3E8', padding: '40px 0 50px', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#7B2FBE', marginBottom: '10px', fontFamily: "'HubotSans', sans-serif" }}>
          {data.heading}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[1,2,3,4,5].map(i => <FaStar key={i} size={18} color="#F5A623" />)}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#333', fontFamily: "'HubotSans', sans-serif" }}>
            {data.rating} · {data.reviewCount} reviews
          </span>
          {googleUrl && (
            <a href={googleUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1.5px solid #4285F4', color: '#4285F4', borderRadius: '20px', padding: '5px 14px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', fontFamily: "'HubotSans', sans-serif" }}>
              <GoogleIcon /> View on Google
            </a>
          )}
        </div>
      </div>

      {/* Scrolling marquee */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <style>{`
          @keyframes reviewMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .review-track { display: flex; width: max-content; animation: reviewMarquee 35s linear infinite; gap: 20px; padding: 8px 0; }
          .review-track:hover { animation-play-state: paused; }
        `}</style>
        <div className="review-track">
          {[...cards, ...cards].map((t, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '20px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #eee', textAlign: 'left', width: '300px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map(s => <FaStar key={s} size={13} color={s <= (t.rating || 5) ? '#F5A623' : '#ddd'} />)}
                </div>
                <GoogleIcon />
              </div>
              <p style={{ fontSize: '13px', color: '#333', lineHeight: 1.65, fontFamily: "'HubotSans', sans-serif", marginBottom: '14px', fontStyle: 'italic' }}>"{t.text}"</p>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a', margin: 0, fontFamily: "'HubotSans', sans-serif" }}>{t.name}</p>
                {t.location && <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0', fontFamily: "'HubotSans', sans-serif" }}>{t.location}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
        {googleUrl && (
          <a href={googleUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#4285F4', color: '#fff', borderRadius: '24px', padding: '11px 26px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', fontFamily: "'HubotSans', sans-serif" }}>
            <GoogleIcon /> Leave us a Google Review
          </a>
        )}
        <button onClick={() => document.getElementById('sbm-review-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#7B2FBE', color: '#fff', borderRadius: '24px', padding: '11px 26px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'HubotSans', sans-serif" }}>
          ✍️ Share Your Experience
        </button>
      </div>

      <ReviewSubmitForm />
    </section>
  )
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n)}
          style={{ cursor: 'pointer', fontSize: '26px', color: n <= (hover || value) ? '#F5A623' : '#ddd', transition: 'color 0.1s', lineHeight: 1 }}>★</span>
      ))}
    </div>
  )
}

function ReviewSubmitForm() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', location: '', rating: 5, text: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const formRef = useRef(null)

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.text.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', location: '', rating: 5, text: '' })
        setTimeout(() => { setStatus(null); setOpen(false) }, 4000)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
    setLoading(false)
  }

  return (
    <div id="sbm-review-form" ref={formRef} style={{ maxWidth: '560px', margin: '28px auto 0', padding: '0 24px' }}>
      {!open ? (
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => setOpen(true)}
            style={{ background: 'transparent', border: '2px dashed #7B2FBE55', borderRadius: '12px', padding: '16px 28px', cursor: 'pointer', color: '#7B2FBE', fontSize: '13px', fontWeight: 700, fontFamily: "'HubotSans', sans-serif", width: '100%', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5f0ff'; e.currentTarget.style.borderColor = '#7B2FBE' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#7B2FBE55' }}
          >
            ✍️ Worked with us before? Share your experience — it helps other businesses find us!
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 24px rgba(123,47,190,0.10)', border: '1.5px solid #e0d6f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a1a', margin: 0, fontFamily: "'HubotSans', sans-serif" }}>Share your experience ✍️</h3>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '20px', lineHeight: 1, padding: '2px 6px' }}>×</button>
          </div>

          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#16a34a', margin: '0 0 6px', fontFamily: "'HubotSans', sans-serif" }}>Thank you for your review!</p>
              <p style={{ fontSize: '13px', color: '#666', margin: 0, fontFamily: "'HubotSans', sans-serif" }}>It will appear on the site once approved by our team.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.4px' }}>Your Rating *</label>
                <StarPicker value={form.rating} onChange={v => set('rating', v)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '5px', fontFamily: "'HubotSans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.4px' }}>Full Name *</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Emeka Okafor"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: "'HubotSans', sans-serif", outline: 'none', boxSizing: 'border-box', color: '#222' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '5px', fontFamily: "'HubotSans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.4px' }}>City / State <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
                  <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Owerri, Imo State"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: "'HubotSans', sans-serif", outline: 'none', boxSizing: 'border-box', color: '#222' }} />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '5px', fontFamily: "'HubotSans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.4px' }}>Your Review *</label>
                <textarea required rows={4} value={form.text} onChange={e => set('text', e.target.value)}
                  placeholder="Tell others about your experience with Sleekblue Media Houz — quality, speed, customer service…"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: "'HubotSans', sans-serif", outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: '#222', lineHeight: 1.6 }} />
              </div>

              {status === 'error' && (
                <p style={{ color: '#dc2626', fontSize: '12px', marginBottom: '12px', fontFamily: "'HubotSans', sans-serif" }}>Something went wrong. Please try again.</p>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, background: loading ? '#ccc' : '#7B2FBE', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'HubotSans', sans-serif" }}>
                  {loading ? 'Submitting…' : '⭐ Submit Review'}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  style={{ background: '#f5f5f5', color: '#555', border: 'none', borderRadius: '8px', padding: '12px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'HubotSans', sans-serif" }}>
                  Cancel
                </button>
              </div>

              <p style={{ fontSize: '11px', color: '#aaa', marginTop: '12px', textAlign: 'center', fontFamily: "'HubotSans', sans-serif" }}>
                Reviews are moderated and appear on the site after approval by our team.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
