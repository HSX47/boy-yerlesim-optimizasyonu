/**
 * SVG Kesim Diyagramı Görselleştirici
 */

import { i18n } from '../i18n/index.js';
import { units } from '../core/units.js';
import { CUT_COLORS, WASTE_COLOR, REMNANT_COLOR } from '../utils/constants.js';

const BAR_HEIGHT = 38;
const BAR_GAP = 12;
const LABEL_HEIGHT = 18;
const PADDING = 24;
const TEXT_OFFSET_Y = 24;

/**
 * @param {HTMLElement} container
 * @param {import('../core/models.js').OptimizationResult | null} result
 */
export function renderVisualizer(container, result) {
  const t = (key) => i18n.t(key);

  function render() {
    if (!result || result.patterns.length === 0) {
      container.innerHTML = '';
      return;
    }

    const patterns = result.patterns;
    const maxLength = Math.max(...patterns.map(p => p.stockItem.length));
    const svgWidth = 800;
    const barAreaWidth = svgWidth - PADDING * 2;
    const svgHeight = PADDING * 2 + patterns.length * (BAR_HEIGHT + BAR_GAP + LABEL_HEIGHT) + 10;

    // Global renk haritası: her benzersiz etiket/boy için sabit renk
    const colorMap = new Map();
    let colorIdx = 0;
    for (const pattern of patterns) {
      for (const cut of pattern.cuts) {
        const key = cut.piece.label || String(cut.piece.length);
        if (!colorMap.has(key)) {
          colorMap.set(key, CUT_COLORS[colorIdx % CUT_COLORS.length]);
          colorIdx++;
        }
      }
    }

    const barsHtml = patterns.map((pattern, pIdx) => {
      const y = PADDING + pIdx * (BAR_HEIGHT + BAR_GAP + LABEL_HEIGHT);
      const scale = barAreaWidth / pattern.stockItem.length;

      // Arka plan (stok çubuk)
      let barHtml = `
        <rect x="${PADDING}" y="${y}" width="${barAreaWidth}" height="${BAR_HEIGHT}" 
              rx="4" ry="4" fill="${WASTE_COLOR}" opacity="0.4"/>
      `;

      // Parçaları çiz
      for (const cut of pattern.cuts) {
        const x = PADDING + cut.position * scale;
        const w = Math.max(2, cut.piece.length * scale);
        const color = colorMap.get(cut.piece.label || String(cut.piece.length));
        const label = cut.piece.label || units.format(cut.piece.length, 0);

        barHtml += `
          <rect x="${x}" y="${y}" width="${w}" height="${BAR_HEIGHT}" 
                rx="3" ry="3" fill="${color}" class="svg-bar-fill"
                style="animation-delay: ${pIdx * 80 + cut.position / pattern.stockItem.length * 200}ms"
                opacity="0.85">
            <title>${label} — ${units.format(cut.piece.length)}</title>
          </rect>
        `;

        // Etiket (yeterli alan varsa)
        if (w > 30) {
          const fontSize = w > 60 ? 11 : 9;
          barHtml += `
            <text x="${x + w / 2}" y="${y + TEXT_OFFSET_Y}" 
                  text-anchor="middle" fill="white" font-size="${fontSize}"
                  font-family="var(--font-mono)" font-weight="500"
                  pointer-events="none">
              ${label.length > w / 7 ? label.substring(0, Math.floor(w / 7)) + '…' : label}
            </text>
          `;
        }
      }

      // Kullanılabilir artık
      if (pattern.usableRemnant > 0) {
        const remnantStart = pattern.usedLength + pattern.wasteLength;
        const x = PADDING + remnantStart * scale;
        const w = Math.max(2, pattern.usableRemnant * scale);
        barHtml += `
          <rect x="${x}" y="${y}" width="${w}" height="${BAR_HEIGHT}" 
                rx="3" ry="3" fill="${REMNANT_COLOR}" opacity="0.7">
            <title>♻️ ${units.format(pattern.usableRemnant)}</title>
          </rect>
          <pattern id="remnant-pattern-${pIdx}" patternUnits="userSpaceOnUse" width="8" height="8">
            <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="hsla(160,80%,60%,0.3)" stroke-width="1"/>
          </pattern>
          <rect x="${x}" y="${y}" width="${w}" height="${BAR_HEIGHT}" 
                rx="3" ry="3" fill="url(#remnant-pattern-${pIdx})"/>
        `;
      }

      // Fire bölgesi şerit deseni
      if (pattern.wasteLength > 0) {
        const wasteStart = pattern.usedLength;
        const x = PADDING + wasteStart * scale;
        const w = Math.max(1, pattern.wasteLength * scale);
        barHtml += `
          <pattern id="waste-pattern-${pIdx}" patternUnits="userSpaceOnUse" width="6" height="6">
            <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="hsla(0,70%,50%,0.4)" stroke-width="1"/>
          </pattern>
          <rect x="${x}" y="${y}" width="${w}" height="${BAR_HEIGHT}" 
                rx="3" ry="3" fill="url(#waste-pattern-${pIdx})"/>
        `;
      }

      // Bar etiketi (altında)
      const barLabel = `#${pIdx + 1} — ${pattern.stockItem.label || units.format(pattern.stockItem.length)} | ${t('results.waste')}: %${pattern.wastePercentage.toFixed(1)}`;
      barHtml += `
        <text x="${PADDING}" y="${y + BAR_HEIGHT + 14}" 
              fill="var(--c-text-muted)" font-size="10" font-family="var(--font-sans)">
          ${barLabel}
        </text>
      `;

      return barHtml;
    }).join('');

    container.innerHTML = `
      <div class="card anim-fade-in-up" id="visualizer-panel" style="animation-delay: 100ms;">
        <div class="card__header">
          <h2 class="card__title">
            <span class="card__title-icon">📐</span>
            <span>${t('visualizer.title')}</span>
          </h2>
        </div>
        <div style="overflow-x: auto; overflow-y: hidden;">
          <svg xmlns="http://www.w3.org/2000/svg" 
               viewBox="0 0 ${svgWidth} ${svgHeight}" 
               width="100%" 
               style="min-width: 600px;">
            <!-- Renk Açıklaması (Legend) -->
            ${renderLegend(colorMap, svgWidth)}
            ${barsHtml}
          </svg>
        </div>
      </div>
    `;
  }

  function renderLegend(colorMap, svgWidth) {
    // Legend'ı gizle (çok yer kaplıyorsa)
    if (colorMap.size === 0) return '';
    // Legend SVG'nin üstüne eklenmez, altına ayrı bir div olarak eklenir
    return '';
  }

  render();
  i18n.onChange(() => render());
  units.onChange(() => render());

  return {
    update(newResult) {
      result = newResult;
      render();
    },
  };
}
