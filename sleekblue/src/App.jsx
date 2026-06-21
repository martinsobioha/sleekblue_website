import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { trackPageView } from './hooks/useAnalytics'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import SocialSidebar from './components/SocialSidebar'
import ChatWidget from './components/ChatWidget'
import WhatsAppFloat from './components/WhatsAppFloat'
import WhatsAppLeadPopup from './components/WhatsAppLeadPopup'
import TermsModal from './components/TermsModal'
import Footer from './components/Footer'
import BackToTop from './components/BackToTop'
import CookieBanner from './components/CookieBanner'
import PromoBanner from './components/PromoBanner'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

const HomePage      = lazy(() => import('./pages/HomePage'))
const StorePage     = lazy(() => import('./pages/StorePage'))
const ProductPage   = lazy(() => import('./pages/ProductPage'))
const CartPage      = lazy(() => import('./pages/CartPage'))
const CheckoutPage  = lazy(() => import('./pages/CheckoutPage'))
const QuotePage     = lazy(() => import('./pages/QuotePage'))
const AboutPage     = lazy(() => import('./pages/AboutPage'))
const BlogPage      = lazy(() => import('./pages/BlogPage'))
const BlogPostPage  = lazy(() => import('./pages/BlogPostPage'))
const PriceListPage    = lazy(() => import('./pages/PriceListPage'))
const AdminPage        = lazy(() => import('./pages/AdminPage'))
const ComparisonPage   = lazy(() => import('./pages/ComparisonPage'))
const NotFoundPage     = lazy(() => import('./pages/NotFoundPage'))

function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '4px solid #e0d6f5', borderTopColor: '#7B2FBE', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function PageTracker() {
  const location = useLocation()
  useEffect(() => { trackPageView(location.pathname) }, [location.pathname])
  return null
}

function PageTransition({ children }) {
  const location = useLocation()
  const [visible, setVisible] = useState(true)
  const [key, setKey] = useState(location.pathname)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => { setKey(location.pathname); setVisible(true) }, 80)
    return () => clearTimeout(t)
  }, [location.pathname])

  return (
    <div key={key} style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.18s ease' }}>
      {children}
    </div>
  )
}

function TrackingInjector() {
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : {})
      .then(settings => {
        if (settings.ga4Id && !document.getElementById('ga4-script')) {
          const s1 = document.createElement('script')
          s1.id = 'ga4-script'
          s1.async = true
          s1.src = `https://www.googletagmanager.com/gtag/js?id=${settings.ga4Id}`
          document.head.appendChild(s1)
          const s2 = document.createElement('script')
          s2.id = 'ga4-init'
          s2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.ga4Id}');`
          document.head.appendChild(s2)
        }
        if (settings.metaPixelId && !document.getElementById('meta-pixel-script')) {
          const s = document.createElement('script')
          s.id = 'meta-pixel-script'
          s.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${settings.metaPixelId}');fbq('track','PageView');`
          document.head.appendChild(s)
        }
      })
      .catch(() => {})
  }, [])
  return null
}

function MainSite() {
  return (
    <CartProvider>
      <PageTracker />
      <TrackingInjector />
      <PromoBanner />
      <TermsModal />
      <Navbar />
      <SocialSidebar />
      <main>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <PageTransition>
              <Routes>
                <Route path="/"              element={<HomePage />} />
                <Route path="/store"         element={<StorePage />} />
                <Route path="/store/:slug"   element={<ProductPage />} />
                <Route path="/cart"          element={<CartPage />} />
                <Route path="/checkout"      element={<CheckoutPage />} />
                <Route path="/quote"         element={<QuotePage />} />
                <Route path="/about"         element={<AboutPage />} />
                <Route path="/blog"          element={<BlogPage />} />
                <Route path="/blog/:slug"    element={<BlogPostPage />} />
                <Route path="/price-list"    element={<PriceListPage />} />
                <Route path="/compare"      element={<ComparisonPage />} />
                <Route path="*"             element={<NotFoundPage />} />
              </Routes>
            </PageTransition>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <WhatsAppFloat />
      <ChatWidget />
      <WhatsAppLeadPopup />
      <BackToTop />
      <CookieBanner />
    </CartProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/sbm-control-2026" element={<AdminPage />} />
          <Route path="/admin" element={<Navigate to="/sbm-control-2026" replace />} />
          <Route path="/*"     element={<MainSite />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
