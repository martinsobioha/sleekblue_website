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
      gap: '0',
    }}>
      <a href="#" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        background: '#25D366',
        color: '#fff',
        borderRadius: '0 4px 4px 0',
        marginBottom: '2px',
      }}>
        <FaWhatsapp size={18} />
      </a>
      <a href="#" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        background: '#1877F2',
        color: '#fff',
        borderRadius: '0 4px 4px 0',
        marginBottom: '2px',
      }}>
        <FaFacebookF size={16} />
      </a>
      <a href="#" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
        color: '#fff',
        borderRadius: '0 4px 4px 0',
      }}>
        <FaInstagram size={17} />
      </a>
    </div>
  )
}
