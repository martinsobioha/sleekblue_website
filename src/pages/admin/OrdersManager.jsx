import React, { useState, useEffect, useCallback } from 'react'
import { authH, Card, Btn, Badge } from './AdminUI'

const STATUS_OPTIONS = ['pending', 'paid', 'cancelled', 'refunded']

function statusColor(status) {
  switch (status) {
    case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'cancelled': return 'bg-slate-100 text-slate-600 border-slate-200'
    case 'refunded': return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'amount_mismatch': return 'bg-orange-100 text-orange-800 border-orange-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

function money(n) {
  const v = Number(n) || 0
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)
  } catch {
    return `₦${v.toLocaleString()}`
  }
}

function when(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return String(iso)
  }
}

export function OrdersView({ token }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/orders', { headers: authH(token) })
      if (!res.ok) throw new Error('Failed to load orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Could not load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  async function setStatus(ref, status) {
    if (!ref) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(ref)}/status`, {
        method: 'PATCH',
        headers: { ...authH(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setOrders(prev => prev.map(o => o.ref === ref ? {
        ...o,
        status,
        paidAt: status === 'paid' ? (o.paidAt || new Date().toISOString()) : o.paidAt,
      } : o))
      setSelected(prev => prev && prev.ref === ref ? { ...prev, status, paidAt: status === 'paid' ? (prev.paidAt || new Date().toISOString()) : prev.paidAt } : prev)
      setToast(`Order ${ref} → ${status}`)
      setTimeout(() => setToast(''), 2500)
    } catch (e) {
      setToast(e.message || 'Status update failed')
      setTimeout(() => setToast(''), 3000)
    } finally {
      setUpdating(false)
    }
  }

  async function verifyPaystack(ref) {
    if (!ref) return
    setVerifying(true)
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(ref)}/verify-paystack`, {
        method: 'POST',
        headers: authH(token),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Verify failed')
      if (data.order) {
        setOrders(prev => prev.map(o => o.ref === ref ? data.order : o))
        setSelected(prev => prev && prev.ref === ref ? data.order : prev)
      }
      setToast(data.message || (data.paid ? 'Marked paid' : `Paystack: ${data.status}`))
      setTimeout(() => setToast(''), 3500)
    } catch (e) {
      setToast(e.message || 'Paystack verify failed')
      setTimeout(() => setToast(''), 3500)
    } finally {
      setVerifying(false)
    }
  }

  async function verifyAllPendingPaystack() {
    setVerifying(true)
    try {
      const res = await fetch('/api/admin/orders/verify-paystack-pending', {
        method: 'POST',
        headers: authH(token),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Bulk verify failed')
      await load()
      setToast(`Checked ${data.checked || 0} pending Paystack order(s); ${data.paidCount || 0} marked paid`)
      setTimeout(() => setToast(''), 4000)
    } catch (e) {
      setToast(e.message || 'Bulk verify failed')
      setTimeout(() => setToast(''), 3500)
    } finally {
      setVerifying(false)
    }
  }

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false
    if (!q.trim()) return true
    const s = q.trim().toLowerCase()
    const blob = [
      o.ref, o.id, o.status, o.paymentMethod,
      o.customer?.name, o.customer?.phone, o.customer?.email, o.customer?.city,
    ].filter(Boolean).join(' ').toLowerCase()
    return blob.includes(s)
  })

  const paidTotal = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + (Number(o.total) || 0), 0)
  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">🛒 Orders</h2>
          <p className="text-sm text-slate-500">
            Real storefront orders (Paystack, bank, WhatsApp). Update payment status here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={load} disabled={loading || verifying}>{loading ? 'Refreshing…' : 'Refresh'}</Btn>
          <Btn onClick={verifyAllPendingPaystack} disabled={loading || verifying}>
            {verifying ? 'Verifying…' : 'Verify pending Paystack'}
          </Btn>
        </div>
      </div>

      {toast && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">{toast}</div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="!p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">All orders</p>
          <p className="text-2xl font-black text-slate-900">{orders.length}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Pending</p>
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Paid revenue</p>
          <p className="text-2xl font-black text-emerald-700">{money(paidTotal)}</p>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {['all', ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
              filter === s
                ? 'border-[#7B2FBE] bg-[#7B2FBE] text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search ref, name, phone…"
          className="ml-auto min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#7B2FBE]"
        />
      </div>

      {error && (
        <Card className="mb-4 border border-rose-200 bg-rose-50 text-rose-700 text-sm">{error}</Card>
      )}

      {loading ? (
        <p className="py-12 text-center text-slate-500">Loading orders…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">
            No orders match. Place a test order on the storefront, then click Refresh.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Ref</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Total</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o, i) => (
                    <tr
                      key={o.id || o.ref || i}
                      onClick={() => setSelected(o)}
                      className={`cursor-pointer border-t border-slate-100 hover:bg-violet-50 ${selected?.ref === o.ref ? 'bg-violet-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                    >
                      <td className="px-3 py-3 font-mono text-xs font-semibold text-[#7B2FBE]">{o.ref || '—'}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900">{o.customer?.name || '—'}</div>
                        <div className="text-xs text-slate-500">{o.customer?.phone || ''}</div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{money(o.total)}</td>
                      <td className="px-3 py-3 capitalize text-slate-600">{o.paymentMethod || '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${statusColor(o.status)}`}>
                          {o.status || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{when(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            {!selected ? (
              <p className="text-sm text-slate-500">Select an order to view details.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Order</p>
                  <p className="font-mono text-sm font-bold text-[#7B2FBE]">{selected.ref}</p>
                  <p className="text-xs text-slate-500">{selected.id}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] text-slate-500">Customer</p>
                    <p className="font-semibold">{selected.customer?.name || '—'}</p>
                    <p className="text-slate-600">{selected.customer?.phone}</p>
                    <p className="text-slate-600">{selected.customer?.email}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Delivery</p>
                    <p className="text-slate-700">{selected.customer?.address}</p>
                    <p className="text-slate-700">{selected.customer?.city}</p>
                  </div>
                </div>

                {selected.customer?.notes && (
                  <div>
                    <p className="text-[11px] text-slate-500">Notes</p>
                    <p className="text-sm text-slate-700">{selected.customer.notes}</p>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Line items</p>
                  <ul className="space-y-2">
                    {(selected.lineItems || []).map((li, idx) => (
                      <li key={idx} className="flex justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <span className="text-slate-800">
                          {li.name || li.slug || 'Item'}
                          {li.size ? ` · ${li.size}` : ''}
                          <span className="text-slate-500"> × {li.quantity}</span>
                        </span>
                        <span className="font-semibold">{money(li.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{money(selected.subtotal)}</span></div>
                  {selected.discountAmount ? (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount ({Math.round((selected.discount || 0) * 100)}%)</span>
                      <span>-{money(selected.discountAmount)}</span>
                    </div>
                  ) : null}
                  <div className="mt-1 flex justify-between text-base font-black">
                    <span>Total</span><span>{money(selected.total)}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 capitalize">
                    Payment: {selected.paymentMethod || '—'}
                    {selected.paidAt ? ` · Paid ${when(selected.paidAt)}` : ''}
                  </div>
                </div>

                {selected.paymentMethod === 'paystack' && selected.status !== 'paid' && (
                  <div>
                    <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Paystack</p>
                    <Btn disabled={verifying || updating} onClick={() => verifyPaystack(selected.ref)}>
                      {verifying ? 'Checking Paystack…' : 'Verify payment with Paystack'}
                    </Btn>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Asks Paystack if this reference was paid. If yes, marks the order paid automatically.
                    </p>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Update status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map(s => (
                      <Btn
                        key={s}
                        disabled={updating || verifying || selected.status === s}
                        onClick={() => setStatus(selected.ref, s)}
                        className="capitalize"
                      >
                        {s}
                      </Btn>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default OrdersView
