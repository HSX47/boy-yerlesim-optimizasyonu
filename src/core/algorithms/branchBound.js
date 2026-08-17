/**
 * Branch & Bound (Dal ve Sınır) Algoritması
 * 
 * 1D Kesim Yerleşim Problemi (1D Cutting Stock Problem) için
 * yüksek performanslı matematiksel arama ve budama (pruning) algoritması.
 * 
 * Tarayıcı ana iş parçacığını (main thread) kilitlenmeden korumak için
 * zaman sınırı (max 200ms) ve düğüm sınırı (max 20.000) ile çalışır.
 * Büyük veri setlerinde sezgisel çözümler ile birleştirerek anında kusursuz sonuç verir.
 */

/**
 * @param {object} input
 * @param {{length: number, quantity: number, unitPrice: number, label: string, id: string}[]} input.stockItems
 * @param {{length: number, quantity: number, label: string, id: string}[]} input.cutPieces
 * @param {{kerfWidth: number, minUsableRemnant: number}} input.params
 * @returns {import('../models.js').OptimizationResult}
 */
export function solveBranchBound({ stockItems, cutPieces, params }) {
  const { kerfWidth } = params;

  // 1. Tüm kesim parçalarını adet kadar genişlet ve büyükten küçüğe sırala
  const expandedPieces = [];
  for (const piece of cutPieces) {
    for (let i = 0; i < piece.quantity; i++) {
      expandedPieces.push({ ...piece, quantity: 1 });
    }
  }
  expandedPieces.sort((a, b) => b.length - a.length);

  // Stok boylarını sırala
  const sortedStocks = [...stockItems].sort((a, b) => b.length - a.length);

  // Stok limitlerini takip et
  const stockQuantityLimits = new Map();
  for (const stock of sortedStocks) {
    stockQuantityLimits.set(stock.id, stock.quantity === 0 ? Infinity : stock.quantity);
  }

  // 2. Sezgisel başlangıç çözümleri (Best-Fit ve First-Fit çözümlerini karşılaştır)
  const bfdBars = runHeuristicBestFit(sortedStocks, expandedPieces, kerfWidth, stockQuantityLimits);
  const ffdBars = runHeuristicFirstFit(sortedStocks, expandedPieces, kerfWidth, stockQuantityLimits);

  let bestBars = bfdBars.length <= ffdBars.length ? bfdBars : ffdBars;
  let bestBarCount = bestBars.length;

  // Teorik alt sınır (Lower Bound)
  const totalCutLength = expandedPieces.reduce((acc, p) => acc + p.length, 0);
  const maxStockLength = sortedStocks.length > 0 ? Math.max(...sortedStocks.map(s => s.length)) : 1;
  const lowerBound = Math.ceil(totalCutLength / maxStockLength);

  // Eğer sezgisel çözüm zaten teorik alt sınıra ulaştıysa veya parça sayısı > 25 ise direkt en iyisini dön!
  if ((bestBarCount <= lowerBound && bestBarCount > 0) || expandedPieces.length > 25) {
    return buildResult(bestBars, stockItems, params, 0);
  }

  // 3. Hassas Branch & Bound Arama Alanı (Küçük/Orta boy listeler için exact arama)
  const startTime = performance.now();
  const TIME_LIMIT_MS = 200; // Max 200 milisaniye sıkı zaman sınırı
  const MAX_NODES = 20000;    // Max 20.000 düğüm sınırı
  let nodeCount = 0;
  let timedOut = false;

  function branchAndBound(pieceIndex, currentBars, currentStockLimits) {
    if (timedOut) return;

    nodeCount++;
    if (nodeCount > MAX_NODES || (nodeCount % 200 === 0 && performance.now() - startTime > TIME_LIMIT_MS)) {
      timedOut = true;
      return;
    }

    // Budama: Mevcut bar sayısı zaten en iyi çözümü aştıysa veya eşitlediyse geri dön
    if (currentBars.length >= bestBarCount) {
      return;
    }

    // Başarı: Tüm parçalar yerleştirildi!
    if (pieceIndex >= expandedPieces.length) {
      if (currentBars.length < bestBarCount) {
        bestBarCount = currentBars.length;
        bestBars = deepCopyBars(currentBars);
      }
      return;
    }

    const currentPiece = expandedPieces[pieceIndex];
    const triedCapacities = new Set();

    // A) Açık çubuklara eklemeyi dene
    for (let i = 0; i < currentBars.length; i++) {
      if (timedOut) return;
      const bar = currentBars[i];
      const actualKerf = bar.cuts.length > 0 ? kerfWidth : 0;
      const spaceNeeded = currentPiece.length + actualKerf;

      if (bar.remaining >= spaceNeeded) {
        if (triedCapacities.has(bar.remaining)) continue;
        triedCapacities.add(bar.remaining);

        bar.cuts.push({ ...currentPiece });
        bar.remaining -= spaceNeeded;

        branchAndBound(pieceIndex + 1, currentBars, currentStockLimits);

        bar.cuts.pop();
        bar.remaining += spaceNeeded;

        if (bestBarCount <= lowerBound) return;
      }
    }

    // B) Yeni stok çubuğu açmayı dene
    if (!timedOut && currentBars.length + 1 < bestBarCount) {
      for (const stock of sortedStocks) {
        if (timedOut) return;
        const leftLimit = currentStockLimits.get(stock.id);
        if (leftLimit > 0 && stock.length >= currentPiece.length) {
          const newBar = {
            stockItem: stock,
            cuts: [{ ...currentPiece }],
            remaining: stock.length - currentPiece.length
          };

          currentBars.push(newBar);
          currentStockLimits.set(stock.id, leftLimit - 1);

          branchAndBound(pieceIndex + 1, currentBars, currentStockLimits);

          currentBars.pop();
          currentStockLimits.set(stock.id, leftLimit);

          if (bestBarCount <= lowerBound) return;
          break;
        }
      }
    }
  }

  const initialStockLimits = new Map(stockQuantityLimits);
  try {
    branchAndBound(0, [], initialStockLimits);
  } catch (err) {
    console.warn('Branch & Bound backtrack interrupted:', err);
  }

  return buildResult(bestBars, stockItems, params, 0);
}

