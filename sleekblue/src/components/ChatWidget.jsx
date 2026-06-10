import { useState, useEffect, useRef } from 'react'
import { FaComments, FaTimes, FaWhatsapp, FaPaperPlane } from 'react-icons/fa'

const WHATSAPP_NUM = '2348065275264'
const PHONE = '+234 806 527 5264'

// ─── Knowledge base ───────────────────────────────────────────────────────────
const KB = [
  {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'hii', 'helo'],
    answer: `Hello! 👋 Welcome to **Sleekblue Media Houz** — Nigeria's premium printing & branding company. How can I help you today?\n\nYou can ask me about our products, pricing, delivery, or how to place an order.`,
    quick: ['What do you print?', 'What are your prices?', 'How do I order?', 'Where are you located?'],
  },
  {
    patterns: ['product', 'print', 'what do you', 'services', 'offer', 'sell', 'make', 'produce'],
    answer: `We print and produce:\n\n🏷️ **Stickers & Labels** — Die-cut stickers, product labels, water labels\n🪟 **Large Format** — Flex banners, billboards, SAV printing, window graphics, reflective flex\n📋 **Corporate Branding** — Business cards, letterheads, brochures, flyers, ID cards, lanyards\n👕 **Merchandise** — T-shirts, caps, pens, mugs, umbrellas, tote bags, paper bags, hand fans\n📅 **Calendars** — Table & wall calendars\n🚗 **Vehicle Branding** — Car & bus branding\n🎨 **Design** — Logo design, graphic design`,
    quick: ['Die-cut sticker prices', 'Flex banner prices', 'Business card prices', 'How to order'],
  },
  {
    patterns: ['die cut', 'die-cut', 'sticker price', 'sticker cost', 'sticker', 'label price', 'label cost'],
    answer: `Our **Die-Cut Sticker** prices depend on size and quantity:\n\n📌 **1.5×1.5"** — starts ₦22,500 for 500pcs\n📌 **2×2"** — starts ₦27,500 for 500pcs\n📌 **3×3"** ⭐ Most Popular — starts ₦37,500 for 500pcs\n📌 **3×4"** — starts ₦45,000 for 500pcs\n📌 **4×4"** — starts ₦55,000 for 500pcs\n\n✅ Waterproof, durable, full-colour printing\n✅ Bulk discounts: up to 25% off at 3,000+ pcs\n\nFor custom sizes or larger quantities, chat us on WhatsApp for a quote.`,
    quick: ['How to order stickers', 'Chat on WhatsApp', 'What files do I need?'],
  },
  {
    patterns: ['flex', 'banner', 'billboard', 'large format', 'rollup', 'roll-up', 'signage'],
    answer: `**Large Format Printing:**\n\n🪟 **Flex Banners** — from ₦3,000/sqm (any size)\n📢 **Billboards** — custom quote based on size\n🪟 **Window Graphics / SAV** — vinyl sticker printing\n🚨 **Reflective Flex** — for outdoor visibility at night\n📦 **Rollup Stands** — portable display stands\n\nFor exact pricing, please visit our store page or chat us on WhatsApp with your required dimensions.`,
    quick: ['Get a custom quote', 'Chat on WhatsApp', 'What is reflective flex?'],
  },
  {
    patterns: ['reflective', 'reflective flex'],
    answer: `**Reflective Flex Printing** uses special reflective material that shines brightly when light hits it at night — perfect for:\n\n• Road signs\n• Safety vests\n• Night-time event banners\n• Store fronts that should be visible at night\n\nChat us on WhatsApp for pricing based on your size.`,
    quick: ['Chat on WhatsApp', 'What else do you print?'],
  },
  {
    patterns: ['business card', 'complimentary', 'letterhead', 'brochure', 'flyer', 'corporate'],
    answer: `**Corporate Print Products:**\n\n💼 **Business Cards** — from ₦15,000 for 500pcs, glossy or matte\n📄 **Letterheads** — full-colour premium printing\n📋 **Brochures** — bifold, trifold, custom layouts\n✉️ **Flyers & Posters** — from ₦30,000 per 500 copies\n🆔 **ID Cards** — PVC, printed both sides\n🎫 **Lanyards** — custom branded\n\nVisit our store for full pricing details.`,
    quick: ['How to order', 'Chat on WhatsApp', 'What other products?'],
  },
  {
    patterns: ['t-shirt', 'tshirt', 'shirt', 'cap', 'hat', 'mug', 'umbrella', 'pen', 'bag', 'merch', 'merchandise'],
    answer: `**Branded Merchandise:**\n\n👕 **T-Shirts** — custom branded, from ₦5,000 each\n🧢 **Caps** — from ₦2,500 each\n☕ **Mugs** — custom branded\n✒️ **Pens** — branded bulk pens\n☂️ **Umbrellas** — branded umbrellas\n👜 **Bags** — tote bags, paper bags, nylon bags\n\nAll merchandise available in bulk with discounts. Chat us on WhatsApp to get started.`,
    quick: ['How to order', 'Chat on WhatsApp'],
  },
  {
    patterns: ['price', 'cost', 'how much', 'rate', 'charge', 'expensive', 'cheap', 'affordable', 'pricing'],
    answer: `Our pricing depends on the product and quantity. Here are starting prices:\n\n• Die-cut stickers 3×3" — from ₦37,500/500pcs\n• Flex banners — from ₦3,000/sqm\n• Business cards — from ₦15,000/500pcs\n• T-shirts — from ₦5,000 each\n• Flyers — from ₦30,000/500pcs\n\n💰 **Bulk discounts available** — the more you order, the more you save!\n\nFor exact pricing, visit our **Store page** or send us your specifications on WhatsApp.`,
    quick: ['Die-cut sticker prices', 'Chat on WhatsApp', 'How to order'],
  },
  {
    patterns: ['order', 'how to order', 'place order', 'buy', 'purchase', 'get started'],
    answer: `**How to order from Sleekblue:**\n\n1️⃣ Browse our **Store** and select your product\n2️⃣ Choose your size and quantity\n3️⃣ Click **Add to Cart** or **Request a Quote**\n4️⃣ Proceed to checkout\n\n**OR** — the fastest way:\n💬 Chat us directly on **WhatsApp** with your design and requirements, and we'll give you a quote right away!`,
    quick: ['Chat on WhatsApp', 'What files do I need?', 'What is the turnaround time?'],
  },
  {
    patterns: ['file', 'artwork', 'design', 'format', 'pdf', 'ai', 'psd', 'corel', 'send'],
    answer: `**Artwork & File Requirements:**\n\n✅ Accepted formats: **PDF, AI, PSD, CDR, PNG, JPEG**\n✅ Resolution: **300 DPI or higher** for best print quality\n✅ Color mode: **CMYK** preferred\n✅ Include bleed margins where possible\n\n🎨 **No artwork?** We offer **professional graphic design** — just tell us your idea!\n\nSend your files via WhatsApp or email once you've placed your order.`,
    quick: ['Do you do graphic design?', 'Chat on WhatsApp', 'How to order'],
  },
  {
    patterns: ['design', 'graphic design', 'logo', 'create', 'make my design'],
    answer: `Yes! We offer **professional graphic design services**:\n\n🎨 Logo design\n🎨 Social media graphics\n🎨 Flyer & brochure design\n🎨 Business card design\n🎨 Brand identity packages\n\nOur designers are experienced and fast. Chat us on WhatsApp to discuss your design project and get a quote.`,
    quick: ['Chat on WhatsApp', 'How to order'],
  },
  {
    patterns: ['delivery', 'shipping', 'dispatch', 'send to me', 'location', 'where'],
    answer: `**Delivery Information:**\n\nWe deliver across Nigeria:\n\n🚚 **Lagos** — same day or next day delivery available\n📦 **Other states** — 2–5 working days via courier\n🏪 **Walk-in pickup** available at our office\n\nDelivery fees depend on your location. Chat us on WhatsApp to confirm delivery to your area.`,
    quick: ['Chat on WhatsApp', 'Where are you located?', 'How to order'],
  },
  {
    patterns: ['turnaround', 'how long', 'when ready', 'production time', 'duration', 'days'],
    answer: `**Production Turnaround Times:**\n\n⚡ **Express (1–2 days)** — stickers, business cards, flyers (additional charge)\n📅 **Standard (2–4 days)** — most print products\n🏗️ **Custom/Large orders (4–7 days)** — banners, signage, bulk merchandise\n\nTurnaround starts once artwork is approved. Chat us on WhatsApp for urgent orders — we always do our best!`,
    quick: ['How to order', 'Chat on WhatsApp'],
  },
  {
    patterns: ['contact', 'phone', 'call', 'reach', 'email', 'address', 'whatsapp', 'number'],
    answer: `**Contact Sleekblue Media Houz:**\n\n📞 **Phone:** ${PHONE}\n💬 **WhatsApp:** ${PHONE} (fastest response)\n🌐 **Website:** sleekbluemediahouz.com\n\nWe're online and responsive — WhatsApp is the fastest way to reach us!`,
    quick: ['Chat on WhatsApp', 'How to order'],
  },
  {
    patterns: ['payment', 'pay', 'transfer', 'bank', 'account', 'pos'],
    answer: `**Payment Methods:**\n\n🏦 **Bank Transfer** — we'll share our account details when you're ready to order\n📱 **Mobile Transfer** — all major Nigerian banks accepted\n💳 **POS** — available for walk-in customers\n\nA deposit is required to start production. Chat us on WhatsApp to confirm your order and get payment details.`,
    quick: ['Chat on WhatsApp', 'How to order'],
  },
  {
    patterns: ['minimum', 'moq', 'minimum order', 'least', 'smallest', 'small quantity', 'small order'],
    answer: `**Minimum Order Quantities (MOQ):**\n\n• Die-cut stickers — **100 pieces**\n• Business cards — **100 pieces**\n• Flyers — **100 copies**\n• Flex banners — **no minimum** (per sqm pricing)\n• T-shirts — **6 pieces**\n• Pens, mugs, umbrellas — **12 pieces**\n\nSmaller quantities available for some products — chat us on WhatsApp to confirm.`,
    quick: ['Chat on WhatsApp', 'What are the prices?'],
  },
  {
    patterns: ['bulk', 'discount', 'large quantity', 'wholesale'],
    answer: `Yes! We offer generous **bulk discounts**:\n\n• 500 pcs — ~10% off\n• 1,000 pcs — ~20% off\n• 2,000 pcs — ~22.5% off\n• 3,000+ pcs — up to **25% off**\n\nFor very large orders or reseller/wholesale pricing, chat us on WhatsApp and we'll give you a special rate.`,
    quick: ['Chat on WhatsApp', 'Die-cut sticker prices'],
  },
  {
    patterns: ['quality', 'material', 'waterproof', 'durable', 'last', 'outdoor'],
    answer: `**Our Quality Promise:**\n\n✅ **Waterproof materials** — stickers last outdoors\n✅ **UV-resistant inks** — colours stay vivid\n✅ **Premium stocks** — glossy, matte, and speciality papers\n✅ **Colour-accurate** — what you design is what you get\n✅ **Trusted by** UBA, MTN, HERO, NNPC, Seplat, and 500+ brands\n\nWe take pride in every print. If you're not satisfied, we'll make it right.`,
    quick: ['What do you print?', 'How to order'],
  },
  {
    patterns: ['thank', 'thanks', 'okay', 'ok', 'great', 'perfect', 'nice', 'good', 'awesome', 'excellent'],
    answer: `You're welcome! 😊 Is there anything else I can help you with? We're always here to help you get the best print results.\n\nFeel free to chat us on **WhatsApp** anytime for fast responses!`,
    quick: ['Chat on WhatsApp', 'What do you print?', 'How to order'],
  },
]

