/**
 * Veri modelleri ve fabrika fonksiyonları
 * 
 * Tüm uzunluklar dahili olarak mm cinsinden saklanır.
 */

let _idCounter = 0;

/** Benzersiz ID üret */
export function generateId() {
  return `id_${Date.now()}_${++_idCounter}`;
}

/**
 * Stok malzeme oluştur
 * @param {Partial<StockItem>} [overrides]
 * @returns {StockItem}
 */
export function createStockItem(overrides = {}) {
  return {
    id: generateId(),
    length: 6000,         // mm (varsayılan 6m)
    quantity: 0,          // 0 = sınırsız
    unitPrice: 0,
    label: '',
    ...overrides,
  };
}

/**
 * Kesim parçası oluştur
 * @param {Partial<CutPiece>} [overrides]
 * @returns {CutPiece}
 */
export function createCutPiece(overrides = {}) {
  return {
    id: generateId(),
    length: 0,            // mm
    quantity: 1,
    label: '',
    ...overrides,
  };
}

/**
 * Optimizasyon parametreleri oluştur
 * @param {Partial<OptimizationParams>} [overrides]
 * @returns {OptimizationParams}
 */
export function createOptimizationParams(overrides = {}) {
  return {
    kerfWidth: 3,          // mm (testere payı)
    minUsableRemnant: 200, // mm
    cutCost: 0,            // Kesim başı maliyet
    algorithm: 'bfd',      // 'ffd' | 'bfd' | 'branchBound'
    ...overrides,
  };
}

/**
 * Proje oluştur
 * @param {Partial<Project>} [overrides]
 * @returns {Project}
 */
export function createProject(overrides = {}) {
  return {
    id: generateId(),
    name: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stockItems: [],
    cutPieces: [],
    params: createOptimizationParams(),
    lastResult: null,
    ...overrides,
  };
}

/* ── Type Definitions (JSDoc) ──────────────────────────────── */

/**
 * @typedef {Object} StockItem
 * @property {string} id
 * @property {number} length - mm
 * @property {number} quantity - 0 = sınırsız
 * @property {number} unitPrice
 * @property {string} label
 */

/**
 * @typedef {Object} CutPiece
 * @property {string} id
 * @property {number} length - mm
 * @property {number} quantity
 * @property {string} label
 */

/**
 * @typedef {Object} OptimizationParams
 * @property {number} kerfWidth - mm
 * @property {number} minUsableRemnant - mm
 * @property {'ffd'|'bfd'|'branchBound'} algorithm
 */

/**
 * @typedef {Object} CuttingPattern
 * @property {StockItem} stockItem
 * @property {{piece: CutPiece, position: number}[]} cuts
 * @property {number} usedLength - mm
 * @property {number} wasteLength - mm
 * @property {number} usableRemnant - mm
 * @property {number} wastePercentage
 */

/**
 * @typedef {Object} OptimizationResult
 * @property {CuttingPattern[]} patterns
 * @property {number} totalStockUsed
 * @property {number} totalWaste - mm
 * @property {number} totalWastePercentage
 * @property {number} totalCost
 * @property {{length: number, count: number}[]} usableRemnants
 * @property {number} executionTimeMs
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {StockItem[]} stockItems
 * @property {CutPiece[]} cutPieces
 * @property {OptimizationParams} params
 * @property {OptimizationResult|null} lastResult
 */
