import { useState, useEffect } from 'react'
import heroSlide0 from '@assets/HERO_IMAGE_1_1779921447909.jpg'
import heroSlide1 from '@assets/HERO_SLIDE_1_1779921080592.jpg'
import heroSlide2 from '@assets/HERO_SLIDE_2_1779921080593.jpg'

const slides = [heroSlide0, heroSlide1, heroSlide2]
const SLIDE_INTERVAL = 5000

export default function Hero() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
    }, SLIDE_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  return (
    <section style={{ position: 'relative', overflow: 'hidden', lineHeight: 0 }}>
      {slides.map((slide, i) => (
        <div
          key={i}
          style={{
            display: current === i ? 'block' : 'none',
            position: 'relative',
            overflow: 'hidden',
            lineHeight: 0,
          }}
        >
          <img
            src={slide}
            alt={`Slide ${i + 1}`}
            style={{ width: '100%', display: 'block', objectFit: 'cover' }}
          />

          {/* Cover baked-in social icons on left edge */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '46px',
            bottom: 0,
            background: '#7B2FBE',
            zIndex: 2,
          }} />

          {/* Cover baked-in slide dots at bottom-left */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '420px',
            height: '110px',
            background: '#7B2FBE',
            zIndex: 2,
          }} />
        </div>
      ))}
    </section>
  )
}
