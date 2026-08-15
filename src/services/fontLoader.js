/**
 * jsPDF için Inter fontunu yükle ve kaydet
 * Türkçe karakterleri (ı, ş, ç, ğ, ö, ü, İ, Ş, Ç, Ğ, Ö, Ü) tam destekler
 */

import interRegularUrl from '../assets/fonts/Inter-Regular.ttf?url';

export const PDF_FONT = 'Inter';

let fontLoaded = false;
let fontBase64 = null;

async function loadFontBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * jsPDF belgesine Inter fontunu kaydet
 * @param {import('jspdf').jsPDF} doc
 */
export async function registerPdfFont(doc) {
  try {
    if (!fontLoaded) {
      fontBase64 = await loadFontBase64(interRegularUrl);
      fontLoaded = true;
    }

    doc.addFileToVFS('Inter-Regular.ttf', fontBase64);
    doc.addFont('Inter-Regular.ttf', PDF_FONT, 'normal');
    doc.addFont('Inter-Regular.ttf', PDF_FONT, 'bold');
    doc.setFont(PDF_FONT, 'normal');
    return true;
  } catch (err) {
    console.warn('PDF font yüklenemedi, varsayılan font kullanılacak:', err);
    return false;
  }
}
