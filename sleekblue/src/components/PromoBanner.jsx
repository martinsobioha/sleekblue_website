import { useState, useEffect } from 'react'

export default function PromoBanner() {
  const [banner, setBanner] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/promo-banner')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.enabled) setBanner(data) })
      .catch(() => {})
  }, [])

  if (!banner || dismissed) return null

  const color = banner.color || '#7B2FBE'
  const bgColor = banner.bgColor || '#f5f0ff'

  const tickerContent = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0' }}>
      {banner.text}
      {banner.link && (
        <a href={banner.link} style={{ marginLeft: '14px', marginRight: '40px', color, fontWeight: 800, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
          Learn more →
        </a>
      )}
      {!banner.link && <span style={{ marginRight: '60px' }} />}
    </span>
  )

  return (
    <div style={{
      background: bgColor,
      borderBottom: `2px solid ${color}20`,
      overflow: 'hidden',
      position: 'relative',
      height: '38px',
      display: 'flex',
      alignItems: 'center',
      fontFamily: "'HubotSans',sans-serif",
    }}>
      <style>{`
        @keyframes promoBannerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .promo-ticker-track {
          display: flex;
          width: max-content;
          animation: promoBannerScroll 28s linear infinite;
          white-space: nowrap;
          align-items: center;
        }
        .promo-ticker-track:hover { animation-play-state: paused; }
      `}</style>

      <div className="promo-ticker-track" style={{ fontSize: '13.5px', fontWeight: 600, color }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i}>{tickerContent}</span>
        ))}
      </div>

      <button onClick={() => setDismissed(true)}
        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: `1px solid ${color}30`, borderRadius: '50%', cursor: 'pointer', color, fontSize: '15px', lineHeight: 1, padding: '2px 6px', zIndex: 2, backdropFilter: 'blur(4px)' }}
        aria-label="Dismiss banner">×</button>
    </div>
  )
}
