import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Download, Filter, Loader2 } from 'lucide-react';

const TeamStats: React.FC = () => {
  const { appData, loadingData } = useContext(AppContext);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  useEffect(() => {
    if (appData) {
      const mainTeam = appData.teams.find(t => t.isMain);
      if (mainTeam) setSelectedTeamId(mainTeam.id);
    }
  }, [appData]);

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  const formatPercentage = (made: number, att: number) => {
    if (att === 0) return '0%';
    return `${Math.round((made / att) * 100)}%`;
  };

  const safeDiv = (num: number, den: number, decimals = 2) => {
    if (den === 0) return '0.00';
    return (num / den).toFixed(decimals);
  };

  const matches = appData.matches.filter(m => {
    const leagueMatch = !selectedLeagueId || m.leagueId === selectedLeagueId;
    const teamMatch = m.homeTeamId === selectedTeamId || m.awayTeamId === selectedTeamId;
    return leagueMatch && teamMatch && m.isPlayed;
  });

  const team = appData.teams.find(t => t.id === selectedTeamId);
  const players = appData.players.filter(p => p.teamId === selectedTeamId && p.number <= 900);

  let teamTotals = { gamesPlayed: matches.length, wins: 0, pointsScored: 0, pointsConceded: 0, quartersScored: [0, 0, 0, 0, 0, 0], quartersConceded: [0, 0, 0, 0, 0, 0] };

  matches.forEach(m => {
    const isHome = m.homeTeamId === selectedTeamId;
    const ourScore = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
    const oppScore = isHome ? (m.awayScore || 0) : (m.homeScore || 0);
    teamTotals.pointsScored += ourScore;
    teamTotals.pointsConceded += oppScore;
    if (ourScore > oppScore) teamTotals.wins++;
    if (m.quarters) {
        const ourQ = isHome ? m.quarters.home : m.quarters.away;
        const oppQ = isHome ? m.quarters.away : m.quarters.home;
        ourQ.forEach((q, i) => { if(i < 6) teamTotals.quartersScored[i] += q; });
        oppQ.forEach((q, i) => { if(i < 6) teamTotals.quartersConceded[i] += q; });
    }
  });

  const playerAggregates = players.map(player => {
    const pStats = appData.stats.filter(s => s.playerId === player.id && matches.some(m => m.id === s.matchId));
    const agg = pStats.reduce((acc, curr) => ({
      games: acc.games + 1, minutes: acc.minutes + curr.minutes, points: acc.points + curr.points, twoPtMade: acc.twoPtMade + curr.twoPtMade, twoPtAtt: acc.twoPtAtt + curr.twoPtAtt, threePtMade: acc.threePtMade + curr.threePtMade, threePtAtt: acc.threePtAtt + curr.threePtAtt, ftMade: acc.ftMade + curr.ftMade, ftAtt: acc.ftAtt + curr.ftAtt, rebDef: acc.rebDef + curr.rebDef, rebOff: acc.rebOff + curr.rebOff, foulsCommitted: acc.foulsCommitted + curr.foulsCommitted, foulsDrawn: acc.foulsDrawn + curr.foulsDrawn, turnovers: acc.turnovers + curr.turnovers, steals: acc.steals + curr.steals, assists: acc.assists + curr.assists, blocksMade: acc.blocksMade + curr.blocksMade, blocksRec: acc.blocksRec + curr.blocksRec, valuation: acc.valuation + curr.valuation, plusMinus: acc.plusMinus + curr.plusMinus
    }), { games: 0, minutes: 0, points: 0, twoPtMade: 0, twoPtAtt: 0, threePtMade: 0, threePtAtt: 0, ftMade: 0, ftAtt: 0, rebDef: 0, rebOff: 0, foulsCommitted: 0, foulsDrawn: 0, turnovers: 0, steals: 0, assists: 0, blocksMade: 0, blocksRec: 0, valuation: 0, plusMinus: 0 });
    return { player, ...agg };
  }).sort((a, b) => b.points - a.points);

  const tableTotals = playerAggregates.reduce((acc, curr) => ({
      minutes: acc.minutes + curr.minutes, points: acc.points + curr.points, games: acc.games + curr.games, twoPtMade: acc.twoPtMade + curr.twoPtMade, twoPtAtt: acc.twoPtAtt + curr.twoPtAtt, threePtMade: acc.threePtMade + curr.threePtMade, threePtAtt: acc.threePtAtt + curr.threePtAtt, ftMade: acc.ftMade + curr.ftMade, ftAtt: acc.ftAtt + curr.ftAtt, rebDef: acc.rebDef + curr.rebDef, rebOff: acc.rebOff + curr.rebOff, foulsCommitted: acc.foulsCommitted + curr.foulsCommitted, foulsDrawn: acc.foulsDrawn + curr.foulsDrawn, turnovers: acc.turnovers + curr.turnovers, steals: acc.steals + curr.steals, assists: acc.assists + curr.assists, blocksMade: acc.blocksMade + curr.blocksMade, blocksRec: acc.blocksRec + curr.blocksRec, valuation: acc.valuation + curr.valuation, plusMinus: acc.plusMinus + curr.plusMinus
  }), { minutes: 0, points: 0, games: 0, twoPtMade: 0, twoPtAtt: 0, threePtMade: 0, threePtAtt: 0, ftMade: 0, ftAtt: 0, rebDef: 0, rebOff: 0, foulsCommitted: 0, foulsDrawn: 0, turnovers: 0, steals: 0, assists: 0, blocksMade: 0, blocksRec: 0, valuation: 0, plusMinus: 0 });

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-sky-400 no-print">Team Season Stats</h1>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-end no-print">
         <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">League</label>
            <select className="px-3 py-2 border dark:border-slate-600 rounded-lg text-sm min-w-[200px] bg-white dark:bg-slate-700" value={selectedLeagueId} onChange={e => setSelectedLeagueId(e.target.value)}>
              <option value="">All Leagues</option>
              {appData.leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
         </div>
         <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Team</label>
            <select className="px-3 py-2 border dark:border-slate-600 rounded-lg text-sm min-w-[200px] bg-white dark:bg-slate-700" value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)}>
              <option value="">Select Team</option>
              {appData.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
         </div>
         <div className="flex-1 text-right">
             <button onClick={() => window.print()} className="bg-slate-900 dark:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ml-auto">
               <Download size={16} /> Print / PDF
             </button>
         </div>
      </div>

      {team ? (
        <div className="print-full bg-white font-sans shadow-lg overflow-hidden max-w-[1200px] mx-auto">
            <div className="bg-black text-white p-1 border-b-2 border-slate-800">
               <div className="grid grid-cols-3 gap-1">
                  <div className="col-span-1 p-4 flex flex-col justify-between">
                     <div className="flex items-center gap-4 mb-4">
                        {team.logoUrl && <img src={team.logoUrl} className="w-16 h-16 bg-white rounded-full p-1" />}
                        <div>
                            <h1 className="text-xl font-bold text-green-500 uppercase tracking-widest">{team.name}</h1>
                            <div className="text-xs text-slate-400">{appData.leagues.find(l => l.id === selectedLeagueId)?.name || 'Season Totals'}</div>
                        </div>
                     </div>
                     <div className="space-y-1 text-sm font-mono"><div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-red-500">TOTALE FATTI</span><span className="text-xl font-bold font-digital text-red-500">{teamTotals.pointsScored}</span></div><div className="flex justify-between pt-1"><span className="text-yellow-500">TOTALE SUBITI</span><span className="text-xl font-bold font-digital text-yellow-500">{teamTotals.pointsConceded}</span></div></div>
                  </div>
                  <div className="col-span-1 p-2 flex flex-col justify-center"><table className="w-full text-center text-xs border border-slate-700"><thead className="bg-[#66b64d] text-white"><tr><th className="py-1">Q</th><th>1</th><th>2</th><th>3</th><th>4</th><th>OT</th></tr></thead><tbody className="bg-slate-900 text-white font-mono"><tr className="border-b border-slate-700"><td className="bg-slate-800 text-green-400 font-bold">PTS</td><td>{teamTotals.quartersScored[0]}</td><td>{teamTotals.quartersScored[1]}</td><td>{teamTotals.quartersScored[2]}</td><td>{teamTotals.quartersScored[3]}</td><td>{teamTotals.quartersScored[4] + teamTotals.quartersScored[5]}</td></tr><tr><td className="bg-slate-800 text-red-400 font-bold">OPP</td><td>{teamTotals.quartersConceded[0]}</td><td>{teamTotals.quartersConceded[1]}</td><td>{teamTotals.quartersConceded[2]}</td><td>{teamTotals.quartersConceded[3]}</td><td>{teamTotals.quartersConceded[4] + teamTotals.quartersConceded[5]}</td></tr></tbody></table></div>
                  <div className="col-span-1 p-4 bg-slate-900/50 flex flex-col justify-center space-y-2 text-xs"><div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded"><span>GAMES PLAYED</span><span className="font-bold text-white text-lg">{teamTotals.gamesPlayed}</span></div><div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded"><span>GAMES WON</span><span className="font-bold text-green-400 text-lg">{teamTotals.wins}</span></div><div className="flex justify-between items-center border-t border-slate-700 pt-2 mt-2"><span className="text-[10px] text-slate-400">AVG PTS SCORED</span><span className="font-bold text-white">{safeDiv(teamTotals.pointsScored, teamTotals.gamesPlayed)}</span></div><div className="flex justify-between items-center"><span className="text-[10px] text-slate-400">AVG PTS CONCEDED</span><span className="font-bold text-white">{safeDiv(teamTotals.pointsConceded, teamTotals.gamesPlayed)}</span></div></div>
               </div>
            </div>

            <div className="overflow-x-auto"><table className="w-full text-[10px] border-collapse text-center"><thead ><tr className="bg-[#66b64d] text-white uppercase tracking-tighter"><th className="p-2 text-left sticky left-0 bg-[#66b64d] border-r border-green-600 min-w-[120px]">Player</th><th className="p-1">Mins</th><th className="p-1 border-l border-green-600" colSpan={3}>2 Points</th><th className="p-1 border-l border-green-600" colSpan={3}>3 Points</th><th className="p-1 border-l border-green-600" colSpan={3}>Free Throws</th><th className="p-1 border-l border-green-600" colSpan={3}>Field Goals</th><th className="p-1 border-l border-green-600" colSpan={2}>Rebounds</th><th className="p-1 border-l border-green-600" colSpan={2}>Fouls</th><th className="p-1 border-l border-green-600">TO</th><th className="p-1">ST</th><th className="p-1">AS</th><th className="p-1">BK</th><th className="p-1">BA</th><th className="p-1 border-l border-green-600 font-bold bg-[#559e3d]">PTS</th><th className="p-1 border-l border-green-600">G</th><th className="p-1">AVG PT</th><th className="p-1">AVG MIN</th><th className="p-1 font-bold">VPS</th></tr><tr className="bg-[#5ea846] text-white"><th className="sticky left-0 bg-[#5ea846] border-r border-green-600"></th><th>Total</th><th className="border-l border-green-600">M</th><th>A</th><th>%</th><th className="border-l border-green-600">M</th><th>A</th><th>%</th><th className="border-l border-green-600">M</th><th>A</th><th>%</th><th className="border-l border-green-600">M</th><th>A</th><th>%</th><th className="border-l border-green-600">D</th><th>O</th><th className="border-l border-green-600">C</th><th>D</th><th className="border-l border-green-600"></th><th></th><th></th><th></th><th></th><th className="border-l border-green-600 bg-[#559e3d]">Tot</th><th className="border-l border-green-600"></th><th></th><th></th><th>Avg</th></tr></thead><tbody className="divide-y divide-slate-100">{playerAggregates.map((row, idx) => { const fgMade = row.twoPtMade + row.threePtMade; const fgAtt = row.twoPtAtt + row.threePtAtt; const rowClass = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'; return (<tr key={row.player.id} className={`${rowClass} hover:bg-yellow-50 text-slate-800`}><td className={`p-1 text-left font-bold sticky left-0 ${rowClass} border-r border-slate-200`}><span className="inline-block w-4 mr-1 text-slate-400">{row.player.number}</span> {row.player.name}</td><td className="p-1">{Math.round(row.minutes)}</td><td className="p-1 border-l border-slate-100">{row.twoPtMade}</td><td className="p-1">{row.twoPtAtt}</td><td className="p-1 text-slate-700">{formatPercentage(row.twoPtMade, row.twoPtAtt)}</td><td className="p-1 border-l border-slate-100">{row.threePtMade}</td><td className="p-1">{row.threePtAtt}</td><td className="p-1 text-slate-700">{formatPercentage(row.threePtMade, row.threePtAtt)}</td><td className="p-1 border-l border-slate-100">{row.ftMade}</td><td className="p-1">{row.ftAtt}</td><td className="p-1 text-slate-700">{formatPercentage(row.ftMade, row.ftAtt)}</td><td className="p-1 border-l border-slate-100 bg-slate-50/50">{fgMade}</td><td className="p-1 bg-slate-50/50">{fgAtt}</td><td className="p-1 text-slate-700 bg-slate-50/50">{formatPercentage(fgMade, fgAtt)}</td><td className="p-1 border-l border-slate-100">{row.rebDef}</td><td className="p-1">{row.rebOff}</td><td className="p-1 border-l border-slate-100">{row.foulsCommitted}</td><td className="p-1">{row.foulsDrawn}</td><td className="p-1 border-l border-slate-100">{row.turnovers}</td><td className="p-1">{row.steals}</td><td className="p-1">{row.assists}</td><td className="p-1">{row.blocksMade}</td><td className="p-1">{row.blocksRec}</td><td className="p-1 border-l border-slate-200 font-bold bg-yellow-100">{row.points}</td><td className="p-1 border-l border-slate-100">{row.games}</td><td className="p-1 font-semibold text-slate-800">{safeDiv(row.points, row.games)}</td><td className="p-1 text-slate-700">{safeDiv(row.minutes, row.games, 0)}</td><td className={`p-1 font-bold ${row.valuation >= 0 ? 'text-green-600' : 'text-red-600'}`}>{safeDiv(row.valuation, row.games)}</td></tr>);})}<tr className="bg-[#66b64d] text-white font-bold border-t-2 border-green-700"><td className="p-2 text-left sticky left-0 bg-[#66b64d] border-r border-green-500">GRAND TOTAL</td><td className="p-1">{Math.round(tableTotals.minutes)}</td><td className="p-1 border-l border-green-500">{tableTotals.twoPtMade}</td><td className="p-1">{tableTotals.twoPtAtt}</td><td className="p-1 text-green-100 font-normal">{formatPercentage(tableTotals.twoPtMade, tableTotals.twoPtAtt)}</td><td className="p-1 border-l border-green-500">{tableTotals.threePtMade}</td><td className="p-1">{tableTotals.threePtAtt}</td><td className="p-1 text-green-100 font-normal">{formatPercentage(tableTotals.threePtMade, tableTotals.threePtAtt)}</td><td className="p-1 border-l border-green-500">{tableTotals.ftMade}</td><td className="p-1">{tableTotals.ftAtt}</td><td className="p-1 text-green-100 font-normal">{formatPercentage(tableTotals.ftMade, tableTotals.ftAtt)}</td><td className="p-1 border-l border-green-500">{tableTotals.twoPtMade + tableTotals.threePtMade}</td><td className="p-1">{tableTotals.twoPtAtt + tableTotals.threePtAtt}</td><td className="p-1 text-green-100 font-normal">{formatPercentage(tableTotals.twoPtMade + tableTotals.threePtMade, tableTotals.twoPtAtt + tableTotals.threePtAtt)}</td><td className="p-1 border-l border-green-500">{tableTotals.rebDef}</td><td className="p-1">{tableTotals.rebOff}</td><td className="p-1 border-l border-green-500">{tableTotals.foulsCommitted}</td><td className="p-1">{tableTotals.foulsDrawn}</td><td className="p-1 border-l border-green-500">{tableTotals.turnovers}</td><td className="p-1">{tableTotals.steals}</td><td className="p-1">{tableTotals.assists}</td><td className="p-1">{tableTotals.blocksMade}</td><td className="p-1">{tableTotals.blocksRec}</td><td className="p-1 border-l border-green-500 bg-[#559e3d] text-lg">{tableTotals.points}</td><td className="p-1 border-l border-green-500">{teamTotals.gamesPlayed}</td><td className="p-1">{safeDiv(tableTotals.points, teamTotals.gamesPlayed)}</td><td className="p-1">{safeDiv(tableTotals.minutes / teamTotals.gamesPlayed * 5, teamTotals.gamesPlayed > 0 ? 5 : 0, 0)}</td><td className="p-1">-</td></tr></tbody></table></div>

            <div className="p-4 bg-white text-xs text-slate-500 flex justify-between border-t">
               <div>Team Season Report</div>
               <div>{new Date().toLocaleDateString()}</div>
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-700">
           <Filter size={48} className="mb-4 opacity-20" />
           <p>Select a team to view the season statistics.</p>
        </div>
      )}
    </div>
  );
};

export default TeamStats;