import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ALL_PRODUCTS } from '../data/products.js'
import Breadcrumb from '../components/Breadcrumb.jsx'
import useSEO from '../hooks/useSEO.js'

const PRI = '#7B2FBE'

function formatPrice(n) {
  return '₦' + Math.round(n).toLocaleString('en-NG')
}

const PRODUCT_CATEGORIES = [
  { label: 'Stickers & Labels', slugs: ['die-cut-stickers', 'product-labels'] },
  { label: 'Banners & Stands', slugs: ['flex-banner', 'backlit-banner', 'canvas-banner', 'rollup-stand', 'double-sided-rollup', 'x-banner', 'pop-up-banner'] },
  { label: 'Print Materials', slugs: ['flyers-posters', 'business-card', 'letterhead', 'compliment-slip', 'invoice-receipt', 'burial-brochure'] },
  { label: 'Clothing & Merchandise', slugs: ['t-shirts', 't-shirt-cap', 'branded-bags'] },
  { label: 'Outdoor & Branding', slugs: ['vehicle-branding', 'signage', 'billboard'] },
  { label: 'Design Services', slugs: ['graphic-design', 'brand-identity', 'social-media-design', 'packaging-design'] },
]

export default function PriceListPage() {
  useSEO({
    title: 'Price List — Sleekblue Media Houz | Print & Branding Prices Nigeria',
    description: 'View our full printable price list for stickers, banners, business cards, T-shirts, vehicle branding and more. Best printing prices in Nigeria.',
    canonical: 'https://sleekbluemediahouz.com/price-list',
  })

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

  const crumbs = [{ label: 'Home', path: '/' }, { label: 'Price List' }]

  function handlePrint() { window.print() }

  return (
    <div className="bg-slate-50 min-h-screen font-[HubotSans]">
      <div className="no-print px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1100px]">
          <Breadcrumb crumbs={crumbs} />
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="no-print mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Price List</h1>
            <p className="text-sm text-slate-600 mt-2">All prices shown are starting prices. Final quote depends on quantity, size, and finishes.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handlePrint}
              className="rounded-2xl bg-violet-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-800">
              🖨️ Print / Save PDF
            </button>
            <Link to="/quote"
              className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600">
              Get Custom Quote →
            </Link>
          </div>
        </div>

        <div className="print-only hidden text-center mb-6 border-b border-violet-500 pb-4">
          <h1 className="text-2xl font-black text-violet-700 mb-1">Sleekblue Media Houz</h1>
          <p className="text-sm text-slate-600 mb-1">Premium Printing & Branding | Lagos, Nigeria</p>
          <p className="text-xs text-slate-500 mb-3">📞 +234 806 527 5264 | sleekbluemediahouz.com</p>
          <h2 className="text-lg font-bold text-slate-900">PRICE LIST {new Date().getFullYear()}</h2>
          <p className="text-xs text-slate-500 mt-2">Prices are starting from. Final price depends on quantity, size, and specification.</p>
        </div>

        {PRODUCT_CATEGORIES.map(cat => {
          const catProducts = cat.slugs
            .map(slug => products.find(p => p.slug === slug))
            .filter(Boolean)
          if (!catProducts.length) return null

          return (
            <div key={cat.label} className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-[0.28em] text-violet-700 mb-3 border-l-4 border-violet-700 pl-3">
                {cat.label}
              </h2>
              <div className="overflow-hidden rounded-[1rem] border border-slate-200 bg-white shadow-sm">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-violet-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Product</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">Min Qty</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">Starting From</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">Unit Price (at min)</th>
                      <th className="no-print px-4 py-3 text-center font-semibold text-slate-700">Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catProducts.map((product, i) => {
                      const firstTier = product.priceTable?.[0]
                      const startPrice = firstTier ? firstTier.unitPrice * firstTier.qty : product.price || 0
                      const unitPrice = firstTier?.unitPrice || 0
                      const minQty = firstTier?.qty || 1

                      return (
                        <tr key={product.slug} className={i > 0 ? 'border-t border-slate-200' : ''}>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-900">{product.name}</div>
                            {product.tagline && <div className="text-xs text-slate-500">{product.tagline}</div>}
                          </td>
                          <td className="px-4 py-4 text-center text-slate-600">{minQty > 1 ? `${minQty} pcs` : '1 pc'}</td>
                          <td className="px-4 py-4 text-right font-bold text-violet-700">{startPrice > 0 ? formatPrice(startPrice) : 'Get Quote'}</td>
                          <td className="px-4 py-4 text-right text-slate-600 text-xs">{unitPrice > 0 ? `${formatPrice(unitPrice)} / pc` : '—'}</td>
                          <td className="no-print px-4 py-4 text-center">
                            <Link to={`/store/${product.slug}`}
                              className="inline-flex rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-[12px] font-bold text-violet-700 transition hover:bg-violet-100">
                              Order →
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        <div className="rounded-[1rem] border border-violet-200 bg-violet-50 p-6 shadow-sm flex flex-col gap-5 md:flex-row md:items-start">
          <span className="text-3xl">💡</span>
          <div className="space-y-4">
            <h3 className="text-base font-bold text-violet-800">Bulk Discounts Available</h3>
            <p className="text-sm leading-7 text-slate-600">
              The more you order, the lower the unit price. All prices shown are starting (minimum quantity) prices. For large orders, corporate packages, or custom quotes contact us directly.
            </p>
            <div className="no-print flex flex-wrap gap-3">
              <a href="https://wa.me/2348065275264?text=Hi%20Sleekblue%2C%20I%20need%20a%20bulk%20quote" target="_blank" rel="noreferrer"
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">
                💬 WhatsApp for Bulk Quote
              </a>
              <Link to="/quote"
                className="rounded-2xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800">
                📝 Submit a Quote Request
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #fff; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  )
}
