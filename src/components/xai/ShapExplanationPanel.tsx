import React from 'react';
import { Equipment, ShapFactor } from '../../types/mining';
import { 
  BrainCircuit, 
  UserCheck, 
  Eye, 
  Gauge, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle, 
  Volume2, 
  Sliders, 
  Sparkles,
  Zap
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface ShapExplanationPanelProps {
  equipment: Equipment | null;
  onSendCabWarning?: (equipmentId: string) => void;
  onRequestRelief?: (operatorId: string) => void;
  onClose?: () => void;
}

export const ShapExplanationPanel: React.FC<ShapExplanationPanelProps> = ({
  equipment,
  onSendCabWarning,
  onRequestRelief,
  onClose,
}) => {
  if (!equipment) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
        <BrainCircuit className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-slate-300">Selecciona un Equipo en el Gemelo Digital 3D</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Haz clic en cualquier camión de extracción, pala o vehículo para inspeccionar sus factores de riesgo SHAP y telemetría en tiempo real.
        </p>
      </div>
    );
  }

  const prediction = equipment.currentPrediction;
  const operator = equipment.assignedOperator;
  const riskScore = prediction.overallRiskScore;

  // Color mapping based on risk level
  const getBadgeStyle = () => {
    switch (prediction.riskLevel) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-rose-950/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-orange-950/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-yellow-950/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-emerald-950/40';
    }
  };

  const getFactorCategoryColor = (category: ShapFactor['category']) => {
    switch (category) {
      case 'COMPORTAMIENTO_OPERADOR':
        return { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', fill: '#f43f5e' };
      case 'CINEMATICA_GNSS':
        return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', fill: '#f59e0b' };
      case 'PERCEPCION_LIDAR':
        return { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30', fill: '#0ea5e9' };
      case 'ENTORNO_MINERO':
        return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', fill: '#10b981' };
    }
  };

  const chartData = prediction.shapFactors.map(factor => ({
    name: factor.featureName.length > 26 ? factor.featureName.substring(0, 24) + '...' : factor.featureName,
    fullName: factor.featureName,
    weight: factor.percentageWeight,
    attribution: factor.attributionValue,
    category: factor.category,
    color: getFactorCategoryColor(factor.category).fill,
  }));

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-700/80 border border-slate-600 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">{equipment.code}</h2>
              <span className="text-xs text-slate-400 font-mono">({equipment.model.split(' ')[0]} {equipment.model.split(' ')[1]})</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getBadgeStyle()}`}>
                {prediction.riskLevel} ({(riskScore * 100).toFixed(0)}%)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{equipment.currentZone}</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        )}
      </div>

      {/* Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-200">
        {/* Risk Prediction Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              Score de Riesgo
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono ${prediction.riskLevel === 'CRITICAL' ? 'text-rose-400' : prediction.riskLevel === 'HIGH' ? 'text-orange-400' : 'text-emerald-400'}`}>
                {(riskScore * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">/ 100%</span>
            </div>
            {/* Risk bar */}
            <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  prediction.riskLevel === 'CRITICAL' ? 'bg-rose-500' : prediction.riskLevel === 'HIGH' ? 'bg-orange-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${riskScore * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              TTC (Impacto)
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-sky-300">
                {prediction.timeToCollisionSec}s
              </span>
              <span className="text-[10px] text-slate-400">proyectado</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium block mt-1">
              Ventana alerta: {prediction.predictionHorizonSec}s (H1)
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              Operación
            </span>
            <div className="mt-1">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {equipment.isAutonomous ? 'AHS Autónomo FrontRunner' : operator?.operatorName || 'Manual'}
              </p>
              {!equipment.isAutonomous && operator && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Turno: <span className="font-mono text-amber-400">{operator.shiftHoursAccumulated}h</span> | PERCLOS: <span className="font-mono text-rose-400">{(operator.perclosScore * 100).toFixed(0)}%</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Explainability Breakdown (Por qué el riesgo es alto - XAI SHAP) */}
        <div className="bg-slate-800/40 border border-slate-700/70 p-3.5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Atribución Explicable de Factores (SHAP)
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Fast TreeSHAP v1.2</span>
          </div>

          {/* Recharts Bar Chart of SHAP Contributions */}
          <div className="h-36 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 24, left: 10, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 9.5, fill: '#cbd5e1' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs shadow-xl">
                          <p className="font-bold text-slate-200">{data.fullName}</p>
                          <p className="text-amber-400 font-mono mt-1">Peso en Riesgo: {data.weight}%</p>
                          <p className="text-slate-400 text-[10px]">Atribución SHAP: {data.attribution > 0 ? `+${data.attribution}` : data.attribution}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Factor Cards */}
          <div className="space-y-2 pt-1">
            {prediction.shapFactors.map((factor, idx) => {
              const styles = getFactorCategoryColor(factor.category);
              return (
                <div key={idx} className={`p-2.5 rounded-lg border ${styles.bg} ${styles.border} text-xs space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{factor.featureName}</span>
                    <span className={`font-mono font-bold ${styles.text}`}>
                      {factor.percentageWeight}%
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{factor.humanReadableReason}</p>
                  <div className="text-[10px] text-slate-400 font-mono bg-slate-900/60 px-2 py-0.5 rounded inline-block">
                    Medición: {factor.unitValueString}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Counterfactual Prescription (Recomendación Contrafáctica) */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
              Prescripción Contrafáctica (Mitigación)
            </h4>
            <p className="text-xs text-emerald-200 leading-relaxed">
              {prediction.counterfactualRecommendation}
            </p>
          </div>
        </div>

        {/* Action Buttons for Supervisor */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            id="btn-send-cab-warning"
            onClick={() => onSendCabWarning && onSendCabWarning(equipment.id)}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition-all"
          >
            <Volume2 className="w-4 h-4" />
            <span>Alerta Acústica a Cabina</span>
          </button>

          {!equipment.isAutonomous && operator && (
            <button
              id="btn-request-relief"
              onClick={() => onRequestRelief && onRequestRelief(operator.operatorId)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>Programar Relevo por Fatiga</span>
            </button>
          )}
        </div>

        {/* Model Pipeline Metadata */}
        <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-500 font-mono flex flex-wrap justify-between gap-y-1">
          <span>Percepción: {prediction.modelVersions.perception}</span>
          <span>Comportamiento: {prediction.modelVersions.behavior}</span>
          <span>Fusión: {prediction.modelVersions.fusion}</span>
        </div>
      </div>
    </div>
  );
};
