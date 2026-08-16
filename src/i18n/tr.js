/**
 * Türkçe dil dosyası (varsayılan)
 */
export default {
  meta: {
    code: 'tr',
    name: 'Türkçe',
    flag: '🇹🇷',
  },

  // — Genel —
  app: {
    title: 'Kesim Hesaplayıcı',
    subtitle: 'Boy Malzeme Kesim Optimizasyonu',
    tagline: 'Profil ve boru gibi boy malzemelerde fire\'ı minimuma indirin',
  },

  // — Navbar —
  nav: {
    newProject: 'Yeni Proje',
    openProject: 'Proje Aç',
    saveProject: 'Kaydet',
    settings: 'Ayarlar',
    language: 'Dil',
    units: 'Birim',
    theme: 'Tema',
    darkTheme: 'Koyu Tema',
    lightTheme: 'Açık Tema',
    login: 'Giriş Yap',
    signup: 'Üye Ol',
    logout: 'Çıkış',
    contact: 'İletişim',
    premium: 'Premium',
  },

  // — İletişim Formu —
  contact: {
    title: 'Bize Ulaşın',
    subtitle: 'Soru, öneri ve görüşlerinizi bize iletebilirsiniz.',
    name: 'Adınız Soyadınız',
    email: 'E-posta Adresiniz',
    subject: 'Konu',
    message: 'Mesajınız',
    send: 'Mesaj Gönder',
    sending: 'Gönderiliyor...',
    success: 'Mesajınız başarıyla iletildi! Teşekkür ederiz.',
  },

  // — Kimlik Doğrulama / Üyelik —
  auth: {
    title: 'Kullanıcı Hesabı',
    subtitle: 'Projelerinizi bulutta saklayın ve her cihazdan erişin',
    mandatoryNotice: 'Hesaplayıcıyı kullanmak için lütfen giriş yapın veya ücretsiz kaydolun.',
    loginTab: 'Giriş Yap',
    signupTab: 'Kayıt Ol',
    email: 'E-posta Adresi',
    password: 'Şifre',
    passwordConfirm: 'Şifre Tekrarı',
    forgotPasswordLink: 'Şifremi unuttum',
    loginBtn: 'Giriş Yap',
    signupBtn: 'Ücretsiz Kaydol',
    sendResetLink: 'Sıfırlama Bağlantısı Gönder',
    forgotInstructions: 'Hesabınıza ait e-posta adresinizi girin. Size şifre sıfırlama bağlantısı göndereceğiz.',
    backToLogin: 'Giriş ekranına dön',
  },

  // — Birimler —
  units: {
    metric: 'Metrik (mm)',
    imperial: 'İngiliz (inch)',
    mm: 'mm',
    cm: 'cm',
    m: 'm',
    inch: 'inç',
    ft: 'ft',
  },

  // — Stok Malzeme —
  stock: {
    title: 'Stok Malzemeler',
    addStock: 'Stok Ekle',
    length: 'Boy',
    quantity: 'Adet',
    quantityHint: '0 = sınırsız',
    unitPrice: 'Boy Fiyatı',
    label: 'Etiket',
    labelPlaceholder: 'ör: 6m IPE 200',
    removeStock: 'Sil',
    noStock: 'Henüz stok malzeme eklenmedi',
    unlimited: 'Sınırsız',
    quickAdd: 'Hızlı ekle:',
  },

  // — Kesim Listesi —
  cuts: {
    title: 'Kesim Listesi',
    addCut: 'Kesim Ekle',
    length: 'Boy',
    quantity: 'Adet',
    label: 'Etiket',
    labelPlaceholder: 'ör: Kolon K1',
    removeCut: 'Sil',
    noCuts: 'Henüz kesim parçası eklenmedi',
    totalTypes: '{count} çeşit',
    totalPieces: '{count} adet',
    pasteFromExcel: 'Excel\'den Yapıştır',
    importCSV: 'CSV İçe Aktar',
  },

  // — Parametreler —
  params: {
    title: 'Optimizasyon Parametreleri',
    kerfWidth: 'Testere Payı',
    kerfWidthHint: 'Kesim bıçağının kalınlığı',
    minRemnant: 'Min. Kullanılabilir Artık',
    minRemnantHint: 'Bu boydan küçük artıklar fire sayılır',
    cutCost: 'Kesim Başı Maliyet',
    cutCostHint: 'Her kesim işlemi için ilave maliyet',
    algorithm: 'Algoritma',
    algorithmFFD: 'İlk Sığan Azalan (FFD)',
    algorithmBFD: 'En İyi Sığan Azalan (BFD)',
    algorithmBB: 'Dal ve Sınır (Branch & Bound)',
    algorithmBBPremium: '🔒 Premium',
    algorithmBBMembersOnly: '🔒 Üyelere Özel',
  },

  // — Aksiyon Butonları —
  actions: {
    optimize: '🚀 Optimize Et',
    optimizing: '⏳ Hesaplanıyor...',
    reset: 'Sıfırla',
    exportPdf: '📄 PDF İndir',
    exportExcel: '📊 Excel İndir',
  },

  // — Sonuçlar —
  results: {
    title: 'Optimizasyon Sonuçları',
    summary: 'Özet',
    totalStock: 'Kullanılan Stok',
    remainingStock: 'Artan Stok',
    totalWaste: 'Toplam Fire',
    wastePercentage: 'Fire Oranı',
    totalCost: 'Toplam Maliyet',
    totalCuts: 'Toplam Kesim',
    materialCost: 'Malzeme Maliyeti',
    cuttingCost: 'Kesim Maliyeti',
    usableRemnants: 'Kullanılabilir Artıklar',
    stockUsageBreakdown: 'Stok Kullanım & Artan Stok Durumu',
    cuttingPlan: 'Kesim Planı',
    stockBar: 'Çubuk',
    pieces: 'adet',
    waste: 'Fire',
    remnant: 'Artık',
    noResults: 'Henüz optimizasyon yapılmadı',
    executionTime: 'Hesaplama Süresi',
    unplacedWarning: 'Dikkat: {count} adet kesim parçası stok miktarının yetersiz olması nedeniyle plana sığdırılamadı!',
  },

  // — Görselleştirme —
  visualizer: {
    title: 'Kesim Diyagramı',
    zoomIn: 'Yakınlaştır',
    zoomOut: 'Uzaklaştır',
    resetZoom: 'Sıfırla',
    showLabels: 'Etiketleri Göster',
    hideLabels: 'Etiketleri Gizle',
  },

  // — Bildirimler —
  toast: {
    optimizeSuccess: 'Optimizasyon tamamlandı!',
    optimizeError: 'Optimizasyon sırasında hata oluştu',
    saved: 'Proje kaydedildi',
    exported: 'Dışa aktarım tamamlandı',
    noData: 'Lütfen en az bir stok malzeme ve bir kesim parçası girin',
    cutTooLong: 'Bazı kesim parçaları stok boyundan uzun!',
    unplacedCuts: 'Dikkat: {count} adet kesim parçası stok miktar yetersizliğinden sığdırılamadı!',
    invalidInput: 'Geçersiz giriş değeri',
    copied: 'Panoya kopyalandı',
    exportSuccess: 'Dosya başarıyla indirildi',
    exportError: 'Dışa aktarım sırasında hata oluştu',
  },

  // — Doğrulama —
  validation: {
    required: 'Bu alan zorunludur',
    positive: 'Pozitif bir sayı girin',
    integer: 'Tam sayı girin',
    min: 'Minimum değer: {min}',
    max: 'Maksimum değer: {max}',
  },

  // — Footer —
  footer: {
    copyright: '© {year} KesimOptimizer — Tüm hakları saklıdır.',
    version: 'v{version}',
  },

  // — Genel —
  common: {
    cancel: 'İptal',
    confirm: 'Onayla',
    delete: 'Sil',
    edit: 'Düzenle',
    save: 'Kaydet',
    close: 'Kapat',
    loading: 'Yükleniyor...',
    error: 'Hata',
    success: 'Başarılı',
    warning: 'Uyarı',
    info: 'Bilgi',
    yes: 'Evet',
    no: 'Hayır',
    or: 'veya',
    and: 've',
    currency: '₺',
  },
};
