import React from 'react';
import { Equipment, ShapFactor } from '../../types/mining';
import { 
  BrainCircuit, 
  UserCheck, 
  Gauge, 
  Clock, 
  CheckCircle2, 
  Volume2, 
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown
} from 'lucide-react';

interface ShapExplanationPanelProps {
  equipment: Equipment | null;
  onSendCabWarning?: (equipmentId: string) => void;
  onRequestRelief?: (operatorId: string) => void;
  onClose?: () => void;
  theme?: 'dark' | 'light';
}

export const ShapExplanationPanel: React.FC<ShapExplanationPanelProps> = ({
  equipment,
  onSendCabWarning,
  onRequestRelief,
  onClose,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  if (!equipment) {
    return (
      <div className={`h-full flex flex-col items-center justify-center p-8 text-center rounded-xl border transition-colors ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <BrainCircuit className="w-10 h-10 text-slate-500 mb-3" />
        <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          Selecciona un equipo en el visor 3D
        </h3>
        <p className={`text-xs max-w-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Haz clic en cualquier vehículo de la flota para auditar en tiempo real sus factores causales TreeSHAP y telemetría cinemática.
        </p>
      </div>
    );
  }

  const prediction = equipment.currentPrediction;
  const operator = equipment.assignedOperator;
  const riskScore = prediction.overallRiskScore;

  // Strict semantic risk badges
  const getBadgeStyle = () => {
    switch (prediction.riskLevel) {
      case 'CRITICAL':
        return 'ms-badge-risk-critical';
      case 'HIGH':
        return 'ms-badge-risk-high';
      case 'MEDIUM':
        return 'ms-badge-risk-medium';
      default:
        return 'ms-badge-risk-low';
    }
  };

  return (
    <div className="h-full flex flex-col rounded-card border border-[var(--border)] overflow-hidden bg-[var(--surface)] text-[var(--text)]">
      {/* Header */}
      <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-2)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-control border border-[var(--border-strong)] flex items-center justify-center flex-shrink-0 bg-[var(--surface)] text-[var(--accent-text)]">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold tracking-tight text-[var(--text)]">
                {equipment.code}
              </h2>
              <span className="text-[11px] text-[var(--text-faint)]">
                {equipment.model}
              </span>
              <span className={getBadgeStyle()}>
                {prediction.riskLevel} <span className="font-mono">{(riskScore * 100).toFixed(0)}%</span>
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Zona: {equipment.currentZone}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="ms-button-neutral text-xs px-2 py-0.5 cursor-pointer"
          >
            Cerrar
          </button>
        )}
      </div>

      {/* Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {/* Risk Prediction Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* Risk Score */}
          <div className="p-2.5 rounded-control border border-[var(--border)] bg-[var(--surface-2)]">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-faint)]">
              <span className="flex items-center gap-1 font-medium">
                <Gauge className="w-3.5 h-3.5" />
                Score de riesgo
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-lg font-bold font-mono ${
                prediction.riskLevel === 'CRITICAL' 
                  ? 'text-[var(--danger)]' 
                  : prediction.riskLevel === 'HIGH' 
                  ? 'text-[var(--risk-high)]' 
                  : prediction.riskLevel === 'MEDIUM' 
                  ? 'text-[var(--warning)]' 
                  : 'text-[var(--success)]'
              }`}>
                {(riskScore * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] font-mono text-[var(--text-faint)]">/ 100%</span>
            </div>
            {/* Semantic Risk Bar */}
            <div className="w-full h-1 rounded-full mt-2 overflow-hidden bg-[var(--border)]">
              <div
                className={`h-full transition-all duration-300 ${
                  prediction.riskLevel === 'CRITICAL' 
                    ? 'bg-[var(--danger)]' 
                    : prediction.riskLevel === 'HIGH' 
                    ? 'bg-[var(--risk-high)]' 
                    : prediction.riskLevel === 'MEDIUM' 
                    ? 'bg-[var(--warning)]' 
                    : 'bg-[var(--success)]'
                }`}
                style={{ width: `${Math.min(riskScore * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Time to Collision (TTC) */}
          <div className="p-2.5 rounded-control border border-[var(--border)] bg-[var(--surface-2)]">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-faint)]">
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5" />
                TTC proyectado
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-lg font-bold font-mono ${
                prediction.timeToCollisionSec <= 5 ? 'text-[var(--danger)]' : 'text-[var(--text)]'
              }`}>
                {prediction.timeToCollisionSec}s
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-faint)] block mt-1">
              Anticipación: {prediction.predictionHorizonSec}s
            </span>
          </div>

          {/* Operation & Operator info */}
          <div className="p-2.5 rounded-control border border-[var(--border)] bg-[var(--surface-2)] col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-faint)]">
              <span className="flex items-center gap-1 font-medium">
                <UserCheck className="w-3.5 h-3.5" />
                Operación
              </span>
            </div>
            <div className="mt-1 truncate">
              <p className="text-xs font-semibold truncate text-[var(--text)]">
                {equipment.isAutonomous ? 'AHS Autónomo' : operator?.operatorName || 'Manual'}
              </p>
              {!equipment.isAutonomous && operator && (
                <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5 truncate">
                  {operator.shiftHoursAccumulated}h | PERCLOS: {(operator.perclosScore * 100).toFixed(0)}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* TreeSHAP Causal Breakdown */}
        <details className="rounded-control border border-[var(--border)] bg-[var(--surface-2)]">
          <summary className="flex items-center justify-between gap-2 px-3 py-2.5 list-none cursor-pointer">
            <span className="text-xs font-medium text-[var(--text)]">
              Desglose causal · TreeSHAP
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-[var(--text-faint)]">
              {prediction.shapFactors.length} factores
              <ChevronDown className="w-3 h-3" />
            </span>
          </summary>
          <div className="px-3 pb-3 space-y-2 border-t border-[var(--border)] pt-2.5">
            <div className="flex items-center gap-3 text-[10px] text-[var(--text-faint)]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
                Aumenta riesgo
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                Mitiga
              </span>
            </div>

            {/* Factor Contribution Bars */}
            <div className="space-y-2 pt-1">
              {prediction.shapFactors.map((factor, idx) => {
                const increasesRisk = factor.attributionValue >= 0;
                const barColor = increasesRisk ? 'bg-[var(--danger)]' : 'bg-[var(--success)]';
                const textColor = increasesRisk ? 'text-[var(--danger)]' : 'text-[var(--success)]';
                const sign = increasesRisk ? '+' : '';

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {increasesRisk ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-[var(--danger)] flex-shrink-0" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-[var(--success)] flex-shrink-0" />
                        )}
                        <span className="truncate text-[11px] font-medium text-[var(--text-muted)]">
                          {factor.featureName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[11px]">
                        <span className="text-[var(--text-faint)] text-[10px]">
                          {factor.unitValueString}
                        </span>
                        <span className={`font-semibold ${textColor}`}>
                          {sign}{factor.percentageWeight}%
                        </span>
                      </div>
                    </div>
                    {/* Contribution bar */}
                    <div className="w-full h-1 rounded-full overflow-hidden bg-[var(--border)]">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${Math.min(Math.abs(factor.percentageWeight), 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </details>

        {/* Action Recommendation */}
        <div className="p-3 rounded-control border border-[var(--border)] bg-[var(--surface-2)] flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold text-[var(--text)]">Recomendación: </span>
            <span className="text-[var(--text-muted)]">{prediction.counterfactualRecommendation}</span>
          </div>
        </div>

        {/* Action Buttons for Supervisor */}
        <div className="pt-1 flex flex-col sm:flex-row gap-2">
          <button
            id="btn-send-cab-warning"
            onClick={() => onSendCabWarning && onSendCabWarning(equipment.id)}
            className={`${prediction.riskLevel === 'CRITICAL' ? 'ms-button-danger' : 'ms-button-neutral'} flex-1 text-xs py-1.5 px-3 cursor-pointer`}
          >
            <Volume2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Aviso acústico a cabina</span>
          </button>

          {!equipment.isAutonomous && operator && (
            <button
              id="btn-request-relief"
              onClick={() => onRequestRelief && onRequestRelief(operator.operatorId)}
              className={`${prediction.riskLevel === 'CRITICAL' ? 'ms-button-neutral' : 'ms-button-primary'} flex-1 text-xs py-1.5 px-3 cursor-pointer`}
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
              <span>Solicitar relevo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
