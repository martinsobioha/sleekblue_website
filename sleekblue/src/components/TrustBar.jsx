import { FaStar } from 'react-icons/fa'
import ubaLogo from '@assets/UBA_LOGO_1779921080597.jpg'
import mtnLogo from '@assets/MTN_LOGO_1779921080594.jpg'
import heroLogo from '@assets/HERO_LOGO_1779921080592.jpg'
import imoDigitalLogo from '@assets/IMO_DIGITAL_CITY_LIMITED_LOGO_1779921080594.jpg'
import nnpcLogo from '@assets/NNPC_LOGO_1779922059067.jpg'
import seplatLogo from '@assets/SEPLAT_LOGO_1779921080595.jpg'

const logos = [
  { src: ubaLogo, alt: 'UBA' },
  { src: mtnLogo, alt: 'MTN' },
  { src: heroLogo, alt: 'HERO' },
  { src: imoDigitalLogo, alt: 'Imo Digital City Limited' },
  { src: nnpcLogo, alt: 'NNPC' },
  { src: seplatLogo, alt: 'Seplat Energy' },
]

export default function TrustBar() {
  return (
    <section style={{ background: '#fff', padding: '28px 0 24px', overflow: 'hidden' }}>
      {/* Stars + Rating */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[1,2,3,4,5].map(i => <FaStar key={i} size={22} color="#F5A623" />)}
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#333' }}>5.0/5 based on 500+ reviews</span>
        </div>
        <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: '#888', textTransform: 'uppercase' }}>
          TRUSTED BY GLOBAL BRANDS
        </p>
      </div>

      {/* Animated marquee */}
      <div style={{ overflow: 'hidden', position: 'relative', marginTop: '14px' }}>
        <style>{`
          @keyframes marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-track {
            display: flex;
            align-items: center;
            width: max-content;
            animation: marquee 20s linear infinite;
          }
          .marquee-track:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="marquee-track">
          {[...logos, ...logos].map((logo, i) => (
            <div key={i} style={{
              padding: '0 48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img
                src={logo.src}
                alt={logo.alt}
                style={{ height: '40px', width: 'auto', objectFit: 'contain', filter: 'grayscale(100%) opacity(0.7)' }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
