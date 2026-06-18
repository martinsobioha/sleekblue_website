import { Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function Breadcrumb({ crumbs }) {
  useEffect(() => {
    const existing = document.getElementById('breadcrumb-schema')
    if (existing) existing.remove()
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.label,
        item: crumb.href ? `https://sleekbluemediahouz.com${crumb.href}` : undefined,
      })),
    }
    const tag = document.createElement('script')
    tag.id = 'breadcrumb-schema'
    tag.type = 'application/ld+json'
    tag.textContent = JSON.stringify(schema)
    document.head.appendChild(tag)
    return () => { const el = document.getElementById('breadcrumb-schema'); if (el) el.remove() }
  }, [crumbs])

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: '16px' }}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: '6px', listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' }}>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {i > 0 && (
                <span style={{ color: '#bbb', fontSize: '12px', userSelect: 'none' }}>›</span>
              )}
              {isLast || !crumb.href ? (
                <span style={{ fontSize: '12.5px', color: isLast ? '#7B2FBE' : '#888', fontWeight: isLast ? 600 : 400, fontFamily: "'HubotSans', sans-serif" }}>
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.href}
                  style={{ fontSize: '12.5px', color: '#888', textDecoration: 'none', fontFamily: "'HubotSans', sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.color = '#7B2FBE'}
                  onMouseLeave={e => e.currentTarget.style.color = '#888'}>
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
