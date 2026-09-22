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

  return (
    <div className={`rounded-2xl border shadow-xl p-4 flex flex-col h-full space-y-3 transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b transition-colors ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Alertas de Proximidad & Colisión
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 font-mono font-bold">
                {alerts.filter(a => a.status === 'ACTIVE').length} Activas
              </span>
            </h2>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          id="btn-toggle-sound"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors border cursor-pointer ${
            soundEnabled 
              ? 'bg-amber-500/20 text-amber-500 border-amber-500/40' 
              : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-300'
          }`}
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
          className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            filterSeverity === 'ALL'
              ? isDark ? 'bg-slate-800 text-white font-bold' : 'bg-white text-slate-900 font-bold shadow-xs'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todas ({alerts.length})
        </button>
        <button
          onClick={() => setFilterSeverity('CRITICAL')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            filterSeverity === 'CRITICAL'
              ? 'bg-rose-500/20 text-rose-500 font-bold border border-rose-500/40'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Críticas ({alerts.filter(a => a.severity === 'CRITICAL').length})
        </button>
        <button
          onClick={() => setFilterSeverity('WARNING')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            filterSeverity === 'WARNING'
              ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-bold border border-yellow-500/40'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Advertencias ({alerts.filter(a => a.severity === 'WARNING').length})
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500">
            <CheckCircle className="w-10 h-10 text-emerald-500/40 mb-2" />
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
                    ? isDark 
                      ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/40'
                      : 'bg-rose-50/80 border-rose-300 shadow-xs'
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
                          ? 'bg-rose-500/20 text-rose-500 border-rose-500/50 animate-pulse' 
                          : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {alert.alertCode}
                      </span>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>• {alert.zone}</span>
                    </div>

                    <h3 className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {alert.sourceEquipmentCode} {alert.targetEquipmentCode ? `vs ${alert.targetEquipmentCode}` : ''}
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>+{alert.earlyWarningAnticipationSec}s anticipación</span>
                    </div>
                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Score: {(alert.riskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* SHAP Explanation Summary */}
                <div className={`mt-2.5 p-2.5 rounded-lg border space-y-1 ${
                  isDark ? 'bg-slate-900/80 border-slate-700/60' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 dark:text-slate-300">
                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                    <span>Diagnóstico Causal de Riesgo (TreeSHAP):</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {alert.shapExplanationSummary}
                  </p>
                </div>

                {/* Recommended Action & Acknowledge Button */}
                <div className={`mt-3 pt-2.5 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                  isDark ? 'border-slate-700/60' : 'border-slate-200'
                }`}>
                  <div className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    <strong className={isDark ? 'text-slate-300 font-semibold' : 'text-slate-800 font-semibold'}>Acción: </strong>
                    {alert.recommendedAction}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onSelectEquipment(alert.sourceEquipmentId)}
                      className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border ${
                        isDark 
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
                      }`}
                    >
                      <span>Ver en 3D</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {isActive ? (
                      <button
                        id={`btn-ack-${alert.id}`}
                        onClick={() => onAcknowledgeAlert(alert.id, 'Supervisor HSE')}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Reconocer Alerta</span>
                      </button>
                    ) : (
                      <span className={`text-[11px] font-mono flex items-center gap-1 px-2 py-1 rounded ${
                        isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      }`}>
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
