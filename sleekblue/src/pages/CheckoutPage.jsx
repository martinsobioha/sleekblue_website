import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cartItems, total, discountAmount, discount, clearCart } = useCart()
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', notes: '' })
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!form.address.trim()) e.address = 'Delivery address is required'
    if (!form.city.trim()) e.city = 'City is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function buildWhatsAppMessage() {
    const items = cartItems.map(i => `• ${i.name} (${i.size || 'Standard'}) x${i.quantity} = ₦${(i.price * i.quantity).toLocaleString()}`).join('\n')
    const disc = discount > 0 ? `\nBulk Discount (${Math.round(discount * 100)}%): -₦${discountAmount.toLocaleString()}` : ''
    return encodeURIComponent(
      `🛒 *NEW ORDER - Sleekblue Media Houz*\n\n` +
      `*Customer Details:*\n` +
      `Name: ${form.name}\n` +
      `Phone: ${form.phone}\n` +
      `Email: ${form.email || 'N/A'}\n` +
      `Delivery Address: ${form.address}, ${form.city}\n` +
      `${form.notes ? `Notes: ${form.notes}\n` : ''}` +
      `\n*Order Items:*\n${items}${disc}\n\n` +
      `*ORDER TOTAL: ₦${Math.round(total).toLocaleString()}*\n\n` +
      `Please confirm and process this order. Thank you!`
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    const msg = buildWhatsAppMessage()
    clearCart()
    window.open(`https://wa.me/2348065275264?text=${msg}`, '_blank')
    navigate('/')
  }

  if (cartItems.length === 0) {
    navigate('/store')
    return null
  }

  const inputStyle = (field) => ({
    width: '100%', padding: '10px 14px', border: `1.5px solid ${errors[field] ? '#e74c3c' : '#ddd'}`, borderRadius: '8px', fontSize: '13.5px', fontFamily: "'HubotSans', sans-serif", outline: 'none', color: '#222',
  })

  return (
    <section style={{ background: '#FAF3E8', padding: '32px 24px 60px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a1a', marginBottom: '24px', fontFamily: "'HubotSans', sans-serif" }}>Checkout</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#7B2FBE', marginBottom: '16px', fontFamily: "'HubotSans', sans-serif" }}>Delivery Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>Full Name *</label>
                  <input style={inputStyle('name')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your full name" />
                  {errors.name && <p style={{ fontSize: '11px', color: '#e74c3c', marginTop: '4px' }}>{errors.name}</p>}
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>Phone Number *</label>
                  <input style={inputStyle('phone')} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+234 800 000 0000" />
                  {errors.phone && <p style={{ fontSize: '11px', color: '#e74c3c', marginTop: '4px' }}>{errors.phone}</p>}
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>Email Address</label>
                  <input style={inputStyle('email')} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your@email.com" type="email" />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>City *</label>
                  <input style={inputStyle('city')} value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Your city" />
                  {errors.city && <p style={{ fontSize: '11px', color: '#e74c3c', marginTop: '4px' }}>{errors.city}</p>}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>Delivery Address *</label>
                  <input style={inputStyle('address')} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street address, area" />
                  {errors.address && <p style={{ fontSize: '11px', color: '#e74c3c', marginTop: '4px' }}>{errors.address}</p>}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>Additional Notes</label>
                  <textarea style={{ ...inputStyle('notes'), resize: 'vertical', minHeight: '80px' }} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any special instructions for your order..." />
                </div>
              </div>
            </div>
            <button type="submit" style={{ width: '100%', background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: "'HubotSans', sans-serif" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Confirm Order via WhatsApp
            </button>
          </form>

          {/* Order summary */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans', sans-serif" }}>Order Summary</h3>
            {cartItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: '#333' }}>{item.name} x{item.quantity}</span>
                <span style={{ fontWeight: 600 }}>₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '4px' }}>
              {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#28a745', marginBottom: '8px' }}><span>Bulk Discount</span><span>−₦{discountAmount.toLocaleString()}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#7B2FBE' }}>
                <span>Total</span><span>₦{Math.round(total).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
