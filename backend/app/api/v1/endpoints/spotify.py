"""
Endpoints de datos de Spotify.
Todas las rutas están protegidas con Depends(get_current_user).
"""
from typing import Literal

from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user
from app.schemas.spotify import (
    RecentlyPlayedResponse,
    RecentlyPlayedTrackSchema,
    TopArtistsResponse,
    TopTracksResponse,
    ArtistSchema,
    TrackSchema,
)
from app.services.spotify_client import SpotifyClient

router = APIRouter(prefix="/spotify", tags=["Spotify"])

# Tipo para validar el parámetro time_range en los endpoints
TimeRange = Literal["short_term", "medium_term", "long_term"]


def get_spotify_client(
    current_user: dict = Depends(get_current_user),
) -> SpotifyClient:
    """
    Dependencia que construye el cliente de Spotify con el token del usuario.
    FastAPI inyecta esto automáticamente en los endpoints que lo usen.
    """
    return SpotifyClient(access_token=current_user["spotify_access_token"])


@router.get("/top-artists", response_model=TopArtistsResponse)
async def get_top_artists(
    time_range: TimeRange = Query(default="medium_term"),
    limit: int = Query(default=20, ge=1, le=50),
    client: SpotifyClient = Depends(get_spotify_client),
) -> TopArtistsResponse:
    """
    Devuelve los top artistas del usuario autenticado.
    - **time_range**: short_term | medium_term | long_term
    - **limit**: número de artistas (1-50)
    """
    data = await client.get_top_artists(time_range=time_range, limit=limit)

    artists = [
        ArtistSchema(
            id=artist["id"],
            name=artist["name"],
            genres=artist.get("genres", []),
            popularity=artist.get("popularity", 0),        # ← .get() con default
            image_url=artist["images"][0]["url"] if artist.get("images") else None,
            spotify_url=artist["external_urls"]["spotify"],
        )
        for artist in data.get("items", [])
    ]

    return TopArtistsResponse(
        items=artists,
        total=len(artists),
        time_range=time_range,
    )


@router.get("/top-tracks", response_model=TopTracksResponse)
async def get_top_tracks(
    time_range: TimeRange = Query(default="medium_term"),
    limit: int = Query(default=20, ge=1, le=50),
    client: SpotifyClient = Depends(get_spotify_client),
) -> TopTracksResponse:
    """
    Devuelve los top tracks del usuario autenticado.
    """
    data = await client.get_top_tracks(time_range=time_range, limit=limit)

    tracks = [
        TrackSchema(
            id=track["id"],
            name=track["name"],
            artists=[a["name"] for a in track.get("artists", [])],
            album_name=track["album"]["name"],
            album_image_url=(
                track["album"]["images"][0]["url"]
                if track["album"].get("images")
                else None
            ),
            popularity=track.get("popularity", 0),         # ← .get() con default
            duration_ms=track.get("duration_ms", 0),       # ← .get() con default
            spotify_url=track["external_urls"]["spotify"],
            preview_url=track.get("preview_url"),
        )
        for track in data.get("items", [])
    ]

    return TopTracksResponse(
        items=tracks,
        total=len(tracks),
        time_range=time_range,
    )


@router.get("/recently-played", response_model=RecentlyPlayedResponse)
async def get_recently_played(
    limit: int = Query(default=20, ge=1, le=50),
    client: SpotifyClient = Depends(get_spotify_client),
) -> RecentlyPlayedResponse:
    """
    Devuelve las últimas canciones escuchadas por el usuario.
    """
    data = await client.get_recently_played(limit=limit)

    tracks = [
        RecentlyPlayedTrackSchema(
            id=item["track"]["id"],
            name=item["track"]["name"],
            artists=[a["name"] for a in item["track"].get("artists", [])],
            album_name=item["track"]["album"]["name"],
            album_image_url=(
                item["track"]["album"]["images"][0]["url"]
                if item["track"]["album"].get("images")
                else None
            ),
            spotify_url=item["track"]["external_urls"]["spotify"],
            preview_url=item["track"].get("preview_url"),
            played_at=item["played_at"],
        )
        for item in data.get("items", [])
    ]

    return RecentlyPlayedResponse(items=tracks, total=len(tracks))