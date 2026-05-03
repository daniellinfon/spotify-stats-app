"""
Tools del agente LangGraph.
"""
import asyncio
import concurrent.futures
import httpx
from langchain_core.tools import tool
from app.services.spotify_client import SpotifyClient


def run_async(coro):
    with concurrent.futures.ThreadPoolExecutor() as pool:
        future = pool.submit(asyncio.run, coro)
        return future.result()


def create_spotify_tools(access_token: str) -> list:

    @tool
    def get_top_artists(time_range: str) -> str:
        """
        Obtiene los artistas mas escuchados del usuario.
        Args:
            time_range: periodo de tiempo. Valores posibles: short_term, medium_term, long_term
        """
        client = SpotifyClient(access_token)
        data = run_async(client.get_top_artists(time_range=time_range, limit=10))
        artists = data.get("items", [])
        if not artists:
            return "No se encontraron artistas."
        result = f"Top artistas ({time_range}):\n"
        for i, artist in enumerate(artists, 1):
            result += f"{i}. {artist['name']}\n"
        return result

    @tool
    def get_top_tracks(time_range: str) -> str:
        """
        Obtiene las canciones mas escuchadas del usuario.
        Args:
            time_range: periodo de tiempo. Valores posibles: short_term, medium_term, long_term
        """
        client = SpotifyClient(access_token)
        data = run_async(client.get_top_tracks(time_range=time_range, limit=10))
        tracks = data.get("items", [])
        if not tracks:
            return "No se encontraron canciones."
        result = f"Top canciones ({time_range}):\n"
        for i, track in enumerate(tracks, 1):
            artists = ", ".join([a["name"] for a in track.get("artists", [])])
            uri = f"spotify:track:{track['id']}"
            result += f"{i}. {track['name']} - {artists} | URI: {uri}\n"
        return result

    @tool
    def get_recently_played() -> str:
        """
        Obtiene las ultimas canciones escuchadas por el usuario recientemente.
        No necesita parametros.
        """
        client = SpotifyClient(access_token)
        data = run_async(client.get_recently_played(limit=10))
        items = data.get("items", [])
        if not items:
            return "No se encontraron canciones recientes."
        result = "Canciones escuchadas recientemente:\n"
        for i, item in enumerate(items, 1):
            track = item["track"]
            artists = ", ".join([a["name"] for a in track.get("artists", [])])
            result += f"{i}. {track['name']} - {artists}\n"
        return result

    @tool
    def create_playlist(name: str, description: str, track_uris: str) -> str:
        """
        Crea una playlist en Spotify. Primero usa get_top_tracks para obtener los URIs.
        Args:
            name: nombre de la playlist
            description: descripcion de la playlist
            track_uris: URIs separados por comas, ejemplo: spotify:track:ABC,spotify:track:XYZ
        """
        uris = [u.strip() for u in track_uris.split(",") if u.strip()]

        async def _create():
            async with httpx.AsyncClient() as http:
                me = await http.get(
                    "https://api.spotify.com/v1/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                me.raise_for_status()
                user_id = me.json()["id"]

                pl = await http.post(
                    f"https://api.spotify.com/v1/users/{user_id}/playlists",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json={"name": name, "description": description, "public": False},
                )
                pl.raise_for_status()
                playlist = pl.json()

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
            f"Playlist '{name}' creada con {len(uris)} canciones. "
            f"Link: {playlist['external_urls']['spotify']}"
        )

    return [get_top_artists, get_top_tracks, get_recently_played, create_playlist]