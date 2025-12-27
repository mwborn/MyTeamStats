import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { AppData, Match } from '../types';
import { Plus, Save, X, Edit2, Trash2, Loader2 } from 'lucide-react';

const Schedule: React.FC = () => {
  const { appData: data, updateAppData, loadingData } = useContext(AppContext);
  const [matchForm, setMatchForm] = useState<Partial<Match>>({ round: 'Andata' });
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  const handleFormChange = (field: keyof Match, value: any) => {
    setMatchForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveMatch = async () => {
    if (!data || !matchForm.leagueId || !matchForm.homeTeamId || !matchForm.awayTeamId) return;
    
    let newMatches = [...data.matches];
    if (editingMatchId) {
        newMatches = newMatches.map(m => m.id === editingMatchId ? { ...m, ...matchForm } as Match : m);
    } else {
        const newMatch: Match = {
          id: `m${Date.now()}`,
          ...matchForm,
          isPlayed: false
        } as Match;
        newMatches.push(newMatch);
    }

    await updateAppData({ ...data, matches: newMatches });
    resetForm();
  };

  const handleStartEdit = (match: Match) => {
    setEditingMatchId(match.id);
    setMatchForm(match);
  };

  const handleDeleteMatch = async (matchId: string) => {
      if (!data) return;
      const matchToDelete = data.matches.find(m => m.id === matchId);
      if (!matchToDelete) return;

      const statsCount = data.stats.filter(s => s.matchId === matchId).length;
      let message = `Are you sure you want to delete this match?`;
      if (statsCount > 0) {
          message = `⚠️ WARNING ⚠️\n\nThis match has ${statsCount} player stats records associated with it. Deleting the match will also PERMANENTLY ERASE these stats.\n\nAre you sure you want to proceed?`;
      }

      if (!window.confirm(message)) return;

      const newMatches = data.matches.filter(m => m.id !== matchId);
      const newStats = data.stats.filter(s => s.matchId !== matchId);
      
      await updateAppData({ ...data, matches: newMatches, stats: newStats });
  };

  const resetForm = () => {
    setEditingMatchId(null);
    setMatchForm({ round: 'Andata' });
  };

  if (loadingData || !data) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-sky-400">Season Schedule</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-100">{editingMatchId ? 'Edit Match' : 'Add Match'}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
          <div className="col-span-1">
             <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">League</label>
             <select className="w-full px-2 py-2 border dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" value={matchForm.leagueId || ''} onChange={e => handleFormChange('leagueId', e.target.value)}>
               <option value="">Select...</option>
               {data.leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
             </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Match #</label>
            <input type="number" className="w-full px-2 py-2 border dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" value={matchForm.matchNumber || ''} onChange={e => handleFormChange('matchNumber', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Round</label>
            <select className="w-full px-2 py-2 border dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" value={matchForm.round} onChange={e => handleFormChange('round', e.target.value as any)}>
               <option value="Andata">Andata</option>
               <option value="Ritorno">Ritorno</option>
             </select>
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date</label>
             <input type="date" className="w-full px-2 py-2 border dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" value={matchForm.date || ''} onChange={e => handleFormChange('date', e.target.value)} />
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Home</label>
             <select className="w-full px-2 py-2 border dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" value={matchForm.homeTeamId || ''} onChange={e => handleFormChange('homeTeamId', e.target.value)}>
               <option value="">Select...</option>
               {data.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Away</label>
             <select className="w-full px-2 py-2 border dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" value={matchForm.awayTeamId || ''} onChange={e => handleFormChange('awayTeamId', e.target.value)}>
               <option value="">Select...</option>
               {data.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveMatch} className="w-full bg-orange-600 text-white py-2 rounded text-sm hover:bg-orange-700 flex-1 flex items-center justify-center gap-2">
              {editingMatchId ? <Save size={16}/> : <Plus size={16}/>}
              <span>{editingMatchId ? 'Save' : 'Add'}</span>
            </button>
            {editingMatchId && <button onClick={resetForm} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><X size={16}/></button>}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-medium border-b dark:border-slate-600">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">League</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Matchup</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {data.matches.sort((a,b) => b.matchNumber - a.matchNumber).map(match => {
              const home = data.teams.find(t => t.id === match.homeTeamId);
              const away = data.teams.find(t => t.id === match.awayTeamId);
              const league = data.leagues.find(l => l.id === match.leagueId);
              const formatQuarters = () => {
                if (!match.quarters) return '';
                const hQ = match.quarters.home.filter((s, i) => s > 0 || match.quarters.away[i] > 0);
                const aQ = match.quarters.away.slice(0, hQ.length);
                if (hQ.length === 0) return '';
                return `(${hQ.map((score, i) => `${score}-${aQ[i]}`).join(', ')})`;
              };

              return (
                <tr key={match.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{match.matchNumber}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{league?.name}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200"><div>{match.date}</div><div className="text-xs text-slate-400">{match.time}</div></td>
                  <td className="px-4 py-3"><span className="font-semibold text-slate-800 dark:text-slate-100">{home?.name}</span><span className="mx-2 text-slate-400">vs</span><span className="font-semibold text-slate-800 dark:text-slate-100">{away?.name}</span></td>
                  <td className="px-4 py-3">{match.isPlayed ? (<div><span className="font-mono font-bold text-base text-slate-800 dark:text-slate-100">{match.homeScore} - {match.awayScore}</span>{match.quarters && (<div className="text-[10px] text-slate-400 mt-0.5 font-mono">{formatQuarters()}</div>)}</div>) : <span className="text-slate-400">-</span>}</td>
                  <td className="px-4 py-3">{match.isPlayed ? (<span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs">Finished</span>) : (<span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs">Scheduled</span>)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleStartEdit(match)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md"><Edit2 size={16}/></button>
                      <button onClick={() => handleDeleteMatch(match.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default Schedule;