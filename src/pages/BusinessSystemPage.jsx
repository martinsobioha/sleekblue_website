import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
  FiActivity, FiAlertTriangle, FiArrowDownRight, FiArrowUpRight, FiBriefcase,
  FiCheck, FiChevronRight, FiClipboard, FiExternalLink, FiLogIn, FiLogOut,
  FiPackage, FiPlus, FiRefreshCw, FiShoppingBag, FiSmartphone, FiTruck,
} from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import './business-system.css'

const money = value => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value || 0))
const quantity = value => new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(Number(value || 0))
const dateTime = value => new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const sessionKey = slug => `sb_business_session_${slug}`
const linkFor = slug => `${window.location.origin}/business/${slug}`

function AppMark() {
  return <div className="biz-mark"><span>S</span><div><strong>Business Book</strong><small>by Sleekblue</small></div></div>
}

function Field({ label, children, hint }) {
  return <label className="biz-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}

function Notice({ children, tone = 'error' }) {
  return children ? <div className={`biz-notice ${tone}`} role="status">{children}</div> : null
}

function Login({ slug, onLogin }) {
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('business_client_login', { p_slug: slug, p_phone: phone })
    setBusy(false)
    if (rpcError || !data?.ok || !data?.session_token) {
      setError('That phone number could not open this business account. Check it and try again.')
      return
    }
    onLogin(data.session_token)
  }

  return (
    <main className="biz-login-page">
      <div className="biz-login-art"><div className="biz-art-lines" /><div className="biz-art-copy"><span>YOUR BUSINESS,</span><strong>accounted for.</strong><p>Every sale. Every product. One clear record.</p></div></div>
      <section className="biz-login-panel">
        <AppMark />
        <div className="biz-login-content">
          <span className="biz-eyebrow">CLIENT SIGN IN</span>
          <h1>Welcome back.</h1>
          <p>Enter the phone number registered for your business.</p>
          <form onSubmit={submit} className="biz-form">
            <Field label="Phone number"><input autoComplete="tel" inputMode="tel" type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="e.g. 0801 234 5678" required /></Field>
            <Notice>{error}</Notice>
            <button className="biz-button primary" type="submit" disabled={busy}>{busy ? 'Checking…' : 'Open my business'}<FiChevronRight /></button>
          </form>
          <p className="biz-privacy-note">Your link and registered phone number open this account. Keep the link private.</p>
        </div>
        <span className="biz-login-foot">Sleekblue Business Records</span>
      </section>
    </main>
  )
}

function Metric({ label, value, icon: Icon, tint = '' }) {
  return <div className="biz-metric"><span className={`biz-metric-icon ${tint}`}><Icon /></span><div><small>{label}</small><strong>{value}</strong></div></div>
}

