import { FaStar } from 'react-icons/fa'

export default function TrustBar() {
  return (
    <section style={{ background: '#fff', padding: '28px 24px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
        {/* Stars + Rating */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[1,2,3,4,5].map(i => <FaStar key={i} size={22} color="#F5A623" />)}
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#333' }}>5.0/5 based on 500+ reviews</span>
        </div>

        {/* Trusted by */}
        <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: '#888', marginBottom: '14px', textTransform: 'uppercase' }}>
          TRUSTED BY GLOBAL BRANDS
        </p>

        {/* Brand logos */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '36px',
          flexWrap: 'wrap',
        }}>
          {/* UBA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '32px', height: '32px',
              background: '#E31E24',
              borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}>UBA</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '18px', color: '#1a1a1a', letterSpacing: '-0.5px' }}>UBA</span>
            <div style={{
              width: '18px', height: '18px',
              background: '#1a1a1a',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            }} />
          </div>

          {/* MTN */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '32px', height: '20px',
              background: '#FFD700',
              borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#000', fontSize: '8px', fontWeight: 900 }}>MTN</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '16px', color: '#1a1a1a' }}>MTN</span>
          </div>

          {/* HERO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '28px', height: '28px',
              background: '#FF6B00',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: '7px', fontWeight: 900 }}>H</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '16px', color: '#1a1a1a' }}>HERO</span>
          </div>

          {/* Imo Digital */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '28px', height: '28px',
              background: '#003087',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: '6px', fontWeight: 900 }}>ID</span>
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontWeight: 700, fontSize: '12px', color: '#1a1a1a' }}>Imo Digital</div>
              <div style={{ fontSize: '10px', color: '#555' }}>City Limited <span style={{ fontSize: '9px', color: '#888' }}>(IDCL)</span></div>
            </div>
          </div>

          {/* NNPC */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '28px', height: '28px',
              background: '#00843D',
              borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: '6px', fontWeight: 900 }}>NNPC</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#1a1a1a' }}>NNPC</span>
          </div>

          {/* Separator */}
          <div style={{ width: '1px', height: '30px', background: '#ddd' }} />

          {/* Seplat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '28px', height: '28px',
              background: '#005A9C',
              borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: '6px', fontWeight: 900 }}>SP</span>
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a1a' }}>Seplat</div>
              <div style={{ fontSize: '10px', color: '#555' }}>Energy</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
