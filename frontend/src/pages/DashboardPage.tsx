import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import RecentActivityChart from '../components/charts/RecentActivityChart'
import { useTopArtists, useTopTracks, useRecentlyPlayed } from '../hooks/useSpotifyData'

type TimeRange = 'short_term' | 'medium_term' | 'long_term'

const TIME_LABELS: Record<TimeRange, string> = {
  short_term: '4 semanas',
  medium_term: '6 meses',
  long_term: 'Siempre',
}

function LoadingState() {
  return <div style={{ color: '#555', textAlign: 'center', padding: '1rem' }}>Cargando...</div>
}

function ListItem({ image, name, sub, url, rank, round = false, onHover, onLeave, isHighlighted }: {
  image?: string, name: string, sub: string, url: string, rank: number,
  round?: boolean, onHover?: () => void, onLeave?: () => void, isHighlighted?: boolean
}) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 4px', borderBottom: '1px solid #1a1a1a',
        borderRadius: 6,
        background: isHighlighted ? '#1DB95415' : 'transparent',
        transition: 'background 0.15s',
        cursor: 'default',
      }}>
      <span style={{ color: '#444', fontSize: 11, width: 16, textAlign: 'right', flexShrink: 0 }}>
        {rank}
      </span>
      {image && (
        <img src={image} alt={name} style={{
          width: 36, height: 36, borderRadius: round ? '50%' : 4,
          objectFit: 'cover', flexShrink: 0,
          outline: isHighlighted ? '2px solid #1DB954' : 'none',
        }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isHighlighted ? '#1DB954' : 'white' }}>
          {name}
        </div>
        <div style={{ fontSize: 11, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {sub}
        </div>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer"
        style={{ color: '#1DB954', fontSize: 11, textDecoration: 'none', flexShrink: 0 }}>↗</a>
    </div>
  )
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={{ background: '#111', borderRadius: 12, padding: '0.75rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: '0.5rem', flexShrink: 0 }}>{title}</div>
      <div style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term')
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)

  const { data: artistsData, isLoading: loadingArtists } = useTopArtists(timeRange)
  const { data: tracksData, isLoading: loadingTracks } = useTopTracks(timeRange)
  const { data: recentData, isLoading: loadingRecent } = useRecentlyPlayed()

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.75rem', overflow: 'hidden' }}>

        {/* Time range */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {(Object.keys(TIME_LABELS) as TimeRange[]).map(r => (
            <button key={r} onClick={() => setTimeRange(r)} style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12,
              background: timeRange === r ? '#1DB954' : '#222',
              color: timeRange === r ? 'white' : '#aaa',
            }}>
              {TIME_LABELS[r]}
            </button>
          ))}
        </div>

        {/* 3 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', flex: 1, overflow: 'hidden' }}>

          {/* Top Artistas */}
          <Section title="🎤 Top Artistas">
            {loadingArtists ? <LoadingState /> : artistsData?.items.map((a: any, i: number) => (
              <ListItem key={a.id} rank={i + 1} name={a.name}
                sub={a.genres?.slice(0, 2).join(', ') || 'Sin géneros'}
                image={a.image_url} url={a.spotify_url} round />
            ))}
          </Section>

          {/* Top Tracks */}
          <Section title="🎵 Top Tracks">
            {loadingTracks ? <LoadingState /> : tracksData?.items.map((t: any, i: number) => (
              <ListItem key={t.id} rank={i + 1} name={t.name}
                sub={t.artists?.join(', ')}
                image={t.album_image_url} url={t.spotify_url} />
            ))}
          </Section>

          {/* Recientes — con hover que marca en la gráfica */}
          <Section title="🕐 Recientes">
            {loadingRecent ? <LoadingState /> : recentData?.items.map((t: any, i: number) => {
              const hour = new Date(t.played_at).getHours()
              return (
                <ListItem
                  key={`${t.id}-${i}`}
                  rank={i + 1}
                  name={t.name}
                  sub={`${t.artists?.join(', ')} · ${new Date(t.played_at).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`}
                  image={t.album_image_url}
                  url={t.spotify_url}
                  isHighlighted={hoveredHour === hour}
                  onHover={() => setHoveredHour(hour)}
                  onLeave={() => setHoveredHour(null)}
                />
              )
            })}
          </Section>

        </div>

        {/* Gráfica */}
        <div style={{ background: '#111', borderRadius: 12, padding: '0.75rem', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: '0.25rem' }}>
            🕐 Actividad por hora
            {hoveredHour !== null && (
              <span style={{ color: '#1DB954', fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                · mostrando {String(hoveredHour).padStart(2, '0')}:00h
              </span>
            )}
          </div>
          {loadingRecent ? <LoadingState /> : (
            <RecentActivityChart
              tracks={recentData?.items || []}
              highlightHour={hoveredHour}
            />
          )}
        </div>

      </div>
    </div>
  )
}