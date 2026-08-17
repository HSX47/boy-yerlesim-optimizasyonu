/**
 * Navbar Bileşeni
 */

import { i18n } from '../i18n/index.js';
import { units } from '../core/units.js';
import { theme } from '../core/theme.js';
import { onAuthChange, logout } from '../services/auth.js';
import { openAuthModal } from './authModal.js';
import { openContactModal } from './contactModal.js';
import { showToast } from './toast.js';

/**
 * Navbar'ı render et
 * @param {HTMLElement} container
 */
export function renderNavbar(container) {
  const locales = i18n.availableLocales;
  const unitSystems = units.available;
  let currentUser = null;

  onAuthChange((user) => {
    currentUser = user;
    render();
  });

  function render() {
    container.innerHTML = `
      <nav class="navbar" id="main-navbar">
        <div class="navbar__brand">
          <div class="navbar__logo" aria-hidden="true">🪚</div>
          <span class="navbar__title" data-i18n="app.title">${i18n.t('app.title')}</span>
        </div>

        <div class="navbar__controls">
          <!-- Üyelik Alanı -->
          <div class="navbar__auth-area" style="display: flex; align-items: center; gap: var(--sp-2);">

            ${currentUser ? `
              <div class="user-badge" style="font-size: 0.8rem; color: var(--c-text-muted); background: var(--c-surface-2); padding: 4px 10px; border-radius: var(--radius-full); border: 1px solid var(--c-border); display: flex; align-items: center; gap: 6px;">
                <span>👤</span>
                <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: var(--c-text);">${currentUser.email}</span>
              </div>
              <button id="nav-logout-btn" class="btn btn--sm btn--ghost" style="font-size: 0.8rem;">
                ${i18n.t('nav.logout')}
              </button>
            ` : `
              <button id="nav-login-btn" class="btn btn--sm btn--ghost" style="font-size: 0.8rem;">
                ${i18n.t('nav.login')}
              </button>
              <button id="nav-signup-btn" class="btn btn--sm btn--primary" style="font-size: 0.8rem; padding: 4px 12px;">
                ${i18n.t('nav.signup')}
              </button>
            `}
          </div>

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
    container.querySelector('#lang-selector')?.addEventListener('change', (e) => {
      i18n.setLocale(e.target.value);
    });

    container.querySelector('#unit-selector')?.addEventListener('change', (e) => {
      units.setSystem(e.target.value);
    });

    container.querySelector('#theme-toggle')?.addEventListener('click', () => {
      theme.toggle();
      render();
    });

    container.querySelector('#nav-login-btn')?.addEventListener('click', () => {
      openAuthModal('login');
    });

    container.querySelector('#nav-signup-btn')?.addEventListener('click', () => {
      openAuthModal('signup');
    });

    container.querySelector('#nav-logout-btn')?.addEventListener('click', async () => {
      await logout();
      showToast('Çıkış yapıldı', 'info');
    });
  }

  render();

  // Dil değişince navbar'ı yeniden render et
  i18n.onChange(() => render());
}
