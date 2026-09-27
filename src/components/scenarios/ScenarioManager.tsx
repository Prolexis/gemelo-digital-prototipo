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
      <div className={`flex items-center justify-between pb-2.5 border-b transition-colors ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>
          <h2 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Simulador de Escenarios
          </h2>
        </div>

        <button
          id="btn-reset-baseline"
          onClick={onResetToBaseline}
          className="ms-button-neutral text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer</span>
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex p-1 rounded-xl my-2.5 border transition-colors ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          id="tab-preset-scenarios"
          onClick={() => setActiveTab('PRESET')}
          aria-pressed={activeTab === 'PRESET'}
          className="ms-button-neutral flex-1 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
        >
          Escenarios Canónicos (A–E)
        </button>
        <button
          id="tab-custom-injector"
          onClick={() => setActiveTab('INJECTOR')}
          aria-pressed={activeTab === 'INJECTOR'}
          className="ms-button-neutral flex-1 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
        >
          Inyector Manual
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {activeTab === 'PRESET' ? (
          <div className="space-y-2">
            {MINING_SCENARIOS.map((scenario) => {
              const isActive = activeScenarioId === scenario.id;
              return (
                <div
                  key={scenario.id}
                  id={`scenario-card-${scenario.id}`}
                  className={`p-3 rounded-xl border transition-all ${
                    isActive
                      ? isDark 
                        ? 'bg-[var(--accent-soft)] border-[var(--accent)]'
                        : 'bg-slate-800/60 border-slate-700/70'
                      : isDark 
                        ? 'bg-slate-800/60 border-slate-700/70 hover:border-slate-600' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        scenario.severityLevel === 'CRITICAL' 
                          ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/40'
                          : 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/40'
                      }`}>
                        {scenario.severityLevel}
                      </span>
                      <h3 className={`text-xs font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {scenario.title}
                      </h3>
                    </div>

                    <button
                      id={`btn-run-scenario-${scenario.id}`}
                      onClick={() => onActivateScenario(scenario)}
                      aria-pressed={isActive}
                      className="ms-button-neutral px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isActive ? 'Activo' : 'Cargar'}</span>
                    </button>
                  </div>

                  <div className={`mt-2 flex items-center justify-between text-[11px] ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <span>{scenario.zone}</span>
                    <span className="font-mono text-[var(--warning)] font-medium">TTC: {scenario.initialTtcSec}s</span>
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
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Equipo: HT-104</span>
            </div>

            {/* Slider 1: Horas de Turno */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Clock className="w-3.5 h-3.5 text-[var(--warning)]" />
                  Horas de Turno Continuas:
                </span>
                <span className="font-mono font-bold text-[var(--warning)]">{shiftHours.toFixed(1)} hrs</span>
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
                <span className="text-[var(--danger)]">14h (Fatiga extrema)</span>
              </div>
            </div>

            {/* Slider 2: PERCLOS (Cierre Ocular) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Eye className="w-3.5 h-3.5 text-[var(--warning)]" />
                  Índice PERCLOS (Somnolencia):
                </span>
                <span className="font-mono font-bold text-[var(--warning)]">{perclos}%</span>
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
                <span className="text-[var(--danger)]">&gt;40% (Micro-sueño)</span>
              </div>
            </div>

            {/* Slider 3: Velocidad en Rampa */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Gauge className="w-3.5 h-3.5 text-slate-400" />
                  Velocidad de Descenso:
                </span>
                <span className="font-mono font-bold text-slate-300">{speed} km/h</span>
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
                <CloudSun className="w-3.5 h-3.5 text-[var(--accent)]" />
                Condición Ambiental y Visibilidad:
              </label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value as any)}
                className={`w-full text-xs rounded-lg p-2 outline-none border transition-colors ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-[var(--accent)]'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-[var(--accent)]'
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
              className="ms-button-primary w-full font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
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
