import React, { createContext, useState, useEffect, ReactNode } from 'react';
// FIX: Switched to Firebase v9 compat imports to resolve module export errors.
// By using `import type`, we prevent this module from being bundled twice,
// which was causing the issue where the firestore service wasn't attached
// to the correct firebase instance.
import type firebase from 'firebase/compat/app';
import { auth, db } from '../services/firebase';
import { AppData, User } from '../types';
import { getDB, saveDB } from '../services/storage';
// FIX: Replaced useNavigate hook with useHistory for v5 compatibility.
import { useHistory } from 'react-router-dom';

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
  // FIX: Switched to useHistory hook.
  const history = useHistory();

  useEffect(() => {
    // FIX: Use v8/compat auth.onAuthStateChanged method.
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: firebase.User | null) => {
      if (firebaseUser) {
        // Firebase user exists, now get our custom user data from Firestore
        // FIX: Use v8/compat db.collection().doc() syntax.
        const userDocRef = db.collection('users').doc(firebaseUser.uid);
        // FIX: Use v8/compat .get() method on doc reference.
        const userDocSnap = await userDocRef.get();
        // FIX: Use .exists property instead of .exists() method for v8/compat API.
        if (userDocSnap.exists) {
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
      // FIX: Use v8/compat auth.signInWithEmailAndPassword method.
      await auth.signInWithEmailAndPassword(email, password);
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
    // FIX: Use v8/compat auth.signOut method.
    await auth.signOut();
    // FIX: Navigation is now handled in the component calling logout to ensure router context.
    // history.push('/login');
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