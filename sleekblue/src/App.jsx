import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import SocialSidebar from './components/SocialSidebar'
import ChatWidget from './components/ChatWidget'
import WhatsAppFloat from './components/WhatsAppFloat'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <SocialSidebar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product" element={<ProductPage />} />
        </Routes>
      </main>
      <WhatsAppFloat />
      <ChatWidget />
    </BrowserRouter>
  )
}
