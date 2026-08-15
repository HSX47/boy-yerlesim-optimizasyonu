/**
 * PDF Dışa Aktarım — jsPDF ile kesim planı raporu
 * 
 * DİKEY (portrait) A4 sayfa.
 * Her çubuk için 2 SÜTUNLU (Side-by-Side) kompakt kart düzeni.
 * Sol ve sağ sütunlarda renkli ince kesim diyagramı + dar detay tablosu.
 * Sayfa genişliği tam doldurulur, tablodaki gereksiz yatay boşluklar giderilir.
 * Inter Türkçe TTF fontu entegre edilmiştir.
 */

import { jsPDF } from 'jspdf';
import { i18n } from '../i18n/index.js';
import { units } from '../core/units.js';
import { PDF_FONT, registerPdfFont } from './fontLoader.js';

// RGB renk paleti
const PALETTE = [
  [99, 102, 241],   // Indigo
  [16, 185, 129],   // Emerald
  [168, 85, 247],   // Purple
  [245, 158, 11],   // Amber
  [6, 182, 212],    // Cyan
  [236, 72, 153],   // Pink
  [132, 204, 22],   // Lime
  [249, 115, 22],   // Orange
  [59, 130, 246],   // Blue
  [239, 68, 68],    // Rose
  [34, 197, 94],    // Green
  [234, 179, 8],    // Gold
];

const WASTE_RGB = [180, 60, 60];
const REMNANT_RGB = [16, 185, 129];

/**
 * @param {import('../core/models.js').OptimizationResult} result
 * @param {import('../core/models.js').StockItem[]} stockItems
 * @param {import('../core/models.js').CutPiece[]} cutPieces
 * @param {import('../core/models.js').OptimizationParams} params
 */
