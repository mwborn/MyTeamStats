import { Player, PlayerStats } from "../types";

export interface CSVParseResult {
  stats: PlayerStats[];
  mainTeamPoints: number;
  opponentPoints: number;
  mainTeamQuarters: number[];
  opponentTeamQuarters: number[];
}

export const parseCSVStats = (
  csvContent: string, 
  matchId: string, 
  players: Player[],
  mainTeamId: string,
  opponentTeamId: string
): CSVParseResult => {
  const lines = csvContent.split('\n');
  const stats: PlayerStats[] = [];
  let mainTeamPoints = 0;
  let opponentPoints = 0;
  let mainTeamQuarters: number[] = [];
  let opponentTeamQuarters: number[] = [];

  // European format helper: "25,00%" -> 25.00
  const parseNum = (val: string) => {
    if (!val) return 0;
    const clean = val.replace('%', '').replace(',', '.').trim();
    return parseFloat(clean) || 0;
  };

  // Helper to extract quarters (Q1-Q4, OT1-OT3)
  // Indices based on CSV: Q1 is 45, Q2 is 46, ... OT3 is 51
  const extractQuarters = (row: string[]) => {
    const quarters = [];
    // Q1-Q4
    for (let q = 45; q <= 48; q++) quarters.push(parseNum(row[q] || "0"));
    // OT1-OT3
    for (let ot = 49; ot <= 51; ot++) quarters.push(parseNum(row[ot] || "0"));
    return quarters;
  };

  // Skip header, process rows
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(';');
    if (row.length < 5) continue;

    const numberStr = row[1];
    if (!numberStr) continue;
    const number = parseInt(numberStr);

    const safeGet = (idx: number) => row[idx] || "0";
    const points = parseNum(safeGet(15));

    let playerId = '';

    // Check for Main Team Summary (998)
    if (number === 998) {
      mainTeamPoints = points;
      mainTeamQuarters = extractQuarters(row);
      continue;
    }

    // Check for Opponent Team Summary (999)
    if (number === 999) {
      opponentPoints = points;
      opponentTeamQuarters = extractQuarters(row);
      playerId = `team_${opponentTeamId}`;
    }
    // Check for Bench Tech (997)
    else if (number === 997) {
      playerId = `bench_${mainTeamId}`;
    }
    // Regular Players
    else {
      const player = players.find(p => p.number === number && p.teamId === mainTeamId);
      if (player) {
        playerId = player.id;
      }
    }
    
    // Stop if unknown player/entity
    if (!playerId) continue;

    // Mapping based on CSV Header
    const stat: PlayerStats = {
      matchId,
      playerId: playerId,
      minutes: safeGet(40), // Mins. Full
      points: points,
      twoPtMade: parseNum(safeGet(2)),
      twoPtAtt: parseNum(safeGet(3)),
      threePtMade: parseNum(safeGet(5)),
      threePtAtt: parseNum(safeGet(6)),
      ftMade: parseNum(safeGet(12)),
      ftAtt: parseNum(safeGet(13)),
      rebOff: parseNum(safeGet(22)),
      rebDef: parseNum(safeGet(23)),
      assists: parseNum(safeGet(25)),
      turnovers: parseNum(safeGet(26)),
      steals: parseNum(safeGet(30)),
      blocksMade: parseNum(safeGet(31)),
      blocksRec: parseNum(safeGet(32)), 
      foulsCommitted: parseNum(safeGet(35)),
      foulsDrawn: parseNum(safeGet(36)),
      valuation: parseNum(safeGet(41)), // VPS
      plusMinus: parseNum(safeGet(42))
    };

    stats.push(stat);
  }

  return { stats, mainTeamPoints, opponentPoints, mainTeamQuarters, opponentTeamQuarters };
};
