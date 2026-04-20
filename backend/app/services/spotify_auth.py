"""
Capa de servicio para el flujo OAuth de Spotify.

Separamos la lógica de negocio (este archivo) de la capa HTTP (endpoints/auth.py).
Motivo: si mañana cambiamos FastAPI por otro framework, la lógica OAuth no cambia.
"""
import secrets
from urllib.parse import urlencode

import httpx

from app.core.config import settings

# Scopes que necesitamos del usuario.
# Principio de mínimo privilegio: solo pedimos lo estrictamente necesario.
SPOTIFY_SCOPES = [
    "user-read-private",           # Perfil del usuario
    "user-read-email",             # Email
    "user-top-read",               # Top artists y tracks
    "playlist-modify-public",      # Crear playlists públicas (Fase 5)
    "playlist-modify-private",     # Crear playlists privadas (Fase 5)
    "user-read-recently-played",
]

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"


def generate_auth_url(state: str) -> str:
    """
    Genera la URL de autorización de Spotify.
    El parámetro `state` es un token aleatorio que protege contra ataques CSRF:
    enviamos un valor, Spotify nos lo devuelve, y verificamos que coincide.
    """
    params = {
        "client_id": settings.SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.SPOTIFY_REDIRECT_URI,
        "scope": " ".join(SPOTIFY_SCOPES),
        "state": state,
        "show_dialog": "false",  # True forzaría login cada vez (útil en dev)
    }
    return f"{SPOTIFY_AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_tokens(code: str) -> dict:
    """
    Intercambia el authorization code por access_token y refresh_token.
    Usamos httpx (async) en lugar de requests (sync) para no bloquear
    el event loop de FastAPI durante la llamada HTTP.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            SPOTIFY_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.SPOTIFY_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            auth=(settings.SPOTIFY_CLIENT_ID, settings.SPOTIFY_CLIENT_SECRET),
        )
        response.raise_for_status()
        return response.json()


async def refresh_access_token(refresh_token: str) -> dict:
    """
    Renueva el access_token usando el refresh_token.
    Los access tokens de Spotify expiran en 3600 segundos (1 hora).
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            SPOTIFY_TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            auth=(settings.SPOTIFY_CLIENT_ID, settings.SPOTIFY_CLIENT_SECRET),
        )
        response.raise_for_status()
        return response.json()


async def get_spotify_user_profile(access_token: str) -> dict:
    """Obtiene el perfil básico del usuario autenticado en Spotify."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.spotify.com/v1/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return response.json()