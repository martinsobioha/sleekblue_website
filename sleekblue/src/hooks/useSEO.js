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

export function useSEO(pageKey, fallback = {}) {
  useEffect(() => {
    fetchSEO().then(seo => {
      const entry = seo[pageKey] || {}
      const title = entry.title || fallback.title || 'Sleekblue Media Houz — Premium Printing. Zero Stress.'
      const description = entry.description || fallback.description || 'Sleekblue Media Houz — Nigeria\'s top printing and branding company. Die-cut stickers, flex banners, corporate branding and more.'
      const keywords = entry.keywords || fallback.keywords || ''

      document.title = title

      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc) }
      metaDesc.content = description

      if (keywords) {
        let metaKw = document.querySelector('meta[name="keywords"]')
        if (!metaKw) { metaKw = document.createElement('meta'); metaKw.name = 'keywords'; document.head.appendChild(metaKw) }
        metaKw.content = keywords
      }
    })
  }, [pageKey])
}
