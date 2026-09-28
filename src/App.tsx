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
import { LangflowStudioModule } from './components/langflow/LangflowStudioModule';
import { UserRolesModule } from './components/rbac/UserRolesModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { EthicsConsentModule } from './components/ethics/EthicsConsentModule';
import { LoginScreen, AppUser, PRECONFIGURED_USERS } from './components/auth/LoginScreen';

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
  Moon,
  LogOut,
  Lock
} from 'lucide-react';

export type TabType = '3D_TWIN' | 'SCENARIOS' | 'ALERTS' | 'ANALYTICS' | 'LANGFLOW' | 'ROLES' | 'REPORTS' | 'ETHICS';

// Matriz de permisos de navegación por Rol (RBAC estricto)
export const ROLE_PERMITTED_TABS: Record<UserRole, TabType[]> = {
  ADMIN: ['3D_TWIN', 'ALERTS', 'SCENARIOS', 'ANALYTICS', 'LANGFLOW', 'ROLES', 'REPORTS', 'ETHICS'],
  SAFETY_SUPERVISOR: ['3D_TWIN', 'ALERTS', 'SCENARIOS', 'ANALYTICS', 'ROLES', 'REPORTS', 'ETHICS'],
  OPERATOR: ['3D_TWIN', 'ALERTS'],
  DATA_ANALYST: ['3D_TWIN', 'SCENARIOS', 'ANALYTICS', 'LANGFLOW', 'REPORTS'],
  AUDITOR: ['3D_TWIN', 'ANALYTICS', 'REPORTS', 'ETHICS', 'ROLES'],
};

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('3D_TWIN');

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

  // Sesión de Usuario Autenticado (RBAC) - Inicia en null para solicitar Login
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

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

  // Registro Inmutable de Auditoría (Audit Log / Trazabilidad ISO 27001 & MSHA)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-101',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      userEmail: 'supervisor.hse@mineraesperanza.cl',
      userRole: 'SAFETY_SUPERVISOR',
      action: 'DISPATCH_CAB_WARNING',
      resource: 'HT-104 (Rampa Este)',
      details: 'Aviso acústico de emergencia enviado a cabina por riesgo CRITICAL (84%).',
      ipAddress: '10.240.12.88',
    },
    {
      id: 'log-102',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      userEmail: 'data.analyst@mineraesperanza.cl',
      userRole: 'DATA_ANALYST',
      action: 'INJECT_SCENARIO',
      resource: 'Escenario B: Tormenta de Polvo',
      details: 'Calibración de visibilidad de LiDAR 3D en rampa descendente.',
      ipAddress: '10.240.12.44',
    },
    {
      id: 'log-103',
      timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      userEmail: 'admin.minesafe@mineraesperanza.cl',
      userRole: 'ADMIN',
      action: 'CONFIG_XAI_MODEL',
      resource: 'TreeSHAP Engine v1.2',
      details: 'Actualización de umbrales OOD y pesos de fatiga biométrica.',
      ipAddress: '10.240.12.10',
    },
    {
      id: 'log-104',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      userEmail: 'auditor.externo@msha.gov',
      userRole: 'AUDITOR',
      action: 'EXPORT_AUDIT_REPORT',
      resource: 'Reporte Near-Miss Q1',
      details: 'Verificación de cumplimiento de estándar de proximidad PDS ISO 21815.',
      ipAddress: '190.160.88.23',
    },
  ]);

  // Verificador de Permisos de Pestaña según Rol Activo (RBAC)
  const canAccessTab = (tab: TabType): boolean => {
    if (!currentUser) return false;
    return ROLE_PERMITTED_TABS[currentUser.role]?.includes(tab) ?? false;
  };

  // Manejador de Login Exitoso con Registro en Auditoría
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    // Cambiar automáticamente a la primera pestaña permitida para el rol ingresado
    const permitted = ROLE_PERMITTED_TABS[user.role] || ['3D_TWIN'];
    if (!permitted.includes(activeTab)) {
      setActiveTab(permitted[0]);
    }
    const loginLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN_AUTH_SUCCESS',
      resource: 'PORTAL_MINESAFE_3D',
      details: `Inicio de sesión exitoso. Usuario: ${user.name} (${user.roleLabel}). Módulos habilitados: ${permitted.join(', ')}.`,
      ipAddress: '10.240.12.88',
    };
    setAuditLogs((prev) => [loginLog, ...prev]);
  };

  // Manejador de Cierre Seguro de Sesión
  const handleLogout = () => {
    if (currentUser) {
      const logoutLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: 'LOGOUT_USER',
        resource: 'PORTAL_MINESAFE_3D',
        details: `Cierre seguro de sesión del usuario ${currentUser.name} (${currentUser.roleLabel}). Token revocado.`,
        ipAddress: '10.240.12.88',
      };
      setAuditLogs((prev) => [logoutLog, ...prev]);
    }
    setCurrentUser(null);
  };

  // Manejador de cambio de rol activo con registro en auditoría
  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (PRECONFIGURED_USERS[newRole]) {
      setCurrentUser(PRECONFIGURED_USERS[newRole]);
    }
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: `${newRole.toLowerCase()}@mineraesperanza.cl`,
      userRole: newRole,
      action: 'SWITCH_USER_ROLE',
      resource: 'RBAC Access Controller',
      details: `Cambio de perfil activo a ${newRole}. Permisos actualizados según matriz RBAC.`,
      ipAddress: '10.240.12.88',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Manejador de alternancia de anonimización ética (GDPR / Privacidad)
  const handleToggleAnonymization = () => {
    const nextVal = !isAnonymized;
    setIsAnonymized(nextVal);
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: `${currentRole.toLowerCase()}@mineraesperanza.cl`,
      userRole: currentRole,
      action: nextVal ? 'ENABLE_ANONYMIZATION' : 'DISABLE_ANONYMIZATION',
      resource: 'Biometric Telemetry Stream',
      details: nextVal ? 'Datos biométricos anonimizados según GDPR/ISO 27001' : 'Identidad de operadores visible para supervisión directa',
      ipAddress: '10.240.12.88',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

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

  // Acciones de Alertas y Supervisor con Enforzamiento RBAC
  const handleAcknowledgeAlert = (alertId: string, supervisorName: string) => {
    if (currentRole !== 'ADMIN' && currentRole !== 'SAFETY_SUPERVISOR') {
      const deniedLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userEmail: `${currentRole.toLowerCase()}@mineraesperanza.cl`,
        userRole: currentRole,
        action: 'ACCESO_DENEGADO_ALERTA',
        resource: alertId,
        details: `Intento denegado de reconocer alerta. El rol ${currentRole} solo tiene permisos de lectura.`,
        ipAddress: '10.240.12.88',
      };
      setAuditLogs((prev) => [deniedLog, ...prev]);
      alert(`[ACCESO DENEGADO (RBAC)]: El rol activo "${currentRole}" no tiene permisos para reconocer alertas. Cambie a 'Supervisor HSE' o 'Administrador' en la barra superior.`);
      return;
    }

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
    if (currentRole !== 'ADMIN' && currentRole !== 'SAFETY_SUPERVISOR') {
      const deniedLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userEmail: `${currentRole.toLowerCase()}@mineraesperanza.cl`,
        userRole: currentRole,
        action: 'ACCESO_DENEGADO_CABINA',
        resource: equipmentId,
        details: `Intento denegado de aviso a cabina. El rol ${currentRole} no tiene privilegios de despacho HSE.`,
        ipAddress: '10.240.12.88',
      };
      setAuditLogs((prev) => [deniedLog, ...prev]);
      alert(`[ACCESO DENEGADO (RBAC)]: El rol "${currentRole}" no tiene permisos para emitir avisos acústicos a cabina. Seleccione 'Supervisor HSE' o 'Administrador' en la barra superior.`);
      return;
    }

    const eq = equipments.find((e) => e.id === equipmentId);
    if (!eq) return;

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: `${currentRole.toLowerCase()}@mineraesperanza.cl`,
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
    if (currentRole !== 'ADMIN' && currentRole !== 'SAFETY_SUPERVISOR') {
      const deniedLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userEmail: `${currentRole.toLowerCase()}@mineraesperanza.cl`,
        userRole: currentRole,
        action: 'ACCESO_DENEGADO_RELEVO',
        resource: operatorId,
        details: `Intento denegado de relevo por fatiga. El rol ${currentRole} no tiene privilegios de gestión de personal.`,
        ipAddress: '10.240.12.88',
      };
      setAuditLogs((prev) => [deniedLog, ...prev]);
      alert(`[ACCESO DENEGADO (RBAC)]: El rol "${currentRole}" no tiene permisos para solicitar relevos de operadores.`);
      return;
    }

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: `${currentRole.toLowerCase()}@mineraesperanza.cl`,
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



  // Estado crítico de colisiones
  const hasCriticalAlert = alerts.some((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE');

  // Pantalla de Autenticación si no hay usuario autenticado
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-[var(--accent)] selection:text-white transition-colors duration-200 bg-[var(--bg)] text-[var(--text)]">
      {/* ── BARRA LATERAL IZQUIERDA: DOCK DE NAVEGACIÓN INDUSTRIAL ── */}
      <aside className="w-full md:w-60 lg:w-64 flex-shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r md:sticky md:top-0 md:h-screen z-30 transition-colors bg-[var(--surface)] border-[var(--border)]">
        {/* Top: Identidad de Marca */}
        <div>
          <div className="p-3.5 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-control border border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--accent-text)] font-semibold flex items-center justify-center text-xs flex-shrink-0">
                MS
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-semibold tracking-tight truncate text-[var(--text)]">
                  MineSafe 3D
                </h1>
                <p className="text-[11px] truncate text-[var(--text-faint)]">
                  Banco 3200 • Faena Esperanza
                </p>
              </div>
            </div>
          </div>

          {/* Menú de Navegación Vertical Condicionado por Rol (RBAC) */}
          <div className="p-2 space-y-3">
            {/* 1. SECCIÓN: Operaciones */}
            <div>
              <span className="text-[11px] font-medium text-[var(--text-faint)] px-2.5 mb-1 block">
                Operaciones
              </span>
              <nav className="space-y-0.5">
                {/* 1. Gemelo 3D */}
                {canAccessTab('3D_TWIN') && (
                  <button
                    id="tab-3d-twin"
                    onClick={() => setActiveTab('3D_TWIN')}
                    aria-selected={activeTab === '3D_TWIN'}
                    className={`w-full px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors border-l-2 rounded-r-md cursor-pointer ${
                      activeTab === '3D_TWIN'
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)] font-medium'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Box className={`w-3.5 h-3.5 ${activeTab === '3D_TWIN' ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]'}`} />
                      <span>Gemelo 3D</span>
                    </div>
                  </button>
                )}

                {/* 2. Alertas */}
                {canAccessTab('ALERTS') && (
                  <button
                    id="tab-alerts"
                    onClick={() => setActiveTab('ALERTS')}
                    aria-selected={activeTab === 'ALERTS'}
                    className={`w-full px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors border-l-2 rounded-r-md cursor-pointer ${
                      activeTab === 'ALERTS'
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)] font-medium'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className={`w-3.5 h-3.5 ${activeTab === 'ALERTS' ? 'text-[var(--accent)]' : hasCriticalAlert ? 'text-[var(--danger)]' : 'text-[var(--text-faint)]'}`} />
                      <span>Alertas</span>
                    </div>
                    {/* Solo muestra punto cuando hay alerta crítica activa con pulso suave */}
                    {hasCriticalAlert && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] ms-pulse-active" />
                    )}
                  </button>
                )}

                {/* 3. Escenarios */}
                {canAccessTab('SCENARIOS') && (
                  <button
                    id="tab-scenarios"
                    onClick={() => setActiveTab('SCENARIOS')}
                    aria-selected={activeTab === 'SCENARIOS'}
                    className={`w-full px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors border-l-2 rounded-r-md cursor-pointer ${
                      activeTab === 'SCENARIOS'
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)] font-medium'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Flame className={`w-3.5 h-3.5 ${activeTab === 'SCENARIOS' ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]'}`} />
                      <span>Escenarios</span>
                    </div>
                  </button>
                )}
              </nav>
            </div>

            {/* 2. SECCIÓN: IA & telemetría */}
            {(canAccessTab('ANALYTICS') || canAccessTab('LANGFLOW')) && (
              <div>
                <span className="text-[11px] font-medium text-[var(--text-faint)] px-2.5 mb-1 block">
                  IA & telemetría
                </span>
                <nav className="space-y-0.5">
                  {/* Telemetría & KPIs */}
                  {canAccessTab('ANALYTICS') && (
                    <button
                      id="tab-analytics"
                      onClick={() => setActiveTab('ANALYTICS')}
                      aria-selected={activeTab === 'ANALYTICS'}
                      className={`w-full px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors border-l-2 rounded-r-md cursor-pointer ${
                        activeTab === 'ANALYTICS'
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)] font-medium'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 className={`w-3.5 h-3.5 ${activeTab === 'ANALYTICS' ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]'}`} />
                        <span>Telemetría & KPIs</span>
                      </div>
                    </button>
                  )}

                  {/* Langflow Studio */}
                  {canAccessTab('LANGFLOW') && (
                    <button
                      id="tab-langflow"
                      onClick={() => setActiveTab('LANGFLOW')}
                      aria-selected={activeTab === 'LANGFLOW'}
                      className={`w-full px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors border-l-2 rounded-r-md cursor-pointer ${
                        activeTab === 'LANGFLOW'
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)] font-medium'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'LANGFLOW' ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]'}`} />
                        <span>Langflow Studio</span>
                      </div>
                    </button>
                  )}
                </nav>
              </div>
            )}

            {/* 3. SECCIÓN: Gobernanza & auditoría */}
            {(canAccessTab('ROLES') || canAccessTab('REPORTS') || canAccessTab('ETHICS')) && (
              <div>
                <span className="text-[11px] font-medium text-[var(--text-faint)] px-2.5 mb-1 block">
                  Gobernanza & auditoría
                </span>
                <nav className="space-y-0.5">
                  {/* Control de Roles (RBAC) */}
                  {canAccessTab('ROLES') && (
                    <button
                      id="tab-roles"
                      onClick={() => setActiveTab('ROLES')}
                      aria-selected={activeTab === 'ROLES'}
                      className={`w-full px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors border-l-2 rounded-r-md cursor-pointer ${
                        activeTab === 'ROLES'
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)] font-medium'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className={`w-3.5 h-3.5 ${activeTab === 'ROLES' ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]'}`} />
                        <span>Matriz RBAC</span>
                      </div>
                    </button>
                  )}

                  {/* Reportes MSHA */}
                  {canAccessTab('REPORTS') && (
                    <button
                      id="tab-reports"
                      onClick={() => setActiveTab('REPORTS')}
                      aria-selected={activeTab === 'REPORTS'}
                      className={`w-full px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors border-l-2 rounded-r-md cursor-pointer ${
                        activeTab === 'REPORTS'
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)] font-medium'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className={`w-3.5 h-3.5 ${activeTab === 'REPORTS' ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]'}`} />
                        <span>Reportes MSHA</span>
                      </div>
                    </button>
                  )}

                  {/* Consentimiento Ético */}
                  {canAccessTab('ETHICS') && (
                    <button
                      id="tab-ethics"
                      onClick={() => setActiveTab('ETHICS')}
                      aria-selected={activeTab === 'ETHICS'}
                      className={`w-full px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors border-l-2 rounded-r-md cursor-pointer ${
                        activeTab === 'ETHICS'
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)] font-medium'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className={`w-3.5 h-3.5 ${activeTab === 'ETHICS' ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]'}`} />
                        <span>Consentimiento</span>
                      </div>
                    </button>
                  )}
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Footer Lateral Compacto: Perfil en tarjeta única + Icon buttons + Pipeline 2 Hz */}
        <div className="p-3 border-t border-[var(--border)] space-y-2">
          {/* Perfil Compacto con Controles de Icono */}
          <div className="p-2 rounded-control border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-control border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-muted)] font-medium text-[11px] flex items-center justify-center flex-shrink-0">
                {currentUser.avatarInitials}
              </div>
              <div className="min-w-0 truncate">
                <p className="font-medium text-[11px] truncate text-[var(--text)]">
                  {currentUser.name}
                </p>
                <p className="text-[10px] truncate text-[var(--text-faint)]">
                  {currentUser.roleLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="btn-toggle-sim"
                onClick={() => setIsSimulating(!isSimulating)}
                title={isSimulating ? 'Pausar simulación' : 'Reanudar simulación'}
                className="ms-button-ghost p-1 rounded-control cursor-pointer"
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>

              <button
                id="btn-toggle-theme"
                onClick={toggleTheme}
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className="ms-button-ghost p-1 rounded-control cursor-pointer"
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              <button
                id="btn-sidebar-logout"
                onClick={handleLogout}
                title="Cerrar sesión"
                className="ms-button-ghost p-1 rounded-control cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pie mínimo de una línea: Punto de estado + Pipeline 2 Hz en mono */}
          <div 
            className="flex items-center justify-between text-[11px] px-1 text-[var(--text-faint)]"
            title="FastAPI 1 Hz / v1.0.0 Q1 • Pipeline de inferencia"
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendWsActive ? 'bg-[var(--success)]' : 'bg-[var(--text-faint)]'}`} />
              <span>Pipeline</span>
            </div>
            <span className="font-mono text-[11px]">2 Hz</span>
          </div>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL DERECHA (HUD + VISTAS) ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Cockpit HUD Header Superior */}
        <header className="h-12 border-b flex items-center justify-between px-4 sticky top-0 z-20 transition-colors bg-[var(--surface)] border-[var(--border)]">
          {/* Breadcrumb / Contexto Activo */}
          <div className="flex items-center gap-1.5 text-xs truncate">
            <span className="text-[var(--text-muted)]">Minera Esperanza</span>
            <span className="text-[var(--text-faint)]">/</span>
            <span className="text-[var(--text-muted)]">Tajo 3200</span>
            <span className="text-[var(--text-faint)]">/</span>
            <span className="font-medium truncate text-[var(--text)]">
              {activeTab === '3D_TWIN' && 'Gemelo digital 3D'}
              {activeTab === 'ALERTS' && 'Centro de alertas'}
              {activeTab === 'ANALYTICS' && 'Telemetría & KPIs (5-Fold CV)'}
              {activeTab === 'SCENARIOS' && 'Escenarios operacionales (A–E)'}
              {activeTab === 'LANGFLOW' && 'Langflow Studio & Agentes RAG'}
              {activeTab === 'ROLES' && 'Control de acceso (RBAC) & Auditoría'}
              {activeTab === 'REPORTS' && 'Centro de reportabilidad MSHA'}
              {activeTab === 'ETHICS' && 'Gobernanza ética & Privacidad'}
            </span>
          </div>

          {/* Métricas HUD a la Derecha */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Chip de Sensores: Punto success solo si sano */}
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-control border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
              <span>GNSS + LiDAR 3D</span>
            </div>

            {/* Botón Permisos */}
            {canAccessTab('ROLES') && (
              <button
                id="btn-nav-roles"
                onClick={() => setActiveTab('ROLES')}
                aria-pressed={activeTab === 'ROLES'}
                className="ms-button-neutral text-xs px-2.5 py-1 rounded-control cursor-pointer"
                title="Inspeccionar Matriz de Permisos y Auditoría (RBAC)"
              >
                Permisos
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace Area */}
        <main className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Protección Guard RBAC si el usuario accede a una pestaña no permitida */}
          {!canAccessTab(activeTab) && (
            <div className={`p-8 rounded-xl border text-center max-w-lg mx-auto mt-12 space-y-3 ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}>
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Módulo restringido por política RBAC</h3>
              <p className="text-xs opacity-75">
                El perfil activo <strong>{currentUser.roleLabel}</strong> ({currentUser.role}) no tiene autorización para acceder a esta vista.
              </p>
              <button
                onClick={() => setActiveTab(ROLE_PERMITTED_TABS[currentUser.role]?.[0] || '3D_TWIN')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg cursor-pointer border border-slate-700"
              >
                Volver a módulo autorizado
              </button>
            </div>
          )}

          {/* Tab 1: 3D Digital Twin & XAI SHAP Explanation Drawer */}
          {activeTab === '3D_TWIN' && canAccessTab('3D_TWIN') && (
            <div className="space-y-3">
              {/* Slim High-Density Alert Strip (Solo si hay alerta crítica activa) */}
              {hasCriticalAlert && (
                <div className="px-3.5 py-2 rounded-control flex items-center justify-between gap-3 text-xs border border-[var(--border)] border-l-[3px] border-l-[var(--danger)] bg-[var(--danger-soft)] text-[var(--text)]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-[var(--danger)] ms-pulse-active flex-shrink-0" />
                    <span className="font-semibold text-[var(--danger)] flex-shrink-0">Colisión inminente:</span>
                    <span className="truncate text-[var(--text-muted)]">HT-104 vs AHS-02 • Rampa Este • Anticipación: <span className="font-mono">6.2s</span></span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAcknowledgeAlert(alerts[0].id, currentUser.name)}
                      className="ms-button-primary text-xs px-3 py-1 cursor-pointer"
                    >
                      Reconocer
                    </button>
                    <button
                      onClick={() => setSelectedEquipmentId('eq-ht-104')}
                      className="ms-button-neutral text-xs px-3 py-1 cursor-pointer"
                    >
                      Inspeccionar SHAP
                    </button>
                  </div>
                </div>
              )}

              {/* Split View: 3D Twin Viewport + XAI SHAP Explanation Panel (7/5 Cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[580px] lg:h-[calc(100vh-125px)]">
                {/* 3D Canvas (Left Column - 7/12) */}
                <div className="lg:col-span-7 h-[480px] lg:h-full rounded-card overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
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
                <div className="lg:col-span-5 h-full overflow-y-auto">
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
          {activeTab === 'SCENARIOS' && canAccessTab('SCENARIOS') && (
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
          {activeTab === 'ALERTS' && canAccessTab('ALERTS') && (
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
          {activeTab === 'ANALYTICS' && canAccessTab('ANALYTICS') && (
            <AnalyticsDashboard 
              mshaIncidents={MSHA_HISTORICAL_INCIDENTS} 
              theme={theme}
            />
          )}

          {/* Tab 5: Langflow Studio & Academic Demo */}
          {activeTab === 'LANGFLOW' && canAccessTab('LANGFLOW') && (
            <div className="min-h-[calc(100vh-140px)] pb-6">
              <LangflowStudioModule isDark={isDark} />
            </div>
          )}

          {/* Tab 6: Control de Acceso RBAC & Auditoría Inmutable */}
          {activeTab === 'ROLES' && canAccessTab('ROLES') && (
            <div className="min-h-[calc(100vh-140px)] pb-6">
              <UserRolesModule
                currentRole={currentRole}
                onRoleChange={handleRoleChange}
                userName={currentUser.name}
                onLogout={handleLogout}
                auditLogs={auditLogs}
                theme={theme}
              />
            </div>
          )}

          {/* Tab 7: Reportes Oficiales MSHA (PDF/Excel) */}
          {activeTab === 'REPORTS' && canAccessTab('REPORTS') && (
            <div className="min-h-[calc(100vh-140px)] pb-6">
              <ReportsModule
                equipments={equipments}
                alerts={alerts}
                mshaIncidents={MSHA_HISTORICAL_INCIDENTS}
                consents={OPERATOR_CONSENTS}
                theme={theme}
              />
            </div>
          )}

          {/* Tab 8: Consentimiento Ético y Privacidad GDPR */}
          {activeTab === 'ETHICS' && canAccessTab('ETHICS') && (
            <div className="min-h-[calc(100vh-140px)] pb-6">
              <EthicsConsentModule
                consents={OPERATOR_CONSENTS}
                isAnonymized={isAnonymized}
                onToggleAnonymization={handleToggleAnonymization}
                theme={theme}
              />
            </div>
          )}
        </main>

        {/* Compact Footer */}
        <footer className={`border-t px-4 py-2 text-[11px] transition-colors mt-auto ${
          isDark ? 'bg-slate-900/60 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-600'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>MineSafe 3D • Sistema de Telemetría y Gemelo Digital</span>
            <div className="flex items-center gap-3 text-[10px]">
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

