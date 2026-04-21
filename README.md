# 🎵 Spotify Stats App

Una aplicación web Full-Stack que permite autenticarse con Spotify, visualizar estadísticas avanzadas del perfil musical y chatear con un agente autónomo de IA capaz de analizar tus datos y crear playlists personalizadas.

---

## 📸 Características

- **Autenticación OAuth 2.0** con Spotify — flujo seguro con cookies HttpOnly y protección CSRF
- **Dashboard musical** — top artistas, top tracks y historial de escucha reciente
- **Agente DJ con IA** — conversación en tiempo real con streaming, capaz de:
  - Analizar tus gustos musicales
  - Responder preguntas sobre tus datos de Spotify
  - Crear playlists directamente en tu cuenta de Spotify

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Python 3.11 + FastAPI |
| Agente IA | LangGraph + LangChain + Groq (Llama 3.3) |
| Integración | Spotify Web API (httpx asíncrono) |
| Infraestructura | Docker + Docker Compose |

---

## 📁 Estructura del Proyecto

```
spotify-stats-app/
├── docker-compose.yml
├── .gitignore
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py                  # Entry point FastAPI
│       ├── api/v1/
│       │   ├── router.py            # Agrupador de rutas
│       │   └── endpoints/
│       │       ├── auth.py          # OAuth 2.0 con Spotify
│       │       ├── spotify.py       # Endpoints de datos
│       │       └── agent.py        # Chat con el agente
│       ├── core/
│       │   ├── config.py            # Configuración con Pydantic Settings
│       │   └── security.py         # JWT y gestión de sesión
│       ├── services/
│       │   ├── spotify_auth.py     # Lógica OAuth
│       │   └── spotify_client.py   # Cliente HTTP de Spotify
│       ├── agents/
│       │   ├── tools/
│       │   │   └── spotify_tools.py  # Tools del agente LangGraph
│       │   └── graph/
│       │       └── dj_agent.py     # Grafo LangGraph
│       └── schemas/
│           └── spotify.py          # Modelos Pydantic
│
└── frontend/
    ├── Dockerfile
    ├── Dockerfile.dev
    ├── nginx.conf
    └── src/
        ├── App.tsx                  # Routing y autenticación
        ├── pages/
        │   ├── LoginPage.tsx
        │   └── DashboardPage.tsx
        ├── components/
        │   ├── chat/
        │   │   └── ChatPanel.tsx   # UI del agente con streaming
        │   ├── charts/             # Visualizaciones Recharts
        │   └── layout/
        │       └── Navbar.tsx
        ├── hooks/
        │   └── useSpotifyData.ts   # Custom hooks para la API
        ├── services/
        │   └── api.ts              # Cliente axios configurado
        └── store/
            └── authStore.ts        # Estado global con Zustand
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución
- Cuenta de [Spotify Developer](https://developer.spotify.com/dashboard)
- Cuenta de [Google AI Studio](https://aistudio.google.com) o [Groq](https://console.groq.com)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/spotify-stats-app.git
cd spotify-stats-app
```

### 2. Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env` con tus credenciales:

```dotenv
# Spotify Developer App (https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/api/v1/auth/callback

# Seguridad JWT — genera con: openssl rand -hex 32
SECRET_KEY=tu_secret_key

# IA — Groq (https://console.groq.com)
GROQ_API_KEY=gsk_...

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
```

### 3. Configurar la app de Spotify

