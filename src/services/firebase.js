/**
 * Firebase Client SDK & Firestore Service Layer for DiaBeat
 * 
 * Supports:
 * - Google Sign-In Authentication (OAuth Popup)
 * - Cloud Firestore Realtime Sync for Profile & Health/Activity Logs
 * - Safe fallback mode when environment variables are not yet populated
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

// Read config from Environment Variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your_firebase_api_key'
);

// Initialize Firebase App instance singleton
let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
}

export { auth, db };

// --- AUTHENTICATION METHODS ---

/**
 * Sign in with Google Popup
 */
export const signInWithGoogle = async () => {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    throw new Error(
      'Firebase belum dikonfigurasi. Harap isi variabel NEXT_PUBLIC_FIREBASE_* di file .env'
    );
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check / initialize profile doc in Firestore if first login
    if (db && user?.uid) {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || 'Pengguna',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          profile: {
            name: user.displayName || '',
            age: 0,
            height: 0,
            weight: 0,
          },
        });
      }
    }

    return user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

/**
 * Sign out user from Firebase
 */
export const logOut = async () => {
  if (auth) {
    await signOut(auth);
  }
};

/**
 * Listen to Auth State Changes
 */
export const subscribeToAuth = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// --- FIRESTORE USER PROFILE ---

/**
 * Save / Update User Profile
 */
export const saveProfileToFirestore = async (uid, profileData) => {
  if (!db || !uid) return null;
  const userDocRef = doc(db, 'users', uid);
  const cleanProfile = {
    name: profileData.name || '',
    age: Number(profileData.age) || 0,
    height: Number(profileData.height) || 0,
    weight: Number(profileData.weight) || 0,
    gender: profileData.gender || 'unspecified',
    updatedAt: serverTimestamp(),
  };

  await setDoc(userDocRef, { profile: cleanProfile }, { merge: true });
  return cleanProfile;
};

/**
 * Get User Profile from Firestore
 */
export const getProfileFromFirestore = async (uid) => {
  if (!db || !uid) return null;
  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  if (snap.exists()) {
    const data = snap.data();
    return data.profile || null;
  }
  return null;
};

// --- FIRESTORE HEALTH & ACTIVITY LOGS ---

/**
 * Add a new log document (activity, diet, sleep, screentime)
 */
export const addLogToFirestore = async (uid, type, logItem, dateKey) => {
  if (!db || !uid) return null;
  const colRef = collection(db, 'users', uid, 'logs');
  const payload = {
    ...logItem,
    type,
    date: dateKey,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(colRef, payload);
  return { id: docRef.id, ...payload };
};

/**
 * Delete a log document
 */
export const deleteLogFromFirestore = async (uid, logId) => {
  if (!db || !uid || !logId) return false;
  const docRef = doc(db, 'users', uid, 'logs', logId);
  await deleteDoc(docRef);
  return true;
};

/**
 * Realtime Listener for logs on a specific date
 */
export const subscribeToDateLogs = (uid, dateKey, callback) => {
  if (!db || !uid) {
    callback({ activity: [], diet: [], sleep: [], screentime: [] });
    return () => {};
  }

  const colRef = collection(db, 'users', uid, 'logs');
  const q = query(colRef, where('date', '==', dateKey));

  return onSnapshot(
    q,
    (snapshot) => {
      const grouped = {
        activity: [],
        diet: [],
        sleep: [],
        screentime: [],
      };

      snapshot.docs.forEach((d) => {
        const item = { id: d.id, ...d.data() };
        if (grouped[item.type]) {
          grouped[item.type].push(item);
        }
      });

      callback(grouped);
    },
    (err) => {
      console.warn('Firestore subscription error:', err);
    }
  );
};

/**
 * Realtime Listener for all logs of a user (for calendar calculations)
 */
export const subscribeToAllUserLogs = (uid, callback) => {
  if (!db || !uid) {
    callback([]);
    return () => {};
  }

  const colRef = collection(db, 'users', uid, 'logs');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const allLogs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(allLogs);
    },
    (err) => {
      console.warn('Firestore all logs subscription error:', err);
    }
  );
};
