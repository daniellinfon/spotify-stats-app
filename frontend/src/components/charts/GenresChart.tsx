/**
 * Gráfica de radar mostrando los géneros dominantes del usuario.
 * Extraemos los géneros de los top artistas y contamos frecuencias.
 */
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface Artist {
  genres: string[]
  name: string
}

interface Props {
  artists: Artist[]
}

function extractTopGenres(artists: Artist[], topN = 8) {
  const genreCount: Record<string, number> = {}

  artists.forEach(artist => {
    artist.genres.forEach(genre => {
      genreCount[genre] = (genreCount[genre] || 0) + 1
    })
  })

  return Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([genre, count]) => ({
      genre: genre.length > 18 ? genre.slice(0, 16) + '…' : genre,
      count,
      fullMark: artists.length,
    }))
}

export default function GenresChart({ artists }: Props) {
  const data = extractTopGenres(artists)

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#555', padding: '3rem 0' }}>
        Sin datos de géneros disponibles
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data}>
        <PolarGrid stroke="#222" />
        <PolarAngleAxis
          dataKey="genre"
          tick={{ fill: '#aaa', fontSize: 11 }}
        />
        <Radar
          name="Géneros"
          dataKey="count"
          stroke="#1DB954"
          fill="#1DB954"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 8,
            color: 'white',
            fontSize: 13,
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}