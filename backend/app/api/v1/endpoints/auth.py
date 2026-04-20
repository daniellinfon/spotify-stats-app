"""
Endpoints del flujo OAuth 2.0 con Spotify.

Flujo completo:
1. GET /login      → genera state CSRF, redirige a Spotify
2. GET /callback   → Spotify llama aquí con el code, intercambiamos por tokens
3. GET /me         → devuelve el perfil del usuario autenticado (ruta protegida)
4. POST /logout    → elimina la cookie de sesión
"""
import secrets

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import RedirectResponse

from app.core.security import create_session_token, get_current_user
from app.services.spotify_auth import (
    exchange_code_for_tokens,
    generate_auth_url,
    get_spotify_user_profile,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Almacenamiento temporal del state CSRF.
# En producción usaríamos Redis. Para desarrollo, una variable en memoria es suficiente.
# El state se genera por petición y se invalida tras el callback.
_pending_states: set[str] = set()


@router.get("/login")
async def spotify_login() -> RedirectResponse:
    """
    Inicia el flujo OAuth. El frontend redirige al usuario a este endpoint.
    Generamos un `state` aleatorio para prevenir ataques CSRF.
    """
    state = secrets.token_urlsafe(32)
    _pending_states.add(state)
    auth_url = generate_auth_url(state)
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def spotify_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    response: Response = None,
) -> RedirectResponse:
    """
    Callback que llama Spotify tras la autorización del usuario.
    1. Validamos el state (anti-CSRF)
    2. Intercambiamos el code por tokens
    3. Obtenemos el perfil del usuario
    4. Creamos nuestro JWT de sesión
    5. Lo guardamos en una cookie HttpOnly y redirigimos al dashboard
    """
    # El usuario denegó el acceso en Spotify
    if error:
        return RedirectResponse(url=f"http://localhost:5173?error={error}")

    # Validación CSRF: el state debe existir en nuestros pendientes
    if not state or state not in _pending_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="State inválido. Posible ataque CSRF.",
        )
    _pending_states.discard(state)  # Invalidamos el state: uso único

    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se recibió el código de autorización.",
        )

    # Intercambiar code por tokens de Spotify
    tokens = await exchange_code_for_tokens(code)

    # Obtener perfil del usuario con el access token recién obtenido
    profile = await get_spotify_user_profile(tokens["access_token"])

    # Crear nuestro JWT de sesión encapsulando todo
    session_data = {
        "spotify_access_token": tokens["access_token"],
        "spotify_refresh_token": tokens.get("refresh_token"),
        "spotify_token_expires_in": tokens.get("expires_in", 3600),
        "user_id": profile["id"],
        "display_name": profile.get("display_name", "Usuario"),
        "email": profile.get("email", ""),
        "avatar_url": (
            profile["images"][0]["url"] if profile.get("images") else None
        ),
    }
    session_token = create_session_token(session_data)

    # Redirigir al frontend con la cookie establecida
    redirect = RedirectResponse(
        url="http://localhost:5173/dashboard",
        status_code=status.HTTP_302_FOUND,
    )
    redirect.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,       # No accesible desde JavaScript (anti-XSS)
        secure=False,        # True en producción (requiere HTTPS)
        samesite="lax",      # Protección CSRF adicional
        max_age=60 * 60,     # 1 hora (igual que el token de Spotify)
        path="/",
    )
    return redirect


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Ruta protegida: devuelve el perfil del usuario autenticado.
    `Depends(get_current_user)` verifica automáticamente la cookie
    antes de ejecutar esta función.
    """
    return {
        "user_id": current_user.get("user_id"),
        "display_name": current_user.get("display_name"),
        "email": current_user.get("email"),
        "avatar_url": current_user.get("avatar_url"),
    }


@router.post("/logout")
async def logout() -> RedirectResponse:
    """Elimina la cookie de sesión. Simple y efectivo."""
    response = RedirectResponse(
        url="http://localhost:5173",
        status_code=status.HTTP_302_FOUND,
    )
    response.delete_cookie(key="session_token", path="/")
    return response