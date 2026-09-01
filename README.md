# ⛏️ MINESAFE 3D — Gemelo Digital Explicable (XAI) para Seguridad Minera

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![React 19](https://img.shields.io/badge/React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

Plataforma de **Gemelo Digital 3D Explicable (XAI)** para la predicción y prevención de colisiones en operaciones de minería a tajo abierto con flota mixta (Camiones de extracción manuales y sistemas AHS autónomos).

El sistema integra telemetría GNSS a 1 Hz, nubes de puntos LiDAR, monitoreo biológico de fatiga del operador (métricas PERCLOS) y conecta **Google Gemini API** a través de un backend en **FastAPI** como motor de inteligencia artificial y asistencia en tiempo real.

---

## 🚀 Características Principales

- **Visualización 3D en Tiempo Real (Three.js & WebGL)**: Renderizado de la topografía del tajo abierto, camiones de extracción (HT), palas mecánicas, zonas de riesgo y bermas.
- **Predicción de Riesgo de Colisión (Anticipación 6.4s)**: Anticipación predictiva superior frente a sistemas PDS tradicionales reactivos (1.8s).
- **IA Explicable (XAI - SHAP Values)**: Desglose transparente de los factores contribuyentes al riesgo (velocidad, pendiente, visibilidad, horas acumuladas del turno y nivel de fatiga).
- **Backend FastAPI con Google Gemini API**:
  - `analyze-risk`: Diagnóstico técnico de la causa raíz de alertas con Gemini.
  - `generate-summary`: Generación automática de informes ejecutivos HSE en formato PDF.
  - `chat`: Asistente interactivo en tiempo real integrado en la interfaz.
- **Módulo Ético y Consentimiento Informado**: Trazabilidad y gobernanza de datos biométricos de los operadores bajo estándar MSHA.
- **Despliegue Multi-Contenedor con Docker & Docker Compose**: Listo para producción con Nginx y FastAPI.

---

## 🏗️ Arquitectura del Sistema

```text
               ┌─────────────────────────────────────────┐
               │    Navegador Web (Usuario / HSE)       │
               │        http://localhost:3000            │
               └────────────────────┬────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │  Frontend (React 19 + Vite) │
                     │       Servido por Nginx     │
                     └──────────────┬──────────────┘
                                    │ HTTP / REST API
                                    ▼
                     ┌─────────────────────────────┐
                     │   Backend FastAPI (Python)  │
                     │        Puerto: 8000         │
                     └──────────────┬──────────────┘
                                    │ Google GenAI SDK
                                    ▼
                     ┌─────────────────────────────┐
                     │    Google Gemini API Engine │
                     └─────────────────────────────┘
```

---

## 🛠️ Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (con Docker Compose habilitado).
- [Git](https://git-scm.com/).
- Una clave de API de **Google Gemini** (`GEMINI_API_KEY`).

---

## ⚡ Inicio Rápido con Docker Compose (Recomendado)

### 1. Clonar el repositorio
```bash
git clone https://github.com/Prolexis/gemelo-digital-prototipo.git
cd gemelo-digital-prototipo
```

### 2. Configurar la clave de API de Gemini
Crea o edita el archivo `.env` en la raíz del proyecto:
```env
GEMINI_API_KEY="TU_CLAVE_DE_GEMINI_AQUI"
GEMINI_MODEL="gemini-2.5-flash"
VITE_API_URL="http://localhost:8000"
```

### 3. Levantar los contenedores
```bash
docker compose up -d --build
```

### 4. Acceder a la plataforma
- 🌐 **Frontend Gemelo Digital 3D**: [http://localhost:3000](http://localhost:3000)
- ⚙️ **Documentación API Swagger (FastAPI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 🔍 **Endpoint de Salud Gemini**: [http://localhost:8000/api/gemini/health](http://localhost:8000/api/gemini/health)

---

## 💻 Desarrollo Local (Sin Docker)

### Frontend (React + Vite)
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```
La aplicación se abrirá en `http://localhost:3000`.

### Backend (FastAPI + Python)
```bash
# Navegar a la carpeta backend
cd backend

# Instalar dependencias de Python
pip install -r requirements.txt

# Ejecutar servidor uvicorn
python main.py
```
El backend estará escuchando en `http://localhost:8000`.

---

## 📡 Endpoints del Backend FastAPI (`/api/gemini`)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/gemini/health` | Verifica el estado del motor backend y la clave API de Gemini. |
| `POST` | `/api/gemini/analyze-risk` | Realiza el análisis técnico de riesgo y explicabilidad XAI para un equipo. |
| `POST` | `/api/gemini/generate-summary` | Genera un resumen ejecutivo HSE para el turno de minería. |
| `POST` | `/api/gemini/chat` | Asistente interactivo en tiempo real sobre el estado de la mina. |

---

## 🛡️ Licencia y Seguridad

Desarrollado para la evaluación de tecnologías predictivas y prevención de fatalidades en la industria minera. 
Los datos biométricos de los operadores están anonimizados y protegidos bajo el estándar de consentimiento informado.
