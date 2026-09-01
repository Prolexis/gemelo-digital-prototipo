import React, { useState } from 'react';
import { CollisionAlert, Equipment } from '../../types/mining';
import { 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Filter, 
  User, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

interface AlertsCenterProps {
  alerts: CollisionAlert[];
  equipments: Equipment[];
  onAcknowledgeAlert: (alertId: string, supervisorName: string) => void;
  onSelectEquipment: (equipmentId: string) => void;
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({
  alerts,
  equipments,
  onAcknowledgeAlert,
  onSelectEquipment,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [supervisorName, setSupervisorName] = useState('Ing. Patricia Valenzuela (HSE)');

  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity === 'ALL') return true;
    return alert.severity === filterSeverity;
  });

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-4 flex flex-col h-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Centro de Alertas de Colisión Temprana (XAI)
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono font-bold">
                {alerts.filter(a => a.status === 'ACTIVE').length} Activas
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Emisión anticipada ≥5s sobre sistemas de proximidad PDS</p>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          id="btn-toggle-sound"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors border ${
            soundEnabled ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title={soundEnabled ? 'Silenciar avisos sonoros' : 'Activar avisos sonoros'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">{soundEnabled ? 'Audio Activo' : 'Silenciado'}</span>
        </button>
      </div>

      {/* Filter Bar & Supervisor Profile */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold text-[11px] uppercase">Filtrar:</span>
          <button
            onClick={() => setFilterSeverity('ALL')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterSeverity === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas ({alerts.length})
          </button>
          <button
            onClick={() => setFilterSeverity('CRITICAL')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterSeverity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Críticas ({alerts.filter(a => a.severity === 'CRITICAL').length})
          </button>
          <button
            onClick={() => setFilterSeverity('WARNING')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterSeverity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Advertencias ({alerts.filter(a => a.severity === 'WARNING').length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Supervisor:</span>
          <input
            type="text"
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
            className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-200 text-xs outline-none focus:border-amber-500"
          />
        </div>
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
                    ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/40'
                    : 'bg-slate-800/60 border-slate-700/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        isCritical ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-200">{alert.alertCode}</span>
                      <span className="text-[11px] text-slate-400">• {alert.zone}</span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-100 mt-1">
                      {alert.sourceEquipmentCode} {alert.targetEquipmentCode ? `vs ${alert.targetEquipmentCode}` : ''}
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>+{alert.earlyWarningAnticipationSec}s anticipación</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Score: {(alert.riskScore * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* SHAP Explanation Summary */}
                <div className="mt-2.5 bg-slate-900/80 border border-slate-700/60 p-2.5 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Causa Raíz Explicable (XAI):</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {alert.shapExplanationSummary}
                  </p>
                </div>

                {/* Recommended Action & Acknowledge Button */}
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-xs text-emerald-300">
                    <strong className="text-slate-300 font-semibold">Acción: </strong>
                    {alert.recommendedAction}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onSelectEquipment(alert.sourceEquipmentId)}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <span>Ver en 3D</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {isActive ? (
                      <button
                        id={`btn-ack-${alert.id}`}
                        onClick={() => onAcknowledgeAlert(alert.id, supervisorName)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Reconocer Alerta</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded">
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
