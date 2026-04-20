"""
Gestión de JWT internos y cookies de sesión seguras.

Usamos JWT para encapsular los tokens de Spotify en una cookie HttpOnly.
Esto nos da:
1. Seguridad: la cookie no es accesible desde JavaScript (anti-XSS)
2. Renovación transparente: podemos refrescar el token de Spotify
   sin que el usuario lo note
"""
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from fastapi import Cookie, HTTPException, status

from app.core.config import settings


def create_session_token(data: dict[str, Any]) -> str:
    """
    Crea un JWT firmado con nuestro SECRET_KEY.
    `data` contendrá el access_token y refresh_token de Spotify,
    más el perfil básico del usuario.
    """
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload["exp"] = expire
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_session_token(token: str) -> dict[str, Any]:
    """
    Decodifica y valida el JWT de sesión.
    Lanza HTTPException si el token es inválido o ha expirado.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión inválida o expirada. Por favor, vuelve a iniciar sesión.",
        )


async def get_current_user(
    session_token: str | None = Cookie(default=None),
) -> dict[str, Any]:
    """
    Dependencia de FastAPI para proteger rutas.
    Se usa como: `user = Depends(get_current_user)`

    FastAPI inyecta automáticamente el valor de la cookie `session_token`.
    Si no existe o es inválida, lanza 401 antes de entrar al endpoint.
    """
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado. Por favor, inicia sesión.",
        )
    return decode_session_token(session_token)