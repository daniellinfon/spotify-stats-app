"""
Tools del agente LangGraph.

Cada tool es una función Python decorada con @tool de LangChain.
El agente decide autónomamente cuándo y cómo llamarlas basándose
en el contexto de la conversación.

Reciben el access_token del usuario como contexto — así cada
llamada actúa sobre los datos del usuario autenticado.
"""
from langchain_core.tools import tool
from app.services.spotify_client import SpotifyClient
import httpx
from app.core.config import settings


def create_spotify_tools(access_token: str) -> list:
    """
    Factory de tools que inyecta el access_token del usuario.
    Motivo: LangChain tools son funciones estáticas, pero necesitamos
    el token del usuario en cada llamada. La factory lo cierra en un closure.
    """

    @tool
    async def get_top_artists(time_range: str = "medium_term") -> str:
        """
        Obtiene los top artistas del usuario en Spotify.
        Úsala cuando el usuario pregunte por sus artistas favoritos,
        los que más escucha, o su gusto musical.
        
        Args:
            time_range: 'short_term' (4 semanas), 'medium_term' (6 meses), 'long_term' (siempre)
        """
        client = SpotifyClient(access_token)
        data = await client.get_top_artists(time_range=time_range, limit=10)
        artists = data.get("items", [])
        
        result = f"Top artistas ({time_range}):\n"
        for i, artist in enumerate(artists, 1):
            genres = ", ".join(artist.get("genres", [])[:2]) or "sin géneros"
            result += f"{i}. {artist['name']} (géneros: {genres})\n"
        return result

    @tool
    async def get_top_tracks(time_range: str = "medium_term") -> str:
        """
        Obtiene los top tracks del usuario en Spotify.
        Úsala cuando el usuario pregunte por sus canciones favoritas
        o las que más ha escuchado.
        
        Args:
            time_range: 'short_term' (4 semanas), 'medium_term' (6 meses), 'long_term' (siempre)
        """
        client = SpotifyClient(access_token)
        data = await client.get_top_tracks(time_range=time_range, limit=10)
        tracks = data.get("items", [])
        
        result = f"Top tracks ({time_range}):\n"
        for i, track in enumerate(tracks, 1):
            artists = ", ".join([a["name"] for a in track.get("artists", [])])
            result += f"{i}. {track['name']} - {artists}\n"
        return result

    @tool
    async def get_recently_played() -> str:
        """
        Obtiene las últimas canciones escuchadas por el usuario.
        Úsala cuando el usuario pregunte qué ha escuchado últimamente
        o su historial reciente.
        """
        client = SpotifyClient(access_token)
        data = await client.get_recently_played(limit=10)
        items = data.get("items", [])
        
        result = "Canciones escuchadas recientemente:\n"
        for i, item in enumerate(items, 1):
            track = item["track"]
            artists = ", ".join([a["name"] for a in track.get("artists", [])])
            result += f"{i}. {track['name']} - {artists}\n"
        return result

    @tool
    async def create_playlist(name: str, description: str, track_uris: list[str]) -> str:
        """
        Crea una playlist en Spotify con las canciones especificadas.
        Úsala cuando el usuario pida crear una playlist.
        Primero obtén los tracks relevantes con get_top_tracks,
        luego crea la playlist con sus URIs.
        
        Args:
            name: Nombre de la playlist
            description: Descripción de la playlist  
            track_uris: Lista de URIs de Spotify (formato: 'spotify:track:ID')
        """
        async with httpx.AsyncClient() as client:
            # 1. Obtener el ID del usuario
            me_response = await client.get(
                "https://api.spotify.com/v1/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            me_response.raise_for_status()
            user_id = me_response.json()["id"]

            # 2. Crear la playlist vacía
            playlist_response = await client.post(
                f"https://api.spotify.com/v1/users/{user_id}/playlists",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "name": name,
                    "description": description,
                    "public": False,
                },
            )
            playlist_response.raise_for_status()
            playlist = playlist_response.json()

            # 3. Añadir tracks a la playlist
            if track_uris:
                await client.post(
                    f"https://api.spotify.com/v1/playlists/{playlist['id']}/tracks",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json={"uris": track_uris[:50]},  # Spotify permite máx 100 por llamada
                )

        return (
            f"✅ Playlist '{name}' creada con {len(track_uris)} canciones. "
            f"Puedes verla en: {playlist['external_urls']['spotify']}"
        )

    return [get_top_artists, get_top_tracks, get_recently_played, create_playlist]