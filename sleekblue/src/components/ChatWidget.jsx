import { useState, useEffect } from 'react'
import { FaTimes } from 'react-icons/fa'

const WA_NUMBER = '2348065275264'
const GREETING = "Hello! I visited your website and I'd like to enquire about your products."

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [message, setMessage] = useState('')
  const [showBubble, setShowBubble] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  function sendToWhatsApp() {
    const text = message.trim() || GREETING
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank')
    setOpen(false)
    setMessage('')
  }

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>

      {/* Chat panel */}
      {open && (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          width: '300px',
          overflow: 'hidden',
          fontFamily: "'HubotSans', sans-serif",
          animation: 'fadeSlideUp 0.25s ease',
        }}>
          {/* Header */}
          <div style={{ background: '#25D366', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: 0 }}>Sleekblue Support</p>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11.5px', margin: 0 }}>Typically replies instantly</p>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}><FaTimes /></button>
          </div>

          {/* Message bubble */}
          <div style={{ padding: '16px', background: '#f0f4f8' }}>
            <div style={{ background: '#fff', borderRadius: '0 10px 10px 10px', padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'inline-block', maxWidth: '90%' }}>
              <p style={{ fontSize: '13px', color: '#333', margin: 0, lineHeight: 1.6 }}>
                👋 Hello! Welcome to <strong>Sleekblue Media Houz</strong>.<br />
                How can we help you today?
              </p>
              <p style={{ fontSize: '10.5px', color: '#aaa', margin: '6px 0 0', textAlign: 'right' }}>Sleekblue Team</p>
            </div>
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', background: '#fff', display: 'flex', gap: '8px', alignItems: 'flex-end', borderTop: '1px solid #eee' }}>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendToWhatsApp() } }}
              placeholder="Type a message..."
              rows={2}
              style={{ flex: 1, resize: 'none', border: '1.5px solid #e0e0e0', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontFamily: "'HubotSans', sans-serif", outline: 'none', color: '#222' }}
            />
            <button onClick={sendToWhatsApp}
              style={{ background: '#25D366', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Notification bubble */}
      {!open && !dismissed && showBubble && (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '11px 14px', maxWidth: '220px', boxShadow: '0 4px 16px rgba(0,0,0,0.14)', fontSize: '12.5px', color: '#444', lineHeight: 1.5, position: 'relative', cursor: 'pointer' }}
          onClick={() => { setOpen(true); setDismissed(true) }}>
          <button onClick={e => { e.stopPropagation(); setDismissed(true) }}
            style={{ position: 'absolute', top: '5px', right: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '11px' }}>✕</button>
          Welcome! Need help with your order? Chat with us 👋
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => { setOpen(!open); setDismissed(true) }}
        style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#25D366', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(37,211,102,0.45)', cursor: 'pointer', alignSelf: 'flex-end', position: 'relative' }}>
        {!open && !dismissed && showBubble && (
          <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '12px', height: '12px', background: '#FF3B30', borderRadius: '50%', border: '2px solid #fff' }} />
        )}
        {open
          ? <FaTimes size={18} />
          : <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        }
      </button>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
