import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Esporta le istanze dei servizi Firebase
export const db = getFirestore(app);
export const auth = getAuth(app);
