import { useState, useEffect, useCallback } from 'react'
import logo from '@assets/SLEEKBLUE_LOGO_1779927359068.jpg'
import { ALL_PRODUCTS, STICKER_SIZE_PRICES, getProductDetails } from '../data/products'

const PRI = '#7B2FBE'
const PRI_LIGHT = '#f0e8ff'
const ACC = '#FF6B00'
const SIDEBAR_W = '220px'

function authH(token) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

function fmt(n) { return '₦' + Math.round(n).toLocaleString() }

// ─── Shared UI ───────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', ...style }}>{children}</div>
}
function Btn({ children, onClick, variant = 'primary', disabled, style }) {
  const bg = variant === 'primary' ? PRI : variant === 'danger' ? '#dc2626' : variant === 'success' ? '#16a34a' : '#fff'
  const color = variant === 'ghost' ? '#555' : '#fff'
  const border = variant === 'ghost' ? '1.5px solid #ddd' : 'none'
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: disabled ? '#ccc' : bg, color: disabled ? '#888' : color, border, borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: "'HubotSans',sans-serif", transition: 'opacity 0.15s', ...style }}>
      {children}
    </button>
  )
}
function Input({ label, value, onChange, type = 'text', placeholder, rows, style, readOnly }) {
  const base = { width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none', boxSizing: 'border-box', background: readOnly ? '#f9f9f9' : '#fff', ...style }
  return (
    <div style={{ marginBottom: '14px' }}>
      {label && <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '5px', fontFamily: "'HubotSans',sans-serif" }}>{label}</label>}
      {rows
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ ...base, resize: 'vertical' }} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} style={base} />
      }
    </div>
  )
}
function Badge({ children, color = PRI }) {
  return <span style={{ background: color + '20', color, borderRadius: '12px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, fontFamily: "'HubotSans',sans-serif" }}>{children}</span>
}
function SaveBar({ onSave, onCancel, saving, saved }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
      <Btn onClick={onSave} disabled={saving}>{saving ? 'Saving…' : '💾 Save Changes'}</Btn>
      {onCancel && <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>}
      {saved && <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>✓ Saved successfully!</span>}
    </div>
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return }
      localStorage.setItem('sbm_admin_token', data.token)
      onLogin(data.token)
    } catch {
      setError('Cannot connect to server. Make sure the app is running.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #5a1fa0 0%, #7B2FBE 60%, #9c4de0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '40px 36px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src={logo} alt="Sleekblue" style={{ height: '56px', borderRadius: '8px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', margin: '14px 0 4px', fontFamily: "'HubotSans',sans-serif" }}>Admin Panel</h2>
          <p style={{ fontSize: '13px', color: '#888', fontFamily: "'HubotSans',sans-serif", margin: 0 }}>Sign in to manage your website</p>
        </div>
        <form onSubmit={handleLogin}>
          <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" />
          {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px', fontFamily: "'HubotSans',sans-serif" }}>{error}</p>}
          <Btn onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? 'Signing in…' : '🔐 Sign In'}
          </Btn>
        </form>
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#bbb', marginTop: '16px', fontFamily: "'HubotSans',sans-serif" }}>
          Default: admin / Sleekblue2026!
        </p>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, counts, onLogout }) {
  const items = [
    { id: 'dashboard',      icon: '📊', label: 'Dashboard' },
    { id: 'products',       icon: '🛍️', label: 'Products',  badge: counts.products },
    { id: 'sticker-prices', icon: '🏷️', label: 'Sticker Prices' },
    { id: 'settings',       icon: '⚙️', label: 'Site Settings' },
    { id: 'acceptances',    icon: '📋', label: 'T&C Acceptances', badge: counts.acceptances },
    { id: 'security',       icon: '🔑', label: 'Security' },
  ]
  return (
    <div style={{ width: SIDEBAR_W, minHeight: '100vh', background: PRI, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
        <img src={logo} alt="Sleekblue" style={{ height: '42px', borderRadius: '6px', background: '#fff', padding: '4px' }} />
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', margin: '8px 0 0', fontFamily: "'HubotSans',sans-serif", letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Panel</p>
      </div>
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {items.map(item => {
          const active = view === item.id
          return (
            <div key={item.id} onClick={() => setView(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 18px', cursor: 'pointer', background: active ? 'rgba(255,255,255,0.18)' : 'transparent', borderLeft: active ? '3px solid #fff' : '3px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => !active && (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
              onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: active ? 700 : 500, fontFamily: "'HubotSans',sans-serif", flex: 1 }}>{item.label}</span>
              {item.badge > 0 && <span style={{ background: ACC, color: '#fff', borderRadius: '10px', padding: '1px 8px', fontSize: '10px', fontWeight: 700 }}>{item.badge}</span>}
            </div>
          )
        })}
      </nav>
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <Btn variant="ghost" onClick={onLogout} style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
          🚪 Log Out
        </Btn>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardView({ siteData }) {
  const acceptances = siteData.acceptances || []
  const recent = [...acceptances].reverse().slice(0, 8)
  const stats = [
    { label: 'Total Products', value: ALL_PRODUCTS.length, icon: '🛍️', color: PRI },
    { label: 'T&C Acceptances', value: acceptances.length, icon: '📋', color: '#16a34a' },
    { label: 'Products with Overrides', value: Object.keys(siteData.productOverrides || {}).length, icon: '✏️', color: ACC },
  ]
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', marginBottom: '20px', fontFamily: "'HubotSans',sans-serif" }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {stats.map((s, i) => (
          <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: '28px', fontWeight: 800, color: s.color, margin: 0, fontFamily: "'HubotSans',sans-serif" }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: '#888', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>{s.label}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Recent T&amp;C Acceptances</h3>
        {recent.length === 0
          ? <p style={{ color: '#888', fontSize: '13px' }}>No acceptances yet.</p>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#f8f8f8' }}>
                    {['Name', 'Email', 'Phone', 'IP Address', 'Date & Time', 'ID'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#555', fontFamily: "'HubotSans',sans-serif", whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }}>{r.customerName}</td>
                      <td style={{ padding: '9px 12px', color: '#555' }}>{r.email}</td>
                      <td style={{ padding: '9px 12px', color: '#555' }}>{r.phone}</td>
                      <td style={{ padding: '9px 12px', color: '#888', fontFamily: 'monospace', fontSize: '11px' }}>{r.ipAddress}</td>
                      <td style={{ padding: '9px 12px', color: '#888', whiteSpace: 'nowrap' }}>{new Date(r.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '9px 12px' }}><Badge>{r.acceptanceId?.slice(0,16)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Card>
    </div>
  )
}

// ─── Product Editor ───────────────────────────────────────────────────────────
function ProductEditor({ token, slug, baseProduct, override, onSaved, onCancel }) {
  const baseDetails = getProductDetails(slug)
  const merged = { ...baseProduct, ...baseDetails, ...(override || {}) }

  const [name, setName]             = useState(merged.name || '')
  const [category, setCategory]     = useState(merged.category || '')
  const [badge, setBadge]           = useState(merged.badge || '')
  const [description, setDescription] = useState(merged.description || '')
  const [features, setFeatures]     = useState(merged.features ? [...merged.features] : [])
  const [priceTable, setPriceTable] = useState(merged.priceTable ? JSON.parse(JSON.stringify(merged.priceTable)) : [])
  const [sizes, setSizes]           = useState(merged.sizes ? [...merged.sizes] : [])
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  function updateFeature(i, val) { const f = [...features]; f[i] = val; setFeatures(f) }
  function removeFeature(i)      { setFeatures(features.filter((_, idx) => idx !== i)) }
  function addFeature()          { setFeatures([...features, '']) }

  function updateSize(i, val) { const s = [...sizes]; s[i] = val; setSizes(s) }
  function removeSize(i)      { setSizes(sizes.filter((_, idx) => idx !== i)) }
  function addSize()          { setSizes([...sizes, '']) }

  function updateRow(i, field, val) {
    const t = JSON.parse(JSON.stringify(priceTable))
    t[i][field] = field === 'qty' || field === 'unitPrice' ? (parseFloat(val) || 0) : val
    setPriceTable(t)
  }
  function removeRow(i) { setPriceTable(priceTable.filter((_, idx) => idx !== i)) }
  function addRow()     { setPriceTable([...priceTable, { qty: 100, unitPrice: 0 }]) }

  async function handleSave() {
    setSaving(true); setSaved(false)
    const payload = { name, category, badge, description, features, priceTable, sizes }
    await fetch(`/api/admin/products/${slug}`, {
      method: 'PUT', headers: authH(token), body: JSON.stringify(payload),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    onSaved()
  }

  async function handleReset() {
    if (!confirm('Remove all overrides and restore original data for this product?')) return
    await fetch(`/api/admin/products/${slug}`, { method: 'DELETE', headers: authH(token) })
    onSaved(); onCancel()
  }

  const isDieCut = !!baseProduct.isDieCut

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#888' }}>←</button>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Edit: {baseProduct.name}</h2>
        {override && <Badge color="#16a34a">Has overrides</Badge>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Basic Information</h3>
          <Input label="Product Name" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Category" value={category} onChange={e => setCategory(e.target.value)} />
          <Input label="Badge Label (e.g. Best Seller)" value={badge} onChange={e => setBadge(e.target.value)} />
          <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
        </Card>

        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Features List</h3>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input value={f} onChange={e => updateFeature(i, e.target.value)}
                placeholder={`Feature ${i+1}`}
                style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
              <button onClick={() => removeFeature(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '0 12px', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
            </div>
          ))}
          <Btn variant="ghost" onClick={addFeature} style={{ marginTop: '4px' }}>+ Add Feature</Btn>
        </Card>

        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>
            Available Sizes / Types
          </h3>
          {sizes.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input value={s} onChange={e => updateSize(i, e.target.value)}
                placeholder={`Size/Type ${i+1}`}
                style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
              <button onClick={() => removeSize(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '0 12px', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
            </div>
          ))}
          <Btn variant="ghost" onClick={addSize} style={{ marginTop: '4px' }}>+ Add Size</Btn>
        </Card>

        {!isDieCut && (
          <Card>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '4px', fontFamily: "'HubotSans',sans-serif" }}>Price Table</h3>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Enter quantity and unit price per piece (in ₦)</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>Qty (pcs)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>Unit Price (₦/pc)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {priceTable.map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: '6px 10px' }}>
                        <input type="number" value={row.qty} onChange={e => updateRow(i, 'qty', e.target.value)}
                          style={{ width: '80px', padding: '6px 8px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input type="number" value={row.unitPrice} onChange={e => updateRow(i, 'unitPrice', e.target.value)}
                          style={{ width: '100px', padding: '6px 8px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '6px 10px', color: '#7B2FBE', fontWeight: 700 }}>{fmt(row.qty * row.unitPrice)}</td>
                      <td style={{ padding: '6px 10px' }}>
                        <button onClick={() => removeRow(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Btn variant="ghost" onClick={addRow} style={{ marginTop: '10px' }}>+ Add Row</Btn>
          </Card>
        )}
        {isDieCut && (
          <Card>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '8px', fontFamily: "'HubotSans',sans-serif" }}>Die-Cut Sticker Pricing</h3>
            <p style={{ fontSize: '12.5px', color: '#888', fontFamily: "'HubotSans',sans-serif" }}>
              Sticker prices are managed in the <strong style={{ color: PRI }}>Sticker Prices</strong> section. Click it in the sidebar to edit the full price matrix.
            </p>
          </Card>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
        <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '💾 Save Changes'}</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        {override && <Btn variant="danger" onClick={handleReset} style={{ marginLeft: 'auto' }}>↺ Reset to Original</Btn>}
        {saved && <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>✓ Saved!</span>}
      </div>
    </div>
  )
}

// ─── Products List ────────────────────────────────────────────────────────────
function ProductsView({ token, productOverrides, onDataChanged }) {
  const [editingSlug, setEditingSlug] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = ALL_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  if (editingSlug) {
    const base = ALL_PRODUCTS.find(p => p.slug === editingSlug) || {}
    const details = base
    return (
      <ProductEditor
        token={token} slug={editingSlug}
        baseProduct={details}
        override={productOverrides[editingSlug]}
        onSaved={onDataChanged}
        onCancel={() => setEditingSlug(null)}
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Products</h2>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search products…"
          style={{ padding: '9px 14px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', width: '240px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              {['Product Name', 'Category', 'Base Price', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#555', fontFamily: "'HubotSans',sans-serif", whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const hasOverride = !!productOverrides[p.slug]
              const priceTbl = p.priceTable || []
              const basePrice = priceTbl.length > 0 ? `₦${(priceTbl[0].unitPrice).toLocaleString()}/pc` : (p.price ? `₦${Number(p.price).toLocaleString()}` : '—')
              return (
                <tr key={p.id} style={{ borderTop: '1px solid #f0f0f0' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '11px 16px', fontWeight: 600, color: '#1a1a1a' }}>{p.name}</td>
                  <td style={{ padding: '11px 16px', color: '#888' }}>{p.category}</td>
                  <td style={{ padding: '11px 16px', color: '#555' }}>{basePrice}</td>
                  <td style={{ padding: '11px 16px' }}>
                    {hasOverride ? <Badge color="#16a34a">Edited</Badge> : <Badge color="#888">Original</Badge>}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <Btn onClick={() => setEditingSlug(p.slug)} style={{ padding: '6px 14px', fontSize: '12px' }}>✏️ Edit</Btn>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── Sticker Prices ───────────────────────────────────────────────────────────
function StickerPricesView({ token, stickerPriceOverrides, onDataChanged }) {
  const base = STICKER_SIZE_PRICES
  const merged = { ...base, ...stickerPriceOverrides }
  const [prices, setPrices] = useState(JSON.parse(JSON.stringify(merged)))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newSize, setNewSize] = useState('')

  function update(size, field, val) {
    setPrices(prev => ({ ...prev, [size]: { ...prev[size], [field]: parseFloat(val) || 0 } }))
  }

  function addSize() {
    if (!newSize.trim()) return
    setPrices(prev => ({ ...prev, [newSize.trim()]: { p100: 0, p500: 0, p1000: 0 } }))
    setNewSize('')
  }

  async function handleSave() {
    setSaving(true); setSaved(false)
    await fetch('/api/admin/sticker-prices', {
      method: 'PUT', headers: authH(token), body: JSON.stringify(prices),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    onDataChanged()
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', marginBottom: '6px', fontFamily: "'HubotSans',sans-serif" }}>Die-Cut Sticker Prices</h2>
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px', fontFamily: "'HubotSans',sans-serif" }}>
        Edit the base prices for all sticker sizes. Bulk discounts (500+, 1000+) are calculated automatically from these values.
      </p>
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>Size</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>100 pcs (₦ total)</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>500 pcs (₦ total)</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>1,000 pcs (₦ total)</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>Unit @ 100</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>Changed</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(prices).map(([size, p]) => {
                const isChanged = JSON.stringify(p) !== JSON.stringify(base[size] || {})
                return (
                  <tr key={size} style={{ borderTop: '1px solid #eee', background: isChanged ? '#f0fdf4' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1a1a1a' }}>{size}</td>
                    {['p100', 'p500', 'p1000'].map(field => (
                      <td key={field} style={{ padding: '8px 14px' }}>
                        <input type="number" value={p[field]} onChange={e => update(size, field, e.target.value)}
                          style={{ width: '110px', padding: '7px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '13px', textAlign: 'center', fontFamily: "'HubotSans',sans-serif" }} />
                      </td>
                    ))}
                    <td style={{ padding: '10px 14px', color: PRI, fontWeight: 700 }}>₦{(p.p100 / 100).toLocaleString()}/pc</td>
                    <td style={{ padding: '10px 14px' }}>{isChanged ? <Badge color="#16a34a">Modified</Badge> : <span style={{ color: '#ccc', fontSize: '11px' }}>—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
          <input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder='Add new size (e.g. 5x5")'
            style={{ padding: '8px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
          <Btn variant="ghost" onClick={addSize}>+ Add Size</Btn>
        </div>
        <SaveBar onSave={handleSave} saving={saving} saved={saved} />
      </Card>
    </div>
  )
}

// ─── Site Settings ────────────────────────────────────────────────────────────
function SettingsView({ token, settings, onDataChanged }) {
  const [form, setForm] = useState({
    phone: '', whatsapp: '', primaryColor: '#7B2FBE', accentColor: '#FF6B00',
    heroTitle: '', heroSubtitle: '', companyName: '', email: '', address: '',
    ...settings,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setForm(prev => ({ ...prev, ...settings })) }, [settings])

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

  async function handleSave() {
    setSaving(true); setSaved(false)
    await fetch('/api/admin/settings', {
      method: 'PUT', headers: authH(token), body: JSON.stringify(form),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    onDataChanged()
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', marginBottom: '20px', fontFamily: "'HubotSans',sans-serif" }}>Site Settings</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Contact Information</h3>
          <Input label="Company Name" value={form.companyName} onChange={e => set('companyName', e.target.value)} />
          <Input label="Phone Number" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+2348065275264" />
          <Input label="WhatsApp Number (digits only)" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="2348065275264" />
          <Input label="Email Address" value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@sleekbluemediahouz.com" />
          <Input label="Address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Lagos, Nigeria" />
        </Card>

        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Homepage Content</h3>
          <Input label="Hero Title" value={form.heroTitle} onChange={e => set('heroTitle', e.target.value)} placeholder="Premium Print, Branding & Design" />
          <Input label="Hero Subtitle" value={form.heroSubtitle} onChange={e => set('heroSubtitle', e.target.value)} placeholder="Zero Stress. Fast Turnaround." />
        </Card>

        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Brand Colours</h3>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px', fontFamily: "'HubotSans',sans-serif", lineHeight: 1.5 }}>
            Choose your brand colours. Changes are saved and applied to new content. Contact your developer to apply site-wide.
          </p>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '8px', fontFamily: "'HubotSans',sans-serif" }}>Primary Colour</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                  style={{ width: '50px', height: '42px', border: '1.5px solid #ddd', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                <input value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                  style={{ width: '100px', padding: '9px 10px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace' }} />
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: form.primaryColor, border: '1px solid #eee' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#555', marginBottom: '8px', fontFamily: "'HubotSans',sans-serif" }}>Accent Colour</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="color" value={form.accentColor} onChange={e => set('accentColor', e.target.value)}
                  style={{ width: '50px', height: '42px', border: '1.5px solid #ddd', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                <input value={form.accentColor} onChange={e => set('accentColor', e.target.value)}
                  style={{ width: '100px', padding: '9px 10px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace' }} />
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: form.accentColor, border: '1px solid #eee' }} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '8px', fontFamily: "'HubotSans',sans-serif" }}>Current Settings Preview</h3>
          <div style={{ background: '#f8f8f8', borderRadius: '8px', padding: '14px', fontSize: '12.5px', color: '#555', fontFamily: "'HubotSans',sans-serif", lineHeight: 1.7 }}>
            <div><strong>Phone:</strong> {form.phone || '—'}</div>
            <div><strong>WhatsApp:</strong> {form.whatsapp ? `https://wa.me/${form.whatsapp}` : '—'}</div>
            <div><strong>Email:</strong> {form.email || '—'}</div>
            <div><strong>Hero:</strong> {form.heroTitle}</div>
            <div><strong>Subtitle:</strong> {form.heroSubtitle}</div>
          </div>
        </Card>
      </div>
      <SaveBar onSave={handleSave} saving={saving} saved={saved} />
    </div>
  )
}

// ─── Acceptances ──────────────────────────────────────────────────────────────
function AcceptancesView({ acceptances }) {
  const [search, setSearch] = useState('')
  const filtered = acceptances.filter(r =>
    (r.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.phone || '').includes(search)
  )
  const sorted = [...filtered].reverse()

  function exportCSV() {
    const headers = ['Acceptance ID', 'Date & Time', 'Name', 'Email', 'Phone', 'IP Address', 'Terms Version']
    const rows = acceptances.map(r => [
      r.acceptanceId, r.timestamp, r.customerName, r.email, r.phone, r.ipAddress, r.termsVersion,
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'terms-acceptances.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px', fontFamily: "'HubotSans',sans-serif" }}>T&amp;C Acceptances</h2>
          <p style={{ color: '#888', fontSize: '13px', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>{acceptances.length} total records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name, email, phone…"
            style={{ padding: '9px 14px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', width: '260px', fontFamily: "'HubotSans',sans-serif", outline: 'none' }} />
          <Btn variant="success" onClick={exportCSV}>⬇ Export CSV</Btn>
        </div>
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {sorted.length === 0
          ? <p style={{ padding: '24px', color: '#888', textAlign: 'center', fontFamily: "'HubotSans',sans-serif" }}>No records found.</p>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#f8f8f8' }}>
                    {['#', 'Name', 'Email', 'Phone', 'IP Address', 'Date & Time', 'Version', 'Acceptance ID'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#555', fontFamily: "'HubotSans',sans-serif", whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 14px', color: '#bbb', fontWeight: 700 }}>{acceptances.length - i}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{r.customerName}</td>
                      <td style={{ padding: '10px 14px', color: '#555' }}>{r.email}</td>
                      <td style={{ padding: '10px 14px', color: '#555' }}>{r.phone}</td>
                      <td style={{ padding: '10px 14px', color: '#888', fontFamily: 'monospace', fontSize: '11px' }}>{r.ipAddress}</td>
                      <td style={{ padding: '10px 14px', color: '#888', whiteSpace: 'nowrap' }}>{new Date(r.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '10px 14px' }}><Badge>{r.termsVersion}</Badge></td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '10px', color: '#aaa' }}>{r.acceptanceId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Card>
    </div>
  )
}

// ─── Security ─────────────────────────────────────────────────────────────────
function SecurityView({ token }) {
  const [current, setCurrent]   = useState('')
  const [next, setNext]         = useState('')
  const [confirm, setConfirm]   = useState('')
  const [msg, setMsg]           = useState(null)
  const [saving, setSaving]     = useState(false)

  async function handleChange() {
    setMsg(null)
    if (next !== confirm) { setMsg({ type: 'error', text: 'New passwords do not match.' }); return }
    if (next.length < 6)  { setMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return }
    setSaving(true)
    const res = await fetch('/api/admin/password', {
      method: 'PUT', headers: authH(token), body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setMsg({ type: 'error', text: data.error || 'Failed.' }); return }
    setMsg({ type: 'success', text: 'Password changed successfully!' })
    setCurrent(''); setNext(''); setConfirm('')
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', marginBottom: '20px', fontFamily: "'HubotSans',sans-serif" }}>Security</h2>
      <div style={{ maxWidth: '440px' }}>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: PRI, marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>Change Admin Password</h3>
          <Input label="Current Password" type="password" value={current} onChange={e => setCurrent(e.target.value)} />
          <Input label="New Password" type="password" value={next} onChange={e => setNext(e.target.value)} />
          <Input label="Confirm New Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          {msg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', background: msg.type === 'error' ? '#fee2e2' : '#dcfce7', color: msg.type === 'error' ? '#dc2626' : '#16a34a', fontSize: '13px', fontFamily: "'HubotSans',sans-serif" }}>
              {msg.text}
            </div>
          )}
          <Btn onClick={handleChange} disabled={saving}>{saving ? 'Changing…' : '🔑 Change Password'}</Btn>
        </Card>
        <Card style={{ marginTop: '16px', background: '#fffbeb', border: '1px solid #fde68a' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', marginBottom: '8px', fontFamily: "'HubotSans',sans-serif" }}>⚠️ Security Reminder</h4>
          <p style={{ fontSize: '12.5px', color: '#78350f', lineHeight: 1.6, margin: 0, fontFamily: "'HubotSans',sans-serif" }}>
            Keep your admin password secure. Do not share it with anyone. The admin panel gives full access to all site data and settings.
          </p>
        </Card>
      </div>
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('sbm_admin_token') || '')
  const [view, setView] = useState('dashboard')
  const [siteData, setSiteData] = useState({ settings: {}, productOverrides: {}, stickerPriceOverrides: {}, acceptances: [] })
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async (tok = token) => {
    if (!tok) return
    setLoading(true)
    try {
      const [dataRes, accRes] = await Promise.all([
        fetch('/api/admin/site-data', { headers: { Authorization: `Bearer ${tok}` } }),
        fetch('/api/admin/acceptances', { headers: { Authorization: `Bearer ${tok}` } }),
      ])
      if (dataRes.status === 401) { handleLogout(); return }
      const data = await dataRes.json()
      const acceptances = await accRes.json()
      setSiteData({
        settings:             data.settings             || {},
        productOverrides:     data.productOverrides     || {},
        stickerPriceOverrides:data.stickerPriceOverrides || {},
        acceptances:          Array.isArray(acceptances) ? acceptances : [],
      })
    } catch {}
    setLoading(false)
  }, [token])

  useEffect(() => { if (token) fetchAll(token) }, [token])

  function handleLogin(tok) {
    setToken(tok)
    localStorage.setItem('sbm_admin_token', tok)
  }
  function handleLogout() {
    setToken('')
    localStorage.removeItem('sbm_admin_token')
  }

  if (!token) return <LoginScreen onLogin={handleLogin} />

  const counts = {
    products: ALL_PRODUCTS.length,
    acceptances: siteData.acceptances.length,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'HubotSans',sans-serif" }}>
      <Sidebar view={view} setView={setView} counts={counts} onLogout={handleLogout} />
      <main style={{ flex: 1, background: '#f5f5f5', padding: '28px 28px 40px', overflowY: 'auto', minHeight: '100vh' }}>
        {loading && view === 'dashboard' && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>Loading…</div>
        )}
        {!loading && (
          <>
            {view === 'dashboard'      && <DashboardView siteData={siteData} />}
            {view === 'products'       && <ProductsView token={token} productOverrides={siteData.productOverrides} onDataChanged={fetchAll} />}
            {view === 'sticker-prices' && <StickerPricesView token={token} stickerPriceOverrides={siteData.stickerPriceOverrides} onDataChanged={fetchAll} />}
            {view === 'settings'       && <SettingsView token={token} settings={siteData.settings} onDataChanged={fetchAll} />}
            {view === 'acceptances'    && <AcceptancesView acceptances={siteData.acceptances} />}
            {view === 'security'       && <SecurityView token={token} />}
          </>
        )}
      </main>
    </div>
  )
}
