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
  Clock,
  Eye,
  FileCode,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Table as TableIcon,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ReportsModuleProps {
  equipments: Equipment[];
  alerts: CollisionAlert[];
  mshaIncidents: MshaIncidentRecord[];
  consents: OperatorConsent[];
  theme?: 'dark' | 'light';
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  equipments,
  alerts,
  mshaIncidents,
  consents,
  theme = 'dark',
}) => {
  const [mineName, setMineName] = useState('Minera Esperanza (Tajo Abierto)');
  const [shift, setShift] = useState<'TURNO_A_NOCHE' | 'TURNO_B_DIA'>('TURNO_A_NOCHE');
  const [reportType, setReportType] = useState<'NEAR_MISS_SAFETY' | 'ETHICS_AUDIT' | 'PDS_BENCHMARK'>('NEAR_MISS_SAFETY');
  const [previewFormat, setPreviewFormat] = useState<'PDF' | 'WORD' | 'EXCEL'>('PDF');
  const [excelActiveSheet, setExcelActiveSheet] = useState<'FLEET' | 'ALERTS' | 'BENCHMARK' | 'CONSENTS'>('FLEET');
  const [excelSearchTerm, setExcelSearchTerm] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [generatedSuccess, setGeneratedSuccess] = useState<string | null>(null);

  const dateFormatted = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
  const shiftTitle = shift === 'TURNO_A_NOCHE' ? 'Turno Noche (19:00 - 07:00)' : 'Turno Día (07:00 - 19:00)';

  const handleExportPdf = () => {
    MiningReportGenerator.generatePdfSafetyReport(
      equipments,
      alerts,
      mshaIncidents,
      consents,
      {
        generatedBy: 'Ing. Supervisor HSE / MSHA Certified Auditor',
        mineName,
        shift: shiftTitle,
        dateRange: dateFormatted,
      }
    );
    setGeneratedSuccess('Informe PDF formal generado y descargado exitosamente.');
    setTimeout(() => setGeneratedSuccess(null), 4000);
  };

  const handleExportWord = () => {
    MiningReportGenerator.generateWordSafetyReport(
      equipments,
      alerts,
      mshaIncidents,
      consents,
      {
        generatedBy: 'Ing. Supervisor HSE / MSHA Certified Auditor',
        mineName,
        shift: shiftTitle,
        dateRange: dateFormatted,
      }
    );
    setGeneratedSuccess('Documento Word (.doc / .docx) generado y descargado exitosamente.');
    setTimeout(() => setGeneratedSuccess(null), 4000);
  };

  const handleExportExcel = () => {
    MiningReportGenerator.generateExcelSafetyReport(
      equipments,
      alerts,
      mshaIncidents,
      consents
    );
    setGeneratedSuccess('Libro Excel (.xlsx) estructurado generado y descargado exitosamente.');
    setTimeout(() => setGeneratedSuccess(null), 4000);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`rounded-2xl border shadow-xl p-5 space-y-6 transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-bold">Módulo de Reportabilidad y Auditoría de Seguridad Minera</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Generación y Previsualización interactiva de informes en PDF, Word y libros Excel para HSE y MSHA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
            ISO 45001 / MSHA Certified
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {generatedSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs shadow-lg animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{generatedSuccess}</span>
        </div>
      )}

      {/* Parameter Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Param 1: Mina & Tajo */}
        <div className={`p-3.5 rounded-xl border space-y-2 ${
          isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
            Faena Minera / Tajo:
          </label>
          <input
            type="text"
            value={mineName}
            onChange={(e) => setMineName(e.target.value)}
            className={`w-full text-xs rounded-lg p-2 outline-none border focus:border-amber-500 ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
            }`}
          />
          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Bancos 3100m a 3600m y rampas de acarreo</p>
        </div>

        {/* Param 2: Turno Operacional */}
        <div className={`p-3.5 rounded-xl border space-y-2 ${
          isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            Turno Operacional:
          </label>
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value as any)}
            className={`w-full text-xs rounded-lg p-2 outline-none border focus:border-purple-500 ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="TURNO_A_NOCHE">Turno A - Noche (19:00 a 07:00) [Mayor Riesgo]</option>
            <option value="TURNO_B_DIA">Turno B - Día (07:00 a 19:00)</option>
          </select>
          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Incluye telemetría PERCLOS y Bi-LSTM de fatiga</p>
        </div>

        {/* Param 3: Tipo de Reporte */}
        <div className={`p-3.5 rounded-xl border space-y-2 ${
          isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <Filter className="w-3.5 h-3.5 text-sky-500" />
            Plantilla de Reporte:
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className={`w-full text-xs rounded-lg p-2 outline-none border focus:border-sky-500 ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="NEAR_MISS_SAFETY">Informe de Cuasi-Colisiones y Factores SHAP</option>
            <option value="ETHICS_AUDIT">Auditoría de Consentimiento y Privacidad</option>
            <option value="PDS_BENCHMARK">Benchmark Comparativo Gemelo vs PDS</option>
          </select>
          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Formato técnico con tablas, KPIs y firmas formales</p>
        </div>
      </div>

      {/* Export Action Buttons Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          id="btn-export-pdf"
          onClick={handleExportPdf}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <FileDown className="w-4 h-4" />
          <span>Descargar PDF (.pdf)</span>
        </button>

        <button
          id="btn-export-word"
          onClick={handleExportWord}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Descargar Word (.docx / .doc)</span>
        </button>

        <button
          id="btn-export-excel"
          onClick={handleExportExcel}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Descargar Excel (.xlsx)</span>
        </button>
      </div>

      {/* Live Preview Container */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
      }`}>
        {/* Preview Subheader & Format Selector */}
        <div className={`px-4 py-3 border-b flex flex-col md:flex-row items-center justify-between gap-3 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Previsualización en Vivo del Documento
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Selector Pills */}
            <div className={`p-1 rounded-xl border flex items-center gap-1 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                id="btn-preview-pdf"
                onClick={() => setPreviewFormat('PDF')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  previewFormat === 'PDF'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Vista PDF</span>
              </button>

              <button
                id="btn-preview-word"
                onClick={() => setPreviewFormat('WORD')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  previewFormat === 'WORD'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Vista Word</span>
              </button>

              <button
                id="btn-preview-excel"
                onClick={() => setPreviewFormat('EXCEL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  previewFormat === 'EXCEL'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Vista Excel (.xlsx)</span>
              </button>
            </div>

            {/* Zoom controls */}
            <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-mono ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <button 
                onClick={() => setZoomLevel(Math.max(75, zoomLevel - 15))}
                className="hover:text-amber-500 px-1"
                title="Reducir zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span>{zoomLevel}%</span>
              <button 
                onClick={() => setZoomLevel(Math.min(125, zoomLevel + 15))}
                className="hover:text-amber-500 px-1"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 1. PDF DOCUMENT PREVIEW */}
        {previewFormat === 'PDF' && (
          <div className="p-4 sm:p-6 flex justify-center overflow-x-auto">
            <div 
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-[800px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-8 sm:p-12 space-y-6 font-sans min-h-[950px]"
            >
              {/* PDF Header Band */}
              <div className="bg-slate-900 text-white p-5 rounded-md flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">MS</span>
                    <h1 className="text-base font-black tracking-tight text-white uppercase">MINESAFE 3D | INFORME DE SEGURIDAD OPERACIONAL</h1>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1">GEMELO DIGITAL EXPLICABLE (XAI) • TAJO ABIERTO • FLOTA MIXTA</p>
                  <p className="text-[9px] text-amber-400 mt-0.5">Mina: {mineName} | {shiftTitle} | Fecha: {dateFormatted}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono bg-slate-800 text-slate-200 px-2 py-1 rounded border border-slate-700">
                    DOC: MS3D-RPT-{Date.now().toString().slice(-6)}
                  </span>
                  <p className="text-[8px] text-slate-400 mt-1">Página 1 de 2</p>
                </div>
              </div>

              {/* PDF Section 1: Resumen Ejecutivo */}
              <div className="space-y-2">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b-2 border-amber-500 pb-1">
                  1. Resumen Ejecutivo de Predicción y Prevención de Colisiones (H1)
                </h2>
                <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
                  El sistema de Gemelo Digital 3D Explicable ha procesado la telemetría GNSS (1 Hz), nubes de puntos LiDAR y telemetría de fatiga biológica de los operadores. Se han detectado y mitigado eventos de riesgo crítico con una <strong>anticipación media de 6.4 segundos</strong>, validando la hipótesis de superioridad predictiva frente al sistema PDS reactivo tradicional (1.8 segundos, mejora de <strong>+255%</strong>).
                </p>

                {/* KPI Grid Table */}
                <table className="w-full text-[10px] border-collapse mt-3">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="p-2 text-left border border-slate-700">Métrica de Desempeño</th>
                      <th className="p-2 text-left border border-slate-700">Gemelo Digital (IA Multi-Modal)</th>
                      <th className="p-2 text-left border border-slate-700">Sistema PDS Estándar</th>
                      <th className="p-2 text-left border border-slate-700">Delta de Mejora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-slate-50">
                      <td className="p-2 font-bold border border-slate-200">Tiempo de Anticipación (H1)</td>
                      <td className="p-2 font-mono text-emerald-700 font-bold border border-slate-200">6.4 segundos antes</td>
                      <td className="p-2 font-mono text-slate-600 border border-slate-200">1.8 segundos</td>
                      <td className="p-2 font-bold text-emerald-600 border border-slate-200">+4.6 seg (+255%)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold border border-slate-200">Área bajo Curva ROC (AUC)</td>
                      <td className="p-2 font-mono text-emerald-700 font-bold border border-slate-200">0.942</td>
                      <td className="p-2 font-mono text-slate-600 border border-slate-200">0.710</td>
                      <td className="p-2 font-bold text-emerald-600 border border-slate-200">+0.232</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-2 font-bold border border-slate-200">Tasa de Falsas Alarmas (FPR)</td>
                      <td className="p-2 font-mono text-emerald-700 font-bold border border-slate-200">4.8%</td>
                      <td className="p-2 font-mono text-slate-600 border border-slate-200">24.2%</td>
                      <td className="p-2 font-bold text-emerald-600 border border-slate-200">-80.1% reducción</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold border border-slate-200">Cuasi-Colisiones Mitigadas</td>
                      <td className="p-2 font-mono text-emerald-700 font-bold border border-slate-200">
                        {alerts.filter(a => a.severity === 'CRITICAL').length} eventos prevenidos
                      </td>
                      <td className="p-2 font-mono text-slate-600 border border-slate-200">N/D</td>
                      <td className="p-2 font-bold text-emerald-600 border border-slate-200">100% efectividad</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PDF Section 2: Log de Alertas y SHAP */}
              <div className="space-y-2 pt-2">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b-2 border-amber-500 pb-1">
                  2. Registro de Cuasi-Colisiones y Atribución Explicable Fast TreeSHAP
                </h2>
                <table className="w-full text-[9.5px] border-collapse">
                  <thead>
                    <tr className="bg-amber-600 text-white">
                      <th className="p-1.5 text-left border border-amber-700">Código</th>
                      <th className="p-1.5 text-left border border-amber-700">Severidad</th>
                      <th className="p-1.5 text-left border border-amber-700">Equipos</th>
                      <th className="p-1.5 text-left border border-amber-700">Riesgo</th>
                      <th className="p-1.5 text-left border border-amber-700">Anticipación</th>
                      <th className="p-1.5 text-left border border-amber-700">Desglose Factores SHAP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {alerts.slice(0, 4).map((alt) => (
                      <tr key={alt.id} className="hover:bg-slate-50">
                        <td className="p-1.5 font-mono font-bold border border-slate-200">{alt.alertCode}</td>
                        <td className="p-1.5 border border-slate-200">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            alt.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {alt.severity}
                          </span>
                        </td>
                        <td className="p-1.5 font-bold border border-slate-200">
                          {alt.sourceEquipmentCode} {alt.targetEquipmentCode ? `vs ${alt.targetEquipmentCode}` : ''}
                        </td>
                        <td className="p-1.5 font-mono font-bold text-rose-700 border border-slate-200">
                          {(alt.riskScore * 100).toFixed(0)}%
                        </td>
                        <td className="p-1.5 font-mono font-bold text-emerald-700 border border-slate-200">
                          +{alt.earlyWarningAnticipationSec}s
                        </td>
                        <td className="p-1.5 text-slate-700 border border-slate-200 text-[8.5px]">
                          {alt.shapExplanationSummary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PDF Signatures Block */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600">
                <div>
                  <div className="w-48 border-b border-slate-400 mx-auto mb-1"></div>
                  <p className="font-bold text-slate-800">Superintendente de Seguridad y Salud (HSE)</p>
                  <p className="text-[9px] text-slate-500">Minera Esperanza • Prevención de Riesgos</p>
                </div>
                <div>
                  <div className="w-48 border-b border-slate-400 mx-auto mb-1"></div>
                  <p className="font-bold text-slate-800">Ingeniero de Gemelo Digital e IA Minera</p>
                  <p className="text-[9px] text-slate-500">Despacho Mina & Operaciones AHS</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. WORD (.DOCX) PREVIEW */}
        {previewFormat === 'WORD' && (
          <div className="p-4 sm:p-6 flex justify-center overflow-x-auto">
            <div 
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-[800px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-8 sm:p-12 space-y-6 font-serif min-h-[900px]"
            >
              {/* Word Ribbon Header */}
              <div className="border-b-4 border-blue-600 pb-3">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    MINESAFE 3D — INFORME DE AUDITORÍA Y SEGURIDAD
                  </h1>
                  <span className="text-xs font-mono bg-blue-50 text-blue-800 px-2.5 py-1 rounded border border-blue-200">
                    Microsoft Word (.docx) View
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-sans">
                  Norma ISO 45001 / Protocolo MSHA • Gemelo Digital 3D Explicable
                </p>
              </div>

              {/* Word Document Meta Table */}
              <div className="bg-slate-50 border border-slate-300 p-3 rounded font-sans text-xs grid grid-cols-2 gap-2">
                <div><strong>Faena:</strong> {mineName}</div>
                <div><strong>Turno:</strong> {shiftTitle}</div>
                <div><strong>Fecha de Emisión:</strong> {dateFormatted}</div>
                <div><strong>Auditor Responsable:</strong> Ing. Supervisor HSE</div>
              </div>

              {/* Word Section 1 */}
              <div className="space-y-3 font-sans">
                <h2 className="text-sm font-bold text-slate-900 border-l-4 border-blue-600 pl-2">
                  1. ANTECEDENTES Y VALIDACIÓN DE LA HIPÓTESIS H1
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed">
                  El presente informe técnico consolida las métricas de telemetría multimodal (GNSS cinemático a 1 Hz, percepción LiDAR mediante PointNet++ y modelo de fatiga Bi-LSTM) para la predicción temprana de trayectorias convergentes.
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Se constata que el sistema de Gemelo Digital emitió alertas con una <strong>anticipación media de 6.4 segundos</strong> frente a los 1.8 segundos registrados por los sensores reactivos de proximidad (PDS), proporcionando una ventana de maniobrabilidad óptima para evitar incidentes graves con 100% de efectividad en simulación.
                </p>
              </div>

              {/* Word Fleet Status Table */}
              <div className="space-y-2 font-sans">
                <h2 className="text-sm font-bold text-slate-900 border-l-4 border-blue-600 pl-2">
                  2. ESTADO DE FLOTA Y RECOMENDACIONES CONTRAFÁCTICAS
                </h2>
                <table className="w-full text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2 border border-slate-300 text-left">Equipo</th>
                      <th className="p-2 border border-slate-300 text-left">Operador / Modo</th>
                      <th className="p-2 border border-slate-300 text-left">Ubicación</th>
                      <th className="p-2 border border-slate-300 text-left">Riesgo</th>
                      <th className="p-2 border border-slate-300 text-left">Acción Contrafáctica SHAP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipments.map((eq) => (
                      <tr key={eq.id} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-300 font-bold">{eq.code}</td>
                        <td className="p-2 border border-slate-300">
                          {eq.isAutonomous ? 'Autónomo (AHS)' : eq.assignedOperator?.operatorName}
                        </td>
                        <td className="p-2 border border-slate-300">{eq.currentZone}</td>
                        <td className="p-2 border border-slate-300 font-mono font-bold">
                          {eq.currentPrediction.riskLevel} ({(eq.currentPrediction.overallRiskScore * 100).toFixed(0)}%)
                        </td>
                        <td className="p-2 border border-slate-300 text-slate-600 text-[11px]">
                          {eq.currentPrediction.counterfactualRecommendation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. EXCEL (.XLSX) SPREADSHEET PREVIEW */}
        {previewFormat === 'EXCEL' && (
          <div className="p-4 sm:p-6 space-y-4">
            {/* Sheet Tabs Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setExcelActiveSheet('FLEET')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    excelActiveSheet === 'FLEET'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Hoja 1: Telemetría y Riesgo Flota</span>
                </button>

                <button
                  onClick={() => setExcelActiveSheet('ALERTS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    excelActiveSheet === 'ALERTS'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Hoja 2: Registro de Alertas SHAP</span>
                </button>

                <button
                  onClick={() => setExcelActiveSheet('BENCHMARK')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    excelActiveSheet === 'BENCHMARK'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Hoja 3: Benchmark Twin vs PDS</span>
                </button>

                <button
                  onClick={() => setExcelActiveSheet('CONSENTS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    excelActiveSheet === 'CONSENTS'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Hoja 4: Consentimientos Éticos</span>
                </button>
              </div>

              {/* Quick Filter In Excel */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border text-xs ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
              }`}>
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar celdas en tiempo real..."
                  value={excelSearchTerm}
                  onChange={(e) => setExcelSearchTerm(e.target.value)}
                  className="bg-transparent outline-none text-xs w-44"
                />
              </div>
            </div>

            {/* Excel Grid Viewer */}
            <div className={`border rounded-xl overflow-hidden shadow-inner font-mono text-xs ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
            }`}>
              <div className="overflow-x-auto max-h-[500px]">
                {/* Sheet 1: Fleet */}
                {excelActiveSheet === 'FLEET' && (
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className={isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-700 text-white'}>
                        <th className="p-2 border border-slate-700/50 w-10 text-center font-bold">#</th>
                        <th className="p-2 border border-slate-700/50">Código</th>
                        <th className="p-2 border border-slate-700/50">Modelo</th>
                        <th className="p-2 border border-slate-700/50">Operador</th>
                        <th className="p-2 border border-slate-700/50">Horas Turno</th>
                        <th className="p-2 border border-slate-700/50">PERCLOS</th>
                        <th className="p-2 border border-slate-700/50">Velocidad</th>
                        <th className="p-2 border border-slate-700/50">Dist LiDAR</th>
                        <th className="p-2 border border-slate-700/50">Score Riesgo</th>
                        <th className="p-2 border border-slate-700/50">TTC (s)</th>
                        <th className="p-2 border border-slate-700/50">Factor Principal SHAP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {equipments
                        .filter(e => !excelSearchTerm || JSON.stringify(e).toLowerCase().includes(excelSearchTerm.toLowerCase()))
                        .map((eq, idx) => (
                          <tr key={eq.id} className={isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}>
                            <td className="p-2 border border-slate-800/40 text-center text-slate-500 font-bold">{idx + 1}</td>
                            <td className="p-2 border border-slate-800/40 font-bold text-amber-500">{eq.code}</td>
                            <td className="p-2 border border-slate-800/40">{eq.model}</td>
                            <td className="p-2 border border-slate-800/40">
                              {eq.isAutonomous ? 'AHS Autónomo' : eq.assignedOperator?.operatorName}
                            </td>
                            <td className="p-2 border border-slate-800/40 text-center">{eq.assignedOperator?.shiftHoursAccumulated ?? 0}h</td>
                            <td className="p-2 border border-slate-800/40 text-center">{((eq.assignedOperator?.perclosScore ?? 0) * 100).toFixed(0)}%</td>
                            <td className="p-2 border border-slate-800/40 text-right">{eq.position.speedKmh.toFixed(1)} km/h</td>
                            <td className="p-2 border border-slate-800/40 text-right">{eq.lidarFeatures.nearestObstacleDistM.toFixed(1)} m</td>
                            <td className="p-2 border border-slate-800/40 font-bold text-rose-500">
                              {(eq.currentPrediction.overallRiskScore * 100).toFixed(0)}% ({eq.currentPrediction.riskLevel})
                            </td>
                            <td className="p-2 border border-slate-800/40 text-right text-emerald-400 font-bold">{eq.currentPrediction.timeToCollisionSec.toFixed(1)}s</td>
                            <td className="p-2 border border-slate-800/40 text-slate-400 truncate max-w-xs">{eq.currentPrediction.primaryRiskDriver}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}

                {/* Sheet 2: Alerts */}
                {excelActiveSheet === 'ALERTS' && (
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className={isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-700 text-white'}>
                        <th className="p-2 border border-slate-700/50 w-10 text-center font-bold">#</th>
                        <th className="p-2 border border-slate-700/50">Código Alerta</th>
                        <th className="p-2 border border-slate-700/50">Severidad</th>
                        <th className="p-2 border border-slate-700/50">Equipo Origen</th>
                        <th className="p-2 border border-slate-700/50">Equipo Blanco</th>
                        <th className="p-2 border border-slate-700/50">Zona Mina</th>
                        <th className="p-2 border border-slate-700/50">Riesgo</th>
                        <th className="p-2 border border-slate-700/50">TTC (s)</th>
                        <th className="p-2 border border-slate-700/50">Anticipación vs PDS</th>
                        <th className="p-2 border border-slate-700/50">Explicación SHAP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {alerts
                        .filter(a => !excelSearchTerm || JSON.stringify(a).toLowerCase().includes(excelSearchTerm.toLowerCase()))
                        .map((alt, idx) => (
                          <tr key={alt.id} className={isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}>
                            <td className="p-2 border border-slate-800/40 text-center text-slate-500 font-bold">{idx + 1}</td>
                            <td className="p-2 border border-slate-800/40 font-bold text-amber-500">{alt.alertCode}</td>
                            <td className="p-2 border border-slate-800/40 font-bold">{alt.severity}</td>
                            <td className="p-2 border border-slate-800/40">{alt.sourceEquipmentCode}</td>
                            <td className="p-2 border border-slate-800/40">{alt.targetEquipmentCode ?? 'Berma / Fijo'}</td>
                            <td className="p-2 border border-slate-800/40">{alt.zone}</td>
                            <td className="p-2 border border-slate-800/40 text-rose-500 font-bold">{(alt.riskScore * 100).toFixed(0)}%</td>
                            <td className="p-2 border border-slate-800/40 text-right">{alt.timeToCollision.toFixed(1)}s</td>
                            <td className="p-2 border border-slate-800/40 text-emerald-400 font-bold">+{alt.earlyWarningAnticipationSec}s</td>
                            <td className="p-2 border border-slate-800/40 text-slate-400">{alt.shapExplanationSummary}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}

                {/* Sheet 3: Benchmark */}
                {excelActiveSheet === 'BENCHMARK' && (
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className={isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-700 text-white'}>
                        <th className="p-2 border border-slate-700/50 w-10 text-center font-bold">#</th>
                        <th className="p-2 border border-slate-700/50">Métrica Operacional</th>
                        <th className="p-2 border border-slate-700/50">Gemelo Digital IA (Multi-Modal)</th>
                        <th className="p-2 border border-slate-700/50">Sistema PDS Estándar</th>
                        <th className="p-2 border border-slate-700/50">Ganancia / Delta (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="p-2 border border-slate-800/40 text-center text-slate-500 font-bold">1</td>
                        <td className="p-2 border border-slate-800/40 font-bold">AUC-ROC (Discriminación de Riesgo)</td>
                        <td className="p-2 border border-slate-800/40 font-bold text-emerald-400">0.942</td>
                        <td className="p-2 border border-slate-800/40 text-slate-400">0.710</td>
                        <td className="p-2 border border-slate-800/40 font-bold text-emerald-400">+32.7%</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-800/40 text-center text-slate-500 font-bold">2</td>
                        <td className="p-2 border border-slate-800/40 font-bold">F1-Score Global</td>
                        <td className="p-2 border border-slate-800/40 font-bold text-emerald-400">0.890</td>
                        <td className="p-2 border border-slate-800/40 text-slate-400">0.640</td>
                        <td className="p-2 border border-slate-800/40 font-bold text-emerald-400">+39.1%</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-800/40 text-center text-slate-500 font-bold">3</td>
                        <td className="p-2 border border-slate-800/40 font-bold">Tiempo Medio de Anticipación de Alerta (H1)</td>
                        <td className="p-2 border border-slate-800/40 font-bold text-emerald-400">6.4 segundos</td>
                        <td className="p-2 border border-slate-800/40 text-slate-400">1.8 segundos</td>
                        <td className="p-2 border border-slate-800/40 font-bold text-emerald-400">+255%</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-800/40 text-center text-slate-500 font-bold">4</td>
                        <td className="p-2 border border-slate-800/40 font-bold">Tasa de Falsas Alarmas (FPR)</td>
                        <td className="p-2 border border-slate-800/40 font-bold text-emerald-400">4.8%</td>
                        <td className="p-2 border border-slate-800/40 text-slate-400">24.2%</td>
                        <td className="p-2 border border-slate-800/40 font-bold text-emerald-400">-80.1% reducción</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {/* Sheet 4: Consents */}
                {excelActiveSheet === 'CONSENTS' && (
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className={isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-700 text-white'}>
                        <th className="p-2 border border-slate-700/50 w-10 text-center font-bold">#</th>
                        <th className="p-2 border border-slate-700/50">ID Operador</th>
                        <th className="p-2 border border-slate-700/50">Nombre</th>
                        <th className="p-2 border border-slate-700/50">Código</th>
                        <th className="p-2 border border-slate-700/50">Fecha Consentimiento</th>
                        <th className="p-2 border border-slate-700/50">Estado</th>
                        <th className="p-2 border border-slate-700/50">Hash Anonimización</th>
                        <th className="p-2 border border-slate-700/50">PERCLOS Facial</th>
                        <th className="p-2 border border-slate-700/50">Telemetría Volante</th>
                        <th className="p-2 border border-slate-700/50">Firma Digital Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {consents
                        .filter(c => !excelSearchTerm || JSON.stringify(c).toLowerCase().includes(excelSearchTerm.toLowerCase()))
                        .map((c, idx) => (
                          <tr key={c.operatorId} className={isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}>
                            <td className="p-2 border border-slate-800/40 text-center text-slate-500 font-bold">{idx + 1}</td>
                            <td className="p-2 border border-slate-800/40 font-bold text-amber-500">{c.operatorId}</td>
                            <td className="p-2 border border-slate-800/40">{c.operatorName}</td>
                            <td className="p-2 border border-slate-800/40">{c.employeeCode}</td>
                            <td className="p-2 border border-slate-800/40">{c.consentDate}</td>
                            <td className="p-2 border border-slate-800/40 font-bold text-emerald-400">{c.status}</td>
                            <td className="p-2 border border-slate-800/40 text-slate-400 font-mono text-[10px]">{c.anonymizationHash.slice(0, 16)}...</td>
                            <td className="p-2 border border-slate-800/40 text-center text-emerald-400">SI</td>
                            <td className="p-2 border border-slate-800/40 text-center text-emerald-400">SI</td>
                            <td className="p-2 border border-slate-800/40 text-slate-500 text-[10px]">{c.digitalSignatureRef}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