function ClientPortal({ slug }) {
  const [token, setToken] = useState(() => localStorage.getItem(sessionKey(slug)) || '')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [productForm, setProductForm] = useState({ name: '', unit: 'item', unit_price: '' })
  const [activity, setActivity] = useState({ product_id: '', kind: 'sale', quantity: '', unit_price: '', note: '' })
  const [stickerUse, setStickerUse] = useState({ sticker_id: '', quantity: '' })
  const [installPrompt, setInstallPrompt] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyYear, setHistoryYear] = useState('all')

  const load = useCallback(async currentToken => {
    const { data: snapshot, error: rpcError } = await supabase.rpc('business_portal_snapshot', { p_session_token: currentToken })
    if (rpcError || !snapshot?.client) {
      localStorage.removeItem(sessionKey(slug))
      setToken('')
      setData(null)
      setError('Your session expired. Enter your phone number to sign in again.')
      return
    }
    setData(snapshot)
    setError('')
  }, [slug])

  useEffect(() => {
    if (!token) return
    let current = true
    setLoading(true)
    supabase.rpc('business_portal_snapshot', { p_session_token: token }).then(({ data: snapshot, error: rpcError }) => {
      if (!current) return
      if (rpcError || !snapshot?.client) {
        localStorage.removeItem(sessionKey(slug))
        setToken('')
        setError('Your session expired. Enter your phone number to sign in again.')
      } else {
        setData(snapshot)
      }
      setLoading(false)
    })
    return () => { current = false }
  }, [slug, token])

  useEffect(() => {
    if (!token) return
    const timer = window.setInterval(() => { load(token) }, 30000)
    return () => window.clearInterval(timer)
  }, [load, token])

  useEffect(() => {
    const onPrompt = event => { event.preventDefault(); setInstallPrompt(event) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    const manifest = document.querySelector('link[rel="manifest"]')
    const priorManifest = manifest?.href
    if (manifest) manifest.href = '/business-manifest.json'
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      if (manifest && priorManifest) manifest.href = priorManifest
    }
  }, [])

  function acceptLogin(nextToken) {
    localStorage.setItem(sessionKey(slug), nextToken)
    localStorage.setItem('sb_business_last_slug', slug)
    setToken(nextToken)
    setLoading(true)
  }

  async function loadOlderTransactions() {
    setLoadingHistory(true)
    const currentCount = data?.transactions?.length || 0
    const { data: older, error: rpcError } = await supabase.rpc('business_transaction_page', {
      p_session_token: token,
      p_offset: currentCount,
      p_year: historyYear === 'all' ? null : Number(historyYear),
    })
    setLoadingHistory(false)
    if (rpcError) return setError('Could not load older records. Try again.')
    setData(current => ({
      ...current,
      transactions: [...(current?.transactions || []), ...(older || [])],
      has_more_transactions: (older || []).length === 100,
    }))
  }

  async function changeHistoryYear(event) {
    const year = event.target.value
    setHistoryYear(year)
    setLoadingHistory(true)
    const { data: page, error: rpcError } = await supabase.rpc('business_transaction_page', {
      p_session_token: token,
      p_offset: 0,
      p_year: year === 'all' ? null : Number(year),
    })
    setLoadingHistory(false)
    if (rpcError) return setError('Could not load that year. Try again.')
    setData(current => ({
      ...current,
      transactions: page || [],
      has_more_transactions: (page || []).length === 100,
    }))
  }

  async function addProduct(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const { error: rpcError } = await supabase.rpc('business_add_product', {
      p_session_token: token,
      p_name: productForm.name,
      p_unit: productForm.unit,
      p_unit_price: Number(productForm.unit_price || 0),
    })
    setBusy(false)
    if (rpcError) return setError('Could not save this product. Try again.')
    setProductForm({ name: '', unit: 'item', unit_price: '' })
    setShowProductForm(false)
    setNotice('Product added to your business book.')
    await load(token)
  }

  async function recordActivity(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const { error: rpcError } = await supabase.rpc('business_record_transaction', {
      p_session_token: token,
      p_product_id: activity.product_id,
      p_kind: activity.kind,
      p_quantity: Number(activity.quantity),
      p_unit_price: Number(activity.unit_price || 0),
      p_note: activity.note,
    })
    setBusy(false)
    if (rpcError) return setError(rpcError.message?.includes('Insufficient') ? 'There is not enough stock for that sale.' : 'Could not record this activity. Try again.')
    setNotice(activity.kind === 'sale' ? 'Sale recorded. Product stock updated.' : 'Stock update recorded.')
    setActivity(current => ({ ...current, quantity: '', note: '' }))
    await load(token)
  }

  async function useStickers(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const { error: rpcError } = await supabase.rpc('business_consume_stickers', {
      p_session_token: token,
      p_sticker_id: stickerUse.sticker_id,
      p_quantity: Number(stickerUse.quantity),
    })
    setBusy(false)
    if (rpcError) return setError(rpcError.message?.includes('Insufficient') ? 'There are not enough stickers in this balance.' : 'Could not update sticker usage.')
    setNotice('Sticker use recorded.')
    setStickerUse(current => ({ ...current, quantity: '' }))
    await load(token)
  }

  function signOut() {
    localStorage.removeItem(sessionKey(slug))
    setToken('')
    setData(null)
  }

  async function installApp() {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

  if (loading) return <main className="biz-loading"><FiRefreshCw className="biz-spin" /><span>Opening your business book…</span></main>
  if (!token || !data) return <Login slug={slug} onLogin={acceptLogin} />

  const client = data.client
  const products = data.products || []
  const transactions = data.transactions || []
  const stickers = data.stickers || []
  const jobs = data.jobs || []
  const stats = data.stats || {}

  return (
    <main className="biz-client-page">
      <header className="biz-client-top"><AppMark /><div className="biz-top-actions">{installPrompt && <button className="biz-icon-button" title="Install app" aria-label="Install app" onClick={installApp}><FiSmartphone /></button>}<button className="biz-icon-button" title="Sign out" aria-label="Sign out" onClick={signOut}><FiLogOut /></button></div></header>
      <div className="biz-client-content">
        <section className="biz-greeting"><div><span className="biz-eyebrow">BUSINESS OVERVIEW</span><h1>{client.business_name}</h1><p>{client.contact_name ? `Welcome, ${client.contact_name}` : 'Your daily business record'}</p></div><span className="biz-live-dot">Synced</span></section>
        <div className="biz-metrics-grid">
          <Metric label="Products tracked" value={products.length} icon={FiPackage} />
          <Metric label="Sales recorded" value={money(stats.sales_total)} icon={FiArrowUpRight} tint="green" />
          <Metric label="Sticker stock" value={quantity(stickers.reduce((sum, item) => sum + Number(item.remaining_qty || 0), 0))} icon={FiShoppingBag} tint="yellow" />
        </div>

        <Notice tone="success">{notice}</Notice><Notice>{error}</Notice>

        <section className="biz-section biz-record-section">
          <div className="biz-section-heading"><div><span className="biz-eyebrow">DAILY RECORD</span><h2>Record activity</h2></div><FiActivity /></div>
          {products.length === 0 ? <div className="biz-empty-inline"><p>Add your first product to start recording production and sales.</p><button className="biz-button primary" onClick={() => setShowProductForm(true)}><FiPlus /> Add a product</button></div> : (
            <form className="biz-form biz-record-form" onSubmit={recordActivity}>
              <div className="biz-form-row two"><Field label="Activity"><select value={activity.kind} onChange={event => setActivity({ ...activity, kind: event.target.value })}><option value="sale">Sale</option><option value="production">Stock produced / received</option><option value="adjustment">Stock adjustment</option></select></Field><Field label="Product"><select required value={activity.product_id} onChange={event => { const product = products.find(item => item.id === event.target.value); setActivity({ ...activity, product_id: event.target.value, unit_price: product?.unit_price ?? '' }) }}><option value="">Choose product</option>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></Field></div>
              <div className="biz-form-row two"><Field label="Quantity"><input type="number" min="0.01" step="0.01" inputMode="decimal" required value={activity.quantity} onChange={event => setActivity({ ...activity, quantity: event.target.value })} placeholder="0" /></Field>{activity.kind === 'sale' ? <Field label="Unit selling price"><input type="number" min="0" step="1" inputMode="numeric" value={activity.unit_price} onChange={event => setActivity({ ...activity, unit_price: event.target.value })} placeholder="₦0" /></Field> : <Field label="Note (optional)"><input value={activity.note} onChange={event => setActivity({ ...activity, note: event.target.value })} placeholder="e.g. Morning production" /></Field>}</div>
              {activity.kind === 'sale' && <Field label="Note (optional)"><input value={activity.note} onChange={event => setActivity({ ...activity, note: event.target.value })} placeholder="e.g. Walk-in customer" /></Field>}
              <button className="biz-button primary" disabled={busy || !activity.product_id}>{busy ? 'Saving…' : activity.kind === 'sale' ? 'Save sale' : 'Save stock update'}<FiCheck /></button>
            </form>
          )}
        </section>

        <section className="biz-section">
          <div className="biz-section-heading"><div><span className="biz-eyebrow">YOUR CATALOG</span><h2>Products & stock</h2></div><button className="biz-button small secondary" onClick={() => setShowProductForm(value => !value)}><FiPlus /> Add product</button></div>
          {showProductForm && <form className="biz-add-product" onSubmit={addProduct}><Field label="Product name"><input autoFocus maxLength="100" required value={productForm.name} onChange={event => setProductForm({ ...productForm, name: event.target.value })} placeholder="Product name" /></Field><div className="biz-form-row two"><Field label="Counted as"><input maxLength="24" value={productForm.unit} onChange={event => setProductForm({ ...productForm, unit: event.target.value })} placeholder="item, pack, bottle…" required /></Field><Field label="Selling price (₦)"><input type="number" min="0" step="1" inputMode="numeric" value={productForm.unit_price} onChange={event => setProductForm({ ...productForm, unit_price: event.target.value })} placeholder="0" /></Field></div><button className="biz-button primary" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button></form>}
          {products.length ? <div className="biz-product-list">{products.map(product => <article className="biz-product-row" key={product.id}><div className="biz-product-badge"><FiPackage /></div><div className="biz-product-name"><strong>{product.name}</strong><small>{money(product.unit_price)} / {product.unit}</small></div><div className="biz-stock-count"><strong>{quantity(product.stock_qty)}</strong><small>in stock</small></div></article>)}</div> : <p className="biz-muted">No products added yet.</p>}
        </section>

        <section className="biz-section">
          <div className="biz-section-heading"><div><span className="biz-eyebrow">STICKER SUPPLY</span><h2>Your sticker stock</h2></div><FiShoppingBag /></div>
          {stickers.length ? <div className="biz-sticker-list">{stickers.map(sticker => <article className="biz-sticker-row" key={sticker.id}><div><strong>{sticker.product_name}</strong><small>Alert at {quantity(sticker.threshold_qty)}</small></div><b className={Number(sticker.remaining_qty) <= Number(sticker.threshold_qty) ? 'low' : ''}>{quantity(sticker.remaining_qty)} left</b></article>)}</div> : <p className="biz-muted">Sticker balances will appear here when Sleekblue adds your first supply.</p>}
          {stickers.some(sticker => Number(sticker.remaining_qty) > 0) && <form className="biz-sticker-use" onSubmit={useStickers}><Field label="Record stickers used"><select required value={stickerUse.sticker_id} onChange={event => setStickerUse({ ...stickerUse, sticker_id: event.target.value })}><option value="">Choose sticker product</option>{stickers.map(sticker => <option key={sticker.id} value={sticker.id}>{sticker.product_name} · {quantity(sticker.remaining_qty)} left</option>)}</select></Field><Field label="Quantity"><input type="number" min="1" step="1" inputMode="numeric" required value={stickerUse.quantity} onChange={event => setStickerUse({ ...stickerUse, quantity: event.target.value })} placeholder="0" /></Field><button className="biz-button secondary" disabled={busy}>Save sticker use</button></form>}
          {jobs.length > 0 && <div className="biz-job-list">{jobs.map(job => <article className="biz-job-row" key={job.id}><span className="biz-job-icon"><FiTruck /></span><div><strong>{job.product_name}</strong><small>{quantity(job.quantity)} stickers · {dateTime(job.created_at)}</small></div><span className={`biz-job-status ${job.status}`}>{job.status.replace('_', ' ')}</span></article>)}</div>}
        </section>

        <section className="biz-section biz-history-section">
          <div className="biz-section-heading"><div><span className="biz-eyebrow">ACTIVITY LOG</span><h2>{historyYear === 'all' ? 'Recent records' : `Records from ${historyYear}`}</h2></div><label className="biz-year-filter"><span>YEAR</span><select value={historyYear} onChange={changeHistoryYear}><option value="all">All years</option>{Array.from({ length: Math.max(1, new Date().getFullYear() - new Date(stats.first_transaction_at || Date.now()).getFullYear() + 1) }, (_, index) => new Date().getFullYear() - index).map(year => <option key={year} value={year}>{year}</option>)}</select></label></div>
          {transactions.length ? <div className="biz-history-list">{transactions.map(row => <article className="biz-history-row" key={row.id}><span className={`biz-history-icon ${row.kind}`}><FiArrowDownRight /></span><div><strong>{row.product_name}</strong><small>{row.kind === 'sale' ? 'Sale' : row.kind === 'production' ? 'Stock received' : row.kind === 'sticker_used' ? 'Stickers used' : row.kind === 'sticker_delivery' ? 'Sticker supply delivered' : 'Stock adjustment'} · {row.quantity_delta < 0 ? '-' : '+'}{quantity(Math.abs(row.quantity_delta))} {row.unit}{row.note ? ` · ${row.note}` : ''}</small></div><div className="biz-history-end"><b>{row.kind === 'sale' ? money(row.total_amount) : `${row.quantity_delta < 0 ? '-' : '+'}${quantity(Math.abs(row.quantity_delta))}`}</b><small>{dateTime(row.created_at)}</small></div></article>)}</div> : <p className="biz-muted">Your recorded sales and stock updates will appear here.</p>}
          {data.has_more_transactions && <button className="biz-button secondary biz-history-more" disabled={loadingHistory} onClick={loadOlderTransactions}>{loadingHistory ? 'Loading…' : 'Load older records'}<FiChevronRight /></button>}
        </section>
        <footer className="biz-client-footer">Your records sync to your account when online.</footer>
      </div>
    </main>
  )
}

