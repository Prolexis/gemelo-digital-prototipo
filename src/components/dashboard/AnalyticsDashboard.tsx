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
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ mshaIncidents }) => {
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
    <div className="space-y-4 text-slate-100">
      {/* Top High-Impact KPI Banners */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10">
            <ShieldCheck className="w-20 h-20 text-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Cuasi-Colisiones Evitadas
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">142</span>
            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              100% efectividad
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Últimos 30 días de operación continua</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10">
            <Clock className="w-20 h-20 text-amber-400" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            Anticipación Media (H1)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-400">6.4s</span>
            <span className="text-xs text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full">
              vs 1.8s PDS (+255%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cumple hipótesis de diseño H1 (≥5s)</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10">
            <Activity className="w-20 h-20 text-sky-400" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-sky-400" />
            AUC-ROC Multi-Modal
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-sky-400">0.942</span>
            <span className="text-xs text-sky-300 font-medium bg-sky-500/10 px-2 py-0.5 rounded-full">
              F1: 0.89
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">PDS tradicional: 0.710 AUC-ROC</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10">
            <Users className="w-20 h-20 text-purple-400" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-400" />
            Aceptación de Operadores
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-purple-400">89.6%</span>
            <span className="text-xs text-purple-300 font-medium bg-purple-500/10 px-2 py-0.5 rounded-full">
              FPR: 4.8%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Reducción del 80% en falsas alarmas</p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Early Warning Time Comparison */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Tiempo de Anticipación de Alerta: Gemelo Digital vs PDS Estándar
              </h3>
              <p className="text-xs text-slate-400">Segundos de anticipación antes de la trayectoria de colisión</p>
            </div>
            <span className="text-[11px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              Validación H1
            </span>
          </div>

          <div className="h-64 w-full min-h-[256px] min-w-0 pt-2">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={warningTimeData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="event" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} unit="s" domain={[0, 9]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs shadow-xl space-y-1">
                          <p className="font-bold text-slate-200">{label}</p>
                          <p className="text-amber-400">Gemelo Digital: {payload[0]?.value} seg</p>
                          <p className="text-slate-400">PDS Estándar: {payload[1]?.value} seg</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="twin" name="Gemelo Digital IA Multi-Modal" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pds" name="Sistema PDS Estándar (Reactivo)" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: ROC Curve Comparison */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                Curva ROC: Capacidad de Discriminación de Riesgo
              </h3>
              <p className="text-xs text-slate-400">Tasa de Verdaderos Positivos vs Falsos Positivos</p>
            </div>
            <span className="text-[11px] text-sky-400 font-mono bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
              AUC: 0.942
            </span>
          </div>

          <div className="h-64 w-full min-h-[256px] min-w-0 pt-2">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <LineChart data={rocCurveData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="fpr" tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'Tasa Falsos Positivos (FPR)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 1]} unit="" label={{ value: 'Sensibilidad (TPR)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs shadow-xl space-y-1">
                          <p className="text-slate-400 font-mono">FPR: {payload[0]?.payload.fpr}</p>
                          <p className="text-sky-400 font-bold">TPR Gemelo Digital: {payload[0]?.value}</p>
                          <p className="text-slate-400">TPR PDS Estándar: {payload[1]?.value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line type="monotone" dataKey="twinTpr" name="Gemelo Digital (AUC = 0.942)" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="pdsTpr" name="PDS Tradicional (AUC = 0.710)" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bench Risk & Shift Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk by Bench */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Índice de Riesgo por Banco de Explotación y Rampas
          </h3>
          <div className="space-y-2 pt-1">
            {benchRiskData.map((bench, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">{bench.name}</span>
                  <span className="font-mono font-bold" style={{ color: bench.color }}>
                    Score: {bench.risk}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
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
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
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
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Turno Noche (Fatiga crítica)
              </span>
              <span className="font-mono font-bold text-rose-400">68%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                Turno Día (Normal)
              </span>
              <span className="font-mono font-bold text-sky-400">32%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical MSHA Incident Benchmarking */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Base de Datos Histórica MSHA de Incidentes Mineros & Tasa de Prevenibilidad
          </h3>
          <span className="text-xs text-slate-400 font-mono">Dataset de Validación</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {mshaIncidents.map((incident) => (
            <div key={incident.id} className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-xl space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">{incident.id}</span>
                  <p className="text-xs font-bold text-slate-200 mt-0.5">{incident.mineName}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {incident.twinPreventabilityScore}% Prevenible
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {incident.narrativeDescription}
              </p>
              <div className="pt-2 border-t border-slate-700/60 text-[10px] text-slate-500">
                <span>Causas: {incident.rootCauses.join(' • ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
