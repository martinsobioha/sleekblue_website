import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logo from '@assets/SLEEKBLUE_LOGO_1779927359068.jpg'

const DEFAULT_TAGLINE = 'Premium print, branding & design solutions for businesses across Nigeria. Fast turnaround, zero stress.'
const DEFAULT_SERVICES = ['Die Cut Stickers', 'Flex Banners', 'Business Cards', 'Vehicle Branding', 'Logo & Branding', 'T-Shirts & Caps', 'Rollup Stands', 'Burial Brochures']

export default function Footer() {
  const year = new Date().getFullYear()
  const [tagline, setTagline] = useState(DEFAULT_TAGLINE)
  const [services, setServices] = useState(DEFAULT_SERVICES)

  useEffect(() => {
    fetch('/api/content')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.footer?.tagline) setTagline(d.footer.tagline)
        if (d?.footer?.services?.length) setServices(d.footer.services)
      })
      .catch(() => {})
  }, [])

  return (
    <footer style={{ background: '#1a0a2e', color: '#ccc', paddingTop: '48px', paddingBottom: '24px', fontFamily: "'HubotSans', sans-serif" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '36px', marginBottom: '40px' }}>

          {/* Brand */}
          <div>
            <img src={logo} alt="Sleekblue Media Houz" style={{ height: '48px', borderRadius: '8px', marginBottom: '14px' }} />
            <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#aaa', margin: '0 0 12px' }}>
              {tagline}
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <a href="https://wa.me/2348065275264" target="_blank" rel="noopener noreferrer" style={{ background: '#25D366', color: '#fff', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '16px' }}>💬</a>
              <a href="https://www.instagram.com/sleekbluemediahouz" target="_blank" rel="noopener noreferrer" style={{ background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color: '#fff', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '16px' }}>📸</a>
              <a href="https://www.facebook.com/sleekbluemediahouz" target="_blank" rel="noopener noreferrer" style={{ background: '#1877F2', color: '#fff', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '16px' }}>👍</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Links</h4>
            {[
              { label: 'Home', to: '/' },
              { label: 'Store', to: '/store' },
              { label: 'Request a Quote', to: '/quote' },
              { label: 'About Us', to: '/about' },
              { label: 'Blog', to: '/blog' },
            ].map(({ label, to }) => (
              <Link key={to} to={to} style={{ display: 'block', color: '#aaa', textDecoration: 'none', fontSize: '13px', marginBottom: '9px', transition: 'color 0.15s' }}
                onMouseEnter={e => e.target.style.color = '#FF6B00'}
                onMouseLeave={e => e.target.style.color = '#aaa'}
              >{label}</Link>
            ))}
          </div>

          {/* Services */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Services</h4>
            {services.map((s, i) => (
              <p key={i} style={{ color: '#aaa', fontSize: '13px', margin: '0 0 9px' }}>{s}</p>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Us</h4>
            <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '10px', lineHeight: 1.5 }}>📞 <a href="tel:+2348065275264" style={{ color: '#aaa', textDecoration: 'none' }}>+234 806 527 5264</a></p>
            <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '10px' }}>💬 <a href="https://wa.me/2348065275264" target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', textDecoration: 'none' }}>WhatsApp Us</a></p>
            <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '10px' }}>📍 Lagos, Nigeria</p>
            <Link to="/quote" style={{ display: 'inline-block', marginTop: '8px', background: '#FF6B00', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
              Request a Quote
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            © {year} Sleekblue Media Houz. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '12px', color: '#555' }}>Built with ❤️ in Nigeria</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
