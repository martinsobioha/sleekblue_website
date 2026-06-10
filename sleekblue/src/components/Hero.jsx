import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import heroSlide0 from '@assets/HERO_IMAGE_1_1779922059063.jpg'
import heroSlide1 from '@assets/HERO_SLIDE_1_1779922059065.jpg'
import heroSlide2 from '@assets/HERO_SLIDE_2_1779922059065.jpg'
import heroSlide3 from '@assets/HERO_SLIDE_3_1779922059066.jpg'

const DEFAULT_SLIDES = [heroSlide0, heroSlide1, heroSlide2, heroSlide3]
const SLIDE_INTERVAL = 5000

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [slides, setSlides] = useState(DEFAULT_SLIDES)
  const [heroData, setHeroData] = useState({ headline: '', subheadline: '', btn1: '', btn2: '' })
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/hero')
      .then(r => r.ok ? r.json() : {})
      .then(d => {
        if (d.customSlides && d.customSlides.length > 0) setSlides(d.customSlides)
        setHeroData({
          headline:    d.headline    || '',
          subheadline: d.subheadline || '',
          btn1:        d.btn1        || '',
          btn2:        d.btn2        || '',
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setCurrent(prev => (prev + 1) % slides.length), SLIDE_INTERVAL)
    return () => clearInterval(timer)
  }, [slides.length])

  const hasOverlay = heroData.headline || heroData.subheadline || heroData.btn1 || heroData.btn2

  return (
    <section style={{ position: 'relative', overflow: 'hidden', lineHeight: 0 }}>
      {slides.map((slide, i) => (
        <div key={i} style={{ display: current === i ? 'block' : 'none', lineHeight: 0, position: 'relative' }}>
          <img
            src={slide}
            alt={`Slide ${i + 1}`}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={i === 0 ? 'high' : 'auto'}
            style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '520px' }}
          />

          {/* Text overlay — only shown when custom text is set */}
          {hasOverlay && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '0 6%', zIndex: 5 }}>
              {heroData.headline && (
                <h1 style={{ color: '#fff', fontSize: 'clamp(22px, 4vw, 52px)', fontWeight: 900, margin: '0 0 12px', fontFamily: "'HubotSans', sans-serif", lineHeight: 1.15, textShadow: '0 2px 8px rgba(0,0,0,0.4)', maxWidth: '600px' }}>
                  {heroData.headline}
                </h1>
              )}
              {heroData.subheadline && (
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(13px, 1.8vw, 20px)', margin: '0 0 24px', fontFamily: "'HubotSans', sans-serif", maxWidth: '500px', lineHeight: 1.5 }}>
                  {heroData.subheadline}
                </p>
              )}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {heroData.btn1 && (
                  <button onClick={() => navigate('/store/die-cut-stickers')}
                    style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: '8px', padding: '13px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'HubotSans', sans-serif' " }}>
                    {heroData.btn1}
                  </button>
                )}
                {heroData.btn2 && (
                  <button onClick={() => navigate('/store/flex-banner')}
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.8)', borderRadius: '8px', padding: '13px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'HubotSans', sans-serif" }}>
                    {heroData.btn2}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Transparent click-capture areas over baked-in buttons (only when no custom overlay) */}
          {!hasOverlay && (
            <>
              <div onClick={() => navigate('/store/die-cut-stickers')} title="Print Sticker"
                style={{ position: 'absolute', left: '5%', bottom: '27%', width: '17%', height: '9%', cursor: 'pointer', background: 'transparent', zIndex: 10 }} />
              <div onClick={() => navigate('/store/flex-banner')} title="Print Flex"
                style={{ position: 'absolute', left: '23%', bottom: '27%', width: '16%', height: '9%', cursor: 'pointer', background: 'transparent', zIndex: 10 }} />
            </>
          )}
        </div>
      ))}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              style={{ width: current === i ? '24px' : '8px', height: '8px', borderRadius: '4px', border: 'none', background: current === i ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0, transition: 'width 0.3s' }} />
          ))}
        </div>
      )}
    </section>
  )
}
