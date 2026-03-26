import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "sedmha-2026-truro.firebaseapp.com",
  projectId: "sedmha-2026-truro",
  storageBucket: "sedmha-2026-truro.firebasestorage.app",
  messagingSenderId: "570108674333",
  appId: "1:570108674333:web:6971a6ba0450da9b2961f4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
