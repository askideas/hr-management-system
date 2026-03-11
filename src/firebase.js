import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeda3x5Ns6Qvb9QNPxi5jL6rtOISel-0s",
  authDomain: "ruwa-server.firebaseapp.com",
  projectId: "ruwa-server",
  storageBucket: "ruwa-server.firebasestorage.app",
  messagingSenderId: "705449192694",
  appId: "1:705449192694:web:760e4ad237de57d16f50d7",
  measurementId: "G-SJB3QDR6DZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