En el [Dashboard de Spotify](https://developer.spotify.com/dashboard):

1. Crea una nueva app
2. En **Settings**, añade el Redirect URI: `http://127.0.0.1:8000/api/v1/auth/callback`
3. Activa la opción **Web API**

### 4. Levantar el proyecto

```bash
docker compose up --build
```

### 5. Acceder a la aplicación

| Servicio | URL |
|---|---|
| Frontend | http://127.0.0.1:5173 |
| Backend API | http://127.0.0.1:8000 |
| Documentación API | http://127.0.0.1:8000/docs |
| Health check | http://127.0.0.1:8000/api/v1/health |

---

## 🔐 Flujo de Autenticación

```
Usuario → /auth/login → Spotify OAuth → /auth/callback
       → JWT firmado en cookie HttpOnly → Dashboard
```

La sesión se gestiona mediante un JWT propio que encapsula los tokens de Spotify. La cookie es `HttpOnly` (inaccesible desde JavaScript) para protección contra XSS.

---

## 🤖 El Agente DJ

El agente está construido con **LangGraph** y usa un modelo **Llama 3.3** a través de Groq. Funciona como un grafo de estados con dos nodos:

- **Nodo agent** — el LLM decide si responder o llamar a una tool
- **Nodo tools** — ejecuta la tool seleccionada y devuelve el resultado

### Tools disponibles

| Tool | Descripción |
|---|---|
| `get_top_artists` | Top artistas del usuario por periodo |
| `get_top_tracks` | Top tracks del usuario con URIs |
| `get_recently_played` | Historial de escucha reciente |
| `create_playlist` | Crea una playlist en la cuenta del usuario |

### Ejemplos de uso

```
"¿Cuáles son mis artistas favoritos del último mes?"
"¿Qué canciones he escuchado más en los últimos 6 meses?"
"Crea una playlist con mis top 10 canciones de siempre"
"¿Qué he escuchado recientemente?"
```

---

## 📡 Endpoints de la API

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/auth/login` | Inicia el flujo OAuth con Spotify |
| `GET` | `/api/v1/auth/callback` | Callback de Spotify |
| `GET` | `/api/v1/auth/me` | Perfil del usuario autenticado |
| `POST` | `/api/v1/auth/logout` | Cierra la sesión |

### Datos de Spotify

| Método | Ruta | Parámetros |
|---|---|---|
| `GET` | `/api/v1/spotify/top-artists` | `time_range`, `limit` |
| `GET` | `/api/v1/spotify/top-tracks` | `time_range`, `limit` |
| `GET` | `/api/v1/spotify/recently-played` | `limit` |

### Agente

| Método | Ruta | Body |
|---|---|---|
| `POST` | `/api/v1/agent/chat` | `{message, history}` |

---

## 🧰 Comandos útiles

```bash
# Levantar en desarrollo (con hot-reload)
docker compose up

# Levantar y reconstruir imágenes
docker compose up --build

# Parar todos los contenedores
docker compose down

# Ver logs del backend
docker logs spotify_stats_backend -f

# Ver logs del frontend
docker logs spotify_stats_frontend -f

# Entrar al contenedor del backend
docker exec -it spotify_stats_backend bash
```

---

## 🏗️ Decisiones Arquitectónicas

**Monorepo** — frontend y backend en el mismo repositorio para simplificar Docker Compose y la gestión de variables de entorno.

**App Factory en FastAPI** — `create_application()` separa la creación de la app de su instanciación, facilitando el testing.

**Pydantic Settings** — todas las variables de entorno están tipadas. Si falta una variable crítica, la app falla en startup con un error claro, no en runtime.

**Cookie HttpOnly para la sesión** — más seguro que localStorage, que es vulnerable a XSS. El JWT encapsula los tokens de Spotify para renovación transparente.

**httpx asíncrono** — en lugar de `requests` (síncrono) para no bloquear el event loop de FastAPI durante las llamadas a la API de Spotify.

**LangGraph sobre AgentExecutor** — permite control explícito del flujo del agente, nodos de validación y memoria de conversación mediante el reducer `add_messages`.

**Factory de tools con closure** — cada usuario obtiene sus propias tools con su `access_token` inyectado, evitando que los tokens se mezclen entre usuarios.

---

## 📝 Variables de Entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `SPOTIFY_CLIENT_ID` | Client ID de tu app de Spotify | ✅ |
| `SPOTIFY_CLIENT_SECRET` | Client Secret de tu app de Spotify | ✅ |
| `SPOTIFY_REDIRECT_URI` | URI de callback OAuth | ✅ |
| `SECRET_KEY` | Clave para firmar JWT (openssl rand -hex 32) | ✅ |
| `GROQ_API_KEY` | API Key de Groq | ✅ |
| `BACKEND_CORS_ORIGINS` | Orígenes permitidos para CORS | ✅ |

---

## 📄 Licencia

MIT License — libre para uso personal y educativo.
