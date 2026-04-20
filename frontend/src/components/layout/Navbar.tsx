import { useAuthStore } from '../../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()

  return (
    <nav style={{
      background: '#111',
      borderBottom: '1px solid #222',
      padding: '0 2rem',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24 }}>🎵</span>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>
          Spotify Stats
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user?.avatar_url && (
          <img
            src={user.avatar_url}
            alt={user.display_name}
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
          />
        )}
        <span style={{ color: '#aaa', fontSize: 14 }}>
          {user?.display_name}
        </span>
        <button
          onClick={logout}
          style={{
            background: 'transparent',
            border: '1px solid #444',
            color: '#aaa',
            padding: '8px 16px',
            borderRadius: 20,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}