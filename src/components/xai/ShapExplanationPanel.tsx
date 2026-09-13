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
      <div className={`h-full flex flex-col items-center justify-center p-8 text-center rounded-2xl border transition-colors ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <BrainCircuit className="w-12 h-12 text-slate-400 mb-3 animate-pulse" />
        <h3 className={`text-base font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
          Selecciona un Equipo en el Gemelo Digital 3D
        </h3>
        <p className={`text-xs max-w-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
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
        return 'bg-rose-500/20 text-rose-500 border-rose-500/50 shadow-rose-950/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-500 border-orange-500/50 shadow-orange-950/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50';
    }
  };

  const getFactorCategoryColor = (category: ShapFactor['category']) => {
    switch (category) {
      case 'COMPORTAMIENTO_OPERADOR':
        return { 
          bg: isDark ? 'bg-rose-500/15' : 'bg-rose-50', 
          text: isDark ? 'text-rose-400' : 'text-rose-700', 
          border: isDark ? 'border-rose-500/30' : 'border-rose-200', 
          fill: '#f43f5e' 
        };
      case 'CINEMATICA_GNSS':
        return { 
          bg: isDark ? 'bg-amber-500/15' : 'bg-amber-50', 
          text: isDark ? 'text-amber-400' : 'text-amber-700', 
          border: isDark ? 'border-amber-500/30' : 'border-amber-200', 
          fill: '#f59e0b' 
        };
      case 'PERCEPCION_LIDAR':
        return { 
          bg: isDark ? 'bg-sky-500/15' : 'bg-sky-50', 
          text: isDark ? 'text-sky-400' : 'text-sky-700', 
          border: isDark ? 'border-sky-500/30' : 'border-sky-200', 
          fill: '#0ea5e9' 
        };
      case 'ENTORNO_MINERO':
        return { 
          bg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50', 
          text: isDark ? 'text-emerald-400' : 'text-emerald-700', 
          border: isDark ? 'border-emerald-500/30' : 'border-emerald-200', 
          fill: '#10b981' 
        };
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
    <div className={`h-full flex flex-col rounded-2xl border shadow-xl overflow-hidden transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-start justify-between transition-colors ${
        isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-100/90 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
            isDark ? 'bg-slate-700/80 border-slate-600' : 'bg-white border-slate-300 shadow-xs'
          }`}>
            <BrainCircuit className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{equipment.code}</h2>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ({equipment.model.split(' ')[0]} {equipment.model.split(' ')[1]})
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getBadgeStyle()}`}>
                {prediction.riskLevel} ({(riskScore * 100).toFixed(0)}%)
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{equipment.currentZone}</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={`text-xs px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 bg-slate-200 hover:bg-slate-300'
            }`}
          >
            Cerrar
          </button>
        )}
      </div>

      {/* Content Scrollable */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
        isDark ? 'text-slate-200' : 'text-slate-800'
      }`}>
        {/* Risk Prediction Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className={`p-3 rounded-xl border transition-colors ${
            isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-[11px] uppercase font-semibold flex items-center gap-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <Gauge className="w-3.5 h-3.5 text-amber-500" />
              Score de Riesgo
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono ${
                prediction.riskLevel === 'CRITICAL' ? 'text-rose-500' : prediction.riskLevel === 'HIGH' ? 'text-orange-500' : 'text-emerald-500'
              }`}>
                {(riskScore * 100).toFixed(0)}%
              </span>
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>/ 100%</span>
            </div>
            {/* Risk bar */}
            <div className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${
              isDark ? 'bg-slate-700' : 'bg-slate-200'
            }`}>
              <div
                className={`h-full transition-all duration-500 ${
                  prediction.riskLevel === 'CRITICAL' ? 'bg-rose-500' : prediction.riskLevel === 'HIGH' ? 'bg-orange-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${riskScore * 100}%` }}
              />
            </div>
          </div>

          <div className={`p-3 rounded-xl border transition-colors ${
            isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-[11px] uppercase font-semibold flex items-center gap-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              TTC (Impacto)
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>
                {prediction.timeToCollisionSec}s
              </span>
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>proyectado</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-1">
              Ventana alerta: {prediction.predictionHorizonSec}s (H1)
            </span>
          </div>

          <div className={`p-3 rounded-xl border col-span-2 sm:col-span-1 transition-colors ${
            isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-[11px] uppercase font-semibold flex items-center gap-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <UserCheck className="w-3.5 h-3.5 text-purple-500" />
              Operación
            </span>
            <div className="mt-1">
              <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {equipment.isAutonomous ? 'AHS Autónomo FrontRunner' : operator?.operatorName || 'Manual'}
              </p>
              {!equipment.isAutonomous && operator && (
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Turno: <span className="font-mono font-bold text-amber-500">{operator.shiftHoursAccumulated}h</span> | PERCLOS: <span className="font-mono font-bold text-rose-500">{(operator.perclosScore * 100).toFixed(0)}%</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Explainability Breakdown (Por qué el riesgo es alto - XAI SHAP) */}
        <div className={`p-3.5 rounded-xl border space-y-3 transition-colors ${
          isDark ? 'bg-slate-800/40 border-slate-700/70' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Atribución Explicable de Factores (SHAP)
              </h3>
            </div>
            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fast TreeSHAP v1.2</span>
          </div>

          {/* Recharts Bar Chart of SHAP Contributions */}
          <div className="h-36 w-full min-h-[144px] min-w-0 pt-1">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 24, left: 10, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} unit="%" />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 9.5, fill: isDark ? '#cbd5e1' : '#334155' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className={`p-2.5 rounded-lg text-xs shadow-xl border ${
                          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-md'
                        }`}>
                          <p className="font-bold">{data.fullName}</p>
                          <p className="text-amber-500 font-mono mt-1">Peso en Riesgo: {data.weight}%</p>
                          <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Atribución SHAP: {data.attribution > 0 ? `+${data.attribution}` : data.attribution}
                          </p>
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
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{factor.featureName}</span>
                    <span className={`font-mono font-bold ${styles.text}`}>
                      {factor.percentageWeight}%
                    </span>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{factor.humanReadableReason}</p>
                  <div className={`text-[10px] font-mono px-2 py-0.5 rounded inline-block ${
                    isDark ? 'text-slate-400 bg-slate-900/60' : 'text-slate-600 bg-white border border-slate-200 shadow-xs'
                  }`}>
                    Medición: {factor.unitValueString}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Counterfactual Prescription (Recomendación Contrafáctica) */}
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 transition-colors ${
          isDark ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
              Prescripción Contrafáctica (Mitigación)
            </h4>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>
              {prediction.counterfactualRecommendation}
            </p>
          </div>
        </div>

        {/* Action Buttons for Supervisor */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            id="btn-send-cab-warning"
            onClick={() => onSendCabWarning && onSendCabWarning(equipment.id)}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Alerta Acústica a Cabina</span>
          </button>

          {!equipment.isAutonomous && operator && (
            <button
              id="btn-request-relief"
              onClick={() => onRequestRelief && onRequestRelief(operator.operatorId)}
              className={`flex-1 font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40' 
                  : 'bg-white hover:bg-slate-50 text-amber-700 border-amber-400 shadow-xs'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Programar Relevo por Fatiga</span>
            </button>
          )}
        </div>

        {/* Model Pipeline Metadata */}
        <div className={`border-t pt-3 text-[10px] font-mono flex flex-wrap justify-between gap-y-1 ${
          isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
        }`}>
          <span>Percepción: {prediction.modelVersions.perception}</span>
          <span>Comportamiento: {prediction.modelVersions.behavior}</span>
          <span>Fusión: {prediction.modelVersions.fusion}</span>
        </div>
      </div>
    </div>
  );
};
