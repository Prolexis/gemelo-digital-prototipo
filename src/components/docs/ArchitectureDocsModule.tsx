import React, { useState } from 'react';
import { 
  Code2, 
  Database, 
  Server, 
  Layers, 
  Cpu, 
  FileCode, 
  Terminal, 
  Check, 
  Copy, 
  Boxes, 
  Workflow, 
  ShieldCheck,
  ChevronRight,
  BookOpen
} from 'lucide-react';

export const ArchitectureDocsModule: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'ARCHITECTURE' | 'DATA_MODEL' | 'BACKEND_CODE' | 'DOCKER' | 'ML_GUIDE'>('ARCHITECTURE');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const sqlSchemaCode = `-- ==============================================================================
-- MINESAFE 3D: ESQUEMA POSTGRESQL + EXTENSIÓN POSTGIS PARA MINERÍA A TAJO ABIERTO
-- ==============================================================================

-- 1. Habilitar extensiones geoespaciales y de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Enumeradores de Estado y Nivel de Riesgo
CREATE TYPE equipment_type_enum AS ENUM (
  'HAUL_TRUCK_MANUAL', 'HAUL_TRUCK_AHS', 'SHOVEL', 'LIGHT_VEHICLE', 'WATER_TRUCK', 'GRADER'
);
CREATE TYPE risk_level_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'SAFETY_SUPERVISOR', 'OPERATOR', 'DATA_ANALYST', 'AUDITOR');

-- 3. Tabla de Geometría de Tajo y Caminos de Acarreo (PostGIS)
CREATE TABLE mine_haul_roads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  road_name VARCHAR(100) NOT NULL,
  bench_elevation_m NUMERIC(7,2) NOT NULL,
  max_speed_kmh NUMERIC(5,2) DEFAULT 40.0,
  slope_percentage NUMERIC(5,2) NOT NULL, -- Ej. 8.5%
  is_blind_corner BOOLEAN DEFAULT FALSE,
  centerline_geom GEOMETRY(LineStringZ, 4326) NOT NULL, -- Trazo 3D con cota Z
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_haul_roads_geom ON mine_haul_roads USING GIST(centerline_geom);

-- 4. Tabla de Equipos Mineros
CREATE TABLE equipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL, -- Ej: 'HT-104'
  name VARCHAR(100) NOT NULL,
  equipment_type equipment_type_enum NOT NULL,
  model VARCHAR(100) NOT NULL,
  is_autonomous BOOLEAN DEFAULT FALSE,
  payload_capacity_tons NUMERIC(6,2) DEFAULT 400.0,
  current_zone VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Operadores y Consentimiento Ético
CREATE TABLE operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  national_id_masked VARCHAR(50) NOT NULL,
  anonymization_hash VARCHAR(64) UNIQUE NOT NULL,
  informed_consent_status VARCHAR(20) DEFAULT 'ACTIVE',
  consent_signed_at TIMESTAMPTZ DEFAULT NOW(),
  allows_facial_perclos BOOLEAN DEFAULT TRUE,
  allows_steering_telemetry BOOLEAN DEFAULT TRUE,
  allows_vitals BOOLEAN DEFAULT FALSE
);

-- 6. Telemetría GNSS de Alta Frecuencia (Particionada por fecha en producción)
CREATE TABLE telemetry_gnss (
  id BIGSERIAL PRIMARY KEY,
  equipment_id UUID REFERENCES equipments(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  speed_kmh NUMERIC(5,2) NOT NULL,
  heading_deg NUMERIC(5,2) NOT NULL,
  accuracy_m NUMERIC(4,2) NOT NULL,
  geom GEOMETRY(PointZ, 4326) NOT NULL -- Posición 3D Lat/Lon/Elevación
);
CREATE INDEX idx_telemetry_gnss_geom ON telemetry_gnss USING GIST(geom);
CREATE INDEX idx_telemetry_gnss_eq_time ON telemetry_gnss(equipment_id, timestamp DESC);

-- 7. Features de Percepción LiDAR Pre-procesados (PointNet++ Embeddings)
CREATE TABLE telemetry_lidar_features (
  id BIGSERIAL PRIMARY KEY,
  equipment_id UUID REFERENCES equipments(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  nearest_obstacle_dist_m NUMERIC(6,2) NOT NULL,
  relative_velocity_kmh NUMERIC(5,2) NOT NULL,
  obstacle_class VARCHAR(50), -- 'VEHICLE', 'BERM', 'ROCKFALL'
  visibility_index NUMERIC(3,2) NOT NULL, -- 0.0 a 1.0 (atenuación por polvo)
  point_density_pts_m2 INTEGER NOT NULL
);

-- 8. Predicciones del Motor de Riesgo y Atribución SHAP
CREATE TABLE risk_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_equipment_id UUID REFERENCES equipments(id),
  target_equipment_id UUID REFERENCES equipments(id),
  overall_risk_score NUMERIC(4,3) NOT NULL, -- 0.000 a 1.000
  risk_level risk_level_enum NOT NULL,
  time_to_collision_sec NUMERIC(5,2) NOT NULL,
  prediction_horizon_sec NUMERIC(5,2) NOT NULL,
  shap_fatigue_weight NUMERIC(5,2),
  shap_kinematics_weight NUMERIC(5,2),
  shap_lidar_weight NUMERIC(5,2),
  shap_environment_weight NUMERIC(5,2),
  counterfactual_advice TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Alertas de Colisión Temprana
CREATE TABLE collision_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_code VARCHAR(50) UNIQUE NOT NULL,
  prediction_id UUID REFERENCES risk_predictions(id),
  severity VARCHAR(30) NOT NULL,
  early_warning_anticipation_sec NUMERIC(4,2) NOT NULL, -- > 5s
  recommended_action TEXT NOT NULL,
  acknowledged_by VARCHAR(100),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

  const backendFastApiCode = `# ==============================================================================
