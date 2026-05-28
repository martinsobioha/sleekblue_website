import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import heroSlide0 from '@assets/HERO_IMAGE_1_1779922059063.jpg'
import heroSlide1 from '@assets/HERO_SLIDE_1_1779922059065.jpg'
import heroSlide2 from '@assets/HERO_SLIDE_2_1779922059065.jpg'
import heroSlide3 from '@assets/HERO_SLIDE_3_1779922059066.jpg'

const slides = [
  { img: heroSlide0, showButtons: true },
  { img: heroSlide1, showButtons: false },
  { img: heroSlide2, showButtons: false },
  { img: heroSlide3, showButtons: false },
]
const SLIDE_INTERVAL = 5000

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
    }, SLIDE_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  return (
    <section style={{ position: 'relative', overflow: 'hidden', lineHeight: 0 }}>
      {slides.map((slide, i) => (
        <div key={i} style={{ display: current === i ? 'block' : 'none', lineHeight: 0, position: 'relative' }}>
          <img
            src={slide.img}
            alt={`Slide ${i + 1}`}
            style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '520px' }}
          />
          {slide.showButtons && (
            <div style={{
              position: 'absolute',
              bottom: '27%',
              left: '5%',
              display: 'flex',
              gap: '12px',
              zIndex: 10,
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => navigate('/store/die-cut-stickers')}
                style={{
                  background: '#F5C518',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '28px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: "'HubotSans', sans-serif",
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  letterSpacing: '0.3px',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.2)' }}
              >
                Print Sticker
              </button>
              <button
                onClick={() => navigate('/store/flex-banner')}
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: '2.5px solid #fff',
                  borderRadius: '28px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: "'HubotSans', sans-serif",
                  backdropFilter: 'blur(2px)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent' }}
              >
                Print Flex
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Dot indicators */}
      <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            style={{ width: current === i ? '24px' : '8px', height: '8px', borderRadius: '4px', border: 'none', background: current === i ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0, transition: 'width 0.3s' }} />
        ))}
      </div>
    </section>
  )
}
