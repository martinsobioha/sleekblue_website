import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FaStar } from 'react-icons/fa'
import { useSEO } from '../hooks/useSEO'
import Breadcrumb from '../components/Breadcrumb'

export default function BlogPostPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/blog/${slug}`)
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then(d => {
        setPost(d); setLoading(false)
        if (d?.title) {
          document.title = `${d.title} — Sleekblue Blog`
          const meta = document.querySelector('meta[name="description"]')
          if (meta && d.excerpt) meta.content = d.excerpt
        }
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [slug])

  useEffect(() => {
    if (!post) return
    const existing = document.getElementById('article-schema')
    if (existing) existing.remove()
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt || '',
      image: post.coverImage ? [`https://sleekbluemediahouz.com${post.coverImage}`] : [],
      datePublished: post.date || new Date().toISOString(),
      dateModified: post.updatedAt || post.date || new Date().toISOString(),
      author: {
        '@type': 'Organization',
        name: 'Sleekblue Media Houz',
        url: 'https://sleekbluemediahouz.com',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Sleekblue Media Houz',
        logo: {
          '@type': 'ImageObject',
          url: 'https://sleekbluemediahouz.com/sleekblue-logo.jpg',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://sleekbluemediahouz.com/blog/${slug}`,
      },
    }
    const tag = document.createElement('script')
    tag.id = 'article-schema'
    tag.type = 'application/ld+json'
    tag.textContent = JSON.stringify(schema)
    document.head.appendChild(tag)
    return () => { const el = document.getElementById('article-schema'); if (el) el.remove() }
  }, [post, slug])

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '4px solid #e0d6f5', borderTopColor: '#7B2FBE', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'HubotSans', sans-serif", padding: '24px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px' }}>Post Not Found</h2>
      <p style={{ color: '#888', marginBottom: '24px' }}>This blog post doesn't exist or has been unpublished.</p>
      <button onClick={() => navigate('/blog')} style={{ background: '#7B2FBE', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'HubotSans', sans-serif" }}>← Back to Blog</button>
    </div>
  )

  return (
    <article style={{ background: '#FAF3E8', minHeight: '100vh', padding: '48px 24px 80px', fontFamily: "'HubotSans', sans-serif" }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: post.title },
        ]} />

        {/* Cover image */}
        {post.coverImage && (
          <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
            <img src={post.coverImage} alt={post.title} style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          {post.category && (
            <span style={{ background: '#f5f0ff', color: '#7B2FBE', padding: '4px 12px', borderRadius: '14px', fontSize: '11px', fontWeight: 700 }}>{post.category}</span>
          )}
          <span style={{ fontSize: '12px', color: '#999' }}>{post.date ? new Date(post.date).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
          {post.tags?.map(tag => (
            <span key={tag} style={{ background: '#f0f0f0', color: '#666', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>#{tag}</span>
          ))}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1a1a1a', marginBottom: '16px', lineHeight: 1.25 }}>{post.title}</h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{ fontSize: '17px', color: '#555', lineHeight: 1.7, fontWeight: 400, marginBottom: '28px', borderLeft: '4px solid #7B2FBE', paddingLeft: '16px', fontStyle: 'italic' }}>{post.excerpt}</p>
        )}

        {/* Video embed */}
        {post.videoUrl && (
          <div style={{ marginBottom: '28px', borderRadius: '12px', overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
            {post.videoUrl.includes('youtube.com') || post.videoUrl.includes('youtu.be') ? (
              <iframe
                src={post.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen title={post.title}
              />
            ) : (
              <video src={post.videoUrl} controls style={{ width: '100%', maxHeight: '400px' }} />
            )}
          </div>
        )}

        {/* Audio */}
        {post.audioUrl && (
          <div style={{ marginBottom: '28px', background: '#fff', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎙️ Audio</p>
            <audio src={post.audioUrl} controls style={{ width: '100%' }} />
          </div>
        )}

        {/* Content */}
        {post.content && (
          <div style={{ fontSize: '15px', color: '#333', lineHeight: 1.85, marginBottom: '28px' }}
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>').replace(/^/, '<p>').replace(/$/, '</p>') }}
          />
        )}

        {/* Media gallery */}
        {post.mediaFiles?.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gallery</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {post.mediaFiles.map((url, i) => (
                <div key={i} style={{ borderRadius: '10px', overflow: 'hidden', background: '#eee', aspectRatio: '4/3' }}>
                  <img src={url} alt={`Media ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '24px', marginTop: '40px' }}>
          <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#7B2FBE', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>
            ← Back to Blog
          </Link>
        </div>
      </div>
    </article>
  )
}
