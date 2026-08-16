/**
 * İletişim Modalı Component'i
 */
import { i18n } from '../i18n/index.js';
import { showToast } from './toast.js';

let modalContainer = null;
let isOpen = false;

export function openContactModal() {
  isOpen = true;
  if (!modalContainer) {
    createModalDOM();
  }
  renderModalContent();
  modalContainer.classList.add('auth-modal--open');
}

export function closeContactModal() {
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
    if (e.target === modalContainer) {
      closeContactModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeContactModal();
    }
  });
}

function renderModalContent() {
  const t = (key) => i18n.t(key);

  modalContainer.innerHTML = `
    <div class="auth-modal card anim-fade-in-up" style="max-width: 500px; width: 92%; padding: var(--sp-6); border-radius: var(--radius-xl); position: relative;">
      <button id="contact-modal-close" class="auth-modal__close-btn" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--c-text-muted);">✕</button>

      <div style="text-align: center; margin-bottom: var(--sp-5);">
        <div style="font-size: 2.2rem; margin-bottom: var(--sp-2);">✉️</div>
        <h2 style="font-size: 1.35rem; font-weight: 700; color: var(--c-text);">${t('contact.title')}</h2>
        <p style="font-size: 0.85rem; color: var(--c-text-muted); margin-top: var(--sp-1);">
          ${t('contact.subtitle')}
        </p>
      </div>

      <form id="contact-form">
        <div class="form-group" style="margin-bottom: var(--sp-4);">
          <label class="form-label">${t('contact.name')}</label>
          <input type="text" id="contact-name" class="form-input" placeholder="Ad Soyad" required>
        </div>

        <div class="form-group" style="margin-bottom: var(--sp-4);">
          <label class="form-label">${t('contact.email')}</label>
          <input type="email" id="contact-email" class="form-input" placeholder="ornek@firma.com" required>
        </div>

        <div class="form-group" style="margin-bottom: var(--sp-4);">
          <label class="form-label">${t('contact.subject')}</label>
          <select id="contact-subject" class="form-input">
            <option value="general">Genel Sorular / Destek</option>
            <option value="feedback">Öneri / Özellik İsteği</option>
            <option value="bug">Hata Bildirimi</option>
            <option value="commercial">Ticari / İş Birliği</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom: var(--sp-4);">
          <label class="form-label">${t('contact.message')}</label>
          <textarea id="contact-message" class="form-input" rows="4" placeholder="Mesajınızı buraya yazın..." required style="resize: vertical; min-height: 90px;"></textarea>
        </div>

        <div id="contact-success" class="alert alert--success" style="display: none; margin-bottom: var(--sp-3); font-size: 0.85rem;"></div>

        <button type="submit" id="contact-submit-btn" class="btn btn--primary btn--block btn--lg" style="margin-top: var(--sp-4);">
          🚀 ${t('contact.send')}
        </button>
      </form>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  const closeBtn = modalContainer.querySelector('#contact-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeContactModal());
  }

  const form = modalContainer.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = modalContainer.querySelector('#contact-submit-btn');
      const successBox = modalContainer.querySelector('#contact-success');

      const name = modalContainer.querySelector('#contact-name').value;
      const email = modalContainer.querySelector('#contact-email').value;
      const subject = modalContainer.querySelector('#contact-subject').value;
      const message = modalContainer.querySelector('#contact-message').value;

      submitBtn.disabled = true;
      submitBtn.textContent = i18n.t('contact.sending');

      // Simüle edilen / Web API mesaj iletimi
      try {
        await new Promise(res => setTimeout(res, 800)); // Hızlı iletim geribildirimi
        
        successBox.textContent = i18n.t('contact.success');
        successBox.style.display = 'block';
        showToast(i18n.t('contact.success'), 'success');

        form.reset();
        setTimeout(() => {
          closeContactModal();
        }, 2000);
      } catch (err) {
        showToast('Mesaj gönderilemedi, lütfen tekrar deneyin.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🚀 ' + i18n.t('contact.send');
      }
    });
  }
}
