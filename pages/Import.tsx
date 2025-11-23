import React, { useState, useEffect } from 'react';
import { getDB, saveDB } from '../services/storage';
import { AppData, Match, PlayerStats, Player } from '../types';
import { parseCSVStats } from '../services/csvParser';
import { analyzeScoreSheet } from '../services/geminiService';
import { Upload, FileText, Camera, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const Import: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  
  // States for CSV
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  // States for Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Results
  const [previewStats, setPreviewStats] = useState<PlayerStats[]>([]);
  const [extractedScores, setExtractedScores] = useState<{
      main: number, 
      opponent: number,
      mainQuarters: number[],
      opponentQuarters: number[]
  } | null>(null);
  
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    setData(getDB());
  }, []);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCsvFile(e.target.files[0]);
      setImageFile(null); // exclusive
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
    if (!data || !selectedMatchId) {
      setStatusMsg({ type: 'error', text: 'Select a match first.' });
      return;
    }
    
    const match = data.matches.find(m => m.id === selectedMatchId);
    if (!match) return;

    // Determine Main and Opponent Teams
    const homeTeam = data.teams.find(t => t.id === match.homeTeamId);
    const awayTeam = data.teams.find(t => t.id === match.awayTeamId);
    
    // Default logic: Assume one is Main. If both or neither, just pick Home as Main for parsing context
    let mainTeamId = homeTeam?.isMain ? homeTeam.id : awayTeam?.id;
    let opponentTeamId = homeTeam?.isMain ? awayTeam?.id : homeTeam?.id;

    // If neither is marked main (rare), fallback
    if (!homeTeam?.isMain && !awayTeam?.isMain) {
        mainTeamId = homeTeam?.id;
        opponentTeamId = awayTeam?.id;
    }

    if (!mainTeamId || !opponentTeamId) {
         setStatusMsg({ type: 'error', text: 'Could not determine teams for this match.' });
         return;
    }

    setStatusMsg(null);
    setIsAnalyzing(true);
    
    try {
      if (csvFile) {
        const text = await csvFile.text();
        const { stats, mainTeamPoints, opponentPoints, mainTeamQuarters, opponentTeamQuarters } = parseCSVStats(
            text, 
            selectedMatchId, 
            data.players,
            mainTeamId,
            opponentTeamId
        );
        
        if (stats.length === 0 && mainTeamPoints === 0 && opponentPoints === 0) {
             throw new Error('No valid stats or team scores found in CSV.');
        }
        
        setPreviewStats(stats);
        setExtractedScores({ 
            main: mainTeamPoints, 
            opponent: opponentPoints,
            mainQuarters: mainTeamQuarters,
            opponentQuarters: opponentTeamQuarters
        });

      } else if (imageFile) {
        // Convert to Base64
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onloadend = async () => {
          try {
             const base64 = (reader.result as string).split(',')[1];
             const stats = await analyzeScoreSheet(base64, data.players, selectedMatchId);
             setPreviewStats(stats);
             setExtractedScores(null); // Gemini doesn't reliably get team totals yet
          } catch (e) {
             setStatusMsg({ type: 'error', text: 'AI Analysis failed. Check API Key or image quality.' });
             console.error(e);
          } finally {
            setIsAnalyzing(false);
          }
        };
        // Return early to wait for reader
        return;
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      if (csvFile) setIsAnalyzing(false);
    }
  };

  const saveStats = () => {
    if (!data || !selectedMatchId) return;
    
    const match = data.matches.find(m => m.id === selectedMatchId);
    if (!match) return;

    // 1. Ensure Virtual Players Exist (Bench & Opponent Team)
    let updatedPlayers = [...data.players];
    let playersChanged = false;

    // Check for "Bench" stats in preview
    const benchStat = previewStats.find(s => s.playerId.startsWith('bench_'));
    if (benchStat) {
        const exists = updatedPlayers.find(p => p.id === benchStat.playerId);
        if (!exists) {
            const teamId = benchStat.playerId.replace('bench_', '');
            updatedPlayers.push({
                id: benchStat.playerId,
                teamId: teamId,
                name: 'Bench Tech.',
                number: 997,
                role: 'Bench'
            });
            playersChanged = true;
        }
    }

    // Check for "Opponent Team" stats in preview
    const oppStat = previewStats.find(s => s.playerId.startsWith('team_'));
    if (oppStat) {
        const exists = updatedPlayers.find(p => p.id === oppStat.playerId);
        if (!exists) {
            const teamId = oppStat.playerId.replace('team_', '');
            const teamName = data.teams.find(t => t.id === teamId)?.name || 'Opponent';
            updatedPlayers.push({
                id: oppStat.playerId,
                teamId: teamId,
                name: teamName + ' (Total)',
                number: 999,
                role: 'Team'
            });
            playersChanged = true;
        }
    }

    // 2. Clean existing stats for this match to avoid dupes
    const filteredStats = data.stats.filter(s => s.matchId !== selectedMatchId);
    const newStats = [...filteredStats, ...previewStats];
    
    // 3. Determine Scores and Quarters
    const homeTeam = data.teams.find(t => t.id === match.homeTeamId);
    const isMainHome = homeTeam?.isMain; 

    let homeScore = match.homeScore || 0;
    let awayScore = match.awayScore || 0;
    let quarters: { home: number[], away: number[] } | undefined = undefined;

    if (extractedScores && (extractedScores.main > 0 || extractedScores.opponent > 0)) {
        // Use extracted scores from CSV
        if (isMainHome) {
            homeScore = extractedScores.main;
            awayScore = extractedScores.opponent;
            quarters = {
                home: extractedScores.mainQuarters,
                away: extractedScores.opponentQuarters
            };
        } else {
            homeScore = extractedScores.opponent;
            awayScore = extractedScores.main;
             quarters = {
                home: extractedScores.opponentQuarters,
                away: extractedScores.mainQuarters
            };
        }
    } else if (previewStats.length > 0) {
        // Fallback: Sum player stats if no explicit team score found
        const mainStats = previewStats.filter(s => !s.playerId.startsWith('team_'));
        const teamPoints = mainStats.reduce((sum, s) => sum + s.points, 0);
        
        if (isMainHome) {
            homeScore = teamPoints;
        } else {
            awayScore = teamPoints;
        }
        
        // If we have Opponent Team stat (999), use that for the other score
        const oppStat = previewStats.find(s => s.playerId.startsWith('team_'));
        if (oppStat) {
             if (isMainHome) awayScore = oppStat.points;
             else homeScore = oppStat.points;
        }
    }

    const updatedMatches = data.matches.map(m => {
       if (m.id === selectedMatchId) {
         return { 
           ...m, 
           isPlayed: true, 
           homeScore, 
           awayScore,
           quarters
         };
       }
       return m;
    });

    const newData = { 
        ...data, 
        players: updatedPlayers,
        stats: newStats, 
        matches: updatedMatches 
    };
    
    saveDB(newData);
    setData(newData);
    
    setStatusMsg({ type: 'success', text: 'Statistics and Scores saved successfully!' });
    setPreviewStats([]);
    setExtractedScores(null);
    setCsvFile(null);
    setImageFile(null);
  };

  if (!data) return <div>Loading...</div>;

  const selectedMatch = data.matches.find(m => m.id === selectedMatchId);
  const homeTeam = data.teams.find(t => t.id === selectedMatch?.homeTeamId);
  const awayTeam = data.teams.find(t => t.id === selectedMatch?.awayTeamId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Data Import</h1>
        <p className="text-slate-500">Upload CSV from scout software or use AI to read a score sheet.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Match</label>
              <select 
                className="w-full px-3 py-2 border rounded-lg bg-white"
                value={selectedMatchId}
                onChange={e => setSelectedMatchId(e.target.value)}
              >
                <option value="">-- Choose Match --</option>
                {data.matches.map(m => {
                   const h = data.teams.find(t => t.id === m.homeTeamId)?.name;
                   const a = data.teams.find(t => t.id === m.awayTeamId)?.name;
                   const label = m.isPlayed 
                     ? `✔ #${m.matchNumber} - ${h} vs ${a} (${m.homeScore}-${m.awayScore})` 
                     : `#${m.matchNumber} - ${h} vs ${a}`;
                   return <option key={m.id} value={m.id}>{label}</option>;
                })}
              </select>
           </div>
           
           {selectedMatch && (
             <div className="bg-slate-50 p-4 rounded-lg flex flex-col justify-center border border-slate-100">
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Match Info</div>
                <div className="font-medium text-slate-900">{homeTeam?.name} vs {awayTeam?.name}</div>
                <div className="text-sm text-slate-500">{selectedMatch.date} @ {selectedMatch.time}</div>
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* CSV Input */}
           <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer group ${csvFile ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-300'}`}>
              <label className="cursor-pointer block">
                <FileText className={`mx-auto mb-3 ${csvFile ? 'text-orange-500' : 'text-slate-400'}`} size={32} />
                <p className="text-sm font-medium mb-2 text-slate-700">{csvFile ? csvFile.name : 'Upload CSV File'}</p>
                <p className="text-xs text-slate-400">{csvFile ? 'Click to change' : 'Standard scout format'}</p>
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              </label>
           </div>

           {/* Image Input */}
           <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer group ${imageFile ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}>
              <label className="cursor-pointer block">
                <Camera className={`mx-auto mb-3 ${imageFile ? 'text-purple-500' : 'text-slate-400'}`} size={32} />
                <p className="text-sm font-medium mb-2 text-slate-700">{imageFile ? imageFile.name : 'Upload Photo (Gemini AI)'}</p>
                <p className="text-xs text-slate-400">{imageFile ? 'Click to change' : 'Score sheet or Scoreboard'}</p>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
           </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={processFile}
            disabled={(!csvFile && !imageFile) || isAnalyzing}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all shadow-sm
              ${(!csvFile && !imageFile) || isAnalyzing ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-md'}
            `}
          >
            {isAnalyzing ? <><Loader2 className="animate-spin" size={18} /> Analyzing...</> : <><Upload size={18} /> Process Data</>}
          </button>
        </div>
        
        {statusMsg && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 border ${statusMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
             {statusMsg.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
             <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {(previewStats.length > 0 || extractedScores) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <div>
                <h3 className="font-bold text-slate-800">Preview Data</h3>
                {extractedScores && (
                    <div className="text-xs text-slate-500 mt-1">
                        Detected Score: <span className="font-bold text-orange-600">Main {extractedScores.main}</span> - <span className="font-bold text-blue-600">Opponent {extractedScores.opponent}</span>
                        {extractedScores.mainQuarters.length > 0 && (
                            <div className="mt-1 text-slate-400">
                                Quarters found: Q1, Q2, Q3, Q4...
                            </div>
                        )}
                    </div>
                )}
            </div>
            <button onClick={saveStats} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">
              Confirm & Save
            </button>
          </div>
          
          {previewStats.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
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
                    <tbody className="divide-y divide-slate-100">
                    {previewStats.map((stat, idx) => {
                        // Attempt to resolve name from existing players or virtual IDs
                        let p = data.players.find(pl => pl.id === stat.playerId);
                        let displayName = p?.name || stat.playerId;
                        
                        if (stat.playerId.startsWith('bench_')) displayName = "Bench Tech.";
                        if (stat.playerId.startsWith('team_')) displayName = "Opponent Team Totals";

                        const isVirtual = stat.playerId.startsWith('bench_') || stat.playerId.startsWith('team_');

                        return (
                            <tr key={idx} className={`hover:bg-slate-50 ${isVirtual ? 'bg-orange-50 font-semibold' : ''}`}>
                            <td className="px-4 py-2 font-medium text-slate-900">{displayName}</td>
                            <td className="px-4 py-2 font-bold text-orange-600">{stat.points}</td>
                            <td className="px-4 py-2">{stat.twoPtMade}/{stat.twoPtAtt}</td>
                            <td className="px-4 py-2">{stat.threePtMade}/{stat.threePtAtt}</td>
                            <td className="px-4 py-2">{stat.ftMade}/{stat.ftAtt}</td>
                            <td className="px-4 py-2">{stat.rebOff + stat.rebDef}</td>
                            <td className="px-4 py-2">{stat.assists}</td>
                            <td className="px-4 py-2">{stat.valuation}</td>
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
