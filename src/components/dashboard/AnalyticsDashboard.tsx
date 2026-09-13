import React from 'react';
import { 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  Users, 
  AlertOctagon, 
  Zap, 
  BarChart3, 
  Flame, 
  FileText,
  Activity,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { MshaIncidentRecord } from '../../types/mining';

interface AnalyticsDashboardProps {
  mshaIncidents: MshaIncidentRecord[];
  theme?: 'dark' | 'light';
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  mshaIncidents,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  // ROC Curve Data comparing Digital Twin vs Standard PDS
  const rocCurveData = [
    { fpr: 0.0, twinTpr: 0.0, pdsTpr: 0.0 },
    { fpr: 0.05, twinTpr: 0.72, pdsTpr: 0.28 },
    { fpr: 0.10, twinTpr: 0.88, pdsTpr: 0.44 },
    { fpr: 0.20, twinTpr: 0.94, pdsTpr: 0.62 },
    { fpr: 0.40, twinTpr: 0.97, pdsTpr: 0.78 },
    { fpr: 0.60, twinTpr: 0.99, pdsTpr: 0.88 },
    { fpr: 1.0, twinTpr: 1.0, pdsTpr: 1.0 },
  ];

  // Early Warning Time Comparison Distribution (seconds before near-miss)
  const warningTimeData = [
    { event: 'Cruce Curva Ciega', twin: 6.8, pds: 1.6 },
    { event: 'Aculatamiento Pala', twin: 5.4, pds: 1.9 },
    { event: 'Fatiga Turno Noche', twin: 7.2, pds: 1.2 },
    { event: 'Descarga en Botadero', twin: 6.1, pds: 2.1 },
    { event: 'Pérdida en Rampa Húmeda', twin: 5.8, pds: 1.5 },
  ];

  // Risk by Mining Bench
  const benchRiskData = [
    { name: 'Banco 3600 (Top)', risk: 18, color: '#10b981' },
    { name: 'Banco 3500', risk: 24, color: '#38bdf8' },
    { name: 'Banco 3400 (Pala)', risk: 42, color: '#f59e0b' },
    { name: 'Banco 3300 (Rampa)', risk: 68, color: '#f97316' },
    { name: 'Banco 3200 (Curva)', risk: 88, color: '#ef4444' },
    { name: 'Banco 3100 (Fondo)', risk: 35, color: '#eab308' },
  ];

  const shiftDistributionData = [
    { name: 'Turno Día (07:00-19:00)', value: 32, color: '#38bdf8' },
    { name: 'Turno Noche (19:00-07:00)', value: 68, color: '#f43f5e' },
  ];

  return (
    <div className={`space-y-4 transition-colors ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Top High-Impact KPI Banners */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border shadow-md relative overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="absolute -right-2 -bottom-2 opacity-10">
            <ShieldCheck className="w-20 h-20 text-emerald-500" />
          </div>
          <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Cuasi-Colisiones Evitadas
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-500">142</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              100% efectividad
            </span>
          </div>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Últimos 30 días de operación continua
          </p>
        </div>

        <div className={`p-4 rounded-2xl border shadow-md relative overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="absolute -right-2 -bottom-2 opacity-10">
            <Clock className="w-20 h-20 text-amber-500" />
          </div>
          <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Clock className="w-4 h-4 text-amber-500" />
            Anticipación Media (H1)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-500">6.4s</span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              vs 1.8s PDS (+255%)
            </span>
          </div>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Cumple hipótesis de diseño H1 (≥5s)
          </p>
        </div>

        <div className={`p-4 rounded-2xl border shadow-md relative overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="absolute -right-2 -bottom-2 opacity-10">
            <Activity className="w-20 h-20 text-sky-500" />
          </div>
          <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Activity className="w-4 h-4 text-sky-500" />
            AUC-ROC Multi-Modal
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-sky-500">0.942</span>
            <span className="text-xs font-medium text-sky-700 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
              F1: 0.89
            </span>
          </div>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            PDS tradicional: 0.710 AUC-ROC
          </p>
        </div>

        <div className={`p-4 rounded-2xl border shadow-md relative overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="absolute -right-2 -bottom-2 opacity-10">
            <Users className="w-20 h-20 text-purple-500" />
          </div>
          <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Users className="w-4 h-4 text-purple-500" />
            Aceptación de Operadores
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-purple-500">89.6%</span>
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              FPR: 4.8%
            </span>
          </div>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            -80.1% reducción falsas alarmas
          </p>
        </div>
      </div>

      {/* Main Comparative Benchmark Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* H1 Benchmark: Warning Time Comparison */}
        <div className={`p-5 rounded-2xl border shadow-xl space-y-4 transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                <Clock className="w-4 h-4 text-amber-500" />
                Validación Experimental H1: Tiempo de Aviso Previo a Colisión
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Comparativa de segundos de anticipación entre Gemelo Digital (IA Multi-Modal) y PDS Estándar
              </p>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              Delta: +255%
            </span>
          </div>

          <div className="h-64 w-full min-h-[256px] min-w-0 pt-2">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={warningTimeData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="event" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 9.5 }} angle={-15} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} unit="s" domain={[0, 8]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={`p-2.5 rounded-lg text-xs shadow-xl space-y-1 border ${
                          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-md'
                        }`}>
                          <p className="font-bold">{label}</p>
                          <p className="text-amber-500 font-mono">Gemelo Digital: {payload[0]?.value}s</p>
                          <p className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>PDS Estándar: {payload[1]?.value}s</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="twin" name="Gemelo Digital (IA)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pds" name="PDS Estándar (Radar/Cámara)" fill={isDark ? '#475569' : '#94a3b8'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROC Curve: Discriminative Power */}
        <div className={`p-5 rounded-2xl border shadow-xl space-y-4 transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                <Activity className="w-4 h-4 text-sky-500" />
                Curva Característica Operativa del Receptor (ROC)
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Tasa de Verdaderos Positivos (Sensibilidad) vs Falsos Positivos (FPR)
              </p>
            </div>
            <span className="text-[11px] text-sky-600 dark:text-sky-400 font-mono bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
              AUC: 0.942
            </span>
          </div>

          <div className="h-64 w-full min-h-[256px] min-w-0 pt-2">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <LineChart data={rocCurveData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="fpr" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} label={{ value: 'Tasa Falsos Positivos (FPR)', position: 'insideBottom', offset: -10, fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} domain={[0, 1]} unit="" label={{ value: 'Sensibilidad (TPR)', angle: -90, position: 'insideLeft', fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={`p-2.5 rounded-lg text-xs shadow-xl space-y-1 border ${
                          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-md'
                        }`}>
                          <p className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>FPR: {payload[0]?.payload.fpr}</p>
                          <p className="text-sky-500 font-bold">TPR Gemelo Digital: {payload[0]?.value}</p>
                          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>TPR PDS Estándar: {payload[1]?.value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line type="monotone" dataKey="twinTpr" name="Gemelo Digital (AUC = 0.942)" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="pdsTpr" name="PDS Tradicional (AUC = 0.710)" stroke={isDark ? '#94a3b8' : '#64748b'} strokeDasharray="4 4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bench Risk & Shift Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk by Bench */}
        <div className={`md:col-span-2 p-4 rounded-2xl border shadow-xl space-y-3 transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <Layers className="w-4 h-4 text-amber-500" />
            Índice de Riesgo por Banco de Explotación y Rampas
          </h3>
          <div className="space-y-2 pt-1">
            {benchRiskData.map((bench, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{bench.name}</span>
                  <span className="font-mono font-bold" style={{ color: bench.color }}>
                    Score: {bench.risk}%
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${
                  isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${bench.risk}%`, backgroundColor: bench.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shift Distribution */}
        <div className={`p-4 rounded-2xl border shadow-xl space-y-3 flex flex-col justify-between transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <Users className="w-4 h-4 text-purple-500" />
            Riesgo por Turno Operacional
          </h3>
          <div className="h-40 w-full min-h-[160px] min-w-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <PieChart>
                <Pie data={shiftDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={35} paddingAngle={4}>
                  {shiftDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Turno Noche (Fatiga crítica)
              </span>
              <span className="font-mono font-bold text-rose-500">68%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                Turno Día (Normal)
              </span>
              <span className="font-mono font-bold text-sky-500">32%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical MSHA Incident Benchmarking */}
      <div className={`p-4 rounded-2xl border shadow-xl space-y-3 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <FileText className="w-4 h-4 text-emerald-500" />
            Base de Datos Histórica MSHA de Incidentes Mineros & Tasa de Prevenibilidad
          </h3>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dataset de Validación</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {mshaIncidents.map((incident) => (
            <div key={incident.id} className={`p-3.5 rounded-xl border space-y-2 transition-colors ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-amber-500 font-mono font-bold">{incident.id}</span>
                  <p className={`text-xs font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{incident.mineName}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {incident.twinPreventabilityScore}% Prevenible
                </span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {incident.narrativeDescription}
              </p>
              <div className={`pt-2 border-t text-[10px] ${
                isDark ? 'border-slate-700/60 text-slate-500' : 'border-slate-200 text-slate-400'
              }`}>
                <span>Causas: {incident.rootCauses.join(' • ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
