import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPhoneAlt, FaSearch, FaShoppingCart, FaBars, FaTimes } from 'react-icons/fa'
import { useCart } from '../context/CartContext'
import { NAV_MENUS, ALL_PRODUCTS } from '../data/products'
import sleekblueLogo from '@assets/SLEEKBLUE_LOGO_1779927359068.webp'

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
  const navRef = useRef(null)
  const closeTimeoutRef = useRef(null)
  const [phoneHref, setPhoneHref] = useState('tel:+2348065275264')
  const [phoneDisplay, setPhoneDisplay] = useState('+234 806 527 5264')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : {})
      .then(s => {
        if (s.phone) {
          const first = s.phone.split(',')[0].trim()
          setPhoneHref(`tel:${first.replace(/\s/g, '')}`)
          setPhoneDisplay(first)
        }
      })
      .catch(() => {})
  }, [])

  const allMenuItems = Object.values(NAV_MENUS).flat()
  const [blogResults, setBlogResults] = useState([])
  const [cachedPosts, setCachedPosts] = useState([])

  useEffect(() => {
    fetch('/api/blog').then(r => r.ok ? r.json() : []).then(posts => setCachedPosts(Array.isArray(posts) ? posts : [])).catch(() => {})
  }, [])

  function handleSearch(q) {
    setSearchQuery(q)
    if (q.trim().length < 2) { setSearchResults([]); setBlogResults([]); setShowSearch(false); return }
    const ql = q.toLowerCase()
    const products = ALL_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(ql) || p.category.toLowerCase().includes(ql)
    )
    const posts = cachedPosts.filter(p =>
      (p.title || '').toLowerCase().includes(ql) ||
      (p.category || '').toLowerCase().includes(ql) ||
      (p.excerpt || '').toLowerCase().includes(ql)
    ).slice(0, 4)
    setSearchResults(products)
    setBlogResults(posts)
    setShowSearch(products.length > 0 || posts.length > 0)
  }

  function clearCloseTimeout() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  function scheduleCloseMenu() {
    clearCloseTimeout()
    closeTimeoutRef.current = setTimeout(() => setOpenMenu(null), 180)
  }

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false)
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
      clearCloseTimeout()
    }
  }, [])

  return (
    <header ref={navRef} className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex-shrink-0 cursor-pointer" onClick={() => { navigate('/'); setMobileOpen(false) }}>
          <img src={sleekblueLogo} alt="Sleekblue Media Houz" className="h-12 w-auto object-contain" />
        </div>

        <div ref={searchRef} className="hidden flex-1 max-w-md md:block relative">
          <div className="flex items-center overflow-hidden rounded-full border border-slate-300 bg-white shadow-sm">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearch(true)}
              className="flex-1 border-none bg-transparent px-4 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            <button type="button" onClick={() => handleSearch(searchQuery)} className="px-4 py-2 text-slate-500 transition hover:text-slate-900">
              <FaSearch size={14} />
            </button>
          </div>

          {showSearch && (searchResults.length > 0 || blogResults.length > 0) && (
            <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.15)] z-50">
              {searchResults.length > 0 && (
                <div className="divide-y divide-slate-200">
                  <div className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Products</div>
                  {searchResults.map(p => (
                    <button key={p.id} type="button" onClick={() => { navigate(`/store/${p.slug}`); setShowSearch(false); setSearchQuery('') }} className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🛍️</span>
                        <div>
                          <div className="font-semibold text-violet-700">{p.name}</div>
                          <div className="text-[11px] text-slate-500">{p.category}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {blogResults.length > 0 && (
                <div className={searchResults.length > 0 ? 'divide-y divide-slate-200' : ''}>
                  <div className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Blog Posts</div>
                  {blogResults.map(p => (
                    <button key={p.slug} type="button" onClick={() => { navigate(`/blog/${p.slug}`); setShowSearch(false); setSearchQuery('') }} className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">✍️</span>
                        <div>
                          <div className="font-semibold">{p.title}</div>
                          {p.category && <div className="text-[11px] text-slate-500">{p.category}</div>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {showSearch && searchResults.length === 0 && blogResults.length === 0 && searchQuery.length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-[0_18px_60px_rgba(15,23,42,0.15)] z-50">
              No results for "{searchQuery}"
            </div>
          )}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <a href={phoneHref} className="flex items-center gap-2 text-[13px] text-slate-700 whitespace-nowrap transition hover:text-violet-700">
            <FaPhoneAlt size={12} className="text-violet-700" />
            <span className="text-slate-500">Customer care:</span>
            <span className="font-semibold text-slate-900">{phoneDisplay}</span>
          </a>
          <button type="button" onClick={() => navigate('/store')} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:bg-gradient-to-r hover:from-violet-600 hover:to-fuchsia-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30">
            Store
          </button>
          <button type="button" onClick={() => navigate('/blog')} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:bg-gradient-to-r hover:from-violet-600 hover:to-fuchsia-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30">
            Blog
          </button>
          <button type="button" data-testid="cart-button" onClick={() => navigate('/cart')} className="relative flex items-center gap-2 border-none bg-transparent p-0 text-sm font-semibold text-slate-900 transition hover:text-violet-700 focus:outline-none">
            <FaShoppingCart size={18} className="text-violet-700" />
            {totalItems > 0 && (
              <span data-testid="cart-badge" className="absolute -top-2 -right-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-violet-700 px-1.5 text-[10px] font-bold text-white">{totalItems}</span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <button type="button" data-testid="cart-button-mobile" onClick={() => navigate('/cart')} className="relative border-none bg-transparent p-0 text-slate-900 transition hover:text-violet-700 focus:outline-none" aria-label="Open cart">
            <FaShoppingCart size={20} className="text-violet-700" />
            {totalItems > 0 && (
              <span data-testid="cart-badge-mobile" className="absolute -top-1 -right-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-700 text-[9px] font-bold text-white">{totalItems}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-slate-900 transition hover:text-violet-700 focus:outline-none"
            aria-controls="mobile-nav"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>
      </div>

      <div className="hidden border-t border-slate-200 bg-white md:block">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 md:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(NAV_MENUS).map(([label, items]) => (
              <div
                key={label}
                className="relative"
                onMouseEnter={() => {
                  clearCloseTimeout()
                  setOpenMenu(label)
                }}
                onMouseLeave={scheduleCloseMenu}
              >
                <button
                  type="button"
                  onClick={() => {
                    clearCloseTimeout()
                    setOpenMenu(openMenu === label ? null : label)
                  }}
                  className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition ${openMenu === label ? 'border-b-2 border-violet-700 text-violet-700' : 'border-b-2 border-transparent text-slate-900 hover:text-violet-700'}`}
                >
                  {label} <span className="text-[10px]">▾</span>
                </button>
                {openMenu === label && (
                  <div className="absolute left-0 top-full z-50 mt-2 min-w-[14rem] max-w-[calc(100vw-2rem)] w-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.15)]">
                    {items.map(item => (
                      <button key={item.slug} type="button" onClick={() => { navigate(`/store/${item.slug}`); setOpenMenu(null) }} className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div
              className="relative"
              onMouseEnter={() => {
                clearCloseTimeout()
                setOpenMenu('all')
              }}
              onMouseLeave={scheduleCloseMenu}
            >
              <button
                type="button"
                onClick={() => {
                  clearCloseTimeout()
                  setOpenMenu(openMenu === 'all' ? null : 'all')
                }}
                className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition ${openMenu === 'all' ? 'border-b-2 border-violet-700 text-violet-700' : 'border-b-2 border-transparent text-slate-900 hover:text-violet-700'}`}
              >
                All Product & Services <span className="text-[10px]">▾</span>
              </button>
              {openMenu === 'all' && (
                <div className="absolute left-0 top-full z-50 mt-2 max-h-96 min-w-[18rem] w-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.15)]">
                  {allMenuItems.map((item, i) => (
                    <button key={i} type="button" onClick={() => { navigate(`/store/${item.slug}`); setOpenMenu(null) }} className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button type="button" onClick={() => navigate('/quote')} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-900 transition hover:text-violet-700">
            Request Quote
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-nav" role="dialog" aria-modal="false" className="border-t border-slate-200 bg-white px-4 pb-6 pt-4 shadow-sm md:hidden">
          <div className="mb-4">
            <div className="flex items-center overflow-hidden rounded-full border border-slate-300 bg-white shadow-sm">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                className="flex-1 border-none bg-transparent px-4 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <FaSearch size={14} className="mr-4 text-slate-500" />
            </div>
            {showSearch && searchResults.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                {searchResults.map(p => (
                  <button key={p.id} type="button" onClick={() => { navigate(`/store/${p.slug}`); setShowSearch(false); setSearchQuery(''); setMobileOpen(false) }} className="w-full px-4 py-4 text-left text-base text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3">
            {[{ label: 'Home', path: '/' }, { label: 'Store', path: '/store' }, { label: 'Blog', path: '/blog' }, { label: 'About', path: '/about' }, { label: 'Request Quote', path: '/quote' }].map(link => (
              <button key={link.path} type="button" onClick={() => { navigate(link.path); setMobileOpen(false) }} className="w-full rounded-3xl bg-slate-50 px-4 py-4 text-left text-base font-semibold text-slate-900 transition hover:bg-slate-100">
                {link.label}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-3">
            {Object.entries(NAV_MENUS).map(([label, items]) => (
              <div key={label} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <button type="button" aria-expanded={mobileExpanded === label} onClick={() => setMobileExpanded(mobileExpanded === label ? null : label)} className="flex w-full items-center justify-between px-4 py-4 text-left text-base font-semibold text-slate-900">
                  <span>{label}</span>
                  <span>{mobileExpanded === label ? '▲' : '▾'}</span>
                </button>
                {mobileExpanded === label && (
                  <div className="space-y-1 border-t border-slate-200 bg-white">
                    {items.map(item => (
                      <button key={item.slug} type="button" onClick={() => { navigate(`/store/${item.slug}`); setMobileOpen(false) }} className="w-full px-5 py-4 text-left text-base font-semibold text-violet-700 transition hover:bg-violet-50">
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <a href={phoneHref} className="mt-3 inline-flex w-full items-center justify-center gap-3 rounded-3xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800">
            <FaPhoneAlt size={14} /> {phoneDisplay}
          </a>
        </div>
      )}
    </header>
  )
}
