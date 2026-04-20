/**
 * Custom hook que encapsula todas las llamadas a la API de Spotify.
 * Los componentes no saben nada de axios — solo llaman a este hook.
 */
import { useState, useEffect } from 'react'
import api from '../services/api'

type TimeRange = 'short_term' | 'medium_term' | 'long_term'

export function useTopArtists(timeRange: TimeRange = 'medium_term') {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    api.get('/spotify/top-artists', { params: { time_range: timeRange, limit: 10 } })
      .then(res => setData(res.data))
      .catch(() => setError('Error cargando artistas'))
      .finally(() => setIsLoading(false))
  }, [timeRange])

  return { data, isLoading, error }
}

export function useTopTracks(timeRange: TimeRange = 'medium_term') {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    api.get('/spotify/top-tracks', { params: { time_range: timeRange, limit: 10 } })
      .then(res => setData(res.data))
      .catch(() => setError('Error cargando tracks'))
      .finally(() => setIsLoading(false))
  }, [timeRange])

  return { data, isLoading, error }
}

export function useRecentlyPlayed() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/spotify/recently-played', { params: { limit: 10 } })
      .then(res => setData(res.data))
      .catch(() => setError('Error cargando historial'))
      .finally(() => setIsLoading(false))
  }, [])

  return { data, isLoading, error }
}