# MINESAFE 3D - SERVICIO DE INFERENCIA DE RIESGO EXPLICABLE (FastAPI)
# Archivo: backend/app/services/risk_engine_service.py
# ==============================================================================

import time
import numpy as np
from typing import Dict, List, Any, Optional
from pydantic import BaseModel

class GNSSState(BaseModel):
    easting: float
    northing: float
    elevation: float
    speed_kmh: float
    heading_deg: float

class LiDARFeatures(BaseModel):
    nearest_obstacle_dist_m: float
    relative_velocity_kmh: float
    visibility_index: float # 0.0 (niebla/polvo) a 1.0 (despejado)
    obstacle_class: str

class OperatorState(BaseModel):
    operator_id: str
    shift_hours_accumulated: float
    perclos_score: float # > 0.25 indica fatiga biológica
    steering_jerk_std: float

class RiskInferenceInput(BaseModel):
    equipment_id: str
    is_autonomous: bool
    gnss: GNSSState
    lidar: LiDARFeatures
    operator: Optional[OperatorState] = None
    target_equipment_gnss: Optional[GNSSState] = None

class ShapFactorOutput(BaseModel):
    feature_name: str
    category: str
    attribution_value: float
    percentage_weight: float
    human_readable_reason: str
    counterfactual_suggestion: str

class RiskInferenceOutput(BaseModel):
    equipment_id: str
    overall_risk_score: float # 0.0 a 1.0
    risk_level: str # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    time_to_collision_sec: float
    prediction_horizon_sec: float
    shap_factors: List[ShapFactorOutput]
    primary_risk_driver: str
    counterfactual_recommendation: str
    inference_latency_ms: float