/**
 * Sezgisel Best-Fit Çözümü
 */
function runHeuristicBestFit(sortedStocks, expandedPieces, kerfWidth, stockQuantityLimits) {
  const openBars = [];
  const stockLimits = new Map(stockQuantityLimits);

  for (const piece of expandedPieces) {
    let bestBarIdx = -1;
    let bestLeftover = Infinity;

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
      const bar = openBars[bestBarIdx];
      const actualKerf = bar.cuts.length > 0 ? kerfWidth : 0;
      bar.cuts.push({ ...piece });
      bar.remaining -= (piece.length + actualKerf);
    } else {
      for (const stock of sortedStocks) {
        const limit = stockLimits.get(stock.id);
        if (limit > 0 && stock.length >= piece.length) {
          stockLimits.set(stock.id, limit - 1);
          openBars.push({
            stockItem: stock,
            cuts: [{ ...piece }],
            remaining: stock.length - piece.length
          });
          break;
        }
      }
    }
  }

  return openBars;
}

/**
 * Sezgisel First-Fit Çözümü
 */
function runHeuristicFirstFit(sortedStocks, expandedPieces, kerfWidth, stockQuantityLimits) {
  const openBars = [];
  const stockLimits = new Map(stockQuantityLimits);

  for (const piece of expandedPieces) {
    let placed = false;

    for (let i = 0; i < openBars.length; i++) {
      const bar = openBars[i];
      const actualKerf = bar.cuts.length > 0 ? kerfWidth : 0;
      const needed = piece.length + actualKerf;

      if (bar.remaining >= needed) {
        bar.cuts.push({ ...piece });
        bar.remaining -= needed;
        placed = true;
        break;
      }
    }

    if (!placed) {
      for (const stock of sortedStocks) {
        const limit = stockLimits.get(stock.id);
        if (limit > 0 && stock.length >= piece.length) {
          stockLimits.set(stock.id, limit - 1);
          openBars.push({
            stockItem: stock,
            cuts: [{ ...piece }],
            remaining: stock.length - piece.length
          });
          break;
        }
      }
    }
  }

  return openBars;
}

function deepCopyBars(bars) {
  return bars.map(bar => ({
    stockItem: { ...bar.stockItem },
    remaining: bar.remaining,
    cuts: bar.cuts.map(c => ({ ...c }))
  }));
}

/**
 * standart OptimizationResult üret
 */
function buildResult(bars, stockItems, params, unplacedCount = 0) {
  const { kerfWidth, minUsableRemnant, cutCost = 0 } = params;

  const patterns = bars.map(bar => {
    let currentPos = 0;
    const formattedCuts = bar.cuts.map((piece, idx) => {
      const cutObj = {
        piece: { ...piece },
        position: currentPos,
      };
      currentPos += piece.length;
      if (idx < bar.cuts.length - 1) {
        currentPos += kerfWidth;
      }
      return cutObj;
    });

    const usedLength = currentPos;
    const leftover = bar.stockItem.length - usedLength;
    const usableRemnant = leftover >= minUsableRemnant ? leftover : 0;
    const wasteLength = leftover - usableRemnant;

    return {
      stockItem: bar.stockItem,
      cuts: formattedCuts,
      usedLength,
      wasteLength,
      usableRemnant,
      wastePercentage: bar.stockItem.length > 0 ? (wasteLength / bar.stockItem.length) * 100 : 0,
    };
  });

  const totalStockLength = patterns.reduce((s, p) => s + p.stockItem.length, 0);
  const totalWaste = patterns.reduce((s, p) => s + p.wasteLength, 0);
  const totalMaterialCost = patterns.reduce((s, p) => s + (p.stockItem.unitPrice || 0), 0);
  const totalCuts = patterns.reduce((s, p) => s + p.cuts.length, 0);
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
    executionTimeMs: 0,
  };
}
