/**
 * Birim Dönüşüm Sistemi
 * 
 * Metrik (mm) ve Imperial (inch) arasında dönüşüm.
 * Dahili olarak tüm değerler mm cinsinden saklanır.
 */

const STORAGE_KEY = 'cutoptimizer_units';

/** 1 inch = 25.4 mm */
const MM_PER_INCH = 25.4;

/** Birim sistemi tanımları */
export const UNIT_SYSTEMS = {
  metric: {
    code: 'metric',
    primary: 'mm',
    secondary: 'cm',
    tertiary: 'm',
    label: 'units.metric',
    /** mm → display */
    fromInternal: (mm) => mm,
    /** display → mm */
    toInternal: (val) => val,
    /** Kısa format (otomatik birim seçimi) */
    format: (mm, decimals = 1) => {
      if (mm >= 10000) return `${(mm / 1000).toFixed(decimals)} m`;
      if (mm >= 100) return `${(mm / 10).toFixed(decimals)} cm`;
      return `${mm.toFixed(decimals)} mm`;
    },
    /** Her zaman mm olarak göster */
    formatPrimary: (mm, decimals = 1) => `${mm.toFixed(decimals)} mm`,
  },
  imperial: {
    code: 'imperial',
    primary: 'inch',
    secondary: 'ft',
    label: 'units.imperial',
    fromInternal: (mm) => mm / MM_PER_INCH,
    toInternal: (inches) => inches * MM_PER_INCH,
    format: (mm, decimals = 2) => {
      const inches = mm / MM_PER_INCH;
      if (inches >= 120) {
        const ft = Math.floor(inches / 12);
        const remainInches = inches % 12;
        return `${ft}' ${remainInches.toFixed(decimals)}"`;
      }
      return `${inches.toFixed(decimals)}"`;
    },
    formatPrimary: (mm, decimals = 2) => `${(mm / MM_PER_INCH).toFixed(decimals)}"`,
  },
};

class UnitSystem {
  constructor() {
    this._system = this._loadSaved();
    this._listeners = [];
  }

  /** Aktif birim sistemi kodu */
  get code() {
    return this._system;
  }

  /** Aktif birim sistemi nesnesi */
  get current() {
    return UNIT_SYSTEMS[this._system];
  }

  /** Tüm birim sistemleri */
  get available() {
    return Object.values(UNIT_SYSTEMS);
  }

  /**
   * Birim sistemi değiştir
   * @param {'metric'|'imperial'} code
   */
  setSystem(code) {
    if (!UNIT_SYSTEMS[code]) {
      console.warn(`[UnitSystem] Unknown unit system: "${code}"`);
      return;
    }
    this._system = code;
    localStorage.setItem(STORAGE_KEY, code);
    this._notify();
  }

  /**
   * Kullanıcı girişini dahili birime (mm) dönüştür
   * @param {number} value - Kullanıcının girdiği değer
   * @returns {number} mm cinsinden
   */
  toMM(value) {
    return this.current.toInternal(value);
  }

  /**
   * Dahili birimden (mm) kullanıcı birimine dönüştür
   * @param {number} mm
   * @returns {number}
   */
  fromMM(mm) {
    return this.current.fromInternal(mm);
  }

  /**
   * Değeri formatlı string olarak göster
   * @param {number} mm - Dahili değer (mm)
   * @param {number} [decimals]
   * @returns {string}
   */
  format(mm, decimals) {
    return this.current.format(mm, decimals);
  }

  /**
   * Birincil birim etiketi
   * @returns {string} 'mm' veya 'inch'
   */
  get primaryUnit() {
    return this.current.primary;
  }

  /**
   * Değişiklik dinleyici
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  onChange(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(cb => cb !== callback);
    };
  }

  _loadSaved() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return UNIT_SYSTEMS[saved] ? saved : 'metric';
  }

  _notify() {
    this._listeners.forEach(cb => cb(this._system));
  }
}

export const units = new UnitSystem();
