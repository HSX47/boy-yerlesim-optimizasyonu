/**
 * Ortak sabitler
 */

// Hızlı eklenebilir standart boy malzeme uzunlukları
export const DEFAULT_STOCK_LENGTHS = [
  { label: '6 m', length: 6000 },
  { label: '6.5 m', length: 6500 },
  { label: '9 m', length: 9000 },
  { label: '12 m', length: 12000 },
];

// SVG kesim diyagramı ve PDF'te kullanılan renk paleti
export const CUT_COLORS = [
  'hsl(243, 75%, 59%)',   // Indigo
  'hsl(160, 84%, 39%)',   // Emerald
  'hsl(270, 91%, 65%)',   // Purple
  'hsl(38, 92%, 50%)',    // Amber
  'hsl(187, 96%, 42%)',   // Cyan
  'hsl(330, 81%, 60%)',   // Pink
  'hsl(84, 81%, 44%)',    // Lime
  'hsl(25, 95%, 53%)',    // Orange
  'hsl(217, 91%, 60%)',   // Blue
  'hsl(0, 84%, 60%)',     // Rose
  'hsl(142, 71%, 45%)',   // Green
  'hsl(47, 96%, 53%)',    // Gold
];

// Fire ve artık renkleri
export const WASTE_COLOR = 'hsl(0, 60%, 45%)';
export const REMNANT_COLOR = 'hsl(160, 84%, 39%)';
