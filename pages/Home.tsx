import React, { useEffect, useState } from 'react';
import { getDB } from '../services/storage';
import { AppData, Player, PlayerStats, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getCurrentUser } from '../services/auth';

const Home: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setData(getDB());
    setUser(getCurrentUser());
  }, []);

  if (!data || !user) return <div>Loading...</div>;

  const mainTeam = data.teams.find(t => t.isMain);
  const playerStatsMap = new Map<string, { name: string, points: number, assists: number, rebounds: number }>();

  // Aggregate stats
  data.stats.forEach(stat => {
    const player = data.players.find(p => p.id === stat.playerId);
    if (!player || player.teamId !== mainTeam?.id) return;

    const current = playerStatsMap.get(player.id) || { name: player.name, points: 0, assists: 0, rebounds: 0 };
    current.points += stat.points;
    current.assists += stat.assists;
    current.rebounds += (stat.rebOff + stat.rebDef);
    playerStatsMap.set(player.id, current);
  });

  const chartData = Array.from(playerStatsMap.values())
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome Back, {user.name}</h1>
          <p className="text-slate-500 mt-1">
            Managing: <span className="font-semibold text-orange-600">{mainTeam?.name || 'My Team'}</span>
          </p>
        </div>
        {mainTeam?.logoUrl && (
          <img src={mainTeam.logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-orange-100" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold mb-4">Top 10 Performers (Season Total)</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="points" fill="#ea580c" name="Points" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rebounds" fill="#3b82f6" name="Rebounds" radius={[4, 4, 0, 0]} />
                <Bar dataKey="assists" fill="#10b981" name="Assists" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-orange-600 text-sm font-medium">Matches Played</div>
                  <div className="text-3xl font-bold text-slate-800">
                    {data.matches.filter(m => m.isPlayed && (m.homeTeamId === mainTeam?.id || m.awayTeamId === mainTeam?.id)).length}
                  </div>
               </div>
               <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-blue-600 text-sm font-medium">Roster Size</div>
                  <div className="text-3xl font-bold text-slate-800">
                    {data.players.filter(p => p.teamId === mainTeam?.id).length}
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold mb-2">Next Match</h2>
            {(() => {
              const nextMatch = data.matches
                .filter(m => !m.isPlayed)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
              
              if (!nextMatch) return <p className="text-slate-400">No upcoming matches scheduled.</p>;
              
              const home = data.teams.find(t => t.id === nextMatch.homeTeamId);
              const away = data.teams.find(t => t.id === nextMatch.awayTeamId);

              return (
                <div>
                  <div className="flex justify-between items-center text-sm text-slate-400 mb-4">
                    <span>{nextMatch.date}</span>
                    <span>{nextMatch.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">{home?.name}</span>
                    <span className="px-2 text-slate-500">vs</span>
                    <span className="font-bold text-lg">{away?.name}</span>
                  </div>
                  <div className="mt-4 text-xs text-center bg-slate-800 py-1 rounded">
                    Match #{nextMatch.matchNumber}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;