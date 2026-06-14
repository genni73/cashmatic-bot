import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDJNcAZS-fKQLiEkY6DZgnAYnEznO1Eykc",
  authDomain: "tabaccheriapro.firebaseapp.com",
  projectId: "tabaccheriapro",
  storageBucket: "tabaccheriapro.firebasestorage.app",
  messagingSenderId: "777629507450",
  appId: "1:777629507450:web:8065552620f8e62c70c0c3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not available in this browser');
  }
});

export default app;
