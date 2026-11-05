import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  getAdditionalUserInfo
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace these placeholder values with your Firebase Console Project credentials
const firebaseConfig = {

  apiKey: "AIzaSyCAN4zY4TUJOm6Zg2tnx-E3vfSgBc1t9CA",

  authDomain: "uct-geopolitics-game.firebaseapp.com",

  projectId: "uct-geopolitics-game",

  storageBucket: "uct-geopolitics-game.firebasestorage.app",

  messagingSenderId: "906340483701",

  appId: "1:906340483701:web:74ceb7e1b3bcc903ceae3c"

};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export { 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  getAdditionalUserInfo
};