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
import { backendWsService } from './services/backendWsService';

// Components
import { Mine3DViewer } from './components/3d/Mine3DViewer';
import { ShapExplanationPanel } from './components/xai/ShapExplanationPanel';
import { ScenarioManager } from './components/scenarios/ScenarioManager';
import { AlertsCenter } from './components/alerts/AlertsCenter';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';

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
  Activity,
  Sun,
  Moon
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'3D_TWIN' | 'SCENARIOS' | 'ALERTS' | 'ANALYTICS'>('3D_TWIN');

  // Theme State: 'dark' | 'light' con persistencia en localStorage
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('minesafe_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const isDark = theme === 'dark';

  // Sincronizar clase .dark en <html> y persistir en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('minesafe_theme', theme);
    } catch {}
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme, isDark]);

  // Toggle Theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Application State
  const [equipments, setEquipments] = useState<Equipment[]>(INITIAL_EQUIPMENTS);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>('eq-ht-104');
  const [alerts, setAlerts] = useState<CollisionAlert[]>(INITIAL_ALERTS);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>('scen-blind-corner');
  const [currentRole, setCurrentRole] = useState<UserRole>('SAFETY_SUPERVISOR');
  const [isAnonymized, setIsAnonymized] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [weatherCondition, setWeatherCondition] = useState<'CLEAR' | 'DUST_STORM' | 'HEAVY_FOG' | 'NIGHT_RAIN'>('CLEAR');
  const [isBackendWsActive, setIsBackendWsActive] = useState<boolean>(false);

  // Conexión en tiempo real con WebSockets del Backend (/ws/telemetry y /ws/alerts)
  useEffect(() => {
    backendWsService.connect();

    const unsubTelemetry = backendWsService.subscribeTelemetry((liveFleet) => {
      if (liveFleet && liveFleet.length > 0) {
        setEquipments(liveFleet);
        setIsBackendWsActive(true);
      }
    });

    const unsubAlert = backendWsService.subscribeAlert((newAlert) => {
      setAlerts((prev) => {
        if (prev.some((a) => a.id === newAlert.id || a.alertCode === newAlert.alertCode)) {
          return prev;
        }
        return [newAlert, ...prev.slice(0, 24)];
      });
    });

    const unsubSnapshot = backendWsService.subscribeAlertsSnapshot((snapshotAlerts) => {
      if (snapshotAlerts && snapshotAlerts.length > 0) {
        setAlerts(snapshotAlerts);
      }
    });

    const unsubStatus = backendWsService.subscribeStatus(({ isConnected }) => {
      setIsBackendWsActive(isConnected);
    });

    return () => {
      unsubTelemetry();
      unsubAlert();
      unsubSnapshot();
      unsubStatus();
    };
  }, []);

  // Telemetry Movement & Real-time Simulation Loop (Fallback local si el backend está desconectado)
  useEffect(() => {
    if (!isSimulating || isBackendWsActive) return;

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
  }, [isSimulating, weatherCondition, isBackendWsActive]);

  const selectedEquipment = equipments.find((e) => e.id === selectedEquipmentId) || null;

  // Acciones de Alertas y Supervisor
  const handleAcknowledgeAlert = (alertId: string, supervisorName: string) => {
    // 1. Notificar al backend en segundo plano
    backendWsService.acknowledgeAlert(alertId, supervisorName);

    // 2. Actualizar estado local inmediatamente
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

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* ── BARRA LATERAL IZQUIERDA: DOCK DE NAVEGACIÓN INDUSTRIAL ── */}
      <aside className={`w-full md:w-64 flex-shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r md:sticky md:top-0 md:h-screen z-30 transition-colors ${
        isDark ? 'bg-slate-900/95 border-slate-800 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Top: Identidad de Marca y Gemelo Digital */}
        <div>
          <div className="p-4 border-b border-inherit">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/25 text-base flex-shrink-0 ring-2 ring-amber-500/30">
                MS
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className={`text-sm font-extrabold tracking-wider truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    MINESAFE 3D
                  </h1>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className={`text-[10px] font-mono font-bold tracking-tight ${isDark ? 'text-amber-400/90' : 'text-amber-600'}`}>
                    CONTROL DE FLOTA
                  </span>
                </div>
              </div>
            </div>
            <p className={`text-[10px] mt-2 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tajo Abierto • Banco 3200
            </p>
          </div>

          {/* Menú de Navegación Vertical */}
          <div className="p-3">
            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-3 mb-2 block ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Monitoreo & Vistas
            </span>
            <nav className="space-y-1">
              {/* 1. Gemelo 3D */}
              <button
                id="tab-3d-twin"
                onClick={() => setActiveTab('3D_TWIN')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer group ${
                  activeTab === '3D_TWIN'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Box className={`w-4 h-4 ${activeTab === '3D_TWIN' ? 'text-slate-950' : 'text-amber-500'}`} />
                  <span>Gemelo 3D</span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  activeTab === '3D_TWIN' 
                    ? 'bg-slate-950/20 text-slate-950' 
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}>
                  EN VIVO
                </span>
              </button>

              {/* 2. Alertas */}
              <button
                id="tab-alerts"
                onClick={() => setActiveTab('ALERTS')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer group ${
                  activeTab === 'ALERTS'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className={`w-4 h-4 ${activeTab === 'ALERTS' ? 'text-slate-950' : 'text-rose-500'}`} />
                  <span>Alertas</span>
                </div>
                {alerts.some((a) => a.status === 'ACTIVE') && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full animate-pulse ${
                    activeTab === 'ALERTS'
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-rose-500 text-white shadow-sm'
                  }`}>
                    {alerts.filter((a) => a.status === 'ACTIVE').length} ACTIVAS
                  </span>
                )}
              </button>

              {/* 3. Telemetría & KPIs */}
              <button
                id="tab-analytics"
                onClick={() => setActiveTab('ANALYTICS')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer group ${
                  activeTab === 'ANALYTICS'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className={`w-4 h-4 ${activeTab === 'ANALYTICS' ? 'text-slate-950' : 'text-cyan-500'}`} />
                  <span>Telemetría & KPIs</span>
                </div>
                <span className={`text-[9px] font-mono ${
                  activeTab === 'ANALYTICS' ? 'text-slate-950/70' : isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  5 Folds
                </span>
              </button>

              {/* 4. Escenarios */}
              <button
                id="tab-scenarios"
                onClick={() => setActiveTab('SCENARIOS')}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer group ${
                  activeTab === 'SCENARIOS'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Flame className={`w-4 h-4 ${activeTab === 'SCENARIOS' ? 'text-slate-950' : 'text-amber-500'}`} />
                  <span>Escenarios</span>
                </div>
                <span className={`text-[9px] font-mono ${
                  activeTab === 'SCENARIOS' ? 'text-slate-950/70' : isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  A–E OOD
                </span>
              </button>
            </nav>
          </div>

          {/* Quick Telemetry Status Widget en la Barra Lateral */}
          <div className="px-3 py-2 hidden md:block">
            <div className={`p-3 rounded-xl border text-[11px] space-y-2 ${
              isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                <span>ESTADO DE FLOTA</span>
                <span className="flex items-center gap-1 text-emerald-500 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Equipos activos:</span>
                <span className="font-mono font-bold text-amber-500">5 unidades</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Latencia pipeline:</span>
                <span className="font-mono text-emerald-500 font-bold">18.9 ms (2 Hz)</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Clima actual:</span>
                <span className="font-mono text-slate-300 font-medium">{weatherCondition}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de Sistema y Estado en Footer Lateral */}
        <div className="p-3 border-t border-inherit space-y-2">
          {/* Controles: Tema y Simulación */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Simulación Play/Pausa */}
            <button
              id="btn-toggle-sim"
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-2 py-1.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                isSimulating
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isSimulating ? 'Pausar' : 'Reanudar'}</span>
            </button>

            {/* Tema Claro/Oscuro */}
            <button
              id="btn-toggle-theme"
              onClick={toggleTheme}
              className={`px-2 py-1.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title={isDark ? 'Cambiar a Modo Blanco / Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDark ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
              <span>{isDark ? 'Claro' : 'Oscuro'}</span>
            </button>
          </div>

          {/* Badge Conexión WebSocket Backend */}
          <div
            className={`border px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[10px] font-mono transition-all ${
              isBackendWsActive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isBackendWsActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="font-bold">{isBackendWsActive ? 'FastAPI 1 Hz' : 'Sim Local'}</span>
            </div>
            <span className="text-[9px] opacity-75 font-mono">v1.0.0 Q1</span>
          </div>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL DERECHA (HUD + VISTAS) ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Cockpit HUD Header Superior */}
        <header className={`h-14 border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 backdrop-blur-md transition-colors ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'
        }`}>
          {/* Breadcrumb / Contexto Activo */}
          <div className="flex items-center gap-2 text-xs truncate">
            <span className={`font-mono hidden sm:inline ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>MINERA ESPERANZA</span>
            <span className={`hidden sm:inline ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>/</span>
            <span className={`font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>TAJO 3200</span>
            <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>/</span>
            <span className="font-bold text-amber-500 flex items-center gap-1.5 truncate">
              {activeTab === '3D_TWIN' && 'GEMELO DIGITAL 3D'}
              {activeTab === 'ALERTS' && 'CENTRO DE ALERTAS'}
              {activeTab === 'ANALYTICS' && 'TELEMETRÍA & KPIS (5-FOLD OOF)'}
              {activeTab === 'SCENARIOS' && 'ESCENARIOS OPERACIONALES (A–E)'}
            </span>
          </div>

          {/* Métricas Rápidas HUD a la Derecha */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className={`hidden md:flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>GNSS + LiDAR 3D</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-500 font-bold">2 Hz</span>
            </div>

            <div className={`flex items-center gap-2 text-xs px-2.5 py-1 rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-bold">Supervisor HSE</span>
            </div>
          </div>
        </header>

        {/* Main Workspace Area */}
        <main className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3">
          {/* Tab 1: 3D Digital Twin & XAI SHAP Explanation Drawer */}
          {activeTab === '3D_TWIN' && (
            <div className="space-y-3">
              {/* Slim High-Density Alert Strip (Solo si hay alerta crítica activa) */}
              {alerts.some((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE') && (
                <div className={`px-4 py-2 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors ${
                  isDark 
                    ? 'bg-rose-950/70 border border-rose-500/50 text-rose-200 shadow-lg shadow-rose-950/40' 
                    : 'bg-rose-50 border border-rose-300 text-rose-900 shadow-sm'
                }`}>
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
                    <span className="font-mono font-bold text-rose-500 flex-shrink-0">[ALERTA CRÍTICA]</span>
                    <span className="truncate">HT-104 vs AHS-02 • Rampa Este (Banco 3200) • Anticipación: 6.2s</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedEquipmentId('eq-ht-104')}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      Ver SHAP
                    </button>
                    <button
                      onClick={() => handleAcknowledgeAlert(alerts[0].id, 'Supervisor')}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      Reconocer
                    </button>
                  </div>
                </div>
              )}

              {/* Split View: 3D Twin Viewport + XAI SHAP Explanation Panel */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 min-h-[580px] lg:h-[calc(100vh-140px)]">
                {/* 3D Canvas (Left Column - 7/12 en pantallas grandes) */}
                <div className="xl:col-span-7 h-[500px] xl:h-full rounded-2xl overflow-hidden shadow-xl border border-slate-800/80">
                  <Mine3DViewer
                    equipments={equipments}
                    selectedEquipmentId={selectedEquipmentId}
                    onSelectEquipment={(id) => setSelectedEquipmentId(id)}
                    weatherCondition={weatherCondition}
                    isSimulating={isSimulating}
                    theme={theme}
                  />
                </div>

                {/* Explainable AI SHAP Breakdown (Right Column - 5/12) */}
                <div className="xl:col-span-5 h-full overflow-y-auto">
                  <ShapExplanationPanel
                    equipment={selectedEquipment}
                    onSendCabWarning={handleSendCabWarning}
                    onRequestRelief={handleRequestRelief}
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Scenarios & Injector */}
          {activeTab === 'SCENARIOS' && (
            <div className="h-[calc(100vh-140px)] min-h-[640px]">
              <ScenarioManager
                activeScenarioId={activeScenarioId}
                onActivateScenario={handleActivateScenario}
                onResetToBaseline={handleResetToBaseline}
                onCustomInject={handleCustomInject}
                currentEquipment={selectedEquipment}
                theme={theme}
              />
            </div>
          )}

          {/* Tab 3: Alerts Center */}
          {activeTab === 'ALERTS' && (
            <div className="h-[calc(100vh-140px)] min-h-[640px]">
              <AlertsCenter
                alerts={alerts}
                equipments={equipments}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onSelectEquipment={(id) => {
                  setSelectedEquipmentId(id);
                  setActiveTab('3D_TWIN');
                }}
                theme={theme}
              />
            </div>
          )}

          {/* Tab 4: Analytics Dashboard */}
          {activeTab === 'ANALYTICS' && (
            <AnalyticsDashboard 
              mshaIncidents={MSHA_HISTORICAL_INCIDENTS} 
              theme={theme}
            />
          )}
        </main>

        {/* Compact Footer */}
        <footer className={`border-t px-4 py-2 text-[11px] transition-colors mt-auto ${
          isDark ? 'bg-slate-900/60 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-600'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>MineSafe 3D • Sistema de Telemetría y Gemelo Digital</span>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span>FastAPI 1 Hz</span>
              <span>Three.js WebGL</span>
              <span>TreeSHAP v1.2</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

