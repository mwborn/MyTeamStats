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

  const parseNum = (val: string) => {
    if (!val) return 0;
    const clean = val.replace('%', '').replace(',', '.').trim();
    return parseFloat(clean) || 0;
  };

  const extractQuarters = (row: string[]) => {
    const quarters = [];
    for (let q = 45; q <= 51; q++) quarters.push(parseNum(row[q] || "0"));
    return quarters;
  };

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(';');
    if (row.length < 5) continue;

    const numberStr = row[1];
    if (!numberStr) continue;
    const number = parseInt(numberStr);

    const safeGet = (idx: number) => row[idx] || "0";
    const points = parseNum(safeGet(15));

    let playerId = '';

    if (number === 998) {
      mainTeamPoints = points;
      mainTeamQuarters = extractQuarters(row);
      continue;
    } else if (number === 999) {
      opponentPoints = points;
      opponentTeamQuarters = extractQuarters(row);
      playerId = `team_${opponentTeamId}`;
    } else if (number === 997) {
      playerId = `bench_${mainTeamId}`;
    } else {
      const player = players.find(p => p.number === number && p.teamId === mainTeamId);
      if (player) playerId = player.id;
    }
    
    if (!playerId) continue;

    const stat: PlayerStats = {
      matchId, playerId, minutes: safeGet(40), points,
      twoPtMade: parseNum(safeGet(2)), twoPtAtt: parseNum(safeGet(3)),
      threePtMade: parseNum(safeGet(5)), threePtAtt: parseNum(safeGet(6)),
      ftMade: parseNum(safeGet(12)), ftAtt: parseNum(safeGet(13)),
      rebOff: parseNum(safeGet(22)), rebDef: parseNum(safeGet(23)),
      assists: parseNum(safeGet(25)), turnovers: parseNum(safeGet(26)),
      steals: parseNum(safeGet(30)), blocksMade: parseNum(safeGet(31)),
      blocksRec: parseNum(safeGet(32)), foulsCommitted: parseNum(safeGet(35)),
      foulsDrawn: parseNum(safeGet(36)), valuation: parseNum(safeGet(41)),
      plusMinus: parseNum(safeGet(42))
    };

    stats.push(stat);
  }

  return { stats, mainTeamPoints, opponentPoints, mainTeamQuarters, opponentTeamQuarters };
};