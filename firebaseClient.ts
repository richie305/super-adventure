/**
 * @file firebaseClient.ts
 * @description This file is responsible for initializing the Firebase app and configuring Firebase services.
 * It sets up the Firebase configuration using environment variables, initializes the main Firebase app,
 * and initializes services like Firestore and Analytics. These initialized services and relevant
 * Firebase SDK functions are then exported for use throughout the application, providing a centralized
 * point for Firebase integration.
 */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
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
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// IMPORTANT: Consider using environment variables for these values in production.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID // Optional
};

// Initialize Firebase
/**
 * @constant app
 * @description The initialized Firebase app instance. This is the core of the Firebase setup.
 */
const app = initializeApp(firebaseConfig);
/**
 * @constant analytics
 * @description The Firebase Analytics instance, used for tracking application usage and events.
 */
const analytics = getAnalytics(app);

// If you need to use other Firebase services, import and initialize them here.
// For example, for Firestore:
// import { getFirestore } from "firebase/firestore";
/**
 * @constant db
 * @description The Firebase Firestore database instance. Used for all Firestore database operations.
 */
const db = getFirestore(app);

export {
  app,
  analytics,
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
// If you added Firestore or other services, export them too:
// export { app, analytics, db };