import React, { useState, useEffect } from 'react';
import { getDB, saveDB } from '../services/storage';
import { AppData, Player, Team, League, PlayerStats, Match } from '../types';
import { Plus, Trash2, Shield, User, Edit2, Save, X, Upload, AlertCircle, Image as ImageIcon } from 'lucide-react';

const Roster: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('players');
  
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerForm, setPlayerForm] = useState<Partial<Player>>({});
  const [playerError, setPlayerError] = useState<string | null>(null);
  
  const [newLeague, setNewLeague] = useState<Partial<League>>({ season: '25/26' });
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState<Partial<Team>>({ leagueIds: [] });

  useEffect(() => {
    setData(getDB());
  }, []);

  const startEditPlayer = (player?: Player) => {
    setPlayerError(null);
    if (player) {
      setEditingPlayerId(player.id);
      setPlayerForm({ ...player });
    } else {
      setEditingPlayerId('new');
      setPlayerForm({ number: 0, name: '', teamId: '', photoUrl: '' });
    }
  };

  const cancelEditPlayer = () => {
    setEditingPlayerId(null);
    setPlayerForm({});
    setPlayerError(null);
  };

  const handlePlayerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
          alert("Image is large. Recommended size < 2MB.");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlayerForm(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePlayer = (idToDelete: string) => {
    if (!data) return;
    const player = data.players.find(p => p.id === idToDelete);
    if (!player) return;

    const statsCount = data.stats.filter(s => s.playerId === idToDelete).length;
    let message = `Are you sure you want to delete ${player.name}?`;
    if (statsCount > 0) {
        message = `⚠️ WARNING ⚠️\n\n${player.name} has stats in ${statsCount} matches. Deleting this player will PERMANENTLY ERASE all their statistics.\n\nProceed with deletion?`;
    }
    if (!window.confirm(message)) return;

    const updatedPlayers = data.players.filter(p => p.id !== idToDelete);
    const updatedStats = data.stats.filter(s => s.playerId !== idToDelete);
    const newData = { ...data, players: updatedPlayers, stats: updatedStats };
    saveDB(newData);
    setData(newData);
    if (editingPlayerId === idToDelete) {
        cancelEditPlayer();
    }
  };

  const handleSavePlayer = () => {
    if (!data) return;
    if (!playerForm.name?.trim()) { setPlayerError("Player name is required."); return; }
    if (!playerForm.teamId) { setPlayerError("Team assignment is required."); return; }
    const isDuplicate = data.players.some(p => p.teamId === playerForm.teamId && p.number === playerForm.number && p.id !== editingPlayerId);
    if (isDuplicate) { setPlayerError(`Jersey #${playerForm.number} is already taken in this team.`); return; }
    let newData: AppData;
    if (editingPlayerId === 'new') {
        const newPlayer: Player = { id: `p${Date.now()}`, ...playerForm } as Player;
        newData = { ...data, players: [...data.players, newPlayer] };
    } else {
        const updatedPlayers = data.players.map(p => p.id === editingPlayerId ? { ...p, ...playerForm } as Player : p);
        newData = { ...data, players: updatedPlayers };
    }
    saveDB(newData);
    setData(newData);
    cancelEditPlayer();
  };

  const startEditTeam = (team?: Team) => {
    if (team) {
        setEditingTeamId(team.id);
        setTeamForm({ ...team });
    } else {
        setEditingTeamId('new');
        setTeamForm({ isMain: false, leagueIds: [], logoUrl: '', location: '', name: '' });
    }
  };

  const cancelEditTeam = () => {
      setEditingTeamId(null);
      setTeamForm({});
  };

  const handleTeamLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeamForm(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleLeagueForTeam = (leagueId: string) => {
    const current = teamForm.leagueIds || [];
    if (current.includes(leagueId)) {
        setTeamForm({ ...teamForm, leagueIds: current.filter(id => id !== leagueId) });
    } else {
        setTeamForm({ ...teamForm, leagueIds: [...current, leagueId] });
    }
  };

  const handleDeleteTeam = () => {
      if (!data || !editingTeamId || editingTeamId === 'new') return;
      const team = data.teams.find(t => t.id === editingTeamId);
      if (!team) return;
      const playersInTeam = data.players.filter(p => p.teamId === editingTeamId);
      const matchesInvolvingTeam = data.matches.filter(m => m.homeTeamId === editingTeamId || m.awayTeamId === editingTeamId);
      let message = `Are you sure you want to delete team "${team.name}"?`;
      const impacts = [];
      if (playersInTeam.length > 0) impacts.push(`${playersInTeam.length} Players (and all their stats)`);
      if (matchesInvolvingTeam.length > 0) impacts.push(`${matchesInvolvingTeam.length} Matches`);
      if (impacts.length > 0) message = `⚠️ WARNING: Deleting "${team.name}" will also permanently delete:\n\n- ${impacts.join('\n- ')}\n\nThis action cannot be undone. Are you sure you want to proceed?`;
      if (!window.confirm(message)) return;
      const playerIdsToDelete = playersInTeam.map(p => p.id);
      const newPlayers = data.players.filter(p => p.teamId !== editingTeamId);
      const newStats = data.stats.filter(s => !playerIdsToDelete.includes(s.playerId));
      const newMatches = data.matches.filter(m => m.homeTeamId !== editingTeamId && m.awayTeamId !== editingTeamId);
      const newTeams = data.teams.filter(t => t.id !== editingTeamId);
      saveDB({ ...data, teams: newTeams, players: newPlayers, matches: newMatches, stats: newStats });
      setData(getDB());
      cancelEditTeam();
  };

  const handleSaveTeam = () => {
    if (!data || !teamForm.name) return;
    let newTeams = [...data.teams];
    if (teamForm.isMain) newTeams = newTeams.map(t => ({ ...t, isMain: false }));
    if (editingTeamId === 'new') {
        const newTeam: Team = { id: `t${Date.now()}`, ...teamForm } as Team;
        newTeams.push(newTeam);
    } else {
        newTeams = newTeams.map(t => t.id === editingTeamId ? { ...t, ...teamForm } as Team : t);
    }
    saveDB({ ...data, teams: newTeams });
    setData(getDB());
    cancelEditTeam();
  };

  const handleAddLeague = () => {
    if (!data || !newLeague.name) return;
    const league: League = { id: `l${Date.now()}`, name: newLeague.name, season: newLeague.season || '' };
    saveDB({ ...data, leagues: [...data.leagues, league] });
    setData(getDB());
    setNewLeague({ ...newLeague, name: '' });
  };

  const deleteLeague = (id: string) => {
    if (!data || !window.confirm("Delete league? This will also remove it from any teams and delete associated matches.")) return;
    const newMatches = data.matches.filter(m => m.leagueId !== id);
    const newLeagues = data.leagues.filter(l => l.id !== id);
    const newTeams = data.teams.map(t => ({ ...t, leagueIds: t.leagueIds.filter(lid => lid !== id) }));
    saveDB({ ...data, leagues: newLeagues, matches: newMatches, teams: newTeams });
    setData(getDB());
  };

  if (!data) return <div>Loading...</div>;

  const mainTeam = data.teams.find(t => t.isMain);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-sky-400">Management</h1>
        <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
          <button type="button" onClick={() => setActiveTab('players')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'players' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-300'}`}>Players</button>
          <button type="button" onClick={() => setActiveTab('teams')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'teams' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-300'}`}>Teams & Leagues</button>
        </div>
      </div>
      {activeTab === 'players' && (
        <div className="space-y-4">
           <div className="flex justify-between items-center"><h2 className="text-lg font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200"><User size={20} className="text-orange-600" /> Roster</h2>{!editingPlayerId && (<button type="button" onClick={() => startEditPlayer()} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-orange-700 shadow-sm"><Plus size={16} /> Add Player</button>)}</div>
           {editingPlayerId && (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-orange-100 dark:border-orange-800 shadow-lg animate-in fade-in slide-in-from-top-4 relative">
                <div className="flex justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4"><h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">{editingPlayerId === 'new' ? 'Add New Player' : 'Edit Player Details'}</h3><button type="button" onClick={cancelEditPlayer} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24}/></button></div>
                {playerError && (<div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg flex items-start gap-3 border border-red-100 dark:border-red-800"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span>{playerError}</span></div>)}
                <div className="flex flex-col md:flex-row gap-8">
                   <div className="flex flex-col items-center gap-4"><div className="w-32 h-32 rounded-full bg-slate-50 dark:bg-slate-700 border-4 border-white dark:border-slate-600 shadow-md flex items-center justify-center overflow-hidden relative group">{playerForm.photoUrl ? (<img src={playerForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />) : (<User size={48} className="text-slate-300 dark:text-slate-500" />)}<label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Upload size={24} className="mb-1" /><span className="text-xs font-medium">Change</span><input type="file" accept="image/png, image/jpeg" onChange={handlePlayerImageUpload} className="hidden" /></label></div><div className="text-center"><p className="text-xs text-slate-400">Allowed: JPG, PNG</p></div></div>
                   <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Full Name</label><input type="text" placeholder="e.g. ROSSI Mario" className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-600 focus:border-orange-500 outline-none transition-all" value={playerForm.name || ''} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} /></div>
                      <div><label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Team</label><select className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-600 focus:border-orange-500 outline-none transition-all" value={playerForm.teamId || ''} onChange={e => setPlayerForm({...playerForm, teamId: e.target.value})}><option value="">Select Team...</option>{data.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                      <div><label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Jersey Number</label><input type="number" min="0" max="99" className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-600 focus:border-orange-500 outline-none transition-all" value={playerForm.number?.toString() || ''} onChange={e => setPlayerForm({...playerForm, number: parseInt(e.target.value) || 0})} /></div>
                   </div>
                </div>
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                   <div>{editingPlayerId !== 'new' && (<button type="button" onClick={() => handleDeletePlayer(editingPlayerId!)} className="text-red-500 hover:text-white hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border border-red-200 dark:border-red-800 hover:border-red-600"><Trash2 size={16} /> Delete Player</button>)}</div>
                   <div className="flex gap-3"><button type="button" onClick={cancelEditPlayer} className="px-5 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">Cancel</button><button type="button" onClick={handleSavePlayer} className="bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-700 flex items-center gap-2 shadow-sm transition-all transform hover:scale-[1.02]"><Save size={18} /> Save Player</button></div>
                </div>
             </div>
           )}
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left"><thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-600"><tr><th className="px-6 py-4">Player</th><th className="px-6 py-4">Number</th><th className="px-6 py-4">Team</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {data.players.filter(p => p.number <= 900).sort((a,b) => { const teamA = data.teams.find(t=>t.id === a.teamId); const teamB = data.teams.find(t=>t.id === b.teamId); if(teamA?.isMain !== teamB?.isMain) return teamA?.isMain ? -1 : 1; if(teamA?.id !== teamB?.id) return (teamA?.name || '').localeCompare(teamB?.name || ''); return a.number - b.number; }).map(player => (<tr key={player.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 group transition-colors"><td className="px-6 py-3"><div className="flex items-center gap-3"><img src={player.photoUrl || `https://ui-avatars.com/api/?name=${player.name}&background=random`} className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-slate-600 border border-slate-200 dark:border-slate-500" alt={player.name} /><span className="font-medium text-slate-900 dark:text-slate-100">{player.name}</span></div></td><td className="px-6 py-3 font-mono text-slate-600 dark:text-slate-400">#{player.number}</td><td className="px-6 py-3"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">{data.teams.find(t => t.id === player.teamId)?.name}{player.teamId === mainTeam?.id && <Shield size={10} className="text-orange-600 dark:text-orange-400 ml-1" />}</span></td><td className="px-6 py-3 text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => startEditPlayer(player)} className="px-3 py-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"><Edit2 size={14} /> Edit</button><button type="button" onClick={() => handleDeletePlayer(player.id)} className="px-3 py-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"><Trash2 size={14} /></button></div></td></tr>))}
                  {data.players.length === 0 && (<tr><td colSpan={4} className="p-8 text-center text-slate-400">No players found. Click "Add Player" to build your roster.</td></tr>)}</tbody></table>
            </div>
           </div>
        </div>
      )}
      {activeTab === 'teams' && (
        <div className="space-y-8">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"><h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200"><Shield size={20} className="text-orange-600" /> Leagues Management</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700"><h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3 tracking-wider">Add New League</h3><div className="flex gap-2"><input type="text" placeholder="Name (e.g. Serie C)" className="flex-1 px-3 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 outline-none focus:border-orange-500 dark:focus:border-orange-500" value={newLeague.name || ''} onChange={e => setNewLeague({...newLeague, name: e.target.value})} /><input type="text" placeholder="Season" className="w-20 px-3 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 outline-none focus:border-orange-500 dark:focus:border-orange-500" value={newLeague.season || ''} onChange={e => setNewLeague({...newLeague, season: e.target.value})} /><button type="button" onClick={handleAddLeague} className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500"><Plus size={20} /></button></div></div><div><h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3 tracking-wider">Active Leagues</h3><div className="space-y-2 max-h-[160px] overflow-y-auto pr-2">{data.leagues.map(league => (<div key={league.id} className="flex justify-between items-center bg-white dark:bg-slate-700 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:border-orange-200 transition-colors group"><div><span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{league.name}</span><span className="ml-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">{league.season}</span></div><button type="button" onClick={() => deleteLeague(league.id)} className="text-slate-300 dark:text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button></div>))}{data.leagues.length === 0 && <div className="text-sm text-slate-400 italic">No leagues added yet.</div>}</div></div></div></div>
           <div className="space-y-4"><div className="flex justify-between items-center"><h2 className="text-lg font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200"><User size={20} className="text-orange-600" /> Teams</h2>{!editingTeamId && (<button type="button" onClick={() => startEditTeam()} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-orange-700 shadow-sm"><Plus size={16} /> Create Team</button>)}</div>
               {editingTeamId && (<div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-orange-100 dark:border-orange-800 shadow-lg animate-in fade-in slide-in-from-top-4"><div className="flex justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4"><h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">{editingTeamId === 'new' ? 'Create New Team' : 'Edit Team Details'}</h3><button type="button" onClick={cancelEditTeam} className="text-slate-400 hover:text-slate-600"><X size={24}/></button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6"><div className="space-y-5"><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Team Name</label><input type="text" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 outline-none focus:border-orange-500" value={teamForm.name || ''} onChange={e => setTeamForm({...teamForm, name: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Home Location (Court)</label><input type="text" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 outline-none focus:border-orange-500" value={teamForm.location || ''} onChange={e => setTeamForm({...teamForm, location: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Team Logo</label><div className="flex items-center gap-4 p-3 border dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-700/50"><div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">{teamForm.logoUrl ? <img src={teamForm.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <Shield size={24} className="text-slate-300 dark:text-slate-500" />}</div><div className="flex-1"><label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"><Upload size={16} /> <span>Select File</span><input type="file" accept="image/png, image/jpeg" onChange={handleTeamLogoUpload} className="hidden" /></label><p className="text-[10px] text-slate-400 mt-1">Recommended: PNG/JPG (Transparent background)</p></div></div></div><div className="flex items-center gap-3 pt-2"><input type="checkbox" id="isMain" checked={teamForm.isMain || false} onChange={e => setTeamForm({...teamForm, isMain: e.target.checked})} className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-slate-300 dark:border-slate-500 dark:bg-slate-600" /><label htmlFor="isMain" className="text-sm font-medium text-slate-700 dark:text-slate-200 select-none">Set as Main Team (My Team)</label></div></div><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Participating Leagues</label><div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-700/50">{data.leagues.map(l => (<label key={l.id} className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700 last:border-0 cursor-pointer transition-colors"><input type="checkbox" checked={teamForm.leagueIds?.includes(l.id) || false} onChange={() => toggleLeagueForTeam(l.id)} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-slate-300 dark:border-slate-500 dark:bg-slate-600" /><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{l.name}</span></label>))}{data.leagues.length === 0 && <div className="p-6 text-sm text-slate-400 text-center">No leagues available. Add one above.</div>}</div></div></div><div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700"><div>{editingTeamId !== 'new' && (<button type="button" onClick={handleDeleteTeam} className="text-red-500 hover:text-white hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border border-red-200 dark:border-red-800 hover:border-red-600"><Trash2 size={16} /> Delete Team</button>)}</div><div className="flex gap-3"><button type="button" onClick={cancelEditTeam} className="px-5 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">Cancel</button><button type="button" onClick={handleSaveTeam} className="bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-700 flex items-center gap-2 shadow-sm transition-all transform hover:scale-[1.02]"><Save size={18} /> Save Team</button></div></div></div>)}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{data.teams.map(team => (<div key={team.id} className={`bg-white dark:bg-slate-800 p-6 rounded-xl border transition-all relative overflow-hidden group ${team.isMain ? 'border-orange-200 dark:border-orange-700 shadow-md ring-1 ring-orange-100 dark:ring-orange-900' : 'border-slate-200 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-700 hover:shadow-sm'}`}>{team.isMain && ( <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">My Team</div>)}<div className="flex justify-between items-start"><div className="flex gap-4"><div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 p-1 shrink-0"><img src={team.logoUrl || 'https://via.placeholder.com/100'} className="w-full h-full rounded-full object-cover" /></div><div><h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight mb-1">{team.name}</h3><p className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1"><ImageIcon size={12} /> {team.location || 'Unknown Location'}</p><div className="flex flex-wrap gap-1">{team.leagueIds.map(lid => (<span key={lid} className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">{data.leagues.find(l => l.id === lid)?.name}</span>))}</div></div></div><div className="pt-2"><button type="button" onClick={() => startEditTeam(team)} className="px-3 py-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"><Edit2 size={14} /> Edit</button></div></div></div>))}</div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Roster;