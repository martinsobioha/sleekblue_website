import { useState, useEffect, useRef } from 'react'
import logo from '@assets/SLEEKBLUE_LOGO_1779927359068.jpg'

const TERMS_VERSION = 'June 2026'

const TERMS_SECTIONS = [
  {
    title: 'IMPORTANT: PLEASE READ CAREFULLY BEFORE PLACING AN ORDER',
    body: 'By accessing our website, uploading artwork, placing an order, making payment, or using any of our services, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.',
  },
  {
    title: '1. ABOUT OUR SERVICES',
    body: 'Sleekblue Media Houz provides printing, branding, die-cut stickers, signage, large-format printing, design, promotional materials, and related services. All orders placed through our website are subject to these Terms & Conditions.',
  },
  {
    title: '2. ORDER CONFIRMATION',
    body: 'Customers are solely responsible for reviewing and confirming:\n• Product size and dimensions\n• Quantity ordered\n• Design and artwork\n• Spelling, grammar, and content\n• Finishing specifications\n• Delivery information\n• Contact details\n\nProduction will only commence after payment has been received and order confirmation has been completed. Once production begins, orders cannot be cancelled.',
  },
  {
    title: '3. ARTWORK & DESIGN APPROVAL',
    body: 'Where artwork previews are provided, customers must carefully review all details before approval. Approval may be given through WhatsApp messages. Once the customer approves a design, the approval becomes final.\n\nSleekblue shall not be responsible for errors relating to:\n• Spelling mistakes\n• Incorrect dimensions\n• Design placement\n• Colour choices approved by the customer\n• Missing information supplied by the customer',
  },
  {
    title: '4. CUSTOMER ARTWORK RESPONSIBILITY',
    body: 'Customers warrant that they own or have permission to use all logos, images, trademarks, designs, and content submitted for printing. Sleekblue Media Houz shall not be liable for any copyright infringement, trademark infringement, or intellectual property disputes arising from customer-submitted materials. The customer agrees to indemnify and hold Sleekblue harmless from any related claims.',
  },
  {
    title: '5. MEASUREMENT RESPONSIBILITY',
    body: 'Customers are fully responsible for providing accurate dimensions. If a customer specifies "Print 3 inches × 4 inches", the product will be produced exactly as instructed. Incorrect measurements supplied by customers do not qualify for refunds, replacements, or reprints. Customers are strongly encouraged to physically take their measurement before confirming an order.',
  },
  {
    title: '6. PRODUCT COLOUR DISCLAIMER',
    body: 'Printed colours may vary slightly from mobile screens, computer monitors, previous print jobs, and digital artwork previews. Minor colour variations are normal within the printing industry and do not qualify for refunds or reprints.',
  },
  {
    title: '7. PAYMENT TERMS',
    body: 'Full payment is required before production begins unless otherwise agreed in writing. Orders remain pending until payment is successfully verified. If a payment is declined, reversed, or disputed, Sleekblue reserves the right to suspend production, withhold delivery, or take appropriate recovery action.',
  },
  {
    title: '8. CHARGEBACK & PAYMENT DISPUTES',
    body: 'Customers agree not to initiate fraudulent chargebacks or payment disputes after receiving products or services. Where a chargeback is initiated despite successful delivery or completion of services, Sleekblue reserves the right to submit evidence including order records, design approvals, delivery records, and communication history. The customer shall remain liable for all legitimate charges and associated recovery costs.',
  },
  {
    title: '9. PRODUCTION TIMELINES',
    body: 'Estimated production and delivery dates are provided for guidance only. Production schedules may be affected by power outages, equipment breakdown, material shortages, public holidays, weather conditions, logistics disruptions, and events beyond our control. Sleekblue shall not be liable for delays caused by such circumstances.',
  },
  {
    title: '10. DELIVERY POLICY',
    body: 'Customers are responsible for providing accurate delivery information. Sleekblue shall not be responsible for delays, failed deliveries, or additional costs resulting from incorrect customer information. Risk transfers to the customer once products are handed over to a courier, transport company, dispatch rider, or designated collection agent.',
  },
  {
    title: '11. OPENING & INSPECTION REQUIREMENT',
    body: 'Customers must inspect orders immediately upon receipt. For any complaint relating to wrong quantity, wrong design, damaged items, or missing items, customers must provide:\n• Order number\n• Clear photos\n• Continuous unedited unboxing video\n\nComplaints must be submitted within 24 hours of delivery. Claims submitted outside this period may not be considered.',
  },
  {
    title: '12. REFUND & REPLACEMENT POLICY',
    body: 'ELIGIBLE CASES — Sleekblue may provide a replacement, reprint, partial refund, or full refund where:\n• Wrong size was produced contrary to approved specifications\n• Wrong quantity was supplied\n• Wrong artwork was printed\n• Production defects occurred due to our error\n\nNON-ELIGIBLE CASES — Refunds, replacements, or reprints will NOT be granted where:\n• Customer supplied incorrect measurements\n• Customer approved artwork containing errors\n• Low-resolution files were submitted\n• Customer changes their mind\n• Customer ordered the wrong quantity\n• Minor colour variations occur\n• Incorrect delivery information was supplied\n• Product damage occurs after delivery\n\nAll claims are subject to verification.',
  },
  {
    title: '13. LIMITATION OF LIABILITY',
    body: 'To the maximum extent permitted by law, Sleekblue Media Houz shall not be liable for loss of profit, loss of business, loss of contracts, indirect damages, or consequential damages. Our maximum liability shall not exceed the amount paid for the specific order in dispute.',
  },
  {
    title: '14. PRIVACY',
    body: 'Customer information is collected solely for order processing, customer support, delivery coordination, and service improvement. We do not sell customer information to third parties.',
  },
  {
    title: '15. FORCE MAJEURE',
    body: 'Sleekblue shall not be liable for any failure or delay caused by events beyond reasonable control, including natural disasters, government actions, civil disturbances, strikes, power failures, pandemics, transportation disruptions, or supplier shortages.',
  },
  {
    title: '16. GOVERNING LAW',
    body: 'These Terms & Conditions shall be governed by and interpreted under the laws of the Federal Republic of Nigeria. Any dispute arising from these Terms shall be subject to the jurisdiction of Nigerian courts.',
  },
  {
    title: '17. DISPUTE RESOLUTION',
    body: 'Before commencing any court action, the customer agrees to first notify Sleekblue Media Houz in writing and allow up to 14 business days for investigation and resolution of the complaint. Both parties shall make reasonable efforts to resolve disputes amicably before resorting to litigation.',
  },
  {
    title: '18. ACCEPTANCE OF TERMS',
    body: 'By clicking "I Agree", placing an order, making payment, uploading artwork, or using our services, you acknowledge that you have read, understood, and accepted these Terms & Conditions in full.\n\nYour acceptance is electronically recorded with date and time, your name, email, phone number, IP address, and the version of these Terms. Electronic records, digital communications, website logs, invoices, and order records may be relied upon as evidence of acceptance.',
  },
]

