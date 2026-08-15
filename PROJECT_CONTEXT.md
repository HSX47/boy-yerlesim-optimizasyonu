# PROJECT_CONTEXT.md — KesimOptimizer Proje Açıklaması

> ⚠️ **ÖNEMLİ NOT — GELECEK AI MODELLERİ İÇİN:**
> Bu dosya, projenin mevcut durumunu ve mimari kararlarını anlamak için zorunlu referans kaynağıdır.
> **Her değişiklikten sonra bu dosyayı güncellemelisiniz.** Yeni dosya eklendiyse, mevcut yapı 
> değiştiyse, önemli bir mimari karar alındıysa veya yeni özellik eklendiyse — bu dosyayı güncelleyin.
> Bu dosya güncel tutulmadığında, sonraki geliştirici (insan veya AI) projeyi anlayamaz.

---

## Projenin Amacı

Boy malzemelerde (profil, boru vb.) **1D lineer kesim optimizasyonu** yapan web uygulaması.
Kullanıcı stok malzeme boylarını ve kesim ihtiyaçlarını girer, uygulama fire'ı minimize eden
optimal kesim planını hesaplar.

### İş Modeli Planı
1. **Mevcut:** Tamamen ücretsiz, üyelik gerektirmeyen açık erişim
2. **Yakın gelecek:** Zorunlu ücretsiz üyelik (kullanıcı sayısı arttığında aktifleştirilecek)
3. **Uzun vade:** Stripe ile premium abonelik modeli (gelişmiş algoritmalar, sınırsız kullanım)

Üyelik zorunluluğu kullanıcı tarafından manuel olarak aktifleştirilecek — otomatik geçiş yok.

---

## Teknoloji Yığını

| Teknoloji | Versiyon | Kullanım |
|:---|:---|:---|
| **Vite** | 8.x | Build tool & dev server |
| **Vanilla JS** | ES2022+ | Uygulama mantığı (framework yok) |
| **CSS** | Custom Properties | Tasarım sistemi, tema desteği |
| **jsPDF** | 4.x | PDF rapor oluşturma |
| **SheetJS (xlsx)** | 0.18.x | Excel dışa aktarım |
| **Dexie** | 4.x | IndexedDB sarmalayıcı (henüz kullanılmıyor) |
| **UUID** | 14.x | Benzersiz ID üretimi |

### Planlanan Teknolojiler (Henüz Eklenmedi)
- **Firebase Auth** — Kullanıcı kimlik doğrulama
- **Firestore** — Proje CRUD ve bulut senkronizasyon
- **Stripe** — Ödeme sistemi
- **vite-plugin-pwa** — Progressive Web App desteği

---

## Klasör Yapısı

