import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, browserLocalPersistence, setPersistence, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized with project:", process.env.REACT_APP_FIREBASE_PROJECT_ID);
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw error;
}

// Initialize Firebase services
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});

// Initialize persistence
const initializeAuth = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log("Firebase persistence initialized successfully");
    
    // Force token refresh
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      console.log("Auth token refreshed for user:", auth.currentUser.uid);
      return token;
    }
  } catch (error) {
    console.error("Error setting persistence:", error);
    // If persistence fails, sign out the user to prevent auth issues
    try {
      await signOut(auth);
    } catch (signOutError) {
      console.error("Error signing out after persistence failure:", signOutError);
    }
  }
};

// Run auth initialization
initializeAuth();

// Export configured instances
export { auth, db };

// Export a function to check and refresh auth state
export const refreshAuth = async () => {
  try {
    if (auth.currentUser) {
      // Force token refresh and verify it's valid
      const token = await auth.currentUser.getIdToken(true);
      await auth.currentUser.reload();
      console.log("Auth token refreshed successfully");
      return !!token;
    }
    return false;
  } catch (error) {
    console.error("Error refreshing auth:", error);
    return false;
  }
};