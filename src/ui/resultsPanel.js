/**
 * Sonuç Paneli — İstatistik kartları + kesim planı tablosu
 */

import { i18n } from '../i18n/index.js';
import { units } from '../core/units.js';

/**
 * @param {HTMLElement} container
 * @param {import('../core/models.js').OptimizationResult | null} result
 * @param {{ onExportPdf?: () => void, onExportExcel?: () => void }} [callbacks]
 */
export function renderResultsPanel(container, result, callbacks = {}) {
  const t = (key, params) => i18n.t(key, params);

  function render() {
    if (!result) {
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state__icon">📊</div>
            <p class="empty-state__title" data-i18n="results.noResults">${t('results.noResults')}</p>
            <p class="empty-state__text">${t('app.tagline')}</p>
          </div>
        </div>
      `;
      return;
    }

    const currency = t('common.currency');

    container.innerHTML = `
      <div class="card anim-fade-in-up" id="results-panel">
        <div class="card__header">
          <h2 class="card__title">
            <span class="card__title-icon">📊</span>
            <span>${t('results.title')}</span>
          </h2>
          <div class="card__actions">
            <button class="btn btn--ghost btn--sm" id="export-pdf-btn">📄 ${t('actions.exportPdf')}</button>
            <button class="btn btn--ghost btn--sm" id="export-excel-btn">📊 ${t('actions.exportExcel')}</button>
          </div>
        </div>

        ${result.unplacedCount > 0 ? `
          <div class="alert alert--danger" style="margin-bottom: var(--sp-4); padding: var(--sp-3) var(--sp-4); border-radius: var(--radius-md); background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); color: #dc2626; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; gap: var(--sp-2);">
            <span style="font-size: 1.1rem;">⚠️</span>
            <span>${t('results.unplacedWarning', { count: result.unplacedCount })}</span>
          </div>
        ` : ''}

        <!-- Özet Kartları -->
        <div class="stat-grid stagger-children" style="margin-bottom: var(--sp-6);">
          <div class="stat-card">
            <div class="stat-card__label">${t('results.totalStock')}</div>
            <div class="stat-card__value stat-card__value--primary">
              ${result.totalStockUsed}
            </div>
            <div class="stat-card__sub">${t('results.pieces')}</div>
          </div>

          <div class="stat-card">
            <div class="stat-card__label">${t('results.wastePercentage')}</div>
            <div class="stat-card__value ${result.totalWastePercentage < 10 ? 'stat-card__value--success' : result.totalWastePercentage < 20 ? 'stat-card__value--warning' : 'stat-card__value--danger'}">
              %${result.totalWastePercentage.toFixed(1)}
            </div>
            <div class="stat-card__sub">${units.format(result.totalWaste)}</div>
          </div>

          <div class="stat-card">
            <div class="stat-card__label">${t('results.totalCuts')}</div>
            <div class="stat-card__value stat-card__value--primary">
              ${result.totalCuts || 0}
            </div>
            <div class="stat-card__sub">${t('results.pieces')}</div>
          </div>

          <div class="stat-card">
            <div class="stat-card__label">${t('results.totalCost')}</div>
            <div class="stat-card__value stat-card__value--info">
              ${result.totalCost > 0 ? result.totalCost.toFixed(2) + ' ' + currency : '—'}
            </div>
            <div class="stat-card__sub">
              ${result.totalCost > 0 ? `${t('results.materialCost')}: ${result.totalMaterialCost.toFixed(2)} ${currency} | ${t('results.cuttingCost')}: ${result.totalCuttingCost.toFixed(2)} ${currency}` : ''}
            </div>
          </div>
        </div>

        <!-- Kullanılabilir Artıklar -->
        ${result.usableRemnants.length > 0 ? `
          <div style="margin-bottom: var(--sp-5);">
            <h3 style="font-size: var(--fs-sm); font-weight: var(--fw-semibold); color: var(--c-success-400); margin-bottom: var(--sp-2);">
              ♻️ ${t('results.usableRemnants')}
            </h3>
            <div style="display: flex; gap: var(--sp-2); flex-wrap: wrap;">
              ${result.usableRemnants.map(r => `
                <span style="
                  background: hsla(160, 84%, 39%, 0.15);
                  border: 1px solid hsla(160, 84%, 39%, 0.3);
                  border-radius: var(--r-sm);
                  padding: var(--sp-1) var(--sp-3);
                  font-size: var(--fs-sm);
                  font-family: var(--font-mono);
                  color: var(--c-success-400);
                ">${units.format(r.length)} × ${r.count}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Kesim Planı Detayları -->
        <div class="section-divider">
          <span class="section-divider__text">${t('results.cuttingPlan')}</span>
        </div>

        <div id="cutting-plan-details" style="display: flex; flex-direction: column; gap: var(--sp-3);">
          ${result.patterns.map((pattern, idx) => renderPatternCard(pattern, idx)).join('')}
        </div>
      </div>
    `;

    // Export butonlarını bağla
    bindExportButtons();
  }

  function bindExportButtons() {
    const pdfBtn = container.querySelector('#export-pdf-btn');
    const excelBtn = container.querySelector('#export-excel-btn');

    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        if (callbacks.onExportPdf) {
          callbacks.onExportPdf();
        }
      });
    }

    if (excelBtn) {
      excelBtn.addEventListener('click', () => {
        if (callbacks.onExportExcel) {
          callbacks.onExportExcel();
        }
      });
    }
  }

  function renderPatternCard(pattern, idx) {
    const wasteClass = pattern.wastePercentage < 10 ? 'success' : pattern.wastePercentage < 20 ? 'warning' : 'danger';

    return `
      <div class="stat-card" style="padding: var(--sp-3) var(--sp-4);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-2);">
          <span style="font-weight: var(--fw-semibold); font-size: var(--fs-sm);">
            ${t('results.stockBar')} #${idx + 1}
            <span style="color: var(--c-text-muted); font-weight: var(--fw-normal);">
              — ${pattern.stockItem.label || units.format(pattern.stockItem.length)}
            </span>
          </span>
          <span style="font-size: var(--fs-xs); color: var(--c-${wasteClass}-400); font-family: var(--font-mono);">
            ${t('results.waste')}: %${pattern.wastePercentage.toFixed(1)}
          </span>
        </div>
        <div style="display: flex; gap: var(--sp-1); flex-wrap: wrap; font-size: var(--fs-xs);">
          ${pattern.cuts.map(c => `
            <span style="
              background: var(--c-surface-3);
              border-radius: var(--r-sm);
              padding: 2px 6px;
              font-family: var(--font-mono);
              color: var(--c-text-2);
            ">${c.piece.label || units.format(c.piece.length)}</span>
          `).join('')}
          ${pattern.wasteLength > 0 ? `
            <span style="
              background: hsla(0, 60%, 40%, 0.2);
              border-radius: var(--r-sm);
              padding: 2px 6px;
              font-family: var(--font-mono);
              color: var(--c-danger-400);
            ">🗑 ${units.format(pattern.wasteLength)}</span>
          ` : ''}
          ${pattern.usableRemnant > 0 ? `
            <span style="
              background: hsla(160, 60%, 40%, 0.2);
              border-radius: var(--r-sm);
              padding: 2px 6px;
              font-family: var(--font-mono);
              color: var(--c-success-400);
            ">♻️ ${units.format(pattern.usableRemnant)}</span>
          ` : ''}
        </div>
      </div>
    `;
  }

  render();
  i18n.onChange(() => render());
  units.onChange(() => render());

  return {
    update(newResult) {
      result = newResult;
      render();
    },
    setCallbacks(newCallbacks) {
      Object.assign(callbacks, newCallbacks);
    },
    refresh: render,
  };
}
