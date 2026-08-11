/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect, no-unused-vars, no-empty, no-dupe-keys */
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import logo from '@assets/SLEEKBLUE_LOGO_1779927359068.webp'
import { ALL_PRODUCTS } from '../data/products'

const DashboardView = lazy(() => import('./admin/Dashboard').then(m => ({ default: m.DashboardView })))
const PageEditorView = lazy(() => import('./admin/PageEditor').then(m => ({ default: m.PageEditorView })))
const ImageManager = lazy(() => import('./admin/ImageManager').then(m => ({ default: m.ImageManager })))
const ProductsView = lazy(() => import('./admin/ProductsList').then(m => ({ default: m.ProductsView })))
const StickerPricesView = lazy(() => import('./admin/StickerPrices').then(m => ({ default: m.StickerPricesView })))
const BlogView = lazy(() => import('./admin/BlogCMS'))
const AboutView = lazy(() => import('./admin/AboutUsEditor').then(m => ({ default: m.AboutView })))
const FaqView = lazy(() => import('./admin/FAQManager').then(m => ({ default: m.FaqView })))
const SeoView = lazy(() => import('./admin/SEOManager').then(m => ({ default: m.SeoView })))
const ContentView = lazy(() => import('./admin/ContentCMS').then(m => ({ default: m.ContentView })))
const SettingsView = lazy(() => import('./admin/SiteSettings').then(m => ({ default: m.SettingsView })))
const AcceptancesView = lazy(() => import('./admin/Acceptances').then(m => ({ default: m.AcceptancesView })))
const SecurityView = lazy(() => import('./admin/Security').then(m => ({ default: m.SecurityView })))
const AnalyticsView = lazy(() => import('../components/AdminAnalytics').then(m => ({ default: m.AnalyticsView })))
const ReportsView = lazy(() => import('../components/AdminAnalytics').then(m => ({ default: m.ReportsView })))
const LeadsView = lazy(() => import('./admin/WhatsAppLeads').then(m => ({ default: m.LeadsView })))
const PromoBannerView = lazy(() => import('./admin/PromoBanner').then(m => ({ default: m.PromoBannerView })))
const ActivityLogView = lazy(() => import('./admin/ActivityLog').then(m => ({ default: m.ActivityLogView })))
const SeoAgentView = lazy(() => import('./admin/SEOAgent').then(m => ({ default: m.SeoAgentView })))
const GrowthDashboardView = lazy(() => import('./admin/GrowthDashboard').then(m => ({ default: m.GrowthDashboardView })))
const NewsletterView = lazy(() => import('./admin/NewsletterManager').then(m => ({ default: m.NewsletterView })))
const CommentsView = lazy(() => import('./admin/CommentsModerator').then(m => ({ default: m.CommentsView })))
const ReviewsPendingView = lazy(() => import('./admin/ReviewsPending').then(m => ({ default: m.ReviewsPendingView })))
const ReferralsView = lazy(() => import('./admin/ReferralsManager').then(m => ({ default: m.ReferralsView })))

const Sidebar = lazy(() => import('./admin/Sidebar').then(m => ({ default: m.Sidebar })))
const LoginScreen = lazy(() => import('./admin/LoginScreen').then(m => ({ default: m.LoginScreen })))

