/**
 * Best-Fit Decreasing (BFD) Algoritması
 * 
 * Kesim parçalarını büyükten küçüğe sıralar,
 * her parçayı EN AZ boşluk bırakan stok çubuğuna yerleştirir.
 * Genellikle FFD'den daha iyi sonuç verir.
 * 
 * Zaman Karmaşıklığı: O(n * m)
 */

/**
 * @param {object} input
 * @param {{length: number, quantity: number, unitPrice: number, label: string, id: string}[]} input.stockItems
 * @param {{length: number, quantity: number, label: string, id: string}[]} input.cutPieces
 * @param {{kerfWidth: number, minUsableRemnant: number}} input.params
 * @returns {import('../models.js').OptimizationResult}
 */
export function solveBFD({ stockItems, cutPieces, params }) {
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
  const openBars = [];

  // Her parçayı yerleştir
  for (const piece of expandedPieces) {
    let bestBarIdx = -1;
    let bestLeftover = Infinity;

    // En az boşluk bırakan çubuğu bul (Best Fit)
    for (let i = 0; i < openBars.length; i++) {
      const bar = openBars[i];
      const actualKerf = bar.cuts.length > 0 ? kerfWidth : 0;
      const needed = piece.length + actualKerf;

      if (bar.remaining >= needed) {
        const leftover = bar.remaining - needed;
        if (leftover < bestLeftover) {
          bestLeftover = leftover;
          bestBarIdx = i;
        }
      }
    }

    if (bestBarIdx >= 0) {
      // Mevcut çubuğa yerleştir
      const bar = openBars[bestBarIdx];
      const actualKerf = bar.cuts.length > 0 ? kerfWidth : 0;
      const position = bar.stockItem.length - bar.remaining + actualKerf;
      bar.cuts.push({ piece, position });
      bar.remaining -= (piece.length + actualKerf);
    } else {
      // Yeni çubuk aç — en küçük yeterli stoku bul
      let chosenStock = null;
      let bestStockLeftover = Infinity;

      for (const stock of sortedStocks) {
        if (stock.length >= piece.length && stockQuantityLeft.get(stock.id) > 0) {
          const leftover = stock.length - piece.length;
          if (leftover < bestStockLeftover) {
            bestStockLeftover = leftover;
            chosenStock = stock;
          }
        }
      }

      if (!chosenStock) {
        // En büyük stoku kullan
        for (const stock of sortedStocks) {
          if (stockQuantityLeft.get(stock.id) > 0) {
            chosenStock = stock;
            break;
          }
        }
      }

      if (chosenStock) {
        const qty = stockQuantityLeft.get(chosenStock.id);
        if (qty !== Infinity) {
          stockQuantityLeft.set(chosenStock.id, qty - 1);
        }

        openBars.push({
          stockItem: chosenStock,
          cuts: [{ piece, position: 0 }],
          remaining: chosenStock.length - piece.length,
        });
      }
    }
  }

  const placedCount = openBars.reduce((sum, bar) => sum + bar.cuts.length, 0);
  const unplacedCount = expandedPieces.length - placedCount;

  return buildResult(openBars, params, unplacedCount);
}

/**
 * Açık çubuk listesinden OptimizationResult üret
 */
function buildResult(bars, params, unplacedCount = 0) {
  const { minUsableRemnant } = params;

  const patterns = bars.map(bar => {
    const usedLength = bar.cuts.reduce((sum, c) => sum + c.piece.length, 0);
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
  const totalCost = patterns.reduce((s, p) => s + p.stockItem.unitPrice, 0);

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
    totalCost,
    usableRemnants,
    unplacedCount,
    executionTimeMs: 0,
  };
}
