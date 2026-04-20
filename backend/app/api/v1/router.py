"""
Router principal de la API v1.
Cada dominio tiene su propio router que se incluye aquí.
Esto permite activar/desactivar funcionalidades completas con una línea.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, spotify

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(spotify.router)

@api_router.get("/health", tags=["Infrastructure"])
async def health_check() -> dict:
    return {"status": "ok", "version": "0.1.0"}