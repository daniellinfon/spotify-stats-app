"""
Tools del agente LangGraph.
"""
import asyncio
import httpx
import concurrent.futures
from langchain_core.tools import tool
from app.services.spotify_client import SpotifyClient


def run_async(coro):
    """
    Ejecuta una corrutina async de forma segura desde código síncrono,
    incluso si hay un event loop corriendo (como en FastAPI).
    """
    with concurrent.futures.ThreadPoolExecutor() as pool:
        future = pool.submit(asyncio.run, coro)
        return future.result()


def create_spotify_tools(access_token: str) -> list:

    @tool
    def get_top_artists(time_range: str = "medium_term") -> str:
        """
        Obtiene los top artistas del usuario en Spotify.
        Úsala cuando el usuario pregunte por sus artistas favoritos.

        Args:
            time_range: 'short_term' (4 semanas), 'medium_term' (6 meses), 'long_term' (siempre)
        """
        client = SpotifyClient(access_token)
        data = run_async(client.get_top_artists(time_range=time_range, limit=10))
        artists = data.get("items", [])

        result = f"Top artistas ({time_range}):\n"
        for i, artist in enumerate(artists, 1):
            genres = ", ".join(artist.get("genres", [])[:2]) or "sin géneros"
            result += f"{i}. {artist['name']} (géneros: {genres})\n"
        return result

    @tool
    def get_top_tracks(time_range: str = "medium_term") -> str:
        """
        Obtiene los top tracks del usuario en Spotify.
        Úsala cuando el usuario pregunte por sus canciones favoritas.
        Devuelve también los URIs necesarios para crear playlists.

        Args:
            time_range: 'short_term' (4 semanas), 'medium_term' (6 meses), 'long_term' (siempre)
        """
        client = SpotifyClient(access_token)
        data = run_async(client.get_top_tracks(time_range=time_range, limit=10))
        tracks = data.get("items", [])

        result = f"Top tracks ({time_range}):\n"
        for i, track in enumerate(tracks, 1):
            artists = ", ".join([a["name"] for a in track.get("artists", [])])
            uri = f"spotify:track:{track['id']}"
            result += f"{i}. {track['name']} - {artists} (URI: {uri})\n"
        return result

    @tool
    def get_recently_played() -> str:
        """
        Obtiene las últimas canciones escuchadas por el usuario.
        Úsala cuando el usuario pregunte qué ha escuchado últimamente.
        """
        client = SpotifyClient(access_token)
        data = run_async(client.get_recently_played(limit=10))
        items = data.get("items", [])

        result = "Canciones escuchadas recientemente:\n"
        for i, item in enumerate(items, 1):
            track = item["track"]
            artists = ", ".join([a["name"] for a in track.get("artists", [])])
            result += f"{i}. {track['name']} - {artists}\n"
        return result

    @tool
    def create_playlist(name: str, description: str, track_uris: str) -> str:
        """
        Crea una playlist en Spotify con las canciones especificadas.
        Úsala cuando el usuario pida crear una playlist.
        Primero obtén los tracks con get_top_tracks, luego usa sus URIs.

        Args:
            name: Nombre de la playlist
            description: Descripción de la playlist
            track_uris: URIs de Spotify separados por comas (formato: 'spotify:track:ID1,spotify:track:ID2')
        """
        uris = [uri.strip() for uri in track_uris.split(",") if uri.strip()]

        async def _create():
            async with httpx.AsyncClient() as http:
                me_response = await http.get(
                    "https://api.spotify.com/v1/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                me_response.raise_for_status()
                user_id = me_response.json()["id"]

                playlist_response = await http.post(
                    f"https://api.spotify.com/v1/users/{user_id}/playlists",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json={"name": name, "description": description, "public": False},
                )
                playlist_response.raise_for_status()
                playlist = playlist_response.json()

                if uris:
                    await http.post(
                        f"https://api.spotify.com/v1/playlists/{playlist['id']}/tracks",
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Content-Type": "application/json",
                        },
                        json={"uris": uris[:50]},
                    )
                return playlist

        playlist = run_async(_create())
        return (
            f"✅ Playlist '{name}' creada con {len(uris)} canciones. "
            f"Puedes verla en: {playlist['external_urls']['spotify']}"
        )

    return [get_top_artists, get_top_tracks, get_recently_played, create_playlist]