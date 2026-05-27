import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CartPage() {
  const navigate = useNavigate()
  const { cartItems, updateQuantity, removeItem, subtotal, discount, discountAmount, total } = useCart()

  if (cartItems.length === 0) return (
    <section style={{ background: '#FAF3E8', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <p style={{ fontSize: '20px', fontWeight: 600, color: '#555', fontFamily: "'HubotSans', sans-serif" }}>Your cart is empty</p>
      <button onClick={() => navigate('/store')} style={{ background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '24px', padding: '12px 32px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'HubotSans', sans-serif" }}>Browse Products</button>
    </section>
  )

  return (
    <section style={{ background: '#FAF3E8', padding: '32px 24px 60px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a1a', marginBottom: '24px', fontFamily: "'HubotSans', sans-serif" }}>Your Cart</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
          {/* Items */}
          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #eee' }}>
                  {['Product', 'Size', 'Qty', 'Unit Price', 'Total', ''].map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12.5px', fontWeight: 700, color: '#333', fontFamily: "'HubotSans', sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#C8C8C8', borderRadius: '6px', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', fontFamily: "'HubotSans', sans-serif" }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#555' }}>{item.size || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #7B2FBE', background: '#fff', color: '#7B2FBE', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          style={{ width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: '#7B2FBE', color: '#fff', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#333' }}>₦{item.price.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>₦{(item.price * item.quantity).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => removeItem(item.id, item.size)} style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '16px', cursor: 'pointer' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '16px', fontFamily: "'HubotSans', sans-serif" }}>Order Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                <span style={{ color: '#555' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>₦{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                  <span style={{ color: '#28a745' }}>Bulk Discount ({Math.round(discount * 100)}%)</span>
                  <span style={{ color: '#28a745', fontWeight: 600 }}>−₦{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800 }}>
                <span>Total</span>
                <span style={{ color: '#7B2FBE' }}>₦{Math.round(total).toLocaleString()}</span>
              </div>
            </div>
            {discount === 0 && subtotal < 20000 && (
              <p style={{ fontSize: '11.5px', color: '#888', marginBottom: '12px', background: '#f9f5ff', borderRadius: '6px', padding: '8px 10px', lineHeight: 1.5 }}>
                💡 Spend ₦{(20000 - subtotal).toLocaleString()} more to get a 5% bulk discount!
              </p>
            )}
            <button onClick={() => navigate('/checkout')} style={{ width: '100%', background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '8px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px', fontFamily: "'HubotSans', sans-serif" }}>
              Proceed to Checkout
            </button>
            <button onClick={() => navigate('/store')} style={{ width: '100%', background: '#fff', color: '#555', border: '1.5px solid #ccc', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'HubotSans', sans-serif" }}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
