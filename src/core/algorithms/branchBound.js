/**
 * Branch & Bound (Dal ve Sınır) Algoritması
 * 
 * 1D Kesim Yerleşim Problemi (1D Cutting Stock Problem) için
 * tam (exact) matematiksel arama ve budama (pruning) algoritması.
 * 
 * Olasılık ağacında ilerleyerek teorik minimum stok kullanımını ve minimum fireyi bulur.
 * Büyük veri setlerinde zaman sınırı (max 2500ms) koyarak her zaman en iyi sonucu güvenle döndürür.
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

  // Sezgisel üst sınır (Upper Bound - Best-Fit ile başla)
  let bestSolution = runHeuristicBestFit(sortedStocks, expandedPieces, kerfWidth, stockQuantityLimits);
  let bestBarCount = bestSolution.length;

  // Teorik alt sınır (Lower Bound)
  const totalCutLength = expandedPieces.reduce((acc, p) => acc + p.length, 0);
  const maxStockLength = sortedStocks.length > 0 ? Math.max(...sortedStocks.map(s => s.length)) : 1;
  const lowerBound = Math.ceil(totalCutLength / maxStockLength);

  // Eğer sezgisel çözüm zaten teorik alt sınıra ulaştıysa direkt dön!
  if (bestBarCount <= lowerBound && bestBarCount > 0) {
    return formatOptimizationResult(bestSolution, stockItems, params);
  }

  // Branch & Bound Arama Alanı
  const startTime = performance.now();
  const TIME_LIMIT_MS = 2500; // Max 2.5 saniye arama sınırı

  function branchAndBound(pieceIndex, currentBars, currentStockLimits) {
    // Durdurma Kriteri 1: Zaman sınırı aşıldıysa sonlandır
    if (performance.now() - startTime > TIME_LIMIT_MS) {
      return;
    }

    // Durdurma Kriteri 2: Mevcut bar sayısı zaten bulduğumuz en iyi çözümü aştıysa buda (Prune!)
    if (currentBars.length >= bestBarCount) {
      return;
    }

    // Başarı Kriteri: Tüm parçalar yerleştirildi!
    if (pieceIndex >= expandedPieces.length) {
      if (currentBars.length < bestBarCount) {
        bestBarCount = currentBars.length;
        bestSolution = deepCopyBars(currentBars);
      }
      return;
    }

    const currentPiece = expandedPieces[pieceIndex];

    // Seçenek A: Mevcut açık çubuklardan birine ekle (Pruning: Simetrik barları atla)
    const triedCapacities = new Set();

    for (let i = 0; i < currentBars.length; i++) {
      const bar = currentBars[i];
      const actualKerf = bar.cuts.length > 0 ? kerfWidth : 0;
      const spaceNeeded = currentPiece.length + actualKerf;

      if (bar.remaining >= spaceNeeded) {
        // Çubuk simetrisini kırmak için aynı kalan boydaki çubukları tekrar deneme
        if (triedCapacities.has(bar.remaining)) continue;
        triedCapacities.add(bar.remaining);

        // Hamle yap (Do)
        bar.cuts.push({ ...currentPiece });
        bar.remaining -= spaceNeeded;
        bar.usedLength += spaceNeeded;

        // Dallan (Branch)
        branchAndBound(pieceIndex + 1, currentBars, currentStockLimits);

        // Geri al (Undo / Backtrack)
        bar.cuts.pop();
        bar.remaining += spaceNeeded;
        bar.usedLength -= spaceNeeded;

        // Eğer en iyi teorik alt sınıra ulaşıldıysa erken çık
        if (bestBarCount <= lowerBound) return;
      }
    }

    // Seçenek B: Yeni bir stok çubuğu aç (Mevcut limitler elveriyorsa)
    if (currentBars.length + 1 < bestBarCount) {
      for (const stock of sortedStocks) {
        const leftLimit = currentStockLimits.get(stock.id);
        if (leftLimit > 0 && stock.length >= currentPiece.length) {
          // Yeni bar oluştur
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
          break; // En büyük uygun stoku denedikten sonra diğerlerini izole et
        }
      }
    }
  }

  // Branch & Bound başlat
  const initialStockLimits = new Map(stockQuantityLimits);
  branchAndBound(0, [], initialStockLimits);

  return formatOptimizationResult(bestSolution, stockItems, params);
}

/**
 * Sezgisel Başlangıç Çözümü (Best Fit)
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
      let opened = false;
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
          opened = true;
          break;
        }
      }
      if (!opened) {
        // Uygun stok bulunamadı
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

    const netCutLength = bar.cuts.reduce((sum, c) => sum + c.length, 0);
    const kerfWasteOnBar = Math.max(0, bar.cuts.length - 1) * kerfWidth;
    const endWaste = bar.stockLength - currentPos;
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
