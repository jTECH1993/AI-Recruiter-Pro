import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOxfuY32fnlTpYdpp4DJT2CejWm7YMcvg",
  authDomain: "hrcv-2d7ce.firebaseapp.com",
  projectId: "hrcv-2d7ce",
  storageBucket: "hrcv-2d7ce.firebasestorage.app",
  messagingSenderId: "329377738233",
  appId: "1:329377738233:web:0171f48e40cd7571d36128",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Firestore with the custom databaseId from our configuration
export const db = getFirestore(app, "ai-studio-airecruiterpro-c88ef64e-c57e-4cec-bd67-adfc51f57b26");
