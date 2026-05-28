import { FaWhatsapp, FaFacebookF, FaInstagram } from 'react-icons/fa'

export default function SocialSidebar() {
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    }}>
      <a
        href="https://wa.me/2348065275264"
        target="_blank"
        rel="noopener noreferrer"
        title="WhatsApp: +234 806 527 5264"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '38px', height: '38px',
          background: '#25D366', color: '#fff',
          borderRadius: '0 6px 6px 0',
          textDecoration: 'none',
          boxShadow: '2px 2px 6px rgba(0,0,0,0.15)',
          transition: 'width 0.2s, background 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.width = '46px'; e.currentTarget.style.background = '#1ebe5d' }}
        onMouseLeave={e => { e.currentTarget.style.width = '38px'; e.currentTarget.style.background = '#25D366' }}
      >
        <FaWhatsapp size={20} />
      </a>
      <a
        href="https://www.facebook.com/sleekbluemediahouz"
        target="_blank"
        rel="noopener noreferrer"
        title="Facebook: sleekbluemediahouz"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '38px', height: '38px',
          background: '#1877F2', color: '#fff',
          borderRadius: '0 6px 6px 0',
          textDecoration: 'none',
          boxShadow: '2px 2px 6px rgba(0,0,0,0.15)',
          transition: 'width 0.2s, background 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.width = '46px'; e.currentTarget.style.background = '#0d6ad4' }}
        onMouseLeave={e => { e.currentTarget.style.width = '38px'; e.currentTarget.style.background = '#1877F2' }}
      >
        <FaFacebookF size={17} />
      </a>
      <a
        href="https://www.instagram.com/sleekbluemediahouz"
        target="_blank"
        rel="noopener noreferrer"
        title="Instagram: @sleekbluemediahouz"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '38px', height: '38px',
          background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
          color: '#fff',
          borderRadius: '0 6px 6px 0',
          textDecoration: 'none',
          boxShadow: '2px 2px 6px rgba(0,0,0,0.15)',
          transition: 'width 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.width = '46px'}
        onMouseLeave={e => e.currentTarget.style.width = '38px'}
      >
        <FaInstagram size={19} />
      </a>
    </div>
  )
}
