/**
 * Üyelik / Giriş Yap / Şifremi Unuttum Modalı Component'i
 */
import { i18n } from '../i18n/index.js';
import { login, signUp, resetPassword } from '../services/auth.js';
import { authConfig } from '../config/authConfig.js';
import { showToast } from './toast.js';

let modalContainer = null;
let activeTab = 'login'; // 'login' | 'signup' | 'forgot'
let isOpen = false;

export function openAuthModal(defaultTab = 'login') {
  activeTab = defaultTab;
  isOpen = true;
  if (!modalContainer) {
    createModalDOM();
  }
  renderModalContent();
  modalContainer.classList.add('auth-modal--open');
}

export function closeAuthModal() {
  // Eğer üyelik zorunlu ise (requireAuth: true) ve kullanıcı giriş yapmadıysa modal kapatılamaz
  if (authConfig.requireAuth) {
    showToast('Hesaplayıcıyı kullanmak için lütfen giriş yapın veya üye olun.', 'warning');
    return;
  }
  isOpen = false;
  if (modalContainer) {
    modalContainer.classList.remove('auth-modal--open');
  }
}

function createModalDOM() {
  modalContainer = document.createElement('div');
  modalContainer.className = 'auth-modal-overlay';
  document.body.appendChild(modalContainer);

  modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer && !authConfig.requireAuth) {
      closeAuthModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen && !authConfig.requireAuth) {
      closeAuthModal();
    }
  });
}

function renderModalContent() {
  const t = (key) => i18n.t(key);
  const isMandatory = authConfig.requireAuth;

  modalContainer.innerHTML = `
    <div class="auth-modal card anim-fade-in-up" style="max-width: 440px; width: 90%; padding: var(--sp-6); border-radius: var(--radius-xl); position: relative;">
      ${!isMandatory ? `
        <button id="auth-modal-close" class="auth-modal__close-btn" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--c-text-muted);">✕</button>
      ` : ''}

      <div style="text-align: center; margin-bottom: var(--sp-5);">
        <div style="font-size: 2.2rem; margin-bottom: var(--sp-2);">🔐</div>
        <h2 style="font-size: 1.35rem; font-weight: 700; color: var(--c-text);">${t('auth.title')}</h2>
        ${isMandatory ? `
          <p style="font-size: 0.85rem; color: var(--c-warning-400); margin-top: var(--sp-2);">
            ⚠️ ${t('auth.mandatoryNotice')}
          </p>
        ` : `
          <p style="font-size: 0.85rem; color: var(--c-text-muted); margin-top: var(--sp-1);">
            ${t('auth.subtitle')}
          </p>
        `}
      </div>

      <!-- Sekme Butonları -->
      ${activeTab !== 'forgot' ? `
        <div class="auth-tabs" style="display: flex; gap: var(--sp-2); margin-bottom: var(--sp-5); border-bottom: 1px solid var(--c-border); padding-bottom: var(--sp-2);">
          <button id="tab-login-btn" class="btn btn--sm ${activeTab === 'login' ? 'btn--primary' : 'btn--ghost'}" style="flex: 1;">
            ${t('auth.loginTab')}
          </button>
          <button id="tab-signup-btn" class="btn btn--sm ${activeTab === 'signup' ? 'btn--primary' : 'btn--ghost'}" style="flex: 1;">
            ${t('auth.signupTab')}
          </button>
        </div>
      ` : ''}

      <!-- Form Alanı -->
      <div id="auth-form-body">
        ${renderTabForm(activeTab)}
      </div>
    </div>
  `;

  bindModalEvents();
}

