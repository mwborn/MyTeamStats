import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../services/firebase';
import { AppData, User } from '../types';
import { getDB, saveDB } from '../services/storage';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AppContextType {
  user: User | null;
  appData: AppData | null;
  loadingAuth: boolean;
  loadingData: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAppData: (data: AppData) => Promise<void>;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    // FIX: Switched to Firebase v9 modular syntax for auth state listener.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase user exists, now get our custom user data from Firestore
        // FIX: Switched to Firebase v9 modular syntax for document reference and retrieval.
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUser(userDocSnap.data() as User);
          // Once user is confirmed, load the app data
          setLoadingData(true);
          const data = await getDB();
          setAppData(data);
          setLoadingData(false);
        } else {
          // This case should ideally not happen if user creation is handled correctly
          console.error("Custom user data not found in Firestore!");
          setUser(null);
        }
      } else {
        setUser(null);
        setAppData(null); // Clear data on logout
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    // In a real app, you wouldn't use username as email, but for this migration we adapt
    // The email will be `${username}@yourapp.com`
    // You MUST create users in Firebase Auth with these email formats.
    const email = `${username.toLowerCase()}@basketstats.app`;
    try {
      // FIX: Use v9 modular signInWithEmailAndPassword method.
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        console.error("Firebase login error: ", error);
        // This is a basic migration. For a new setup, you'd create users in Firebase Auth
        // and link them to user profiles in Firestore. Here we simulate it.
        // A real implementation would not store passwords in the DB.
        const localDB = await getDB();
        const localUser = localDB.users.find(u => u.username === username && u.password === password);
        if (localUser) {
            // This is a fallback and security risk, for migration purposes only.
            // You should create the user in Firebase Auth console for this to work properly.
            throw new Error(`User '${username}' not found in Firebase Authentication. Please create it in the Firebase Console with email '${email}' and the same password.`);
        }
        throw new Error("Invalid username or password.");
    }
  };

  const logout = async () => {
    // FIX: Use v9 modular signOut method.
    await signOut(auth);
    // FIX: Navigation is now handled in the component calling logout to ensure router context.
  };

  const updateAppData = async (data: AppData) => {
    setAppData(data); // Optimistic update for UI speed
    await saveDB(data);
  };

  return (
    <AppContext.Provider value={{ user, appData, loadingAuth, loadingData, login, logout, updateAppData }}>
      {children}
    </AppContext.Provider>
  );
};