import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroCanvas from './HeroCanvas'
import heroSlide0 from '@assets/HERO_IMAGE_1_1779922059063.jpg'
import heroSlide1 from '@assets/HERO_SLIDE_1_1779922059065.jpg'
import heroSlide2 from '@assets/HERO_SLIDE_2_1779922059065.jpg'
import heroSlide3 from '@assets/HERO_SLIDE_3_1779922059066.jpg'

const ALL_DEFAULT_SLIDES = [heroSlide0, heroSlide1, heroSlide2, heroSlide3]
const SLIDE_INTERVAL = 5000

const BTN_STICKER = {
  background: '#FFE500',
  color: '#1a0050',
  border: 'none',
  borderRadius: '50px',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: "'HubotSans', sans-serif",
  letterSpacing: '-0.1px',
  whiteSpace: 'nowrap',
  lineHeight: 1.3,
}
const BTN_FLEX = {
  background: '#ffffff',
  color: '#1a0050',
  border: '2px solid rgba(26,0,80,0.25)',
  borderRadius: '50px',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: "'HubotSans', sans-serif",
  letterSpacing: '-0.1px',
  whiteSpace: 'nowrap',
  lineHeight: 1.3,
}

// Invisible click-target overlay for default slides that have buttons baked into the image
const BTN_INVISIBLE = {
  background: 'transparent',
  border: 'none',
  borderRadius: '50px',
  padding: '10px 24px',
  fontSize: '14px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  lineHeight: 1.3,
  color: 'transparent',
  minWidth: '110px',
  minHeight: '40px',
}

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [slides, setSlides] = useState(ALL_DEFAULT_SLIDES)
  const [heroData, setHeroData] = useState({ headline: '', subheadline: '', btn1: '', btn2: '' })
  const [usingCustom, setUsingCustom] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/hero')
      .then(r => r.ok ? r.json() : {})
      .then(d => {
        const hidden = d.hiddenDefaultSlides || []
        const customSlides = d.customSlides || []
        const extraDefaults = (d.extraDefaultSlides || []).filter(u => !(d.hiddenExtraDefaultSlides || []).includes(u))

        if (customSlides.length > 0) {
          setSlides(customSlides)
          setUsingCustom(true)
        } else {
          const visibleDefaults = ALL_DEFAULT_SLIDES.filter((_, i) => !hidden.includes(i))
          const allDefaults = [...(visibleDefaults.length > 0 ? visibleDefaults : ALL_DEFAULT_SLIDES), ...extraDefaults]
          setSlides(allDefaults)
          setUsingCustom(false)
        }

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

  const hasText = heroData.headline || heroData.subheadline
  const btn1Label = heroData.btn1 || 'Print Sticker'
  const btn2Label = heroData.btn2 || 'Print Flex'

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

          {/* TEXT OVERLAY MODE — admin has set a custom headline/subheadline */}
          {hasText && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 5,
            }}>
              <HeroCanvas />
              <div style={{
                position: 'absolute', top: '14%', left: '5%', maxWidth: '44%',
              }}>
                {heroData.headline && (
                  <h1 style={{ color: '#fff', fontSize: 'clamp(20px, 3.5vw, 48px)', fontWeight: 900, margin: '0 0 10px', fontFamily: "'HubotSans', sans-serif", lineHeight: 1.1, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    {heroData.headline}
                  </h1>
                )}
                {heroData.subheadline && (
                  <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(12px, 1.5vw, 18px)', margin: '0 0 20px', fontFamily: "'HubotSans', sans-serif", lineHeight: 1.5 }}>
                    {heroData.subheadline}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={() => navigate('/store/die-cut-stickers')} style={BTN_STICKER}>{btn1Label}</button>
                  <button onClick={() => navigate('/store/flex-banner')} style={BTN_FLEX}>{btn2Label}</button>
                </div>
              </div>
            </div>
          )}

          {/* NO-TEXT MODE */}
          {!hasText && (
            <>
              {/* Visually-hidden H1 for SEO */}
              {i === 0 && (
                <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
                  Sleekblue Media Houz — Premium Printing &amp; Corporate Branding in Nigeria
                </h1>
              )}

              {usingCustom ? (
                /* Custom slides have no baked-in buttons — render visible styled buttons */
                <>
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
                    background: 'linear-gradient(to right, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.10) 45%, transparent 65%)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: '30%', left: '5%',
                    display: 'flex', gap: '12px', flexWrap: 'wrap', zIndex: 5,
                  }}>
                    <button onClick={() => navigate('/store/die-cut-stickers')} style={BTN_STICKER}>{btn1Label}</button>
                    <button onClick={() => navigate('/store/flex-banner')} style={BTN_FLEX}>{btn2Label}</button>
                  </div>
                </>
              ) : (
                /* Default slides already have buttons baked into the image pixels.
                   Render invisible click-target overlays at the same position so
                   the baked-in image buttons remain the only visible UI. */
                <div style={{
                  position: 'absolute', bottom: '30%', left: '5%',
                  display: 'flex', gap: '12px', flexWrap: 'wrap', zIndex: 5,
                }}>
                  <button onClick={() => navigate('/store/die-cut-stickers')} style={BTN_INVISIBLE} aria-label="Print Sticker" />
                  <button onClick={() => navigate('/store/flex-banner')} style={BTN_INVISIBLE} aria-label="Print Flex" />
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {/* Slide dot indicators */}
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              style={{ width: current === i ? '24px' : '8px', height: '8px', borderRadius: '4px', border: 'none', background: current === i ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0, transition: 'width 0.3s' }} />
          ))}
        </div>
      )}
    </section>
  )
}
