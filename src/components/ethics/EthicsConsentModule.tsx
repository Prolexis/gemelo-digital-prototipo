import React, { useState } from 'react';
import { OperatorConsent } from '../../types/mining';
import { 
  Shield, 
  Lock, 
  EyeOff, 
  FileCheck, 
  Key, 
  CheckCircle, 
  XCircle, 
  Info,
  UserCheck,
  Fingerprint
} from 'lucide-react';

interface EthicsConsentModuleProps {
  consents: OperatorConsent[];
  isAnonymized: boolean;
  onToggleAnonymization: () => void;
  theme?: 'dark' | 'light';
}

export const EthicsConsentModule: React.FC<EthicsConsentModuleProps> = ({
  consents,
  isAnonymized,
  onToggleAnonymization,
  theme = 'dark',
}) => {
  const [selectedConsent, setSelectedConsent] = useState<OperatorConsent | null>(consents[0] || null);
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-2xl border shadow-xl p-5 space-y-5 transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b transition-colors ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Módulo de Ética, Privacidad y Consentimiento Informado
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Gobernanza de datos biométricos de fatiga y trazabilidad de consentimiento de operadores
            </p>
          </div>
        </div>

        {/* Anonymization Toggle Switch */}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-colors ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <EyeOff className={`w-4 h-4 ${isAnonymized ? 'text-emerald-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <div className="text-left">
              <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Anonimización en Tiempo Real
              </p>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ofusca nombres y RUT con SHA-256
              </p>
            </div>
          </div>
          <button
            id="btn-toggle-anon"
            onClick={onToggleAnonymization}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              isAnonymized ? 'bg-emerald-500 justify-end' : isDark ? 'bg-slate-800 justify-start' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md transition-transform" />
          </button>
        </div>
      </div>

      {/* Ethics Framework Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`p-3.5 rounded-xl border space-y-1.5 transition-colors ${
          isDark ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-300">
            <FileCheck className="w-4 h-4" />
            <span>Consentimiento Específico</span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Cada operador autoriza explícitamente el uso de telemetría ocular (PERCLOS) exclusivamente para prevención de colisiones en tiempo real.
          </p>
        </div>

        <div className={`p-3.5 rounded-xl border space-y-1.5 transition-colors ${
          isDark ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-300">
            <Lock className="w-4 h-4" />
            <span>Cifrado y No-Punición</span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Los datos de fatiga no se utilizan con fines punitivos laborales; su objetivo es la protección de vidas humanas y alertas tempranas en cabina.
          </p>
        </div>

        <div className={`p-3.5 rounded-xl border space-y-1.5 transition-colors ${
          isDark ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-300">
            <Fingerprint className="w-4 h-4" />
            <span>Trazabilidad Criptográfica</span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Firmas digitales inmutables vinculadas a cada lote de telemetría de fatiga, auditables por representantes sindicales y MSHA.
          </p>
        </div>
      </div>

      {/* Consent Registry Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Registro Activo de Consentimientos Informados (Flota Manual)
          </h3>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Total Registrados: {consents.length}
          </span>
        </div>

        <div className={`overflow-x-auto rounded-xl border transition-colors ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-mono text-[11px] transition-colors ${
              isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <tr>
                <th className="p-3">Operador / ID</th>
                <th className="p-3">Código Empleado</th>
                <th className="p-3">Fecha Firma</th>
                <th className="p-3">Cámara Facial (PERCLOS)</th>
                <th className="p-3">Volante / Maniobras</th>
                <th className="p-3">Hash Anonimizado</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors ${
              isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'
            }`}>
              {consents.map((consent) => (
                <tr
                  key={consent.operatorId}
                  onClick={() => setSelectedConsent(consent)}
                  className={`cursor-pointer transition-colors ${
                    isDark
                      ? selectedConsent?.operatorId === consent.operatorId ? 'bg-slate-800/80' : 'hover:bg-slate-900/60'
                      : selectedConsent?.operatorId === consent.operatorId ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className={`p-3 font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                    <span>{isAnonymized ? consent.anonymizationHash.substring(0, 12) + '...' : consent.operatorName}</span>
                  </td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isAnonymized ? 'EMP-ANON-***' : consent.employeeCode}
                  </td>
                  <td className={`p-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{consent.consentDate}</td>
                  <td className="p-3">
                    {consent.dataScope.facialPerclos ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Autorizado
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Denegado
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {consent.dataScope.steeringTelemetry ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Autorizado
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Denegado
                      </span>
                    )}
                  </td>
                  <td className={`p-3 font-mono text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{consent.anonymizationHash}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {consent.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
