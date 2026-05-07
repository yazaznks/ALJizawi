import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA_xAwcdzqmTy0w3fvCho4AR_Kp3ZIFQyo",
  authDomain: "aljizawi-6f92f.firebaseapp.com",
  projectId: "aljizawi-6f92f",
  storageBucket: "aljizawi-6f92f.firebasestorage.app",
  messagingSenderId: "536048158604",
  appId: "1:536048158604:web:7e4f95089a8949208bb8a9"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;