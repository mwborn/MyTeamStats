import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { supabase } from '../services/supabase';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { AppData } from '../types';
import { getDB, saveDB } from '../services/storage';

interface AppContextType {
  user: User | null;
  session: Session | null;
  appData: AppData | null;
  loadingAuth: boolean;
  loadingData: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAppData: (data: AppData) => Promise<void>;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoadingAuth(false);
      
      if (session?.user) {
        loadInitialData();
      }
    };
    
    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN') {
          loadInitialData();
        }
        if (event === 'SIGNED_OUT') {
          setAppData(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const loadInitialData = async () => {
      setLoadingData(true);
      const data = getDB(); // Ancora da localStorage per ora
      setAppData(data);
      setLoadingData(false);
  }

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateAppData = async (data: AppData) => {
    // Per ora, continuiamo a salvare localmente.
    // Questo verrà sostituito con chiamate a Supabase.
    setAppData(data);
    saveDB(data);
  };

  return (
    <AppContext.Provider value={{ user, session, appData, loadingAuth, loadingData, login, logout, updateAppData }}>
      {children}
    </AppContext.Provider>
  );
};
