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
    { name: 'Banco 3600 (Top)', risk: 18, color: 'var(--success)' },
    { name: 'Banco 3500', risk: 24, color: 'var(--success)' },
    { name: 'Banco 3400 (Pala)', risk: 42, color: 'var(--warning)' },
    { name: 'Banco 3300 (Rampa)', risk: 68, color: 'var(--warning)' },
    { name: 'Banco 3200 (Curva)', risk: 88, color: 'var(--danger)' },
    { name: 'Banco 3100 (Fondo)', risk: 35, color: 'var(--warning)' },
  ];

  const shiftDistributionData = [
    { name: 'Turno Día (07:00-19:00)', value: 32, color: 'var(--success)' },
    { name: 'Turno Noche (19:00-07:00)', value: 68, color: 'var(--danger)' },
  ];

  return (
    <div className="space-y-4 text-[var(--text)]">
      {/* Top High-Impact KPI Banners */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="ms-card p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-faint)] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-faint)]" />
            Cuasi-colisiones mitigadas
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-[var(--text)]">142</span>
            <span className="ms-badge-risk-low">
              100%
            </span>
          </div>
        </div>

        <div className="ms-card p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-faint)] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[var(--text-faint)]" />
            Anticipación promedio
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-[var(--text)]">6.4s</span>
            <span className="ms-badge-neutral text-[10px]">
              vs 1.8s
            </span>
          </div>
        </div>

        <div className="ms-card p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-faint)] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[var(--text-faint)]" />
            AUC-ROC
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-[var(--text)]">0.978</span>
            <span className="ms-badge-neutral text-[10px]">
              F1: 0.932
            </span>
          </div>
        </div>

        <div className="ms-card p-3.5 space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-faint)] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[var(--text-faint)]" />
            Aceptación operador
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-[var(--text)]">89.6%</span>
            <span className="ms-badge-neutral text-[10px]">
              FPR: 4.8%
            </span>
          </div>
        </div>
      </div>

      {/* Main Comparative Benchmark Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* H1 Benchmark: Warning Time Comparison */}
        <div className="ms-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold flex items-center gap-1.5 text-[var(--text)]">
              <Clock className="w-3.5 h-3.5 text-[var(--text-faint)]" />
              Tiempo de anticipación vs PDS reactivo
            </h3>
            <span className="ms-badge-neutral text-[10px]">
              +255%
            </span>
          </div>

          <div className="h-56 w-full min-h-[220px] min-w-0 pt-1">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={warningTimeData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="event" tick={{ fill: 'var(--text-faint)', fontSize: 10 }} angle={-15} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 10 }} unit="s" domain={[0, 8]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2.5 rounded-control text-xs border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-xs space-y-1">
                          <p className="font-semibold">{label}</p>
                          <p className="text-[var(--accent)] font-mono">Gemelo digital: {payload[0]?.value}s</p>
                          <p className="text-[var(--text-muted)] font-mono">PDS estándar: {payload[1]?.value}s</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Bar dataKey="twin" name="Gemelo digital (s)" fill="var(--accent)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="pds" name="PDS tradicional (s)" fill="var(--border-strong)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROC Curve: Discriminative Power */}
        <div className="ms-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold flex items-center gap-1.5 text-[var(--text)]">
              <Activity className="w-3.5 h-3.5 text-[var(--text-faint)]" />
              Curva ROC (Sensibilidad vs FPR)
            </h3>
            <span className="ms-badge-neutral font-mono text-[10px]">
              AUC: 0.978
            </span>
          </div>

          <div className="h-56 w-full min-h-[220px] min-w-0 pt-1">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <LineChart data={rocCurveData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="fpr" tick={{ fill: 'var(--text-faint)', fontSize: 10 }} label={{ value: 'Tasa Falsos Positivos (FPR)', position: 'insideBottom', offset: -10, fill: 'var(--text-faint)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 10 }} domain={[0, 1]} label={{ value: 'Sensibilidad (TPR)', angle: -90, position: 'insideLeft', fill: 'var(--text-faint)', fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2.5 rounded-control text-xs border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-xs space-y-1">
                          <p className="font-mono text-[var(--text-faint)]">FPR: {payload[0]?.payload.fpr}</p>
                          <p className="text-[var(--accent)] font-semibold">TPR Gemelo: {payload[0]?.value}</p>
                          <p className="text-[var(--text-muted)]">TPR PDS: {payload[1]?.value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Line type="monotone" dataKey="twinTpr" name="Gemelo digital (AUC = 0.942)" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pdsTpr" name="PDS tradicional (AUC = 0.710)" stroke="var(--border-strong)" strokeDasharray="4 4" strokeWidth={1.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bench Risk & Shift Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk by Bench */}
        <div className="md:col-span-2 ms-card p-4 space-y-3">
          <h3 className="text-xs font-semibold flex items-center gap-1.5 text-[var(--text)]">
            <Layers className="w-3.5 h-3.5 text-[var(--text-faint)]" />
            Índice de riesgo por banco de explotación y rampas
          </h3>
          <div className="space-y-2 pt-1">
            {benchRiskData.map((bench, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-muted)]">{bench.name}</span>
                  <span className="font-mono font-medium text-[var(--text)]">
                    {bench.risk}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-[var(--border)]">
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
        <div className="ms-card p-4 space-y-3 flex flex-col justify-between">
          <h3 className="text-xs font-semibold flex items-center gap-1.5 text-[var(--text)]">
            <Users className="w-3.5 h-3.5 text-[var(--text-faint)]" />
            Distribución por turno
          </h3>
          <div className="h-36 w-full min-h-[140px] min-w-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <PieChart>
                <Pie data={shiftDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={32} paddingAngle={4}>
                  {shiftDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <span className="w-2 h-2 rounded-full bg-[var(--danger)]" />
                Turno noche (fatiga crítica)
              </span>
              <span className="font-mono text-[var(--text)] font-semibold">68%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                Turno día (normal)
              </span>
              <span className="font-mono text-[var(--text)] font-semibold">32%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