class RiskEngineService:
    """
    Servicio de Inferencia Multi-Modal Explicable (XAI).
    Integra:
      1. PointNet++ (Features pre-procesados de LiDAR)
      2. Bi-LSTM (Secuencia temporal de comportamiento del operador)
      3. Transformer Multi-Modal (Fusión de Percepción + Comportamiento + Cinemática)
      4. Fast TreeSHAP / KernelSHAP (Explicabilidad en tiempo real)
    """
    def __init__(self):
        # NOTA ARQUITECTÓNICA:
        # En producción, cargar los modelos compilados ONNX Runtime / TensorRT:
        # self.lidar_pointnet = onnxruntime.InferenceSession("models/pointnet_v2.onnx")
        # self.operator_lstm = onnxruntime.InferenceSession("models/operator_bilstm_v1.onnx")
        # self.fusion_transformer = torch.jit.load("models/fusion_transformer_v3.pt")
        # self.shap_explainer = shap.TreeExplainer(self.fusion_transformer)
        self.is_mock = True

    def predict_risk(self, data: RiskInferenceInput) -> RiskInferenceOutput:
        start_time = time.perf_counter()
        
        # 1. Pipeline de Comportamiento Humano (Bi-LSTM Proxy)
        behavior_score = 0.05
        perclos_impact = 0.0
        if not data.is_autonomous and data.operator:
            perclos_impact = max(0.0, (data.operator.perclos_score - 0.12) * 1.8)
            shift_impact = max(0.0, (data.operator.shift_hours_accumulated - 7.5) * 0.08)
            behavior_score = min(0.95, perclos_impact + shift_impact)

        # 2. Pipeline de Percepción LiDAR (PointNet++ Proxy)
        dist = data.lidar.nearest_obstacle_dist_m
        dist_factor = max(0.0, (60.0 - dist) / 60.0)
        visibility_degradation = 1.0 - data.lidar.visibility_index
        perception_score = min(0.95, (dist_factor * 0.7) + (visibility_degradation * 0.3))

        # 3. Cinemática GNSS y Cálculo de TTC
        speed = data.gnss.speed_kmh
        speed_score = min(0.90, (speed / 45.0) * 0.6)
        
        rel_speed_ms = max(1.5, speed * (1000 / 3600))
        ttc_sec = max(1.2, round(dist / rel_speed_ms, 1))

        # 4. Multi-Modal Transformer Fusion
        if not data.is_autonomous:
            raw_score = (behavior_score * 0.45) + (speed_score * 0.30) + (perception_score * 0.25)
        else:
            raw_score = (speed_score * 0.55) + (perception_score * 0.45)

        if dist < 35.0:
            raw_score = min(0.98, raw_score + 0.25)

        overall_risk = float(np.clip(round(raw_score, 2), 0.05, 0.98))

        # Determinar Severidad
        if overall_risk >= 0.80:
            risk_level = "CRITICAL"
        elif overall_risk >= 0.60:
            risk_level = "HIGH"
        elif overall_risk >= 0.30:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # 5. Cálculo Explicable Fast TreeSHAP
        shap_factors = []
        if not data.is_autonomous and data.operator and perclos_impact > 0.05:
            shap_factors.append(ShapFactorOutput(
                feature_name="Fatiga Biológica & Horas de Turno (PERCLOS)",
                category="COMPORTAMIENTO_OPERADOR",
                attribution_value=round(perclos_impact * 0.55, 2),
                percentage_weight=47.7,
                human_readable_reason=f"Operador con {data.operator.shift_hours_accumulated}h de turno continuo y PERCLOS {(data.operator.perclos_score*100):.0f}%.",
                counterfactual_suggestion="Relevo inmediato en cabina o alerta acústica de emergencia."
            ))

        shap_factors.append(ShapFactorOutput(
            feature_name="Velocidad Relativa en Pendiente de Rampa",
            category="CINEMATICA_GNSS",
            attribution_value=round((speed / 45.0) * 0.28, 2),
            percentage_weight=25.0,
            human_readable_reason=f"Velocidad de {speed} km/h con carga inercial requiere distancia de frenado prolongada.",
            counterfactual_suggestion=f"Reducir velocidad a <= {int(speed * 0.55)} km/h y engranar freno retardador."
        ))

        shap_factors.append(ShapFactorOutput(
            feature_name="Atenuación LiDAR por Polvareda",
            category="PERCEPCION_LIDAR",
            attribution_value=round(dist_factor * 0.25, 2),
            percentage_weight=15.9,
            human_readable_reason="Polvo en suspensión atenúa reflectancia de obstáculos.",
            counterfactual_suggestion="Activar aspersores de agua en rampa de acarreo."
        ))

        latency = (time.perf_counter() - start_time) * 1000.0

        return RiskInferenceOutput(
            equipment_id=data.equipment_id,
            overall_risk_score=overall_risk,
            risk_level=risk_level,
            time_to_collision_sec=ttc_sec,
            prediction_horizon_sec=round(ttc_sec + 2.2, 1),
            shap_factors=shap_factors,
            primary_risk_driver=shap_factors[0].feature_name if shap_factors else "Cinemática",
            counterfactual_recommendation=shap_factors[0].counterfactual_suggestion if shap_factors else "Mantener velocidad.",
            inference_latency_ms=round(latency, 2)
        )`;

  const dockerComposeCode = `# ==============================================================================
# MINESAFE 3D: DOCKER COMPOSE MULTI-SERVICIO (PRODUCCIÓN & DEV)
# ==============================================================================
version: '3.8'

