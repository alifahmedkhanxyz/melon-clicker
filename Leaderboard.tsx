import React from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Medal } from 'lucide-react';

interface LeaderboardProps {
  scores: LeaderboardEntry[];
  loading: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ scores, loading }) => {
  return (
    <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-4 mt-4 border border-white/20">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Trophy className="text-yellow-300" size={24} />
        <h2 className="text-xl font-bold text-white">Top Score</h2>
      </div>
      
      {loading ? (
        <div className="text-center py-4 text-white/70">Loading scores...</div>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/30">
          {scores.map((entry, index) => (
            <li key={entry.id || index} className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <span className={`font-bold w-6 text-center ${index < 3 ? 'text-yellow-300' : 'text-white/60'}`}>
                  {index + 1}
                </span>
                <span className="text-white truncate max-w-[120px]">{entry.name}</span>
              </div>
              <div className="font-mono text-accent font-bold">
                {entry.score} 🍈
              </div>
            </li>
          ))}
          {scores.length === 0 && (
             <li className="text-center text-white/50 py-2">No scores yet!</li>
          )}
        </ul>
      )}
    </div>
  );
};