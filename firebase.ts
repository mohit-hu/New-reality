// firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDrk04Bi0Wsifz4rpPPAGuv0GC46NNtG_A",
  authDomain: "named-archway-396913.firebaseapp.com",
  projectId: "named-archway-396913",
  storageBucket: "named-archway-396913.appspot.com",
  messagingSenderId: "75678041637",
  appId: "1:75678041637:web:2eed039a1d58d1a7c9e1cc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getDatabase(app);
export const auth = getAuth(app);

export default app;
