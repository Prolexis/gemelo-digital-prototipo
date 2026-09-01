import React, { useState, useEffect, useRef } from 'react';
import { 
  Equipment, 
  CollisionAlert, 
  MiningScenario, 
  MshaIncidentRecord, 
  OperatorConsent, 
  UserRole, 
  AuditLogEntry 
} from './types/mining';
import { 
  INITIAL_EQUIPMENTS, 
  INITIAL_ALERTS, 
  MINING_SCENARIOS, 
  MSHA_HISTORICAL_INCIDENTS, 
  OPERATOR_CONSENTS 
} from './data/mockMineData';
import { RiskEngineService } from './services/riskEngine';

// Components
import { Mine3DViewer } from './components/3d/Mine3DViewer';
import { ShapExplanationPanel } from './components/xai/ShapExplanationPanel';
import { ScenarioManager } from './components/scenarios/ScenarioManager';
import { AlertsCenter } from './components/alerts/AlertsCenter';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { ReportsModule } from './components/reports/ReportsModule';
import { EthicsConsentModule } from './components/ethics/EthicsConsentModule';
import { UserRolesModule } from './components/rbac/UserRolesModule';
import { ArchitectureDocsModule } from './components/docs/ArchitectureDocsModule';

// Icons
import { 
  Box, 
  BrainCircuit, 
  ShieldAlert, 
  BarChart3, 
  FileText, 
  Shield, 
  UserCheck, 
  Code2, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  EyeOff, 
  Bell, 
  Sparkles,
  Layers,
  ChevronRight,
  Activity
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'3D_TWIN' | 'SCENARIOS' | 'ALERTS' | 'ANALYTICS' | 'REPORTS' | 'ETHICS' | 'RBAC' | 'ARCHITECTURE'>('3D_TWIN');

  // Application State
  const [equipments, setEquipments] = useState<Equipment[]>(INITIAL_EQUIPMENTS);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>('eq-ht-104');
  const [alerts, setAlerts] = useState<CollisionAlert[]>(INITIAL_ALERTS);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>('scen-blind-corner');
  const [currentRole, setCurrentRole] = useState<UserRole>('SAFETY_SUPERVISOR');
  const [isAnonymized, setIsAnonymized] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [weatherCondition, setWeatherCondition] = useState<'CLEAR' | 'DUST_STORM' | 'HEAVY_FOG' | 'NIGHT_RAIN'>('CLEAR');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      userEmail: 'supervisor.hse@mineraesperanza.cl',
      userRole: 'SAFETY_SUPERVISOR',
      action: 'LOGIN_AUTH',
      resource: 'SISTEMA_CENTRAL',
      details: 'Inicio de sesión con credenciales biométricas para Turno Noche.',
      ipAddress: '10.240.12.88',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      userEmail: 'supervisor.hse@mineraesperanza.cl',
      userRole: 'SAFETY_SUPERVISOR',
      action: 'ACKNOWLEDGE_ALERT',
      resource: 'HT-108 (Botadero Sur)',
      details: 'Alerta de proximidad de berma confirmada. Conductor alertado.',
      ipAddress: '10.240.12.88',
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      userEmail: 'data.scientist@mineraesperanza.cl',
      userRole: 'DATA_ANALYST',
      action: 'INJECT_SCENARIO',
      resource: 'SCENARIO_BLIND_CORNER',
      details: 'Inyección de escenario de prueba de fatiga severa en Rampa Este.',
      ipAddress: '10.240.14.102',
    },
  ]);

  // Telemetry Movement & Real-time Simulation Loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setEquipments((prevList) => {
        return prevList.map((eq) => {
          // Si el vehículo está en acarreo activo, moverlo gradualmente
          if (eq.status === 'ACTIVE_HAULING') {
            const headingRad = (-eq.position.headingDeg * Math.PI) / 180;
            const step = (eq.position.speedKmh / 40.0) * 0.8;
            
            const newEasting = eq.position.easting + Math.sin(headingRad) * step;
            const newNorthing = eq.position.northing + Math.cos(headingRad) * step;

            // Encontrar posible vehículo objetivo cercano para recalcular riesgo
            const targetEq = prevList.find((other) => other.id !== eq.id && Math.abs(other.position.easting - newEasting) < 80);

            // Recalcular predicción de riesgo y SHAP en tiempo real
            const updatedPrediction = RiskEngineService.calculateRisk(
              {
                ...eq,
                position: { ...eq.position, easting: newEasting, northing: newNorthing },
              },
              targetEq,
              {
                weather: weatherCondition,
                roadGrade: 8.5,
                visibilityFactor: weatherCondition === 'DUST_STORM' ? 0.45 : weatherCondition === 'HEAVY_FOG' ? 0.3 : 0.95,
              }
            );

            return {
              ...eq,
              position: {
                ...eq.position,
                easting: newEasting,
                northing: newNorthing,
                timestamp: new Date().toISOString(),
              },
              currentPrediction: updatedPrediction,
            };
          }
          return eq;
        });
      });
    }, 1000); // 1 Hz (1 actualización por segundo)

    return () => clearInterval(interval);
  }, [isSimulating, weatherCondition]);

  const selectedEquipment = equipments.find((e) => e.id === selectedEquipmentId) || null;

  // Acciones de Alertas y Supervisor
  const handleAcknowledgeAlert = (alertId: string, supervisorName: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, status: 'RESOLVED', isAcknowledged: true, acknowledgedBy: supervisorName } : a
      )
    );

    // Registrar en Audit Log
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: 'supervisor.hse@mineraesperanza.cl',
      userRole: currentRole,
      action: 'ACKNOWLEDGE_ALERT',
      resource: alertId,
      details: `Alerta reconocida por ${supervisorName}. Medidas de mitigación en curso.`,
      ipAddress: '10.240.12.88',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleSendCabWarning = (equipmentId: string) => {
    const eq = equipments.find((e) => e.id === equipmentId);
    if (!eq) return;

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: 'supervisor.hse@mineraesperanza.cl',
      userRole: currentRole,
      action: 'DISPATCH_CAB_WARNING',
      resource: eq.code,
      details: `Emisión de aviso acústico de emergencia a cabina de ${eq.code} por riesgo ${eq.currentPrediction.riskLevel} (${(eq.currentPrediction.overallRiskScore * 100).toFixed(0)}%).`,
      ipAddress: '10.240.12.88',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    alert(`[AVISO ENVIADO A CABINA]: Señal acústica y vibratoria enviada con éxito a ${eq.code}. El operador ha recibido la recomendación de frenado.`);
  };

  const handleRequestRelief = (operatorId: string) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: 'supervisor.hse@mineraesperanza.cl',
      userRole: currentRole,
      action: 'REQUEST_OPERATOR_RELIEF',
      resource: operatorId,
      details: `Solicitud de relevo en garita por fatiga biológica (PERCLOS crítico). Conductor puesto en descanso seguro.`,
      ipAddress: '10.240.12.88',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    alert(`[RELEVO PROGRAMADO]: Solicitud de relevo enviada a Despacho de Turno. Un operador de reserva relevará el camión en el próximo pase.`);
  };

  const handleActivateScenario = (scenario: MiningScenario) => {
    setActiveScenarioId(scenario.id);
    setWeatherCondition(scenario.weatherCondition);

    // Ajustar parámetros del camión manual para recrear el escenario
    setEquipments((prev) =>
      prev.map((eq) => {
        if (eq.id === 'eq-ht-104') {
          const updatedOp = eq.assignedOperator
            ? {
                ...eq.assignedOperator,
                shiftHoursAccumulated: scenario.operatorShiftHours,
                perclosScore: scenario.operatorShiftHours > 10 ? 0.38 : 0.15,
                isFatigued: scenario.operatorShiftHours > 9,
              }
            : undefined;

          const updated = {
            ...eq,
            assignedOperator: updatedOp,
            position: { ...eq.position, speedKmh: 34 },
          };

          const target = prev.find((e) => e.id === 'eq-ahs-02');
          return {
            ...updated,
            currentPrediction: RiskEngineService.calculateRisk(updated, target, {
              weather: scenario.weatherCondition,
              roadGrade: 8.5,
              visibilityFactor: scenario.weatherCondition === 'DUST_STORM' ? 0.45 : 0.9,
            }),
          };
        }
        return eq;
      })
    );

    // Agregar alerta asociada
    const newAlert: CollisionAlert = {
      id: `alt-scen-${Date.now()}`,
      alertCode: `ALERT-${scenario.severityLevel}-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      severity: scenario.severityLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      sourceEquipmentId: 'eq-ht-104',
      sourceEquipmentCode: 'HT-104',
      targetEquipmentId: 'eq-ahs-02',
      targetEquipmentCode: 'AHS-02',
      zone: scenario.zone,
      riskScore: scenario.severityLevel === 'CRITICAL' ? 0.88 : 0.65,
      timeToCollision: scenario.initialTtcSec,
      earlyWarningAnticipationSec: 6.2,
      primaryFactor: scenario.expectedShapDominance,
      shapExplanationSummary: `Escenario activo: ${scenario.title}. ${scenario.description}`,
      recommendedAction: 'Reducir velocidad y activar aviso acústico V2V.',
      isAcknowledged: false,
      status: 'ACTIVE',
    };
    setAlerts((prev) => [newAlert, ...prev]);

    // Audit log
    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userEmail: 'supervisor.hse@mineraesperanza.cl',
        userRole: currentRole,
        action: 'INJECT_SCENARIO',
        resource: scenario.title,
        details: `Carga de escenario minero: ${scenario.title}`,
        ipAddress: '10.240.12.88',
      },
      ...prev,
    ]);
  };

  const handleResetToBaseline = () => {
    setEquipments(INITIAL_EQUIPMENTS);
    setActiveScenarioId(null);
    setWeatherCondition('CLEAR');
  };

  const handleCustomInject = (params: {
    operatorShiftHours: number;
    perclos: number;
    speedKmh: number;
    visibilityIndex: number;
    weather: 'CLEAR' | 'DUST_STORM' | 'HEAVY_FOG' | 'NIGHT_RAIN';
  }) => {
    setWeatherCondition(params.weather);
    setEquipments((prev) =>
      prev.map((eq) => {
        if (eq.id === 'eq-ht-104') {
          const updatedOp = eq.assignedOperator
            ? {
                ...eq.assignedOperator,
                shiftHoursAccumulated: params.operatorShiftHours,
                perclosScore: params.perclos,
                isFatigued: params.perclos > 0.25 || params.operatorShiftHours > 8.5,
              }
            : undefined;

          const updated = {
            ...eq,
            assignedOperator: updatedOp,
            position: { ...eq.position, speedKmh: params.speedKmh },
            lidarFeatures: { ...eq.lidarFeatures, visibilityIndex: params.visibilityIndex },
          };

          const target = prev.find((e) => e.id === 'eq-ahs-02');
          return {
            ...updated,
            currentPrediction: RiskEngineService.calculateRisk(updated, target, {
              weather: params.weather,
              roadGrade: 8.5,
              visibilityFactor: params.visibilityIndex,
            }),
          };
        }
        return eq;
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Corporate Navigation Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20 text-base">
                MS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-extrabold tracking-tight text-slate-100">
                    MINESAFE 3D
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    GEMELO DIGITAL EXPLICABLE (XAI)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Predicción de Riesgo de Colisión en Tajo Abierto • Flota Mixta (Manual + AHS)
                </p>
              </div>
            </div>

            {/* Quick Live Telemetry Indicator on Mobile */}
            <div className="flex md:hidden items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-emerald-400 font-mono text-[11px]">1 Hz VIVO</span>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs w-full md:w-auto justify-end">
            {/* Simulation Play/Pause */}
            <button
              id="btn-toggle-sim"
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all border ${
                isSimulating
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isSimulating ? 'Simulación Activa' : 'Pausada'}</span>
            </button>

            {/* Weather indicator */}
            <div className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-xl text-slate-300 flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Clima:</span>
              <span className="font-semibold text-amber-400">{weatherCondition}</span>
            </div>

            {/* Active Role Selector */}
            <div className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="bg-transparent text-slate-200 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="SAFETY_SUPERVISOR">Supervisor HSE</option>
                <option value="ADMIN">Administrador</option>
                <option value="OPERATOR">Operador</option>
                <option value="DATA_ANALYST">Data Scientist</option>
                <option value="AUDITOR">Auditor MSHA</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto flex items-center gap-1 mt-3 overflow-x-auto pb-1 scrollbar-none">
          <button
            id="tab-3d-twin"
            onClick={() => setActiveTab('3D_TWIN')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === '3D_TWIN'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Gemelo Digital 3D & XAI</span>
          </button>

          <button
            id="tab-scenarios"
            onClick={() => setActiveTab('SCENARIOS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'SCENARIOS'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Escenarios & Inyector</span>
          </button>

          <button
            id="tab-alerts"
            onClick={() => setActiveTab('ALERTS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all relative ${
              activeTab === 'ALERTS'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Centro de Alertas</span>
            {alerts.some((a) => a.status === 'ACTIVE') && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1 right-1" />
            )}
          </button>

          <button
            id="tab-analytics"
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard & Benchmark PDS</span>
          </button>

          <button
            id="tab-reports"
            onClick={() => setActiveTab('REPORTS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'REPORTS'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Reportes PDF / Excel</span>
          </button>

          <button
            id="tab-ethics"
            onClick={() => setActiveTab('ETHICS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'ETHICS'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Ética & Privacidad</span>
          </button>

          <button
            id="tab-rbac"
            onClick={() => setActiveTab('RBAC')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'RBAC'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Roles & Auditoría</span>
          </button>

          <button
            id="tab-architecture"
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'ARCHITECTURE'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Arquitectura Backend & PostGIS</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Tab 1: 3D Digital Twin & XAI SHAP Explanation Drawer */}
        {activeTab === '3D_TWIN' && (
          <div className="space-y-4">
            {/* Top Critical Alert Flash Bar */}
            {alerts.some((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE') && (
              <div className="bg-rose-950/60 border border-rose-500/60 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl shadow-rose-950/50 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                        ALERTA TEMPRANA DE COLISIÓN DETECTADA (H1: &gt;5s ANTICIPACIÓN)
                      </h3>
                      <span className="text-[10px] font-mono bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">
                        CRÍTICA
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 mt-0.5">
                      Rampa Este - Banco 3200: HT-104 (Manual, Fatiga 10.8h) en trayectoria convergente con AHS-02 (Autónomo).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedEquipmentId('eq-ht-104')}
                    className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow"
                  >
                    Inspeccionar SHAP
                  </button>
                  <button
                    onClick={() => handleAcknowledgeAlert(alerts[0].id, 'Supervisor HSE')}
                    className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl border border-slate-700"
                  >
                    Reconocer
                  </button>
                </div>
              </div>
            )}

            {/* Split View: 3D Twin Viewport + XAI SHAP Explanation Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[640px]">
              {/* 3D Canvas (Left Column - 7/12 on large screens) */}
              <div className="lg:col-span-7 h-[500px] lg:h-full">
                <Mine3DViewer
                  equipments={equipments}
                  selectedEquipmentId={selectedEquipmentId}
                  onSelectEquipment={(id) => setSelectedEquipmentId(id)}
                  weatherCondition={weatherCondition}
                  isSimulating={isSimulating}
                />
              </div>

              {/* Explainable AI SHAP Breakdown (Right Column - 5/12) */}
              <div className="lg:col-span-5 h-full">
                <ShapExplanationPanel
                  equipment={selectedEquipment}
                  onSendCabWarning={handleSendCabWarning}
                  onRequestRelief={handleRequestRelief}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Scenarios & Injector */}
        {activeTab === 'SCENARIOS' && (
          <div className="h-[680px]">
            <ScenarioManager
              activeScenarioId={activeScenarioId}
              onActivateScenario={handleActivateScenario}
              onResetToBaseline={handleResetToBaseline}
              onCustomInject={handleCustomInject}
              currentEquipment={selectedEquipment}
            />
          </div>
        )}

        {/* Tab 3: Alerts Center */}
        {activeTab === 'ALERTS' && (
          <div className="h-[680px]">
            <AlertsCenter
              alerts={alerts}
              equipments={equipments}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onSelectEquipment={(id) => {
                setSelectedEquipmentId(id);
                setActiveTab('3D_TWIN');
              }}
            />
          </div>
        )}

        {/* Tab 4: Analytics Dashboard */}
        {activeTab === 'ANALYTICS' && (
          <AnalyticsDashboard mshaIncidents={MSHA_HISTORICAL_INCIDENTS} />
        )}

        {/* Tab 5: Reports Module */}
        {activeTab === 'REPORTS' && (
          <ReportsModule
            equipments={equipments}
            alerts={alerts}
            mshaIncidents={MSHA_HISTORICAL_INCIDENTS}
            consents={OPERATOR_CONSENTS}
          />
        )}

        {/* Tab 6: Ethics & Informed Consent */}
        {activeTab === 'ETHICS' && (
          <EthicsConsentModule
            consents={OPERATOR_CONSENTS}
            isAnonymized={isAnonymized}
            onToggleAnonymization={() => setIsAnonymized(!isAnonymized)}
          />
        )}

        {/* Tab 7: RBAC & Audit Log */}
        {activeTab === 'RBAC' && (
          <UserRolesModule
            currentRole={currentRole}
            onRoleChange={(role) => setCurrentRole(role)}
            auditLogs={auditLogs}
          />
        )}

        {/* Tab 8: Architecture, PostGIS SQL & Backend Code */}
        {activeTab === 'ARCHITECTURE' && (
          <ArchitectureDocsModule />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>
            MineSafe 3D • Gemelo Digital Explicable para Seguridad Minera en Tajo Abierto (Flota Mixta)
          </p>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>PostGIS 3.3</span>
            <span>FastAPI 0.110</span>
            <span>Three.js WebGL</span>
            <span>Fast TreeSHAP v1.2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
