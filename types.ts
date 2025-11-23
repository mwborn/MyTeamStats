export interface League {
  id: string;
  name: string;
  season: string;
}

export interface Team {
  id: string;
  name: string;
  isMain: boolean;
  logoUrl?: string;
  location?: string;
  leagueIds: string[];
}

export interface Player {
  id: string;
  teamId: string;
  number: number;
  name: string; // Surname Name
  photoUrl?: string;
  role?: string;
}

export interface Match {
  id: string;
  leagueId: string;
  matchNumber: number;
  round: 'Andata' | 'Ritorno';
  date: string;
  time: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  quarters?: {
    home: number[];
    away: number[];
  };
  isPlayed: boolean;
}

export interface PlayerStats {
  matchId: string;
  playerId: string;
  minutes: string;
  
  // Shooting
  points: number;
  twoPtMade: number;
  twoPtAtt: number;
  threePtMade: number;
  threePtAtt: number;
  ftMade: number;
  ftAtt: number;

  // Rebounds
  rebOff: number;
  rebDef: number;
  
  // Other
  assists: number;
  turnovers: number;
  steals: number;
  blocksMade: number;
  blocksRec: number;
  foulsCommitted: number;
  foulsDrawn: number;
  
  valuation: number; // VPS in CSV
  plusMinus: number;
}

export type UserRole = 'admin' | 'coach' | 'player';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

export interface Settings {
    theme: 'light' | 'dark';
    appName: string;
    appLogoUrl?: string;
}

export interface AppData {
  leagues: League[];
  teams: Team[];
  players: Player[];
  matches: Match[];
  stats: PlayerStats[];
  users: User[];
  settings: Settings;
}
