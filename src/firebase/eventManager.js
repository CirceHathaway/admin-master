import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const instances = new Map();

export function getEventFirebase(eventDoc) {
  const appName = `EVENT_${eventDoc.id}`;

  if (instances.has(appName)) {
    return instances.get(appName);
  }

  const existing = getApps().find((a) => a.name === appName);
  const app = existing || initializeApp(eventDoc.firebaseConfig, appName);

  const bundle = {
    app,
    db: getFirestore(app),
    auth: getAuth(app),
  };

  instances.set(appName, bundle);
  return bundle;
}

export async function resetEventFirebase(eventId) {
  const appName = `EVENT_${eventId}`;
  const bundle = instances.get(appName);
  if (bundle) {
    instances.delete(appName);
    await deleteApp(bundle.app);
  }
}