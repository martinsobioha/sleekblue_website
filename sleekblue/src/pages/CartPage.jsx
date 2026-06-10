import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { PRODUCT_IMAGES, STICKER_SIZE_IMAGES } from '../data/productImages'
import { FaWhatsapp, FaTrashAlt, FaShoppingBag } from 'react-icons/fa'

const WHATSAPP = '2348065275264'

function getItemImage(item) {
  if (item.slug) {
    const imgs = PRODUCT_IMAGES[item.slug]
    if (imgs && imgs.length > 0) return imgs[0]
    if (item.slug === 'die-cut-stickers' || item.slug === 'product-labels') {
      const sizeKey = item.size?.replace(/[×x]/g, 'x')
      const stickerImgs = STICKER_SIZE_IMAGES?.[sizeKey] || STICKER_SIZE_IMAGES?.['3x3"']
      if (stickerImgs) return stickerImgs[0]
    }
  }
  return null
}

function buildWhatsAppMessage(cartItems, total) {
  const lines = cartItems.map(i => `• ${i.name} (${i.size || 'Standard'}) × ${i.quantity.toLocaleString()} pcs — ₦${(i.price * i.quantity).toLocaleString()}`)
  return encodeURIComponent(
    `Hello Sleekblue! I'd like to place an order:\n\n${lines.join('\n')}\n\nTotal: ₦${Math.round(total).toLocaleString()}\n\nPlease confirm availability and payment details. Thank you!`
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const { cartItems, updateQuantity, removeItem, subtotal, discount, discountAmount, total } = useCart()

  if (cartItems.length === 0) return (
    <section style={{ background: '#FAF3E8', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px 24px' }}>
      <div style={{ fontSize: '56px' }}>🛒</div>
      <p style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', margin: 0, fontFamily: "'HubotSans', sans-serif" }}>Your cart is empty</p>
      <p style={{ fontSize: '14px', color: '#888', margin: 0, fontFamily: "'HubotSans', sans-serif" }}>Browse our products and add items to get started</p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => navigate('/store')} style={{ background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '24px', padding: '12px 32px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'HubotSans', sans-serif" }}>Browse Products</button>
        <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hello Sleekblue! I need help placing an order.')}`} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#25D366', color: '#fff', borderRadius: '24px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', fontFamily: "'HubotSans', sans-serif" }}>
          <FaWhatsapp /> Order via WhatsApp
        </a>
      </div>
    </section>
  )

  const waMsg = buildWhatsAppMessage(cartItems, total)

  return (
    <section style={{ background: '#FAF3E8', padding: '32px 16px 60px', minHeight: '100vh', fontFamily: "'HubotSans', sans-serif" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Your Cart</h1>
          <span style={{ background: '#7B2FBE', color: '#fff', borderRadius: '12px', padding: '2px 10px', fontSize: '13px', fontWeight: 700 }}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

          {/* Items */}
          <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>Order Items</span>
              <button onClick={() => navigate('/store')} style={{ background: 'none', border: 'none', color: '#7B2FBE', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Add more</button>
            </div>

            {cartItems.map((item, i) => {
              const img = getItemImage(item)
              return (
                <div key={i} style={{ padding: '16px 20px', borderBottom: i < cartItems.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  {/* Product image */}
                  <div style={{ width: '72px', height: '72px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#f0e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {img
                      ? <img src={img} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <FaShoppingBag size={24} color="#7B2FBE" />
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px', lineHeight: 1.3 }}>{item.name}</p>
                    {item.size && <p style={{ fontSize: '12px', color: '#888', margin: '0 0 10px' }}>Size: {item.size}</p>}

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f5f5f5', borderRadius: '20px', padding: '4px 10px' }}>
                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #7B2FBE', background: '#fff', color: '#7B2FBE', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>−</button>
                        <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '40px', textAlign: 'center' }}>{item.quantity.toLocaleString()}</span>
                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          style={{ width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: '#7B2FBE', color: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>+</button>
                      </div>
                      <span style={{ fontSize: '11px', color: '#aaa' }}>pcs</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: '#7B2FBE', margin: '0 0 4px' }}>₦{(item.price * item.quantity).toLocaleString()}</p>
                    <p style={{ fontSize: '11px', color: '#aaa', margin: '0 0 8px' }}>₦{item.price.toLocaleString()} each</p>
                    <button onClick={() => removeItem(item.id, item.size)}
                      style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, marginLeft: 'auto' }}>
                      <FaTrashAlt size={10} /> Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px' }}>Order Summary</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#555' }}>Subtotal ({cartItems.reduce((a, i) => a + i.quantity, 0).toLocaleString()} pcs)</span>
                  <span style={{ fontWeight: 600 }}>₦{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>🎉 Bulk Discount ({Math.round(discount * 100)}%)</span>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>−₦{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800 }}>
                  <span>Total</span>
                  <span style={{ color: '#7B2FBE' }}>₦{Math.round(total).toLocaleString()}</span>
                </div>
              </div>

              {discount === 0 && subtotal < 20000 && (
                <div style={{ background: '#f5f0ff', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '12px', color: '#7B2FBE', lineHeight: 1.55 }}>
                  💡 Spend <strong>₦{(20000 - subtotal).toLocaleString()}</strong> more to unlock a 5% bulk discount!
                </div>
              )}

              {discount > 0 && (
                <div style={{ background: '#dcfce7', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '12px', color: '#16a34a', lineHeight: 1.55, fontWeight: 600 }}>
                  ✅ You saved ₦{discountAmount.toLocaleString()} with bulk pricing!
                </div>
              )}

              <button onClick={() => navigate('/checkout')}
                style={{ width: '100%', background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' }}>
                Proceed to Checkout →
              </button>

              {/* WhatsApp order option */}
              <a href={`https://wa.me/${WHATSAPP}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px', textDecoration: 'none', boxSizing: 'border-box' }}>
                <FaWhatsapp size={16} /> Order via WhatsApp
              </a>

              <button onClick={() => navigate('/store')}
                style={{ width: '100%', background: '#fff', color: '#555', border: '1.5px solid #ddd', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                ← Continue Shopping
              </button>
            </div>

            {/* Need help box */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px 18px', boxShadow: '0 1px 8px rgba(0,0,0,0.07)', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px' }}>Need help with your order?</p>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px', lineHeight: 1.5 }}>Chat us on WhatsApp — we respond fast!</p>
              <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hello Sleekblue! I need help with my order.')}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#25D366', color: '#fff', borderRadius: '20px', padding: '8px 18px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                <FaWhatsapp size={12} /> Chat Support
              </a>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:700px){ .product-cart-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}
