import { useEffect } from 'react'

let cachedSEO = null
let seoPromise = null

function fetchSEO() {
  if (cachedSEO) return Promise.resolve(cachedSEO)
  if (seoPromise) return seoPromise
  seoPromise = fetch('/api/seo')
    .then(r => r.ok ? r.json() : {})
    .then(d => { cachedSEO = d; return d })
    .catch(() => ({}))
  return seoPromise
}

function setMeta(name, content, attr = 'name') {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el) }
  el.content = content
}

export function useSEO(pageKey, fallback = {}) {
  useEffect(() => {
    fetchSEO().then(seo => {
      const entry = seo[pageKey] || {}
      const title       = entry.title       || fallback.title       || 'Sleekblue Media Houz — Premium Printing. Zero Stress.'
      const description = entry.description || fallback.description || "Sleekblue Media Houz — Nigeria's top printing and branding company in Owerri, Imo State. Die-cut stickers, flex banners, corporate branding and more."
      const keywords    = entry.keywords    || fallback.keywords    || 'printing company Nigeria, die cut stickers Owerri, flex banner printing, corporate branding Nigeria'

      document.title = title

      // Standard meta
      setMeta('description', description)
      if (keywords) setMeta('keywords', keywords)

      // Open Graph — updated dynamically per page
      setMeta('og:title',       title,       'property')
      setMeta('og:description', description, 'property')
      setMeta('og:type',        'website',   'property')
      setMeta('og:site_name',   'Sleekblue Media Houz', 'property')

      // Twitter Card
      setMeta('twitter:title',       title)
      setMeta('twitter:description', description)
    })
  }, [pageKey])
}
