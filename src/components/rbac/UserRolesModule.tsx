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
  Activity
} from 'lucide-react';

interface UserRolesModuleProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  auditLogs: AuditLogEntry[];
}

export const UserRolesModule: React.FC<UserRolesModuleProps> = ({
  currentRole,
  onRoleChange,
  auditLogs,
}) => {
  const rolesList: { id: UserRole; name: string; description: string; badgeColor: string }[] = [
    {
      id: 'ADMIN',
      name: 'Administrador del Sistema',
      description: 'Acceso total a configuración de servidores, modelos ML y usuarios.',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      id: 'SAFETY_SUPERVISOR',
      name: 'Supervisor de Seguridad (HSE)',
      description: 'Gestión de alertas de cabina, relevos por fatiga y reportabilidad.',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'OPERATOR',
      name: 'Operador de Camión',
      description: 'Vista simplificada de cabina con alertas de proximidad y audio.',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    },
    {
      id: 'DATA_ANALYST',
      name: 'Analista de Datos / Data Scientist',
      description: 'Inspección de telemetría, calibración de pesos SHAP y benchmarks.',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
    {
      id: 'AUDITOR',
      name: 'Auditor Externo (MSHA)',
      description: 'Acceso de solo lectura para fiscalización y compliance ético.',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
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
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-5 space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Control de Acceso Basado en Roles (RBAC) & Registro de Auditoría</h2>
            <p className="text-xs text-slate-400">Gestión de privilegios para supervisores, operadores, científicos de datos y auditores</p>
          </div>
        </div>

        <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/30">
          Rol Activo: {currentRole}
        </span>
      </div>

      {/* Role Selection Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Seleccionar Perfil Activo para Probar la Interfaz:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {rolesList.map((r) => {
            const isCurrent = currentRole === r.id;
            return (
              <button
                key={r.id}
                id={`btn-role-${r.id}`}
                onClick={() => onRoleChange(r.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-950/40'
                    : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.badgeColor}`}>
                    {r.id}
                  </span>
                  {isCurrent && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <h4 className="text-xs font-bold text-slate-100 mt-2">{r.name}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{r.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Granular Permissions Table */}
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Matriz de Permisos por Módulo
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
              <tr>
                <th className="p-3">Funcionalidad / Módulo</th>
                <th className="p-3 text-center">ADMIN</th>
                <th className="p-3 text-center">SUPERVISOR</th>
                <th className="p-3 text-center">OPERADOR</th>
                <th className="p-3 text-center">DATA ANALYST</th>
                <th className="p-3 text-center">AUDITOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {permissionsMatrix.map((perm, idx) => (
                <tr key={idx} className="hover:bg-slate-900/60">
                  <td className="p-3 font-medium text-slate-200">{perm.feature}</td>
                  <td className="p-3 text-center">{perm.ADMIN ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}</td>
                  <td className="p-3 text-center">{perm.SAFETY_SUPERVISOR ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}</td>
                  <td className="p-3 text-center">{perm.OPERATOR ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}</td>
                  <td className="p-3 text-center">{perm.DATA_ANALYST ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}</td>
                  <td className="p-3 text-center">{perm.AUDITOR ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <History className="w-4 h-4 text-amber-400" />
            Registro Inmutable de Auditoría (Audit Log)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Trazabilidad ISO 27001 / SOC2</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 max-h-56">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono text-[11px] sticky top-0">
              <tr>
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">Usuario / Rol</th>
                <th className="p-2.5">Acción</th>
                <th className="p-2.5">Recurso / Equipo</th>
                <th className="p-2.5">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/60 font-mono text-[11px]">
                  <td className="p-2.5 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="p-2.5 font-bold text-amber-400">{log.userRole}</td>
                  <td className="p-2.5 text-slate-200">{log.action}</td>
                  <td className="p-2.5 text-sky-400">{log.resource}</td>
                  <td className="p-2.5 text-slate-400 font-sans text-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
