import { FaPhoneAlt, FaSearch } from 'react-icons/fa'

export default function Navbar() {
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 1000 }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        maxWidth: '1280px',
        margin: '0 auto',
        gap: '16px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#fff',
            border: '2px solid #7B2FBE',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <img
              src="/logo.png"
              alt="Sleekblue Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.parentNode.innerHTML = `
                  <svg viewBox="0 0 48 48" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 4 L40 12 L40 28 C40 36 33 42 24 46 C15 42 8 36 8 28 L8 12 Z" fill="#7B2FBE"/>
                    <text x="24" y="28" text-anchor="middle" fill="white" font-size="9" font-weight="bold" font-family="Arial">SB</text>
                  </svg>`
              }}
            />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#1a1a2e', letterSpacing: '-0.3px' }}>Sleekblue<span style={{ color: '#7B2FBE' }}>®</span></div>
            <div style={{ fontSize: '9px', fontWeight: 600, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase' }}>MEDIA HOUZ</div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{
          flex: 1,
          maxWidth: '380px',
          display: 'flex',
          alignItems: 'center',
          border: '1.5px solid #ddd',
          borderRadius: '24px',
          overflow: 'hidden',
          background: '#fff',
        }}>
          <input
            type="text"
            placeholder="Search products..."
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              color: '#555',
              background: 'transparent',
            }}
          />
          <button style={{
            background: '#fff',
            border: 'none',
            padding: '8px 14px',
            cursor: 'pointer',
            color: '#888',
            display: 'flex',
            alignItems: 'center',
          }}>
            <FaSearch size={14} />
          </button>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#333' }}>
            <FaPhoneAlt size={12} color="#7B2FBE" />
            <span style={{ color: '#555' }}>Customer care line:</span>
            <span style={{ fontWeight: 700, color: '#1a1a1a' }}>+234 806 527 5264</span>
          </div>
          <a href="#" style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>Store</a>
          <a href="#" style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>Blog</a>
          <a href="#" style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>Request Quote</a>
        </div>
      </div>

      {/* Sub-nav */}
      <div style={{
        borderTop: '1px solid #eee',
        background: '#fff',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          maxWidth: '1280px',
          margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            {['Flex Printing/Large format', 'Label Stickers', 'Corporate Branding', 'All Product & Services'].map((item, i) => (
              <a key={i} href="#" style={{
                fontSize: '13.5px',
                fontWeight: 500,
                color: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}>
                {item}
                <span style={{ fontSize: '11px', color: '#555' }}>▾</span>
              </a>
            ))}
          </div>
          <a href="#" style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>Request Quote</a>
        </div>
      </div>
    </header>
  )
}
