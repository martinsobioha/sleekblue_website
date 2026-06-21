import { useState, useEffect } from 'react'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() { setVisible(window.scrollY > 400) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }

  if (!visible) return null

  return (
    <button
      onClick={scrollTop}
      aria-label="Back to top"
      style={{
        position: 'fixed', bottom: '92px', right: '24px', zIndex: 9990,
        width: '44px', height: '44px', borderRadius: '50%',
        background: '#7B2FBE', color: '#fff', border: 'none',
        cursor: 'pointer', boxShadow: '0 4px 16px rgba(123,47,190,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px', transition: 'transform 0.2s, opacity 0.2s',
        animation: 'fadeInUp 0.3s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      ↑
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </button>
  )
}
