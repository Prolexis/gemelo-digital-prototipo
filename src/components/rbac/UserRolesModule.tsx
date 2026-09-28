import React from 'react';
import { UserRole, AuditLogEntry } from '../../types/mining';
import { 
  UserCheck, 
  ShieldCheck, 
  Eye, 
  Lock, 
  FileText, 
  Sliders, 
  Check, 
  X, 
  History, 
  Activity,
  LogOut 
} from 'lucide-react';

interface UserRolesModuleProps {
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onLogout?: () => void;
  userName?: string;
  auditLogs: AuditLogEntry[];
  theme?: 'dark' | 'light';
}

export const UserRolesModule: React.FC<UserRolesModuleProps> = ({
  currentRole,
  onRoleChange,
  onLogout,
  userName,
  auditLogs,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const rolesList: { id: UserRole; name: string; description: string }[] = [
    {
      id: 'ADMIN',
      name: 'Administrador del Sistema',
      description: 'Acceso total a configuración de servidores, modelos ML y usuarios.',
    },
    {
      id: 'SAFETY_SUPERVISOR',
      name: 'Supervisor de Seguridad (HSE)',
      description: 'Gestión de alertas de cabina, relevos por fatiga y reportabilidad.',
    },
    {
      id: 'OPERATOR',
      name: 'Operador de Camión',
      description: 'Vista simplificada de cabina con alertas de proximidad y audio.',
    },
    {
      id: 'DATA_ANALYST',
      name: 'Analista de Datos / Data Scientist',
      description: 'Inspección de telemetría, calibración de pesos SHAP y benchmarks.',
    },
    {
      id: 'AUDITOR',
      name: 'Auditor Externo (MSHA)',
      description: 'Acceso de solo lectura para fiscalización y compliance ético.',
    },
  ];

  const permissionsMatrix = [
    { feature: 'Visualización de Gemelo Digital 3D en Vivo', ADMIN: true, SAFETY_SUPERVISOR: true, OPERATOR: true, DATA_ANALYST: true, AUDITOR: true },
    { feature: 'Desglose Explicable de Factores SHAP (XAI)', ADMIN: true, SAFETY_SUPERVISOR: true, OPERATOR: false, DATA_ANALYST: true, AUDITOR: true },
    { feature: 'Disparo de Alertas Acústicas a Cabina', ADMIN: true, SAFETY_SUPERVISOR: true, OPERATOR: false, DATA_ANALYST: false, AUDITOR: false },
    { feature: 'Inyección de Escenarios Críticos en Tiempo Real', ADMIN: true, SAFETY_SUPERVISOR: true, OPERATOR: false, DATA_ANALYST: true, AUDITOR: false },
    { feature: 'Exportación de Reportes PDF y Excel', ADMIN: true, SAFETY_SUPERVISOR: true, OPERATOR: false, DATA_ANALYST: true, AUDITOR: true },
    { feature: 'Desanonimización de Datos Biométricos de Operadores', ADMIN: true, SAFETY_SUPERVISOR: true, OPERATOR: false, DATA_ANALYST: false, AUDITOR: false },
    { feature: 'Calibración de Pesos de Inferencia Multi-Modal', ADMIN: true, SAFETY_SUPERVISOR: false, OPERATOR: false, DATA_ANALYST: true, AUDITOR: false },
  ];

  return (
    <div className="ms-card p-5 space-y-6 text-[var(--text)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">
              Control de acceso basado en roles (RBAC)
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Usuario: <span className="font-mono text-[var(--text)]">{userName || 'Usuario Corporativo'}</span> • Rol activo: <span className="font-mono text-[var(--text)]">{currentRole}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="ms-badge-neutral text-xs font-mono">
            {currentRole}
          </span>
          {onLogout && (
            <button
              onClick={onLogout}
              className="ms-button-neutral flex items-center gap-1.5 px-3 py-1 text-xs"
              title="Cerrar sesión actual"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Selection Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-[var(--text-faint)]">
            Perfiles de seguridad disponibles:
          </h3>
          <span className="text-[11px] text-[var(--text-faint)] font-mono">
            ISO 27001 / SOC2
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {rolesList.map((r) => {
            const isCurrent = currentRole === r.id;
            return (
              <button
                key={r.id}
                id={`btn-role-${r.id}`}
                onClick={() => onRoleChange(r.id)}
                aria-pressed={isCurrent}
                className={`p-3 rounded-[var(--radius-card)] text-left border transition-colors cursor-pointer ${
                  isCurrent
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius-control)] border ${
                    isCurrent ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--surface)]' : 'border-[var(--border)] text-[var(--text-faint)]'
                  }`}>
                    {r.id}
                  </span>
                  {isCurrent && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                </div>
                <h4 className="text-xs font-semibold mt-2 text-[var(--text)]">{r.name}</h4>
                <p className="text-[11px] mt-1 leading-snug text-[var(--text-muted)]">{r.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Granular Permissions Table */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-medium text-[var(--text-faint)]">
          Matriz de permisos por funcionalidad
        </h3>
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] text-[11px] bg-[var(--surface-2)] text-[var(--text-faint)]">
              <tr>
                <th className="p-3 font-medium">Funcionalidad</th>
                <th className={`p-3 text-center font-medium ${currentRole === 'ADMIN' ? 'text-[var(--accent)] bg-[var(--accent-soft)]' : ''}`}>ADMIN</th>
                <th className={`p-3 text-center font-medium ${currentRole === 'SAFETY_SUPERVISOR' ? 'text-[var(--accent)] bg-[var(--accent-soft)]' : ''}`}>SUPERVISOR</th>
                <th className={`p-3 text-center font-medium ${currentRole === 'OPERATOR' ? 'text-[var(--accent)] bg-[var(--accent-soft)]' : ''}`}>OPERADOR</th>
                <th className={`p-3 text-center font-medium ${currentRole === 'DATA_ANALYST' ? 'text-[var(--accent)] bg-[var(--accent-soft)]' : ''}`}>DATA ANALYST</th>
                <th className={`p-3 text-center font-medium ${currentRole === 'AUDITOR' ? 'text-[var(--accent)] bg-[var(--accent-soft)]' : ''}`}>AUDITOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
              {permissionsMatrix.map((perm, idx) => (
                <tr key={idx} className="hover:bg-[var(--surface-2)] transition-colors">
                  <td className="p-3 font-medium text-[var(--text)]">{perm.feature}</td>
                  <td className={`p-3 text-center ${currentRole === 'ADMIN' ? 'bg-[var(--accent-soft)]/50' : ''}`}>
                    {perm.ADMIN ? <Check className="w-3.5 h-3.5 text-[var(--text-muted)] mx-auto" /> : <span className="text-[var(--text-faint)]">—</span>}
                  </td>
                  <td className={`p-3 text-center ${currentRole === 'SAFETY_SUPERVISOR' ? 'bg-[var(--accent-soft)]/50' : ''}`}>
                    {perm.SAFETY_SUPERVISOR ? <Check className="w-3.5 h-3.5 text-[var(--text-muted)] mx-auto" /> : <span className="text-[var(--text-faint)]">—</span>}
                  </td>
                  <td className={`p-3 text-center ${currentRole === 'OPERATOR' ? 'bg-[var(--accent-soft)]/50' : ''}`}>
                    {perm.OPERATOR ? <Check className="w-3.5 h-3.5 text-[var(--text-muted)] mx-auto" /> : <span className="text-[var(--text-faint)]">—</span>}
                  </td>
                  <td className={`p-3 text-center ${currentRole === 'DATA_ANALYST' ? 'bg-[var(--accent-soft)]/50' : ''}`}>
                    {perm.DATA_ANALYST ? <Check className="w-3.5 h-3.5 text-[var(--text-muted)] mx-auto" /> : <span className="text-[var(--text-faint)]">—</span>}
                  </td>
                  <td className={`p-3 text-center ${currentRole === 'AUDITOR' ? 'bg-[var(--accent-soft)]/50' : ''}`}>
                    {perm.AUDITOR ? <Check className="w-3.5 h-3.5 text-[var(--text-muted)] mx-auto" /> : <span className="text-[var(--text-faint)]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-[var(--text-faint)] flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[var(--accent)]" />
            Registro de auditoría
          </h3>
          <span className="text-[11px] font-mono text-[var(--text-faint)]">Trazabilidad ISO 27001</span>
        </div>

        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)] max-h-56">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] text-[11px] sticky top-0 bg-[var(--surface-2)] text-[var(--text-faint)]">
              <tr>
                <th className="p-2.5 font-medium">Timestamp</th>
                <th className="p-2.5 font-medium">Rol</th>
                <th className="p-2.5 font-medium">Acción</th>
                <th className="p-2.5 font-medium">Recurso</th>
                <th className="p-2.5 font-medium">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--surface-2)] transition-colors">
                  <td className="p-2.5 font-mono text-[var(--text-muted)]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="p-2.5 font-mono text-[var(--text-muted)]">{log.userRole}</td>
                  <td className="p-2.5 font-medium text-[var(--text)]">{log.action}</td>
                  <td className="p-2.5 font-mono text-[var(--text)]">{log.resource}</td>
                  <td className="p-2.5 text-[var(--text-muted)]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
