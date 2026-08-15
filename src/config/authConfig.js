/**
 * Auth Yapılandırması ve Özellik Anahtarları (Feature Toggles)
 */
export const authConfig = {
  // Zorunlu Üyelik Anahtarı:
  // true  => Giriş yapmadan hesaplayıcı kullanılamaz (Ekran kilitlenir ve Üyelik zorunlu tutulur)
  // false => Giriş yapmadan hesaplayıcı serbestçe kullanılabilir (Varsayılan)
  requireAuth: false,
};
