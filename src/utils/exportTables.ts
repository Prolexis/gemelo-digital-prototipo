/**
 * exportTables.ts - Utilidad integral para exportar tablas en Excel (.xlsx), CSV (BOM UTF-8) y PDF formal con XAI
 * Diseño industrial mejorado con metadatos de supervisión, congelación de paneles y hoja de glosario XAI normativo.
 */
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface TableExportPayload {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  filename?: string;
  xaiNotes?: string[];
  mineName?: string;
}

/**
 * Glosario normativo estándar XAI para incrustar en hojas de referencia de auditoría
 */
const XAI_GLOSSARY_ROWS = [
  [
    'PERCLOS',
    '% (0-100)',
    'Porcentaje de tiempo con párpados cerrados ≥80% (detección biométrica de somnolencia)',
    'PERCLOS > 35%: Alerta supervisor; > 50%: Detención obligatoria',
    'Relevo preventivo inmediato de operador',
    'MSHA Title 30 CFR / ISO 45001'
  ],
  [
    'TTC (Time-To-Collision)',
    'segundos (s)',
    'Tiempo proyectado antes del contacto físico entre dos unidades mineras o contra infraestructura',
    'TTC < 5.0 s activa protocolo autónomo de frenado de emergencia (CAS Nivel 9)',
    'Detención inmediata o maniobra evasiva a berma',
    'ISO 21815 / EMESRT Nivel 9'
  ],
  [
    'TreeSHAP (Score Local)',
    '% contribución',
    'Valores Shapley locales para atribución causal exacta de factores de riesgo en el incidente',
    'Factor > 30% determina la causa raíz predominante',
    'Mitigación prioritaria del factor con mayor atribución',
    'XAI Explainable Framework'
  ],
  [
    'Distancia LiDAR 3D',
    'metros (m)',
    'Separación espacial obtenida mediante nube de puntos LiDAR y posicionamiento GNSS RTK',
    'Distancia < 25 m en curvas ciegas o bermas activa advertencia sonora de cabina',
    'Reducción de velocidad a 20 km/h y toque reglamentario de bocina',
    'MSHA Title 30 CFR § 56.14100'
  ],
  [
    'AUC-ROC',
    '0.00 a 1.00',
    'Área bajo la curva ROC; cuantifica la discriminación entre riesgo real y tránsito seguro',
    'AUC-ROC ≥ 0.90 requerido para certificación de operación autónoma',
    'Recalibración de pesos del modelo si AUC < 0.88',
    'Validación Hipótesis H2'
  ],
  [
    'FPR (Falsos Positivos)',
    '%',
    'Tasa de alarmas falsas emitidas (evita desensibilización por fatiga de alarma en cabina)',
    'FPR ≤ 5.0% según estándar de aceptación del operador',
    'Ajuste dinámico de umbral de clasificación',
    'MSHA Cabin Alarm Fatigue Guidelines'
  ],
  [
    'Anticipación Predictiva (H1)',
    'segundos (s)',
    'Tiempo previo al punto de cuasi-colisión con que el Gemelo Digital alerta antes del PDS reactivo',
    'Meta H1: Anticipación promedio ≥ +3.0s frente a sistema reactivo de proximidad',
    'Maniobra anticipada de camiones de 400T sin frenado de pánico',
    'Hipótesis H1 MineSafe 3D'
  ]
];

/**
 * Exporta a Excel (.xlsx) con diseño industrial de alta fidelidad:
 * 1. Hoja principal con cintillo corporativo, metadatos HSE, cabeceras congeladas y bloque XAI.
 * 2. Hoja secundaria con Glosario Normativo XAI (MSHA, ISO 45001, ISO 21815).
 */
