/**
 * Firebase Başlatma Servisi
 */
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBlD1SvjpRG9A_dHDsPxLUVktpQPV--Y8k",
  authDomain: "profil-kesim-hesaplayici.firebaseapp.com",
  projectId: "profil-kesim-hesaplayici",
  storageBucket: "profil-kesim-hesaplayici.firebasestorage.app",
  messagingSenderId: "279506136083",
  appId: "1:279506136083:web:91701a05527345030b63e6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
};
