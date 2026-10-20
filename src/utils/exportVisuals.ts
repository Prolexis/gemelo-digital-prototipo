/**
 * exportVisuals.ts - Utilidades de exportación de figuras de alta fidelidad para MineSafe 3D
 * Soporta SVG Vectorial sin pérdida y rasterizado PNG a 300 DPI con canvas 3x y membrete industrial.
 */

export interface VisualExportOptions {
  scale?: number;
  backgroundColor?: string;
  title?: string;
  subtitle?: string;
  author?: string;
  filename?: string;
}

/**
 * Encuentra el elemento SVG principal dentro de un contenedor.
 * Si existen múltiples elementos SVG (como íconos de leyenda de 14x14 o defs),
 * selecciona el que posea la mayor superficie visual (ancho x alto).
 */
function findPrimarySvg(container: HTMLElement): SVGSVGElement | null {
  const svgs = Array.from(container.querySelectorAll('svg'));
  if (svgs.length === 0) return null;
  if (svgs.length === 1) return svgs[0] as SVGSVGElement;

  let primary: SVGSVGElement | null = null;
  let maxArea = -1;

  for (const svg of svgs) {
    const rect = svg.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area > maxArea) {
      maxArea = area;
      primary = svg as SVGSVGElement;
    }
  }

  return primary;
}

/**
 * Clona un elemento SVG e incrusta de forma recursiva todos los estilos computados
 * de la página activa (reemplaza variables CSS como var(--accent), var(--border),
 * fuentes y rellenos) para que el SVG sea 100% autosuficiente y legible tanto en
 * visualizadores externos de SVG como en Canvas rasterizado.
 */
function cloneSvgWithInlineStyles(sourceSvg: SVGSVGElement, width: number, height: number): SVGSVGElement {
  const clone = sourceSvg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  // Eliminar propiedades de style que puedan colapsar el tamaño (ej. width: 100%)
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.maxWidth = 'none';

  const sourceElements = [sourceSvg, ...Array.from(sourceSvg.querySelectorAll('*'))];
  const targetElements = [clone, ...Array.from(clone.querySelectorAll('*'))];

  const relevantStyles = [
    'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray',
    'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'opacity',
    'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor',
    'dominant-baseline', 'letter-spacing', 'color'
  ];

  for (let i = 0; i < sourceElements.length && i < targetElements.length; i++) {
    const src = sourceElements[i];
    const tgt = targetElements[i] as SVGElement;
    if (!src || !tgt) continue;

    const computed = window.getComputedStyle(src);

    for (const prop of relevantStyles) {
      const val = computed.getPropertyValue(prop);
      if (val && val !== 'none' && val !== 'auto' && val !== 'normal') {
        tgt.style.setProperty(prop, val);
      }
    }

    // Si tiene atributos fill o stroke con var(...), reemplazarlos con el valor computado
    const fillAttr = tgt.getAttribute('fill');
    if (fillAttr && fillAttr.startsWith('var(')) {
      tgt.setAttribute('fill', computed.fill || computed.color || '#38bdf8');
    }
    const strokeAttr = tgt.getAttribute('stroke');
    if (strokeAttr && strokeAttr.startsWith('var(')) {
      tgt.setAttribute('stroke', computed.stroke || computed.color || '#334155');
    }
  }

  return clone;
}

/**
 * Serializa un elemento SVG dentro de un contenedor y lo descarga como archivo .svg vectorial.
 */
export function exportSvgFromContainer(containerId: string, filename = 'grafico_minesafe.svg'): boolean {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Contenedor #${containerId} no encontrado.`);
    return false;
  }

  const svgElement = findPrimarySvg(container);
  if (!svgElement) {
    console.error(`No se encontró ningún elemento SVG dentro de #${containerId}.`);
    return false;
  }

  try {
    const rect = svgElement.getBoundingClientRect();
    const width = Math.max(Math.round(rect.width), 500);
    const height = Math.max(Math.round(rect.height), 260);

    const clone = cloneSvgWithInlineStyles(svgElement, width, height);

    // Asignar fondo si es transparente
    const computedBg = window.getComputedStyle(container).backgroundColor || '#0b1120';
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', computedBg === 'rgba(0, 0, 0, 0)' ? '#0b1120' : computedBg);
    clone.insertBefore(bgRect, clone.firstChild);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Error al exportar SVG:', err);
    return false;
  }
}

/**
 * Renderiza el gráfico SVG en un Canvas de alta resolución (Escala 3x equivalente a 300 DPI editorial)
 * e incorpora membrete técnico industrial con fecha, turno, faena y leyenda clara.
 */
