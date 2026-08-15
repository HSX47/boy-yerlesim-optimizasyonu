/**
 * PDF Dışa Aktarım — jsPDF ile kesim planı raporu
 * 
 * DİKEY (portrait) A4 sayfa, renkli kesim diyagramı + altında tablo.
 * Türkçe karakter desteği için Inter TTF fontu entegre edilmiştir.
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
  const margin = 12;
  const contentW = pageW - margin * 2;
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
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont(PDF_FONT, 'bold');
  doc.text(`${t('app.title')} — ${t('results.cuttingPlan')}`, margin, 12);
  doc.setFontSize(9);
  doc.setFont(PDF_FONT, 'normal');
  const dateStr = new Date().toLocaleDateString(i18n.locale === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  doc.text(dateStr, pageW - margin, 12, { align: 'right' });

  y = 24;

  // ═══════════════════════════════════════════════════════════
  // ÖZET KUTUSU (2 satır)
  // ═══════════════════════════════════════════════════════════
  doc.setFillColor(245, 245, 252);
  doc.setDrawColor(200, 200, 220);
  doc.roundedRect(margin, y, contentW, 22, 2, 2, 'FD');

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(8);
  doc.setFont(PDF_FONT, 'bold');

  // Üst satır: Stok ve Fire
  const row1 = [
    `${t('results.totalStock')}: ${result.totalStockUsed} ${t('results.pieces')}`,
    `${t('results.wastePercentage')}: %${result.totalWastePercentage.toFixed(1)}`,
  ];
  const row1ColW = contentW / row1.length;
  row1.forEach((text, idx) => {
    doc.text(text, margin + row1ColW * idx + row1ColW / 2, y + 8, { align: 'center' });
  });

  // Alt satır: Toplam fire ve Testere payı
  const row2 = [
    `${t('results.totalWaste')}: ${units.format(result.totalWaste)}`,
    `${t('params.kerfWidth')}: ${units.format(params.kerfWidth)}`,
  ];
  const row2ColW = contentW / row2.length;
  row2.forEach((text, idx) => {
    doc.text(text, margin + row2ColW * idx + row2ColW / 2, y + 16, { align: 'center' });
  });

  y += 28;

  // ═══════════════════════════════════════════════════════════
  // LEJANT (Renk → Parça Eşleştirmesi)
  // ═══════════════════════════════════════════════════════════
  doc.setFontSize(8);
  doc.setFont(PDF_FONT, 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text(i18n.locale === 'tr' ? 'Parça Renkleri:' : 'Part Colors:', margin, y);
  y += 4;

  const legendColW = 44;
  const legendCols = Math.floor(contentW / legendColW);
  let legendX = margin;
  let legendRow = 0;

  colorKeys.forEach((key, idx) => {
    const col = idx % legendCols;
    if (idx > 0 && col === 0) {
      legendRow++;
    }
    legendX = margin + col * legendColW;
    const ly = y + legendRow * 5;

    const rgb = PALETTE[colorMap.get(key) % PALETTE.length];
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(legendX, ly - 2.5, 4, 3, 'F');

    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(50, 50, 50);
    const label = key.length > 18 ? key.substring(0, 17) + '…' : key;
    doc.text(`${label} (${units.format(findLength(key, result))})`, legendX + 5.5, ly);
  });

  // Artık ve fire lejantı — daima yeni satırda
  legendRow++;
  const fireX = margin;
  const fireLy = y + legendRow * 5;

  // Fire
  doc.setFillColor(WASTE_RGB[0], WASTE_RGB[1], WASTE_RGB[2]);
  doc.rect(fireX, fireLy - 2.5, 4, 3, 'F');
  doc.setTextColor(180, 60, 60);
  doc.setFontSize(6.5);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(t('results.waste'), fireX + 5.5, fireLy);

  // Artık
  const remX = fireX + legendColW;
  doc.setFillColor(REMNANT_RGB[0], REMNANT_RGB[1], REMNANT_RGB[2]);
  doc.rect(remX, fireLy - 2.5, 4, 3, 'F');
  doc.setTextColor(16, 130, 90);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(i18n.locale === 'tr' ? 'Kul. Artık' : 'Remnant', remX + 5.5, fireLy);

  y += (legendRow + 1) * 5 + 4;

  // ═══════════════════════════════════════════════════════════
  // KESİM DİYAGRAMLARI (İnce Çubuk Görünümü: 5mm)
  // ═══════════════════════════════════════════════════════════
  doc.setFontSize(9);
  doc.setFont(PDF_FONT, 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(t('results.cuttingPlan'), margin, y);
  y += 5;

  const barHeight = 5;

  for (const [pIdx, pattern] of result.patterns.entries()) {
    // Sayfa taşması kontrolü
    if (y + barHeight + 8 > pageH - 25) {
      addFooter(doc, pageW, pageH, margin, t);
      doc.addPage();
      await registerPdfFont(doc);
      y = margin;
    }

    const scale = contentW / pattern.stockItem.length;

    // Bar başlığı
    doc.setFontSize(6.5);
    doc.setFont(PDF_FONT, 'bold');
    doc.setTextColor(70, 70, 70);
    const barTitle = `${t('results.stockBar')} #${pIdx + 1} — ${pattern.stockItem.label || units.format(pattern.stockItem.length)}`;
    doc.text(barTitle, margin, y);

    // Fire yüzdesi sağda
    const wasteText = `${t('results.waste')}: %${pattern.wastePercentage.toFixed(1)}`;
    doc.setTextColor(pattern.wastePercentage < 5 ? 16 : pattern.wastePercentage < 15 ? 180 : 200,
                     pattern.wastePercentage < 5 ? 150 : pattern.wastePercentage < 15 ? 120 : 60,
                     pattern.wastePercentage < 5 ? 100 : pattern.wastePercentage < 15 ? 10 : 60);
    doc.text(wasteText, pageW - margin, y, { align: 'right' });

    y += 1.8;

    // Arka plan bar
    doc.setFillColor(225, 225, 230);
    doc.setDrawColor(190, 190, 200);
    doc.rect(margin, y, contentW, barHeight, 'FD');

    // Her parçayı çiz
    for (const cut of pattern.cuts) {
      const x = margin + cut.position * scale;
      const w = Math.max(0.5, cut.piece.length * scale);
      const key = cut.piece.label || `${cut.piece.length}`;
      const cIdx = colorMap.get(key) % PALETTE.length;
      const rgb = PALETTE[cIdx];

      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.rect(x, y, w, barHeight, 'F');

      // Parça etiketi — sadece yeterli genişlikte
      if (w > 8) {
        doc.setFontSize(4.5);
        doc.setFont(PDF_FONT, 'bold');
        doc.setTextColor(255, 255, 255);
        const maxChars = Math.floor(w / 2);
        const label = key.length > maxChars ? key.substring(0, maxChars - 1) + '…' : key;
        doc.text(label, x + w / 2, y + barHeight / 2 + 0.8, { align: 'center' });
      }
    }

    // Fire bölgesi
    if (pattern.wasteLength > 0) {
      const pos = pattern.usedLength;
      const x = margin + pos * scale;
      const w = Math.max(0.3, pattern.wasteLength * scale);
      doc.setFillColor(WASTE_RGB[0], WASTE_RGB[1], WASTE_RGB[2]);
      doc.rect(x, y, w, barHeight, 'F');
    }

    // Kullanılabilir artık
    if (pattern.usableRemnant > 0) {
      const pos = pattern.stockItem.length - pattern.usableRemnant;
      const x = margin + pos * scale;
      const w = Math.max(0.5, pattern.usableRemnant * scale);
      doc.setFillColor(REMNANT_RGB[0], REMNANT_RGB[1], REMNANT_RGB[2]);
      doc.rect(x, y, w, barHeight, 'F');

      if (w > 10) {
        doc.setFontSize(4);
        doc.setFont(PDF_FONT, 'normal');
        doc.setTextColor(255, 255, 255);
        doc.text(`${units.format(pattern.usableRemnant, 0)}`, x + w / 2, y + barHeight / 2 + 0.8, { align: 'center' });
      }
    }

    y += barHeight + 3.5;
  }

  y += 4;

  // ═══════════════════════════════════════════════════════════
  // KESİM PLANI — HER ÇUBUK İÇİN AYRI TABLO
  // ═══════════════════════════════════════════════════════════

  const unitLabel = units.primaryUnit;
  const rowH = 5.5;
  const headerH = 6;

  // Tablo sütun tanımları
  const cols = [
    { label: i18n.locale === 'tr' ? 'İsim' : 'Name', w: Math.floor(contentW * 0.35) },
    { label: `${i18n.locale === 'tr' ? 'Boy' : 'Length'} (${unitLabel})`, w: Math.floor(contentW * 0.35) },
    { label: i18n.locale === 'tr' ? 'Adet' : 'Qty', w: contentW - Math.floor(contentW * 0.35) * 2 },
  ];

  for (const [pIdx, pattern] of result.patterns.entries()) {
    // ── Ayrı parçaları grupla (aynı parça birden fazla kez kesilmiş olabilir) ──
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
    const parts = [...partGroups.values()];

    // Tablo + başlık yüksekliği hesapla
    const tableHeight = headerH + (parts.length + 2) * rowH + 8; // +2 for fire & remnant rows

    // Sayfa taşma kontrolü
    if (y + tableHeight + 12 > pageH - 15) {
      addFooter(doc, pageW, pageH, margin, t);
      doc.addPage();
      await registerPdfFont(doc);
      y = margin;
    }

    // ── Çubuk Başlığı ──
    const barLabel = pattern.stockItem.label || units.format(pattern.stockItem.length);
    const barTitle = `${pIdx + 1}. ${t('results.stockBar')} (${barLabel})`;

    doc.setFillColor(55, 48, 163);
    doc.roundedRect(margin, y, contentW, 7, 1.5, 1.5, 'F');
    doc.setFontSize(8);
    doc.setFont(PDF_FONT, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(barTitle, margin + 3, y + 5);

    // Fire yüzdesi sağda
    const wp = pattern.wastePercentage;
    const wasteLabel = `${t('results.waste')}: %${wp.toFixed(1)}`;
    doc.text(wasteLabel, pageW - margin - 3, y + 5, { align: 'right' });

    y += 9;

    // ── Tablo Başlık Satırı ──
    doc.setFillColor(235, 235, 245);
    doc.setDrawColor(200, 200, 215);
    let xPos = margin;
    for (const col of cols) {
      doc.rect(xPos, y, col.w, headerH, 'FD');
      xPos += col.w;
    }

    doc.setFontSize(6.5);
    doc.setFont(PDF_FONT, 'bold');
    doc.setTextColor(60, 60, 60);
    xPos = margin;
    for (const col of cols) {
      doc.text(col.label, xPos + 2, y + 4.2);
      xPos += col.w;
    }
    y += headerH;

    // ── Parça Satırları ──
    for (const [rIdx, part] of parts.entries()) {
      const isEven = rIdx % 2 === 0;
      doc.setFillColor(isEven ? 250 : 255, isEven ? 250 : 255, isEven ? 255 : 255);
      doc.setDrawColor(220, 220, 230);

      xPos = margin;
      for (const col of cols) {
        doc.rect(xPos, y, col.w, rowH, 'FD');
        xPos += col.w;
      }

      doc.setFontSize(6.5);
      doc.setFont(PDF_FONT, 'normal');
      doc.setTextColor(40, 40, 40);

      xPos = margin;

      // İsim
      const displayName = part.label || (i18n.locale === 'tr' ? 'Parça' : 'Part');
      doc.text(displayName, xPos + 2, y + 3.8);
      xPos += cols[0].w;

      // Boy
      doc.text(`${units.fromMM(part.length)}`, xPos + 2, y + 3.8);
      xPos += cols[1].w;

      // Adet
      doc.setFont(PDF_FONT, 'bold');
      doc.text(`${part.count}`, xPos + 2, y + 3.8);

      y += rowH;
    }

    // ── Fire Satırı (Emoji yok, düz metin) ──
    if (pattern.wasteLength > 0) {
      doc.setFillColor(255, 240, 240);
      doc.setDrawColor(220, 200, 200);
      xPos = margin;
      for (const col of cols) {
        doc.rect(xPos, y, col.w, rowH, 'FD');
        xPos += col.w;
      }

      doc.setFontSize(6.5);
      doc.setFont(PDF_FONT, 'bold');
      doc.setTextColor(180, 50, 50);
      doc.text(t('results.waste'), margin + 2, y + 3.8);
      doc.text(`${units.fromMM(pattern.wasteLength)}`, margin + cols[0].w + 2, y + 3.8);
      doc.text(`%${pattern.wastePercentage.toFixed(1)}`, margin + cols[0].w + cols[1].w + 2, y + 3.8);
      y += rowH;
    }

    // ── Kullanılabilir Artık Satırı (Emoji yok, düz metin) ──
    if (pattern.usableRemnant > 0) {
      doc.setFillColor(235, 255, 245);
      doc.setDrawColor(180, 220, 200);
      xPos = margin;
      for (const col of cols) {
        doc.rect(xPos, y, col.w, rowH, 'FD');
        xPos += col.w;
      }

      doc.setFontSize(6.5);
      doc.setFont(PDF_FONT, 'bold');
      doc.setTextColor(16, 130, 90);
      doc.text(i18n.locale === 'tr' ? 'Kullanılabilir Artık' : 'Usable Remnant', margin + 2, y + 3.8);
      doc.text(`${units.fromMM(pattern.usableRemnant)}`, margin + cols[0].w + 2, y + 3.8);
      y += rowH;
    }

    y += 6; // Tablolar arası boşluk
  }

  // ═══════════════════════════════════════════════════════════
  // KULLANILABILIR ARTIKLAR ÖZETİ
  // ═══════════════════════════════════════════════════════════
  if (result.usableRemnants.length > 0) {
    if (y + 10 > pageH - 15) {
      addFooter(doc, pageW, pageH, margin, t);
      doc.addPage();
      await registerPdfFont(doc);
      y = margin;
    }

    doc.setFontSize(8);
    doc.setFont(PDF_FONT, 'bold');
    doc.setTextColor(16, 130, 90);
    doc.text(`${t('results.usableRemnants')}:`, margin, y);
    y += 5;

    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(7.5);
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
  doc.line(margin, pageH - 10, pageW - margin, pageH - 10);
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(`${t('app.title')} — v0.1.0`, margin, pageH - 6);
  if (currentPage && totalPages) {
    doc.text(`${currentPage} / ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' });
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
