/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'

const PRI = '#7B2FBE'
const ACC = '#FF6B00'

const colorTextClass = {
  [PRI]: 'text-[#7B2FBE]',
  [ACC]: 'text-[#FF6B00]',
  '#2563eb': 'text-[#2563eb]',
  '#16a34a': 'text-[#16a34a]',
  '#ec4899': 'text-[#ec4899]',
  '#f59e0b': 'text-[#f59e0b]',
  '#92400e': 'text-[#92400e]',
}

const colorBgClass = {
  [PRI]: 'bg-[#7B2FBE]/20',
  [ACC]: 'bg-[#FF6B00]/20',
  '#2563eb': 'bg-[#2563eb]/20',
  '#16a34a': 'bg-[#16a34a]/20',
  '#ec4899': 'bg-[#ec4899]/20',
  '#f59e0b': 'bg-[#f59e0b]/20',
}

function getTextClass(color) {
  return colorTextClass[color] || 'text-slate-900'
}

function getBgClass(color) {
  return colorBgClass[color] || 'bg-slate-200'
}

function Card({ children, className = '' }) {
  return <div className={`rounded-2xl bg-white p-5 shadow-sm ${className}`}>{children}</div>
}

function Stat({ label, value, icon, color, sub }) {
  const textClass = getTextClass(color || PRI)
  const bgClass = getBgClass(color || PRI)

  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl flex-shrink-0 ${bgClass} ${textClass}`}>
        {icon}
      </div>
      <div>
        <p className={`text-3xl font-extrabold leading-none ${textClass}`}>{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
      </div>
    </Card>
  )
}

function TabBar({ tabs, active, setActive }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActive(tab.id)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            active === tab.id
              ? 'bg-[#7B2FBE] text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function BarChart({ data, color, max, label }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]).slice(0, 12)
  const maxVal = max || Math.max(...entries.map(([, value]) => value), 1)
  const fillClass = getBgClass(color || PRI).replace('/20', '')

  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">No data yet.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="min-w-[140px] text-xs text-slate-600 truncate">{key}</span>
          <div className="flex-1 overflow-hidden rounded-full bg-slate-200 h-2">
            <div className={`h-full rounded-full ${fillClass}`} style={{ width: `${(value / maxVal) * 100}%` }} />
          </div>
          <span className={`w-10 text-right text-xs font-semibold ${getTextClass(color || PRI)}`}>{value}</span>
          {label && <span className="text-[11px] text-slate-400">{label}</span>}
        </div>
      ))}
    </div>
  )
}

function HourChart({ hourMap }) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const maxVal = Math.max(...hours.map((hour) => hourMap[hour] || 0), 1)

  return (
    <div className="space-y-3">
      <div className="flex gap-1 items-end h-20">
        {hours.map((hour) => {
          const height = ((hourMap[hour] || 0) / maxVal) * 68
          return (
            <div key={hour} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-md ${hourMap[hour] ? 'bg-[#7B2FBE]' : 'bg-slate-200'}`}
                style={{ height: `${Math.max(height, hourMap[hour] ? 4 : 0)}px` }}
              />
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-7 gap-2 text-[10px] text-slate-400">
        {[0, 4, 8, 12, 16, 20, 23].map((hour) => (
          <span key={hour} className="text-center">
            {hour === 0 ? '12am' : hour === 12 ? '12pm' : hour < 12 ? `${hour}am` : `${hour - 12}pm`}
          </span>
        ))}
      </div>
    </div>
  )
}

function useAnalyticsData(token) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed')
      setData(await res.json())
      setError(null)
    } catch {
      setError('Could not load analytics.')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (token) load()
  }, [token])

  return { data, loading, error, reload: load }
}