function AdminLogin({ onDone }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (authError) return setError('Email or password is not correct.')
    onDone(data.session)
  }

  return <main className="biz-admin-login"><section className="biz-admin-login-card"><AppMark /><span className="biz-eyebrow">STAFF ACCESS</span><h1>Client businesses</h1><p>Sign in to onboard clients and manage sticker supply.</p><form onSubmit={submit} className="biz-form"><Field label="Email"><input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} /></Field><Field label="Password"><input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></Field><Notice>{error}</Notice><button className="biz-button primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}<FiLogIn /></button></form></section></main>
}

function ClientCreateForm({ onCreated, busy }) {
  const [form, setForm] = useState({ business_name: '', contact_name: '', phone: '', business_phone: '' })
  return <form className="biz-create-form" onSubmit={event => { event.preventDefault(); onCreated(form, () => setForm({ business_name: '', contact_name: '', phone: '', business_phone: '' })) }}>
    <Field label="Business name"><input required maxLength="120" value={form.business_name} onChange={event => setForm({ ...form, business_name: event.target.value })} placeholder="e.g. Cindy Parfait" /></Field>
    <Field label="Client name"><input required maxLength="100" value={form.contact_name} onChange={event => setForm({ ...form, contact_name: event.target.value })} placeholder="Name" /></Field>
    <Field label="Phone number"><input required type="tel" inputMode="tel" maxLength="24" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} placeholder="Registered phone" /></Field>
    <Field label="Business phone (optional)"><input type="tel" inputMode="tel" maxLength="24" value={form.business_phone} onChange={event => setForm({ ...form, business_phone: event.target.value })} placeholder="If different" /></Field>
    <button className="biz-button primary" disabled={busy}>{busy ? 'Creating…' : 'Create client link'}<FiPlus /></button>
  </form>
}

