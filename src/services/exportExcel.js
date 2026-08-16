/**
 * Excel Dışa Aktarım — SheetJS (xlsx) ile kesim planı raporu
 */

import * as XLSX from 'xlsx';
import { i18n } from '../i18n/index.js';
import { units } from '../core/units.js';

/**
 * Optimizasyon sonucunu Excel olarak indir
 * @param {import('../core/models.js').OptimizationResult} result
 * @param {import('../core/models.js').StockItem[]} stockItems
 * @param {import('../core/models.js').CutPiece[]} cutPieces
 * @param {import('../core/models.js').OptimizationParams} params
 */
export function exportExcel(result, stockItems, cutPieces, params) {
  const t = (key, p) => i18n.t(key, p);
  const unitLabel = units.primaryUnit;
  const wb = XLSX.utils.book_new();

  const remStockVal = result.totalRemainingCount === Infinity ? t('stock.unlimited') : `${result.totalRemainingCount} ${t('results.pieces')}`;

  // ── Sayfa 1: Özet ──
  const summaryData = [
    [t('app.title'), '', '', t('results.cuttingPlan')],
    [],
    [t('results.summary')],
    [t('results.totalStock'), result.totalStockUsed, t('results.pieces')],
    [t('results.remainingStock'), remStockVal],
    [t('results.totalCuts'), result.totalCuts || 0, t('results.pieces')],
    [t('results.wastePercentage'), `%${result.totalWastePercentage.toFixed(1)}`],
    [t('results.totalWaste'), units.fromMM(result.totalWaste), unitLabel],
    [t('results.totalCost'), result.totalCost > 0 ? result.totalCost.toFixed(2) : '—', result.totalCost > 0 ? t('common.currency') : ''],
    [t('results.materialCost'), result.totalMaterialCost ? result.totalMaterialCost.toFixed(2) : '0.00', t('common.currency')],
    [t('results.cuttingCost'), result.totalCuttingCost ? result.totalCuttingCost.toFixed(2) : '0.00', t('common.currency')],
    [t('results.executionTime'), `${result.executionTimeMs}ms`],
    [],
    [t('params.title')],
    [t('params.kerfWidth'), units.fromMM(params.kerfWidth), unitLabel],
    [t('params.minRemnant'), units.fromMM(params.minUsableRemnant), unitLabel],
    [t('params.cutCost'), params.cutCost || 0, t('common.currency')],
    [t('params.algorithm'), params.algorithm === 'branchBound' ? t('params.algorithmBB') : params.algorithm === 'bfd' ? t('params.algorithmBFD') : t('params.algorithmFFD')],
  ];

  // Stok kullanım ve artan stok detay tablosu
  if (result.stockSummary && result.stockSummary.length > 0) {
    summaryData.push([]);
    summaryData.push([t('results.stockUsageBreakdown')]);
    summaryData.push([t('stock.label'), `${t('stock.length')} (${unitLabel})`, 'Kullanılan Adet', t('results.remainingStock')]);
    for (const s of result.stockSummary) {
      const remText = s.isUnlimited ? t('stock.unlimited') : `${s.remainingCount} ${t('results.pieces')} (${units.fromMM(s.remainingLength)} ${unitLabel})`;
      summaryData.push([
        s.stockItem.label || units.format(s.stockItem.length),
        units.fromMM(s.stockItem.length),
        `${s.usedCount} / ${s.isUnlimited ? '∞' : s.initialQuantity}`,
        remText
      ]);
    }
  }

  // Kullanılabilir artıklar
  if (result.usableRemnants.length > 0) {
    summaryData.push([]);
    summaryData.push([t('results.usableRemnants')]);
    for (const r of result.usableRemnants) {
      summaryData.push([units.format(r.length), `× ${r.count}`]);
    }
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

  // Sütun genişlikleri
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 15 }, { wch: 10 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(wb, wsSummary, t('results.summary'));

  // ── Sayfa 2: Kesim Planı Detayları ──
  const planHeader = [
    t('results.stockBar'),
    `${t('stock.label')}`,
    `${t('stock.length')} (${unitLabel})`,
    `${t('cuts.label')}`,
    `${t('cuts.length')} (${unitLabel})`,
    `${t('results.waste')} (${unitLabel})`,
    `${t('results.wastePercentage')}`,
    `${t('results.remnant')} (${unitLabel})`,
  ];

  const planRows = [planHeader];

  for (const [pIdx, pattern] of result.patterns.entries()) {
    for (const [cIdx, cut] of pattern.cuts.entries()) {
      planRows.push([
        cIdx === 0 ? `#${pIdx + 1}` : '',
        cIdx === 0 ? (pattern.stockItem.label || '') : '',
        cIdx === 0 ? units.fromMM(pattern.stockItem.length) : '',
        cut.piece.label || '',
        units.fromMM(cut.piece.length),
        cIdx === 0 ? units.fromMM(pattern.wasteLength) : '',
        cIdx === 0 ? `%${pattern.wastePercentage.toFixed(1)}` : '',
        cIdx === 0 && pattern.usableRemnant > 0 ? units.fromMM(pattern.usableRemnant) : '',
      ]);
    }
    // Boş satır ayracı
    planRows.push([]);
  }

  const wsPlan = XLSX.utils.aoa_to_sheet(planRows);

  wsPlan['!cols'] = [
    { wch: 8 }, { wch: 18 }, { wch: 14 },
    { wch: 18 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, wsPlan, t('results.cuttingPlan'));

  // ── Sayfa 3: Girdi Verileri ──
  const stockHeader = [t('stock.title')];
  const stockRows = [
    stockHeader,
    [t('stock.label'), `${t('stock.length')} (${unitLabel})`, t('stock.quantity'), t('stock.unitPrice')],
  ];
  for (const s of stockItems) {
    stockRows.push([s.label, units.fromMM(s.length), s.quantity === 0 ? '∞' : s.quantity, s.unitPrice]);
  }

  stockRows.push([]);
  stockRows.push([t('cuts.title')]);
  stockRows.push([t('cuts.label'), `${t('cuts.length')} (${unitLabel})`, t('cuts.quantity')]);
  for (const c of cutPieces) {
    stockRows.push([c.label, units.fromMM(c.length), c.quantity]);
  }

  const wsInput = XLSX.utils.aoa_to_sheet(stockRows);
  wsInput['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 12 }];

  XLSX.utils.book_append_sheet(wb, wsInput, i18n.locale === 'tr' ? 'Girdi Verileri' : 'Input Data');

  // İndir
  const filename = `kesim-plani_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
