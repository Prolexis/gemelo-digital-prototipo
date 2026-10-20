import React, { useState } from 'react';
import { Download, FileImage, Image as ImageIcon, Check } from 'lucide-react';
import { exportSvgFromContainer, exportHighResPngFromContainer } from '../../utils/exportVisuals';

interface ExportActionToolbarProps {
  containerId: string;
  title: string;
  filenamePrefix?: string;
  theme?: 'dark' | 'light';
}

export const ExportActionToolbar: React.FC<ExportActionToolbarProps> = ({
  containerId,
  title,
  filenamePrefix = 'figura_analitica',
  theme = 'dark',
}) => {
  const [isExporting, setIsExporting] = useState<'svg' | 'png' | null>(null);

  const handleExportSvg = () => {
    setIsExporting('svg');
    const success = exportSvgFromContainer(containerId, `${filenamePrefix}.svg`);
    setTimeout(() => setIsExporting(null), 1200);
  };

  const handleExportPng = async () => {
    setIsExporting('png');
    const bg = theme === 'dark' ? '#0f172a' : '#ffffff';
    await exportHighResPngFromContainer(containerId, {
      scale: 3, // 300 DPI equivalente
      backgroundColor: bg,
      title: title,
      subtitle: `MINESAFE 3D • GEMELO DIGITAL XAI • FAENA: MINERA ESPERANZA • ${new Date().toLocaleDateString()}`,
      filename: `${filenamePrefix}_300dpi.png`,
    });
    setTimeout(() => setIsExporting(null), 1200);
  };

  return (
    <div className="flex items-center gap-1.5 bg-[var(--surface-2)] p-1 rounded-control border border-[var(--border)] text-[10px]">
      <span className="text-[var(--text-faint)] font-medium px-1 select-none hidden sm:inline">
        Grabar:
      </span>

      {/* Botón SVG */}
      <button
        onClick={handleExportSvg}
        disabled={isExporting !== null}
        className="flex items-center gap-1 px-2 py-1 rounded-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors cursor-pointer disabled:opacity-50"
        title="Descargar en formato SVG Vectorial (Escalable sin pérdida)"
      >
        {isExporting === 'svg' ? (
          <Check className="w-3 h-3 text-[var(--success)]" />
        ) : (
          <FileImage className="w-3 h-3 text-[var(--accent)]" />
        )}
        <span>SVG</span>
      </button>

      <span className="text-[var(--border)]">|</span>

      {/* Botón PNG 300 DPI */}
      <button
        onClick={handleExportPng}
        disabled={isExporting !== null}
        className="flex items-center gap-1 px-2 py-1 rounded-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors cursor-pointer disabled:opacity-50"
        title="Descargar en formato PNG de Alta Resolución (300 DPI con membrete)"
      >
        {isExporting === 'png' ? (
          <Check className="w-3 h-3 text-[var(--success)]" />
        ) : (
          <ImageIcon className="w-3 h-3 text-[var(--accent)]" />
        )}
        <span>PNG HD (300 DPI)</span>
      </button>
    </div>
  );
};
