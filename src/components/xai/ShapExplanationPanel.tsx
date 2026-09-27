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
        return 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/40';
      case 'HIGH':
        return 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/40';
      case 'MEDIUM':
        return 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/40';
      default:
        return 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/40';
    }
  };

  return (
    <div className={`h-full flex flex-col rounded-xl border overflow-hidden transition-colors ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between transition-colors ${
        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${
            isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <BrainCircuit className="w-4 h-4 text-slate-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {equipment.code}
              </h2>
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {equipment.model}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wide ${getBadgeStyle()}`}>
                {prediction.riskLevel} <span className="font-mono">{(riskScore * 100).toFixed(0)}%</span>
              </span>
            </div>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Zona: {equipment.currentZone}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={`ms-button-neutral text-xs px-2.5 py-1 rounded-lg cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-slate-200 bg-slate-800/60 border-slate-700' : 'text-slate-600 hover:text-slate-900 bg-white border-slate-200'
            }`}
          >
            Cerrar
          </button>
        )}
      </div>

      {/* Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Risk Prediction Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Risk Score */}
          <div className={`p-3 rounded-lg border transition-colors ${
            isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                Score de riesgo
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-xl font-bold font-mono ${
                prediction.riskLevel === 'CRITICAL' || prediction.riskLevel === 'HIGH'
                  ? 'text-[var(--danger)]'
                  : prediction.riskLevel === 'MEDIUM' ? 'text-[var(--warning)]' : 'text-[var(--success)]'
              }`}>
                {(riskScore * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] font-mono text-slate-500">/ 100%</span>
            </div>
            {/* Semantic Risk Bar */}
            <div className={`w-full h-1 rounded-full mt-2 overflow-hidden ${
              isDark ? 'bg-slate-800' : 'bg-slate-200'
            }`}>
              <div
                className={`h-full transition-all duration-300 ${
                  prediction.riskLevel === 'CRITICAL' || prediction.riskLevel === 'HIGH'
                    ? 'bg-[var(--danger)]'
                    : prediction.riskLevel === 'MEDIUM' ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'
                }`}
                style={{ width: `${Math.min(riskScore * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Time to Collision (TTC) */}
          <div className={`p-3 rounded-lg border transition-colors ${
            isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                TTC proyectado
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-[var(--warning)]">
                {prediction.timeToCollisionSec}s
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block mt-1">
              Anticipación: {prediction.predictionHorizonSec}s (H1)
            </span>
          </div>

          {/* Operation & Operator info */}
          <div className={`p-3 rounded-lg border col-span-2 sm:col-span-1 transition-colors ${
            isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                Operación
              </span>
            </div>
            <div className="mt-1 truncate">
              <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {equipment.isAutonomous ? 'AHS Autónomo' : operator?.operatorName || 'Manual'}
              </p>
              {!equipment.isAutonomous && operator && (
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Turno: {operator.shiftHoursAccumulated}h | PERCLOS: {(operator.perclosScore * 100).toFixed(0)}%
                </p>
              )}
            </div>
          </div>
        </div>

        <details className={`rounded-lg border transition-colors ${
          isDark ? 'bg-slate-950/30 border-slate-800' : 'bg-slate-50/50 border-slate-200'
        }`}>
          <summary className="flex items-center justify-between gap-3 px-3.5 py-3 list-none cursor-pointer">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Desglose causal · TreeSHAP
            </span>
            <span className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
              {prediction.shapFactors.length} factores
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </summary>
          <div className="px-3.5 pb-3.5 space-y-2.5">
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--danger)]" />
                Aumenta
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                Reduce
              </span>
            </div>

          {/* Factor Contribution Bars */}
          <div className="space-y-2 pt-1">
            {prediction.shapFactors.map((factor, idx) => {
              // Rojo = aumenta riesgo (+), Verde = disminuye riesgo (-)
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
                      <span className={`truncate text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {factor.featureName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[11px]">
                      <span className="text-slate-500 text-[10px]">
                        {factor.unitValueString}
                      </span>
                      <span className={`font-semibold ${textColor}`}>
                        {sign}{factor.percentageWeight}%
                      </span>
                    </div>
                  </div>
                  {/* Contribution bar */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
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
        <div className={`p-3 rounded-lg border flex items-start gap-2.5 transition-colors ${
          isDark ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold text-slate-200 dark:text-slate-200">Recomendación: </span>
            <span className="text-slate-400">{prediction.counterfactualRecommendation}</span>
          </div>
        </div>

        {/* Action Buttons for Supervisor */}
        <div className="pt-1 flex flex-col sm:flex-row gap-2">
          <button
            id="btn-send-cab-warning"
            onClick={() => onSendCabWarning && onSendCabWarning(equipment.id)}
            className={`${prediction.riskLevel === 'CRITICAL' ? 'ms-button-danger' : 'ms-button-neutral'} flex-1 font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Aviso acústico a cabina</span>
          </button>

          {!equipment.isAutonomous && operator && (
            <button
              id="btn-request-relief"
              onClick={() => onRequestRelief && onRequestRelief(operator.operatorId)}
              className={`${prediction.riskLevel === 'CRITICAL' ? 'ms-button-neutral' : 'ms-button-primary'} flex-1 font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Solicitar relevo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
