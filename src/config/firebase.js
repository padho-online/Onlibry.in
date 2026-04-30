import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyDaH28CXlm0qV6p9SWAfHnYP1wg-gvd1IQ",
  authDomain: "edulibrary-9e42b.firebaseapp.com",
  projectId: "edulibrary-9e42b",
  storageBucket: "edulibrary-9e42b.firebasestorage.app",
  messagingSenderId: "279268985463",
  appId: "1:279268985463:web:40f58149682e423de79472"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export { app };  // ✅ YEH LINE IMPORTANT HAI - app export karo

export default app;