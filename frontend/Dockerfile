# =============================================
# Dockerfile del Frontend (React/Vite) — Multi-Stage Build
# =============================================

# STAGE 1: Builder
# Compilamos la app de React en archivos estáticos optimizados
FROM node:20-alpine AS builder

WORKDIR /app

# Misma estrategia de caché de Docker: primero dependencias, luego código
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build

# =============================================
# STAGE 2: Production Server
# Solo copiamos el output del build (dist/) a una imagen nginx mínima.
# Resultado: imagen de ~25MB en vez de ~900MB con node.
# =============================================
FROM nginx:1.27-alpine AS production

# Copiamos nuestra configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos estáticos del stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]