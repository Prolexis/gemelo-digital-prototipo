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
  theme?: 'dark' | 'light';
}

export const ScenarioManager: React.FC<ScenarioManagerProps> = ({
  activeScenarioId,
  onActivateScenario,
  onResetToBaseline,
  onCustomInject,
  currentEquipment,
  theme = 'dark',
}) => {
  const [activeTab, setActiveTab] = useState<'PRESET' | 'INJECTOR'>('PRESET');

  // Custom injection controls
  const [shiftHours, setShiftHours] = useState(10.5);
  const [perclos, setPerclos] = useState(35); // 0 to 100%
  const [speed, setSpeed] = useState(38);
  const [visibility, setVisibility] = useState(55); // 0 to 100%
  const [weather, setWeather] = useState<'CLEAR' | 'DUST_STORM' | 'HEAVY_FOG' | 'NIGHT_RAIN'>('DUST_STORM');

  const isDark = theme === 'dark';

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
    <div className={`rounded-2xl border shadow-xl p-4 flex flex-col h-full transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b transition-colors ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Simulador de Escenarios Críticos
            </h2>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Pruebas de Hipótesis de Anticipación H1 (≥5s)
            </p>
          </div>
        </div>

        <button
          id="btn-reset-baseline"
          onClick={onResetToBaseline}
          className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors border cursor-pointer ${
            isDark 
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer</span>
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex p-1 rounded-xl my-3 border transition-colors ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          id="tab-preset-scenarios"
          onClick={() => setActiveTab('PRESET')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'PRESET'
              ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Escenarios Mineros Preconfigurados
        </button>
        <button
          id="tab-custom-injector"
          onClick={() => setActiveTab('INJECTOR')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'INJECTOR'
              ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
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
                      ? isDark 
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-950/40' 
                        : 'bg-amber-50 border-amber-400 shadow-xs'
                      : isDark 
                        ? 'bg-slate-800/60 border-slate-700/70 hover:border-slate-600' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          scenario.severityLevel === 'CRITICAL' 
                            ? 'bg-rose-500/20 text-rose-500 border-rose-500/40' 
                            : 'bg-orange-500/20 text-orange-500 border-orange-500/40'
                        }`}>
                          {scenario.severityLevel}
                        </span>
                        <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{scenario.zone}</span>
                      </div>
                      <h3 className={`text-xs font-bold mt-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{scenario.title}</h3>
                    </div>

                    <button
                      id={`btn-run-scenario-${scenario.id}`}
                      onClick={() => onActivateScenario(scenario)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-emerald-950/40 font-bold'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isActive ? 'Activo' : 'Cargar'}</span>
                    </button>
                  </div>

                  <p className={`text-[11px] mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {scenario.description}
                  </p>

                  <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] ${
                    isDark ? 'border-slate-700/60 text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}>
                    <span>Factor SHAP esperado: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{scenario.expectedShapDominance}</strong></span>
                    <span>TTC inicial: <strong className="font-mono text-sky-500">{scenario.initialTtcSec}s</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`p-3.5 rounded-xl border space-y-4 transition-colors ${
            isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Modulador Dinámico de Telemetría
              </h3>
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Equipo: HT-104</span>
            </div>

            {/* Slider 1: Horas de Turno */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Horas de Turno Continuas:
                </span>
                <span className="font-mono font-bold text-amber-500">{shiftHours.toFixed(1)} hrs</span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                step="0.5"
                value={shiftHours}
                onChange={(e) => setShiftHours(parseFloat(e.target.value))}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500 ${
                  isDark ? 'bg-slate-700' : 'bg-slate-300'
                }`}
              />
              <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>1h (Descansado)</span>
                <span>8h (Límite normal)</span>
                <span className="text-rose-500">14h (Fatiga extrema)</span>
              </div>
            </div>

            {/* Slider 2: PERCLOS (Cierre Ocular) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Eye className="w-3.5 h-3.5 text-purple-500" />
                  Índice PERCLOS (Somnolencia):
                </span>
                <span className="font-mono font-bold text-purple-500">{perclos}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="1"
                value={perclos}
                onChange={(e) => setPerclos(parseInt(e.target.value))}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-500 ${
                  isDark ? 'bg-slate-700' : 'bg-slate-300'
                }`}
              />
              <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>0-12% (Normal)</span>
                <span>25% (Umbral Fatiga)</span>
                <span className="text-rose-500">&gt;40% (Micro-sueño)</span>
              </div>
            </div>

            {/* Slider 3: Velocidad en Rampa */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Gauge className="w-3.5 h-3.5 text-sky-500" />
                  Velocidad de Descenso:
                </span>
                <span className="font-mono font-bold text-sky-500">{speed} km/h</span>
              </div>
              <input
                type="range"
                min="5"
                max="55"
                step="1"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-500 ${
                  isDark ? 'bg-slate-700' : 'bg-slate-300'
                }`}
              />
            </div>

            {/* Weather & Road Condition */}
            <div className="space-y-1.5">
              <label className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                Condición Ambiental y Visibilidad:
              </label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value as any)}
                className={`w-full text-xs rounded-lg p-2 outline-none border transition-colors ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-amber-500' 
                    : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                }`}
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
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Aplicar Parámetros de Telemetría</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
