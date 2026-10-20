import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Check, ChevronDown } from 'lucide-react';
import { exportTableToExcel, exportTableToCsv, exportTableToPdf, TableExportPayload } from '../../utils/exportTables';

interface TableExportMenuProps {
  payload: TableExportPayload;
  buttonLabel?: string;
}

export const TableExportMenu: React.FC<TableExportMenuProps> = ({
  payload,
  buttonLabel = 'Exportar Tabla',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeExport, setActiveExport] = useState<string | null>(null);

  const handleExport = (type: 'excel' | 'csv' | 'pdf') => {
    setActiveExport(type);
    if (type === 'excel') exportTableToExcel(payload);
    if (type === 'csv') exportTableToCsv(payload);
    if (type === 'pdf') exportTableToPdf(payload);

    setTimeout(() => {
      setActiveExport(null);
      setIsOpen(false);
    }, 1000);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-control text-xs font-medium border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all cursor-pointer shadow-2xs"
      >
        <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>{buttonLabel}</span>
        <ChevronDown className="w-3 h-3 text-[var(--text-faint)]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 rounded-control border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-lg z-50 py-1 text-xs divide-y divide-[var(--border)]">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wider">
            Formatos de Grabado
          </div>

          <div className="py-1">
            <button
              onClick={() => handleExport('excel')}
              className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel (.xlsx)</span>
              </div>
              {activeExport === 'excel' && <Check className="w-3 h-3 text-[var(--success)]" />}
            </button>

            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
                <span>CSV (BOM UTF-8)</span>
              </div>
              {activeExport === 'csv' && <Check className="w-3 h-3 text-[var(--success)]" />}
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => handleExport('pdf')}
              className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>Reporte PDF Formal</span>
              </div>
              {activeExport === 'pdf' && <Check className="w-3 h-3 text-[var(--success)]" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