function renderTabForm(tab) {
  const t = (key) => i18n.t(key);

  if (tab === 'login') {
    return `
      <form id="login-form">
        <div class="form-group" style="margin-bottom: var(--sp-4);">
          <label class="form-label">${t('auth.email')}</label>
          <input type="email" id="login-email" class="form-input" placeholder="ornek@firma.com" required autocomplete="email">
        </div>

        <div class="form-group" style="margin-bottom: var(--sp-3);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label class="form-label">${t('auth.password')}</label>
            <a href="#" id="forgot-link" style="font-size: 0.78rem; color: var(--c-primary-400); text-decoration: none;">${t('auth.forgotPasswordLink')}</a>
          </div>
          <input type="password" id="login-password" class="form-input" placeholder="••••••••" required autocomplete="current-password">
        </div>

        <div id="auth-error" class="alert alert--danger" style="display: none; margin-bottom: var(--sp-3); font-size: 0.8rem;"></div>

        <button type="submit" id="auth-submit-btn" class="btn btn--primary btn--block btn--lg" style="margin-top: var(--sp-4);">
          ${t('auth.loginBtn')}
        </button>
      </form>
    `;
  }

  if (tab === 'signup') {
    return `
      <form id="signup-form">
        <div class="form-group" style="margin-bottom: var(--sp-4);">
          <label class="form-label">${t('auth.email')}</label>
          <input type="email" id="signup-email" class="form-input" placeholder="ornek@firma.com" required autocomplete="email">
        </div>

        <div class="form-group" style="margin-bottom: var(--sp-4);">
          <label class="form-label">${t('auth.password')}</label>
          <input type="password" id="signup-password" class="form-input" placeholder="Min. 6 karakter" required minlength="6" autocomplete="new-password">
        </div>

        <div class="form-group" style="margin-bottom: var(--sp-4);">
          <label class="form-label">${t('auth.passwordConfirm')}</label>
          <input type="password" id="signup-password-confirm" class="form-input" placeholder="Şifrenizi tekrar yazın" required minlength="6" autocomplete="new-password">
        </div>

        <div id="auth-error" class="alert alert--danger" style="display: none; margin-bottom: var(--sp-3); font-size: 0.8rem;"></div>

        <button type="submit" id="auth-submit-btn" class="btn btn--success btn--block btn--lg" style="margin-top: var(--sp-4);">
          ${t('auth.signupBtn')}
        </button>
      </form>
    `;
  }

  if (tab === 'forgot') {
    return `
      <form id="forgot-form">
        <p style="font-size: 0.85rem; color: var(--c-text-muted); margin-bottom: var(--sp-4);">
          ${t('auth.forgotInstructions')}
        </p>

        <div class="form-group" style="margin-bottom: var(--sp-4);">
          <label class="form-label">${t('auth.email')}</label>
          <input type="email" id="forgot-email" class="form-input" placeholder="ornek@firma.com" required autocomplete="email">
        </div>

        <div id="auth-error" class="alert alert--danger" style="display: none; margin-bottom: var(--sp-3); font-size: 0.8rem;"></div>
        <div id="auth-success" class="alert alert--success" style="display: none; margin-bottom: var(--sp-3); font-size: 0.8rem;"></div>

        <button type="submit" id="auth-submit-btn" class="btn btn--primary btn--block btn--lg" style="margin-top: var(--sp-3);">
          ${t('auth.sendResetLink')}
        </button>

        <div style="text-align: center; margin-top: var(--sp-4);">
          <a href="#" id="back-to-login" style="font-size: 0.85rem; color: var(--c-primary-400); text-decoration: none;">
            ← ${t('auth.backToLogin')}
          </a>
        </div>
      </form>
    `;
  }
}

function bindModalEvents() {
  // Kapatma butonu
  const closeBtn = modalContainer.querySelector('#auth-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeAuthModal());
  }

  // Sekme değiştirme
  const tabLogin = modalContainer.querySelector('#tab-login-btn');
  const tabSignup = modalContainer.querySelector('#tab-signup-btn');

  if (tabLogin) {
    tabLogin.addEventListener('click', () => {
      activeTab = 'login';
      renderModalContent();
    });
  }

  if (tabSignup) {
    tabSignup.addEventListener('click', () => {
      activeTab = 'signup';
      renderModalContent();
    });
  }

  // Şifremi unuttum linki
  const forgotLink = modalContainer.querySelector('#forgot-link');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      activeTab = 'forgot';
      renderModalContent();
    });
  }

  // Girişe dön linki
  const backLink = modalContainer.querySelector('#back-to-login');
  if (backLink) {
    backLink.addEventListener('click', (e) => {
      e.preventDefault();
      activeTab = 'login';
      renderModalContent();
    });
  }

  // Login form submit
  const loginForm = modalContainer.querySelector('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = modalContainer.querySelector('#login-email').value.trim();
      const password = modalContainer.querySelector('#login-password').value;
      const submitBtn = modalContainer.querySelector('#auth-submit-btn');
      const errBox = modalContainer.querySelector('#auth-error');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Giriş yapılıyor...';
      errBox.style.display = 'none';

      const res = await login(email, password);
      submitBtn.disabled = false;
      submitBtn.textContent = i18n.t('auth.loginBtn');

      if (res.error) {
        errBox.textContent = res.error;
        errBox.style.display = 'block';
      } else {
        showToast('Başarıyla giriş yapıldı!', 'success');
        closeAuthModal();
      }
    });
  }

  // Sign up form submit
  const signupForm = modalContainer.querySelector('#signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = modalContainer.querySelector('#signup-email').value.trim();
      const password = modalContainer.querySelector('#signup-password').value;
      const confirm = modalContainer.querySelector('#signup-password-confirm').value;
      const submitBtn = modalContainer.querySelector('#auth-submit-btn');
      const errBox = modalContainer.querySelector('#auth-error');

      errBox.style.display = 'none';

      if (password !== confirm) {
        errBox.textContent = 'Girdiğiniz şifreler birbiriyle eşleşmiyor.';
        errBox.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Kayıt olunuyor...';

      const res = await signUp(email, password);
      submitBtn.disabled = false;
      submitBtn.textContent = i18n.t('auth.signupBtn');

      if (res.error) {
        errBox.textContent = res.error;
        errBox.style.display = 'block';
      } else {
        showToast('Kayıt başarıyla oluşturuldu!', 'success');
        closeAuthModal();
      }
    });
  }

  // Forgot password submit
  const forgotForm = modalContainer.querySelector('#forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = modalContainer.querySelector('#forgot-email').value.trim();
      const submitBtn = modalContainer.querySelector('#auth-submit-btn');
      const errBox = modalContainer.querySelector('#auth-error');
      const successBox = modalContainer.querySelector('#auth-success');

      errBox.style.display = 'none';
      successBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Gönderiliyor...';

      const res = await resetPassword(email);
      submitBtn.disabled = false;
      submitBtn.textContent = i18n.t('auth.sendResetLink');

      if (res.error) {
        errBox.textContent = res.error;
        errBox.style.display = 'block';
      } else {
        successBox.textContent = 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!';
        successBox.style.display = 'block';
      }
    });
  }
}
