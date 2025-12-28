import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';

// Inizializza Firebase in modo idempotente
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Esporta le istanze dei servizi Firebase
export const db = getFirestore(app);
export const auth = getAuth(app);