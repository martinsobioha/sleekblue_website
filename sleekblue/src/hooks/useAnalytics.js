const ENDPOINT = '/api/analytics/track'

function getDevice() {
  const ua = navigator.userAgent
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) return 'mobile'
  return 'desktop'
}

export function track(event) {
  try {
    const payload = {
      ...event,
      device: getDevice(),
      referrer: document.referrer || '',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})
  } catch {}
}

export function trackPageView(page) {
  track({ type: 'pageview', page: page || window.location.pathname })
}

export function trackProductView(slug, name) {
  track({ type: 'product_view', slug, name, page: window.location.pathname })
}

export function trackCartAdd(slug, name, qty, price) {
  track({ type: 'cart_add', slug, name, qty: qty || 1, price, page: window.location.pathname })
}

export function trackInteraction(eventName, target) {
  track({ type: 'interaction', event: eventName, target, page: window.location.pathname })
}

export function trackQuoteRequest(slug, details) {
  track({ type: 'quote_request', slug, details, page: window.location.pathname })
}
