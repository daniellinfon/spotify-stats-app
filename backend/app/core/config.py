"""
Gestión de configuración con Pydantic Settings.

Por qué Pydantic Settings sobre python-dotenv puro:
- Tipado estático: si SPOTIFY_CLIENT_ID no está definido, falla en startup,
  no en runtime cuando ya hay usuarios conectados.
- Validación automática: puedes añadir @validator para comprobar formatos.
- Autocompletado en el IDE para todas las variables de configuración.
"""
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # --- Proyecto ---
    PROJECT_NAME: str = "Spotify AI DJ"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # --- CORS ---
    # En .env: BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:80"]
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = ["http://localhost:5173"]

    # --- Spotify OAuth ---
    SPOTIFY_CLIENT_ID: str
    SPOTIFY_CLIENT_SECRET: str
    SPOTIFY_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/callback"

    # --- JWT (para nuestra sesión interna) ---
    SECRET_KEY: str  # Generar con: openssl rand -hex 32
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- IA ---
    GOOGLE_API_KEY: str

    # Pydantic v2: indicamos dónde leer el .env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


# Singleton: importamos `settings` en el resto de la app
settings = Settings()