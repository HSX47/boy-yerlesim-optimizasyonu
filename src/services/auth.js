/**
 * Firebase Auth Kimlik Doğrulama Servisi
 */
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut, 
  onAuthStateChanged 
} from './firebase.js';

let currentUser = null;
const listeners = new Set();

// Auth durumu değişince dinleyicileri tetikle
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  listeners.forEach(cb => cb(user));
});

export function getCurrentUser() {
  return currentUser;
}

export function onAuthChange(callback) {
  listeners.add(callback);
  callback(currentUser);
  return () => listeners.delete(callback);
}

/**
 * Yeni Kullanıcı Kaydı (Sign Up)
 */
export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (err) {
    return { user: null, error: getAuthErrorMessage(err.code) };
  }
}

/**
 * Kullanıcı Girişi (Login)
 */
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (err) {
    return { user: null, error: getAuthErrorMessage(err.code) };
  }
}

/**
 * Şifremi Unuttum / Şifre Sıfırlama E-postası
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (err) {
    return { error: getAuthErrorMessage(err.code) };
  }
}

/**
 * Çıkış Yap (Logout)
 */
export async function logout() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Hata Kodlarını Kullanıcı Dostu Türkçe Mesajlara Çevir
 */
function getAuthErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi zaten kayıtlı.';
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi biçimi.';
    case 'auth/operation-not-allowed':
      return 'E-posta ile giriş henüz aktif edilmemiş.';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalıdır.';
    case 'auth/user-disabled':
      return 'Bu kullanıcı hesabı engellenmiş.';
    case 'auth/user-not-found':
      return 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-posta adresi veya şifre hatalı.';
    case 'auth/too-many-requests':
      return 'Çok fazla başarısız deneme yapıldı. Lütfen daha sonra tekrar deneyin.';
    default:
      return 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.';
  }
}
