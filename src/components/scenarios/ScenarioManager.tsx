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
    <div className="ms-card p-4 flex flex-col h-full text-[var(--text)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-control bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Simulador de escenarios
          </h2>
        </div>

        <button
          id="btn-reset-baseline"
          onClick={onResetToBaseline}
          className="ms-button-neutral text-xs px-2.5 py-1 rounded-control flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer</span>
        </button>
      </div>

      {/* Tabs */}
      {/* Tabs */}
      <div className="flex p-1 rounded-control my-2 border border-[var(--border)] bg-[var(--surface-2)]">
        <button
          id="tab-preset-scenarios"
          onClick={() => setActiveTab('PRESET')}
          aria-pressed={activeTab === 'PRESET'}
          className="ms-button-neutral flex-1 py-1 text-xs cursor-pointer"
        >
          Escenarios canónicos (A–E)
        </button>
        <button
          id="tab-custom-injector"
          onClick={() => setActiveTab('INJECTOR')}
          aria-pressed={activeTab === 'INJECTOR'}
          className="ms-button-neutral flex-1 py-1 text-xs cursor-pointer"
        >
          Inyector manual
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {activeTab === 'PRESET' ? (
          <div className="space-y-2">
            {MINING_SCENARIOS.map((scenario) => {
              const isActive = activeScenarioId === scenario.id;
              const isCritical = scenario.severityLevel === 'CRITICAL';
              return (
                <div
                  key={scenario.id}
                  id={`scenario-card-${scenario.id}`}
                  className={`p-3 rounded-card border transition-all ${
                    isActive
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className={isCritical ? 'ms-badge-risk-critical' : 'ms-badge-risk-high'}>
                        {scenario.severityLevel}
                      </span>
                      <h3 className="text-xs font-semibold truncate text-[var(--text)]">
                        {scenario.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isActive ? (
                        <span className="ms-badge-neutral text-[10px] px-2 py-0.5 border-[var(--accent-border)] text-[var(--accent-text)]">
                          Activo
                        </span>
                      ) : (
                        <button
                          id={`btn-run-scenario-${scenario.id}`}
                          onClick={() => onActivateScenario(scenario)}
                          className="ms-button-neutral px-2.5 py-0.5 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Cargar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span>{scenario.zone}</span>
                    <span className="font-mono text-[var(--text)]">TTC: <span className="font-bold">{scenario.initialTtcSec}s</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3.5 rounded-card border border-[var(--border)] bg-[var(--surface)] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--text)]">
                Modulador dinámico de telemetría
              </h3>
              <span className="text-[10px] font-mono text-[var(--text-faint)]">Equipo: HT-104</span>
            </div>

            {/* Slider 1: Horas de Turno */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                  Horas de turno:
                </span>
                <span className="font-mono text-xs text-[var(--text)]">{shiftHours.toFixed(1)} hrs</span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                step="0.5"
                value={shiftHours}
                onChange={(e) => setShiftHours(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[var(--border)] accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-faint)]">
                <span>1h</span>
                <span>8h (Normal)</span>
                <span className="text-[var(--danger)]">14h (Fatiga)</span>
              </div>
            </div>

            {/* Slider 2: PERCLOS */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Eye className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                  Índice PERCLOS (Fatiga ocular):
                </span>
                <span className="font-mono text-xs text-[var(--text)]">{perclos}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="1"
                value={perclos}
                onChange={(e) => setPerclos(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[var(--border)] accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-faint)]">
                <span>0-12% (Normal)</span>
                <span>25% (Umbral)</span>
                <span className="text-[var(--danger)]">&gt;40% (Micro-sueño)</span>
              </div>
            </div>

            {/* Slider 3: Velocidad en Rampa */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Gauge className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                  Velocidad de descenso:
                </span>
                <span className="font-mono text-xs text-[var(--text)]">{speed} km/h</span>
              </div>
              <input
                type="range"
                min="5"
                max="55"
                step="1"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[var(--border)] accent-[var(--accent)]"
              />
            </div>

            {/* Weather & Road Condition */}
            <div className="space-y-1">
              <label className="text-xs flex items-center gap-1.5 text-[var(--text-muted)]">
                <CloudSun className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                Condición ambiental y visibilidad:
              </label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value as any)}
                className="ms-input w-full text-xs"
              >
                <option value="CLEAR">Despejado (Visibilidad 100%)</option>
                <option value="DUST_STORM">Polvareda en rampa (Visibilidad 40%)</option>
                <option value="HEAVY_FOG">Niebla en tajo (Visibilidad 25%)</option>
                <option value="NIGHT_RAIN">Lluvia nocturna y barro</option>
              </select>
            </div>

            {/* Submit Injection (Único primario) */}
            <button
              id="btn-apply-injection"
              onClick={handleApplyCustomInjection}
              className="ms-button-primary w-full text-xs py-2 rounded-control flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Aplicar parámetros</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