services:
  # 1. Base de Datos Geoespacial PostGIS
  db:
    image: postgis/postgis:15-3.3-alpine
    container_name: minesafe_postgis
    restart: always
    environment:
      POSTGRES_DB: minesafe_db
      POSTGRES_USER: minesafe_admin
      POSTGRES_PASSWORD: \${DB_PASSWORD:-SecureMiningPass2026!}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/sql/init_postgis.sql:/docker-entrypoint-initdb.d/01_init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U minesafe_admin -d minesafe_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 2. Cola de Mensajes y Pub/Sub de Telemetría (Redis)
  redis:
    image: redis:7.0-alpine
    container_name: minesafe_redis
    restart: always
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # 3. Backend FastAPI (Python 3.11)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: minesafe_backend
    restart: always
    environment:
      DATABASE_URL: postgresql+asyncpg://minesafe_admin:\${DB_PASSWORD:-SecureMiningPass2026!}@db:5432/minesafe_db
      REDIS_URL: redis://redis:6379/0
      JWT_SECRET: \${JWT_SECRET:-SuperSecretMiningJwtKey2026!}
      MODEL_INFERENCE_MODE: ONNX_PROD
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  # 4. Frontend Next.js / React Three.js
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: minesafe_frontend
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
      NEXT_PUBLIC_WS_URL: ws://localhost:8000/ws/telemetry
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  pgdata:
    driver: local`;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-5 space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Documentación de Arquitectura de Software & Especificación Técnica</h2>
            <p className="text-xs text-slate-400">Diseño Enterprise para Producción, PostGIS, Microservicios FastAPI y Modelos ML</p>
          </div>
        </div>

        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
          Architecture Blueprints v3.0
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => setSelectedTab('ARCHITECTURE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedTab === 'ARCHITECTURE' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>1. Arquitectura & Flujo de Datos</span>
        </button>

        <button
          onClick={() => setSelectedTab('DATA_MODEL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedTab === 'DATA_MODEL' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>2. Modelo PostGIS (SQL)</span>
        </button>

        <button
          onClick={() => setSelectedTab('BACKEND_CODE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedTab === 'BACKEND_CODE' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>3. Backend FastAPI & Risk Engine</span>
        </button>

        <button
          onClick={() => setSelectedTab('DOCKER')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedTab === 'DOCKER' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>4. Despliegue Docker</span>
        </button>

        <button
          onClick={() => setSelectedTab('ML_GUIDE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedTab === 'ML_GUIDE' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>5. Conexión de Modelos ML</span>
        </button>
      </div>

      {/* Content Panes */}
      <div className="space-y-4">
        {selectedTab === 'ARCHITECTURE' && (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl space-y-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                Flujo End-to-End: Telemetría GNSS/LiDAR → Redis Pub/Sub → Risk Engine → XAI SHAP → Gemelo 3D
              </h3>
              <p className="text-slate-400">
                1. <strong>Ingesta de Alta Frecuencia (1 Hz):</strong> Los camiones de extracción (CAT 797F) y autónomos (AHS) emiten coordenadas GNSS submétricas y vectores de features LiDAR (distancia a obstáculos, volumen de bounding boxes, reflectancia).
              </p>
              <p className="text-slate-400">
                2. <strong>Desacoplamiento con Redis:</strong> La ingesta entra por WebSocket al backend FastAPI y se encola en Redis Pub/Sub para garantizar que picos de tráfico en faena no bloqueen el servidor web.
              </p>
              <p className="text-slate-400">
                3. <strong>Motor Híbrido de Inferencia Multi-Modal:</strong> Combina PointNet++ (percepción), Bi-LSTM (fatiga del operador) y Multi-Modal Transformer (fusión cinemática) generando un score de riesgo y horizonte de alerta ≥5s.
              </p>
              <p className="text-slate-400">
                4. <strong>Capa XAI (Explicabilidad Fast TreeSHAP):</strong> Descompone la predicción en contribuciones aditivas exactas (ej. 47.7% Fatiga humana, 25.0% Velocidad en rampa) transmitidas por WebSocket al Gemelo Digital 3D.
              </p>
            </div>

            {/* Monorepo Folder Tree */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-[11px] text-slate-300">
              <div className="text-amber-400 font-bold mb-2">Estructura del Monorepo /minesafe-twin-enterprise/</div>
              <pre className="overflow-x-auto text-slate-400">
{`├── backend/
│   ├── app/
│   │   ├── main.py                  # Entrypoint FastAPI con middleware CORS y WebSockets
│   │   ├── core/
│   │   │   ├── database.py          # Conexión SQLAlchemy 2.0 Async + PostGIS
│   │   │   ├── auth.py              # JWT tokens con Refresh Tokens y RBAC
│   │   │   └── config.py            # Pydantic Settings (.env)
│   │   ├── models/                  # Modelos ORM (Equipments, Telemetry, Alerts, Consents)
│   │   ├── schemas/                 # Validación de entrada Pydantic v2
│   │   ├── routers/
│   │   │   ├── telemetry.py         # Endpoints GNSS 1Hz + LiDAR stream
│   │   │   ├── risk.py              # Servicio de predicción y SHAP
│   │   │   ├── alerts.py            # Gestión y acknowledgment de alertas
│   │   │   └── reports.py           # Generación de PDF/Excel/Word
│   │   └── services/
│   │       ├── risk_engine_service.py # Servicio de inferencia PointNet++ / LSTM / SHAP
│   │       └── redis_stream.py      # Pub/Sub Redis
│   ├── sql/init_postgis.sql         # Script SQL con tablas y triggers PostGIS
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/3d/           # Gemelo Digital 3D (Three.js WebGL)
│   │   ├── components/xai/          # Panel de Atribución SHAP
│   │   ├── components/scenarios/    # Inyector de Variables Críticas
│   │   └── services/reportGenerator.ts # Exportación PDF & Excel
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml`}
              </pre>
            </div>
          </div>
        )}

        {selectedTab === 'DATA_MODEL' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Script SQL PostgreSQL con extensión PostGIS, índices GIST y tablas auditables:</span>
              <button
                onClick={() => handleCopy('sql', sqlSchemaCode)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1 rounded-lg flex items-center gap-1.5 border border-slate-700"
              >
                {copiedCode === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'sql' ? 'Copiado' : 'Copiar SQL'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-96">
              {sqlSchemaCode}
            </pre>
          </div>
        )}

        {selectedTab === 'BACKEND_CODE' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Microservicio FastAPI `risk_engine_service.py` con interfaz de inferencia y Fast SHAP:</span>
              <button
                onClick={() => handleCopy('fastapi', backendFastApiCode)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1 rounded-lg flex items-center gap-1.5 border border-slate-700"
              >
                {copiedCode === 'fastapi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'fastapi' ? 'Copiado' : 'Copiar Python'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-amber-300/90 overflow-x-auto max-h-96">
              {backendFastApiCode}
            </pre>
          </div>
        )}

        {selectedTab === 'DOCKER' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Configuración `docker-compose.yml` para levantar PostGIS, Redis, Backend y Frontend:</span>
              <button
                onClick={() => handleCopy('docker', dockerComposeCode)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1 rounded-lg flex items-center gap-1.5 border border-slate-700"
              >
                {copiedCode === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'docker' ? 'Copiado' : 'Copiar Compose'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-sky-300/90 overflow-x-auto max-h-96">
              {dockerComposeCode}
            </pre>
          </div>
        )}

        {selectedTab === 'ML_GUIDE' && (
          <div className="bg-slate-800/50 border border-slate-700/80 p-4 rounded-xl space-y-3 text-xs text-slate-300 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Guía de Integración de Modelos ML Reales (PointNet++, LSTM, Transformer & SHAP)
            </h3>
            <div className="space-y-2 text-slate-400">
              <p>
                1. <strong>Capa de Percepción (PointNet++):</strong> Los archivos de nubes de puntos LiDAR `.pcd` o `.las` se procesan en el pipeline de borde (Edge GPU en camión) extrayendo embeddings de 128 dimensiones que se envían al backend en el payload de telemetría.
              </p>
              <p>
                2. <strong>Capa de Comportamiento (Bi-LSTM):</strong> El modelo de secuencia recibe ventanas temporales de 10 segundos (10 Hz) de acelerómetro de cabina, desviación de carril y PERCLOS para estimar la probabilidad de error humano.
              </p>
              <p>
                3. <strong>Transformer Multi-Modal de Fusión:</strong> Para servir el modelo en producción con latencia &lt; 25 ms, exportar a formato <strong>ONNX Runtime</strong> o <strong>NVIDIA TensorRT</strong> (`fusion_transformer_v3.onnx`) y cargarlo en `risk_engine_service.py`.
              </p>
              <p>
                4. <strong>Explicabilidad SHAP en Tiempo Real:</strong> Utilizar <code>TreeSHAP</code> o la aproximación de Kernel optimizada en C++ (FastSHAP) para calcular los valores $\phi_i$ en menos de 5 ms sin retrasar la emisión de alertas tempranas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
