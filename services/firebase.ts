// FIX: Switched to Firebase v9 compat imports to resolve module export errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import { firebaseConfig } from './firebaseConfig';

// Inizializza Firebase
// FIX: Use v8/compat style initialization.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Esporta le istanze dei servizi Firebase
// FIX: Use v8/compat style service access.
export const db = firebase.firestore();
export const auth = firebase.auth();
