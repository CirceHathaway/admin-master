import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const masterConfig = {
  apiKey: import.meta.env.VITE_MASTER_API_KEY,
  authDomain: import.meta.env.VITE_MASTER_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_MASTER_PROJECT_ID,
  storageBucket: import.meta.env.VITE_MASTER_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MASTER_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_MASTER_APP_ID,
};

const masterApp = initializeApp(masterConfig, "MASTER_APP");

export const masterDb = getFirestore(masterApp);
export const masterAuth = getAuth(masterApp);