function AdminBusinessSystem({ session, onSignOut }) {
  const [clients, setClients] = useState([])
  const [stocks, setStocks] = useState([])
  const [jobs, setJobs] = useState([])
  const [selected, setSelected] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [newLink, setNewLink] = useState('')
  const [jobForm, setJobForm] = useState({ product_name: '', quantity: '', threshold_qty: '500', note: '' })
  const [showJobForm, setShowJobForm] = useState(false)
  const [clientDetail, setClientDetail] = useState({ products: [], transactions: [], summary: {}, hasMore: false, loading: false })
  const [detailYear, setDetailYear] = useState('all')
  const [loadingOlderDetail, setLoadingOlderDetail] = useState(false)
  const selectedId = selected?.id

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    const [{ data: profileData }, { data: clientRows, error: clientError }, { data: stockRows }, { data: jobRows }] = await Promise.all([
      supabase.from('profiles').select('full_name,role').eq('id', session.user.id).maybeSingle(),
      supabase.from('business_clients').select('*').order('created_at', { ascending: false }),
      supabase.from('business_sticker_stock').select('*').order('product_name'),
      supabase.from('business_sticker_jobs').select('*').order('created_at', { ascending: false }).limit(100),
    ])
    setProfile(profileData || null)
    setClients(clientRows || [])
    setStocks(stockRows || [])
    setJobs(jobRows || [])
    setError(clientError ? 'Could not load client records. Check that the database setup has been applied.' : '')
    if (showLoading) setLoading(false)
  }, [session.user.id])

  useEffect(() => {
    load()
    const timer = window.setInterval(() => load(false), 30000)
    return () => window.clearInterval(timer)
  }, [load])

  useEffect(() => {
    setDetailYear('all')
    setClientDetail({ products: [], transactions: [], summary: {}, hasMore: false, loading: Boolean(selectedId) })
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) {
      setClientDetail({ products: [], transactions: [], summary: {}, hasMore: false, loading: false })
      return
    }
    let active = true
    async function loadDetails() {
      let historyQuery = supabase.from('business_transactions').select('id,product_name,unit,kind,quantity_delta,unit_price,total_amount,note,created_at', { count: 'exact' }).eq('client_id', selectedId)
      if (detailYear !== 'all') {
        historyQuery = historyQuery.gte('created_at', `${detailYear}-01-01T00:00:00+01:00`).lt('created_at', `${Number(detailYear) + 1}-01-01T00:00:00+01:00`)
      }
      const [{ data: products }, { data: transactions, count, error: historyError }, { data: summary }] = await Promise.all([
        supabase.from('business_products').select('id,name,unit,unit_price,stock_qty').eq('client_id', selectedId).eq('active', true).order('name'),
        historyQuery.order('created_at', { ascending: false }).order('id', { ascending: false }).range(0, 99),
        supabase.rpc('business_admin_client_summary', { p_client_id: selectedId }),
      ])
      if (!active) return
      setClientDetail({ products: products || [], transactions: transactions || [], summary: summary || {}, hasMore: (count || 0) > 100, loading: false })
      if (historyError) setError('Could not load this client’s sales history.')
    }
    loadDetails()
    const timer = window.setInterval(loadDetails, 30000)
    return () => { active = false; window.clearInterval(timer) }
  }, [selectedId, detailYear])

  async function createClient(form, reset) {
    setBusy(true)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('business_admin_create_client', {
      p_business_name: form.business_name,
      p_contact_name: form.contact_name,
      p_phone: form.phone,
      p_business_phone: form.business_phone,
    })
    setBusy(false)
    if (rpcError || !data?.slug) return setError(rpcError?.message || 'Could not create this client. Check the phone number and try again.')
    const generatedLink = linkFor(data.slug)
    setNewLink(generatedLink)
    reset()
    try { await navigator.clipboard.writeText(generatedLink) } catch {}
    setNotice('Client created. Their permanent link has been copied when clipboard access is available.')
    await load()
  }

  async function copyLink(slug) {
    const clientLink = linkFor(slug)
    try { await navigator.clipboard.writeText(clientLink); setNotice('Client link copied.') }
    catch { setNewLink(clientLink); setNotice('Copy the link shown below.') }
  }

  async function createJob(event) {
    event.preventDefault()
    if (!selected) return
    setBusy(true)
    setError('')
    const { error: rpcError } = await supabase.rpc('business_admin_create_sticker_job', {
      p_client_id: selected.id,
      p_product_name: jobForm.product_name,
      p_quantity: Number(jobForm.quantity),
      p_threshold_qty: Number(jobForm.threshold_qty),
      p_note: jobForm.note,
    })
    setBusy(false)
    if (rpcError) return setError('Could not create the sticker job.')
    setNotice('Sticker job recorded. The client will see its status in their business book.')
    setJobForm({ product_name: '', quantity: '', threshold_qty: '500', note: '' })
    setShowJobForm(false)
    await load()
  }

  async function updateJob(job, status) {
    setBusy(true)
    setError('')
    const { error: rpcError } = await supabase.rpc('business_admin_update_sticker_job', { p_job_id: job.id, p_status: status })
    setBusy(false)
    if (rpcError) return setError('Could not update the sticker job.')
    setNotice(status === 'delivered' ? 'Delivery recorded and sticker balance increased.' : 'Sticker job status updated.')
    await load()
  }

  async function changeClientHistoryYear(event) {
    const year = event.target.value
    setDetailYear(year)
    setClientDetail(current => ({ ...current, loading: true }))
  }

  async function loadOlderClientHistory() {
    setLoadingOlderDetail(true)
    let query = supabase.from('business_transactions')
      .select('id,product_name,unit,kind,quantity_delta,unit_price,total_amount,note,created_at', { count: 'exact' })
      .eq('client_id', selected.id)
    if (detailYear !== 'all') {
      query = query.gte('created_at', `${detailYear}-01-01T00:00:00+01:00`).lt('created_at', `${Number(detailYear) + 1}-01-01T00:00:00+01:00`)
    }
    const offset = clientDetail.transactions.length
    const { data: older, count, error: historyError } = await query.order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 99)
    setLoadingOlderDetail(false)
    if (historyError) return setError('Could not load older activity.')
    setClientDetail(current => ({ ...current, transactions: [...current.transactions, ...(older || [])], hasMore: offset + (older || []).length < (count || 0) }))
  }

  const isAdmin = profile?.role === 'admin'
  const lowStocks = stocks.filter(stock => Number(stock.remaining_qty) <= Number(stock.threshold_qty)).length

  if (loading) return <main className="biz-loading"><FiRefreshCw className="biz-spin" /><span>Loading client accounts…</span></main>
  if (!isAdmin) return <main className="biz-admin-login"><section className="biz-admin-login-card"><AppMark /><h1>Staff access required</h1><p>This account does not have client-system administrator access.</p><button className="biz-button secondary" onClick={onSignOut}>Sign out</button></section></main>

  return (
    <main className="biz-admin-page">
      <header className="biz-admin-top"><AppMark /><div className="biz-admin-actions"><span>{profile?.full_name || session.user.email}</span><button className="biz-icon-button" title="Refresh" aria-label="Refresh records" onClick={load}><FiRefreshCw /></button><button className="biz-icon-button" title="Sign out" aria-label="Sign out" onClick={onSignOut}><FiLogOut /></button></div></header>
      <div className="biz-admin-content">
        <section className="biz-admin-title"><div><span className="biz-eyebrow">CLIENT OPERATIONS</span><h1>Business records</h1><p>Onboard clients, follow their stock, and manage sticker supply.</p></div><span className="biz-admin-live"><i /> LIVE SYSTEM</span></section>
        <div className="biz-admin-metrics"><Metric label="Client businesses" value={clients.length} icon={FiBriefcase} /><Metric label="Sticker products" value={stocks.length} icon={FiPackage} tint="yellow" /><Metric label="Low stock alerts" value={lowStocks} icon={FiAlertTriangle} tint="red" /></div>
        <Notice tone="success">{notice}</Notice><Notice>{error}</Notice>
        {newLink && <div className="biz-generated-link"><div><small>CLIENT LINK</small><a href={newLink}>{newLink}</a></div><button className="biz-button secondary" onClick={() => navigator.clipboard?.writeText(newLink)}><FiClipboard /> Copy</button></div>}
        <section className="biz-section biz-onboard-section"><div className="biz-section-heading"><div><span className="biz-eyebrow">NEW ACCOUNT</span><h2>Onboard a client</h2></div><FiPlus /></div><ClientCreateForm onCreated={createClient} busy={busy} /></section>
        <section className="biz-section"><div className="biz-section-heading"><div><span className="biz-eyebrow">CLIENT ROSTER</span><h2>Businesses</h2></div><span className="biz-roster-count">{clients.length}</span></div>
          {clients.length ? <div className="biz-client-list">{clients.map(client => {
            const clientStocks = stocks.filter(stock => stock.client_id === client.id)
            const alertCount = clientStocks.filter(stock => Number(stock.remaining_qty) <= Number(stock.threshold_qty)).length
            return <article className={`biz-admin-client ${selected?.id === client.id ? 'selected' : ''}`} key={client.id}>
              <button className="biz-client-select" onClick={() => setSelected(selected?.id === client.id ? null : client)}><span className="biz-client-monogram">{client.business_name.slice(0, 1).toUpperCase()}</span><span className="biz-client-main"><strong>{client.business_name}</strong><small>{client.contact_name} · Login {client.phone}{client.business_phone ? ` · Business ${client.business_phone}` : ''}</small></span><span className="biz-client-alert">{alertCount > 0 && <><FiAlertTriangle /> {alertCount} low</>}</span><FiChevronRight className="biz-select-chevron" /></button>
              <div className="biz-client-actions"><button onClick={() => copyLink(client.slug)}><FiClipboard /> Copy link</button><a href={linkFor(client.slug)} target="_blank" rel="noreferrer"><FiExternalLink /> Open</a><button onClick={() => { setSelected(client); setShowJobForm(value => selected?.id === client.id ? !value : true) }}><FiTruck /> Sticker job</button></div>
              {selected?.id === client.id && <div className="biz-selected-panel">
                <div className="biz-selected-summary"><strong>{client.business_name}</strong><small>Permanent link · created {dateTime(client.created_at)}</small></div>
                <div className="biz-selected-stocks">{clientStocks.length ? clientStocks.map(stock => <span key={stock.id}>{stock.product_name}: <b className={Number(stock.remaining_qty) <= Number(stock.threshold_qty) ? 'low' : ''}>{quantity(stock.remaining_qty)} / alert {quantity(stock.threshold_qty)}</b></span>) : <span>No sticker products tracked yet.</span>}</div>
                <div className="biz-detail-stats"><span><small>ALL-TIME SALES</small><b>{money(clientDetail.summary.sales_total)}</b></span><span><small>ACTIVITY RECORDS</small><b>{quantity(clientDetail.summary.transaction_count)}</b></span><span><small>PRODUCTS</small><b>{clientDetail.products.length}</b></span></div>
                <div className="biz-admin-client-products">{clientDetail.products.map(product => <div key={product.id}><span>{product.name}<small>{money(product.unit_price)} / {product.unit}</small></span><b>{quantity(product.stock_qty)} in stock</b></div>)}</div>
                <div className="biz-admin-history-heading"><strong>Business activity</strong><label className="biz-year-filter"><span>YEAR</span><select value={detailYear} onChange={changeClientHistoryYear}><option value="all">All years</option>{Array.from({ length: Math.max(1, new Date().getFullYear() - new Date(clientDetail.summary.first_transaction_at || Date.now()).getFullYear() + 1) }, (_, index) => new Date().getFullYear() - index).map(year => <option key={year} value={year}>{year}</option>)}</select></label></div>
                {clientDetail.loading ? <p className="biz-muted">Loading client records…</p> : clientDetail.transactions.length ? <div className="biz-admin-history">{clientDetail.transactions.map(row => <article key={row.id}><div><strong>{row.product_name}</strong><small>{row.kind === 'sale' ? 'Sale' : row.kind === 'production' ? 'Stock received' : row.kind === 'sticker_used' ? 'Stickers used' : row.kind === 'sticker_delivery' ? 'Sticker supply delivered' : 'Stock adjustment'} · {row.quantity_delta < 0 ? '-' : '+'}{quantity(Math.abs(row.quantity_delta))} {row.unit}{row.note ? ` · ${row.note}` : ''}</small></div><div><b>{row.kind === 'sale' ? money(row.total_amount) : `${row.quantity_delta < 0 ? '-' : '+'}${quantity(Math.abs(row.quantity_delta))}`}</b><small>{dateTime(row.created_at)}</small></div></article>)}</div> : <p className="biz-muted">No activity has been recorded yet.</p>}
                {clientDetail.hasMore && <button className="biz-button secondary biz-history-more" disabled={loadingOlderDetail} onClick={loadOlderClientHistory}>{loadingOlderDetail ? 'Loading…' : 'Load older records'}<FiChevronRight /></button>}
                {showJobForm && <form className="biz-job-form" onSubmit={createJob}><Field label="Sticker product"><input required value={jobForm.product_name} onChange={event => setJobForm({ ...jobForm, product_name: event.target.value })} placeholder="Product / label name" /></Field><div className="biz-form-row two"><Field label="Quantity printed"><input required type="number" min="1" step="1" value={jobForm.quantity} onChange={event => setJobForm({ ...jobForm, quantity: event.target.value })} /></Field><Field label="Low-stock alert"><input required type="number" min="0" step="1" value={jobForm.threshold_qty} onChange={event => setJobForm({ ...jobForm, threshold_qty: event.target.value })} /></Field></div><Field label="Note (optional)"><input value={jobForm.note} onChange={event => setJobForm({ ...jobForm, note: event.target.value })} placeholder="Order or delivery note" /></Field><button className="biz-button primary" disabled={busy}>{busy ? 'Saving…' : 'Create print job'}<FiPlus /></button></form>}
                <div className="biz-admin-jobs">{jobs.filter(job => job.client_id === client.id).slice(0, 5).map(job => <div className="biz-admin-job" key={job.id}><div><strong>{job.product_name} · {quantity(job.quantity)}</strong><small>{dateTime(job.created_at)}{job.note ? ` · ${job.note}` : ''}</small></div><select aria-label={`Update ${job.product_name} status`} disabled={busy} value={job.status} onChange={event => updateJob(job, event.target.value)}><option value="printing">Printing</option><option value="ready">Ready</option><option value="waiting_pickup">Waiting for pickup</option><option value="delivered">Delivered</option></select></div>)}</div>
              </div>}
            </article>
          })}</div> : <div className="biz-admin-empty"><FiBriefcase /><strong>No client accounts yet</strong><span>Use the onboarding form above to create your first link.</span></div>}
        </section>
        <section className="biz-section biz-low-stock-section"><div className="biz-section-heading"><div><span className="biz-eyebrow">REPLENISHMENT WATCH</span><h2>Stock needing attention</h2></div><FiAlertTriangle /></div>
          {stocks.filter(stock => Number(stock.remaining_qty) <= Number(stock.threshold_qty)).length ? <div className="biz-low-stock-list">{stocks.filter(stock => Number(stock.remaining_qty) <= Number(stock.threshold_qty)).map(stock => <article key={stock.id}><div><strong>{stock.product_name}</strong><small>{clients.find(client => client.id === stock.client_id)?.business_name || 'Client'}</small></div><b>{quantity(stock.remaining_qty)} remaining</b><button onClick={() => { const client = clients.find(row => row.id === stock.client_id); setSelected(client); setShowJobForm(true); document.querySelector('.biz-onboard-section')?.scrollIntoView({ behavior: 'smooth' }) }}>Create job</button></article>)}</div> : <p className="biz-muted">No clients are currently below their sticker thresholds.</p>}
        </section>
        <footer className="biz-client-footer">Client sales and stock activity sync as soon as they are online. No SMS is sent.</footer>
      </div>
    </main>
  )
}

export default function BusinessSystemPage({ home = false }) {
  const { slug: routeSlug } = useParams()
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const isAdminRoute = window.location.pathname === '/business-admin'
  const slug = home ? localStorage.getItem('sb_business_last_slug') : routeSlug

  useEffect(() => {
    if (!isAdminRoute) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) { setSession(data.session); setAuthReady(true) }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [isAdminRoute])

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (home && !slug) return <Navigate to="/business-admin" replace />
  if (home && slug) return <Navigate to={`/business/${slug}`} replace />
  if (!isAdminRoute && !slug) return <Navigate to="/" replace />
  if (!isAdminRoute) return <ClientPortal key={slug} slug={slug} />
  if (!authReady) return <main className="biz-loading"><FiRefreshCw className="biz-spin" /><span>Checking staff access…</span></main>
  if (!session) return <AdminLogin onDone={setSession} />
  return <AdminBusinessSystem key={session.user.id} session={session} onSignOut={signOut} />
}