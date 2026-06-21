import { useState, useEffect } from 'react'
import sleekblueLogo from '@assets/SLEEKBLUE_LOGO_1779921080596.jpg'
import { useSEO } from '../hooks/useSEO'
import HeroCanvas from '../components/HeroCanvas'

const DEFAULT_TEAM = [
  { name: 'CEO & Founder', role: 'Creative Director', bio: 'Driving Sleekblue\'s vision with 10+ years in printing & branding excellence across Nigeria.', initials: 'SB' },
  { name: 'Design Team', role: 'Senior Graphic Designers', bio: 'Transforming bold ideas into stunning, print-ready artwork that commands attention every time.', initials: 'DT' },
  { name: 'Production Team', role: 'Print Production Experts', bio: 'Executing every order with precision and speed — delivering quality you can see and feel.', initials: 'PT' },
]

const DEFAULTS = {
  heroTitle: 'About Sleekblue Media Houz',
  heroSubtitle: 'We print for the biggest brands — and yours is next.',
  whoWeAreTitle: 'Who We Are',
  whoWeAre: 'Sleekblue Media Houz is a premium printing and corporate branding company dedicated to helping businesses of all sizes — from solopreneurs to big brands — communicate their identity with clarity and confidence. We specialize in die-cut stickers, flex printing, large format printing, corporate branding, and a wide range of promotional materials.',
  missionTitle: 'Our Mission',
  mission: 'To deliver premium printing with zero stress — high quality output, fast turnaround, and reliable service that empowers small businesses and enterprise brands alike to stand out in their market.',
  valuesTitle: 'What Sets Us Apart',
  values: [
    { icon: '🎯', title: 'Precision', desc: 'Every cut, every print is executed to exact specifications.' },
    { icon: '⚡', title: 'Speed', desc: 'Fast turnaround without compromising on quality.' },
    { icon: '💎', title: 'Quality', desc: 'Waterproof, durable materials that last and impress.' },
    { icon: '🤝', title: 'Trust', desc: 'Trusted by UBA, MTN, HERO, NNPC, Seplat, and 500+ brands.' },
    { icon: '💰', title: 'Value', desc: 'Bulk discounts for growing businesses.' },
    { icon: '🛠️', title: 'Support', desc: '24/7 customer care and WhatsApp-first communication.' },
  ],
  whoWeServeTitle: 'Who We Serve',
  whoWeServe: ['Solopreneurs & Micro Businesses', 'Small Business Owners', 'Growth Business Enterprises', 'Big Brands & Corporate Organizations'],
  teamTitle: 'Meet the Team',
  team: DEFAULT_TEAM,
  showTeam: true,
  ctaTitle: 'Ready to Print?',
  ctaText: 'Call us or chat on WhatsApp — we respond fast.',
  stats: [
    { value: '500+', label: 'Happy Clients' },
    { value: '5★', label: 'Google Rating' },
    { value: '10+', label: 'Years Experience' },
    { value: '24/7', label: 'Support' },
  ],
  showStats: true,
}

