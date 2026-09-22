# experiments/Dockerfile
# Imagen de reproducibilidad científica autónoma para MineSafe 3D
FROM python:3.11-slim

# Evitar escritura de bytecode y habilitar buffer en tiempo real
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/workspace

# Instalar dependencias del sistema mínimas para compilación y utilidades
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copiar e instalar dependencias con lockfile exacto
COPY experiments/requirements.lock /workspace/experiments/requirements.lock
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r experiments/requirements.lock

# Copiar el submódulo de experimentos y código de referencia
COPY experiments /workspace/experiments

# Punto de entrada predeterminado: ejecución del pipeline completo
CMD ["python", "experiments/run_all.py"]