```
boy yerlesim optimizasyonu/
├── index.html                    # Ana HTML giriş noktası (SEO meta tagları dahil)
├── package.json                  # Bağımlılıklar
├── vite.config.js                # Vite yapılandırması (varsa)
├── public/
│   └── favicon.svg               # Uygulama ikonu (SVG)
│
├── src/
│   ├── main.js                   # ★ Ana giriş noktası — tüm bileşenleri bağlar
│   │
│   ├── core/                     # İş mantığı katmanı (DOM bağımlılığı YOK)
│   │   ├── models.js             # Veri modelleri: StockItem, CutPiece, Project, OptimizationParams
│   │   ├── optimizer.js          # Optimizasyon dispatcher: doğrulama + algoritma çağrısı
│   │   ├── units.js              # Birim sistemi: metrik ↔ imperial dönüştürücü
│   │   ├── theme.js              # Tema yöneticisi: koyu ↔ açık tema, localStorage persistance
│   │   └── algorithms/
│   │       ├── ffd.js            # First-Fit Decreasing algoritması
│   │       └── bestFit.js        # Best-Fit Decreasing algoritması
│   │
│   ├── i18n/                     # Çoklu dil altyapısı
│   │   ├── index.js              # i18n motoru: dil değiştirme, interpolasyon, DOM güncelleme
│   │   ├── tr.js                 # Türkçe çeviri dosyası (varsayılan dil)
│   │   └── en.js                 # İngilizce çeviri dosyası
│   │
│   ├── ui/                       # UI bileşenleri (DOM manipülasyonu)
│   │   ├── navbar.js             # Navbar: logo, tema toggle, birim seçici, dil seçici
│   │   ├── inputPanel.js         # Stok malzeme giriş formu + hızlı ekleme butonları
│   │   ├── cutListPanel.js       # Kesim listesi tablosu + Excel'den yapıştır
│   │   ├── paramsPanel.js        # Optimizasyon parametreleri (testere payı, min artık, algoritma)
│   │   ├── resultsPanel.js       # Sonuç paneli: istatistik kartları + kesim planı detayları
│   │   ├── visualizer.js         # SVG kesim diyagramı (renk kodlu, hover efektli)
│   │   └── toast.js              # Bildirim (toast) sistemi
│   │
│   ├── services/                 # Dış servis entegrasyonları
│   │   ├── exportPdf.js          # PDF dışa aktarım (jsPDF): dikey A4, diyagram + tablo
│   │   └── exportExcel.js        # Excel dışa aktarım (SheetJS): 3 sayfa
│   │
│   ├── styles/                   # CSS dosyaları
│   │   ├── index.css             # Design tokens, reset, koyu/açık tema değişkenleri
│   │   ├── components.css        # Tüm bileşen stilleri (navbar, kartlar, butonlar, tablolar)
│   │   └── animations.css        # Animasyon keyframe'leri
│   │
│   └── utils/                    # Yardımcı sabitler
│       └── constants.js          # DEFAULT_STOCK_LENGTHS, CUT_COLORS, WASTE_COLOR, REMNANT_COLOR
```

---

## Mimari Kararlar

### 1. Framework Kullanılmıyor
Bilinçli karar: React/Vue/Svelte yok. Vanilla JS tercih edildi çünkü:
- Uygulama nispeten küçük — 7 UI bileşeni
- Bundle boyutu minimumda kalıyor
- Bağımlılık güncellemesi sorunu yok

### 2. İç Birim Sistemi: Milimetre (mm)
**Tüm hesaplamalar dahili olarak mm cinsinden yapılır.**
- `units.toMM(value)` — kullanıcı birimini mm'ye çevirir
- `units.fromMM(value)` — mm'yi kullanıcı birimine çevirir
- `units.format(mm)` — mm değerini gösterim birimine dönüştürüp formatlar
- Imperial seçildiğinde kullanıcı inch cinsinde girer/görür, ama dahilde mm saklanır

### 3. i18n Yaklaşımı
- Her dil dosyası düz JavaScript objesi export eder (JSON değil)
- `i18n.t('key.path', { param: value })` ile interpolasyon desteklenir
- DOM'da `data-i18n` attribute'u ile statik metinler otomatik güncellenir
- Dinamik içerik (paneller) `i18n.onChange()` callback'i ile yeniden render edilir

### 4. Tema Sistemi
- CSS Custom Properties ile tema değişkenleri tanımlanır
- `[data-theme="light"]` selector'ü ile açık tema override edilir
- `ThemeManager` sınıfı `localStorage` ve `prefers-color-scheme` media query kullanır
- Navbar'da ☀️/🌙 toggle butonu ile değiştirilir

### 5. Bileşen Yapısı
Her UI bileşeni aynı kalıbı takip eder:
```javascript
export function renderXxxPanel(container, data, onChange) {
  function render() {
    container.innerHTML = `...`;
    bindEvents();
  }
  function bindEvents() { /* event listeners */ }
  render();
  i18n.onChange(() => render());
  units.onChange(() => render());
  return { update(newData) { ... }, refresh: render };
}
```

### 6. Algoritma Dispatcher
`optimizer.js` doğrulama yapar, sonra `params.algorithm` değerine göre doğru algoritma fonksiyonunu çağırır.
Sonuç objesi (`OptimizationResult`) her zaman aynı şekli döndürür.

---

## Veri Modelleri (models.js)

### StockItem
```javascript
{ id, label, length, quantity, unitPrice }
// quantity = 0 → sınırsız stok anlamına gelir
```

### CutPiece
```javascript
{ id, label, length, quantity }
```