export default function AboutPage() {
  useSEO('about', { title: 'About Us — Sleekblue Media Houz | Nigeria Printing Company', description: 'Learn about Sleekblue Media Houz — Nigeria\'s premium printing and corporate branding company. We help brands communicate with clarity and confidence.', keywords: 'about Sleekblue, Nigerian printing company, corporate branding Lagos' })
  const [d, setD] = useState(DEFAULTS)
  const [settings, setSettings] = useState({})

  useEffect(() => {
    fetch('/api/about')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setD({
          ...DEFAULTS,
          ...data,
          values: data.values || DEFAULTS.values,
          whoWeServe: data.whoWeServe || DEFAULTS.whoWeServe,
          stats: data.stats || DEFAULTS.stats,
          team: data.team || DEFAULTS.team,
        })
      })
      .catch(() => {})
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(s => { if (s) setSettings(s) })
      .catch(() => {})
  }, [])

  const phone    = settings.phone    || '+234 806 527 5264'
  const whatsapp = settings.whatsapp || '2348065275264'

  return (
    <section style={{ background: '#fff', minHeight: '100vh', fontFamily: "'HubotSans', sans-serif" }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #7B2FBE 0%, #5B1F9E 100%)', padding: '64px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <HeroCanvas />
        <div style={{ background: 'rgba(255,255,255,0.95)', display: 'inline-block', borderRadius: '14px', padding: '10px 16px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <img src={sleekblueLogo} alt="Sleekblue Media Houz" style={{ height: '56px', display: 'block' }} />
        </div>
        <h1 style={{ fontSize: '40px', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>{d.heroTitle}</h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>{d.heroSubtitle}</p>
      </div>

      {/* Stats bar */}
      {d.showStats && d.stats?.length > 0 && (
        <div style={{ background: '#7B2FBE', padding: '24px', display: 'flex', justifyContent: 'center', gap: '0', flexWrap: 'wrap' }}>
          {d.stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '8px 36px', borderRight: i < d.stats.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
              <p style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
        {/* Who We Are */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#7B2FBE', marginBottom: '16px' }}>{d.whoWeAreTitle}</h2>
          <p style={{ fontSize: '15px', color: '#444', lineHeight: 1.8 }}>{d.whoWeAre}</p>
        </div>

        {/* Our Mission */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#7B2FBE', marginBottom: '16px' }}>{d.missionTitle}</h2>
          <p style={{ fontSize: '15px', color: '#444', lineHeight: 1.8 }}>{d.mission}</p>
        </div>

        {/* Values */}
        {d.values?.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#7B2FBE', marginBottom: '24px' }}>{d.valuesTitle}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '20px' }}>
              {d.values.map((v, i) => (
                <div key={i} style={{ background: '#f9f5ff', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #7B2FBE' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{v.icon}</div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px' }}>{v.title}</h3>
                  <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Who We Serve */}
        {d.whoWeServe?.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#7B2FBE', marginBottom: '16px' }}>{d.whoWeServeTitle}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '14px' }}>
              {d.whoWeServe.map((c, i) => (
                <div key={i} style={{ background: '#FAF3E8', borderRadius: '8px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#7B2FBE', fontWeight: 700, fontSize: '16px' }}>✓</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Section */}
        {d.showTeam && d.team?.length > 0 && (
          <div style={{ marginBottom: '56px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#7B2FBE', marginBottom: '8px' }}>{d.teamTitle}</h2>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '28px', lineHeight: 1.6 }}>The people behind every premium print.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '24px' }}>
              {d.team.map((member, i) => (
                <div key={i} style={{ background: '#fff', border: '1.5px solid #ede8f8', borderRadius: '16px', padding: '28px 22px', textAlign: 'center', boxShadow: '0 2px 12px rgba(123,47,190,0.07)', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 28px rgba(123,47,190,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(123,47,190,0.07)'}>
                  {member.img ? (
                    <img src={member.img} alt={member.name}
                      style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', marginBottom: '14px', border: '3px solid #7B2FBE' }} />
                  ) : (
                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#7B2FBE,#5B1F9E)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 14px rgba(123,47,190,0.25)' }}>
                      <span style={{ color: '#fff', fontSize: '24px', fontWeight: 800 }}>{member.initials || member.name.charAt(0)}</span>
                    </div>
                  )}
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>{member.name}</h3>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>{member.role}</p>
                  <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, margin: 0 }}>{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact CTA */}
        <div style={{ background: '#7B2FBE', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>{d.ctaTitle}</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginBottom: '24px' }}>{d.ctaText}</p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`tel:${phone}`} style={{ background: '#fff', color: '#7B2FBE', padding: '11px 28px', borderRadius: '24px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>📞 {phone}</a>
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ background: '#25D366', color: '#fff', padding: '11px 28px', borderRadius: '24px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>💬 Chat on WhatsApp</a>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:640px){ h1{font-size:28px!important} }`}</style>
    </section>
  )
}