export default function TermsModal() {
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [declined, setDeclined] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!sessionStorage.getItem('sbm_terms_accepted')) {
      setShow(true)
    }
  }, [])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 30) {
      setScrolledToBottom(true)
    }
  }

  async function handleAgree() {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in your name, email, and phone number to continue.')
      return
    }
    setSubmitting(true)
    setError('')

    let ipAddress = 'unavailable'
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json')
      const ipData = await ipRes.json()
      ipAddress = ipData.ip
    } catch {}

    const payload = {
      customerName: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      ipAddress,
      termsVersion: TERMS_VERSION,
    }

    let acceptanceId = 'local_' + Date.now()
    try {
      const res = await fetch('/api/accept-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        acceptanceId = data.acceptanceId || acceptanceId
      }
    } catch {}

    const record = { ...payload, acceptanceId, timestamp: new Date().toISOString() }
    localStorage.setItem('sbm_latest_acceptance', JSON.stringify(record))
    sessionStorage.setItem('sbm_terms_accepted', 'true')
    setSubmitting(false)
    setShow(false)
  }

  if (!show) return null

  const canSubmit = name.trim() && email.trim() && phone.trim()

  if (declined) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '40px 32px', maxWidth: '440px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', marginBottom: '12px', fontFamily: "'HubotSans', sans-serif" }}>
            Terms Required
          </h2>
          <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.6, marginBottom: '24px', fontFamily: "'HubotSans', sans-serif" }}>
            You must accept our Terms &amp; Conditions to use Sleekblue Media Houz services. Without acceptance, we are unable to process orders.
          </p>
          <button
            onClick={() => setDeclined(false)}
            style={{ background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'HubotSans', sans-serif" }}
          >
            Go Back & Review Terms
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '660px', maxHeight: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#7B2FBE', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <img src={logo} alt="Sleekblue Media Houz" style={{ height: '40px', width: 'auto', borderRadius: '6px', background: '#fff', padding: '3px' }} />
          <div>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 800, margin: 0, fontFamily: "'HubotSans', sans-serif" }}>
              Terms &amp; Conditions of Sale
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', margin: '2px 0 0', fontFamily: "'HubotSans', sans-serif" }}>
              Version: {TERMS_VERSION} · Please read carefully before continuing
            </p>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#FAFAFA' }}
        >
          <div style={{ background: '#FFF8E1', border: '1.5px solid #F9A825', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12.5px', color: '#7B3F00', margin: 0, fontWeight: 600, lineHeight: 1.5, fontFamily: "'HubotSans', sans-serif" }}>
              ⚠️ By clicking "I Agree", creating an order, uploading artwork, approving a design, making payment, or using any service provided by Sleekblue Media Houz, you confirm that you have read, understood, and accepted these Terms &amp; Conditions. Electronic records, digital communications, website logs, invoices, and order records may be relied upon as evidence of acceptance.
            </p>
          </div>

          {TERMS_SECTIONS.map((section, i) => (
            <div key={i} style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '12.5px', fontWeight: 800, color: '#7B2FBE', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {section.title}
              </h3>
              <p style={{ fontSize: '12.5px', color: '#333', lineHeight: 1.7, whiteSpace: 'pre-line', fontFamily: "'HubotSans', sans-serif", margin: 0 }}>
                {section.body}
              </p>
            </div>
          ))}

          <div style={{ background: '#f0e8ff', border: '1.5px solid #7B2FBE', borderRadius: '10px', padding: '14px 16px', marginTop: '10px', marginBottom: '4px' }}>
            <p style={{ fontSize: '12px', color: '#5a1a9b', margin: 0, fontWeight: 600, lineHeight: 1.6, fontFamily: "'HubotSans', sans-serif" }}>
              Last Updated: {TERMS_VERSION} · Sleekblue Media Houz — Print · Branding · Design · Production
            </p>
          </div>
        </div>

        {/* Footer — form + buttons */}
        <div style={{ padding: '18px 24px 20px', background: '#fff', borderTop: '1px solid #eee', flexShrink: 0 }}>
          {!scrolledToBottom && (
            <p style={{ fontSize: '11.5px', color: '#888', textAlign: 'center', marginBottom: '12px', fontFamily: "'HubotSans', sans-serif" }}>
              ↓ Please scroll to the bottom to review all terms before accepting
            </p>
          )}

          <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#333', marginBottom: '10px', fontFamily: "'HubotSans', sans-serif" }}>
            Your details (required to record your acceptance):
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Full Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: "'HubotSans', sans-serif", outline: 'none', gridColumn: '1 / -1' }}
            />
            <input
              type="email"
              placeholder="Email Address *"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: "'HubotSans', sans-serif", outline: 'none' }}
            />
            <input
              type="tel"
              placeholder="Phone Number *"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: "'HubotSans', sans-serif", outline: 'none' }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: '#dc2626', marginBottom: '8px', fontFamily: "'HubotSans', sans-serif" }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setDeclined(true)}
              style={{ flex: 1, padding: '11px', background: '#fff', border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, color: '#888', cursor: 'pointer', fontFamily: "'HubotSans', sans-serif" }}
            >
              Decline
            </button>
            <button
              onClick={handleAgree}
              disabled={submitting}
              style={{
                flex: 2,
                padding: '11px',
                background: canSubmit ? '#7B2FBE' : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                fontFamily: "'HubotSans', sans-serif",
                transition: 'background 0.2s',
              }}
            >
              {submitting ? 'Recording acceptance…' : '✓ I Agree — Continue to Site'}
            </button>
          </div>
          <p style={{ fontSize: '10.5px', color: '#aaa', textAlign: 'center', marginTop: '8px', lineHeight: 1.5, fontFamily: "'HubotSans', sans-serif" }}>
            Your acceptance is electronically recorded with timestamp, IP address, and contact details.
          </p>
        </div>
      </div>
    </div>
  )
}
