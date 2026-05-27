export default function Hero() {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #7B2FBE 0%, #6B1FAE 100%)',
      minHeight: '420px',
      display: 'flex',
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
        gap: '32px',
      }}>
        {/* Left content */}
        <div style={{ flex: '0 0 auto', maxWidth: '480px' }}>
          <h1 style={{
            fontSize: '52px',
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1.1,
            marginBottom: '12px',
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
            maxWidth: '380px',
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
            }}>
              Print Sticker
            </button>
            <button style={{
              background: 'transparent',
              color: '#fff',
              border: '2px solid #fff',
              padding: '11px 26px',
              borderRadius: '24px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}>
              Print Flex
            </button>
          </div>
          {/* Dots pagination */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px', alignItems: 'center' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
          </div>
        </div>

        {/* Right - Hero image area */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          position: 'relative',
          minHeight: '360px',
        }}>
          {/* Woman placeholder */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '600px',
            height: '380px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}>
            {/* Person silhouette placeholder */}
            <div style={{
              width: '220px',
              height: '340px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '120px 120px 0 0',
              position: 'absolute',
              left: '50px',
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }} />

            {/* Print text overlay */}
            <div style={{
              position: 'absolute',
              left: '20px',
              bottom: '60px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.7)',
                fontStyle: 'italic',
                lineHeight: 1.3,
              }}>
                <span style={{ fontSize: '14px', fontStyle: 'normal', color: '#fff' }}>we</span><br />
                <strong style={{ fontSize: '22px', color: '#fff', fontStyle: 'italic', display: 'block' }}>Print</strong>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>for the</span><br />
                <strong style={{ fontSize: '18px', color: '#fff' }}>BIGGEST<br />BRANDS...</strong><br />
                <strong style={{ fontSize: '20px', color: '#F5C518' }}>YOURS</strong><br />
                <strong style={{ fontSize: '24px', color: '#fff', fontStyle: 'italic' }}>Next</strong>
              </div>
            </div>

            {/* Printing machine placeholders on right */}
            <div style={{
              position: 'absolute',
              right: '0',
              top: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{
                width: '200px',
                height: '110px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
              }} />
              <div style={{
                width: '200px',
                height: '110px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
              }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
