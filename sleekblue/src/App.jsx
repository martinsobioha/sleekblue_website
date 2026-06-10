import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import SocialSidebar from './components/SocialSidebar'
import ChatWidget from './components/ChatWidget'
import WhatsAppFloat from './components/WhatsAppFloat'
import TermsModal from './components/TermsModal'
import Footer from './components/Footer'
import './index.css'

const HomePage     = lazy(() => import('./pages/HomePage'))
const StorePage    = lazy(() => import('./pages/StorePage'))
const ProductPage  = lazy(() => import('./pages/ProductPage'))
const CartPage     = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const QuotePage    = lazy(() => import('./pages/QuotePage'))
const AboutPage    = lazy(() => import('./pages/AboutPage'))
const BlogPage     = lazy(() => import('./pages/BlogPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const AdminPage    = lazy(() => import('./pages/AdminPage'))

function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '4px solid #e0d6f5', borderTopColor: '#7B2FBE', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function MainSite() {
  return (
    <CartProvider>
      <TermsModal />
      <Navbar />
      <SocialSidebar />
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"            element={<HomePage />} />
            <Route path="/store"       element={<StorePage />} />
            <Route path="/store/:slug" element={<ProductPage />} />
            <Route path="/cart"        element={<CartPage />} />
            <Route path="/checkout"    element={<CheckoutPage />} />
            <Route path="/quote"       element={<QuotePage />} />
            <Route path="/about"       element={<AboutPage />} />
            <Route path="/blog"        element={<BlogPage />} />
            <Route path="/blog/:slug"  element={<BlogPostPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <WhatsAppFloat />
      <ChatWidget />
    </CartProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/sbm-control-2026" element={<AdminPage />} />
          <Route path="/*"     element={<MainSite />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