const NAV_ITEMS = [
  { id: 'dashboard',       icon: '📊', label: 'Dashboard' },
  { id: 'page-editor',     icon: '🧩', label: 'Page Editor' },
  { id: 'image-manager',   icon: '🖼️', label: 'Image Manager' },
  { id: 'products',        icon: '🛍️', label: 'Products' },
  { id: 'sticker-prices',  icon: '🏷️', label: 'Sticker Prices' },
  { id: 'blog',            icon: '✍️', label: 'Blog' },
  { id: 'about',           icon: '📖', label: 'About Us' },
  { id: 'content',         icon: '🎨', label: 'Content CMS' },
  { id: 'faq',             icon: '❓', label: 'FAQ Manager' },
  { id: 'seo',             icon: '🔍', label: 'SEO Manager' },
  { id: 'settings',        icon: '⚙️', label: 'Site Settings' },
  { id: 'acceptances',     icon: '📋', label: 'T&C Acceptances' },
  { id: 'security',        icon: '🔑', label: 'Security' },
  { id: 'analytics',       icon: '📈', label: 'Analytics' },
  { id: 'reports',         icon: '💰', label: 'Reports' },
  { id: 'leads',           icon: '📲', label: 'WA Leads' },
  { id: 'promo-banner',    icon: '📣', label: 'Promo Banner' },
  { id: 'newsletter',      icon: '💌', label: 'Newsletter' },
  { id: 'reviews-pending', icon: '⭐', label: 'Pending Reviews' },
  { id: 'comments',        icon: '💬', label: 'Blog Comments' },
  { id: 'referrals',       icon: '🎁', label: 'Referrals' },
  { id: 'seo-agent',       icon: '🤖', label: 'SEO Agent' },
  { id: 'growth',          icon: '🚀', label: 'Growth & Ads' },
  { id: 'activity-log',    icon: '📜', label: 'Activity Log' },
]

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('sbm_admin_token') || '')
  const [view, setView] = useState('dashboard')
  const [siteData, setSiteData] = useState({ settings: {}, productOverrides: {}, stickerPriceOverrides: {}, acceptances: [], content: {}, blogPosts: [], heroSlides: 0, leads: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const hasLoadedOnce = useRef(false)

  const fetchAll = useCallback(async (tok = token) => {
    if (!tok) return
    if (hasLoadedOnce.current) setRefreshing(true)
    else setLoading(true)
    setFetchError(null)
    try {
      const [dataRes, accRes, contentRes, blogRes, heroRes, leadsRes] = await Promise.all([
        fetch('/api/admin/site-data', { headers: { Authorization: `Bearer ${tok}` } }),
        fetch('/api/admin/acceptances', { headers: { Authorization: `Bearer ${tok}` } }),
        fetch('/api/content'),
        fetch('/api/admin/blog', { headers: { Authorization: `Bearer ${tok}` } }),
        fetch('/api/hero'),
        fetch('/api/admin/leads', { headers: { Authorization: `Bearer ${tok}` } }),
      ])
      
      if (dataRes.status === 401 || accRes.status === 401) {
        setToken('')
        localStorage.removeItem('sbm_admin_token')
        return
      }

      const data = dataRes.ok ? await dataRes.json() : {}
      const acceptances = accRes.ok ? await accRes.json() : []
      const content = contentRes.ok ? await contentRes.json() : {}
      const blogPosts = blogRes.ok ? await blogRes.json() : []
      const heroData = heroRes.ok ? await heroRes.json() : {}
      const leads = leadsRes.ok ? await leadsRes.json() : []
      setSiteData({
        settings:             data.settings             || {},
        productOverrides:     data.productOverrides     || {},
        stickerPriceOverrides:data.stickerPriceOverrides || {},
        acceptances:          Array.isArray(acceptances) ? acceptances : [],
        content,
        blogPosts:            Array.isArray(blogPosts) ? blogPosts : [],
        heroSlides:           (heroData.customSlides || []).length,
        leads:                Array.isArray(leads) ? leads : [],
      })
      hasLoadedOnce.current = true
    } catch (err) {
      console.error('[Admin] fetchAll failed:', err)
      setFetchError('Failed to load admin data. Check your connection and try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { if (token) fetchAll(token) }, [token, fetchAll])

  function handleLogin(tok) {
    setToken(tok)
    localStorage.setItem('sbm_admin_token', tok)
  }
  function handleLogout() {
    setToken('')
    localStorage.removeItem('sbm_admin_token')
  }

  if (!token) {
    return (
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading login...</div>}>
        <LoginScreen onLogin={handleLogin} />
      </Suspense>
    )
  }

  const counts = {
    products: ALL_PRODUCTS.length,
    acceptances: siteData.acceptances.length,
    blogPosts: (siteData.blogPosts || []).length,
    leads: (siteData.leads || []).length,
  }

  const currentLabel = NAV_ITEMS.find(i => i.id === view)?.label || 'Dashboard'

  return (
    <div className="flex min-h-screen font-['HubotSans',sans-serif]">
      <Suspense fallback={<div className="w-[220px] h-screen bg-slate-900 animate-pulse" />}>
        <Sidebar
          view={view}
          setView={setView}
          counts={counts}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </Suspense>
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#8A88DA] shadow-md flex-shrink-0 sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-white p-2 rounded-xl hover:bg-white/15 transition"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <img src={logo} alt="Sleekblue" className="h-8 rounded-lg bg-white p-0.5" />
          <span className="flex-1 text-white font-semibold text-sm truncate">{currentLabel}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-white/80 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-white/15 transition"
          >Out</button>
        </header>
        <main className="flex-1 bg-slate-100 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {fetchError && (
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{fetchError}</span>
              <button type="button" onClick={() => fetchAll()} className="ml-4 font-semibold underline">Retry</button>
            </div>
          )}
          {refreshing && (
            <div className="mb-3 text-xs font-medium text-slate-400 animate-pulse">Refreshing data…</div>
          )}
          <Suspense fallback={<div className="text-center py-16 text-slate-500 animate-pulse">Loading module...</div>}>
            {view === 'dashboard'      && (loading ? <div className="text-center py-16 text-slate-500">Loading...</div> : <DashboardView siteData={siteData} />)}
            {view === 'page-editor'    && <PageEditorView token={token} />}
            {view === 'image-manager'  && <ImageManager token={token} />}
            {view === 'products'       && <ProductsView token={token} productOverrides={siteData.productOverrides} onDataChanged={fetchAll} />}
            {view === 'sticker-prices' && <StickerPricesView token={token} stickerPriceOverrides={siteData.stickerPriceOverrides} onDataChanged={fetchAll} />}
            {view === 'blog'           && <BlogView token={token} onDataChanged={fetchAll} />}
            {view === 'about'          && <AboutView token={token} />}
            {view === 'faq'            && <FaqView token={token} />}
            {view === 'seo'            && <SeoView token={token} />}
            {view === 'content'        && <ContentView token={token} content={siteData.content} settings={siteData.settings} onDataChanged={fetchAll} />}
            {view === 'settings'       && <SettingsView token={token} settings={siteData.settings} onDataChanged={fetchAll} />}
            {view === 'acceptances'    && <AcceptancesView acceptances={siteData.acceptances} />}
            {view === 'security'       && <SecurityView token={token} />}
            {view === 'analytics'      && <Suspense fallback={<div className="p-8 text-slate-400 text-sm">Loading analytics…</div>}><AnalyticsView token={token} /></Suspense>}
            {view === 'reports'        && <Suspense fallback={<div className="p-8 text-slate-400 text-sm">Loading reports…</div>}><ReportsView token={token} /></Suspense>}
            {view === 'leads'          && <LeadsView token={token} />}
            {view === 'promo-banner'   && <PromoBannerView token={token} />}
            {view === 'activity-log'   && <ActivityLogView token={token} />}
            {view === 'seo-agent'      && <SeoAgentView token={token} />}
            {view === 'growth'          && <GrowthDashboardView token={token} />}
            {view === 'newsletter'      && <NewsletterView token={token} />}
            {view === 'comments'        && <CommentsView token={token} />}
            {view === 'reviews-pending' && <ReviewsPendingView token={token} />}
            {view === 'referrals'       && <ReferralsView token={token} />}
          </Suspense>
        </main>
      </div>
    </div>
  )
}
