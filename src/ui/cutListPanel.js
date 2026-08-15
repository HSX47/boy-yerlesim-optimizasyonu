/**
 * Kesim Listesi Paneli
 */

import { i18n } from '../i18n/index.js';
import { units } from '../core/units.js';
import { createCutPiece } from '../core/models.js';

/**
 * @param {HTMLElement} container
 * @param {import('../core/models.js').CutPiece[]} cutPieces
 * @param {(items: import('../core/models.js').CutPiece[]) => void} onChange
 */
export function renderCutListPanel(container, cutPieces, onChange) {
  const t = (key, params) => i18n.t(key, params);

  function render() {
    const unitLabel = units.primaryUnit;

    container.innerHTML = `
      <div class="card anim-fade-in-up" id="cuts-panel" style="animation-delay: 80ms;">
        <div class="card__header">
          <h2 class="card__title">
            <span class="card__title-icon">✂️</span>
            <span data-i18n="cuts.title">${t('cuts.title')}</span>
          </h2>
          <div class="card__actions">
            <button class="btn btn--ghost btn--sm" id="paste-excel-btn" title="${t('cuts.pasteFromExcel')}">
              📋
            </button>
            <button class="btn btn--primary btn--sm" id="add-cut-btn">
              <span>+</span>
              <span data-i18n="cuts.addCut">${t('cuts.addCut')}</span>
            </button>
          </div>
        </div>

        ${cutPieces.length === 0 ? `
          <div class="data-table__empty">
            <p data-i18n="cuts.noCuts">${t('cuts.noCuts')}</p>
          </div>
        ` : `
          <div style="overflow-x: auto;">
            <table class="data-table" id="cuts-table">
              <thead>
                <tr>
                  <th style="width: 40%">${t('cuts.label')}</th>
                  <th style="width: 25%">${t('cuts.length')} (${unitLabel})</th>
                  <th style="width: 15%">${t('cuts.quantity')}</th>
                  <th style="width: 12%"></th>
                </tr>
              </thead>
              <tbody>
                ${cutPieces.map((piece, idx) => renderCutRow(piece, idx, unitLabel)).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-top: var(--sp-3); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: var(--fs-xs); color: var(--c-text-muted);">
              ${t('cuts.totalTypes', { count: cutPieces.length })} · 
              ${t('cuts.totalPieces', { count: cutPieces.reduce((sum, p) => sum + p.quantity, 0) })}
            </span>
          </div>
        `}
      </div>
    `;

    bindEvents();
  }

  function renderCutRow(piece, idx, unitLabel) {
    const displayLen = units.fromMM(piece.length);

    return `
      <tr data-cut-idx="${idx}">
        <td>
          <input type="text" class="form-input form-input--sm" 
                 value="${piece.label}" 
                 data-field="label" data-idx="${idx}"
                 placeholder="${i18n.t('cuts.labelPlaceholder')}">
        </td>
        <td>
          <input type="number" class="form-input form-input--sm" 
                 value="${displayLen}" 
                 data-field="length" data-idx="${idx}"
                 min="0" step="any">
        </td>
        <td>
          <input type="number" class="form-input form-input--sm" 
                 value="${piece.quantity}" 
                 data-field="quantity" data-idx="${idx}"
                 min="1" step="1">
        </td>
        <td>
          <div style="display: flex; gap: var(--sp-1);">
            <button class="btn btn--ghost btn--icon" style="width:28px;height:28px;"
                    data-duplicate-cut="${idx}" title="${i18n.t('common.edit')}">
              📋
            </button>
            <button class="btn btn--danger btn--icon" style="width:28px;height:28px;"
                    data-remove-cut="${idx}" title="${i18n.t('cuts.removeCut')}">
              ✕
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function bindEvents() {
    // Kesim ekle
    container.querySelector('#add-cut-btn')?.addEventListener('click', () => {
      cutPieces.push(createCutPiece());
      onChange(cutPieces);
      render();
      // Son eklenen satırın ilk input'una focusla
      setTimeout(() => {
        const rows = container.querySelectorAll('[data-cut-idx]');
        const lastRow = rows[rows.length - 1];
        lastRow?.querySelector('input')?.focus();
      }, 50);
    });

    // Kesim sil
    container.querySelectorAll('[data-remove-cut]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.removeCut);
        cutPieces.splice(idx, 1);
        onChange(cutPieces);
        render();
      });
    });

    // Kesim çoğalt
    container.querySelectorAll('[data-duplicate-cut]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.duplicateCut);
        const original = cutPieces[idx];
        cutPieces.splice(idx + 1, 0, createCutPiece({
          length: original.length,
          quantity: original.quantity,
          label: original.label + ' (kopya)',
        }));
        onChange(cutPieces);
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
        } else if (field === 'quantity') {
          value = Math.max(1, Math.round(Number(value)));
        }

        cutPieces[idx][field] = value;
        onChange(cutPieces);
      });
    });

    // Excel'den yapıştır
    container.querySelector('#paste-excel-btn')?.addEventListener('click', () => {
      showPasteModal(cutPieces, onChange, render);
    });
  }

  render();

  i18n.onChange(() => render());
  units.onChange(() => render());

  return { refresh: render };
}

/**
 * Excel'den yapıştır modalı
 */
function showPasteModal(cutPieces, onChange, rerender) {
  const t = (key) => i18n.t(key);

  // Basit bir modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:500;
    background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);
    display:flex; align-items:center; justify-content:center;
  `;

  overlay.innerHTML = `
    <div class="card anim-scale-in" style="width:500px; max-width:90vw;">
      <div class="card__header">
        <h3 class="card__title">${t('cuts.pasteFromExcel')}</h3>
        <button class="btn btn--ghost btn--icon" id="paste-modal-close">&times;</button>
      </div>
      <p style="font-size:var(--fs-sm); color:var(--c-text-2); margin-bottom:var(--sp-4);">
        Excel'den kopyaladığınız verileri yapıştırın. Format: <code style="color:var(--c-primary-400);">Etiket &lt;TAB&gt; Boy &lt;TAB&gt; Adet</code>
      </p>
      <textarea id="paste-area" class="form-input" 
                style="min-height:150px; font-family:var(--font-mono); font-size:var(--fs-sm);"
                placeholder="Kolon K1&#9;2500&#9;4&#10;Kiriş KR1&#9;3200&#9;2"></textarea>
      <div style="display:flex; justify-content:flex-end; gap:var(--sp-2); margin-top:var(--sp-4);">
        <button class="btn btn--ghost" id="paste-modal-cancel">${t('common.cancel')}</button>
        <button class="btn btn--primary" id="paste-modal-apply">${t('common.confirm')}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();

  overlay.querySelector('#paste-modal-close').addEventListener('click', close);
  overlay.querySelector('#paste-modal-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelector('#paste-modal-apply').addEventListener('click', () => {
    const text = overlay.querySelector('#paste-area').value.trim();
    if (!text) { close(); return; }

    const lines = text.split('\n');
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const label = parts[0]?.trim() || '';
        const length = units.toMM(Number(parts[1]) || 0);
        const quantity = Math.max(1, Math.round(Number(parts[2]) || 1));
        if (length > 0) {
          cutPieces.push(createCutPiece({ label, length, quantity }));
        }
      }
    }
    onChange(cutPieces);
    rerender();
    close();
  });

  // Focus textarea
  setTimeout(() => overlay.querySelector('#paste-area')?.focus(), 100);
}
