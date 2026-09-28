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
    <div className="ms-card p-5 space-y-6 text-[var(--text)] max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">
              Ética, privacidad y consentimiento informado (GDPR / ISO 27701)
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Gobernanza de datos biométricos de fatiga y trazabilidad de consentimiento.
            </p>
          </div>
        </div>

        {/* Anonymization Toggle Switch */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center gap-2">
            <EyeOff className={`w-3.5 h-3.5 ${isAnonymized ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]'}`} />
            <div className="text-left">
              <p className="text-xs font-medium text-[var(--text)]">
                Anonimización activa
              </p>
              <p className="text-[10px] text-[var(--text-faint)] font-mono">
                SHA-256
              </p>
            </div>
          </div>
          <button
            id="btn-toggle-anon"
            onClick={onToggleAnonymization}
            aria-pressed={isAnonymized}
            className={`w-10 h-5 flex items-center rounded-full p-0.5 border transition-colors cursor-pointer ${
              isAnonymized ? 'bg-[var(--accent)] border-[var(--accent)] justify-end' : 'bg-[var(--border-strong)] border-[var(--border)] justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform" />
          </button>
        </div>
      </div>

      {/* Ethics Framework Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
            <FileCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Consentimiento explícito</span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            Autorización para uso de telemetría ocular (PERCLOS) con el fin único de prevención de colisiones.
          </p>
        </div>

        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
            <Lock className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Principio de no punición</span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            Los datos de fatiga nunca se utilizan para medidas disciplinarias laborales; su foco es la seguridad.
          </p>
        </div>

        <div className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
            <Fingerprint className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Trazabilidad auditable</span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            Firmas digitales inmutables asociadas a cada lote de telemetría, fiscalizables por MSHA y comités paritarios.
          </p>
        </div>
      </div>

      {/* Consent Registry Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-[var(--text-faint)]">
            Registro de consentimientos informados
          </h3>
          <span className="text-xs text-[var(--text-faint)] font-mono">
            {consents.length} operadores
          </span>
        </div>

        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] text-[11px] bg-[var(--surface-2)] text-[var(--text-faint)]">
              <tr>
                <th className="p-3 font-medium">Operador</th>
                <th className="p-3 font-medium">Código</th>
                <th className="p-3 font-medium">Fecha firma</th>
                <th className="p-3 font-medium">Cámara facial</th>
                <th className="p-3 font-medium">Telemetría volante</th>
                <th className="p-3 font-medium">Hash anonimizado</th>
                <th className="p-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
              {consents.map((consent) => (
                <tr
                  key={consent.operatorId}
                  onClick={() => setSelectedConsent(consent)}
                  className={`cursor-pointer transition-colors ${
                    selectedConsent?.operatorId === consent.operatorId ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <td className="p-3 font-medium flex items-center gap-2 text-[var(--text)]">
                    <UserCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>{isAnonymized ? consent.anonymizationHash.substring(0, 12) + '...' : consent.operatorName}</span>
                  </td>
                  <td className="p-3 font-mono text-[var(--text-muted)]">
                    {isAnonymized ? 'EMP-***' : consent.employeeCode}
                  </td>
                  <td className="p-3 font-mono text-[var(--text-muted)]">{consent.consentDate}</td>
                  <td className="p-3">
                    {consent.dataScope.facialPerclos ? (
                      <span className="text-[var(--success)] flex items-center gap-1 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Autorizado
                      </span>
                    ) : (
                      <span className="text-[var(--text-faint)] flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Denegado
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {consent.dataScope.steeringTelemetry ? (
                      <span className="text-[var(--success)] flex items-center gap-1 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Autorizado
                      </span>
                    ) : (
                      <span className="text-[var(--text-faint)] flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Denegado
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[10px] text-[var(--text-faint)]">{consent.anonymizationHash}</td>
                  <td className="p-3">
                    <span className="ms-badge-neutral text-[10px] font-mono">
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
