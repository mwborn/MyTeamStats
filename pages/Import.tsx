import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
// FIX: Import the 'Match' type.
import { PlayerStats, Player, Match } from '../types';
import { parseCSVStats } from '../services/csvParser';
import { analyzeScoreSheet } from '../services/geminiService';
import { Upload, FileText, Camera, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const Import: React.FC = () => {
  const { appData, loadingData, saveStatsForMatch } = useContext(AppContext);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [previewStats, setPreviewStats] = useState<PlayerStats[]>([]);
  const [extractedScores, setExtractedScores] = useState<{ main: number, opponent: number, mainQuarters: number[], opponentQuarters: number[] } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCsvFile(e.target.files[0]);
      setImageFile(null);
      setPreviewStats([]);
      setExtractedScores(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImageFile(e.target.files[0]);
      setCsvFile(null);
      setPreviewStats([]);
      setExtractedScores(null);
    }
  };

  const processFile = async () => {
    if (!appData || !selectedMatchId) {
      setStatusMsg({ type: 'error', text: 'Select a match first.' });
      return;
    }
    
    const match = appData.matches.find(m => m.id === selectedMatchId);
    if (!match) return;

    let mainTeamId = appData.teams.find(t => t.isMain)?.id;
    let opponentTeamId;
    if (match.homeTeamId === mainTeamId) opponentTeamId = match.awayTeamId;
    else if (match.awayTeamId === mainTeamId) opponentTeamId = match.homeTeamId;
    else { mainTeamId = match.homeTeamId; opponentTeamId = match.awayTeamId; }

    if (!mainTeamId || !opponentTeamId) {
         setStatusMsg({ type: 'error', text: 'Could not determine teams for this match.' });
         return;
    }

    setStatusMsg(null);
    setIsAnalyzing(true);
    
    try {
      if (csvFile) {
        const text = await csvFile.text();
        const { stats, mainTeamPoints, opponentPoints, mainTeamQuarters, opponentTeamQuarters } = parseCSVStats(text, selectedMatchId, appData.players, mainTeamId, opponentTeamId);
        if (stats.length === 0 && mainTeamPoints === 0 && opponentPoints === 0) throw new Error('No valid stats or team scores found in CSV.');
        setPreviewStats(stats);
        setExtractedScores({ main: mainTeamPoints, opponent: opponentPoints, mainQuarters: mainTeamQuarters, opponentQuarters: opponentTeamQuarters });
      } else if (imageFile) {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onloadend = async () => {
          try {
             const base64 = (reader.result as string).split(',')[1];
             const stats = await analyzeScoreSheet(base64, appData.players, selectedMatchId);
             setPreviewStats(stats);
             setExtractedScores(null);
          } catch (e) {
             setStatusMsg({ type: 'error', text: 'AI Analysis failed. Check API Key or image quality.' });
             console.error(e);
          } finally { setIsAnalyzing(false); }
        };
        return;
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      if (csvFile) setIsAnalyzing(false);
    }
  };

  const handleSaveStats = async () => {
    if (!appData || !selectedMatchId) return;
    
    const match = appData.matches.find(m => m.id === selectedMatchId);
    if (!match) return;

    let playersToCreate: Partial<Player>[] = [];
    const benchStat = previewStats.find(s => s.playerId.startsWith('bench_'));
    if (benchStat && !appData.players.find(p => p.id === benchStat.playerId)) {
        const teamId = benchStat.playerId.replace('bench_', '');
        playersToCreate.push({ id: benchStat.playerId, teamId: teamId, name: 'Bench Tech.', number: 997, role: 'Bench' });
    }

    const oppStat = previewStats.find(s => s.playerId.startsWith('team_'));
    if (oppStat && !appData.players.find(p => p.id === oppStat.playerId)) {
        const teamId = oppStat.playerId.replace('team_', '');
        const teamName = appData.teams.find(t => t.id === teamId)?.name || 'Opponent';
        playersToCreate.push({ id: oppStat.playerId, teamId: teamId, name: `${teamName} (Total)`, number: 999, role: 'Team' });
    }

    const homeTeam = appData.teams.find(t => t.id === match.homeTeamId);
    const isMainHome = homeTeam?.isMain; 

    let scores: Partial<Match> = { isPlayed: true };
    if (extractedScores) {
        if (isMainHome) {
            scores.homeScore = extractedScores.main; scores.awayScore = extractedScores.opponent;
            scores.quarters = { home: extractedScores.mainQuarters, away: extractedScores.opponentQuarters };
        } else {
            scores.homeScore = extractedScores.opponent; scores.awayScore = extractedScores.main;
            scores.quarters = { home: extractedScores.opponentQuarters, away: extractedScores.mainQuarters };
        }
    } else if (previewStats.length > 0) {
        const mainStats = previewStats.filter(s => !s.playerId.startsWith('team_'));
        const teamPoints = mainStats.reduce((sum, s) => sum + s.points, 0);
        if (isMainHome) scores.homeScore = teamPoints; else scores.awayScore = teamPoints;
        const oppStatPoints = previewStats.find(s => s.playerId.startsWith('team_'))?.points;
        if (oppStatPoints) { if (isMainHome) scores.awayScore = oppStatPoints; else scores.homeScore = oppStatPoints; }
    }
    
    try {
        await saveStatsForMatch(selectedMatchId, previewStats, scores, playersToCreate);
        setStatusMsg({ type: 'success', text: 'Statistics and Scores saved successfully!' });
        setPreviewStats([]);
        setExtractedScores(null);
        setCsvFile(null);
        setImageFile(null);
    } catch(e: any) {
        setStatusMsg({ type: 'error', text: 'Failed to save stats: ' + e.message });
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  const selectedMatch = appData.matches.find(m => m.id === selectedMatchId);
  const homeTeam = appData.teams.find(t => t.id === selectedMatch?.homeTeamId);
  const awayTeam = appData.teams.find(t => t.id === selectedMatch?.awayTeamId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-sky-400">Data Import</h1>
        <p className="text-slate-500 dark:text-slate-400">Upload CSV from scout software or use AI to read a score sheet.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Match</label>
              <select className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)}>
                <option value="">-- Choose Match --</option>
                {appData.matches.map(m => {
                   const h = appData.teams.find(t => t.id === m.homeTeamId)?.name;
                   const a = appData.teams.find(t => t.id === m.awayTeamId)?.name;
                   const label = m.isPlayed ? `✔ #${m.matchNumber} - ${h} vs ${a} (${m.homeScore}-${m.awayScore})` : `#${m.matchNumber} - ${h} vs ${a}`;
                   return <option key={m.id} value={m.id}>{label}</option>;
                })}
              </select>
           </div>
           
           {selectedMatch && (
             <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg flex flex-col justify-center border border-slate-100 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Match Info</div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{homeTeam?.name} vs {awayTeam?.name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{selectedMatch.date} @ {selectedMatch.time}</div>
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer group ${csvFile ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' : 'border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-800'}`}>
              <label className="cursor-pointer block">
                <FileText className={`mx-auto mb-3 ${csvFile ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500'}`} size={32} />
                <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">{csvFile ? csvFile.name : 'Upload CSV File'}</p>
                <p className="text-xs text-slate-400">{csvFile ? 'Click to change' : 'Standard scout format'}</p>
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              </label>
           </div>

           <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer group ${imageFile ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' : 'border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-800'}`}>
              <label className="cursor-pointer block">
                <Camera className={`mx-auto mb-3 ${imageFile ? 'text-purple-500' : 'text-slate-400 dark:text-slate-500'}`} size={32} />
                <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">{imageFile ? imageFile.name : 'Upload Photo (Gemini AI)'}</p>
                <p className="text-xs text-slate-400">{imageFile ? 'Click to change' : 'Score sheet or Scoreboard'}</p>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
           </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={processFile} disabled={(!csvFile && !imageFile) || isAnalyzing} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all shadow-sm ${(!csvFile && !imageFile) || isAnalyzing ? 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed' : 'bg-slate-900 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 hover:shadow-md'}`}>
            {isAnalyzing ? <><Loader2 className="animate-spin" size={18} /> Analyzing...</> : <><Upload size={18} /> Process Data</>}
          </button>
        </div>
        
        {statusMsg && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 border ${statusMsg.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-100 dark:border-green-800'}`}>
             {statusMsg.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
             <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {(previewStats.length > 0 || extractedScores) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700 flex justify-between items-center">
            <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Preview Data</h3>
                {extractedScores && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Detected Score: <span className="font-bold text-orange-600 dark:text-orange-400">Main {extractedScores.main}</span> - <span className="font-bold text-blue-600 dark:text-blue-400">Opponent {extractedScores.opponent}</span>
                    </div>
                )}
            </div>
            <button onClick={handleSaveStats} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">
              Confirm & Save
            </button>
          </div>
          
          {previewStats.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-600">
                    <tr>
                        <th className="px-4 py-3">Player</th>
                        <th className="px-4 py-3">Pts</th>
                        <th className="px-4 py-3">2P</th>
                        <th className="px-4 py-3">3P</th>
                        <th className="px-4 py-3">FT</th>
                        <th className="px-4 py-3">Reb</th>
                        <th className="px-4 py-3">Ast</th>
                        <th className="px-4 py-3">Val</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {previewStats.map((stat, idx) => {
                        let p = appData.players.find(pl => pl.id === stat.playerId);
                        let displayName = p?.name || stat.playerId;
                        if (stat.playerId.startsWith('bench_')) displayName = "Bench Tech.";
                        if (stat.playerId.startsWith('team_')) displayName = "Opponent Team Totals";
                        const isVirtual = stat.playerId.startsWith('bench_') || stat.playerId.startsWith('team_');
                        return (
                            <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${isVirtual ? 'bg-orange-50 dark:bg-orange-900/20 font-semibold' : ''}`}>
                            <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{displayName}</td>
                            <td className="px-4 py-2 font-bold text-orange-600 dark:text-orange-400">{stat.points}</td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{stat.twoPtMade}/{stat.twoPtAtt}</td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{stat.threePtMade}/{stat.threePtAtt}</td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{stat.ftMade}/{stat.ftAtt}</td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{stat.rebOff + stat.rebDef}</td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{stat.assists}</td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{stat.valuation}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
                <p>No individual player stats found in this file.</p>
                {extractedScores && <p className="text-sm mt-2">But valid team scores were detected and will be saved.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Import;