export async function exportHighResPngFromContainer(
  containerId: string,
  options: VisualExportOptions = {}
): Promise<boolean> {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Contenedor #${containerId} no encontrado.`);
    return false;
  }

  const svgElement = findPrimarySvg(container);
  if (!svgElement) {
    console.error(`No se encontró ningún elemento SVG en #${containerId}.`);
    return false;
  }

  const scale = options.scale || 3; // 3x para calidad editorial 300 DPI
  const rect = svgElement.getBoundingClientRect();
  const width = Math.max(Math.round(rect.width), 500);
  const height = Math.max(Math.round(rect.height), 240);

  // Extraer items de leyenda si existen en el contenedor
  const legendItems: { color: string; label: string }[] = [];
  const legendWrapper = container.querySelector('.recharts-legend-wrapper, .recharts-default-legend');
  if (legendWrapper) {
    const items = legendWrapper.querySelectorAll('.recharts-legend-item');
    items.forEach((item) => {
      const text = item.textContent?.trim() || '';
      const icon = item.querySelector('svg path, svg line, svg rect, .recharts-surface');
      let color = '#38bdf8';
      if (icon) {
        const comp = window.getComputedStyle(icon);
        color = comp.fill !== 'none' && comp.fill ? comp.fill : comp.stroke || '#38bdf8';
      }
      if (text) legendItems.push({ color, label: text });
    });
  }

  const headerHeight = options.title ? 65 : 0;
  const legendHeight = legendItems.length > 0 ? 35 : 10;
  const totalContentHeight = height + headerHeight + legendHeight;

  const canvasWidth = width * scale;
  const canvasHeight = totalContentHeight * scale;

  try {
    const clone = cloneSvgWithInlineStyles(svgElement, width, height);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Fallo al cargar SVG en objeto Image'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo inicializar el contexto 2D de Canvas.');

    // Fondo industrial
    ctx.fillStyle = options.backgroundColor || '#0b1120';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Membrete técnico si tiene título
    if (options.title) {
      // Línea de acento superior
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, canvasWidth, 3 * scale);

      ctx.fillStyle = '#f8fafc';
      ctx.font = `bold ${13 * scale}px "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(options.title.toUpperCase(), 16 * scale, 26 * scale);

      ctx.fillStyle = '#94a3b8';
      ctx.font = `${8.5 * scale}px "Segoe UI", Roboto, sans-serif`;
      const meta = options.subtitle || `MINESAFE 3D • GEMELO DIGITAL XAI • FAENA: MINERA ESPERANZA • ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      ctx.fillText(meta, 16 * scale, 44 * scale);

      // Línea divisoria
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(16 * scale, 55 * scale);
      ctx.lineTo(canvasWidth - 16 * scale, 55 * scale);
      ctx.stroke();
    }

    // Dibujar gráfico SVG rasterizado
    ctx.drawImage(img, 0, headerHeight * scale, width * scale, height * scale);

    // Dibujar Leyenda al pie si existe
    if (legendItems.length > 0) {
      const legendY = (headerHeight + height + 10) * scale;
      let currentX = 20 * scale;

      ctx.font = `${9 * scale}px "Segoe UI", Roboto, sans-serif`;

      for (const leg of legendItems) {
        ctx.fillStyle = leg.color;
        ctx.beginPath();
        ctx.arc(currentX + 5 * scale, legendY + 5 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(leg.label, currentX + 13 * scale, legendY + 8 * scale);

        const textMetrics = ctx.measureText(leg.label);
        currentX += textMetrics.width + 26 * scale;
      }
    }

    URL.revokeObjectURL(url);

    // Descargar PNG
    const pngUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    const finalFilename = options.filename || 'figura_minesafe_300dpi.png';
    link.download = finalFilename.endsWith('.png') ? finalFilename : `${finalFilename}.png`;
    link.href = pngUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Error al exportar PNG de alta resolución:', err);
    return false;
  }
}

/**
 * Captura el canvas WebGL de Three.js a resolución nativa con membrete de seguridad minera.
 */
export function exportThreeJsCanvasHd(
  canvas: HTMLCanvasElement | null,
  filename = 'captura_tajo_3d_hd.png',
  metadataTitle = 'MINESAFE 3D — VISTA ESPACIAL DEL TAJO Y FLOTA MIXTA'
): boolean {
  if (!canvas) {
    console.error('Canvas WebGL de Three.js no disponible.');
    return false;
  }

  try {
    const rawDataUrl = canvas.toDataURL('image/png');
    const img = new Image();

    img.onload = () => {
      const exportCanvas = document.createElement('canvas');
      const headerHeight = 70;
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height + headerHeight;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      // Fondo oscuro
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Encabezado técnico
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
      ctx.fillText(metadataTitle, 24, 32);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px "Segoe UI", Arial, sans-serif';
      const timeStamp = new Date().toLocaleString();
      ctx.fillText(`FAENA: MINERA ESPERANZA | BANCO 3200 | TIMESTAMPE: ${timeStamp} | RESOLUCIÓN: ${canvas.width}x${canvas.height}`, 24, 52);

      // Línea divisoria cian/acero
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, headerHeight - 1);
      ctx.lineTo(exportCanvas.width, headerHeight - 1);
      ctx.stroke();

      // Dibujar captura 3D
      ctx.drawImage(img, 0, headerHeight);

      // Descargar
      const finalUrl = exportCanvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
      link.href = finalUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    img.src = rawDataUrl;
    return true;
  } catch (err) {
    console.error('Error al capturar WebGL Canvas:', err);
    return false;
  }
}
