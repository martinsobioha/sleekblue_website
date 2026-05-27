import sleekblueLogo from '@assets/SLEEKBLUE_LOGO_1779921080596.jpg'

export default function AboutPage() {
  return (
    <section style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #7B2FBE 0%, #5B1F9E 100%)', padding: '64px 24px', textAlign: 'center' }}>
        <img src={sleekblueLogo} alt="Sleekblue" style={{ height: '64px', marginBottom: '20px', filter: 'brightness(0) invert(1)' }} />
        <h1 style={{ fontSize: '40px', fontWeight: 800, color: '#fff', marginBottom: '14px', fontFamily: "'HubotSans', sans-serif" }}>About Sleekblue Media Houz</h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', maxWidth: '600px', margin: '0 auto', fontWeight: 400, lineHeight: 1.7, fontFamily: "'HubotSans', sans-serif" }}>
          We print for the biggest brands — and yours is next.
        </p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
        {/* Who We Are */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#7B2FBE', marginBottom: '16px', fontFamily: "'HubotSans', sans-serif" }}>Who We Are</h2>
          <p style={{ fontSize: '15px', color: '#444', lineHeight: 1.8, fontWeight: 400, fontFamily: "'HubotSans', sans-serif" }}>
            Sleekblue Media Houz is a premium printing and corporate branding company dedicated to helping businesses of all sizes — from solopreneurs to big brands — communicate their identity with clarity and confidence. We specialize in die-cut stickers, flex printing, large format printing, corporate branding, and a wide range of promotional materials.
          </p>
        </div>

        {/* Our Mission */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#7B2FBE', marginBottom: '16px', fontFamily: "'HubotSans', sans-serif" }}>Our Mission</h2>
          <p style={{ fontSize: '15px', color: '#444', lineHeight: 1.8, fontFamily: "'HubotSans', sans-serif" }}>
            To deliver premium printing with zero stress — high quality output, fast turnaround, and reliable service that empowers small businesses and enterprise brands alike to stand out in their market.
          </p>
        </div>

        {/* Values */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#7B2FBE', marginBottom: '24px', fontFamily: "'HubotSans', sans-serif" }}>What Sets Us Apart</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { icon: '🎯', title: 'Precision', desc: 'Every cut, every print is executed to exact specifications.' },
              { icon: '⚡', title: 'Speed', desc: 'Fast turnaround without compromising on quality.' },
              { icon: '💎', title: 'Quality', desc: 'Waterproof, durable materials that last and impress.' },
              { icon: '🤝', title: 'Trust', desc: 'Trusted by UBA, MTN, HERO, NNPC, Seplat, and 500+ brands.' },
              { icon: '💰', title: 'Value', desc: 'Bulk discounts for growing businesses.' },
              { icon: '🛠️', title: 'Support', desc: '24/7 customer care and WhatsApp-first communication.' },
            ].map((v, i) => (
              <div key={i} style={{ background: '#f9f5ff', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #7B2FBE' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{v.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px', fontFamily: "'HubotSans', sans-serif" }}>{v.title}</h3>
                <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, fontFamily: "'HubotSans', sans-serif" }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Who We Serve */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#7B2FBE', marginBottom: '16px', fontFamily: "'HubotSans', sans-serif" }}>Who We Serve</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {['Solopreneurs & Micro Businesses', 'Small Business Owners', 'Growth Business Enterprises', 'Big Brands & Corporate Organizations'].map((c, i) => (
              <div key={i} style={{ background: '#FAF3E8', borderRadius: '8px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#7B2FBE', fontWeight: 700, fontSize: '16px' }}>✓</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#333', fontFamily: "'HubotSans', sans-serif" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div style={{ background: '#7B2FBE', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px', fontFamily: "'HubotSans', sans-serif" }}>Ready to Print?</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginBottom: '24px', fontFamily: "'HubotSans', sans-serif" }}>Call us or chat on WhatsApp — we respond fast.</p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:+2348065275264" style={{ background: '#fff', color: '#7B2FBE', padding: '11px 28px', borderRadius: '24px', fontWeight: 700, fontSize: '14px', fontFamily: "'HubotSans', sans-serif" }}>📞 +234 806 527 5264</a>
            <a href="https://wa.me/2348065275264" target="_blank" rel="noopener noreferrer" style={{ background: '#25D366', color: '#fff', padding: '11px 28px', borderRadius: '24px', fontWeight: 700, fontSize: '14px', fontFamily: "'HubotSans', sans-serif" }}>💬 Chat on WhatsApp</a>
          </div>
        </div>
      </div>
    </section>
  )
}