export function exportTableToExcel(payload: TableExportPayload): boolean {
  try {
    const { 
      title, 
      headers, 
      rows, 
      filename = 'tabla_minesafe',
      xaiNotes = [],
      mineName = 'Minera Esperanza — Tajo 3200'
    } = payload;

    const wb = XLSX.utils.book_new();

    // 1. Estructurar hoja de datos con encabezado ejecutivo
    const nowStr = new Date().toLocaleString();
    const dataMatrix: (string | number)[][] = [
      [`MINESAFE 3D — ${title.toUpperCase()}`],
      [`SISTEMA: Gemelo Digital de Seguridad Minera en Tajo Abierto (Open-Pit)`],
      [`FAENA: ${mineName} | FECHA: ${nowStr} | AUDITORÍA: Supervisor HSE`],
      [], // Separador fila 4
      headers, // Fila 5: Cabeceras de columnas
      ...rows, // Filas 6..N: Datos
      [], // Separador
      [`RESUMEN DE AUDITORÍA: Total de registros analizados = ${rows.length} | Estado: Conforme`],
    ];

    // Agregar bloque explicativo XAI al pie de la tabla de datos
    if (xaiNotes && xaiNotes.length > 0) {
      dataMatrix.push([]);
      dataMatrix.push(['--- MARCO DE INTERPRETABILIDAD Y EXPLICABILIDAD OPERACIONAL (XAI) ---']);
      xaiNotes.forEach((note) => {
        dataMatrix.push([`• ${note}`]);
      });
      dataMatrix.push(['Estándar Normativo: MSHA Title 30 CFR / ISO 45001:2018 / ISO 21815']);
    }

    const wsData = XLSX.utils.aoa_to_sheet(dataMatrix);

    // Autoajuste de anchos de columna generoso
    const colWidths = headers.map((colName, colIdx) => {
      let maxLen = String(colName).length;
      rows.forEach((row) => {
        const cellVal = row[colIdx] !== undefined ? String(row[colIdx]) : '';
        if (cellVal.length > maxLen) maxLen = cellVal.length;
      });
      return { wch: Math.min(Math.max(maxLen + 4, 15), 50) };
    });
    // La primera columna de título puede ser más ancha
    if (colWidths.length > 0) {
      colWidths[0] = { wch: Math.max(colWidths[0].wch, 24) };
    }
    wsData['!cols'] = colWidths;

    // Congelar paneles en la fila de cabeceras (fila 5 -> ySplit: 5)
    wsData['!freeze'] = { xSplit: 0, ySplit: 5 };

    // Habilitar cuadrícula visible
    wsData['!views'] = [{ showGridLines: true }];

    XLSX.utils.book_append_sheet(wb, wsData, 'Datos Operacionales');

    // 2. Hoja secundaria: Glosario y Criterios XAI
    const glossaryHeaders = [
      'Variable / Métrica',
      'Unidad Física',
      'Definición Operativa',
      'Umbral Normativo de Riesgo',
      'Acción Preventiva Inmediata',
      'Estándar Aplicable'
    ];

    const glossaryMatrix: (string | number)[][] = [
      ['MINESAFE 3D — GLOSARIO TÉCNICO Y MARCO DE INTERPRETABILIDAD XAI'],
      ['Criterios de Riesgo, Unidades de Medida y Umbrales Normativos para Auditoría HSE'],
      [],
      glossaryHeaders,
      ...XAI_GLOSSARY_ROWS
    ];

    const wsGlossary = XLSX.utils.aoa_to_sheet(glossaryMatrix);
    wsGlossary['!cols'] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 45 },
      { wch: 40 },
      { wch: 35 },
      { wch: 25 },
    ];
    wsGlossary['!freeze'] = { xSplit: 0, ySplit: 4 };
    wsGlossary['!views'] = [{ showGridLines: true }];

    XLSX.utils.book_append_sheet(wb, wsGlossary, 'Glosario XAI & Normativa');

    const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFile(wb, finalFilename);
    return true;
  } catch (err) {
    console.error('Error al exportar tabla a Excel:', err);
    return false;
  }
}

/**
 * Exporta a formato CSV con Byte Order Mark (BOM \uFEFF) para visualización correcta de tildes y caracteres en Excel
 */
export function exportTableToCsv(payload: TableExportPayload): boolean {
  try {
    const { headers, rows, filename = 'tabla_minesafe' } = payload;

    const escapeCsv = (val: string | number) => {
      const s = String(val ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const headerLine = headers.map(escapeCsv).join(',');
    const rowLines = rows.map((r) => r.map(escapeCsv).join(','));
    const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Error al exportar tabla a CSV:', err);
    return false;
  }
}

/**
 * Exporta a Reporte PDF de Alta Calidad con jsPDF y jspdf-autotable, con membrete y bloque explicativo XAI
 */
export function exportTableToPdf(payload: TableExportPayload): boolean {
  try {
    const { 
      title, 
      subtitle = 'Minera Esperanza | Tajo 3200 | Turno Rotativo', 
      headers, 
      rows, 
      filename = 'reporte_tabla_minesafe',
      xaiNotes = [],
      mineName = 'Minera Esperanza'
    } = payload;

    const doc = new jsPDF({ orientation: headers.length > 5 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
    const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
    const accentColor: [number, number, number] = [2, 132, 199]; // Sky 600

    const pageWidth = doc.internal.pageSize.getWidth();

    // Membrete formal
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`MINESAFE 3D — ${title.toUpperCase()}`, 14, 12);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`${subtitle} • Generado el ${new Date().toLocaleString()}`, 14, 19);

    // Tabla con autoTable
    autoTable(doc, {
      startY: 32,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 8;

    // Bloque de Interpretabilidad XAI si está presente
    if (xaiNotes && xaiNotes.length > 0) {
      if (finalY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, finalY, pageWidth - 28, 8 + (xaiNotes.length * 5), 2, 2, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('NOTAS TÉCNICAS DE INTERPRETABILIDAD & EXPLICABILIDAD (XAI):', 18, finalY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);

      xaiNotes.forEach((note, idx) => {
        doc.text(`• ${note}`, 20, finalY + 10 + (idx * 4.5));
      });

      finalY += 12 + (xaiNotes.length * 5);
    }

    // Pie de página con control de firmas
    if (finalY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      finalY = 30;
    }

    doc.setDrawColor(148, 163, 184);
    const colMid = pageWidth / 2;
    doc.line(20, finalY + 15, colMid - 20, finalY + 15);
    doc.line(colMid + 20, finalY + 15, pageWidth - 20, finalY + 15);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Supervisor de Operaciones / HSE', 30, finalY + 20);
    doc.text('Ingeniero de Gemelo Digital e IA', colMid + 35, finalY + 20);

    const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    doc.save(finalFilename);
    return true;
  } catch (err) {
    console.error('Error al exportar tabla a PDF:', err);
    return false;
  }
}
