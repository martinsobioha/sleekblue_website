import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import heroSlide0 from '@assets/HERO_IMAGE_1_1779922059063.jpg'
import heroSlide1 from '@assets/HERO_SLIDE_1_1779922059065.jpg'
import heroSlide2 from '@assets/HERO_SLIDE_2_1779922059065.jpg'
import heroSlide3 from '@assets/HERO_SLIDE_3_1779922059066.jpg'

const slides = [heroSlide0, heroSlide1, heroSlide2, heroSlide3]
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
            src={slide}
            alt={`Slide ${i + 1}`}
            style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '520px' }}
          />

          {/* Transparent click-capture areas over baked-in "Print Sticker" and "Print Flex" buttons on every slide */}
          <div
            onClick={() => navigate('/store/die-cut-stickers')}
            title="Print Sticker"
            style={{
              position: 'absolute',
              left: '5%',
              bottom: '27%',
              width: '17%',
              height: '9%',
              cursor: 'pointer',
              background: 'transparent',
              zIndex: 10,
            }}
          />
          <div
            onClick={() => navigate('/store/flex-banner')}
            title="Print Flex"
            style={{
              position: 'absolute',
              left: '23%',
              bottom: '27%',
              width: '16%',
              height: '9%',
              cursor: 'pointer',
              background: 'transparent',
              zIndex: 10,
            }}
          />
        </div>
      ))}

      {/* Dot indicators */}
      <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: current === i ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              border: 'none',
              background: current === i ? '#fff' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              padding: 0,
              transition: 'width 0.3s',
            }}
          />
        ))}
      </div>
    </section>
  )
}
