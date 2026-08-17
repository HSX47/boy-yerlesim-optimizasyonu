/**
 * Navbar Bileşeni
 */

import { i18n } from '../i18n/index.js';
import { units } from '../core/units.js';
import { theme } from '../core/theme.js';
import { onAuthChange, logout } from '../services/auth.js';
import { openAuthModal } from './authModal.js';
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
        <div class="navbar__header-row">
          <div class="navbar__brand">
            <div class="navbar__logo" aria-hidden="true">🪚</div>
            <span class="navbar__title" data-i18n="app.title">${i18n.t('app.title')}</span>
          </div>

          <div class="navbar__settings">
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
        </div>

        <!-- Üyelik Alanı -->
        <div class="navbar__auth-area">
          ${currentUser ? `
            <div class="user-badge">
              <span>👤</span>
              <span class="user-badge__email">${currentUser.email}</span>
            </div>
            <button id="nav-logout-btn" class="btn btn--sm btn--ghost">
              ${i18n.t('nav.logout')}
            </button>
          ` : `
            <button id="nav-login-btn" class="btn btn--sm btn--ghost">
              ${i18n.t('nav.login')}
            </button>
            <button id="nav-signup-btn" class="btn btn--sm btn--primary">
              ${i18n.t('nav.signup')}
            </button>
          `}
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
