import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableMultiTabIndexedDbPersistence
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '../firebase.config';

// Singleton pattern to prevent duplicate initialization
let app: any; // Using any or specific app type
let auth: Auth;
let db: Firestore;
let storage: any;

console.log('🚀 Starting Firebase initialization...');
console.log('📦 Firebase config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey
});

// Check if Firebase app already exists
if (!getApps().length) {
  console.log('🔥 Initializing NEW Firebase app...');

  try {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase app:', error);
    throw error;
  }

  // Initialize Firestore with better error handling
  try {
    console.log('🔄 Attempting to initialize Firestore with persistent cache...');
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
    console.log('✅ Firestore initialized with persistent cache (multi-tab)');
  } catch (error: any) {
    console.warn('⚠️ Failed to initialize Firestore with persistent cache:', error.message);
    console.log('🔄 Falling back to default Firestore initialization...');

    try {
      db = getFirestore(app);
      console.log('✅ Firestore initialized with default settings');

      // Try to enable offline persistence separately (async, non-blocking)
      enableMultiTabIndexedDbPersistence(db)
        .then(() => {
          console.log('✅ Offline persistence enabled (multi-tab)');
        })
        .catch((persistError: any) => {
          if (persistError.code === 'failed-precondition') {
            console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time');
          } else if (persistError.code === 'unimplemented') {
            console.warn('⚠️ Browser doesn\'t support persistence');
          } else {
            console.warn('⚠️ Failed to enable persistence:', persistError.message);
          }
        });
    } catch (fallbackError) {
      console.error('❌ Failed to initialize Firestore with fallback:', fallbackError);
      throw fallbackError;
    }
  }
} else {
  console.log('♻️ Firebase app already exists, reusing instance');
  app = getApp();
  db = getFirestore(app);
}

// Initialize Firebase services (only once)
try {
  auth = getAuth(app);
  console.log('✅ Firebase Auth initialized:', !!auth);
} catch (error) {
  console.error('❌ Failed to initialize Auth:', error);
  throw error;
}

try {
  storage = getStorage(app);
  console.log('✅ Firebase Storage initialized:', !!storage);
} catch (error) {
  console.error('❌ Failed to initialize Storage:', error);
  throw error;
}

console.log('✅ Firestore initialized:', !!db);
console.log('✅ All Firebase services ready!');

// Add connection state listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Network status: ONLINE');
  });

  window.addEventListener('offline', () => {
    console.warn('⚠️ Network status: OFFLINE');
  });
}

export { auth, db, storage };
export default app;