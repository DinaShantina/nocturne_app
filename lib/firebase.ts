import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDIH8rSxyF5qX-MnzkNSKduqwnE0K9tttg",
  authDomain: "nocturne-cd7f1.firebaseapp.com",
  projectId: "nocturne-cd7f1",
    storageBucket: "nocturne-stamps-vault",
  messagingSenderId: "620417425995",
  appId: "1:620417425995:web:5ec9775169eac1857d63ce",
  measurementId: "G-MH4PN3NBDQ"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const storage = getStorage(app);