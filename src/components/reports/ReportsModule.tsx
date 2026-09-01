import React, { useState } from 'react';
import { Equipment, CollisionAlert, MshaIncidentRecord, OperatorConsent } from '../../types/mining';
import { MiningReportGenerator } from '../../services/reportGenerator';
import { 
  FileDown, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  CheckCircle, 
  Printer, 
  ShieldCheck, 
  Download,
  Filter,
  Building2,
  Clock
} from 'lucide-react';

interface ReportsModuleProps {
  equipments: Equipment[];
  alerts: CollisionAlert[];
  mshaIncidents: MshaIncidentRecord[];
  consents: OperatorConsent[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  equipments,
  alerts,
  mshaIncidents,
  consents,
}) => {
  const [mineName, setMineName] = useState('Minera Esperanza (Tajo Abierto)');
  const [shift, setShift] = useState<'TURNO_A_NOCHE' | 'TURNO_B_DIA'>('TURNO_A_NOCHE');
  const [reportType, setReportType] = useState<'NEAR_MISS_SAFETY' | 'ETHICS_AUDIT' | 'PDS_BENCHMARK'>('NEAR_MISS_SAFETY');
  const [generatedSuccess, setGeneratedSuccess] = useState<string | null>(null);

  const handleExportPdf = () => {
    MiningReportGenerator.generatePdfSafetyReport(
      equipments,
      alerts,
      mshaIncidents,
      consents,
      {
        generatedBy: 'Ing. Supervisor HSE / MSHA Certified Auditor',
        mineName,
        shift: shift === 'TURNO_A_NOCHE' ? 'Turno Noche (19:00 - 07:00)' : 'Turno Día (07:00 - 19:00)',
        dateRange: new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }),
      }
    );
    setGeneratedSuccess('Informe PDF formal generado y descargado exitosamente.');
    setTimeout(() => setGeneratedSuccess(null), 4000);
  };

  const handleExportExcel = () => {
    MiningReportGenerator.generateExcelSafetyReport(
      equipments,
      alerts,
      mshaIncidents,
      consents
    );
    setGeneratedSuccess('Libro Excel (.xlsx) con telemetría y SHAP generado y descargado.');
    setTimeout(() => setGeneratedSuccess(null), 4000);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-5 space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Módulo de Reportabilidad y Auditoría de Seguridad Minera</h2>
            <p className="text-xs text-slate-400">Generación de informes ejecutivos en PDF y Excel para HSE, MSHA y Gerencia de Operaciones</p>
          </div>
        </div>

        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
          ISO 45001 / MSHA Ready
        </span>
      </div>

      {/* Success Banner */}
      {generatedSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs shadow-lg animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{generatedSuccess}</span>
        </div>
      )}

      {/* Parameter Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Param 1: Mina & Tajo */}
        <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-xl space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            Faena Minera / Tajo:
          </label>
          <input
            type="text"
            value={mineName}
            onChange={(e) => setMineName(e.target.value)}
            className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none focus:border-amber-500"
          />
          <p className="text-[10px] text-slate-500">Incluye bancos 3100 a 3600 y rampas de acarreo este/oeste</p>
        </div>

        {/* Param 2: Turno Operacional */}
        <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-xl space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Turno Operacional:
          </label>
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value as any)}
            className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none focus:border-purple-500"
          >
            <option value="TURNO_A_NOCHE">Turno A - Noche (19:00 a 07:00) [Mayor Riesgo]</option>
            <option value="TURNO_B_DIA">Turno B - Día (07:00 a 19:00)</option>
          </select>
          <p className="text-[10px] text-slate-500">Analiza picos de fatiga y telemetría PERCLOS</p>
        </div>

        {/* Param 3: Tipo de Reporte */}
        <div className="bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-xl space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            Plantilla de Reporte:
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none focus:border-sky-500"
          >
            <option value="NEAR_MISS_SAFETY">Informe de Cuasi-Colisiones y Factores SHAP</option>
            <option value="ETHICS_AUDIT">Auditoría de Consentimiento y Privacidad</option>
            <option value="PDS_BENCHMARK">Benchmark Comparativo Gemelo vs PDS</option>
          </select>
          <p className="text-[10px] text-slate-500">Formato formal con tablas y bloques de firma</p>
        </div>
      </div>

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* PDF Export Button Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-4 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center flex-shrink-0">
              <FileDown className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Exportar Informe Técnico Formal (PDF)</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Genera un documento PDF de alta calidad con membrete de seguridad, tablas de KPIs, registro de cuasi-colisiones con desglose SHAP, y firmas de autorización.
              </p>
            </div>
          </div>

          <button
            id="btn-export-pdf"
            onClick={handleExportPdf}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Informe Técnico PDF (.pdf)</span>
          </button>
        </div>

        {/* Excel Export Button Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-4 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Exportar Dataset Consolidado (Excel .xlsx)</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Genera un archivo Excel estructurado con 4 hojas: Telemetría GNSS/LiDAR de Flota, Log de Alertas con pesos SHAP, Benchmark Twin vs PDS, y Consentimientos Éticos.
              </p>
            </div>
          </div>

          <button
            id="btn-export-excel"
            onClick={handleExportExcel}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Libro de Cálculo Excel (.xlsx)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
