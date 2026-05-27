import { useState, useEffect } from 'react'
import heroSlide0 from '@assets/HERO_IMAGE_1_1779922059063.jpg'
import heroSlide1 from '@assets/HERO_SLIDE_1_1779922059065.jpg'
import heroSlide2 from '@assets/HERO_SLIDE_2_1779922059065.jpg'
import heroSlide3 from '@assets/HERO_SLIDE_3_1779922059066.jpg'

const slides = [heroSlide0, heroSlide1, heroSlide2, heroSlide3]
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
          style={{ display: current === i ? 'block' : 'none', lineHeight: 0 }}
        >
          <img
            src={slide}
            alt={`Slide ${i + 1}`}
            style={{ width: '100%', display: 'block', objectFit: 'cover' }}
          />
        </div>
      ))}
    </section>
  )
}
