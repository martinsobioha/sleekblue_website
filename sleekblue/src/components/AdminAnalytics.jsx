import { useState, useEffect } from 'react'

const PRI = '#7B2FBE'
const PRI_LIGHT = '#f0e8ff'
const ACC = '#FF6B00'

function Card({ children, style }) {
  return <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', ...style }}>{children}</div>
}
function Stat({ label, value, icon, color, sub }) {
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: (color || PRI) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontSize: '26px', fontWeight: 800, color: color || PRI, margin: 0, fontFamily: "'HubotSans',sans-serif" }}>{value}</p>
        <p style={{ fontSize: '12px', color: '#888', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>{label}</p>
        {sub && <p style={{ fontSize: '11px', color: '#bbb', margin: '2px 0 0', fontFamily: "'HubotSans',sans-serif" }}>{sub}</p>}
      </div>
    </Card>
  )
}
function TabBar({ tabs, active, setActive }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActive(t.id)}
          style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: active === t.id ? PRI : '#fff', color: active === t.id ? '#fff' : '#555', fontWeight: active === t.id ? 700 : 500, fontSize: '13px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', fontFamily: "'HubotSans',sans-serif", transition: 'all 0.15s' }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}
function BarChart({ data, color, max, label }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]).slice(0, 12)
  const maxVal = max || Math.max(...entries.map(e => e[1]), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {entries.map(([key, val]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#555', fontFamily: "'HubotSans',sans-serif", width: '180px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{key}</span>
          <div style={{ flex: 1, background: '#f0f0f0', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${(val / maxVal) * 100}%`, height: '100%', background: color || PRI, borderRadius: '4px', transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: color || PRI, fontFamily: "'HubotSans',sans-serif", width: '36px', textAlign: 'right' }}>{val}</span>
          {label && <span style={{ fontSize: '11px', color: '#aaa', fontFamily: "'HubotSans',sans-serif" }}>{label}</span>}
        </div>
      ))}
      {entries.length === 0 && <p style={{ color: '#bbb', fontSize: '13px', fontFamily: "'HubotSans',sans-serif" }}>No data yet.</p>}
    </div>
  )
}
function HourChart({ hourMap }) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const maxVal = Math.max(...hours.map(h => hourMap[h] || 0), 1)
  return (
    <div>
      <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '80px' }}>
        {hours.map(h => (
          <div key={h} title={`${h}:00 — ${hourMap[h] || 0} visits`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ width: '100%', background: hourMap[h] ? PRI : '#eee', borderRadius: '3px 3px 0 0', height: `${((hourMap[h] || 0) / maxVal) * 68}px`, minHeight: hourMap[h] ? '4px' : '0', transition: 'height 0.4s' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
        {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
          <span key={h} style={{ fontSize: '9px', color: '#bbb', fontFamily: 'monospace', marginLeft: `${(h / 24) * 100}%`, position: h === 0 ? 'relative' : 'absolute' }}>
            {h === 0 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        {[0, 4, 8, 12, 16, 20, 23].map(h => (
          <span key={h} style={{ fontSize: '9px', color: '#bbb', fontFamily: 'monospace' }}>
            {h === 0 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`}
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
    } catch (e) {
      setError('Could not load analytics.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [token])
  return { data, loading, error, reload: load }
}

// ─── Analytics Overview Tab ──────────────────────────────────────────────────
function OverviewTab({ data }) {
  const topPage = Object.entries(data.pageViews || {}).sort((a, b) => b[1] - a[1])[0]
  const topCountry = Object.entries(data.locationMap || {}).sort((a, b) => b[1] - a[1])[0]
  const recentEvents = (data.recentEvents || []).slice(0, 20)

  const pageViewData = Object.fromEntries(
    Object.entries(data.pageViews || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
  )

  const dailyData = Object.entries(data.dailyMap || {}).sort((a, b) => a[0].localeCompare(b[0])).slice(-14)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Stat label="Total Page Views" value={(data.totalPageViews || 0).toLocaleString()} icon="👁️" color={PRI} />
        <Stat label="Unique Visitors" value={(data.uniqueVisitors || 0).toLocaleString()} icon="👥" color="#2563eb" />
        <Stat label="Total Events" value={(data.totalEvents || 0).toLocaleString()} icon="📊" color="#16a34a" />
        <Stat label="Most Popular Page" value={topPage ? topPage[0] : '—'} icon="🔥" color={ACC} sub={topPage ? `${topPage[1]} views` : ''} />
        <Stat label="Top Country" value={topCountry ? topCountry[0].split(',').pop().trim() : '—'} icon="🌍" color="#ec4899" sub={topCountry ? `${topCountry[1]} visits` : ''} />
        <Stat label="Cart Additions" value={Object.values(data.cartAdds || {}).reduce((s, v) => s + v.count, 0)} icon="🛒" color="#f59e0b" />
      </div>

      {/* Daily Trend */}
      {dailyData.length > 1 && (
        <Card style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>📈 Daily Traffic (Last 14 Days)</h3>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '80px' }}>
            {dailyData.map(([day, count]) => {
              const maxD = Math.max(...dailyData.map(d => d[1]), 1)
              return (
                <div key={day} title={`${day}: ${count} views`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  <div style={{ width: '100%', background: PRI, borderRadius: '3px 3px 0 0', height: `${(count / maxD) * 70}px`, minHeight: '3px', transition: 'height 0.4s' }} />
                  <span style={{ fontSize: '8px', color: '#bbb', fontFamily: 'monospace', transform: 'rotate(-45deg)', whiteSpace: 'nowrap', marginTop: '2px' }}>{day.slice(5)}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>📄 Page Views Breakdown</h3>
          <BarChart data={pageViewData} color={PRI} />
        </Card>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>🕐 Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recentEvents.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: '#fafafa', borderRadius: '6px', borderLeft: `3px solid ${e.type === 'cart_add' ? ACC : e.type === 'product_view' ? '#2563eb' : PRI}` }}>
                <span style={{ fontSize: '13px' }}>{e.type === 'cart_add' ? '🛒' : e.type === 'product_view' ? '👁️' : e.type === 'quote_request' ? '📋' : '📄'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#333', fontFamily: "'HubotSans',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.type === 'cart_add' ? `Cart: ${e.name || e.slug}` : e.type === 'product_view' ? `Viewed: ${e.name || e.slug}` : e.page || '/'}
                  </p>
                  <p style={{ margin: 0, fontSize: '10px', color: '#bbb', fontFamily: 'monospace' }}>
                    {e.location?.city ? `${e.location.city}, ${e.location.country}` : e.location?.country || 'Unknown'} · {e.device || '—'}
                  </p>
                </div>
                <span style={{ fontSize: '10px', color: '#ccc', fontFamily: 'monospace', flexShrink: 0 }}>{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
            {recentEvents.length === 0 && <p style={{ color: '#bbb', fontSize: '13px', fontFamily: "'HubotSans',sans-serif" }}>No activity yet. Install the analytics tracker on your website.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Location Tab ─────────────────────────────────────────────────────────────
function LocationTab({ data }) {
  const locationEntries = Object.entries(data.locationMap || {}).sort((a, b) => b[1] - a[1])
  const countryMap = {}
  locationEntries.forEach(([key, count]) => {
    const country = key.includes(',') ? key.split(',').pop().trim() : key
    countryMap[country] = (countryMap[country] || 0) + count
  })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>🌍 Top Countries</h3>
          <BarChart data={countryMap} color="#2563eb" />
        </Card>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>📍 Top Cities</h3>
          <BarChart data={Object.fromEntries(locationEntries.slice(0, 12))} color="#ec4899" />
        </Card>
      </div>

      <Card style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>📋 All Visitor Locations</h3>
        {locationEntries.length === 0 ? (
          <p style={{ color: '#bbb', fontSize: '13px', fontFamily: "'HubotSans',sans-serif" }}>No location data yet. IP geolocation runs in the background as visitors arrive.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#f8f8f8' }}>
                  {['Location', 'Visits', 'Share'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#555', fontFamily: "'HubotSans',sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {locationEntries.map(([loc, count], i) => {
                  const total = locationEntries.reduce((s, [, v]) => s + v, 0)
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600, fontFamily: "'HubotSans',sans-serif" }}>📍 {loc}</td>
                      <td style={{ padding: '9px 12px', color: PRI, fontWeight: 700 }}>{count}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '80px', background: '#f0f0f0', borderRadius: '4px', height: '8px' }}>
                            <div style={{ width: `${(count / total) * 100}%`, height: '100%', background: PRI, borderRadius: '4px' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#888' }}>{((count / total) * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Behavior Tab ─────────────────────────────────────────────────────────────
function BehaviorTab({ data }) {
  const deviceMap = data.deviceMap || {}
  const totalDevices = Object.values(deviceMap).reduce((s, v) => s + v, 0)
  const referrers = Object.entries(data.referrerMap || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)

  const peakHour = Object.entries(data.hourMap || {}).sort((a, b) => b[1] - a[1])[0]
  const peakHourLabel = peakHour ? (parseInt(peakHour[0]) < 12 ? `${peakHour[0]}am` : `${parseInt(peakHour[0]) - 12 || 12}pm`) : '—'

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {Object.entries(deviceMap).map(([device, count]) => (
          <Card key={device} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              {device === 'mobile' ? '📱' : device === 'tablet' ? '📲' : '💻'}
            </div>
            <p style={{ fontSize: '22px', fontWeight: 800, color: PRI, margin: 0, fontFamily: "'HubotSans',sans-serif" }}>{count}</p>
            <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0', fontFamily: "'HubotSans',sans-serif", textTransform: 'capitalize' }}>{device}</p>
            <p style={{ fontSize: '11px', color: '#bbb', margin: '2px 0 0', fontFamily: "'HubotSans',sans-serif" }}>{totalDevices ? ((count / totalDevices) * 100).toFixed(0) : 0}% of visits</p>
          </Card>
        ))}
        <Stat label="Peak Traffic Hour" value={peakHourLabel} icon="⏰" color="#f59e0b" sub={peakHour ? `${peakHour[1]} visits` : ''} />
      </div>

      <Card style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>🕐 Traffic by Hour of Day</h3>
        <HourChart hourMap={data.hourMap || {}} />
        <p style={{ fontSize: '11px', color: '#bbb', marginTop: '8px', fontFamily: "'HubotSans',sans-serif" }}>Shows when your visitors are most active throughout the day.</p>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>🔗 Traffic Sources (Referrers)</h3>
          {referrers.length > 0 ? (
            <BarChart data={Object.fromEntries(referrers)} color="#2563eb" />
          ) : (
            <p style={{ color: '#bbb', fontSize: '13px', fontFamily: "'HubotSans',sans-serif" }}>Most traffic is direct (no referrer) — visitors are typing your URL directly or using bookmarks.</p>
          )}
        </Card>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>💡 Behavioral Insights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { icon: '📱', label: 'Mobile-first', value: deviceMap.mobile > (deviceMap.desktop || 0) ? 'Yes — most visitors use mobile' : 'No — mostly desktop visitors' },
              { icon: '🌙', label: 'Night traffic', value: ((data.hourMap?.[22] || 0) + (data.hourMap?.[23] || 0) + (data.hourMap?.[0] || 0)) > 0 ? 'Active at night' : 'Mostly daytime traffic' },
              { icon: '🌍', label: 'Nigeria-focused', value: Object.keys(data.locationMap || {}).some(k => k.includes('Nigeria')) ? '✓ Nigerian visitors detected' : 'International traffic mix' },
              { icon: '🛒', label: 'Cart intent', value: `${Object.values(data.cartAdds || {}).reduce((s, v) => s + v.count, 0)} cart additions tracked` },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px', background: '#fafafa', borderRadius: '8px' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#333', fontFamily: "'HubotSans',sans-serif" }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666', fontFamily: "'HubotSans',sans-serif" }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Security Log Tab ─────────────────────────────────────────────────────────
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
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>🛡️ Active Security Protections</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {securityHeaders.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 10px', background: '#f0fdf4', borderRadius: '7px', border: '1px solid #bbf7d0' }}>
                <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>{h.status}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#333', fontFamily: "'HubotSans',sans-serif" }}>{h.name}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#888', fontFamily: "'HubotSans',sans-serif" }}>{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>⚠️ Security Events ({events.length})</h3>
          {events.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>✅</p>
              <p style={{ fontSize: '13px', color: '#16a34a', fontFamily: "'HubotSans',sans-serif", fontWeight: 700 }}>No security events detected</p>
              <p style={{ fontSize: '12px', color: '#888', fontFamily: "'HubotSans',sans-serif" }}>Your website is clean. Rate limiting and security headers are active.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto' }}>
              {events.slice(0, 50).map((e, i) => (
                <div key={i} style={{ padding: '8px 10px', background: '#fef2f2', borderRadius: '7px', border: '1px solid #fecaca' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#dc2626', fontFamily: "'HubotSans',sans-serif' " }}>
                      {e.type === 'rate_limit' ? '🚫 Rate Limited' : e.type === 'login_brute_force' ? '🔐 Login Brute Force' : e.type === 'invalid_token' ? '🔑 Invalid Token' : `⚠️ ${e.type}`}
                    </p>
                    <span style={{ fontSize: '10px', color: '#bbb', fontFamily: 'monospace' }}>{new Date(e.timestamp).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>IP: {e.ip} · {e.path}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', marginBottom: '12px', fontFamily: "'HubotSans',sans-serif" }}>⚠️ Data Management</h3>
        <p style={{ fontSize: '12px', color: '#78350f', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif", lineHeight: 1.6 }}>
          Analytics data is stored locally in <code>analytics-data.json</code>. Clear it periodically to free up space. The current dataset has <strong>{data.totalEvents || 0}</strong> events.
        </p>
        <button onClick={clearAnalytics} disabled={clearing}
          style={{ background: clearing ? '#ccc' : '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: clearing ? 'not-allowed' : 'pointer', fontFamily: "'HubotSans',sans-serif" }}>
          {clearing ? 'Clearing…' : '🗑️ Clear All Analytics Data'}
        </button>
      </Card>
    </div>
  )
}

// ─── Analytics View (main export) ────────────────────────────────────────────
export function AnalyticsView({ token }) {
  const [tab, setTab] = useState('overview')
  const { data, loading, error, reload } = useAnalyticsData(token)

  const tabs = [
    { id: 'overview',  label: '📊 Overview' },
    { id: 'location',  label: '🌍 Locations' },
    { id: 'behavior',  label: '🧠 Behavior' },
    { id: 'security',  label: '🛡️ Security' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px', fontFamily: "'HubotSans',sans-serif" }}>📈 Analytics</h2>
          <p style={{ color: '#888', fontSize: '13px', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Visitor tracking, impressions, interactions and geographic data.</p>
        </div>
        <button onClick={reload} style={{ background: '#fff', border: '1.5px solid #ddd', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'HubotSans',sans-serif", color: '#555' }}>
          🔄 Refresh
        </button>
      </div>

      <TabBar tabs={tabs} active={tab} setActive={setTab} />

      {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#888', fontFamily: "'HubotSans',sans-serif" }}>Loading analytics…</div>}
      {error && <div style={{ padding: '20px', color: '#dc2626', fontFamily: "'HubotSans',sans-serif" }}>{error}</div>}
      {data && !loading && (
        <>
          {tab === 'overview'  && <OverviewTab data={data} />}
          {tab === 'location'  && <LocationTab data={data} />}
          {tab === 'behavior'  && <BehaviorTab data={data} />}
          {tab === 'security'  && <SecurityLogTab data={data} token={token} reload={reload} />}
        </>
      )}
    </div>
  )
}

// ─── Reports View (Financial + Customer Patterns) ─────────────────────────────
export function ReportsView({ token }) {
  const [tab, setTab] = useState('financial')
  const { data, loading, error } = useAnalyticsData(token)

  const tabs = [
    { id: 'financial',  label: '💰 Financial Report' },
    { id: 'products',   label: '🛍️ Product Interest' },
    { id: 'customers',  label: '👥 Customer Patterns' },
  ]

  if (loading) return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', marginBottom: '20px', fontFamily: "'HubotSans',sans-serif" }}>💰 Reports</h2>
      <div style={{ textAlign: 'center', padding: '60px', color: '#888', fontFamily: "'HubotSans',sans-serif" }}>Loading reports…</div>
    </div>
  )
  if (error || !data) return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', marginBottom: '20px', fontFamily: "'HubotSans',sans-serif" }}>💰 Reports</h2>
      <Card><p style={{ color: '#888', fontFamily: "'HubotSans',sans-serif" }}>Could not load report data. Make sure analytics tracking is running.</p></Card>
    </div>
  )

  const cartAdds = Object.entries(data.cartAdds || {}).sort((a, b) => b[1].count - a[1].count)
  const productViews = Object.entries(data.productViews || {}).sort((a, b) => b[1].count - a[1].count)
  const quoteRequests = data.quoteRequests || []

  const totalCartAdds = cartAdds.reduce((s, [, v]) => s + v.count, 0)
  const totalProductViews = productViews.reduce((s, [, v]) => s + v.count, 0)

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px', fontFamily: "'HubotSans',sans-serif" }}>💰 Reports</h2>
        <p style={{ color: '#888', fontSize: '13px', margin: 0, fontFamily: "'HubotSans',sans-serif" }}>Financial insights, product interest, and customer behavioral patterns.</p>
      </div>

      <TabBar tabs={tabs} active={tab} setActive={setTab} />

      {tab === 'financial' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <Stat label="Products Cart-Added" value={totalCartAdds} icon="🛒" color={ACC} sub="Total cart additions" />
            <Stat label="Product Page Views" value={totalProductViews} icon="👁️" color={PRI} sub="Product interest signals" />
            <Stat label="Quote Requests" value={quoteRequests.length} icon="📋" color="#16a34a" sub="Direct quote signals" />
            <Stat label="Top Product" value={cartAdds[0]?.[1]?.name || productViews[0]?.[1]?.name || '—'} icon="🏆" color="#f59e0b" sub={cartAdds[0] ? `${cartAdds[0][1].count} cart adds` : ''} />
          </div>

          <Card style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px', fontFamily: "'HubotSans',sans-serif" }}>💼 Financial Report — Product Interest Summary</h3>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px', fontFamily: "'HubotSans',sans-serif" }}>
              Since Sleekblue orders are completed via WhatsApp, this report shows customer interest signals — cart additions and quote requests — as a proxy for financial demand.
            </p>
            {cartAdds.length === 0 ? (
              <p style={{ color: '#bbb', fontSize: '13px', fontFamily: "'HubotSans',sans-serif" }}>No cart data yet. Analytics tracking will capture cart additions as customers browse.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8f8f8' }}>
                      {['#', 'Product', 'Cart Additions', 'Total Qty', 'Interest Score'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#555', fontFamily: "'HubotSans',sans-serif" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cartAdds.map(([slug, d], i) => {
                      const interestScore = Math.min(100, Math.round((d.count / Math.max(totalCartAdds, 1)) * 100 + (d.qty / Math.max(d.count, 1)) * 5))
                      return (
                        <tr key={slug} style={{ borderTop: '1px solid #f0f0f0', background: i === 0 ? '#fffbeb' : 'transparent' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: i < 3 ? ACC : '#888' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, fontFamily: "'HubotSans',sans-serif" }}>{d.name}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '60px', background: '#f0f0f0', borderRadius: '4px', height: '8px' }}>
                                <div style={{ width: `${(d.count / (cartAdds[0]?.[1]?.count || 1)) * 100}%`, height: '100%', background: ACC, borderRadius: '4px' }} />
                              </div>
                              <span style={{ fontWeight: 700, color: ACC }}>{d.count}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#555' }}>{d.qty}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: interestScore > 50 ? '#fef3c7' : '#f0f0f0', color: interestScore > 50 ? '#92400e' : '#888', borderRadius: '10px', padding: '3px 10px', fontSize: '12px', fontWeight: 700, fontFamily: "'HubotSans',sans-serif" }}>
                              {interestScore}%
                            </span>
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
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>📋 Quote Requests</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8f8f8' }}>
                      {['Product', 'Location', 'Device', 'Date'].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#555', fontFamily: "'HubotSans',sans-serif" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quoteRequests.slice(0, 50).map((q, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '9px 12px', fontWeight: 600 }}>{q.slug || '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#555' }}>{q.location?.city ? `${q.location.city}, ${q.location.country}` : q.location?.country || '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#888', textTransform: 'capitalize' }}>{q.device || '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#aaa', whiteSpace: 'nowrap' }}>{new Date(q.timestamp).toLocaleDateString()}</td>
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
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <Card>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px', fontFamily: "'HubotSans',sans-serif" }}>🛒 Most Cart-Added Products</h3>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Products customers added to their cart most often.</p>
              <BarChart data={Object.fromEntries(cartAdds.map(([slug, d]) => [d.name || slug, d.count]))} color={ACC} label="adds" />
            </Card>
            <Card>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px', fontFamily: "'HubotSans',sans-serif" }}>👁️ Most Viewed Products</h3>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>Products with the most page view impressions.</p>
              <BarChart data={Object.fromEntries(productViews.map(([slug, d]) => [d.name || slug, d.count]))} color={PRI} label="views" />
            </Card>
          </div>

          {productViews.length > 0 && (
            <Card style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>📊 Product Conversion Signals</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8f8f8' }}>
                      {['Product', 'Views', 'Cart Adds', 'View→Cart Rate'].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#555', fontFamily: "'HubotSans',sans-serif" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productViews.map(([slug, pv], i) => {
                      const cartData = data.cartAdds?.[slug]
                      const cartCount = cartData?.count || 0
                      const rate = pv.count > 0 ? ((cartCount / pv.count) * 100).toFixed(1) : '0.0'
                      return (
                        <tr key={slug} style={{ borderTop: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '9px 12px', fontWeight: 600, fontFamily: "'HubotSans',sans-serif" }}>{pv.name}</td>
                          <td style={{ padding: '9px 12px', color: PRI, fontWeight: 700 }}>{pv.count}</td>
                          <td style={{ padding: '9px 12px', color: ACC, fontWeight: 700 }}>{cartCount}</td>
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{ background: parseFloat(rate) > 20 ? '#dcfce7' : parseFloat(rate) > 5 ? '#fef3c7' : '#f0f0f0', color: parseFloat(rate) > 20 ? '#16a34a' : parseFloat(rate) > 5 ? '#92400e' : '#888', borderRadius: '10px', padding: '2px 9px', fontSize: '11px', fontWeight: 700, fontFamily: "'HubotSans',sans-serif" }}>
                              {rate}%
                            </span>
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
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <Stat label="Unique Visitors" value={data.uniqueVisitors || 0} icon="👥" color={PRI} />
            <Stat label="Avg Pages/Visit" value={data.uniqueVisitors ? ((data.totalPageViews || 0) / data.uniqueVisitors).toFixed(1) : '—'} icon="📄" color="#2563eb" />
            <Stat label="Mobile Users" value={`${data.deviceMap?.mobile || 0}`} icon="📱" color="#ec4899" sub={`of ${(data.totalEvents || 0)} events`} />
            <Stat label="International" value={Object.keys(data.locationMap || {}).filter(k => !k.includes('Nigeria')).length} icon="✈️" color="#f59e0b" sub="non-Nigerian locations" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <Card>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>📊 Customer Journey Patterns</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Browse → Product', icon: '🔍→🛍️', val: productViews.length, note: 'Unique products viewed' },
                  { label: 'Product → Cart', icon: '🛍️→🛒', val: totalCartAdds, note: 'Cart additions (purchase intent)' },
                  { label: 'Cart → Quote', icon: '🛒→📋', val: quoteRequests.length, note: 'Quote requests submitted' },
                  { label: 'Most visited page', icon: '🔥', val: Object.entries(data.pageViews || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || '—', note: 'Top landing destination' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 12px', background: '#fafafa', borderRadius: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#333', fontFamily: "'HubotSans',sans-serif" }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#888', fontFamily: "'HubotSans',sans-serif" }}>{item.note}</p>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: PRI, fontFamily: "'HubotSans',sans-serif" }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '14px', fontFamily: "'HubotSans',sans-serif" }}>🗺️ Where Customers Are</h3>
              <BarChart data={(() => {
                const countryMap = {}
                Object.entries(data.locationMap || {}).forEach(([key, count]) => {
                  const country = key.includes(',') ? key.split(',').pop().trim() : key
                  countryMap[country] = (countryMap[country] || 0) + count
                })
                return countryMap
              })()} color="#2563eb" />
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
