import { useState, useEffect, useRef } from 'react'
import logo from '@assets/SLEEKBLUE_LOGO_1779927359068.jpg'

const TERMS_VERSION = 'June 2026'

const TERMS_SECTIONS = [
  { title: 'IMPORTANT: PLEASE READ CAREFULLY BEFORE PLACING AN ORDER', body: 'By accessing our website, uploading artwork, placing an order, making payment, or using any of our services, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.' },
  { title: '1. ABOUT OUR SERVICES', body: 'Sleekblue Media Houz provides printing, branding, die-cut stickers, signage, large-format printing, design, promotional materials, and related services. All orders placed through our website are subject to these Terms & Conditions.' },
  { title: '2. ORDER CONFIRMATION', body: 'Customers are solely responsible for reviewing and confirming:\n• Product size and dimensions\n• Quantity ordered\n• Design and artwork\n• Spelling, grammar, and content\n• Finishing specifications\n• Delivery information\n• Contact details\n\nProduction will only commence after payment has been received and order confirmation has been completed. Once production begins, orders cannot be cancelled.' },
  { title: '3. ARTWORK & DESIGN APPROVAL', body: 'Where artwork previews are provided, customers must carefully review all details before approval. Approval may be given through WhatsApp messages. Once the customer approves a design, the approval becomes final.\n\nSleekblue shall not be responsible for errors relating to:\n• Spelling mistakes\n• Incorrect dimensions\n• Design placement\n• Colour choices approved by the customer\n• Missing information supplied by the customer' },
  { title: '4. CUSTOMER ARTWORK RESPONSIBILITY', body: 'Customers warrant that they own or have permission to use all logos, images, trademarks, designs, and content submitted for printing. Sleekblue Media Houz shall not be liable for any copyright infringement, trademark infringement, or intellectual property disputes arising from customer-submitted materials. The customer agrees to indemnify and hold Sleekblue harmless from any related claims.' },
  { title: '5. MEASUREMENT RESPONSIBILITY', body: 'Customers are fully responsible for providing accurate dimensions. If a customer specifies "Print 3 inches × 4 inches", the product will be produced exactly as instructed. Incorrect measurements supplied by customers do not qualify for refunds, replacements, or reprints. Customers are strongly encouraged to physically take their measurement before confirming an order.' },
  { title: '6. PRODUCT COLOUR DISCLAIMER', body: 'Printed colours may vary slightly from mobile screens, computer monitors, previous print jobs, and digital artwork previews. Minor colour variations are normal within the printing industry and do not qualify for refunds or reprints.' },
  { title: '7. PAYMENT TERMS', body: 'Full payment is required before production begins unless otherwise agreed in writing. Orders remain pending until payment is successfully verified. If a payment is declined, reversed, or disputed, Sleekblue reserves the right to suspend production, withhold delivery, or take appropriate recovery action.' },
  { title: '8. CHARGEBACK & PAYMENT DISPUTES', body: 'Customers agree not to initiate fraudulent chargebacks or payment disputes after receiving products or services. Where a chargeback is initiated despite successful delivery or completion of services, Sleekblue reserves the right to submit evidence including order records, design approvals, delivery records, and communication history. The customer shall remain liable for all legitimate charges and associated recovery costs.' },
  { title: '9. PRODUCTION TIMELINES', body: 'Estimated production and delivery dates are provided for guidance only. Production schedules may be affected by power outages, equipment breakdown, material shortages, public holidays, weather conditions, logistics disruptions, and events beyond our control. Sleekblue shall not be liable for delays caused by such circumstances.' },
  { title: '10. DELIVERY POLICY', body: 'Customers are responsible for providing accurate delivery information. Sleekblue shall not be responsible for delays, failed deliveries, or additional costs resulting from incorrect customer information. Risk transfers to the customer once products are handed over to a courier, transport company, dispatch rider, or designated collection agent.' },
  { title: '11. OPENING & INSPECTION REQUIREMENT', body: 'Customers must inspect orders immediately upon receipt. For any complaint relating to wrong quantity, wrong design, damaged items, or missing items, customers must provide:\n• Order number\n• Clear photos\n• Continuous unedited unboxing video\n\nComplaints must be submitted within 24 hours of delivery. Claims submitted outside this period may not be considered.' },
  { title: '12. REFUND & REPLACEMENT POLICY', body: 'ELIGIBLE CASES — Sleekblue may provide a replacement, reprint, partial refund, or full refund where:\n• Wrong size was produced contrary to approved specifications\n• Wrong quantity was supplied\n• Wrong artwork was printed\n• Production defects occurred due to our error\n\nNON-ELIGIBLE CASES — Refunds, replacements, or reprints will NOT be granted where:\n• Customer supplied incorrect measurements\n• Customer approved artwork containing errors\n• Low-resolution files were submitted\n• Customer changes their mind\n• Customer ordered the wrong quantity\n• Minor colour variations occur\n• Incorrect delivery information was supplied\n• Product damage occurs after delivery\n\nAll claims are subject to verification.' },
  { title: '13. LIMITATION OF LIABILITY', body: 'To the maximum extent permitted by law, Sleekblue Media Houz shall not be liable for loss of profit, loss of business, loss of contracts, indirect damages, or consequential damages. Our maximum liability shall not exceed the amount paid for the specific order in dispute.' },
  { title: '14. PRIVACY', body: 'Customer information is collected solely for order processing, customer support, delivery coordination, and service improvement. We do not sell customer information to third parties.' },
  { title: '15. FORCE MAJEURE', body: 'Sleekblue shall not be liable for any failure or delay caused by events beyond reasonable control, including natural disasters, government actions, civil disturbances, strikes, power failures, pandemics, transportation disruptions, or supplier shortages.' },
  { title: '16. GOVERNING LAW', body: 'These Terms & Conditions shall be governed by and interpreted under the laws of the Federal Republic of Nigeria. Any dispute arising from these Terms shall be subject to the jurisdiction of Nigerian courts.' },
  { title: '17. DISPUTE RESOLUTION', body: 'Before commencing any court action, the customer agrees to first notify Sleekblue Media Houz in writing and allow up to 14 business days for investigation and resolution of the complaint. Both parties shall make reasonable efforts to resolve disputes amicably before resorting to litigation.' },
  { title: '18. ACCEPTANCE OF TERMS', body: 'By clicking "I Agree", placing an order, making payment, uploading artwork, or using our services, you acknowledge that you have read, understood, and accepted these Terms & Conditions in full.\n\nYour acceptance is electronically recorded with date and time, your name, email, phone number, IP address, and the version of these Terms. Electronic records, digital communications, website logs, invoices, and order records may be relied upon as evidence of acceptance.' },
]

