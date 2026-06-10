import { createContext, useContext, useState } from 'react'
import { trackCartAdd } from '../hooks/useAnalytics'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])

  function addToCart(item) {
    trackCartAdd(item.slug || item.id, item.name, item.quantity || 1, item.price)
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id && i.size === item.size)
      if (existing) {
        return prev.map(i =>
          i.id === item.id && i.size === item.size
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
  }

  function updateQuantity(id, size, qty) {
    if (qty <= 0) {
      removeItem(id, size)
      return
    }
    setCartItems(prev =>
      prev.map(i => (i.id === id && i.size === size ? { ...i, quantity: qty } : i))
    )
  }

  function removeItem(id, size) {
    setCartItems(prev => prev.filter(i => !(i.id === id && i.size === size)))
  }

  function clearCart() {
    setCartItems([])
  }

  function getUnitPrice(product, qty) {
    const table = product.priceTable || []
    let price = 0
    for (const row of table) {
      if (qty >= row.qty) price = row.unitPrice
    }
    return price
  }

  function getDiscount(subtotal) {
    if (subtotal >= 100000) return 0.15
    if (subtotal >= 50000) return 0.10
    if (subtotal >= 20000) return 0.05
    return 0
  }

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discount = getDiscount(subtotal)
  const discountAmount = subtotal * discount
  const total = subtotal - discountAmount
  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, updateQuantity, removeItem, clearCart,
      subtotal, discount, discountAmount, total, totalItems, getUnitPrice
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
