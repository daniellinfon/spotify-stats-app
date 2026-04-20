"""
Cliente de la API de Spotify.

Encapsula todas las llamadas a la API de Spotify usando httpx asíncrono.
Recibe el access_token del usuario y lo usa en cada petición.

Por qué no usamos spotipy aquí:
- spotipy es síncrono, bloquearía el event loop de FastAPI
- httpx es asíncrono y se integra perfectamente
- Tenemos control total sobre los datos que procesamos
"""
import httpx
from fastapi import HTTPException, status

SPOTIFY_API_BASE = "https://api.spotify.com/v1"


class SpotifyClient:
    """
    Cliente HTTP asíncrono para la API de Spotify.
    Se instancia por request con el token del usuario actual.
    """

    def __init__(self, access_token: str):
        self.headers = {"Authorization": f"Bearer {access_token}"}

    async def _get(self, endpoint: str, params: dict = None) -> dict:
        """
        Método base para peticiones GET.
        Centraliza el manejo de errores: si Spotify devuelve 401
        (token expirado) lo convertimos en un error claro para el cliente.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SPOTIFY_API_BASE}{endpoint}",
                headers=self.headers,
                params=params or {},
            )

            if response.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token de Spotify expirado. Por favor, vuelve a iniciar sesión.",
                )
            if response.status_code == 403:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permisos para acceder a este recurso.",
                )

            response.raise_for_status()
            return response.json()

    async def get_top_artists(
        self,
        time_range: str = "medium_term",
        limit: int = 20,
    ) -> dict:
        """
        Obtiene los top artistas del usuario.
        time_range: short_term (4 sem) | medium_term (6 meses) | long_term (años)
        """
        return await self._get(
            "/me/top/artists",
            params={"time_range": time_range, "limit": limit},
        )

    async def get_top_tracks(
        self,
        time_range: str = "medium_term",
        limit: int = 20,
    ) -> dict:
        """Obtiene los top tracks del usuario."""
        return await self._get(
            "/me/top/tracks",
            params={"time_range": time_range, "limit": limit},
        )

    async def get_recently_played(self, limit: int = 20) -> dict:
        """
        Obtiene las últimas canciones escuchadas por el usuario.
        Límite máximo de Spotify: 50.
        """
        return await self._get(
            "/me/player/recently-played",
            params={"limit": limit},
        )