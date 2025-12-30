import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { AppData, League, Match, Player, PlayerStats, Settings, Team } from '../types';

// Helper to get initial settings from local storage
const getInitialSettings = (): Settings => {
    const stored = localStorage.getItem('basketstats_settings');
    if (stored) return JSON.parse(stored);
    return {
        theme: 'light',
        appName: 'BasketStats Pro',
        appLogoUrl: ''
    };
};

const defaultAppData: AppData = {
    leagues: [],
    teams: [],
    players: [],
    matches: [],
    stats: [],
    users: [], // User management is handled by Supabase Auth now
    settings: getInitialSettings()
};

interface AppContextType {
  user: SupabaseUser | null;
  session: Session | null;
  appData: AppData;
  loadingAuth: boolean;
  loadingData: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Data manipulation functions
  addLeague: (league: Partial<League>) => Promise<League | null>;
  deleteLeague: (id: string) => Promise<void>;
  addTeam: (team: Partial<Team>) => Promise<Team | null>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<Team | null>;
  deleteTeam: (id: string) => Promise<void>;
  addPlayer: (player: Partial<Player>) => Promise<Player | null>;
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<Player | null>;
  deletePlayer: (id: string) => Promise<void>;
  addMatch: (match: Partial<Match>) => Promise<Match | null>;
  updateMatch: (id: string, updates: Partial<Match>) => Promise<Match | null>;
  deleteMatch: (id: string) => Promise<void>;
  saveStatsForMatch: (matchId: string, stats: PlayerStats[], scores: any, playersToCreate: Partial<Player>[]) => Promise<void>;
  updateSettings: (settings: Settings) => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [appData, setAppData] = useState<AppData>(defaultAppData);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  // Data loading from Supabase
  const loadAppData = async () => {
      setLoadingData(true);
      try {
          const [leaguesRes, teamsRes, playersRes, matchesRes, statsRes] = await Promise.all([
              supabase.from('leagues').select('*'),
              supabase.from('teams').select('*'),
              supabase.from('players').select('*'),
              supabase.from('matches').select('*'),
              supabase.from('player_stats').select('*')
          ]);

          if (leaguesRes.error) throw leaguesRes.error;
          if (teamsRes.error) throw teamsRes.error;
          if (playersRes.error) throw playersRes.error;
          if (matchesRes.error) throw matchesRes.error;
          if (statsRes.error) throw statsRes.error;

          setAppData({
              leagues: leaguesRes.data as League[],
              teams: teamsRes.data as Team[],
              players: playersRes.data as Player[],
              matches: matchesRes.data as Match[],
              stats: statsRes.data as PlayerStats[],
              users: [],
              settings: getInitialSettings()
          });
      } catch (error) {
          console.error("Error loading app data:", error);
          // Set empty data on error
          setAppData(defaultAppData);
      } finally {
          setLoadingData(false);
      }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoadingAuth(false);
      if (session?.user) {
        await loadAppData();
      } else {
        setLoadingData(false);
      }
    };
    
    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN') {
          await loadAppData();
        }
        if (event === 'SIGNED_OUT') {
          setAppData(defaultAppData);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- AUTH METHODS ---
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // --- DATA CUD (Create, Update, Delete) METHODS ---

  const addLeague = async (leagueData: Partial<League>) => {
      const { data, error } = await supabase.from('leagues').insert(leagueData).select().single();
      if (error) throw error;
      if (data) setAppData(prev => ({ ...prev, leagues: [...prev.leagues, data] }));
      return data;
  };
  const deleteLeague = async (id: string) => {
      const { error } = await supabase.from('leagues').delete().eq('id', id);
      if (error) throw error;
      setAppData(prev => ({...prev, leagues: prev.leagues.filter(l => l.id !== id) }));
  };
  
  const addTeam = async (teamData: Partial<Team>) => {
      const { data, error } = await supabase.from('teams').insert(teamData).select().single();
      if (error) throw error;
      if (data) setAppData(prev => ({ ...prev, teams: [...prev.teams, data] }));
      return data;
  };
  const updateTeam = async (id: string, updates: Partial<Team>) => {
      const { data, error } = await supabase.from('teams').update(updates).eq('id', id).select().single();
      if (error) throw error;
      if (data) setAppData(prev => ({ ...prev, teams: prev.teams.map(t => t.id === id ? data : t) }));
      return data;
  };
  const deleteTeam = async (id: string) => {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
      setAppData(prev => ({...prev, teams: prev.teams.filter(t => t.id !== id) }));
  };

  const addPlayer = async (playerData: Partial<Player>) => {
      const { data, error } = await supabase.from('players').insert(playerData).select().single();
      if (error) throw error;
      if (data) setAppData(prev => ({ ...prev, players: [...prev.players, data] }));
      return data;
  };
  const updatePlayer = async (id: string, updates: Partial<Player>) => {
      const { data, error } = await supabase.from('players').update(updates).eq('id', id).select().single();
      if (error) throw error;
      if (data) setAppData(prev => ({...prev, players: prev.players.map(p => p.id === id ? data : p) }));
      return data;
  };
  const deletePlayer = async (id: string) => {
      const { error } = await supabase.from('players').delete().eq('id', id);
      if (error) throw error;
      setAppData(prev => ({...prev, players: prev.players.filter(p => p.id !== id) }));
  };

  const addMatch = async (matchData: Partial<Match>) => {
      const { data, error } = await supabase.from('matches').insert(matchData).select().single();
      if (error) throw error;
      if (data) setAppData(prev => ({...prev, matches: [...prev.matches, data] }));
      return data;
  };
  const updateMatch = async (id: string, updates: Partial<Match>) => {
      const { data, error } = await supabase.from('matches').update(updates).eq('id', id).select().single();
      if (error) throw error;
      if (data) setAppData(prev => ({ ...prev, matches: prev.matches.map(m => m.id === id ? data : m) }));
      return data;
  };
  const deleteMatch = async (id: string) => {
      const { error } = await supabase.from('matches').delete().eq('id', id);
      if (error) throw error;
      setAppData(prev => ({ ...prev, matches: prev.matches.filter(m => m.id !== id) }));
  };

  const saveStatsForMatch = async (matchId: string, stats: PlayerStats[], scores: any, playersToCreate: Partial<Player>[]) => {
      // Create a map to link temporary string IDs to their player number for later retrieval.
      const tempIdToPlayerNumberMap = new Map<string, number>();
      playersToCreate.forEach(p => {
          if(p.id && p.number) tempIdToPlayerNumberMap.set(p.id, p.number)
      });
      
      // Create new "virtual" players if they don't exist (e.g., for bench or opponent totals).
      if (playersToCreate.length > 0) {
          // Remove the temporary string ID before inserting, so the DB can generate a real UUID.
          const creationPayload = playersToCreate.map(({ id, ...rest }) => rest);
          const { data: newPlayers, error: playerError } = await supabase.from('players').insert(creationPayload).select();
          if (playerError) throw playerError;

          // After creation, map the new UUIDs back to the original stats objects.
          const newPlayerMap = new Map<number, string>(); // map number to new UUID
          if(newPlayers) {
              newPlayers.forEach(p => newPlayerMap.set(p.number, p.id));
          }

          // Replace temporary IDs in the stats array with the new, real UUIDs.
          stats = stats.map(stat => {
              const playerNumber = tempIdToPlayerNumberMap.get(stat.playerId);
              if (playerNumber && newPlayerMap.has(playerNumber)) {
                  stat.playerId = newPlayerMap.get(playerNumber)!;
              }
              return stat;
          });
      }
      
      // Clear any existing stats for this match before inserting new ones.
      const { error: deleteError } = await supabase.from('player_stats').delete().eq('matchId', matchId);
      if (deleteError) throw deleteError;

      // Insert the corrected stats. This will no longer fail with a UUID error.
      if (stats.length > 0) {
        const { error: insertError } = await supabase.from('player_stats').insert(stats);
        if (insertError) throw insertError;
      }
      
      // Update the match score.
      const { error: matchError } = await supabase.from('matches').update(scores).eq('id', matchId);
      if (matchError) throw matchError;

      // Reload all data to ensure the UI is consistent with the database.
      await loadAppData();
  };

  const updateSettings = (settings: Settings) => {
      localStorage.setItem('basketstats_settings', JSON.stringify(settings));
      setAppData(prev => ({...prev, settings}));
  };

  const contextValue = {
    user, session, appData, loadingAuth, loadingData,
    login, logout,
    addLeague, deleteLeague,
    addTeam, updateTeam, deleteTeam,
    addPlayer, updatePlayer, deletePlayer,
    addMatch, updateMatch, deleteMatch,
    saveStatsForMatch,
    updateSettings
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};