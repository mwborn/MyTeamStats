import React, { useState, useEffect } from 'react';
import { getDB, saveDB } from '../services/storage';
import { AppData, Match } from '../types';
import { Plus } from 'lucide-react';

const Schedule: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [newMatch, setNewMatch] = useState<Partial<Match>>({ round: 'Andata' });

  useEffect(() => {
    setData(getDB());
  }, []);

  const handleAddMatch = () => {
    if (!data || !newMatch.leagueId || !newMatch.homeTeamId || !newMatch.awayTeamId) return;
    
    const match: Match = {
      id: `m${Date.now()}`,
      leagueId: newMatch.leagueId,
      matchNumber: newMatch.matchNumber || 0,
      round: newMatch.round || 'Andata',
      date: newMatch.date || '',
      time: newMatch.time || '',
      homeTeamId: newMatch.homeTeamId,
      awayTeamId: newMatch.awayTeamId,
      isPlayed: false
    };

    const newData = { ...data, matches: [...data.matches, match] };
    saveDB(newData);
    setData(newData);
    setNewMatch({ round: 'Andata' });
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Season Schedule</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold mb-4">Add Match</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
          <div className="col-span-1">
             <label className="block text-xs font-medium text-slate-500 mb-1">League</label>
             <select 
               className="w-full px-2 py-2 border rounded text-sm"
               value={newMatch.leagueId || ''}
               onChange={e => setNewMatch({...newMatch, leagueId: e.target.value})}
             >
               <option value="">Select...</option>
               {data.leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
             </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Match #</label>
            <input 
              type="number" 
              className="w-full px-2 py-2 border rounded text-sm"
              value={newMatch.matchNumber || ''}
              onChange={e => setNewMatch({...newMatch, matchNumber: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Round</label>
            <select 
               className="w-full px-2 py-2 border rounded text-sm"
               value={newMatch.round}
               onChange={e => setNewMatch({...newMatch, round: e.target.value as any})}
             >
               <option value="Andata">Andata</option>
               <option value="Ritorno">Ritorno</option>
             </select>
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
             <input 
              type="date" 
              className="w-full px-2 py-2 border rounded text-sm"
              value={newMatch.date || ''}
              onChange={e => setNewMatch({...newMatch, date: e.target.value})}
            />
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-500 mb-1">Home</label>
             <select 
               className="w-full px-2 py-2 border rounded text-sm"
               value={newMatch.homeTeamId || ''}
               onChange={e => setNewMatch({...newMatch, homeTeamId: e.target.value})}
             >
               <option value="">Select...</option>
               {data.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-500 mb-1">Away</label>
             <select 
               className="w-full px-2 py-2 border rounded text-sm"
               value={newMatch.awayTeamId || ''}
               onChange={e => setNewMatch({...newMatch, awayTeamId: e.target.value})}
             >
               <option value="">Select...</option>
               {data.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
          </div>
          <div>
            <button onClick={handleAddMatch} className="w-full bg-slate-900 text-white py-2 rounded text-sm hover:bg-slate-800">
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b">
            <tr>
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">League</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Matchup</th>
              <th className="px-6 py-3">Result</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.matches.sort((a,b) => b.matchNumber - a.matchNumber).map(match => {
              const home = data.teams.find(t => t.id === match.homeTeamId);
              const away = data.teams.find(t => t.id === match.awayTeamId);
              const league = data.leagues.find(l => l.id === match.leagueId);
              
              const formatQuarters = () => {
                if (!match.quarters) return '';
                // Only show quarters with non-zero scores for at least one team
                const relevantQuarters = match.quarters.home.map((h, i) => ({ h, a: match.quarters.away[i] }))
                    .filter(q => q.h > 0 || q.a > 0);
                
                if (relevantQuarters.length === 0) return '';
                
                return `(${relevantQuarters.map(q => `${q.h}-${q.a}`).join(', ')})`;
              };

              return (
                <tr key={match.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono">{match.matchNumber}</td>
                  <td className="px-6 py-3 text-slate-500">{league?.name}</td>
                  <td className="px-6 py-3">
                    <div>{match.date}</div>
                    <div className="text-xs text-slate-400">{match.time}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-semibold">{home?.name}</span>
                    <span className="mx-2 text-slate-400">vs</span>
                    <span className="font-semibold">{away?.name}</span>
                  </td>
                  <td className="px-6 py-3">
                    {match.isPlayed ? (
                        <div>
                            <span className="font-mono font-bold text-base">{match.homeScore} - {match.awayScore}</span>
                            {match.quarters && (
                                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                    {formatQuarters()}
                                </div>
                            )}
                        </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-3">
                    {match.isPlayed ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Finished</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">Scheduled</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Schedule;
