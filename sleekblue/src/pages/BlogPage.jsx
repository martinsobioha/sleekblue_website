import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'

export default function BlogPage() {
  useSEO('blog', { title: 'Blog — Printing Tips & Business Ideas | Sleekblue', description: 'Read expert tips on branding, printing, and growing your business from the Sleekblue Media Houz team.' })
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setPosts(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const categories = ['All', ...new Set(posts.map(p => p.category).filter(Boolean))]
  const filtered = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory)

  return (
    <section style={{ background: '#FAF3E8', minHeight: '100vh', padding: '48px 24px 80px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px', fontFamily: "'HubotSans', sans-serif" }}>Blog</h1>
        <p style={{ fontSize: '14px', color: '#777', marginBottom: '28px', fontFamily: "'HubotSans', sans-serif" }}>Tips, guides and insights from the Sleekblue team</p>

        {/* Category filters */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: activeCategory === cat ? '#7B2FBE' : '#fff', color: activeCategory === cat ? '#fff' : '#555', fontWeight: activeCategory === cat ? 700 : 500, fontSize: '13px', fontFamily: "'HubotSans', sans-serif", boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'all 0.15s' }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#aaa', fontFamily: "'HubotSans', sans-serif" }}>Loading posts…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>✍️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px', fontFamily: "'HubotSans', sans-serif" }}>No posts yet</h3>
            <p style={{ fontSize: '14px', color: '#888', fontFamily: "'HubotSans', sans-serif" }}>Check back soon for tips, guides, and insights.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filtered.map((post, i) => (
            <article key={post.id || i}
              onClick={() => navigate(`/blog/${post.slug}`)}
              style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', flexDirection: post.coverImage ? 'row' : 'column', borderLeft: !post.coverImage ? '4px solid #7B2FBE' : 'none', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(123,47,190,0.13)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.06)'}
            >
              {post.coverImage && (
                <div style={{ width: '240px', flexShrink: 0 }}>
                  <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: '160px', maxHeight: '220px' }} />
                </div>
              )}
              <div style={{ padding: '24px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {post.category && (
                    <span style={{ background: '#f5f0ff', color: '#7B2FBE', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, fontFamily: "'HubotSans', sans-serif" }}>{post.category}</span>
                  )}
                  <span style={{ fontSize: '12px', color: '#999', fontFamily: "'HubotSans', sans-serif" }}>{post.date ? new Date(post.date).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                  {post.tags?.length > 0 && post.tags.map(tag => (
                    <span key={tag} style={{ background: '#f0f0f0', color: '#666', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontFamily: "'HubotSans', sans-serif" }}>#{tag}</span>
                  ))}
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a', marginBottom: '10px', fontFamily: "'HubotSans', sans-serif", lineHeight: 1.35 }}>{post.title}</h2>
                {post.excerpt && <p style={{ fontSize: '13.5px', color: '#666', lineHeight: 1.65, fontFamily: "'HubotSans', sans-serif", marginBottom: '14px' }}>{post.excerpt}</p>}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ display: 'inline-block', fontSize: '13px', color: '#7B2FBE', fontWeight: 600, fontFamily: "'HubotSans', sans-serif" }}>Read more →</span>
                  {post.videoUrl && <span style={{ fontSize: '11px', color: '#aaa', fontFamily: "'HubotSans', sans-serif" }}>🎬 Video</span>}
                  {post.audioUrl && <span style={{ fontSize: '11px', color: '#aaa', fontFamily: "'HubotSans', sans-serif" }}>🎙️ Audio</span>}
                  {post.mediaFiles?.length > 0 && <span style={{ fontSize: '11px', color: '#aaa', fontFamily: "'HubotSans', sans-serif" }}>🖼️ {post.mediaFiles.length} image{post.mediaFiles.length > 1 ? 's' : ''}</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:640px){ article { flex-direction: column !important; } article > div:first-child { width: 100% !important; max-height: 200px !important; } }`}</style>
    </section>
  )
}
