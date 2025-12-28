import { AppData } from '../types';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const DB_COLLECTION = 'data';
const DB_DOC_ID = 'main';

const INITIAL_DATA: AppData = {
  leagues: [
    { id: 'l1', name: 'Campionato DR3 Maschile', season: '25/26' },
    { id: 'l2', name: 'Campionato UISP', season: '25/26' }
  ],
  teams: [
    { id: 't1', name: '4 FUN', isMain: true, location: 'Palabianco', leagueIds: ['l1', 'l2'], logoUrl: 'https://picsum.photos/id/158/100/100' },
    { id: 't2', name: 'JOLLY VINOVO', isMain: false, leagueIds: ['l1'], logoUrl: 'https://picsum.photos/id/177/100/100' },
    { id: 't3', name: 'RIVOLI BASKET', isMain: false, leagueIds: ['l1'], logoUrl: 'https://picsum.photos/id/192/100/100' }
  ],
  players: [
    { id: 'p0', teamId: 't1', number: 0, name: 'MORRA', photoUrl: 'https://picsum.photos/id/64/150/150' },
    { id: 'p3', teamId: 't1', number: 3, name: 'GIAMMELLO', photoUrl: 'https://picsum.photos/id/91/150/150' },
    { id: 'p4', teamId: 't1', number: 4, name: 'ROSA CLOT', photoUrl: 'https://picsum.photos/id/103/150/150' },
    { id: 'p7', teamId: 't1', number: 7, name: 'BENINATI' },
    { id: 'p13', teamId: 't1', number: 13, name: 'CORGIAT A.' },
    { id: 'p17', teamId: 't1', number: 17, name: 'RAMPONE' },
    { id: 'p18', teamId: 't1', number: 18, name: 'CIBRARIO' },
    { id: 'p21', teamId: 't1', number: 21, name: 'ALESSIO' },
    { id: 'p23', teamId: 't1', number: 23, name: 'EMANUELE' },
    { id: 'p33', teamId: 't1', number: 33, name: 'PETRELLI' },
    { id: 'p74', teamId: 't1', number: 74, name: 'SAMMARUCA' },
    { id: 'p91', teamId: 't1', number: 91, name: 'CORGIAT M.' },
  ],
  matches: [
    { 
      id: 'm1', leagueId: 'l1', matchNumber: 5594, round: 'Andata', 
      date: '2025-11-21', time: '21:15', 
      homeTeamId: 't1', awayTeamId: 't2', 
      isPlayed: false 
    }
  ],
  stats: [],
  users: [
    { id: 'u1', username: 'admin', password: 'password', role: 'admin', name: 'Administrator' },
    { id: 'u2', username: 'coach', password: 'password', role: 'coach', name: 'Coach Carter' },
    { id: 'u3', username: 'player', password: 'password', role: 'player', name: 'John Doe' }
  ],
  settings: {
    theme: 'light',
    appName: 'BasketStats Pro',
    appLogoUrl: ''
  }
};

export const getDB = async (): Promise<AppData> => {
  // FIX: Switched to Firebase v9 modular syntax for Firestore document access.
  const docRef = doc(db, DB_COLLECTION, DB_DOC_ID);
  const docSnap = await getDoc(docRef);

  // FIX: Use .exists() method for v9 modular API.
  if (docSnap.exists()) {
    // Basic migration for new fields if needed
    const data = docSnap.data() as AppData;
    let needsUpdate = false;
    if (!data.users) {
      data.users = INITIAL_DATA.users;
      needsUpdate = true;
    }
    if (!data.settings) {
      data.settings = INITIAL_DATA.settings;
      needsUpdate = true;
    }
    if(needsUpdate) {
      await saveDB(data);
    }
    return data;
  } else {
    // Doc doesn't exist, so initialize it
    console.log("No such document! Initializing database...");
    // FIX: Switched to Firebase v9 modular syntax for setting a document.
    await setDoc(docRef, INITIAL_DATA);
    return INITIAL_DATA;
  }
};

export const saveDB = async (data: AppData) => {
  // FIX: Switched to Firebase v9 modular syntax for Firestore document access.
  const docRef = doc(db, DB_COLLECTION, DB_DOC_ID);
  // FIX: Switched to Firebase v9 modular syntax for setting a document.
  await setDoc(docRef, data);
};