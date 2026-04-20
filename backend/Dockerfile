# =============================================
# Dockerfile del Backend (FastAPI)
# =============================================

# Usamos slim para reducir tamaño. No usamos alpine porque las dependencias
# criptográficas (python-jose) tienen problemas de compilación en musl libc.
FROM python:3.11-slim

# Variables de entorno de Python:
# PYTHONDONTWRITEBYTECODE: evita archivos .pyc innecesarios
# PYTHONUNBUFFERED: logs en tiempo real (crítico para debugging en Docker)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Añade el directorio de la app al PYTHONPATH para imports absolutos
    PYTHONPATH=/app

WORKDIR /app

# Instalamos dependencias del sistema necesarias para algunas libs criptográficas
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiamos requirements ANTES del código fuente.
# Razón: Docker cachea capas. Si solo cambia el código (no deps),
# Docker reutiliza la capa de pip install → builds mucho más rápidos.
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Ahora sí copiamos el código
COPY ./app ./app

EXPOSE 8000

# En desarrollo, uvicorn con --reload. En producción, usaríamos gunicorn.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]