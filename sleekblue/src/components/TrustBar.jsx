import { useState, useEffect } from 'react'
import { FaStar } from 'react-icons/fa'
import ubaLogo        from '@assets/UBA_LOGO_1779921080597.jpg'
import mtnLogo        from '@assets/MTN_LOGO_1779921080594.jpg'
import heroLogo       from '@assets/HERO_LOGO_1779921080592.jpg'
import imoDigitalLogo from '@assets/IMO_DIGITAL_CITY_LIMITED_LOGO_1779921080594.jpg'
import nnpcLogo       from '@assets/NNPC_LOGO_1779922059067.jpg'
import seplatLogo     from '@assets/SEPLAT_LOGO_1779921080595.jpg'

const LOGO_MAP = {
  UBA:         ubaLogo,
  MTN:         mtnLogo,
  HERO:        heroLogo,
  IMO_DIGITAL: imoDigitalLogo,
  NNPC:        nnpcLogo,
  SEPLAT:      seplatLogo,
}

const DEFAULT_TRUST = {
  rating: '5.0/5',
  reviewCount: '500+',
  tagline: 'TRUSTED BY GLOBAL BRANDS',
  partners: [
    { key: 'UBA', name: 'UBA', visible: true },
    { key: 'MTN', name: 'MTN', visible: true },
    { key: 'HERO', name: 'HERO', visible: true },
    { key: 'IMO_DIGITAL', name: 'Imo Digital City Limited', visible: true },
    { key: 'NNPC', name: 'NNPC', visible: true },
    { key: 'SEPLAT', name: 'Seplat Energy', visible: true },
  ],
}

export default function TrustBar() {
  const [data, setData] = useState(DEFAULT_TRUST)

  useEffect(() => {
    fetch('/api/content')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.trustBar) setData({ ...DEFAULT_TRUST, ...d.trustBar, partners: d.trustBar.partners || DEFAULT_TRUST.partners }) })
      .catch(() => {})
  }, [])

  const visiblePartners = data.partners.filter(p => p.visible !== false)
  const logos = visiblePartners.map(p => ({ src: LOGO_MAP[p.key], alt: p.name })).filter(l => l.src)

  return (
    <section style={{ background: '#fff', padding: '28px 0 24px', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[1,2,3,4,5].map(i => <FaStar key={i} size={22} color="#F5A623" />)}
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#333' }}>{data.rating} based on {data.reviewCount} reviews</span>
        </div>
        <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: '#888', textTransform: 'uppercase' }}>{data.tagline}</p>
      </div>

      {logos.length > 0 && (
        <div style={{ overflow: 'hidden', position: 'relative', marginTop: '14px' }}>
          <style>{`
            @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .marquee-track { display: flex; align-items: center; width: max-content; animation: marquee 20s linear infinite; }
            .marquee-track:hover { animation-play-state: paused; }
          `}</style>
          <div className="marquee-track">
            {[...logos, ...logos].map((logo, i) => (
              <div key={i} style={{ padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={logo.src} alt={logo.alt} style={{ height: '40px', width: 'auto', objectFit: 'contain', filter: 'grayscale(100%) opacity(0.7)' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
