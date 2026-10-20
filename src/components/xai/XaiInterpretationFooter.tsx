import React, { useState } from 'react';
import { Info, HelpCircle, ShieldAlert, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

export interface XaiGlossaryItem {
  term: string;
  definition: string;
  unit?: string;
}

export interface XaiInterpretationFooterProps {
  diagnosticText: string;
  glossary: XaiGlossaryItem[];
  regulatoryStandard?: string;
  riskThreshold?: string;
  compact?: boolean;
}

export const XaiInterpretationFooter: React.FC<XaiInterpretationFooterProps> = ({
  diagnosticText,
  glossary,
  regulatoryStandard = 'Norma MSHA Title 30 CFR / ISO 21815 CAS Nivel 9',
  riskThreshold = 'Umbral Crítico: TTC < 5.0s | PERCLOS > 40%',
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  return (
    <div className="mt-3 pt-2.5 border-t border-[var(--border)] bg-[var(--surface-2)]/60 rounded-control p-2.5 text-[11px] space-y-2">
      {/* Header con botón para colapsar/expandir */}
      <div 
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5 font-semibold text-[var(--accent-text)]">
          <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Interpretabilidad & Explicabilidad Operacional (XAI)</span>
        </div>
        <div className="flex items-center gap-1 text-[var(--text-faint)] text-[10px]">
          <span>{isExpanded ? 'Ocultar detalles' : 'Ver glosario y normas'}</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      </div>

      {/* a) Diagnóstico Ejecutivo en Lenguaje Natural */}
      <div className="flex items-start gap-2 bg-[var(--surface)] p-2 rounded-sm border border-[var(--border)]">
        <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
        <p className="text-[var(--text-muted)] leading-relaxed">
          <strong className="text-[var(--text)]">Diagnóstico Técnico: </strong>
          {diagnosticText}
        </p>
      </div>

      {isExpanded && (
        <div className="space-y-2 pt-1">
          {/* b) Glosario y Unidades Técnicas */}
          {glossary && glossary.length > 0 && (
            <div className="space-y-1">
              <span className="font-semibold text-[10px] text-[var(--text-faint)] uppercase tracking-wider block">
                Variables Clave & Unidades Físicas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {glossary.map((item, idx) => (
                  <div key={idx} className="flex items-baseline gap-1.5 text-[10.5px] text-[var(--text-muted)] bg-[var(--surface)] px-2 py-1 rounded-sm border border-[var(--border)]">
                    <strong className="text-[var(--text)] font-mono">{item.term}</strong>
                    {item.unit && <span className="text-[var(--accent-text)] font-mono text-[9.5px]">[{item.unit}]</span>}
                    <span>: {item.definition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* c) Umbral Normativo y Estándar de Seguridad */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border)] text-[10px] text-[var(--text-faint)]">
            <span className="flex items-center gap-1 text-amber-400/90 font-medium">
              <ShieldAlert className="w-3 h-3" />
              {riskThreshold}
            </span>
            <span className="font-mono text-[9.5px]">
              {regulatoryStandard}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
