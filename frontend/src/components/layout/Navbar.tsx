import { useAuthStore } from '../../store/authStore'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={{
      background: '#111',
      borderBottom: '1px solid #222',
      padding: '0 2rem',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>🎵</span>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>
          Spotify Stats
        </span>
      </div>

      {/* Tabs de navegación */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { path: '/dashboard', label: '📊 Dashboard' },
          { path: '/chat', label: '🤖 DJ Agent' },
        ].map(({ path, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              background: location.pathname === path ? '#1DB954' : 'transparent',
              border: 'none',
              color: location.pathname === path ? 'white' : '#888',
              padding: '6px 16px',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Usuario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user?.avatar_url && (
          <img src={user.avatar_url} alt={user.display_name}
            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
        )}
        <span style={{ color: '#aaa', fontSize: 13 }}>{user?.display_name}</span>
        <button onClick={logout} style={{
          background: 'transparent', border: '1px solid #333', color: '#aaa',
          padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
        }}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}