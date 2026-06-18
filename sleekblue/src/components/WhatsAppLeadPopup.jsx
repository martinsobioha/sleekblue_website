import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const STORAGE_KEY = 'sbm_wa_popup'
const HIDE_PATHS = ['/sbm-control-2026', '/cart', '/checkout']

export default function WhatsAppLeadPopup() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState('form')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (HIDE_PATHS.some(p => location.pathname.startsWith(p))) return
    const state = localStorage.getItem(STORAGE_KEY)
    if (state === 'dismissed' || state === 'subscribed') return

    let timer
    const onScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      if (scrolled > 0.35) { show(); window.removeEventListener('scroll', onScroll) }
    }
    timer = setTimeout(() => { show(); window.removeEventListener('scroll', onScroll) }, 18000)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll) }
  }, [location.pathname])

  function show() {
    const state = localStorage.getItem(STORAGE_KEY)
    if (state === 'dismissed' || state === 'subscribed') return
    setVisible(true)
  }

  function dismiss() {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, 'dismissed')
  }

  async function submit(e) {
    e.preventDefault()
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid WhatsApp number'); return
    }
    setSubmitting(true); setError('')
    try {
      await fetch('/api/subscribe-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      })
      localStorage.setItem(STORAGE_KEY, 'subscribed')
      setStep('success')
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  if (!visible) return null

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '16px', zIndex: 9998, maxWidth: '340px', width: 'calc(100vw - 32px)', animation: 'slideUp 0.35s ease' }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <div style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden', border: '1.5px solid #ece7f6' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #7B2FBE, #25D366)', padding: '16px 18px', position: 'relative' }}>
          <button onClick={dismiss}
            style={{ position: 'absolute', top: '10px', right: '12px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            ×
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🎁</span>
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: '14.5px', margin: '0 0 2px', fontFamily: "'HubotSans', sans-serif" }}>Get Exclusive Deals</p>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', margin: 0, fontFamily: "'HubotSans', sans-serif" }}>Join our WhatsApp broadcast for deals & promos</p>
            </div>
          </div>
        </div>

        {step === 'success' ? (
          <div style={{ padding: '24px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
            <p style={{ fontSize: '15px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 6px', fontFamily: "'HubotSans', sans-serif" }}>You're in!</p>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px', fontFamily: "'HubotSans', sans-serif" }}>We'll send you exclusive deals and printing tips on WhatsApp.</p>
            <button onClick={() => setVisible(false)}
              style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 28px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: "'HubotSans', sans-serif" }}>
              ✓ Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ padding: '16px 18px 18px' }}>
            <p style={{ fontSize: '12.5px', color: '#555', margin: '0 0 14px', lineHeight: 1.5, fontFamily: "'HubotSans', sans-serif" }}>
              Subscribe to be first to hear about bulk discounts, new products, and seasonal offers.
            </p>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #e0d6f5', borderRadius: '9px', padding: '10px 12px', fontSize: '13px', fontFamily: "'HubotSans', sans-serif", outline: 'none', boxSizing: 'border-box', color: '#1a1a1a' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="tel"
                placeholder="WhatsApp number (e.g. 08012345678) *"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError('') }}
                required
                style={{ width: '100%', border: `1.5px solid ${error ? '#dc2626' : '#e0d6f5'}`, borderRadius: '9px', padding: '10px 12px', fontSize: '13px', fontFamily: "'HubotSans', sans-serif", outline: 'none', boxSizing: 'border-box', color: '#1a1a1a' }}
              />
              {error && <p style={{ color: '#dc2626', fontSize: '11px', margin: '4px 0 0', fontFamily: "'HubotSans', sans-serif" }}>{error}</p>}
            </div>
            <button type="submit" disabled={submitting}
              style={{ width: '100%', background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 700, fontSize: '13.5px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: "'HubotSans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {submitting ? '⏳ Subscribing…' : '💬 Join WhatsApp Deals'}
            </button>
            <p style={{ fontSize: '10.5px', color: '#bbb', textAlign: 'center', margin: '10px 0 0', fontFamily: "'HubotSans', sans-serif" }}>
              No spam. Unsubscribe anytime. We only send deals.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