const FALLBACK = {
  answer: `I'm not sure about that specific question, but our team can answer it instantly on WhatsApp! 💬\n\nYou can also ask me about:\n• **Products we print**\n• **Pricing & discounts**\n• **How to place an order**\n• **Delivery & turnaround time**`,
  quick: ['What do you print?', 'What are your prices?', 'Chat on WhatsApp', 'How to order'],
}

const QUICK_START = ['What do you print?', 'Die-cut sticker prices', 'How to order', 'Contact & location', 'Delivery info']

function matchKB(text) {
  const lower = text.toLowerCase()
  for (const entry of KB) {
    if (entry.patterns.some(p => lower.includes(p))) return entry
  }
  return null
}

function renderText(text) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <p key={i} style={{ margin: '2px 0', lineHeight: 1.55, fontSize: '13px' }}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
      </p>
    )
  })
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: `Hello! 👋 Welcome to **Sleekblue Media Houz** — premium printing & branding in Nigeria.\n\nHow can I help you today?`,
      quick: QUICK_START,
    }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, messages])

  function sendMessage(text) {
    if (!text.trim()) return
    const userMsg = { from: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      const match = matchKB(text)
      const response = match || FALLBACK
      setMessages(prev => [...prev, { from: 'bot', text: response.answer, quick: response.quick }])
      setTyping(false)
    }, 600 + Math.random() * 400)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const showBubble = !open && !dismissed

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
      {/* Greeting bubble */}
      {showBubble && (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '12px 16px', maxWidth: '240px', boxShadow: '0 4px 16px rgba(0,0,0,0.14)', fontSize: '13px', color: '#333', lineHeight: 1.5, position: 'relative', fontFamily: "'HubotSans', sans-serif", cursor: 'pointer' }}
          onClick={() => { setOpen(true); setDismissed(true) }}>
          <button onClick={e => { e.stopPropagation(); setDismissed(true) }}
            style={{ position: 'absolute', top: '6px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '14px', lineHeight: 1 }}>✕</button>
          <strong style={{ color: '#7B2FBE' }}>Sleekblue Support</strong><br />
          Welcome! Ask us anything about our printing services 👇
        </div>
      )}

      {/* Chat window */}
      {open && (
        <div style={{ width: '340px', height: '480px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'HubotSans', sans-serif", border: '1px solid #eee' }}>
          {/* Header */}
          <div style={{ background: '#7B2FBE', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>💬</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: 0 }}>Sleekblue Support</p>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', margin: 0 }}>🟢 Online now</p>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaTimes size={12} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f9f9fb' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ background: msg.from === 'user' ? '#7B2FBE' : '#fff', color: msg.from === 'user' ? '#fff' : '#333', borderRadius: msg.from === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '10px 13px', maxWidth: '88%', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: msg.from === 'bot' ? '1px solid #eee' : 'none' }}>
                  {renderText(msg.text)}
                </div>
                {/* Quick replies */}
                {msg.from === 'bot' && msg.quick && i === messages.length - 1 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px', maxWidth: '100%' }}>
                    {msg.quick.map((q, qi) => q === 'Chat on WhatsApp' ? (
                      <a key={qi} href={`https://wa.me/${WHATSAPP_NUM}?text=Hello Sleekblue, I need help with my order`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '14px', padding: '5px 11px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', fontFamily: "'HubotSans', sans-serif" }}>
                        <FaWhatsapp size={10} /> WhatsApp
                      </a>
                    ) : (
                      <button key={qi} onClick={() => sendMessage(q)}
                        style={{ background: '#fff', color: '#7B2FBE', border: '1.5px solid #7B2FBE', borderRadius: '14px', padding: '5px 11px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'HubotSans', sans-serif" }}>
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ background: '#fff', borderRadius: '12px 12px 12px 2px', padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #eee', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 1, 2].map(d => <div key={d} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7B2FBE', opacity: 0.6, animation: `typing-dot 1s ease-in-out ${d * 0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* WhatsApp CTA bar */}
          <div style={{ padding: '8px 14px', background: '#e8faf0', borderTop: '1px solid #d4f0e0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaWhatsapp size={14} color="#25D366" />
            <span style={{ fontSize: '11px', color: '#555', flex: 1 }}>Need faster help?</span>
            <a href={`https://wa.me/${WHATSAPP_NUM}?text=Hello Sleekblue, I need help`} target="_blank" rel="noopener noreferrer"
              style={{ background: '#25D366', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '12px', textDecoration: 'none', fontFamily: "'HubotSans', sans-serif" }}>
              WhatsApp Us
            </a>
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #eee', display: 'flex', gap: '8px', alignItems: 'flex-end', background: '#fff' }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Type your question…"
              style={{ flex: 1, border: '1.5px solid #e0e0e0', borderRadius: '20px', padding: '9px 14px', fontSize: '13px', fontFamily: "'HubotSans', sans-serif", outline: 'none', resize: 'none', background: '#fafafa', color: '#333' }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim()}
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: input.trim() ? '#7B2FBE' : '#e0e0e0', border: 'none', color: '#fff', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
              <FaPaperPlane size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => { setOpen(!open); setDismissed(true) }}
        style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#7B2FBE', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(123,47,190,0.45)', cursor: 'pointer', alignSelf: 'flex-end', position: 'relative', transition: 'transform 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? <FaTimes size={20} /> : <FaComments size={22} />}
        {!open && messages.length > 1 && (
          <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '14px', height: '14px', background: '#FF4136', borderRadius: '50%', border: '2px solid #fff', fontSize: '8px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>!</div>
        )}
      </button>

      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
