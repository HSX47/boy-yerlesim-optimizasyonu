/**
 * Optimizasyon Parametreleri Paneli
 */

import { i18n } from '../i18n/index.js';
import { units } from '../core/units.js';

/**
 * @param {HTMLElement} container
 * @param {import('../core/models.js').OptimizationParams} params
 * @param {(params: import('../core/models.js').OptimizationParams) => void} onChange
 */
export function renderParamsPanel(container, params, onChange) {
  const t = (key) => i18n.t(key);

  function render() {
    const unitLabel = units.primaryUnit;

    container.innerHTML = `
      <div class="card anim-fade-in-up" id="params-panel" style="animation-delay: 160ms;">
        <div class="card__header">
          <h2 class="card__title">
            <span class="card__title-icon">⚙️</span>
            <span data-i18n="params.title">${t('params.title')}</span>
          </h2>
        </div>

        <div class="params-row">
          <div class="form-group">
            <label class="form-label" for="kerf-input">${t('params.kerfWidth')} (${unitLabel})</label>
            <input type="number" id="kerf-input" class="form-input" 
                   value="${units.fromMM(params.kerfWidth)}" 
                   min="0" step="any">
            <span class="form-hint">${t('params.kerfWidthHint')}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="remnant-input">${t('params.minRemnant')} (${unitLabel})</label>
            <input type="number" id="remnant-input" class="form-input" 
                   value="${units.fromMM(params.minUsableRemnant)}" 
                   min="0" step="any">
            <span class="form-hint">${t('params.minRemnantHint')}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="cut-cost-input">${t('params.cutCost')} (${t('common.currency')})</label>
            <input type="number" id="cut-cost-input" class="form-input" 
                   value="${params.cutCost || 0}" 
                   min="0" step="any">
            <span class="form-hint">${t('params.cutCostHint')}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="algo-select">${t('params.algorithm')}</label>
            <select id="algo-select" class="form-input">
              <option value="ffd" ${params.algorithm === 'ffd' ? 'selected' : ''}>
                ${t('params.algorithmFFD')}
              </option>
              <option value="bfd" ${params.algorithm === 'bfd' ? 'selected' : ''}>
                ${t('params.algorithmBFD')}
              </option>
              <option value="branchBound" ${params.algorithm === 'branchBound' ? 'selected' : ''}>
                ${t('params.algorithmBB')} ⭐
              </option>
            </select>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelector('#kerf-input')?.addEventListener('change', (e) => {
      params.kerfWidth = units.toMM(Number(e.target.value));
      onChange(params);
    });

    container.querySelector('#remnant-input')?.addEventListener('change', (e) => {
      params.minUsableRemnant = units.toMM(Number(e.target.value));
      onChange(params);
    });

    container.querySelector('#cut-cost-input')?.addEventListener('change', (e) => {
      params.cutCost = Math.max(0, Number(e.target.value) || 0);
      onChange(params);
    });

    container.querySelector('#algo-select')?.addEventListener('change', (e) => {
      params.algorithm = e.target.value;
      onChange(params);
    });
  }

  render();
  i18n.onChange(() => render());
  units.onChange(() => render());

  return { refresh: render };
}
