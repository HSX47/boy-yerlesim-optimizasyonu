/**
 * Navbar Bileşeni
 */

import { i18n } from '../i18n/index.js';
import { units } from '../core/units.js';
import { theme } from '../core/theme.js';

/**
 * Navbar'ı render et
 * @param {HTMLElement} container
 */
export function renderNavbar(container) {
  const locales = i18n.availableLocales;
  const unitSystems = units.available;

  function render() {
    container.innerHTML = `
      <nav class="navbar" id="main-navbar">
        <div class="navbar__brand">
          <div class="navbar__logo" aria-hidden="true">✂</div>
          <span class="navbar__title" data-i18n="app.title">${i18n.t('app.title')}</span>
        </div>

        <div class="navbar__controls">
          <!-- Tema Toggle -->
          <button id="theme-toggle" class="btn btn--icon btn--ghost" 
                  title="${theme.isDark ? i18n.t('nav.lightTheme') : i18n.t('nav.darkTheme')}"
                  aria-label="Toggle theme">
            ${theme.isDark ? '☀️' : '🌙'}
          </button>

          <!-- Birim Seçici -->
          <select id="unit-selector" class="select-mini" aria-label="Unit system">
            ${unitSystems.map(u => `
              <option value="${u.code}" ${u.code === units.code ? 'selected' : ''}>
                ${u.code === 'metric' ? '📏 mm' : '📐 inch'}
              </option>
            `).join('')}
          </select>

          <!-- Dil Seçici -->
          <select id="lang-selector" class="select-mini" aria-label="Language">
            ${locales.map(l => `
              <option value="${l.code}" ${l.code === i18n.locale ? 'selected' : ''}>
                ${l.flag} ${l.name}
              </option>
            `).join('')}
          </select>
        </div>
      </nav>
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelector('#lang-selector').addEventListener('change', (e) => {
      i18n.setLocale(e.target.value);
    });

    container.querySelector('#unit-selector').addEventListener('change', (e) => {
      units.setSystem(e.target.value);
    });

    container.querySelector('#theme-toggle').addEventListener('click', () => {
      theme.toggle();
      render();
    });
  }

  render();

  // Dil değişince navbar'ı yeniden render et
  i18n.onChange(() => render());
}
