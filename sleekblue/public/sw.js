const CACHE_NAME = 'sleekblue-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) return

  if (url.pathname.match(/\.(js|css|woff2?|ttf|svg|png|jpg|jpeg|webp|ico)$/)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone)).catch(() => {})
        }
        return res
      }).catch(() => cached))
    )
    return
  }

  if (url.origin === location.origin && !url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    )
  }
})
