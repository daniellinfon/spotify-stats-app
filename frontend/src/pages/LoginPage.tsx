/**
 * Página de login.
 * El botón redirige a /api/v1/auth/login (backend),
 * que a su vez redirige a Spotify. Simple y efectivo.
 */
export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      color: 'white',
      fontFamily: 'sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 2rem' }}>
        {/* Logo */}
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎵</div>

        <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 8 }}>
          Spotify Stats
        </h1>
        <p style={{ fontSize: 18, color: '#aaa', marginBottom: 48 }}>
          Descubre tus hábitos musicales con estadísticas avanzadas
        </p>

        {/* Features */}
        <div style={{ marginBottom: 48, textAlign: 'left' }}>
          {[
            ['🎤', 'Tus top artistas', 'Descubre quién domina tu biblioteca'],
            ['🎵', 'Tus top tracks', 'Las canciones que más has escuchado'],
            ['🕐', 'Escuchado recientemente', 'Tu historial musical reciente'],
          ].map(([emoji, title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <span style={{ fontSize: 24 }}>{emoji}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{title}</div>
                <div style={{ color: '#aaa', fontSize: 14 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Login button */}
        <a
          href="/api/v1/auth/login"
          style={{
            display: 'inline-block',
            background: '#1DB954',
            color: 'white',
            padding: '16px 48px',
            borderRadius: 50,
            textDecoration: 'none',
            fontSize: 18,
            fontWeight: 700,
            transition: 'transform 0.2s, opacity 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseOut={e => (e.currentTarget.style.opacity = '1')}
        >
          Conectar con Spotify
        </a>

        <p style={{ marginTop: 24, fontSize: 13, color: '#666' }}>
          Solo lectura de tus datos. No almacenamos tu música.
        </p>
      </div>
    </div>
  )
}