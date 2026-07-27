
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, disableNetwork } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

if (firebaseConfig.projectId === "remixed-project-id") {
    disableNetwork(db).catch(console.error);
}

export const auth = getAuth(app);
