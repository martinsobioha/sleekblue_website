import { useState, useEffect } from 'react'

const DEFAULT_FAQ = [
  {
    question: 'What types of printing services does Sleekblue Media Houz offer?',
    answer: 'We offer a wide range of premium printing and branding services including die-cut stickers, flex banners, flyers & posters, business cards, rollup stands, T-shirts & caps, product labels, vehicle branding, signage & billboards, burial brochures, and corporate graphic design. If you have a custom need, just ask — we handle it.'
  },
  {
    question: 'What is the minimum order quantity?',
    answer: 'Minimum order quantities vary by product. For die-cut stickers, our minimum is 100 pieces. For flyers and business cards, it\'s typically 50–100 pieces. Flex banners and rollup stands can be ordered as a single piece. We\'re flexible — contact us to discuss your specific needs.'
  },
  {
    question: 'How long does production and delivery take?',
    answer: 'Standard production takes 1–3 business days for most products, depending on quantity and complexity. Rush orders can be completed in 24 hours for an additional fee. We deliver nationwide across Nigeria via courier, or you can pick up from our Owerri office. Delivery typically takes 1–3 extra days depending on your location.'
  },
  {
    question: 'Do you offer custom design services?',
    answer: 'Yes! Our in-house design team can create professional artwork for any of our products — from logo design and full brand identity packages to individual print files. Simply place a design request with your brief and we\'ll deliver print-ready artwork. Design turnaround is usually 24–48 hours.'
  },
  {
    question: 'Do you deliver nationwide across Nigeria?',
    answer: 'Absolutely. We deliver to all 36 states and the FCT via trusted courier partners. Whether you\'re in Lagos, Abuja, Port Harcourt, Kano, or anywhere else in Nigeria, we\'ll get your prints to you safely. Delivery fees are calculated at checkout based on your location and order weight.'
  },
  {
    question: 'How do I place an order and what payment methods do you accept?',
    answer: 'You can place an order directly on our website by selecting your product, customising options, and requesting a quote — or chat with us on WhatsApp at +234 806 527 5264. We accept bank transfers, mobile payments, and online card payments. Once payment is confirmed, your order goes straight to production.'
  },
]

const INITIAL_COUNT = 3

export default function FAQ() {
  const [items, setItems] = useState(DEFAULT_FAQ)
  const [open, setOpen] = useState(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch('/api/content')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.faq?.length) setItems(d.faq) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const existing = document.getElementById('faq-schema')
    if (existing) existing.remove()
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer }
      }))
    }
    const tag = document.createElement('script')
    tag.id = 'faq-schema'
    tag.type = 'application/ld+json'
    tag.textContent = JSON.stringify(schema)
    document.head.appendChild(tag)
    return () => { const el = document.getElementById('faq-schema'); if (el) el.remove() }
  }, [items])

  const visibleItems = showAll ? items : items.slice(0, INITIAL_COUNT)
  const hiddenCount = items.length - INITIAL_COUNT

  return (
    <section style={{ background: '#f9f5ff', padding: '64px 24px', fontFamily: "'HubotSans', sans-serif" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#7B2FBE', margin: '0 0 10px' }}>FAQ</p>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900, color: '#1a1a1a', margin: '0 0 12px', lineHeight: 1.2 }}>
            Got questions? We've got answers.
          </h2>
          <p style={{ fontSize: '15px', color: '#666', margin: 0, maxWidth: '520px', marginInline: 'auto', lineHeight: 1.6 }}>
            Everything you need to know about ordering from Sleekblue Media Houz
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visibleItems.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={i}
                style={{ background: '#fff', borderRadius: '14px', border: isOpen ? '1.5px solid #7B2FBE' : '1.5px solid #ece7f6', overflow: 'hidden', boxShadow: isOpen ? '0 4px 20px rgba(123,47,190,0.10)' : '0 1px 4px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '20px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 700, color: isOpen ? '#7B2FBE' : '#1a1a1a', fontFamily: "'HubotSans', sans-serif", lineHeight: 1.4 }}>
                    {item.question}
                  </span>
                  <span style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', background: isOpen ? '#7B2FBE' : '#f0eaf8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', color: isOpen ? '#fff' : '#7B2FBE', fontSize: '16px', fontWeight: 700 }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 22px 20px', borderTop: '1px solid #ece7f6' }}>
                    <p style={{ margin: '14px 0 0', fontSize: '14px', color: '#555', lineHeight: 1.7, fontFamily: "'HubotSans', sans-serif" }}>
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {hiddenCount > 0 && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => { setShowAll(s => !s); if (showAll) setOpen(null) }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: '2px solid #7B2FBE', color: '#7B2FBE', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'HubotSans', sans-serif", transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#7B2FBE'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#7B2FBE' }}
            >
              {showAll ? '▲ Show Less' : `▼ See ${hiddenCount} More Question${hiddenCount > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        <div style={{ marginTop: '36px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#888', margin: '0 0 14px' }}>Still have questions?</p>
          <a href="https://wa.me/2348065275264" target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#25D366', color: '#fff', textDecoration: 'none', borderRadius: '10px', padding: '12px 24px', fontWeight: 700, fontSize: '14px', fontFamily: "'HubotSans', sans-serif" }}>
            💬 Chat with us on WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
