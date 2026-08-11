/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect, no-unused-vars, no-empty, no-dupe-keys */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ALL_PRODUCTS } from '../data/products'
import { PRODUCT_IMAGES } from '../data/productImages'
import { useSEO } from '../hooks/useSEO'
import Breadcrumb from '../components/Breadcrumb'

const PRI = '#7B2FBE'

const CATEGORIES = [
  { key: 'all', label: 'All Products' },
  { key: 'Flex Printing/Large Format', label: 'Flex & Large Format' },
  { key: 'Label Stickers', label: 'Label Stickers' },
  { key: 'Corporate Branding', label: 'Corporate Branding' },
]

function useWishlist() {
  const KEY = 'sbm_wishlist'
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
  })
  function toggle(slug) {
    setWishlist(prev => {
      const next = prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }
  return { wishlist, toggle }
}

export default function StorePage() {
  const navigate = useNavigate()
  useSEO('store', {
    title: 'Our Store — Sleekblue Media Houz',
    description: 'Shop all our printing and branding products — die-cut stickers, flex banners, business cards and more. Fast delivery across Nigeria.',
  })

  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState('')
  const { wishlist, toggle } = useWishlist()
  const [products, setProducts] = useState(ALL_PRODUCTS)
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        const overrides = data?.productOverrides || {}
        setProducts(ALL_PRODUCTS.map(p => {
          const o = overrides[p.slug]
          return o ? { ...p, ...o } : p
        }))
      })
      .catch(() => {})
  }, [])

  const filtered = products.filter(p => {
    const matchCat = activeCat === 'all' || p.category === activeCat
    const q = search.trim().toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  const displayCategories = activeCat === 'all'
    ? ['Flex Printing/Large Format', 'Label Stickers', 'Corporate Branding']
    : [activeCat]

  return (
    <section className="bg-[#FAF3E8] min-h-screen px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-[1280px]">
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Store' }]} />
        <h1 className="mt-8 text-3xl font-extrabold uppercase text-[#1a1a1a] sm:text-4xl">Our Store</h1>
        <p className="mt-2 text-sm text-slate-600">Browse all our printing and branding products</p>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setActiveCat(c.key)}
                type="button"
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${activeCat === c.key ? 'border-[#7B2FBE] bg-[#7B2FBE] text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-[#7B2FBE] hover:text-[#7B2FBE]'}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-[340px]">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search products…"
              className="w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#7B2FBE] focus:ring-2 focus:ring-[#7B2FBE]/20"
            />
          </div>
        </div>

        {displayCategories.map(cat => {
          const items = filtered.filter(p => p.category === cat)
          if (!items.length) return null
          return (
            <div key={cat} className="mt-10">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#7B2FBE]">{cat}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map(p => (
                  <div
                    key={p.slug}
                    className="group cursor-pointer overflow-hidden rounded-[1.5rem] border border-[#e0d6f5] bg-white shadow-sm transition hover:shadow-md"
                    onClick={() => navigate(`/store/${p.slug}`)}
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      {PRODUCT_IMAGES[p.slug]?.[0] ? (
                        <img src={PRODUCT_IMAGES[p.slug][0]} alt={p.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">No image</div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 group-hover:text-[#7B2FBE]">{p.name}</h3>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); toggle(p.slug) }}
                          className="text-lg"
                        >
                          {wishlist.includes(p.slug) ? '❤️' : '🤍'}
                        </button>
                      </div>
                      <p className="mt-1 text-sm font-bold text-[#7B2FBE]">
                        From ₦{Number(p.price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {wishlist.length > 0 && (
          <div className="mt-10 rounded-[28px] border border-[#e0d6f5] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-[#7B2FBE]">❤️ Your Saved Items ({wishlist.length})</h3>
            <div className="flex flex-wrap gap-3">
              {wishlist.map(slug => {
                const p = products.find(x => x.slug === slug)
                if (!p) return null
                return (
                  <div key={slug} className="flex items-center gap-3 rounded-2xl border border-[#e0d6f5] bg-[#f9f5ff] px-3 py-2">
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#e0d6f5]">
                      {PRODUCT_IMAGES[slug]?.[0] && (
                        <img src={PRODUCT_IMAGES[slug][0]} alt={p.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <span
                      className="cursor-pointer text-sm font-semibold text-slate-800 hover:text-[#7B2FBE]"
                      onClick={() => navigate(`/store/${slug}`)}
                    >
                      {p.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
