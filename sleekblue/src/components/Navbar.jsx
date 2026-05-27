import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPhoneAlt, FaSearch, FaShoppingCart } from 'react-icons/fa'
import { useCart } from '../context/CartContext'
import { NAV_MENUS, ALL_PRODUCTS } from '../data/products'
import sleekblueLogo from '@assets/SLEEKBLUE_LOGO_1779921080596.jpg'

export default function Navbar() {
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
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
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 24px', maxWidth: '1280px', margin: '0 auto', gap: '16px' }}>

        {/* Logo — clickable home */}
        <div style={{ flexShrink: 0, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src={sleekblueLogo} alt="Sleekblue Media Houz" style={{ height: '52px', width: 'auto', objectFit: 'contain', display: 'block' }} />
        </div>

        {/* Search */}
        <div ref={searchRef} style={{ flex: 1, maxWidth: '380px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #ddd', borderRadius: '24px', overflow: 'visible', background: '#fff' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearch(true)}
              style={{ flex: 1, padding: '8px 16px', border: 'none', outline: 'none', fontSize: '13px', color: '#555', background: 'transparent', borderRadius: '24px' }}
            />
            <button onClick={() => handleSearch(searchQuery)} style={{ background: '#fff', border: 'none', padding: '8px 14px', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}>
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

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexShrink: 0 }}>
          <a href="tel:+2348065275264" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#333', textDecoration: 'none' }}>
            <FaPhoneAlt size={12} color="#7B2FBE" />
            <span style={{ color: '#555', fontWeight: 400 }}>Customer care line:</span>
            <span style={{ fontWeight: 600, color: '#1a1a1a' }}>+234 806 527 5264</span>
          </a>
          <span onClick={() => navigate('/store')} style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', cursor: 'pointer' }}>Store</span>
          <span onClick={() => navigate('/blog')} style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', cursor: 'pointer' }}>Blog</span>
          <span onClick={() => navigate('/cart')} style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
            <FaShoppingCart size={16} color="#7B2FBE" />
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: '#7B2FBE', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{totalItems}</span>
            )}
          </span>
        </div>
      </div>

      {/* Sub-nav */}
      <div style={{ borderTop: '1px solid #eee', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {Object.entries(NAV_MENUS).map(([label, items]) => (
              <div key={label} style={{ position: 'relative' }}
                onMouseEnter={() => setOpenMenu(label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <div style={{ padding: '11px 18px', fontSize: '13px', fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', borderBottom: openMenu === label ? '2px solid #7B2FBE' : '2px solid transparent' }}>
                  {label} <span style={{ fontSize: '10px' }}>▾</span>
                </div>
                {openMenu === label && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 999, minWidth: '220px', padding: '8px 0' }}>
                    {items.map(item => (
                      <div key={item.slug} onClick={() => { navigate(`/store/${item.slug}`); setOpenMenu(null) }}
                        style={{ padding: '9px 18px', fontSize: '13px', color: '#333', cursor: 'pointer', fontWeight: 400 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f5f0ff'; e.currentTarget.style.color = '#7B2FBE' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#333' }}
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* All Products & Services */}
            <div style={{ position: 'relative' }}
              onMouseEnter={() => setOpenMenu('all')}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <div style={{ padding: '11px 18px', fontSize: '13px', fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', borderBottom: openMenu === 'all' ? '2px solid #7B2FBE' : '2px solid transparent' }}>
                All Product & Services <span style={{ fontSize: '10px' }}>▾</span>
              </div>
              {openMenu === 'all' && (
                <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 999, minWidth: '260px', padding: '8px 0', maxHeight: '400px', overflowY: 'auto' }}>
                  {allMenuItems.map((item, i) => (
                    <div key={i} onClick={() => { navigate(`/store/${item.slug}`); setOpenMenu(null) }}
                      style={{ padding: '9px 18px', fontSize: '13px', color: '#333', cursor: 'pointer', fontWeight: 400 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f5f0ff'; e.currentTarget.style.color = '#7B2FBE' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#333' }}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <span onClick={() => navigate('/quote')} style={{ fontSize: '13.5px', fontWeight: 700, color: '#1a1a1a', cursor: 'pointer', padding: '11px 0', whiteSpace: 'nowrap' }}>Request Quote</span>
        </div>
      </div>
    </header>
  )
}
