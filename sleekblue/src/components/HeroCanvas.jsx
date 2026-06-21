import { useEffect, useRef } from 'react'

const SHAPES = [
  { size: 90,  top: '15%', left: '8%',  dur: 18, delay: 0,   opacity: 0.08, rotate: 30  },
  { size: 60,  top: '70%', left: '5%',  dur: 22, delay: 3,   opacity: 0.06, rotate: 60  },
  { size: 110, top: '20%', left: '80%', dur: 25, delay: 1,   opacity: 0.07, rotate: 15  },
  { size: 50,  top: '75%', left: '75%', dur: 20, delay: 5,   opacity: 0.09, rotate: 45  },
  { size: 75,  top: '45%', left: '92%', dur: 28, delay: 2,   opacity: 0.05, rotate: 0   },
  { size: 45,  top: '55%', left: '50%', dur: 16, delay: 7,   opacity: 0.06, rotate: 20  },
  { size: 80,  top: '10%', left: '45%', dur: 30, delay: 4,   opacity: 0.05, rotate: 75  },
  { size: 55,  top: '85%', left: '35%', dur: 24, delay: 6,   opacity: 0.07, rotate: 10  },
]

function OctahedronSVG({ size, opacity, rotate }) {
  const s = size
  const cx = s / 2, cy = s / 2, r = s * 0.42
  const top    = [cx, cy - r]
  const bottom = [cx, cy + r]
  const left   = [cx - r, cy]
  const right  = [cx + r, cy]
  const front  = [cx, cy + r * 0.3]
  const back   = [cx, cy - r * 0.3]
  const pts = (arr) => arr.map(p => p.join(',')).join(' ')
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity, transform: `rotate(${rotate}deg)`, overflow: 'visible' }}>
      <polygon points={pts([top, left, front])} fill="none" stroke="white" strokeWidth="0.8" />
      <polygon points={pts([top, right, front])} fill="none" stroke="white" strokeWidth="0.8" />
      <polygon points={pts([bottom, left, front])} fill="none" stroke="white" strokeWidth="0.8" />
      <polygon points={pts([bottom, right, front])} fill="none" stroke="white" strokeWidth="0.8" />
      <polygon points={pts([top, left, back])} fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2,2" />
      <polygon points={pts([top, right, back])} fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2,2" />
    </svg>
  )
}

export default function HeroCanvas() {
  const mountRef = useRef(null)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes heroFloat {
        0%   { transform: translateY(0px)   rotate(var(--r)); }
        50%  { transform: translateY(-18px) rotate(calc(var(--r) + 15deg)); }
        100% { transform: translateY(0px)   rotate(var(--r)); }
      }
      @keyframes heroPulse {
        0%, 100% { opacity: var(--op); }
        50%      { opacity: calc(var(--op) * 0.5); }
      }
      .hero-shape {
        position: absolute;
        animation: heroFloat var(--dur)s ease-in-out infinite, heroPulse var(--dur)s ease-in-out infinite;
        pointer-events: none;
      }
      @keyframes heroParticle {
        0%   { transform: translateY(0) scale(1); opacity: 0.4; }
        50%  { transform: translateY(-30px) scale(1.2); opacity: 0.15; }
        100% { transform: translateY(0) scale(1); opacity: 0.4; }
      }
      .hero-particle {
        position: absolute;
        border-radius: 50%;
        background: white;
        pointer-events: none;
        animation: heroParticle var(--pd)s ease-in-out infinite;
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {SHAPES.map((s, i) => (
        <div
          key={i}
          className="hero-shape"
          style={{
            top: s.top,
            left: s.left,
            '--r': `${s.rotate}deg`,
            '--op': s.opacity,
            '--dur': `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        >
          <OctahedronSVG size={s.size} opacity={s.opacity} rotate={s.rotate} />
        </div>
      ))}
      {Array.from({ length: 28 }, (_, i) => (
        <div
          key={`p${i}`}
          className="hero-particle"
          style={{
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            top: `${5 + (i * 33.7) % 90}%`,
            left: `${(i * 17.3) % 95}%`,
            '--pd': `${8 + (i % 7) * 2}s`,
            animationDelay: `${(i * 0.7) % 8}s`,
            opacity: 0.25 + (i % 4) * 0.08,
          }}
        />
      ))}
    </div>
  )
}
