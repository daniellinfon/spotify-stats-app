spotify-ai-dj/
├── .gitignore
├── README.md
├── docker-compose.yml          # Para desarrollo (con hot-reload)
├── docker-compose.prod.yml     # Para producción (imágenes optimizadas)
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example            # Plantilla de variables (NUNCA el .env real)
│   └── app/
│       ├── main.py             # Entry point de FastAPI
│       ├── api/
│       │   └── v1/
│       │       ├── router.py   # Agrupador principal de rutas
│       │       └── endpoints/  # Un archivo por dominio (auth, spotify, agent)
│       ├── core/
│       │   ├── config.py       # Pydantic Settings (variables de entorno tipadas)
│       │   └── security.py     # JWT, cookies seguras
│       ├── services/
│       │   └── spotify_client.py  # Capa de abstracción sobre la API de Spotify
│       ├── agents/
│       │   ├── tools/          # Herramientas del agente LangGraph
│       │   └── graph/          # Definición del grafo LangGraph
│       └── schemas/            # Modelos Pydantic para request/response
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── components/
        │   ├── charts/         # Visualizaciones D3/Recharts
        │   ├── chat/           # UI del agente
        │   └── layout/         # Navbar, Sidebar, etc.
        ├── pages/              # Vistas (Dashboard, Login, Chat)
        ├── hooks/              # Custom hooks (useSpotifyData, useAgent)
        ├── services/           # Llamadas a la API (axios/fetch)
        ├── store/              # Estado global (Zustand)
        └── types/              # TypeScript interfaces