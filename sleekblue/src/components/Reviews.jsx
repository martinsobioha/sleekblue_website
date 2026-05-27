import { FaStar } from 'react-icons/fa'

export default function Reviews() {
  return (
    <section style={{ background: '#FAF3E8', padding: '40px 24px 60px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
        {/* Heading */}
        <h2 style={{
          fontSize: '28px',
          fontWeight: 800,
          color: '#7B2FBE',
          textDecoration: 'underline',
          textDecorationColor: '#7B2FBE',
          marginBottom: '10px',
        }}>
          Customers love Sleekblue
        </h2>

        {/* Stars + rating */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[1,2,3,4,5].map(i => <FaStar key={i} size={20} color="#F5A623" />)}
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>5.0/5 based on 500+ reviews</span>
        </div>

        {/* Review cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: '#fff',
              borderRadius: '10px',
              height: '110px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }} />
          ))}
        </div>
      </div>
    </section>
  )
}
