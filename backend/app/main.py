"""
Entry point de la aplicación FastAPI.

Decisión: Separamos la creación de la app (create_application) de su
instanciación. Esto facilita enormemente el testing (puedes importar
la factory sin levantar el servidor) y sigue el patrón "Application Factory"
común en frameworks como Flask pero aplicado a FastAPI.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiona el ciclo de vida de la aplicación.
    Aquí inicializaremos conexiones a BD, clientes HTTP, etc.
    'yield' separa el startup del shutdown.
    """
    # --- STARTUP ---
    print("🚀 Spotify AI DJ Backend arrancando...")
    yield
    # --- SHUTDOWN ---
    print("🛑 Spotify AI DJ Backend apagándose...")


def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Backend para Spotify AI DJ & Analytics",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan,
    )

    # CORS: Configuración estricta por entorno
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,  # Necesario para cookies de sesión
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix=settings.API_V1_STR)

    return application


app = create_application()