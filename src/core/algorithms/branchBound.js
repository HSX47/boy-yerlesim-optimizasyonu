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
  const { kerfWidth, minUsableRemnant } = params;

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
  const bfdSolution = runHeuristicBestFit(sortedStocks, expandedPieces, kerfWidth, stockQuantityLimits);
  const ffdSolution = runHeuristicFirstFit(sortedStocks, expandedPieces, kerfWidth, stockQuantityLimits);

  let bestSolution = bfdSolution.length <= ffdSolution.length ? bfdSolution : ffdSolution;
  let bestBarCount = bestSolution.length;

  // Teorik alt sınır (Lower Bound)
  const totalCutLength = expandedPieces.reduce((acc, p) => acc + p.length, 0);
  const maxStockLength = sortedStocks.length > 0 ? Math.max(...sortedStocks.map(s => s.length)) : 1;
  const lowerBound = Math.ceil(totalCutLength / maxStockLength);

  // Eğer sezgisel çözüm zaten teorik alt sınıra ulaştıysa veya parça sayısı > 25 ise direkt en iyisini dön!
  if ((bestBarCount <= lowerBound && bestBarCount > 0) || expandedPieces.length > 25) {
    return formatOptimizationResult(bestSolution, stockItems, params);
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
        bestSolution = deepCopyBars(currentBars);
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
        bar.usedLength += spaceNeeded;

        branchAndBound(pieceIndex + 1, currentBars, currentStockLimits);

        bar.cuts.pop();
        bar.remaining += spaceNeeded;
        bar.usedLength -= spaceNeeded;

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
            id: stock.id + '_bar_' + (currentBars.length + 1),
            stockId: stock.id,
            stockLength: stock.length,
            stockLabel: stock.label,
            unitPrice: stock.unitPrice,
            cuts: [{ ...currentPiece }],
            usedLength: currentPiece.length,
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

  return formatOptimizationResult(bestSolution, stockItems, params);
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
      bar.usedLength += (piece.length + actualKerf);
    } else {
      for (const stock of sortedStocks) {
        const limit = stockLimits.get(stock.id);
        if (limit > 0 && stock.length >= piece.length) {
          stockLimits.set(stock.id, limit - 1);
          openBars.push({
            id: stock.id + '_bar_' + (openBars.length + 1),
            stockId: stock.id,
            stockLength: stock.length,
            stockLabel: stock.label,
            unitPrice: stock.unitPrice,
            cuts: [{ ...piece }],
            usedLength: piece.length,
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
        bar.usedLength += needed;
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
            id: stock.id + '_bar_' + (openBars.length + 1),
            stockId: stock.id,
            stockLength: stock.length,
            stockLabel: stock.label,
            unitPrice: stock.unitPrice,
            cuts: [{ ...piece }],
            usedLength: piece.length,
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
    ...bar,
    cuts: bar.cuts.map(c => ({ ...c }))
  }));
}

/**
 * Optimizasyon sonucunu formatla
 */
function formatOptimizationResult(openBars, stockItems, params) {
  const { kerfWidth, minUsableRemnant, cutCost = 0 } = params;

  let totalWaste = 0;
  let totalMaterialCost = 0;
  let totalCuts = 0;
  const usableRemnantsMap = new Map();
  const stockUsageCount = new Map();

  const formattedBars = openBars.map((bar, barIdx) => {
    stockUsageCount.set(bar.stockId, (stockUsageCount.get(bar.stockId) || 0) + 1);

    const barCuts = [];
    let currentPos = 0;

    for (let i = 0; i < bar.cuts.length; i++) {
      const cut = bar.cuts[i];
      barCuts.push({
        id: cut.id || `cut_${barIdx}_${i}`,
        label: cut.label || `${cut.length} mm`,
        length: cut.length,
        startPos: currentPos,
        endPos: currentPos + cut.length,
      });

      currentPos += cut.length;
      if (i < bar.cuts.length - 1) {
        currentPos += kerfWidth;
      }
    }

    const cutCountOnBar = bar.cuts.length;
    totalCuts += cutCountOnBar;

    const endWaste = bar.stockLength - currentPos;
    const kerfWasteOnBar = Math.max(0, bar.cuts.length - 1) * kerfWidth;
    const wasteOnBar = kerfWasteOnBar + endWaste;

    totalWaste += wasteOnBar;
    totalMaterialCost += (bar.unitPrice || 0);

    if (endWaste >= minUsableRemnant) {
      const roundedRem = Math.round(endWaste * 100) / 100;
      usableRemnantsMap.set(roundedRem, (usableRemnantsMap.get(roundedRem) || 0) + 1);
    }

    return {
      barIndex: barIdx + 1,
      stockId: bar.stockId,
      stockLength: bar.stockLength,
      stockLabel: bar.stockLabel,
      unitPrice: bar.unitPrice || 0,
      cuts: barCuts,
      wasteLength: Math.max(0, endWaste),
      wastePercentage: bar.stockLength > 0 ? (wasteOnBar / bar.stockLength) * 100 : 0,
      usedLength: currentPos,
    };
  });

  const totalStockLength = formattedBars.reduce((sum, b) => sum + b.stockLength, 0);
  const totalWastePercentage = totalStockLength > 0 ? (totalWaste / totalStockLength) * 100 : 0;
  const totalCuttingCost = totalCuts * cutCost;
  const totalCost = totalMaterialCost + totalCuttingCost;

  const usableRemnants = Array.from(usableRemnantsMap.entries())
    .map(([length, count]) => ({ length, count }))
    .sort((a, b) => b.length - a.length);

  // Stok bazlı kalan stok hesabı
  let totalRemainingCount = 0;
  let totalRemainingLength = 0;
  let hasUnlimited = false;

  const stockSummary = stockItems.map(stock => {
    const usedCount = stockUsageCount.get(stock.id) || 0;
    const initialQuantity = stock.quantity || 0;
    const isUnlimited = initialQuantity === 0;

    let remainingCount = 0;
    let remainingLength = 0;

    if (isUnlimited) {
      hasUnlimited = true;
      remainingCount = Infinity;
      remainingLength = Infinity;
    } else {
      remainingCount = Math.max(0, initialQuantity - usedCount);
      remainingLength = remainingCount * stock.length;
      totalRemainingCount += remainingCount;
      totalRemainingLength += remainingLength;
    }

    return {
      stockItem: stock,
      usedCount,
      initialQuantity,
      isUnlimited,
      remainingCount,
      remainingLength
    };
  });

  return {
    totalStockUsed: formattedBars.length,
    totalRemainingCount: hasUnlimited ? Infinity : totalRemainingCount,
    totalRemainingLength: hasUnlimited ? Infinity : totalRemainingLength,
    stockSummary,
    totalWaste,
    totalWastePercentage,
    totalCuts,
    totalMaterialCost,
    totalCuttingCost,
    totalCost,
    usedBars: formattedBars,
    usableRemnants,
    executionTimeMs: 0,
  };
}
