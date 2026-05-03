import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

interface RecentTrack {
  played_at: string
  name: string
  artists: string[]
  album_image_url?: string
}

interface Props {
  tracks: RecentTrack[]
  highlightHour?: number | null
}

function groupByHourChronological(tracks: RecentTrack[]) {
  // Agrupa por hora exacta (fecha + hora) ordenado cronológicamente
  const buckets: Record<string, { label: string, timestamp: number, songs: RecentTrack[] }> = {}

  tracks.forEach(track => {
    const date = new Date(track.played_at)
    // Clave única por día+hora: "2024-05-02T15"
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}`

    if (!buckets[key]) {
      const isToday = date.toDateString() === new Date().toDateString()
      buckets[key] = {
        label: isToday
          ? `Hoy ${String(date.getHours()).padStart(2, '0')}h`
          : `${date.getDate()} ${date.toLocaleString('es-ES', { month: 'short' })} ${String(date.getHours()).padStart(2, '0')}h`,
        timestamp: date.getTime(),
        songs: [],
      }
    }
    buckets[key].songs.push(track)
  })

  // Ordenar cronológicamente (más antiguo a la izquierda)
  return Object.values(buckets)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(b => ({
      hour: b.label,
      timestamp: b.timestamp,
      canciones: b.songs.length,
      songs: b.songs,
    }))
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  if (!data.canciones) return null

  return (
    <div style={{
      background: '#1a1a1a', border: '1px solid #333',
      borderRadius: 10, padding: '10px 14px', maxWidth: 220,
    }}>
      <div style={{ color: '#1DB954', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
        {data.hour} — {data.canciones} {data.canciones === 1 ? 'canción' : 'canciones'}
      </div>
      {data.songs.map((s: RecentTrack, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {s.album_image_url && (
            <img src={s.album_image_url} alt={s.name}
              style={{ width: 28, height: 28, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {s.name}
            </div>
            <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {s.artists?.join(', ')}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function RecentActivityChart({ tracks, highlightHour }: Props) {
  const data = groupByHourChronological(tracks)

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 4 }}>
        <defs>
          <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1DB954" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1DB954" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
        <XAxis
          dataKey="hour"
          tick={{ fill: '#555', fontSize: 10 }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: '#555', fontSize: 10 }} tickLine={false}
          axisLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="canciones"
          stroke="#1DB954"
          strokeWidth={2}
          fill="url(#activityGradient)"
          dot={(props: any) => {
            if (!props.payload.songs?.length) return <g key={props.key} />
            const isHighlighted = highlightHour !== null &&
              new Date(props.payload.songs[0]?.played_at).getHours() === highlightHour
            if (!isHighlighted) return <g key={props.key} />
            return (
              <circle key={props.key} cx={props.cx} cy={props.cy} r={6}
                fill="#1DB954" stroke="white" strokeWidth={2} />
            )
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}