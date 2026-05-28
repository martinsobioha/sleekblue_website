import { useState } from 'react'
import { FaComments, FaTimes } from 'react-icons/fa'

export default function ChatWidget() {
  const [visible, setVisible] = useState(true)

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
    }}>
      {visible && (
        <div style={{
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '10px',
          padding: '14px 16px',
          maxWidth: '240px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          fontSize: '13px',
          color: '#444',
          lineHeight: 1.55,
          position: 'relative',
          fontFamily: "'HubotSans', sans-serif",
        }}>
          <button
            onClick={() => setVisible(false)}
            style={{
              position: 'absolute',
              top: '6px',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#bbb',
              fontSize: '12px',
              lineHeight: 1,
              padding: '2px',
            }}
          >
            <FaTimes />
          </button>
          Welcome to our site, if you need help simply reply to this message, we are online and ready to help.
        </div>
      )}

      <button
        onClick={() => setVisible(!visible)}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: '#1565C0',
          border: 'none',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(21,101,192,0.4)',
          cursor: 'pointer',
          alignSelf: 'flex-end',
        }}
      >
        <FaComments size={22} />
      </button>
    </div>
  )
}
