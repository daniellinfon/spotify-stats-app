"""
Modelos Pydantic para los datos de Spotify.

Definimos exactamente qué campos enviamos al frontend.
Motivo: la API de Spotify devuelve objetos enormes (50+ campos por track).
Nosotros filtramos solo lo que necesitamos — menos payload, más rendimiento.
"""
from pydantic import BaseModel


class ArtistSchema(BaseModel):
    id: str
    name: str
    genres: list[str]
    popularity: int
    image_url: str | None = None
    spotify_url: str


class TrackSchema(BaseModel):
    id: str
    name: str
    artists: list[str]      # Solo los nombres, no objetos completos
    album_name: str
    album_image_url: str | None = None
    popularity: int
    duration_ms: int
    spotify_url: str
    preview_url: str | None = None


class RecentlyPlayedTrackSchema(BaseModel):
    id: str
    name: str
    artists: list[str]
    album_name: str
    album_image_url: str | None = None
    spotify_url: str
    preview_url: str | None = None
    played_at: str  # ISO 8601 timestamp


class TopArtistsResponse(BaseModel):
    items: list[ArtistSchema]
    total: int
    time_range: str


class TopTracksResponse(BaseModel):
    items: list[TrackSchema]
    total: int
    time_range: str


class RecentlyPlayedResponse(BaseModel):
    items: list[RecentlyPlayedTrackSchema]
    total: int
