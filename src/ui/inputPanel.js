/**
 * Stok Malzeme Giriş Paneli
 */

import { i18n } from '../i18n/index.js';
import { units } from '../core/units.js';
import { createStockItem } from '../core/models.js';
import { DEFAULT_STOCK_LENGTHS } from '../utils/constants.js';

/**
 * @param {HTMLElement} container
 * @param {import('../core/models.js').StockItem[]} stockItems
 * @param {(items: import('../core/models.js').StockItem[]) => void} onChange
 */
export function renderStockPanel(container, stockItems, onChange) {
  const t = (key, params) => i18n.t(key, params);

  function render() {
    const unitLabel = units.primaryUnit;

    container.innerHTML = `
      <div class="card anim-fade-in-up" id="stock-panel">
        <div class="card__header">
          <h2 class="card__title">
            <span class="card__title-icon">📦</span>
            <span data-i18n="stock.title">${t('stock.title')}</span>
          </h2>
          <div class="card__actions">
            <button class="btn btn--primary btn--sm" id="add-stock-btn">
              <span>+</span>
              <span data-i18n="stock.addStock">${t('stock.addStock')}</span>
            </button>
          </div>
        </div>

        ${stockItems.length === 0 ? `
          <div class="data-table__empty">
            <p data-i18n="stock.noStock">${t('stock.noStock')}</p>
          </div>
        ` : `
          <div style="overflow-x: auto;">
            <table class="data-table" id="stock-table">
              <thead>
                <tr>
                  <th style="width: 35%">${t('stock.label')}</th>
                  <th style="width: 22%">${t('stock.length')} (${unitLabel})</th>
                  <th style="width: 15%">${t('stock.quantity')}</th>
                  <th style="width: 20%">${t('stock.unitPrice')}</th>
                  <th style="width: 8%"></th>
                </tr>
              </thead>
              <tbody>
                ${stockItems.map((item, idx) => renderStockRow(item, idx, unitLabel)).join('')}
              </tbody>
            </table>
          </div>

          <!-- Hızlı stok boy ekleme -->
          <div style="margin-top: var(--sp-3); display: flex; gap: var(--sp-2); flex-wrap: wrap; align-items: center;">
            <span style="font-size: var(--fs-xs); color: var(--c-text-muted);">${t('stock.quickAdd')}</span>
            ${DEFAULT_STOCK_LENGTHS.map(s => `
              <button class="btn btn--ghost" style="padding: 2px 8px; font-size: var(--fs-xs);"
                      data-quick-stock="${s.length}">
                ${s.label}
              </button>
            `).join('')}
          </div>
        `}
      </div>
    `;

    bindEvents();
  }

  function renderStockRow(item, idx, unitLabel) {
    const displayLen = units.fromMM(item.length);

    return `
      <tr data-stock-idx="${idx}">
        <td>
          <input type="text" class="form-input form-input--sm" 
                 value="${item.label}" 
                 data-field="label" data-idx="${idx}"
                 placeholder="${i18n.t('stock.labelPlaceholder')}">
        </td>
        <td>
          <input type="number" class="form-input form-input--sm" 
                 value="${displayLen}" 
                 data-field="length" data-idx="${idx}"
                 min="0" step="any">
        </td>
        <td>
          <input type="number" class="form-input form-input--sm" 
                 value="${item.quantity}" 
                 data-field="quantity" data-idx="${idx}"
                 min="0" step="1"
                 title="${i18n.t('stock.quantityHint')}">
        </td>
        <td>
          <input type="number" class="form-input form-input--sm" 
                 value="${item.unitPrice}" 
                 data-field="unitPrice" data-idx="${idx}"
                 min="0" step="any">
        </td>
        <td>
          <button class="btn btn--danger btn--icon" 
                  data-remove-stock="${idx}" 
                  title="${i18n.t('stock.removeStock')}">
            ✕
          </button>
        </td>
      </tr>
    `;
  }

  function bindEvents() {
    // Stok ekle
    container.querySelector('#add-stock-btn')?.addEventListener('click', () => {
      stockItems.push(createStockItem({ length: 6000, label: '' }));
      onChange(stockItems);
      render();
    });

    // Hızlı stok ekle
    container.querySelectorAll('[data-quick-stock]').forEach(btn => {
      btn.addEventListener('click', () => {
        const length = Number(btn.dataset.quickStock);
        const existing = stockItems.find(s => s.length === length);
        if (!existing) {
          const label = DEFAULT_STOCK_LENGTHS.find(s => s.length === length)?.label || '';
          stockItems.push(createStockItem({ length, label }));
          onChange(stockItems);
          render();
        }
      });
    });

    // Stok sil
    container.querySelectorAll('[data-remove-stock]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.removeStock);
        stockItems.splice(idx, 1);
        onChange(stockItems);
        render();
      });
    });

    // Input değişiklikleri
    container.querySelectorAll('input[data-field]').forEach(input => {
      input.addEventListener('change', () => {
        const idx = Number(input.dataset.idx);
        const field = input.dataset.field;
        let value = input.value;

        if (field === 'length') {
          value = units.toMM(Number(value));
        } else if (field === 'quantity' || field === 'unitPrice') {
          value = Number(value);
        }

        stockItems[idx][field] = value;
        onChange(stockItems);
      });
    });
  }

  // İlk render
  render();

  // Dil / birim değişince yeniden render
  i18n.onChange(() => render());
  units.onChange(() => render());

  return { refresh: render };
}