function OverviewTab({ data }) {
  const topPage = Object.entries(data.pageViews || {}).sort((a, b) => b[1] - a[1])[0]
  const topCountry = Object.entries(data.locationMap || {}).sort((a, b) => b[1] - a[1])[0]
  const recentEvents = (data.recentEvents || []).slice(0, 20)

  const pageViewData = Object.fromEntries(
    Object.entries(data.pageViews || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
  )
  const dailyData = Object.entries(data.dailyMap || {}).sort((a, b) => a[0].localeCompare(b[0])).slice(-14)

  function eventBorderClass(type) {
    if (type === 'cart_add') return 'border-[#FF6B00]'
    if (type === 'product_view') return 'border-[#2563eb]'
    return 'border-[#7B2FBE]'
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Total Page Views" value={(data.totalPageViews || 0).toLocaleString()} icon="👁️" color={PRI} />
        <Stat label="Unique Visitors" value={(data.uniqueVisitors || 0).toLocaleString()} icon="👥" color="#2563eb" />
        <Stat label="Total Events" value={(data.totalEvents || 0).toLocaleString()} icon="📊" color="#16a34a" />
        <Stat label="Most Popular Page" value={topPage ? topPage[0] : '—'} icon="🔥" color={ACC} sub={topPage ? `${topPage[1]} views` : ''} />
        <Stat label="Top Country" value={topCountry ? topCountry[0].split(',').pop().trim() : '—'} icon="🌍" color="#ec4899" sub={topCountry ? `${topCountry[1]} visits` : ''} />
        <Stat label="Cart Additions" value={Object.values(data.cartAdds || {}).reduce((sum, item) => sum + item.count, 0)} icon="🛒" color="#f59e0b" />
      </div>

      {dailyData.length > 1 && (
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">📈 Daily Traffic (Last 14 Days)</h3>
          <div className="flex gap-1 items-end h-20">
            {dailyData.map(([day, count]) => {
              const maxD = Math.max(...dailyData.map(([, value]) => value), 1)
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-[#7B2FBE]" style={{ height: `${Math.max((count / maxD) * 70, 3)}px` }} />
                  <span className="text-[9px] text-slate-400">{day.slice(5)}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">📄 Page Views Breakdown</h3>
          <BarChart data={pageViewData} color={PRI} />
        </Card>
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">🕐 Recent Activity</h3>
          <div className="flex flex-col gap-3">
            {recentEvents.length > 0 ? (
              recentEvents.map((event, index) => (
                <div key={index} className={`flex items-center gap-3 rounded-2xl border-l-4 bg-slate-50 px-3 py-2 ${eventBorderClass(event.type)}`}>
                  <span className="text-base">
                    {event.type === 'cart_add' ? '🛒' : event.type === 'product_view' ? '👁️' : event.type === 'quote_request' ? '📋' : '📄'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-slate-900">
                      {event.type === 'cart_add'
                        ? `Cart: ${event.name || event.slug}`
                        : event.type === 'product_view'
                        ? `Viewed: ${event.name || event.slug}`
                        : event.page || '/'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {event.location?.city ? `${event.location.city}, ${event.location.country}` : event.location?.country || 'Unknown'} · {event.device || '—'}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No activity yet. Install the analytics tracker on your website.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function LocationTab({ data }) {
  const locationEntries = Object.entries(data.locationMap || {}).sort((a, b) => b[1] - a[1])
  const countryMap = {}
  locationEntries.forEach(([key, count]) => {
    const country = key.includes(',') ? key.split(',').pop().trim() : key
    countryMap[country] = (countryMap[country] || 0) + count
  })
  const topCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const topCities = locationEntries.slice(0, 6)
  const totalVisitors = Object.values(data.locationMap || {}).reduce((sum, n) => sum + n, 0) || 1

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">🌍 Top Countries</h3>
          {topCountries.length === 0 ? (
            <p className="text-sm text-slate-400">No country data available yet.</p>
          ) : (
            <ul className="space-y-3">
              {topCountries.map(([country, count]) => (
                <li key={country} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                  <span className="truncate text-sm font-medium text-slate-900">{country}</span>
                  <span className="text-xs font-semibold text-slate-500">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">📍 Top Cities</h3>
          {topCities.length === 0 ? (
            <p className="text-sm text-slate-400">No city data available yet.</p>
          ) : (
            <ul className="space-y-3">
              {topCities.map(([location, count]) => (
                <li key={location} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                  <span className="truncate text-sm font-medium text-slate-900">{location}</span>
                  <span className="text-xs font-semibold text-slate-500">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">📋 All Visitor Locations</h3>
        {locationEntries.length === 0 ? (
          <p className="text-sm text-slate-400">No location data yet. IP geolocation runs in the background as visitors arrive.</p>
        ) : (
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Visits</th>
                <th className="px-3 py-3">Share</th>
              </tr>
            </thead>
            <tbody>
              {locationEntries.map(([location, count], index) => (
                <tr key={location} className={index % 2 === 0 ? 'bg-slate-50' : ''}>
                  <td className="px-3 py-3 font-medium text-slate-900">📍 {location}</td>
                  <td className="px-3 py-3 text-slate-700">{count}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-[#7B2FBE]" style={{ width: `${(count / totalVisitors) * 100}%` }} />
                      </div>
                      <span className="text-[11px] text-slate-500">{((count / totalVisitors) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

function BehaviorTab({ data }) {
  const deviceMap = data.deviceMap || {}
  const totalDevices = Object.values(deviceMap).reduce((sum, value) => sum + value, 0)
  const referrers = Object.entries(data.referrerMap || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)

  const peakHour = Object.entries(data.hourMap || {}).sort((a, b) => b[1] - a[1])[0]
  const peakHourLabel = peakHour ? (parseInt(peakHour[0], 10) < 12 ? `${peakHour[0]}am` : `${parseInt(peakHour[0], 10) - 12 || 12}pm`) : '—'

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(deviceMap).map(([device, count]) => (
          <Card key={device} className="text-center">
            <div className="text-3xl mb-2">{device === 'mobile' ? '📱' : device === 'tablet' ? '📲' : '💻'}</div>
            <p className="text-2xl font-extrabold text-[#7B2FBE]">{count}</p>
            <p className="text-xs text-slate-500 capitalize mt-1">{device}</p>
            <p className="text-[11px] text-slate-400 mt-1">{totalDevices ? `${((count / totalDevices) * 100).toFixed(0)}% of visits` : '0% of visits'}</p>
          </Card>
        ))}
        <Stat label="Peak Traffic Hour" value={peakHourLabel} icon="⏰" color="#f59e0b" sub={peakHour ? `${peakHour[1]} visits` : ''} />
      </div>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-900">🕐 Traffic by Hour of Day</h3>
        <HourChart hourMap={data.hourMap || {}} />
        <p className="mt-3 text-sm text-slate-500">Shows when your visitors are most active throughout the day.</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">🔗 Traffic Sources (Referrers)</h3>
          {referrers.length > 0 ? (
            <BarChart data={Object.fromEntries(referrers)} color="#2563eb" />
          ) : (
            <p className="text-sm text-slate-500">Most traffic is direct (no referrer) — visitors are typing your URL directly or using bookmarks.</p>
          )}
        </Card>
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">💡 Behavioral Insights</h3>
          <div className="flex flex-col gap-3">
            {[
              { icon: '📱', label: 'Mobile-first', value: deviceMap.mobile > (deviceMap.desktop || 0) ? 'Yes — most visitors use mobile' : 'No — mostly desktop visitors' },
              { icon: '🌙', label: 'Night traffic', value: ((data.hourMap?.[22] || 0) + (data.hourMap?.[23] || 0) + (data.hourMap?.[0] || 0)) > 0 ? 'Active at night' : 'Mostly daytime traffic' },
              { icon: '🌍', label: 'Nigeria-focused', value: Object.keys(data.locationMap || {}).some((key) => key.includes('Nigeria')) ? '✓ Nigerian visitors detected' : 'International traffic mix' },
              { icon: '🛒', label: 'Cart intent', value: `${Object.values(data.cartAdds || {}).reduce((sum, item) => sum + item.count, 0)} cart additions tracked` },
            ].map((item, index) => (
              <div key={index} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-[12px] font-semibold text-slate-900">{item.label}</p>
                  <p className="text-[12px] text-slate-500">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function SecurityLogTab({ data, token, reload }) {
  const [clearing, setClearing] = useState(false)
  const events = data.securityEvents || []

  async function clearAnalytics() {
    if (!confirm('Clear ALL analytics data? This cannot be undone.')) return
    setClearing(true)
    await fetch('/api/admin/analytics/clear', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setClearing(false)
    reload()
  }

  const securityHeaders = [
    { name: 'X-Frame-Options', status: '✓', desc: 'Prevents clickjacking attacks' },
    { name: 'X-XSS-Protection', status: '✓', desc: 'Browser XSS filter enabled' },
    { name: 'X-Content-Type-Options', status: '✓', desc: 'Prevents MIME-type sniffing' },
    { name: 'Referrer-Policy', status: '✓', desc: 'Controls referrer information' },
    { name: 'Rate Limiting (API)', status: '✓', desc: '500 req / 15 min per IP' },
    { name: 'Rate Limiting (Login)', status: '✓', desc: '10 attempts / 15 min per IP' },
    { name: 'Input Sanitization', status: '✓', desc: 'XSS characters stripped from inputs' },
    { name: 'JWT Authentication', status: '✓', desc: '8-hour token expiry on all admin routes' },
    { name: 'HTTPS (TLS)', status: '✓', desc: 'End-to-end encryption via Replit deployment' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-emerald-800">🛡️ Active Security Protections</h3>
          <div className="flex flex-col gap-3">
            {securityHeaders.map((header, index) => (
              <div key={index} className="flex gap-3 items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                <span className="text-emerald-700 font-semibold">{header.status}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{header.name}</p>
                  <p className="text-xs text-slate-500">{header.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-rose-700">⚠️ Security Events ({events.length})</h3>
          {events.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-center">
              <p className="text-4xl">✅</p>
              <p className="mt-2 text-sm font-semibold text-emerald-700">No security events detected</p>
              <p className="text-sm text-slate-500">Your website is clean. Rate limiting and security headers are active.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
              {events.slice(0, 50).map((event, index) => (
                <div key={index} className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-rose-700">
                      {event.type === 'rate_limit'
                        ? '🚫 Rate Limited'
                        : event.type === 'login_brute_force'
                        ? '🔐 Login Brute Force'
                        : event.type === 'invalid_token'
                        ? '🔑 Invalid Token'
                        : `⚠️ ${event.type}`}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 font-mono">IP: {event.ip} · {event.path}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="bg-amber-50 border border-amber-200">
        <h3 className="mb-3 text-sm font-semibold text-amber-900">⚠️ Data Management</h3>
        <p className="text-sm text-amber-900 leading-6">
          Analytics data is stored locally in <code>analytics-data.json</code>. Clear it periodically to free up space. The current dataset has <strong>{data.totalEvents || 0}</strong> events.
        </p>
        <button
          onClick={clearAnalytics}
          disabled={clearing}
          className={`mt-4 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
            clearing ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'
          }`}>
          {clearing ? 'Clearing…' : '🗑️ Clear All Analytics Data'}
        </button>
      </Card>
    </div>
  )
}

export function AnalyticsView({ token }) {
  const [tab, setTab] = useState('overview')
  const { data, loading, error, reload } = useAnalyticsData(token)
  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'location', label: '🌍 Locations' },
    { id: 'behavior', label: '🧠 Behavior' },
    { id: 'security', label: '🛡️ Security' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">📈 Analytics</h2>
          <p className="text-sm text-slate-500">Visitor tracking, impressions, interactions and geographic data.</p>
        </div>
        <button
          onClick={reload}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          🔄 Refresh
        </button>
      </div>

      <TabBar tabs={tabs} active={tab} setActive={setTab} />

      {loading && <div className="rounded-2xl bg-slate-50 p-12 text-center text-slate-500">Loading analytics…</div>}
      {error && <div className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700">{error}</div>}
      {data && !loading && (
        <>
          {tab === 'overview' && <OverviewTab data={data} />}
          {tab === 'location' && <LocationTab data={data} />}
          {tab === 'behavior' && <BehaviorTab data={data} />}
          {tab === 'security' && <SecurityLogTab data={data} token={token} reload={reload} />}
        </>
      )}
    </div>
  )
}

function getBadgeClasses(value) {
  if (value > 50) return 'rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700'
  if (value > 5) return 'rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700'
  return 'rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600'
}

export function ReportsView({ token }) {
  const [tab, setTab] = useState('financial')
  const { data, loading, error } = useAnalyticsData(token)
  const tabs = [
    { id: 'financial', label: '💰 Financial Report' },
    { id: 'products', label: '🛍️ Product Interest' },
    { id: 'customers', label: '👥 Customer Patterns' },
  ]

  const cartAdds = Object.entries(data?.cartAdds || {}).sort((a, b) => b[1].count - a[1].count)
  const productViews = Object.entries(data?.productViews || {}).sort((a, b) => b[1].count - a[1].count)
  const quoteRequests = data?.quoteRequests || []
  const totalCartAdds = cartAdds.reduce((sum, [, item]) => sum + item.count, 0)
  const totalProductViews = productViews.reduce((sum, [, item]) => sum + item.count, 0)

  if (loading) {
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-extrabold text-slate-900">💰 Reports</h2>
        <div className="rounded-2xl bg-slate-50 p-12 text-center text-slate-500">Loading reports…</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-extrabold text-slate-900">💰 Reports</h2>
        <Card>
          <p className="text-sm text-slate-500">Could not load report data. Make sure analytics tracking is running.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">💰 Reports</h2>
        <p className="text-sm text-slate-500">Financial insights, product interest, and customer behavioral patterns.</p>
      </div>

      <TabBar tabs={tabs} active={tab} setActive={setTab} />

      {tab === 'financial' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Products Cart-Added" value={totalCartAdds} icon="🛒" color={ACC} sub="Total cart additions" />
            <Stat label="Product Page Views" value={totalProductViews} icon="👁️" color={PRI} sub="Product interest signals" />
            <Stat label="Quote Requests" value={quoteRequests.length} icon="📋" color="#16a34a" sub="Direct quote signals" />
            <Stat label="Top Product" value={cartAdds[0]?.[1]?.name || productViews[0]?.[1]?.name || '—'} icon="🏆" color="#f59e0b" sub={cartAdds[0] ? `${cartAdds[0][1].count} cart adds` : ''} />
          </div>

          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-900">💼 Financial Report — Product Interest Summary</h3>
            <p className="text-sm text-slate-500 mb-4">Real paid orders and revenue are under Admin → Orders. This report shows browsing interest (cart adds, product views, quotes) so you can see demand before checkout.</p>
            {cartAdds.length === 0 ? (
              <p className="text-sm text-slate-500">No cart data yet. Analytics tracking will capture cart additions as customers browse.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead className="bg-slate-100 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      {['#', 'Product', 'Cart Additions', 'Total Qty', 'Interest Score'].map((header) => (
                        <th key={header} className="px-3 py-3 font-semibold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cartAdds.map(([slug, item], index) => {
                      const interestScore = Math.min(100, Math.round((item.count / Math.max(totalCartAdds, 1)) * 100 + (item.qty / Math.max(item.count, 1)) * 5))
                      return (
                        <tr key={slug} className={index % 2 === 0 ? 'bg-slate-50' : ''}>
                          <td className={`px-3 py-3 font-semibold ${index < 3 ? 'text-[#FF6B00]' : 'text-slate-600'}`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-900">{item.name}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                                <div className="h-full rounded-full bg-[#FF6B00]" style={{ width: `${(item.count / (cartAdds[0]?.[1]?.count || 1)) * 100}%` }} />
                              </div>
                              <span className="font-semibold text-[#FF6B00]">{item.count}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-700">{item.qty}</td>
                          <td className="px-3 py-3">
                            <span className={getBadgeClasses(interestScore)}>{interestScore}%</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {quoteRequests.length > 0 && (
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-slate-900">📋 Quote Requests</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead className="bg-slate-100 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      {['Product', 'Location', 'Device', 'Date'].map((header) => (
                        <th key={header} className="px-3 py-3 font-semibold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quoteRequests.slice(0, 50).map((quote, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-slate-50' : ''}>
                        <td className="px-3 py-3 font-semibold">{quote.slug || '—'}</td>
                        <td className="px-3 py-3 text-slate-700">{quote.location?.city ? `${quote.location.city}, ${quote.location.country}` : quote.location?.country || '—'}</td>
                        <td className="px-3 py-3 text-slate-500 capitalize">{quote.device || '—'}</td>
                        <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{new Date(quote.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-slate-900">🛒 Most Cart-Added Products</h3>
              <p className="text-sm text-slate-500 mb-4">Products customers added to their cart most often.</p>
              <BarChart data={Object.fromEntries(cartAdds.map(([, item]) => [item.name || 'Unknown', item.count]))} color={ACC} label="adds" />
            </Card>
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-slate-900">👁️ Most Viewed Products</h3>
              <p className="text-sm text-slate-500 mb-4">Products with the most page view impressions.</p>
              <BarChart data={Object.fromEntries(productViews.map(([, item]) => [item.name || 'Unknown', item.count]))} color={PRI} label="views" />
            </Card>
          </div>

          {productViews.length > 0 && (
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-slate-900">📊 Product Conversion Signals</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead className="bg-slate-100 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      {['Product', 'Views', 'Cart Adds', 'View→Cart Rate'].map((header) => (
                        <th key={header} className="px-3 py-3 font-semibold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productViews.map(([slug, product], index) => {
                      const cartData = data.cartAdds?.[slug]
                      const cartCount = cartData?.count || 0
                      const rate = product.count > 0 ? ((cartCount / product.count) * 100).toFixed(1) : '0.0'
                      return (
                        <tr key={slug} className={index % 2 === 0 ? 'bg-slate-50' : ''}>
                          <td className="px-3 py-3 font-semibold">{product.name}</td>
                          <td className="px-3 py-3 font-semibold text-[#7B2FBE]">{product.count}</td>
                          <td className="px-3 py-3 font-semibold text-[#FF6B00]">{cartCount}</td>
                          <td className="px-3 py-3">
                            <span className={getBadgeClasses(parseFloat(rate))}>{rate}%</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'customers' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Unique Visitors" value={data.uniqueVisitors || 0} icon="👥" color={PRI} />
            <Stat label="Avg Pages/Visit" value={data.uniqueVisitors ? ((data.totalPageViews || 0) / data.uniqueVisitors).toFixed(1) : '—'} icon="📄" color="#2563eb" />
            <Stat label="Mobile Users" value={`${data.deviceMap?.mobile || 0}`} icon="📱" color="#ec4899" sub={`of ${data.totalEvents || 0} events`} />
            <Stat label="International" value={Object.keys(data.locationMap || {}).filter((key) => !key.includes('Nigeria')).length} icon="✈️" color="#f59e0b" sub="non-Nigerian locations" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-slate-900">📊 Customer Journey Patterns</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Browse → Product', icon: '🔍→🛍️', val: productViews.length, note: 'Unique products viewed' },
                  { label: 'Product → Cart', icon: '🛍️→🛒', val: totalCartAdds, note: 'Cart additions (purchase intent)' },
                  { label: 'Cart → Quote', icon: '🛒→📋', val: quoteRequests.length, note: 'Quote requests submitted' },
                  { label: 'Most visited page', icon: '🔥', val: Object.entries(data.pageViews || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || '—', note: 'Top landing destination' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-slate-900 truncate">{item.label}</p>
                      <p className="text-[11px] text-slate-500">{item.note}</p>
                    </div>
                    <span className="text-base font-extrabold text-[#7B2FBE]">{item.val}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-slate-900">🗺️ Where Customers Are</h3>
              <BarChart
                data={(() => {
                  const countryMap = {}
                  Object.entries(data.locationMap || {}).forEach(([key, count]) => {
                    const country = key.includes(',') ? key.split(',').pop().trim() : key
                    countryMap[country] = (countryMap[country] || 0) + count
                  })
                  return countryMap
                })()}
                color="#2563eb"
              />
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
