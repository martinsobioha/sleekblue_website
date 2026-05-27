import { useState } from 'react'
import { ALL_PRODUCTS } from '../data/products'

export default function QuotePage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', product: '', quantity: '', details: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    const msg = encodeURIComponent(
      `📋 *QUOTE REQUEST - Sleekblue Media Houz*\n\n` +
      `Name: ${form.name}\n` +
      `Phone: ${form.phone}\n` +
      `Email: ${form.email || 'N/A'}\n` +
      `Product: ${form.product}\n` +
      `Quantity: ${form.quantity}\n` +
      `Details: ${form.details || 'N/A'}\n\n` +
      `Please send a quote for this order. Thank you!`
    )
    window.open(`https://wa.me/2348065275264?text=${msg}`, '_blank')
    setSubmitted(true)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13.5px', fontFamily: "'HubotSans', sans-serif", outline: 'none', color: '#222' }

  return (
    <section style={{ background: '#FAF3E8', padding: '48px 24px 80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px', fontFamily: "'HubotSans', sans-serif" }}>Request a Quote</h1>
        <p style={{ fontSize: '14px', color: '#777', marginBottom: '32px', fontWeight: 400, fontFamily: "'HubotSans', sans-serif" }}>Fill in the details below and we'll respond via WhatsApp within minutes.</p>

        {submitted ? (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#28a745', marginBottom: '10px', fontFamily: "'HubotSans', sans-serif" }}>Quote Sent!</h2>
            <p style={{ color: '#555', fontSize: '14px' }}>We've received your request and will reply on WhatsApp shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>Full Name *</label>
              <input required style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your full name" />
            </div>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>Phone Number *</label>
              <input required style={inputStyle} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+234 800 000 0000" />
            </div>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>Email Address</label>
              <input style={inputStyle} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your@email.com" type="email" />
            </div>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>Product Needed *</label>
              <select required style={{ ...inputStyle, background: '#fff' }} value={form.product} onChange={e => setForm({...form, product: e.target.value})}>
                <option value="">Select a product...</option>
                {ALL_PRODUCTS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>Quantity *</label>
              <input required style={inputStyle} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="e.g. 500 pcs" />
            </div>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>Additional Details</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }} value={form.details} onChange={e => setForm({...form, details: e.target.value})} placeholder="Size, design details, deadline, etc." />
            </div>
            <button type="submit" style={{ width: '100%', background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: "'HubotSans', sans-serif" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Send Quote Request via WhatsApp
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
