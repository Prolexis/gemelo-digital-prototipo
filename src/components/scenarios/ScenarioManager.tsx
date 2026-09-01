import React, { useState } from 'react';
import { MiningScenario, Equipment } from '../../types/mining';
import { MINING_SCENARIOS } from '../../data/mockMineData';
import { 
  Play, 
  RotateCcw, 
  Sliders, 
  ShieldAlert, 
  CloudSun, 
  Clock, 
  Gauge, 
  Eye, 
  Sparkles,
  AlertTriangle,
  Flame
} from 'lucide-react';

interface ScenarioManagerProps {
  activeScenarioId: string | null;
  onActivateScenario: (scenario: MiningScenario) => void;
  onResetToBaseline: () => void;
  onCustomInject: (params: {
    operatorShiftHours: number;
    perclos: number;
    speedKmh: number;
    visibilityIndex: number;
    weather: 'CLEAR' | 'DUST_STORM' | 'HEAVY_FOG' | 'NIGHT_RAIN';
  }) => void;
  currentEquipment: Equipment | null;
}

export const ScenarioManager: React.FC<ScenarioManagerProps> = ({
  activeScenarioId,
  onActivateScenario,
  onResetToBaseline,
  onCustomInject,
  currentEquipment,
}) => {
  const [activeTab, setActiveTab] = useState<'PRESET' | 'INJECTOR'>('PRESET');

  // Custom injection controls
  const [shiftHours, setShiftHours] = useState(10.5);
  const [perclos, setPerclos] = useState(35); // 0 to 100%
  const [speed, setSpeed] = useState(38);
  const [visibility, setVisibility] = useState(55); // 0 to 100%
  const [weather, setWeather] = useState<'CLEAR' | 'DUST_STORM' | 'HEAVY_FOG' | 'NIGHT_RAIN'>('DUST_STORM');

  const handleApplyCustomInjection = () => {
    onCustomInject({
      operatorShiftHours: shiftHours,
      perclos: perclos / 100,
      speedKmh: speed,
      visibilityIndex: visibility / 100,
      weather,
    });
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Simulador de Escenarios Críticos</h2>
            <p className="text-[11px] text-slate-400">Pruebas de Hipótesis de Anticipación H1 (≥5s)</p>
          </div>
        </div>

        <button
          id="btn-reset-baseline"
          onClick={onResetToBaseline}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-xl my-3 border border-slate-800">
        <button
          id="tab-preset-scenarios"
          onClick={() => setActiveTab('PRESET')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'PRESET' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Escenarios Mineros Preconfigurados
        </button>
        <button
          id="tab-custom-injector"
          onClick={() => setActiveTab('INJECTOR')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'INJECTOR' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Inyector de Variables en Vivo
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {activeTab === 'PRESET' ? (
          <div className="space-y-2.5">
            {MINING_SCENARIOS.map((scenario) => {
              const isActive = activeScenarioId === scenario.id;
              return (
                <div
                  key={scenario.id}
                  id={`scenario-card-${scenario.id}`}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-950/40'
                      : 'bg-slate-800/60 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          scenario.severityLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                        }`}>
                          {scenario.severityLevel}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{scenario.zone}</span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-100 mt-1.5">{scenario.title}</h3>
                    </div>

                    <button
                      id={`btn-run-scenario-${scenario.id}`}
                      onClick={() => onActivateScenario(scenario)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-emerald-950/40'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isActive ? 'Activo' : 'Cargar'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {scenario.description}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Factor SHAP esperado: <strong className="text-slate-300">{scenario.expectedShapDominance}</strong></span>
                    <span>TTC inicial: <strong className="font-mono text-sky-400">{scenario.initialTtcSec}s</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Modulador Dinámico de Telemetría
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Equipo: HT-104</span>
            </div>

            {/* Slider 1: Horas de Turno */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Horas de Turno Continuas:
                </span>
                <span className="font-mono font-bold text-amber-400">{shiftHours.toFixed(1)} hrs</span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                step="0.5"
                value={shiftHours}
                onChange={(e) => setShiftHours(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1h (Descansado)</span>
                <span>8h (Límite normal)</span>
                <span className="text-rose-400">14h (Fatiga extrema)</span>
              </div>
            </div>

            {/* Slider 2: PERCLOS (Cierre Ocular) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  Índice PERCLOS (Somnolencia):
                </span>
                <span className="font-mono font-bold text-purple-400">{perclos}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="1"
                value={perclos}
                onChange={(e) => setPerclos(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0-12% (Normal)</span>
                <span>25% (Umbral Fatiga)</span>
                <span className="text-rose-400">&gt;40% (Micro-sueño)</span>
              </div>
            </div>

            {/* Slider 3: Velocidad en Rampa */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-sky-400" />
                  Velocidad de Descenso:
                </span>
                <span className="font-mono font-bold text-sky-400">{speed} km/h</span>
              </div>
              <input
                type="range"
                min="5"
                max="55"
                step="1"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Weather & Road Condition */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 flex items-center gap-1.5">
                <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                Condición Ambiental y Visibilidad:
              </label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value as any)}
                className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none focus:border-amber-500"
              >
                <option value="CLEAR">Despejado (Visibilidad 100%)</option>
                <option value="DUST_STORM">Polvareda Intensa en Rampa (Visibilidad 40%)</option>
                <option value="HEAVY_FOG">Niebla Densa en Tajo (Visibilidad 25%)</option>
                <option value="NIGHT_RAIN">Lluvia Nocturna y Barro (Pérdida de Adherencia)</option>
              </select>
            </div>

            {/* Submit Injection */}
            <button
              id="btn-apply-injection"
              onClick={handleApplyCustomInjection}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Inyectar en Motor de Inferencia en Tiempo Real</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
