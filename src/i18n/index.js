/**
 * i18n Engine
 * 
 * Yeni dil eklemek için:
 * 1. src/i18n/ altına yeni dosya oluşturun (ör: de.js)
 * 2. tr.js yapısını kopyalayıp çevirin
 * 3. Aşağıdaki AVAILABLE_LOCALES objesine ekleyin
 * 4. Bu kadar — otomatik olarak dil seçiciye eklenir
 */

import tr from './tr.js';
import en from './en.js';

const AVAILABLE_LOCALES = { tr, en };
const STORAGE_KEY = 'cutoptimizer_lang';
const DEFAULT_LOCALE = 'tr';

class I18n {
  constructor() {
    this._locale = this._loadSavedLocale();
    this._listeners = [];
  }

  /** Mevcut dil kodu */
  get locale() {
    return this._locale;
  }

  /** Mevcut dil verisi */
  get messages() {
    return AVAILABLE_LOCALES[this._locale] || AVAILABLE_LOCALES[DEFAULT_LOCALE];
  }

  /** Tüm desteklenen diller */
  get availableLocales() {
    return Object.keys(AVAILABLE_LOCALES).map(code => ({
      code,
      name: AVAILABLE_LOCALES[code].meta.name,
      flag: AVAILABLE_LOCALES[code].meta.flag,
    }));
  }

  /**
   * Dil değiştir
   * @param {string} locale - Dil kodu (ör: 'tr', 'en')
   */
  setLocale(locale) {
    if (!AVAILABLE_LOCALES[locale]) {
      console.warn(`[i18n] Unknown locale: "${locale}". Falling back to "${DEFAULT_LOCALE}".`);
      locale = DEFAULT_LOCALE;
    }
    this._locale = locale;
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    this._updateDOM();
    this._notify();
  }

  /**
   * Çeviri al — noktalı anahtar desteği (ör: 'stock.title')
   * @param {string} key - Noktalı çeviri anahtarı
   * @param {object} [params] - İnterpolasyon parametreleri (ör: { min: 5 })
   * @returns {string}
   */
  t(key, params = {}) {
    const value = this._resolve(key);
    if (value === undefined) {
      console.warn(`[i18n] Missing key: "${key}" for locale "${this._locale}"`);
      return key;
    }
    return this._interpolate(value, params);
  }

  /**
   * Dil değişikliğini dinle
   * @param {Function} callback
   * @returns {Function} Aboneliği iptal eden fonksiyon
   */
  onChange(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(cb => cb !== callback);
    };
  }

  // ── Private ──

  _loadSavedLocale() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && AVAILABLE_LOCALES[saved]) return saved;

    // Tarayıcı dilini kontrol et
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang && AVAILABLE_LOCALES[browserLang]) return browserLang;

    return DEFAULT_LOCALE;
  }

  _resolve(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.messages);
  }

  _interpolate(str, params) {
    return str.replace(/\{(\w+)\}/g, (_, key) => {
      return params[key] !== undefined ? params[key] : `{${key}}`;
    });
  }

  /**
   * DOM'daki data-i18n attribute'larını güncelle
   * Kullanım: <span data-i18n="stock.title"></span>
   * Placeholder: <input data-i18n-placeholder="stock.labelPlaceholder">
   * Title: <button data-i18n-title="stock.removeStock">
   */
  _updateDOM() {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const paramsAttr = el.getAttribute('data-i18n-params');
      const params = paramsAttr ? JSON.parse(paramsAttr) : {};
      el.textContent = this.t(key, params);
    });

    // Placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
    });

    // Title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = this.t(el.getAttribute('data-i18n-title'));
    });

    // aria-label
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', this.t(el.getAttribute('data-i18n-aria')));
    });
  }

  _notify() {
    this._listeners.forEach(cb => cb(this._locale));
  }
}

// Singleton export
export const i18n = new I18n();
