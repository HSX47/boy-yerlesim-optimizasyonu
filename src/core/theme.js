/**
 * Tema Yöneticisi — Koyu/Açık tema geçişi
 */

const STORAGE_KEY = 'cutoptimizer_theme';

class ThemeManager {
  constructor() {
    this._theme = this._loadSaved();
    this._listeners = [];
    this._apply();
  }

  get theme() {
    return this._theme;
  }

  get isDark() {
    return this._theme === 'dark';
  }

  toggle() {
    this.setTheme(this._theme === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    this._theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
    this._apply();
    this._notify();
  }

  onChange(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(cb => cb !== callback);
    };
  }

  _apply() {
    document.documentElement.setAttribute('data-theme', this._theme);
  }

  _loadSaved() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    // Sistem tercihini kontrol et
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  _notify() {
    this._listeners.forEach(cb => cb(this._theme));
  }
}

export const theme = new ThemeManager();
