import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useSEO from '../hooks/useSEO'
import Breadcrumb from '../components/Breadcrumb'
import { BlogPostSkeleton } from '../components/SkeletonCard'

const PRI = '#7B2FBE'
const POSTS_PER_PAGE = 9

function readingTime(content) {
  if (!content) return 1
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export default function BlogPage() {
  useSEO('blog', {
    title: 'Blog — Printing Tips & Business Ideas | Sleekblue',
    description: 'Read expert tips on branding, printing, and growing your business from the Sleekblue Media Houz team.',
    canonical: 'https://sleekbluemediahouz.com/blog',
  })

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeTag, setActiveTag] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setPosts(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const categories = useMemo(() => ['All', ...new Set(posts.map(p => p.category).filter(Boolean))], [posts])

  const allTags = useMemo(() => {
    const tagMap = {}
    posts.forEach(p => (p.tags || []).forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1 }))
    return Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 20)
  }, [posts])

  const popularPosts = useMemo(() =>
    [...posts].filter(p => p.viewCount > 0).sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5),
    [posts]
  )

  const filtered = useMemo(() => {
    let out = posts
    if (activeCategory !== 'All') out = out.filter(p => p.category === activeCategory)
    if (activeTag) out = out.filter(p => (p.tags || []).includes(activeTag))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      out = out.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      )
    }
    return out
  }, [posts, activeCategory, activeTag, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE))
  const pagePosts  = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)

  function changeCategory(cat) { setActiveCategory(cat); setActiveTag(null); setPage(1) }
  function changeTag(tag) { setActiveTag(t => t === tag ? null : tag); setActiveCategory('All'); setPage(1) }
  function changeSearch(val) { setSearch(val); setPage(1) }

  return (
    <section style={{ background: '#FAF3E8', minHeight: '100vh', padding: '48px 24px 80px' }}>
      <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />

        {/* Header + Search */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 6px', fontFamily: "'HubotSans', sans-serif" }}>Blog</h1>
            <p style={{ fontSize: '14px', color: '#777', margin: 0, fontFamily: "'HubotSans', sans-serif" }}>Tips, guides and insights from the Sleekblue team</p>
          </div>
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: '#aaa' }}>🔍</span>
            <input
              type="search"
              value={search}
              onChange={e => changeSearch(e.target.value)}
              placeholder="Search posts…"
              style={{ padding: '9px 14px 9px 36px', borderRadius: '10px', border: '1.5px solid #ddd', fontSize: '13px', fontFamily: "'HubotSans', sans-serif", outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Category filters */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px', marginTop: '16px' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => changeCategory(cat)}
                style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: activeCategory === cat && !activeTag ? PRI : '#fff', color: activeCategory === cat && !activeTag ? '#fff' : '#555', fontWeight: activeCategory === cat && !activeTag ? 700 : 500, fontSize: '13px', fontFamily: "'HubotSans', sans-serif", boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'all 0.15s' }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Two-column layout: posts + sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: '32px', alignItems: 'start' }}
          className="blog-grid">

          {/* Main posts column */}
          <div>
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[1, 2, 3].map(i => <BlogPostSkeleton key={i} />)}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{search || activeTag ? '🔍' : '✍️'}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px', fontFamily: "'HubotSans', sans-serif" }}>
                  {search ? `No posts found for "${search}"` : activeTag ? `No posts tagged "#${activeTag}"` : 'No posts yet'}
                </h3>
                <p style={{ fontSize: '14px', color: '#888', fontFamily: "'HubotSans', sans-serif" }}>
                  {search || activeTag ? 'Try a different search term or browse all categories.' : 'Check back soon for tips, guides, and insights.'}
                </p>
                {(search || activeTag) && (
                  <button onClick={() => { changeSearch(''); setActiveTag(null) }}
                    style={{ marginTop: '16px', padding: '9px 20px', background: PRI, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', fontFamily: "'HubotSans', sans-serif" }}>
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {pagePosts.map((post, i) => (
                <article key={post.id || i}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', flexDirection: post.coverImage ? 'row' : 'column', borderLeft: !post.coverImage ? `4px solid ${PRI}` : 'none', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(123,47,190,0.13)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.06)'}
                >
                  {post.coverImage && (
                    <div style={{ width: '220px', flexShrink: 0 }}>
                      <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: '150px', maxHeight: '210px' }} loading="lazy" />
                    </div>
                  )}
                  <div style={{ padding: '22px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      {post.category && (
                        <span style={{ background: '#f5f0ff', color: PRI, padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, fontFamily: "'HubotSans', sans-serif" }}>{post.category}</span>
                      )}
                      <span style={{ fontSize: '12px', color: '#999', fontFamily: "'HubotSans', sans-serif" }}>
                        {post.date ? new Date(post.date).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                      </span>
                      <span style={{ fontSize: '11px', color: '#bbb', fontFamily: "'HubotSans', sans-serif" }}>
                        · {readingTime(post.content)} min read
                      </span>
                      {post.viewCount > 0 && (
                        <span style={{ fontSize: '11px', color: '#bbb', fontFamily: "'HubotSans', sans-serif" }}>· 👁 {post.viewCount}</span>
                      )}
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px', fontFamily: "'HubotSans', sans-serif", lineHeight: 1.35 }}>{post.title}</h2>
                    {post.excerpt && (
                      <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.65, margin: '0 0 12px', fontFamily: "'HubotSans', sans-serif" }}>{post.excerpt}</p>
                    )}
                    {post.tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {post.tags.map(tag => (
                          <span key={tag} onClick={e => { e.stopPropagation(); changeTag(tag) }}
                            style={{ background: activeTag === tag ? PRI : '#f0f0f0', color: activeTag === tag ? '#fff' : '#666', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontFamily: "'HubotSans', sans-serif", cursor: 'pointer', transition: 'all 0.15s' }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {post.authorName && (
                        <span style={{ fontSize: '12px', color: '#888', fontFamily: "'HubotSans', sans-serif" }}>By <strong>{post.authorName}</strong></span>
                      )}
                      <span style={{ fontSize: '13px', color: PRI, fontWeight: 700, fontFamily: "'HubotSans', sans-serif" }}>Read more →</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '40px', flexWrap: 'wrap' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #ddd', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontWeight: 700, fontSize: '13px', fontFamily: "'HubotSans', sans-serif" }}>
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: '38px', height: '38px', borderRadius: '8px', border: 'none', background: p === page ? PRI : '#fff', color: p === page ? '#fff' : '#555', cursor: 'pointer', fontWeight: p === page ? 700 : 500, fontSize: '13px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontFamily: "'HubotSans', sans-serif" }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #ddd', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontWeight: 700, fontSize: '13px', fontFamily: "'HubotSans', sans-serif" }}>
                  Next →
                </button>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <a href="/feed.xml" style={{ fontSize: '12px', color: '#aaa', textDecoration: 'none', fontFamily: "'HubotSans', sans-serif" }}>
                🔶 Subscribe via RSS
              </a>
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Popular Posts */}
            {popularPosts.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 16px', fontFamily: "'HubotSans', sans-serif" }}>
                  🔥 Popular Posts
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {popularPosts.map((post, i) => (
                    <div key={post.id || i} onClick={() => navigate(`/blog/${post.slug}`)}
                      style={{ cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, width: '24px', height: '24px', background: i === 0 ? PRI : '#f0eaf8', color: i === 0 ? '#fff' : PRI, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, fontFamily: "'HubotSans', sans-serif", marginTop: '1px' }}>
                        {i + 1}
                      </span>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 3px', lineHeight: 1.4, fontFamily: "'HubotSans', sans-serif" }}
                          onMouseEnter={e => e.currentTarget.style.color = PRI}
                          onMouseLeave={e => e.currentTarget.style.color = '#1a1a1a'}>
                          {post.title}
                        </p>
                        <p style={{ fontSize: '11px', color: '#aaa', margin: 0, fontFamily: "'HubotSans', sans-serif" }}>
                          👁 {post.viewCount} views · {readingTime(post.content)} min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tag Cloud */}
            {allTags.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px', fontFamily: "'HubotSans', sans-serif" }}>
                  🏷️ Tags
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {allTags.map(([tag, count]) => (
                    <button key={tag} onClick={() => changeTag(tag)}
                      style={{ padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: activeTag === tag ? PRI : '#f5f0ff', color: activeTag === tag ? '#fff' : PRI, fontSize: '12px', fontWeight: 600, fontFamily: "'HubotSans', sans-serif", transition: 'all 0.15s' }}>
                      #{tag} <span style={{ opacity: 0.65, fontSize: '10px' }}>({count})</span>
                    </button>
                  ))}
                </div>
                {activeTag && (
                  <button onClick={() => setActiveTag(null)}
                    style={{ marginTop: '12px', fontSize: '11px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'HubotSans', sans-serif", textDecoration: 'underline' }}>
                    × Clear tag filter
                  </button>
                )}
              </div>
            )}

            {/* Categories widget */}
            {categories.length > 2 && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px', fontFamily: "'HubotSans', sans-serif" }}>
                  📂 Categories
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categories.map(cat => {
                    const count = cat === 'All' ? posts.length : posts.filter(p => p.category === cat).length
                    return (
                      <button key={cat} onClick={() => changeCategory(cat)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeCategory === cat && !activeTag ? '#f5f0ff' : 'transparent', color: '#333', fontFamily: "'HubotSans', sans-serif", fontSize: '13px', fontWeight: activeCategory === cat && !activeTag ? 700 : 500, transition: 'all 0.15s', textAlign: 'left' }}>
                        <span>{cat}</span>
                        <span style={{ background: '#f0eaf8', color: PRI, fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px' }}>{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ background: 'linear-gradient(135deg,#7B2FBE,#5B1F9E)', borderRadius: '14px', padding: '22px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: '0 0 6px', fontFamily: "'HubotSans', sans-serif" }}>Need a print quote?</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '0 0 14px', fontFamily: "'HubotSans', sans-serif" }}>Get a fast quote from our team</p>
              <a href="/quote" style={{ display: 'inline-block', background: '#fff', color: PRI, padding: '9px 20px', borderRadius: '20px', fontWeight: 700, fontSize: '12px', textDecoration: 'none', fontFamily: "'HubotSans', sans-serif" }}>
                Get a Quote →
              </a>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .blog-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
