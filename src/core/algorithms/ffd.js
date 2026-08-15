/**
 * First-Fit Decreasing (FFD) Algoritması
 * 
 * Kesim parçalarını büyükten küçüğe sıralar,
 * her parçayı ilk sığan stok çubuğuna yerleştirir.
 * 
 * Zaman Karmaşıklığı: O(n * m) — n: parça sayısı, m: açık çubuk sayısı
 */

/**
 * @param {object} input
 * @param {{length: number, quantity: number, unitPrice: number, label: string, id: string}[]} input.stockItems
 * @param {{length: number, quantity: number, label: string, id: string}[]} input.cutPieces
 * @param {{kerfWidth: number, minUsableRemnant: number}} input.params
 * @returns {import('../models.js').OptimizationResult}
 */
export function solveFFD({ stockItems, cutPieces, params }) {
  const { kerfWidth, minUsableRemnant } = params;

  // Tüm parçaları adetleriyle aç + büyükten küçüğe sırala
  const expandedPieces = [];
  for (const piece of cutPieces) {
    for (let i = 0; i < piece.quantity; i++) {
      expandedPieces.push({ ...piece, quantity: 1 });
    }
  }
  expandedPieces.sort((a, b) => b.length - a.length);

  // Stok boylarını büyükten küçüğe sırala
  const sortedStocks = [...stockItems].sort((a, b) => b.length - a.length);

  // Stok miktarlarını takip et
  const stockQuantityLeft = new Map();
  for (const stock of sortedStocks) {
    stockQuantityLeft.set(stock.id, stock.quantity === 0 ? Infinity : stock.quantity);
  }

  // Açık çubuklar
  /** @type {{stockItem: object, cuts: {piece: object, position: number}[], remaining: number}[]} */
  const openBars = [];

  // Her parçayı yerleştir
  for (const piece of expandedPieces) {
    let placed = false;

    // Mevcut açık çubuklarda yer ara (First Fit)
    for (const bar of openBars) {
      const needed = piece.length + kerfWidth;
      if (bar.remaining >= needed || (bar.remaining >= piece.length && bar.cuts.length === 0)) {
        const position = bar.stockItem.length - bar.remaining;
        const actualKerf = bar.cuts.length > 0 ? kerfWidth : 0;
        bar.cuts.push({ piece, position: position + actualKerf });
        bar.remaining -= (piece.length + actualKerf);
        placed = true;
        break;
      }
    }

    // Yeni çubuk aç
    if (!placed) {
      // En küçük yeterli stoku bul
      let chosenStock = null;
      for (const stock of sortedStocks) {
        if (stock.length >= piece.length && stockQuantityLeft.get(stock.id) > 0) {
          chosenStock = stock;
          break;
        }
      }

      if (!chosenStock) {
        // Hiçbir stok yeterli değil — en büyük stoku dene
        chosenStock = sortedStocks[0];
      }

      // Stok miktarını düşür
      if (chosenStock) {
        const qty = stockQuantityLeft.get(chosenStock.id);
        if (qty !== Infinity) {
          stockQuantityLeft.set(chosenStock.id, qty - 1);
        }

        const bar = {
          stockItem: chosenStock,
          cuts: [{ piece, position: 0 }],
          remaining: chosenStock.length - piece.length,
        };
        openBars.push(bar);
      }
    }
  }

  const placedCount = openBars.reduce((sum, bar) => sum + bar.cuts.length, 0);
  const unplacedCount = expandedPieces.length - placedCount;

  return buildResult(openBars, stockItems, params, unplacedCount);
}

/**
 * Açık çubuk listesinden OptimizationResult üret
 */
function buildResult(bars, stockItems, params, unplacedCount = 0) {
  const { minUsableRemnant } = params;

  const patterns = bars.map(bar => {
    const usedLength = bar.cuts.reduce((sum, c) => {
      return sum + c.piece.length;
    }, 0);
    const totalKerf = Math.max(0, bar.cuts.length - 1) * params.kerfWidth;
    const totalUsed = usedLength + totalKerf;
    const leftover = bar.stockItem.length - totalUsed;
    const usableRemnant = leftover >= minUsableRemnant ? leftover : 0;
    const wasteLength = leftover - usableRemnant;

    return {
      stockItem: bar.stockItem,
      cuts: bar.cuts,
      usedLength: totalUsed,
      wasteLength,
      usableRemnant,
      wastePercentage: (wasteLength / bar.stockItem.length) * 100,
    };
  });

  const totalStockLength = patterns.reduce((s, p) => s + p.stockItem.length, 0);
  const totalWaste = patterns.reduce((s, p) => s + p.wasteLength, 0);

  const totalMaterialCost = patterns.reduce((s, p) => s + (p.stockItem.unitPrice || 0), 0);
  const totalCuts = patterns.reduce((s, p) => s + p.cuts.length, 0);
  const cutCost = params.cutCost || 0;
  const totalCuttingCost = totalCuts * cutCost;
  const totalCost = totalMaterialCost + totalCuttingCost;

  // Stok kullanımı ve kalan stok özeti
  const usedCountMap = new Map();
  for (const p of patterns) {
    const sId = p.stockItem.id;
    usedCountMap.set(sId, (usedCountMap.get(sId) || 0) + 1);
  }

  const stockSummary = (stockItems || []).map(item => {
    const usedCount = usedCountMap.get(item.id) || 0;
    const initialQuantity = item.quantity || 0;
    const isUnlimited = initialQuantity === 0;
    const remainingCount = isUnlimited ? Infinity : Math.max(0, initialQuantity - usedCount);
    const remainingLength = isUnlimited ? Infinity : remainingCount * item.length;

    return {
      stockItem: item,
      usedCount,
      initialQuantity,
      isUnlimited,
      remainingCount,
      remainingLength,
    };
  });

  const hasUnlimitedStock = stockSummary.some(s => s.isUnlimited);
  const totalRemainingCount = hasUnlimitedStock ? Infinity : stockSummary.reduce((sum, s) => sum + s.remainingCount, 0);
  const totalRemainingLength = hasUnlimitedStock ? Infinity : stockSummary.reduce((sum, s) => sum + s.remainingLength, 0);

  // Kullanılabilir artıkları grupla
  const remnantMap = new Map();
  for (const p of patterns) {
    if (p.usableRemnant > 0) {
      const key = Math.round(p.usableRemnant);
      remnantMap.set(key, (remnantMap.get(key) || 0) + 1);
    }
  }
  const usableRemnants = Array.from(remnantMap.entries())
    .map(([length, count]) => ({ length, count }))
    .sort((a, b) => b.length - a.length);

  return {
    patterns,
    totalStockUsed: patterns.length,
    totalWaste,
    totalWastePercentage: totalStockLength > 0 ? (totalWaste / totalStockLength) * 100 : 0,
    totalMaterialCost,
    totalCuts,
    totalCuttingCost,
    totalCost,
    stockSummary,
    totalRemainingCount,
    totalRemainingLength,
    usableRemnants,
    unplacedCount,
    executionTimeMs: 0,  // Caller'da set edilecek
  };
}
