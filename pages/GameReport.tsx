import React, { useState, useEffect } from 'react';
import { getDB } from '../services/storage';
import { AppData, Match, PlayerStats, Team } from '../types';
import { Download, ChevronDown } from 'lucide-react';

const GameReport: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [viewTeamId, setViewTeamId] = useState<string>('');

  useEffect(() => {
    setData(getDB());
  }, []);

  useEffect(() => {
      if (selectedMatchId && data) {
          const match = data.matches.find(m => m.id === selectedMatchId);
          if (match) {
              const home = data.teams.find(t => t.id === match.homeTeamId);
              const away = data.teams.find(t => t.id === match.awayTeamId);
              if (home?.isMain) setViewTeamId(home.id);
              else if (away?.isMain) setViewTeamId(away.id);
              else setViewTeamId(home?.id || '');
          }
      }
  }, [selectedMatchId, data]);

  if (!data) return <div>Loading...</div>;

  const matches = data.matches.filter(m => !selectedLeagueId || m.leagueId === selectedLeagueId);
  const currentMatch = data.matches.find(m => m.id === selectedMatchId);
  const stats = currentMatch ? data.stats.filter(s => s.matchId === currentMatch.id) : [];
  
  const league = data.leagues.find(l => l.id === currentMatch?.leagueId);
  const homeTeam = data.teams.find(t => t.id === currentMatch?.homeTeamId);
  const awayTeam = data.teams.find(t => t.id === currentMatch?.awayTeamId);
  const viewingTeam = data.teams.find(t => t.id === viewTeamId);

  const teamStats = stats.filter(s => {
      const p = data.players.find(pl => pl.id === s.playerId);
      return p?.teamId === viewTeamId;
  }).sort((a,b) => {
      const pA = data.players.find(p => p.id === a.playerId);
      const pB = data.players.find(p => p.id === b.playerId);
      return (pA?.number || 0) - (pB?.number || 0);
  });

  const totals = teamStats.reduce((acc, curr) => ({
     points: acc.points + curr.points, minutes: acc.minutes + curr.minutes, twoPtMade: acc.twoPtMade + curr.twoPtMade, twoPtAtt: acc.twoPtAtt + curr.twoPtAtt, threePtMade: acc.threePtMade + curr.threePtMade, threePtAtt: acc.threePtAtt + curr.threePtAtt, ftMade: acc.ftMade + curr.ftMade, ftAtt: acc.ftAtt + curr.ftAtt, rebOff: acc.rebOff + curr.rebOff, rebDef: acc.rebDef + curr.rebDef, assists: acc.assists + curr.assists, turnovers: acc.turnovers + curr.turnovers, steals: acc.steals + curr.steals, blocksMade: acc.blocksMade + curr.blocksMade, blocksRec: acc.blocksRec + curr.blocksRec, foulsCommitted: acc.foulsCommitted + curr.foulsCommitted, foulsDrawn: acc.foulsDrawn + curr.foulsDrawn, valuation: acc.valuation + curr.valuation, plusMinus: acc.plusMinus + curr.plusMinus
  }), { points: 0, minutes: 0, twoPtMade: 0, twoPtAtt: 0, threePtMade: 0, threePtAtt: 0, ftMade: 0, ftAtt: 0, rebOff: 0, rebDef: 0, assists: 0, turnovers: 0, steals: 0, blocksMade: 0, blocksRec: 0, foulsCommitted: 0, foulsDrawn: 0, valuation: 0, plusMinus: 0 });

  const getPct = (m: number, a: number) => a === 0 ? '0%' : `${Math.round((m/a)*100)}%`;
  
  const getPlusMinusColor = (value: number) => {
      if (value <= -6) return 'bg-red-600';
      if (value >= -5 && value <= 2) return 'bg-orange-500';
      if (value >= 3 && value <= 5) return 'bg-lime-500';
      return 'bg-green-600';
  };

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-sky-400 no-print">Game Dashboard</h1>
       <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-end no-print">
          <div>
             <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">League</label>
             <select className="px-3 py-2 border dark:border-slate-600 rounded-lg text-sm min-w-[200px] bg-white dark:bg-slate-700" value={selectedLeagueId} onChange={e => { setSelectedLeagueId(e.target.value); setSelectedMatchId(''); }}><option value="">All Leagues</option>{data.leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Game</label>
             <select className="px-3 py-2 border dark:border-slate-600 rounded-lg text-sm min-w-[200px] bg-white dark:bg-slate-700" value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)}><option value="">Select Game</option>{matches.map(m => { const h = data.teams.find(t=>t.id===m.homeTeamId)?.name; const a = data.teams.find(t=>t.id===m.awayTeamId)?.name; return <option key={m.id} value={m.id}>#{m.matchNumber}: {h} vs {a}</option>})}</select>
          </div>
          {currentMatch && (<div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex items-center"><button className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewTeamId === homeTeam?.id ? 'bg-white dark:bg-slate-600 shadow text-black dark:text-white' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800'}`} onClick={() => setViewTeamId(homeTeam?.id || '')}> {homeTeam?.name} (Home) </button><button className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewTeamId === awayTeam?.id ? 'bg-white dark:bg-slate-600 shadow text-black dark:text-white' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800'}`} onClick={() => setViewTeamId(awayTeam?.id || '')}> {awayTeam?.name} (Away) </button></div>)}
          <div className="flex-1 text-right"><button onClick={() => window.print()} className="bg-slate-900 dark:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ml-auto"><Download size={16} /> Print / PDF</button></div>
       </div>

       {currentMatch ? (
         <div className="print-full bg-white text-black font-sans shadow-lg overflow-hidden max-w-[1200px] mx-auto relative">
            <div className="bg-black text-white p-4 font-mono relative border-b-4 border-white">
                <div className="grid grid-cols-3 items-center">
                    <div className="flex justify-start"><img src={homeTeam?.logoUrl} className="w-16 h-16 bg-white rounded-full p-1" /></div>
                    <div className="text-center text-orange-500">
                        <div className="text-xs uppercase tracking-widest mb-1">{homeTeam?.location || 'COURT'} - {currentMatch.date}</div>
                        <div className="text-4xl font-bold text-red-600 font-digital">{currentMatch.homeScore || 0} - {currentMatch.awayScore || 0}</div>
                        <div className="text-sm mt-1">{homeTeam?.name} vs {awayTeam?.name}</div>
                         {currentMatch.quarters && (
                            <div className="text-xs text-green-400 mx-auto mt-2">
                               <table className="border-collapse text-center w-full">
                                  <thead><tr className="text-slate-500"><th>1</th><th>2</th><th>3</th><th>4</th>{(currentMatch.quarters.home[4] > 0 || currentMatch.quarters.away[4] > 0) && <th>OT1</th>}{(currentMatch.quarters.home[5] > 0 || currentMatch.quarters.away[5] > 0) && <th>OT2</th>}</tr></thead>
                                  <tbody>
                                    <tr className="border-t border-slate-800"><td className="px-1">{currentMatch.quarters.home[0]}</td><td className="px-1">{currentMatch.quarters.home[1]}</td><td className="px-1">{currentMatch.quarters.home[2]}</td><td className="px-1">{currentMatch.quarters.home[3]}</td>{(currentMatch.quarters.home[4] > 0 || currentMatch.quarters.away[4] > 0) && <td className="px-1">{currentMatch.quarters.home[4]}</td>}{(currentMatch.quarters.home[5] > 0 || currentMatch.quarters.away[5] > 0) && <td className="px-1">{currentMatch.quarters.home[5]}</td>}</tr>
                                    <tr><td className="px-1">{currentMatch.quarters.away[0]}</td><td className="px-1">{currentMatch.quarters.away[1]}</td><td className="px-1">{currentMatch.quarters.away[2]}</td><td className="px-1">{currentMatch.quarters.away[3]}</td>{(currentMatch.quarters.home[4] > 0 || currentMatch.quarters.away[4] > 0) && <td className="px-1">{currentMatch.quarters.away[4]}</td>}{(currentMatch.quarters.home[5] > 0 || currentMatch.quarters.away[5] > 0) && <td className="px-1">{currentMatch.quarters.away[5]}</td>}</tr>
                                  </tbody>
                               </table>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end"><img src={awayTeam?.logoUrl} className="w-16 h-16 bg-white rounded-full p-1" /></div>
                </div>
                <div className="flex justify-between text-xs text-white border-t border-slate-700 pt-2 mt-4"><div className="text-yellow-400">Game: #{currentMatch.matchNumber}</div><div>{league?.name} {league?.season}</div></div>
            </div>

            <div className="overflow-x-auto">
               <div className="bg-[#66b64d] text-white px-4 py-1 font-bold text-sm uppercase flex justify-between"><span>Stats for: {viewingTeam?.name}</span><span>{viewingTeam?.isMain ? 'Main Team' : 'Opponent'}</span></div>
               <table className="w-full text-xs border-collapse"><thead ><tr className="bg-[#66b64d] text-white uppercase tracking-tighter"><th className="p-2 text-left sticky left-0 bg-[#66b64d]">Player</th><th className="p-1">Mins</th><th className="p-1" colSpan={3}>2 Points</th><th className="p-1" colSpan={3}>3 Points</th><th className="p-1" colSpan={3}>Free Throws</th><th className="p-1" colSpan={3}>Rebounds</th><th className="p-1" colSpan={2}>Fouls</th><th className="p-1">TO</th><th className="p-1">ST</th><th className="p-1">AS</th><th className="p-1">BK</th><th className="p-1">BA</th><th className="p-1 font-bold">PTS</th><th className="p-1">VPS</th><th className="p-1">+/-</th></tr><tr className="bg-[#5ea846] text-white text-[10px]"><th className="p-1 sticky left-0 bg-[#5ea846]"></th><th className="p-1"></th><th className="p-1">M</th><th className="p-1">A</th><th className="p-1">%</th><th className="p-1">M</th><th className="p-1">A</th><th className="p-1">%</th><th className="p-1">M</th><th className="p-1">A</th><th className="p-1">%</th><th className="p-1">D</th><th className="p-1">O</th><th className="p-1">T</th><th className="p-1">C</th><th className="p-1">D</th><th className="p-1"></th><th className="p-1"></th><th className="p-1"></th><th className="p-1"></th><th className="p-1"></th><th className="p-1"></th><th className="p-1"></th><th className="p-1"></th></tr></thead><tbody className="divide-y divide-slate-200">{teamStats.map((s, idx) => { const p = data.players.find(pl => pl.id === s.playerId); const rowClass = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'; return (<tr key={s.playerId} className={`${rowClass} hover:bg-yellow-50 text-center text-slate-800`}><td className={`p-1 text-left font-bold sticky left-0 ${rowClass}`}><span className="inline-block w-4 mr-1">{p?.number}</span> {p?.name}</td><td className="p-1 font-mono">{s.minutes}</td><td className="p-1">{s.twoPtMade}</td><td className="p-1">{s.twoPtAtt}</td><td className="p-1 font-mono text-slate-700">{getPct(s.twoPtMade, s.twoPtAtt)}</td><td className="p-1">{s.threePtMade}</td><td className="p-1">{s.threePtAtt}</td><td className="p-1 font-mono text-slate-700">{getPct(s.threePtMade, s.threePtAtt)}</td><td className="p-1">{s.ftMade}</td><td className="p-1">{s.ftAtt}</td><td className="p-1 font-mono text-slate-700">{getPct(s.ftMade, s.ftAtt)}</td><td className="p-1">{s.rebDef}</td><td className="p-1">{s.rebOff}</td><td className="p-1 font-bold">{s.rebDef + s.rebOff}</td><td className="p-1">{s.foulsCommitted}</td><td className="p-1">{s.foulsDrawn}</td><td className="p-1">{s.turnovers}</td><td className="p-1">{s.steals}</td><td className="p-1">{s.assists}</td><td className="p-1">{s.blocksMade}</td><td className="p-1">{s.blocksRec}</td><td className="p-1 font-bold bg-yellow-100">{s.points}</td><td className={`p-1 font-bold ${s.valuation > 0 ? 'text-green-600' : 'text-red-600'}`}>{s.valuation}</td><td className={`p-1 font-bold text-white ${getPlusMinusColor(s.plusMinus)}`}>{s.plusMinus}</td></tr>);})}<tr className="bg-[#66b64d] text-white font-bold text-center border-t-2 border-slate-400"><td className="p-2 text-left sticky left-0 bg-[#66b64d]">Grand Total</td><td className="p-1">{totals.minutes}</td><td className="p-1">{totals.twoPtMade}</td><td className="p-1">{totals.twoPtAtt}</td><td className="p-1 text-xs opacity-90">{getPct(totals.twoPtMade, totals.twoPtAtt)}</td><td className="p-1">{totals.threePtMade}</td><td className="p-1">{totals.threePtAtt}</td><td className="p-1 text-xs opacity-90">{getPct(totals.threePtMade, totals.threePtAtt)}</td><td className="p-1">{totals.ftMade}</td><td className="p-1">{totals.ftAtt}</td><td className="p-1 text-xs opacity-90">{getPct(totals.ftMade, totals.ftAtt)}</td><td className="p-1">{totals.rebDef}</td><td className="p-1">{totals.rebOff}</td><td className="p-1 text-white">{totals.rebDef + totals.rebOff}</td><td className="p-1">{totals.foulsCommitted}</td><td className="p-1">{totals.foulsDrawn}</td><td className="p-1">{totals.turnovers}</td><td className="p-1">{totals.steals}</td><td className="p-1">{totals.assists}</td><td className="p-1">{totals.blocksMade}</td><td className="p-1">{totals.blocksRec}</td><td className="p-1 text-lg">{totals.points}</td><td className="p-1">-</td><td className="p-1">-</td></tr></tbody></table></div>
            <div className="p-4 bg-white text-xs text-slate-500 flex justify-between border-t"><span>Generated by BasketStats Pro</span><span>{new Date().toLocaleDateString()}</span></div>
         </div>
       ) : (
         <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl"><Download size={48} className="mb-4 opacity-20" /><p>Select a league and game to view the report.</p></div>
       )}
    </div>
  );
};

export default GameReport;