
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
    initializeFirestore, 
    disableNetwork, 
    setLogLevel,
    persistentLocalCache,
    persistentMultipleTabManager,
    doc,
    getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Silence verbose network retry warnings in sandboxed environment
setLogLevel('silent');

// Configure persistent local cache to reuse cached Firestore data
export const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
}, (firebaseConfig as any).firestoreDatabaseId);

if (firebaseConfig.projectId === "remixed-project-id") {
    disableNetwork(db).catch(() => {});
}

export const auth = getAuth(app);

// Connection test helper (optional)
export async function testConnection() {
    try {
        await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
        // Graceful offline fallback
    }
}