### OptimizationParams
```javascript
{ kerfWidth: 3, minUsableRemnant: 200, algorithm: 'bfd' }
// kerfWidth: testere bıçağı kalınlığı (mm)
// minUsableRemnant: bu boydan kısa artıklar fire sayılır
// algorithm: 'ffd' | 'bfd' | 'branchBound' (branchBound henüz premium)
```

### OptimizationResult (optimizer.js çıktısı)
```javascript
{
  patterns: [
    {
      stockItem: { ... },
      cuts: [{ piece: CutPiece, position: Number }],
      usedLength: Number,      // kerf dahil kullanılan uzunluk
      wasteLength: Number,     // fire (kerf sonrası kalan kısa parçalar)
      usableRemnant: Number,   // min artık üstü kalan uzun parça
      wastePercentage: Number,
    }
  ],
  totalStockUsed: Number,
  totalWaste: Number,
  totalWastePercentage: Number,
  totalCost: Number,
  usableRemnants: [{ length, count }],
  executionTimeMs: Number,
}
```

---

## Önemli Detaylar

### PDF Dışa Aktarım
- **DİKEY (portrait)** A4 sayfa
- Üstte özet kutusu, sonra renk lejantı, sonra bar diyagramları
- Her çubuk için ayrı detay tablosu: parça ismi, boy (birimli), adet
- Fire ve kullanılabilir artık satırları tablonun altında renkli olarak gösterilir
- Küçük parçalarda metin sığmazsa sadece lejanta referans bırakılır

### Excel Dışa Aktarım
3 sayfa:
1. **Özet** — toplam stok, fire oranı, parametreler, artıklar
2. **Kesim Planı** — her çubuk için parça, fire, yüzde detayları
3. **Girdi Verileri** — kullanıcının girdiği stok ve kesim listesi

### Yeni Dil Ekleme
1. `src/i18n/` altına yeni dosya oluştur (ör: `de.js`)
2. `tr.js` yapısını birebir kopyala, çevirilerini yap
3. `src/i18n/index.js` → `AVAILABLE_LOCALES` objesine ekle
4. Otomatik olarak navbar dil seçicisinde görünür

### Yeni Algoritma Ekleme
1. `src/core/algorithms/` altına yeni dosya oluştur
2. Export ettiği fonksiyon `(expandedCuts, stockItems, params) => patterns[]` döndürmeli
3. `src/core/optimizer.js` → `switch` bloğuna ekle
4. i18n dosyalarına `params.algorithmXxx` çeviri anahtarını ekle

---

## Mevcut Durum & Yapılacaklar

### ✅ Tamamlanan
- Vite + Vanilla JS altyapı
- FFD ve BFD optimizasyon algoritmaları
- Koyu ve açık tema
- Türkçe ve İngilizce arayüz (genişletilebilir i18n)
- Metrik ve Imperial birim sistemi
- Stok giriş paneli (hızlı ekleme + manuel)
- Kesim listesi paneli (Excel'den yapıştır dahil)
- Optimizasyon parametreleri paneli
- SVG kesim diyagramı (renk kodlu)
- Sonuç paneli (istatistik kartları + detaylı plan)
- PDF rapor dışa aktarım (dikey A4, Inter Türkçe font entegrasyonu, tam karakter desteği)
- Excel rapor dışa aktarım (3 sayfa)
- Toast bildirim sistemi
- Stok miktar yetersizliği / sığmayan parça tespit sistemi ve kırmızı uyarı banner'ı

### 🔲 Yapılacak (Sprint 2+)
- [ ] IndexedDB ile proje kaydetme/yükleme (Dexie)
- [ ] PWA desteği (çevrimdışı çalışma)
- [ ] Firebase Auth entegrasyonu
- [ ] Firestore proje CRUD
- [ ] Branch & Bound algoritması (premium)
- [ ] Stripe ödeme entegrasyonu
- [ ] Kullanıcı profil sayfası
- [ ] Proje geçmişi ve karşılaştırma

---

## Geliştirme Komutları

```bash
# Bağımlılıkları kur
npm install

# Dev sunucu başlat (http://localhost:5173)
npm run dev

# Production build
npm run build

# Build önizleme
npm run preview
```

---

> 📅 Son Güncelleme: 2026-08-15
> 📝 Bu dosyayı her değişiklikte güncelleyin!
