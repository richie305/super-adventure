

// Fix: Changed from "import { initializeApp } from 'firebase/app';" to a namespace import
// to address "Module 'firebase/app' has no exported member 'initializeApp'" error.
import * as firebaseAppModule from 'firebase/app';
import { 
  getFirestore, 
  Timestamp, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  where,
  writeBatch
} from 'firebase/firestore';

// Your web app's Firebase configuration
// It's highly recommended to use environment variables for this
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID // Optional
};

let app;
let db: any; // Firestore type is Firestore, but to avoid circular dep issue if used elsewhere directly

const requiredConfigs = ['apiKey', 'authDomain', 'projectId'];
const missingConfigs = requiredConfigs.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingConfigs.length > 0) {
  console.warn(
    `WARNING: Firebase configuration is missing the following keys: ${missingConfigs.join(', ')}. ` +
    "Using placeholder values. Firebase functionality will be impaired. " +
    "Please set these environment variables for Firebase to work correctly."
  );
  // Provide syntactically valid placeholders to prevent immediate crash on initializeApp
  const placeholderConfig = {
    apiKey: firebaseConfig.apiKey || "YOUR_API_KEY_NOT_SET",
    authDomain: firebaseConfig.authDomain || "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: firebaseConfig.projectId || "YOUR_PROJECT_ID_NOT_SET",
    storageBucket: firebaseConfig.storageBucket || "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: firebaseConfig.messagingSenderId || "YOUR_MESSAGING_SENDER_ID",
    appId: firebaseConfig.appId || "YOUR_APP_ID"
  };
  // Fix: Use the namespace import for initializeApp
  app = firebaseAppModule.initializeApp(placeholderConfig);
} else {
  // Fix: Use the namespace import for initializeApp
  app = firebaseAppModule.initializeApp(firebaseConfig);
}

db = getFirestore(app);

export { 
  db, 
  Timestamp, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  where,
  writeBatch
};