export async function exportPdf(result, stockItems, cutPieces, params) {
  const t = (key, p) => i18n.t(key, p);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  // Türkçe fontu yükle ve kaydet
  await registerPdfFont(doc);

  const pageW = doc.internal.pageSize.getWidth();   // 210
  const pageH = doc.internal.pageSize.getHeight();   // 297
  const margin = 10;
  const contentW = pageW - margin * 2;              // 190
  const footerMargin = 10;
  let y = 0;

  // ── Renk haritası oluştur ──
  const colorMap = new Map();
  let colorIdx = 0;
  for (const pattern of result.patterns) {
    for (const cut of pattern.cuts) {
      const key = cut.piece.label || `${cut.piece.length}`;
      if (!colorMap.has(key)) {
        colorMap.set(key, colorIdx);
        colorIdx++;
      }
    }
  }
  const colorKeys = [...colorMap.keys()];

  // ═══════════════════════════════════════════════════════════
  // BAŞLIK BANDI
  // ═══════════════════════════════════════════════════════════
  doc.setFillColor(55, 48, 163);
  doc.rect(0, 0, pageW, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont(PDF_FONT, 'bold');
  doc.text(`${t('app.title')} — ${t('results.cuttingPlan')}`, margin, 11);
  doc.setFontSize(8.5);
  doc.setFont(PDF_FONT, 'normal');
  const dateStr = new Date().toLocaleDateString(i18n.locale === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  doc.text(dateStr, pageW - margin, 11, { align: 'right' });

  y = 21;

  const hasCost = (result.totalCost && result.totalCost > 0) || (params.cutCost && params.cutCost > 0);
  const boxHeight = hasCost ? 24 : 18;

  doc.setFillColor(245, 245, 252);
  doc.setDrawColor(200, 200, 220);
  doc.roundedRect(margin, y, contentW, boxHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(7.5);
  doc.setFont(PDF_FONT, 'bold');

  const remStockStr = result.totalRemainingCount === Infinity ? t('stock.unlimited') : `${result.totalRemainingCount} ${t('results.pieces')} (${units.format(result.totalRemainingLength)})`;

  // Satır 1: Kullanılan Stok ve Artan Stok
  const row1 = [
    `${t('results.totalStock')}: ${result.totalStockUsed} ${t('results.pieces')}`,
    `${t('results.remainingStock')}: ${remStockStr}`,
  ];
  const row1ColW = contentW / row1.length;
  row1.forEach((text, idx) => {
    doc.text(text, margin + row1ColW * idx + row1ColW / 2, y + 6, { align: 'center' });
  });

  // Satır 2: Toplam Fire ve Fire Oranı
  const row2 = [
    `${t('results.totalWaste')}: ${units.format(result.totalWaste)} (%${result.totalWastePercentage.toFixed(1)})`,
    `${t('params.kerfWidth')}: ${units.format(params.kerfWidth)}`,
  ];
  const row2ColW = contentW / row2.length;
  row2.forEach((text, idx) => {
    doc.text(text, margin + row2ColW * idx + row2ColW / 2, y + (hasCost ? 12 : 13), { align: 'center' });
  });

  // Satır 3: Maliyet Detayı (varsa)
  if (hasCost) {
    const currency = t('common.currency');
    const row3 = [
      `${t('results.totalCuts')}: ${result.totalCuts || 0} ${t('results.pieces')}`,
      `${t('results.totalCost')}: ${result.totalCost.toFixed(2)} ${currency} (${t('results.materialCost')}: ${result.totalMaterialCost.toFixed(2)} | ${t('results.cuttingCost')}: ${result.totalCuttingCost.toFixed(2)})`,
    ];
    const row3ColW = contentW / row3.length;
    row3.forEach((text, idx) => {
      doc.text(text, margin + row3ColW * idx + row3ColW / 2, y + 18, { align: 'center' });
    });
  }

  y += boxHeight + 4;

  // ═══════════════════════════════════════════════════════════
  // LEJANT (Renk → Parça Eşleştirmesi)
  // ═══════════════════════════════════════════════════════════
  doc.setFontSize(7.5);
  doc.setFont(PDF_FONT, 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text(i18n.locale === 'tr' ? 'Parça Renkleri:' : 'Part Colors:', margin, y);
  y += 3.5;

  const legendColW = 42;
  const legendCols = Math.floor(contentW / legendColW);
  let legendX = margin;
  let legendRow = 0;

  colorKeys.forEach((key, idx) => {
    const col = idx % legendCols;
    if (idx > 0 && col === 0) {
      legendRow++;
    }
    legendX = margin + col * legendColW;
    const ly = y + legendRow * 4.5;

    const rgb = PALETTE[colorMap.get(key) % PALETTE.length];
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(legendX, ly - 2.2, 3.5, 2.8, 'F');

    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(6);
    doc.setTextColor(50, 50, 50);
    const label = key.length > 18 ? key.substring(0, 17) + '…' : key;
    doc.text(`${label} (${units.format(findLength(key, result))})`, legendX + 4.8, ly);
  });

  // Artık ve fire lejantı
  legendRow++;
  const fireX = margin;
  const fireLy = y + legendRow * 4.5;

  // Fire
  doc.setFillColor(WASTE_RGB[0], WASTE_RGB[1], WASTE_RGB[2]);
  doc.rect(fireX, fireLy - 2.2, 3.5, 2.8, 'F');
  doc.setTextColor(180, 60, 60);
  doc.setFontSize(6);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(t('results.waste'), fireX + 4.8, fireLy);

  // Artık
  const remX = fireX + legendColW;
  doc.setFillColor(REMNANT_RGB[0], REMNANT_RGB[1], REMNANT_RGB[2]);
  doc.rect(remX, fireLy - 2.2, 3.5, 2.8, 'F');
  doc.setTextColor(16, 130, 90);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(i18n.locale === 'tr' ? 'Kul. Artık' : 'Remnant', remX + 4.8, fireLy);

  y += (legendRow + 1) * 4.5 + 3;

  // ═══════════════════════════════════════════════════════════
  // KESİM PLANI (2 SÜTUNLU KART DÜZENİ)
  // ═══════════════════════════════════════════════════════════
  doc.setFontSize(8.5);
  doc.setFont(PDF_FONT, 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(t('results.cuttingPlan'), margin, y);
  y += 4.5;

  const unitLabel = units.primaryUnit;
  const colGap = 8;
  const cardW = Math.floor((contentW - colGap) / 2); // (190 - 8) / 2 = 91mm
  const rowH = 4.2;
  const headerH = 4.8;
  const barHeight = 4.2;

  // Sütun genişlikleri (91mm içinde)
  const cols = [
    { label: i18n.locale === 'tr' ? 'Parça Adı' : 'Part Name', w: 36 },
    { label: `${i18n.locale === 'tr' ? 'Boy' : 'Length'} (${unitLabel})`, w: 35 },
    { label: i18n.locale === 'tr' ? 'Adet' : 'Qty', w: 20 },
  ];

  // Parçaları gruplama yardımcısı
  const getGroupedParts = (pattern) => {
    const partGroups = new Map();
    for (const cut of pattern.cuts) {
      const key = (cut.piece.label || '') + '|' + cut.piece.length;
      if (partGroups.has(key)) {
        partGroups.get(key).count++;
      } else {
        partGroups.set(key, {
          label: cut.piece.label || '',
          length: cut.piece.length,
          count: 1,
        });
      }
    }
    return [...partGroups.values()];
  };

  // Kart Yüksekliği Hesaplama
  const getCardHeight = (pattern) => {
    const parts = getGroupedParts(pattern);
    const extraRows = (pattern.wasteLength > 0 ? 1 : 0) + (pattern.usableRemnant > 0 ? 1 : 0);
    return 5.2 + (barHeight + 1.2) + headerH + (parts.length + extraRows) * rowH + 2.5;
  };

  // Tek Bir Çubuk Kartını Çizme Fonksiyonu
  const drawCard = (pattern, barIndex, startX, startY) => {
    let curY = startY;
    const parts = getGroupedParts(pattern);

    // 1. Çubuk Başlığı (91mm genişlik)
    const barLabel = pattern.stockItem.label || units.format(pattern.stockItem.length);
    const barTitle = `${barIndex}. ${t('results.stockBar')} (${barLabel})`;

    doc.setFillColor(55, 48, 163);
    doc.roundedRect(startX, curY, cardW, 5.2, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setFont(PDF_FONT, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(barTitle, startX + 2, curY + 3.6);

    // Fire yüzdesi sağda
    const wp = pattern.wastePercentage;
    const wasteLabel = `%${wp.toFixed(1)}`;
    doc.text(wasteLabel, startX + cardW - 2, curY + 3.6, { align: 'right' });

    curY += 6.0;

    // 2. Görsel Kesim Barı (91mm genişlik, 4.2mm yükseklik)
    const scale = cardW / pattern.stockItem.length;

    // Arka plan
    doc.setFillColor(225, 225, 230);
    doc.setDrawColor(190, 190, 200);
    doc.rect(startX, curY, cardW, barHeight, 'FD');

    // Parçaları çiz
    for (const cut of pattern.cuts) {
      const x = startX + cut.position * scale;
      const w = Math.max(0.3, cut.piece.length * scale);
      const key = cut.piece.label || `${cut.piece.length}`;
      const cIdx = colorMap.get(key) % PALETTE.length;
      const rgb = PALETTE[cIdx];

      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.rect(x, curY, w, barHeight, 'F');

      if (w > 6) {
        doc.setFontSize(3.8);
        doc.setFont(PDF_FONT, 'bold');
        doc.setTextColor(255, 255, 255);
        const maxChars = Math.floor(w / 1.6);
        const label = key.length > maxChars ? key.substring(0, Math.max(1, maxChars - 1)) + '…' : key;
        doc.text(label, x + w / 2, curY + barHeight / 2 + 0.6, { align: 'center' });
      }
    }

    // Fire bölgesi
    if (pattern.wasteLength > 0) {
      const pos = pattern.usedLength;
      const x = startX + pos * scale;
      const w = Math.max(0.3, pattern.wasteLength * scale);
      doc.setFillColor(WASTE_RGB[0], WASTE_RGB[1], WASTE_RGB[2]);
      doc.rect(x, curY, w, barHeight, 'F');
    }

    // Kullanılabilir artık bölgesi
    if (pattern.usableRemnant > 0) {
      const pos = pattern.stockItem.length - pattern.usableRemnant;
      const x = startX + pos * scale;
      const w = Math.max(0.4, pattern.usableRemnant * scale);
      doc.setFillColor(REMNANT_RGB[0], REMNANT_RGB[1], REMNANT_RGB[2]);
      doc.rect(x, curY, w, barHeight, 'F');

      if (w > 8) {
        doc.setFontSize(3.5);
        doc.setFont(PDF_FONT, 'normal');
        doc.setTextColor(255, 255, 255);
        doc.text(`${units.format(pattern.usableRemnant, 0)}`, x + w / 2, curY + barHeight / 2 + 0.6, { align: 'center' });
      }
    }

    curY += barHeight + 1.2;

    // 3. Detay Tablosu (Dar 91mm)
    doc.setFillColor(235, 235, 245);
    doc.setDrawColor(200, 200, 215);
    let xPos = startX;
    for (const col of cols) {
      doc.rect(xPos, curY, col.w, headerH, 'FD');
      xPos += col.w;
    }

    doc.setFontSize(5.8);
    doc.setFont(PDF_FONT, 'bold');
    doc.setTextColor(60, 60, 60);
    xPos = startX;
    for (const col of cols) {
      doc.text(col.label, xPos + 2, curY + 3.3);
      xPos += col.w;
    }
    curY += headerH;

    // Parça Satırları
    for (const [rIdx, part] of parts.entries()) {
      const isEven = rIdx % 2 === 0;
      doc.setFillColor(isEven ? 250 : 255, isEven ? 250 : 255, isEven ? 255 : 255);
      doc.setDrawColor(220, 220, 230);

      xPos = startX;
      for (const col of cols) {
        doc.rect(xPos, curY, col.w, rowH, 'FD');
        xPos += col.w;
      }

      doc.setFontSize(5.8);
      doc.setFont(PDF_FONT, 'normal');
      doc.setTextColor(40, 40, 40);

      xPos = startX;

      // İsim
      const displayName = part.label || (i18n.locale === 'tr' ? 'Parça' : 'Part');
      const truncatedName = displayName.length > 15 ? displayName.substring(0, 14) + '…' : displayName;
      doc.text(truncatedName, xPos + 2, curY + 3.0);
      xPos += cols[0].w;

      // Boy
      doc.text(`${units.fromMM(part.length)}`, xPos + 2, curY + 3.0);
      xPos += cols[1].w;

      // Adet
      doc.setFont(PDF_FONT, 'bold');
      doc.text(`${part.count}`, xPos + 2, curY + 3.0);

      curY += rowH;
    }

    // Fire Satırı
    if (pattern.wasteLength > 0) {
      doc.setFillColor(255, 240, 240);
      doc.setDrawColor(220, 200, 200);
      xPos = startX;
      for (const col of cols) {
        doc.rect(xPos, curY, col.w, rowH, 'FD');
        xPos += col.w;
      }

      doc.setFontSize(5.8);
      doc.setFont(PDF_FONT, 'bold');
      doc.setTextColor(180, 50, 50);
      doc.text(t('results.waste'), startX + 2, curY + 3.0);
      doc.text(`${units.fromMM(pattern.wasteLength)}`, startX + cols[0].w + 2, curY + 3.0);
      doc.text(`%${pattern.wastePercentage.toFixed(1)}`, startX + cols[0].w + cols[1].w + 2, curY + 3.0);
      curY += rowH;
    }

    // Kullanılabilir Artık Satırı
    if (pattern.usableRemnant > 0) {
      doc.setFillColor(235, 255, 245);
      doc.setDrawColor(180, 220, 200);
      xPos = startX;
      for (const col of cols) {
        doc.rect(xPos, curY, col.w, rowH, 'FD');
        xPos += col.w;
      }

      doc.setFontSize(5.8);
      doc.setFont(PDF_FONT, 'bold');
      doc.setTextColor(16, 130, 90);
      doc.text(i18n.locale === 'tr' ? 'Kul. Artık' : 'Remnant', startX + 2, curY + 3.0);
      doc.text(`${units.fromMM(pattern.usableRemnant)}`, startX + cols[0].w + 2, curY + 3.0);
      curY += rowH;
    }
  };

  // ── 2 Sütunlu İkili Döngü (Sol & Sağ Kartlar) ──
  const patterns = result.patterns;
  for (let i = 0; i < patterns.length; i += 2) {
    const leftPattern = patterns[i];
    const rightPattern = patterns[i + 1] || null;

    const leftH = getCardHeight(leftPattern);
    const rightH = rightPattern ? getCardHeight(rightPattern) : 0;
    const rowMaxH = Math.max(leftH, rightH);

    // Sayfa Taşma Kontrolü
    if (y + rowMaxH > pageH - footerMargin) {
      addFooter(doc, pageW, pageH, margin, t);
      doc.addPage();
      await registerPdfFont(doc);
      y = margin + 2;
    }

    // Sol Sütun Kartı (x = 10)
    drawCard(leftPattern, i + 1, margin, y);

    // Sağ Sütun Kartı (x = 109)
    if (rightPattern) {
      drawCard(rightPattern, i + 2, margin + cardW + colGap, y);
    }

    y += rowMaxH + 3.0; // İki satır arası mesafe
  }

  // ═══════════════════════════════════════════════════════════
  // KULLANILABILIR ARTIKLAR ÖZETİ
  // ═══════════════════════════════════════════════════════════
  if (result.usableRemnants.length > 0) {
    if (y + 10 > pageH - footerMargin) {
      addFooter(doc, pageW, pageH, margin, t);
      doc.addPage();
      await registerPdfFont(doc);
      y = margin + 2;
    }

    doc.setFontSize(7.5);
    doc.setFont(PDF_FONT, 'bold');
    doc.setTextColor(16, 130, 90);
    doc.text(`${t('results.usableRemnants')}:`, margin, y);
    y += 4;

    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    const remText = result.usableRemnants.map(r => `${units.format(r.length)} x ${r.count}`).join('   |   ');
    doc.text(remText, margin, y);
  }

  // ═══════════════════════════════════════════════════════════
  // FOOTER (tüm sayfalara)
  // ═══════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter(doc, pageW, pageH, margin, t, p, totalPages);
  }

  // İndir
  const filename = `kesim-plani_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// ── Yardımcı fonksiyonlar ───────────────────────────────────

function addFooter(doc, pageW, pageH, margin, t, currentPage, totalPages) {
  doc.setDrawColor(200, 200, 210);
  doc.line(margin, pageH - 8, pageW - margin, pageH - 8);
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(`${t('app.title')} — v0.1.0`, margin, pageH - 4.5);
  if (currentPage && totalPages) {
    doc.text(`${currentPage} / ${totalPages}`, pageW - margin, pageH - 4.5, { align: 'right' });
  }
}

function findLength(key, result) {
  for (const p of result.patterns) {
    for (const c of p.cuts) {
      const k = c.piece.label || `${c.piece.length}`;
      if (k === key) return c.piece.length;
    }
  }
  return 0;
}
