export default function BlogPage() {
  const posts = [
    { title: '5 Reasons Die-Cut Stickers Boost Your Brand', date: 'May 2026', category: 'Branding Tips', excerpt: 'Die-cut stickers are one of the most affordable and effective ways to build brand recognition...' },
    { title: 'How to Choose the Right Flex Banner Size', date: 'April 2026', category: 'Printing Guide', excerpt: 'Choosing the right banner size makes the difference between a message that lands and one that gets ignored...' },
    { title: 'Corporate Branding on a Small Business Budget', date: 'March 2026', category: 'Business Tips', excerpt: 'You don\'t need a big brand budget to look like one. Here\'s how small businesses are competing with top brands...' },
  ]

  return (
    <section style={{ background: '#FAF3E8', padding: '48px 24px 80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px', fontFamily: "'HubotSans', sans-serif" }}>Blog</h1>
        <p style={{ fontSize: '14px', color: '#777', marginBottom: '36px', fontFamily: "'HubotSans', sans-serif" }}>Tips, guides and insights from the Sleekblue team</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {posts.map((post, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', cursor: 'pointer', borderLeft: '4px solid #7B2FBE' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(123,47,190,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.06)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <span style={{ background: '#f5f0ff', color: '#7B2FBE', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, fontFamily: "'HubotSans', sans-serif" }}>{post.category}</span>
                <span style={{ fontSize: '12px', color: '#999' }}>{post.date}</span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px', fontFamily: "'HubotSans', sans-serif" }}>{post.title}</h2>
              <p style={{ fontSize: '13.5px', color: '#666', lineHeight: 1.65, fontFamily: "'HubotSans', sans-serif", fontWeight: 400 }}>{post.excerpt}</p>
              <span style={{ display: 'inline-block', marginTop: '12px', fontSize: '13px', color: '#7B2FBE', fontWeight: 600 }}>Read more →</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
