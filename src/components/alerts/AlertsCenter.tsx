import React, { useState } from 'react';
import { CollisionAlert, Equipment } from '../../types/mining';
import { 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Volume2, 
  VolumeX, 
  ChevronRight,
  Activity
} from 'lucide-react';

interface AlertsCenterProps {
  alerts: CollisionAlert[];
  equipments: Equipment[];
  onAcknowledgeAlert: (alertId: string, supervisorName: string) => void;
  onSelectEquipment: (equipmentId: string) => void;
  theme?: 'dark' | 'light';
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({
  alerts,
  equipments,
  onAcknowledgeAlert,
  onSelectEquipment,
  theme = 'dark',
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const isDark = theme === 'dark';

  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity === 'ALL') return true;
    return alert.severity === filterSeverity;
  });
  const primaryAlertId = alerts.find(alert => alert.status === 'ACTIVE' && alert.severity === 'CRITICAL')?.id
    ?? alerts.find(alert => alert.status === 'ACTIVE')?.id;

  return (
    <div className={`rounded-2xl border shadow-xl p-4 flex flex-col h-full space-y-3 transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b transition-colors ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Alertas de Proximidad & Colisión
              <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${
                alerts.some(a => a.status === 'ACTIVE')
                  ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30'
                  : 'ms-badge-neutral'
              }`}>
                {alerts.filter(a => a.status === 'ACTIVE').length} Activas
              </span>
            </h2>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          id="btn-toggle-sound"
          onClick={() => setSoundEnabled(!soundEnabled)}
          aria-pressed={soundEnabled}
          className="ms-button-neutral p-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
          title={soundEnabled ? 'Silenciar avisos sonoros' : 'Activar avisos sonoros'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline font-semibold">{soundEnabled ? 'Audio' : 'Silenciado'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs transition-colors ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <span className={`font-semibold text-[11px] uppercase mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Filtrar:
        </span>
        <button
          onClick={() => setFilterSeverity('ALL')}
          aria-pressed={filterSeverity === 'ALL'}
          className="ms-button-neutral px-2.5 py-1 rounded-lg font-medium cursor-pointer"
        >
          Todas ({alerts.length})
        </button>
        <button
          onClick={() => setFilterSeverity('CRITICAL')}
          aria-pressed={filterSeverity === 'CRITICAL'}
          className="ms-button-neutral px-2.5 py-1 rounded-lg font-medium cursor-pointer"
        >
          Críticas ({alerts.filter(a => a.severity === 'CRITICAL').length})
        </button>
        <button
          onClick={() => setFilterSeverity('WARNING')}
          aria-pressed={filterSeverity === 'WARNING'}
          className="ms-button-neutral px-2.5 py-1 rounded-lg font-medium cursor-pointer"
        >
          Advertencias ({alerts.filter(a => a.severity === 'WARNING').length})
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500">
            <CheckCircle className="w-10 h-10 text-slate-500 mb-2" />
            <p className="text-xs">No hay alertas registradas en esta categoría.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isActive = alert.status === 'ACTIVE';

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`p-4 rounded-xl border transition-all ${
                  isCritical && isActive
                      ? 'bg-[var(--danger)]/10 border-[var(--danger)]/40'
                    : isDark 
                      ? 'bg-slate-800/60 border-slate-700/80' 
                      : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        isCritical 
                          ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/40 animate-pulse'
                          : 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/40'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {alert.alertCode}
                      </span>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>• {alert.zone}</span>
                    </div>

                    <h3 className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {alert.sourceEquipmentCode} {alert.targetEquipmentCode ? `vs ${alert.targetEquipmentCode}` : ''}
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>+{alert.earlyWarningAnticipationSec}s anticipación</span>
                    </div>
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Score: {(alert.riskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <details className="mt-2.5">
                  <summary className="cursor-pointer text-xs font-medium text-[var(--text-soft)]">
                    Ver explicación de riesgo (TreeSHAP)
                  </summary>
                  <p className={`pt-2 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {alert.shapExplanationSummary}
                  </p>
                </details>

                {/* Recommended Action & Acknowledge Button */}
                <div className={`mt-3 pt-2.5 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                  isDark ? 'border-slate-700/60' : 'border-slate-200'
                }`}>
                  <div className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <strong className={isDark ? 'text-slate-300 font-semibold' : 'text-slate-800 font-semibold'}>Acción: </strong>
                    {alert.recommendedAction}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onSelectEquipment(alert.sourceEquipmentId)}
                      className="ms-button-neutral text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver en 3D</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {isActive ? (
                      <button
                        id={`btn-ack-${alert.id}`}
                        onClick={() => onAcknowledgeAlert(alert.id, 'Supervisor HSE')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                          primaryAlertId === alert.id
                            ? 'ms-button-primary'
                            : 'ms-button-neutral'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Reconocer Alerta</span>
                      </button>
                    ) : (
                      <span className="ms-badge-neutral text-[11px] flex items-center gap-1 px-2 py-1 rounded">
                        <CheckCircle className="w-3 h-3" />
                        Reconocida por {alert.acknowledgedBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
