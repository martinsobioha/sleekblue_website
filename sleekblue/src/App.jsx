import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import SocialSidebar from './components/SocialSidebar'
import ChatWidget from './components/ChatWidget'
import WhatsAppFloat from './components/WhatsAppFloat'
import HomePage from './pages/HomePage'
import StorePage from './pages/StorePage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import QuotePage from './pages/QuotePage'
import AboutPage from './pages/AboutPage'
import BlogPage from './pages/BlogPage'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Navbar />
        <SocialSidebar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/store/:slug" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/quote" element={<QuotePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<BlogPage />} />
          </Routes>
        </main>
        <WhatsAppFloat />
        <ChatWidget />
      </CartProvider>
    </BrowserRouter>
  )
}
