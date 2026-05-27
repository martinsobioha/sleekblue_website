import { useState, useEffect } from 'react'
import heroImage1 from '@assets/HERO_IMAGE_1_1779921080591.jpg'
import heroSlide1 from '@assets/HERO_SLIDE_1_1779921080592.jpg'
import heroSlide2 from '@assets/HERO_SLIDE_2_1779921080593.jpg'

const SLIDE_INTERVAL = 5000

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const total = 3

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % total)
    }, SLIDE_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  return (
    <section style={{ position: 'relative', overflow: 'hidden', userSelect: 'none' }}>

      {/* ── Slide 0: Original hero with woman image ── */}
      <div style={{
        display: current === 0 ? 'flex' : 'none',
        background: 'linear-gradient(135deg, #7B2FBE 0%, #6B1FAE 100%)',
        minHeight: '420px',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '40px 24px 40px 60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: '0',
        }}>
          {/* Left text */}
          <div style={{ flex: '0 0 auto', maxWidth: '460px' }}>
            <h1 style={{
              fontSize: '52px',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.05,
              marginBottom: '14px',
              fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
            }}>
              Premium Printing.<br />
              Zero Stress
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.88)',
              marginBottom: '28px',
              lineHeight: 1.55,
              maxWidth: '370px',
            }}>
              Die-cut stickers, Flex printing, Corporate Branding and more made to help small businesses sell out.
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button style={{
                background: '#F5C518',
                color: '#1a1a1a',
                border: 'none',
                padding: '11px 26px',
                borderRadius: '24px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
              }}>Print Sticker</button>
              <button style={{
                background: 'transparent',
                color: '#fff',
                border: '2px solid #fff',
                padding: '11px 26px',
                borderRadius: '24px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
              }}>Print Flex</button>
            </div>
            {/* Dots */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '22px', alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <div
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: current === i ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)',
                    cursor: 'pointer', transition: 'background 0.3s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right: hero image */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', maxHeight: '420px', overflow: 'hidden' }}>
            <img
              src={heroImage1}
              alt="Premium Printing"
              style={{
                height: '420px',
                width: 'auto',
                objectFit: 'contain',
                objectPosition: 'bottom',
                display: 'block',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Slide 1: Branding that make you Standout ── */}
      <div style={{ display: current === 1 ? 'block' : 'none', position: 'relative' }}>
        <img
          src={heroSlide1}
          alt="Branding that make you Standout"
          style={{ width: '100%', display: 'block', maxHeight: '420px', objectFit: 'cover' }}
        />
        {/* Dots overlay */}
        <div style={{
          position: 'absolute', bottom: '24px', left: '60px',
          display: 'flex', gap: '8px',
        }}>
          {[0,1,2].map(i => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: current === i ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer', transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Slide 2: Cut Exactly to your Shape ── */}
      <div style={{ display: current === 2 ? 'block' : 'none', position: 'relative' }}>
        <img
          src={heroSlide2}
          alt="Cut Exactly to your Shape"
          style={{ width: '100%', display: 'block', maxHeight: '420px', objectFit: 'cover' }}
        />
        {/* Dots overlay */}
        <div style={{
          position: 'absolute', bottom: '24px', left: '60px',
          display: 'flex', gap: '8px',
        }}>
          {[0,1,2].map(i => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: current === i ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer', transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>

    </section>
  )
}
