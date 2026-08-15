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
  apiKey: "AIzaSy_placeholder_key_boy_yerlesim",
  authDomain: "boy-yerlesim-optimizasyonu.firebaseapp.com",
  projectId: "boy-yerlesim-optimizasyonu",
  storageBucket: "boy-yerlesim-optimizasyonu.appspot.com",
  messagingSenderId: "100000000000",
  appId: "1:100000000000:web:abcdef123456"
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
