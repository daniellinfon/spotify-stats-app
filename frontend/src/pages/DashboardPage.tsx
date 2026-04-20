import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import { useTopArtists, useTopTracks, useRecentlyPlayed } from '../hooks/useSpotifyData'

type TimeRange = 'short_term' | 'medium_term' | 'long_term'

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  short_term: 'Últimas 4 semanas',
  medium_term: 'Últimos 6 meses',
  long_term: 'Todos los tiempos',
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: 'white',
    fontFamily: 'sans-serif',
  },
  container: { maxWidth: 1200, margin: '0 auto', padding: '2rem' },
  section: {
    background: '#111',
    borderRadius: 12,
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  sectionTitle: { fontSize: 20, fontWeight: 700, marginBottom: '1.5rem' },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid #222',
  },
  rank: { color: '#555', fontSize: 13, width: 24, textAlign: 'right' as const },
  image: { width: 48, height: 48, borderRadius: 4, objectFit: 'cover' as const },
  trackInfo: { flex: 1, minWidth: 0 },
  trackName: { fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  trackSub: { color: '#888', fontSize: 12, marginTop: 2 },
  timeButton: (active: boolean) => ({
    padding: '6px 14px',
    borderRadius: 20,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    background: active ? '#1DB954' : '#222',
    color: active ? 'white' : '#aaa',
    transition: 'all 0.2s',
  }),
}

function TimeRangeSelector({ value, onChange }: { value: TimeRange, onChange: (v: TimeRange) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
      {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map(range => (
        <button key={range} style={styles.timeButton(value === range)} onClick={() => onChange(range)}>
          {TIME_RANGE_LABELS[range]}
        </button>
      ))}
    </div>
  )
}

function LoadingState() {
  return <div style={{ color: '#555', padding: '2rem 0', textAlign: 'center' }}>Cargando...</div>
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term')

  const { data: artistsData, isLoading: loadingArtists } = useTopArtists(timeRange)
  const { data: tracksData, isLoading: loadingTracks } = useTopTracks(timeRange)
  const { data: recentData, isLoading: loadingRecent } = useRecentlyPlayed()

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>

        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: '0.5rem' }}>
          Tu perfil musical 🎵
        </h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>
          Estadísticas basadas en tu historial de Spotify
        </p>

        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

        {/* TOP ARTISTS */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🎤 Top Artistas</div>
          {loadingArtists ? <LoadingState /> : (
            artistsData?.items.map((artist: any, i: number) => (
              <div key={artist.id} style={styles.card}>
                <span style={styles.rank}>#{i + 1}</span>
                {artist.image_url && (
                  <img src={artist.image_url} alt={artist.name} style={{ ...styles.image, borderRadius: '50%' }} />
                )}
                <div style={styles.trackInfo}>
                  <div style={styles.trackName}>{artist.name}</div>
                </div>
                <a href={artist.spotify_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#1DB954', fontSize: 12, textDecoration: 'none' }}>
                  ↗ Abrir
                </a>
              </div>
            ))
          )}
        </div>

        {/* TOP TRACKS */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🎵 Top Tracks</div>
          {loadingTracks ? <LoadingState /> : (
            tracksData?.items.map((track: any, i: number) => (
              <div key={track.id} style={styles.card}>
                <span style={styles.rank}>#{i + 1}</span>
                {track.album_image_url && (
                  <img src={track.album_image_url} alt={track.name} style={styles.image} />
                )}
                <div style={styles.trackInfo}>
                  <div style={styles.trackName}>{track.name}</div>
                  <div style={styles.trackSub}>{track.artists.join(', ')} · {track.album_name}</div>
                </div>
                <a href={track.spotify_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#1DB954', fontSize: 12, textDecoration: 'none' }}>
                  ↗ Abrir
                </a>
              </div>
            ))
          )}
        </div>

        {/* RECENTLY PLAYED */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🕐 Escuchado Recientemente</div>
          {loadingRecent ? <LoadingState /> : (
            recentData?.items.map((track: any, i: number) => (
              <div key={`${track.id}-${i}`} style={styles.card}>
                <span style={styles.rank}>#{i + 1}</span>
                {track.album_image_url && (
                  <img src={track.album_image_url} alt={track.name} style={styles.image} />
                )}
                <div style={styles.trackInfo}>
                  <div style={styles.trackName}>{track.name}</div>
                  <div style={styles.trackSub}>
                    {track.artists.join(', ')} · {new Date(track.played_at).toLocaleString('es-ES', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
                <a href={track.spotify_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#1DB954', fontSize: 12, textDecoration: 'none' }}>
                  ↗ Abrir
                </a>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}