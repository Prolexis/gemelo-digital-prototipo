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
  const [soundEnabled, setSoundEnabled] = useState(false);

  const isDark = theme === 'dark';

  // Función para reproducir tono de alarma minera industrial usando Web Audio API
  const playMineAlarmSound = (type: 'beep' | 'toggle') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'toggle') {
        // Tono de confirmación de activación (Chime agradable)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else {
        // Alerta de Proximidad Minera Industrial Norma ISO 21815 / CAS Level 9 (PDS Proximity Chime)
        // Triple pulso nítido armónico (no chillón, profesional)
        const now = ctx.currentTime;
        const freqs = [784, 987.77, 1174.66]; // G5, B5, D6 (Acorde mayor de advertencia)
        
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          // Onda tipo triangular/seno para sonido de display industrial de cabina (estilo Caterpillar/Hexagon)
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + (idx * 0.09));
          
          gain.gain.setValueAtTime(0.18, now + (idx * 0.09));
          gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.09) + 0.16);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + (idx * 0.09));
          osc.stop(now + (idx * 0.09) + 0.16);
        });
      }
    } catch {
      // Ignorar restricciones de audio del navegador si no hay interacción
    }
  };

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState) {
      playMineAlarmSound('beep');
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity === 'ALL') return true;
    return alert.severity === filterSeverity;
  });
  const primaryAlertId = alerts.find(alert => alert.status === 'ACTIVE' && alert.severity === 'CRITICAL')?.id
    ?? alerts.find(alert => alert.status === 'ACTIVE')?.id;

  return (
    <div className="rounded-card border border-[var(--border)] p-4 flex flex-col h-full space-y-3 bg-[var(--surface)] text-[var(--text)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-control bg-[var(--surface-2)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--accent-text)]">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold flex items-center gap-2 text-[var(--text)]">
              Centro de alertas de proximidad
              {alerts.some(a => a.status === 'ACTIVE') && (
                <span className="ms-badge-risk-critical">
                  {alerts.filter(a => a.status === 'ACTIVE').length} activas
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          id="btn-toggle-sound"
          onClick={handleToggleSound}
          aria-pressed={soundEnabled}
          className={`px-2.5 py-1 text-xs flex items-center gap-1.5 cursor-pointer rounded-control transition-colors ${
            soundEnabled
              ? 'bg-[var(--accent)] text-white shadow-xs'
              : 'ms-button-neutral'
          }`}
          title={soundEnabled ? 'Silenciar avisos sonoros' : 'Activar avisos sonoros de alarma'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{soundEnabled ? 'Audio activado' : 'Audio desactivado'}</span>
        </button>
      </div>

      {/* Filter Bar as Segmented Control */}
      <div className="flex items-center gap-1 p-1 rounded-control border border-[var(--border)] bg-[var(--surface-2)] text-xs">
        <span className="text-[11px] text-[var(--text-faint)] px-2 font-medium">
          Filtrar:
        </span>
        <button
          onClick={() => setFilterSeverity('ALL')}
          aria-pressed={filterSeverity === 'ALL'}
          className="ms-button-neutral px-2.5 py-1 text-xs cursor-pointer"
        >
          Todas ({alerts.length})
        </button>
        <button
          onClick={() => setFilterSeverity('CRITICAL')}
          aria-pressed={filterSeverity === 'CRITICAL'}
          className="ms-button-neutral px-2.5 py-1 text-xs cursor-pointer"
        >
          Críticas ({alerts.filter(a => a.severity === 'CRITICAL').length})
        </button>
        <button
          onClick={() => setFilterSeverity('WARNING')}
          aria-pressed={filterSeverity === 'WARNING'}
          className="ms-button-neutral px-2.5 py-1 text-xs cursor-pointer"
        >
          Advertencias ({alerts.filter(a => a.severity === 'WARNING').length})
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-[var(--text-faint)] border border-dashed border-[var(--border)] rounded-card p-6">
            <CheckCircle className="w-8 h-8 text-[var(--text-faint)] mb-2" />
            <p className="text-xs font-medium text-[var(--text-muted)]">No hay alertas registradas</p>
            <p className="text-[11px] text-[var(--text-faint)] mt-0.5">El sistema no detecta riesgos bajo este filtro de severidad.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isActive = alert.status === 'ACTIVE';

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`p-3.5 rounded-card border border-[var(--border)] bg-[var(--surface)] transition-all ${
                  isCritical
                    ? 'border-l-[3px] border-l-[var(--danger)]'
                    : 'border-l-[3px] border-l-[var(--warning)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={isCritical ? 'ms-badge-risk-critical' : 'ms-badge-risk-medium'}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-semibold font-mono text-[var(--text)]">
                        {alert.alertCode}
                      </span>
                      <span className="text-[11px] text-[var(--text-faint)]">• {alert.zone}</span>
                    </div>

                    <h3 className="text-xs font-semibold mt-1 text-[var(--text)]">
                      {alert.sourceEquipmentCode} {alert.targetEquipmentCode ? `vs ${alert.targetEquipmentCode}` : ''}
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono">+{alert.earlyWarningAnticipationSec}s</span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-faint)]">
                      Score: {(alert.riskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)]">
                    Explicación de riesgo (TreeSHAP)
                  </summary>
                  <p className="pt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
                    {alert.shapExplanationSummary}
                  </p>
                </details>

                {/* Recommended Action & Acknowledge Button */}
                <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-xs text-[var(--text-muted)]">
                    <span className="font-medium text-[var(--text)]">Acción: </span>
                    {alert.recommendedAction}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                    <button
                      onClick={() => onSelectEquipment(alert.sourceEquipmentId)}
                      className="ms-button-neutral text-xs px-2.5 py-1 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver 3D</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {isActive ? (
                      <button
                        id={`btn-ack-${alert.id}`}
                        onClick={() => onAcknowledgeAlert(alert.id, 'Supervisor HSE')}
                        className={`text-xs px-3 py-1 flex items-center gap-1.5 cursor-pointer ${
                          primaryAlertId === alert.id
                            ? 'ms-button-primary'
                            : 'ms-button-neutral'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Reconocer</span>
                      </button>
                    ) : (
                      <span className="ms-badge-neutral text-[10px] flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-[var(--success)]" />
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
