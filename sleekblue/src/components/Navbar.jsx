import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPhoneAlt, FaSearch, FaShoppingCart, FaBars, FaTimes } from 'react-icons/fa'
import { useCart } from '../context/CartContext'
import { NAV_MENUS, ALL_PRODUCTS } from '../data/products'
import sleekblueLogo from '@assets/SLEEKBLUE_LOGO_1779927359068.jpg'

export default function Navbar() {
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const searchRef = useRef(null)

  const allMenuItems = Object.values(NAV_MENUS).flat()

  function handleSearch(q) {
    setSearchQuery(q)
    if (q.trim().length < 2) { setSearchResults([]); setShowSearch(false); return }
    const results = ALL_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.category.toLowerCase().includes(q.toLowerCase())
    )
    setSearchResults(results)
    setShowSearch(true)
  }

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', maxWidth: '1280px', margin: '0 auto', gap: '12px' }}>

        {/* Logo */}
        <div style={{ flexShrink: 0, cursor: 'pointer' }} onClick={() => { navigate('/'); setMobileOpen(false) }}>
          <img src={sleekblueLogo} alt="Sleekblue Media Houz" style={{ height: '50px', width: 'auto', objectFit: 'contain', display: 'block' }} />
        </div>

        {/* Search — hidden on mobile */}
        <div ref={searchRef} className="search-box" style={{ flex: 1, maxWidth: '380px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #ddd', borderRadius: '24px', background: '#fff' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearch(true)}
              style={{ flex: 1, padding: '8px 16px', border: 'none', outline: 'none', fontSize: '13px', color: '#555', background: 'transparent', borderRadius: '24px' }}
            />
            <button onClick={() => handleSearch(searchQuery)} style={{ background: '#fff', border: 'none', padding: '8px 14px', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', borderRadius: '24px' }}>
              <FaSearch size={14} />
            </button>
          </div>
          {showSearch && searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 2000, maxHeight: '320px', overflowY: 'auto' }}>
              {searchResults.map(p => (
                <div key={p.id} onClick={() => { navigate(`/store/${p.slug}`); setShowSearch(false); setSearchQuery('') }}
                  style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '13px', color: '#333' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f0ff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <span style={{ fontWeight: 600, color: '#7B2FBE' }}>{p.name}</span>
                  <span style={{ color: '#999', marginLeft: '8px', fontSize: '11px' }}>{p.category}</span>
                </div>
              ))}
            </div>
          )}
          {showSearch && searchResults.length === 0 && searchQuery.length >= 2 && (
            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 2000, padding: '14px 16px', fontSize: '13px', color: '#888' }}>
              No products found for "{searchQuery}"
            </div>
          )}
        </div>

        {/* Desktop right */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <a href="tel:+2348065275264" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#333', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            <FaPhoneAlt size={12} color="#7B2FBE" />
            <span style={{ color: '#555' }}>Customer care:</span>
            <span style={{ fontWeight: 700, color: '#1a1a1a' }}>+234 806 527 5264</span>
          </a>
          <span onClick={() => navigate('/store')} style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', cursor: 'pointer' }}>Store</span>
          <span onClick={() => navigate('/blog')} style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', cursor: 'pointer' }}>Blog</span>
          <span onClick={() => navigate('/cart')} style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
            <FaShoppingCart size={18} color="#7B2FBE" />
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: '#7B2FBE', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{totalItems}</span>
            )}
          </span>
        </div>

        {/* Mobile right */}
        <div className="mobile-nav" style={{ display: 'none', alignItems: 'center', gap: '14px' }}>
          <span onClick={() => navigate('/cart')} style={{ position: 'relative', cursor: 'pointer' }}>
            <FaShoppingCart size={20} color="#7B2FBE" />
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#7B2FBE', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{totalItems}</span>
            )}
          </span>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', display: 'flex', alignItems: 'center' }}>
            {mobileOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>
      </div>

      {/* Desktop sub-nav */}
      <div className="desktop-subnav" style={{ borderTop: '1px solid #eee', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            {Object.entries(NAV_MENUS).map(([label, items]) => (
              <div key={label} style={{ position: 'relative' }}
                onMouseEnter={() => setOpenMenu(label)} onMouseLeave={() => setOpenMenu(null)}>
                <div style={{ padding: '11px 14px', fontSize: '13px', fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', borderBottom: openMenu === label ? '2px solid #7B2FBE' : '2px solid transparent' }}>
                  {label} <span style={{ fontSize: '10px' }}>▾</span>
                </div>
                {openMenu === label && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 999, minWidth: '220px', padding: '8px 0' }}>
                    {items.map(item => (
                      <div key={item.slug} onClick={() => { navigate(`/store/${item.slug}`); setOpenMenu(null) }}
                        style={{ padding: '9px 18px', fontSize: '13px', color: '#333', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f5f0ff'; e.currentTarget.style.color = '#7B2FBE' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#333' }}
                      >{item.name}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div style={{ position: 'relative' }} onMouseEnter={() => setOpenMenu('all')} onMouseLeave={() => setOpenMenu(null)}>
              <div style={{ padding: '11px 14px', fontSize: '13px', fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', borderBottom: openMenu === 'all' ? '2px solid #7B2FBE' : '2px solid transparent' }}>
                All Product & Services <span style={{ fontSize: '10px' }}>▾</span>
              </div>
              {openMenu === 'all' && (
                <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 999, minWidth: '260px', padding: '8px 0', maxHeight: '400px', overflowY: 'auto' }}>
                  {allMenuItems.map((item, i) => (
                    <div key={i} onClick={() => { navigate(`/store/${item.slug}`); setOpenMenu(null) }}
                      style={{ padding: '9px 18px', fontSize: '13px', color: '#333', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f5f0ff'; e.currentTarget.style.color = '#7B2FBE' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#333' }}
                    >{item.name}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <span onClick={() => navigate('/quote')} style={{ fontSize: '13.5px', fontWeight: 700, color: '#1a1a1a', cursor: 'pointer', padding: '11px 0', whiteSpace: 'nowrap' }}>Request Quote</span>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="mobile-menu" style={{ background: '#fff', borderTop: '1px solid #eee', padding: '8px 0 16px' }}>
          {/* Mobile search */}
          <div style={{ padding: '10px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #ddd', borderRadius: '24px', background: '#fff' }}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                style={{ flex: 1, padding: '8px 16px', border: 'none', outline: 'none', fontSize: '13px', background: 'transparent' }}
              />
              <FaSearch size={14} style={{ marginRight: '14px', color: '#888' }} />
            </div>
            {showSearch && searchResults.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: '4px', maxHeight: '220px', overflowY: 'auto' }}>
                {searchResults.map(p => (
                  <div key={p.id} onClick={() => { navigate(`/store/${p.slug}`); setShowSearch(false); setSearchQuery(''); setMobileOpen(false) }}
                    style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '13px', color: '#333' }}>
                    <span style={{ fontWeight: 600, color: '#7B2FBE' }}>{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile nav links */}
          {[{ label: 'Home', path: '/' }, { label: 'Store', path: '/store' }, { label: 'Blog', path: '/blog' }, { label: 'About', path: '/about' }, { label: 'Request Quote', path: '/quote' }].map(link => (
            <div key={link.path} onClick={() => { navigate(link.path); setMobileOpen(false) }}
              style={{ padding: '13px 20px', fontSize: '14px', fontWeight: 600, color: '#1a1a1a', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}>
              {link.label}
            </div>
          ))}
          {Object.entries(NAV_MENUS).map(([label, items]) => (
            <div key={label}>
              <div onClick={() => setMobileExpanded(mobileExpanded === label ? null : label)}
                style={{ padding: '13px 20px', fontSize: '14px', fontWeight: 600, color: '#555', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f5' }}>
                {label} <span style={{ fontSize: '12px' }}>{mobileExpanded === label ? '▲' : '▾'}</span>
              </div>
              {mobileExpanded === label && items.map(item => (
                <div key={item.slug} onClick={() => { navigate(`/store/${item.slug}`); setMobileOpen(false) }}
                  style={{ padding: '10px 32px', fontSize: '13px', color: '#7B2FBE', cursor: 'pointer', borderBottom: '1px solid #fafafa', background: '#faf8ff' }}>
                  {item.name}
                </div>
              ))}
            </div>
          ))}
          <a href="tel:+2348065275264" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 20px', fontSize: '14px', fontWeight: 600, color: '#1a1a1a', textDecoration: 'none' }}>
            <FaPhoneAlt size={13} color="#7B2FBE" /> +234 806 527 5264
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .search-box { display: none !important; }
          .desktop-nav { display: none !important; }
          .desktop-subnav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
