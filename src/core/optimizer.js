/**
 * Optimizasyon Motoru — Algoritma Dispatcher
 * 
 * Seçilen algoritmaya göre yönlendirme yapar, çalışma süresini ölçer.
 * İleride Web Worker'a taşınabilir.
 */

import { solveFFD } from './algorithms/ffd.js';
import { solveBFD } from './algorithms/bestFit.js';
import { solveBranchBound } from './algorithms/branchBound.js';

/**
 * Optimizasyonu çalıştır
 * @param {object} input
 * @param {import('./models.js').StockItem[]} input.stockItems
 * @param {import('./models.js').CutPiece[]} input.cutPieces
 * @param {import('./models.js').OptimizationParams} input.params
 * @returns {{ success: boolean, result?: import('./models.js').OptimizationResult, error?: string }}
 */
export function runOptimization({ stockItems, cutPieces, params }) {
  // Doğrulama
  const validation = validate(stockItems, cutPieces);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Sadece length > 0 ve quantity > 0 olanları filtrele
  const filteredCuts = cutPieces.filter(c => c.length > 0 && c.quantity > 0);
  const filteredStocks = stockItems.filter(s => s.length > 0);

  const t0 = performance.now();

  let result;
  switch (params.algorithm) {
    case 'branchBound':
      result = solveBranchBound({ stockItems: filteredStocks, cutPieces: filteredCuts, params });
      break;
    case 'ffd':
      result = solveFFD({ stockItems: filteredStocks, cutPieces: filteredCuts, params });
      break;
    case 'bfd':
    default:
      result = solveBFD({ stockItems: filteredStocks, cutPieces: filteredCuts, params });
      break;
  }

  const t1 = performance.now();
  result.executionTimeMs = Math.round(t1 - t0);

  return { success: true, result };
}

/**
 * Girdi doğrulama
 */
function validate(stockItems, cutPieces) {
  if (!stockItems || stockItems.length === 0) {
    return { valid: false, error: 'noStock' };
  }
  if (!cutPieces || cutPieces.length === 0) {
    return { valid: false, error: 'noCuts' };
  }

  const validStocks = stockItems.filter(s => s.length > 0);
  if (validStocks.length === 0) {
    return { valid: false, error: 'noStock' };
  }

  const validCuts = cutPieces.filter(c => c.length > 0 && c.quantity > 0);
  if (validCuts.length === 0) {
    return { valid: false, error: 'noCuts' };
  }

  const maxStockLength = Math.max(...validStocks.map(s => s.length));
  const oversized = validCuts.filter(c => c.length > maxStockLength);
  if (oversized.length > 0) {
    return { valid: false, error: 'cutTooLong' };
  }

  return { valid: true };
}