function validateFullName(v) {
  const parts = v.trim().split(/\s+/).filter(Boolean)
  return parts.length >= 2 && parts.every(p => p.length >= 2)
}
function validateEmail(v) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v.trim())
}
function validatePhone(v) {
  const digits = v.replace(/[\s\-\(\)\+\.]/g, '')
  return /^\d{10,15}$/.test(digits)
}

const F = { fontFamily: "'HubotSans', sans-serif" }

export default function TermsModal() {
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [nameErr, setNameErr] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [phoneErr, setPhoneErr] = useState('')
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [declined, setDeclined] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!sessionStorage.getItem('sbm_terms_accepted')) setShow(true)
  }, [])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 30) setScrolledToBottom(true)
  }

  function blurName(v) {
    if (!v.trim()) return setNameErr('Full name is required')
    if (!validateFullName(v)) return setNameErr('Enter both first and last name (e.g. John Doe)')
    setNameErr('')
  }
  function blurEmail(v) {
    if (!v.trim()) return setEmailErr('Email address is required')
    if (!validateEmail(v)) return setEmailErr('Enter a valid email (e.g. you@gmail.com)')
    setEmailErr('')
  }
  function blurPhone(v) {
    if (!v.trim()) return setPhoneErr('WhatsApp number is required')
    if (!validatePhone(v)) return setPhoneErr('Enter a valid number with 10–15 digits (e.g. 08012345678)')
    setPhoneErr('')
  }

  async function handleAgree() {
    let ok = true
    if (!validateFullName(name)) { setNameErr('Enter both first and last name (e.g. John Doe)'); ok = false } else setNameErr('')
    if (!validateEmail(email))   { setEmailErr('Enter a valid email (e.g. you@gmail.com)'); ok = false }    else setEmailErr('')
    if (!validatePhone(phone))   { setPhoneErr('Enter a valid number with 10–15 digits (e.g. 08012345678)'); ok = false } else setPhoneErr('')
    if (!ok) return

    setSubmitting(true)
    let ipAddress = 'unavailable'
    try {
      const r = await fetch('https://api.ipify.org?format=json')
      ipAddress = (await r.json()).ip
    } catch {}

    const payload = {
      customerName: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      ipAddress,
      termsVersion: TERMS_VERSION,
    }
    let acceptanceId = 'local_' + Date.now()
    try {
      const res = await fetch('/api/accept-terms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const d = await res.json(); acceptanceId = d.acceptanceId || acceptanceId }
    } catch {}
    localStorage.setItem('sbm_latest_acceptance', JSON.stringify({ ...payload, acceptanceId, timestamp: new Date().toISOString() }))
    sessionStorage.setItem('sbm_terms_accepted', 'true')
    setSubmitting(false)
    setShow(false)
  }

  if (!show) return null

  const allValid = validateFullName(name) && validateEmail(email) && validatePhone(phone)

  if (declined) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '40px 32px', maxWidth: '440px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', marginBottom: '12px', ...F }}>Terms Required</h2>
          <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.6, marginBottom: '24px', ...F }}>
            You must accept our Terms &amp; Conditions to use Sleekblue Media Houz services. Without acceptance, we are unable to process orders.
          </p>
          <button onClick={() => setDeclined(false)} style={{ background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', ...F }}>
            Go Back &amp; Review Terms
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '660px', maxHeight: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', overflow: 'hidden' }}>

        <div style={{ background: '#7B2FBE', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <img src={logo} alt="Sleekblue Media Houz" style={{ height: '40px', width: 'auto', borderRadius: '6px', background: '#fff', padding: '3px' }} />
          <div>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 800, margin: 0, ...F }}>Terms &amp; Conditions of Sale</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', margin: '2px 0 0', ...F }}>Version: {TERMS_VERSION} · Please read carefully before continuing</p>
          </div>
        </div>

        <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#FAFAFA' }}>
          <div style={{ background: '#FFF8E1', border: '1.5px solid #F9A825', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12.5px', color: '#7B3F00', margin: 0, fontWeight: 600, lineHeight: 1.5, ...F }}>
              ⚠️ By clicking "I Agree", creating an order, uploading artwork, approving a design, making payment, or using any service provided by Sleekblue Media Houz, you confirm that you have read, understood, and accepted these Terms &amp; Conditions. Electronic records, digital communications, website logs, invoices, and order records may be relied upon as evidence of acceptance.
            </p>
          </div>
          {TERMS_SECTIONS.map((s, i) => (
            <div key={i} style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '12.5px', fontWeight: 800, color: '#7B2FBE', marginBottom: '6px', ...F, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.title}</h3>
              <p style={{ fontSize: '12.5px', color: '#333', lineHeight: 1.7, whiteSpace: 'pre-line', ...F, margin: 0 }}>{s.body}</p>
            </div>
          ))}
          <div style={{ background: '#f0e8ff', border: '1.5px solid #7B2FBE', borderRadius: '10px', padding: '14px 16px', marginTop: '10px', marginBottom: '4px' }}>
            <p style={{ fontSize: '12px', color: '#5a1a9b', margin: 0, fontWeight: 600, lineHeight: 1.6, ...F }}>Last Updated: {TERMS_VERSION} · Sleekblue Media Houz — Print · Branding · Design · Production</p>
          </div>
        </div>

        <div style={{ padding: '16px 24px 20px', background: '#fff', borderTop: '1px solid #eee', flexShrink: 0 }}>
          {!scrolledToBottom && (
            <p style={{ fontSize: '11.5px', color: '#888', textAlign: 'center', marginBottom: '10px', ...F }}>↓ Please scroll to the bottom to review all terms before accepting</p>
          )}
          <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#333', marginBottom: '10px', ...F }}>Your details (required to record your acceptance):</p>

          <div style={{ marginBottom: '8px' }}>
            <input type="text" placeholder="Full Name * (e.g. John Doe)" value={name}
              onChange={e => { setName(e.target.value); if (nameErr) blurName(e.target.value) }}
              onBlur={e => blurName(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${nameErr ? '#dc2626' : '#ddd'}`, borderRadius: '8px', fontSize: '13px', ...F, outline: 'none', boxSizing: 'border-box' }} />
            {nameErr && <p style={{ fontSize: '11px', color: '#dc2626', margin: '3px 0 0', ...F }}>{nameErr}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div>
              <input type="email" placeholder="Email Address * (e.g. you@gmail.com)" value={email}
                onChange={e => { setEmail(e.target.value); if (emailErr) blurEmail(e.target.value) }}
                onBlur={e => blurEmail(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${emailErr ? '#dc2626' : '#ddd'}`, borderRadius: '8px', fontSize: '13px', ...F, outline: 'none', boxSizing: 'border-box' }} />
              {emailErr && <p style={{ fontSize: '11px', color: '#dc2626', margin: '3px 0 0', ...F }}>{emailErr}</p>}
            </div>
            <div>
              <input type="tel" placeholder="WhatsApp Number * (e.g. 08012345678)" value={phone}
                onChange={e => { setPhone(e.target.value); if (phoneErr) blurPhone(e.target.value) }}
                onBlur={e => blurPhone(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${phoneErr ? '#dc2626' : '#ddd'}`, borderRadius: '8px', fontSize: '13px', ...F, outline: 'none', boxSizing: 'border-box' }} />
              {phoneErr && <p style={{ fontSize: '11px', color: '#dc2626', margin: '3px 0 0', ...F }}>{phoneErr}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={() => setDeclined(true)} style={{ flex: 1, padding: '11px', background: '#fff', border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, color: '#888', cursor: 'pointer', ...F }}>Decline</button>
            <button onClick={handleAgree} disabled={submitting}
              style={{ flex: 2, padding: '11px', background: allValid ? '#7B2FBE' : '#ccc', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: allValid ? 'pointer' : 'not-allowed', ...F, transition: 'background 0.2s' }}>
              {submitting ? 'Recording acceptance…' : '✓ I Agree — Continue to Site'}
            </button>
          </div>
          <p style={{ fontSize: '10.5px', color: '#aaa', textAlign: 'center', marginTop: '8px', lineHeight: 1.5, ...F }}>
            Your acceptance is electronically recorded with timestamp, IP address, and contact details.
          </p>
        </div>
      </div>
    </div>
  )
}
