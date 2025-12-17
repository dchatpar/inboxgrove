import React from 'react';
import { Inbox } from '../types';
import { ShieldCheck, ShieldAlert, Zap, Activity } from 'lucide-react';

interface HealthMatrixProps {
  inboxes: Inbox[];
}

const HealthMatrix: React.FC<HealthMatrixProps> = ({ inboxes }) => {
  return (
    <div className="glass-panel p-6 rounded-xl border border-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="text-neon-blue" size={20} />
          Infrastructure Health Matrix
        </h3>
        <div className="flex gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-neon-green rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-slate-400">HEALTHY</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-neon-amber rounded-full animate-pulse"></div>
            <span className="text-slate-400">WARMING</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-neon-red rounded-full"></div>
            <span className="text-slate-400">BLACKLISTED</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1 content-start">
        {inboxes.map((inbox) => (
          <div
            key={inbox.id}
            className={`
              aspect-square rounded-md border border-opacity-20 cursor-pointer transition-all duration-200 relative group
              ${inbox.status === 'active' ? 'bg-neon-green/10 border-neon-green hover:bg-neon-green/20' : ''}
              ${inbox.status === 'warming' ? 'bg-neon-amber/10 border-neon-amber hover:bg-neon-amber/20 animate-pulse-fast' : ''}
              ${inbox.status === 'blacklisted' ? 'bg-neon-red/10 border-neon-red hover:bg-neon-red/20' : ''}
              ${inbox.status === 'repairing' ? 'bg-neon-blue/10 border-neon-blue hover:bg-neon-blue/20' : ''}
            `}
          >
            {/* Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               {inbox.status === 'active' && <ShieldCheck size={16} className="text-neon-green" />}
               {inbox.status === 'warming' && <Zap size={16} className="text-neon-amber" />}
               {inbox.status === 'blacklisted' && <ShieldAlert size={16} className="text-neon-red" />}
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-surface border border-border rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              <div className="text-xs font-bold text-white mb-1 truncate">{inbox.email}</div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Health:</span>
                <span className={inbox.healthScore > 90 ? 'text-neon-green' : 'text-neon-amber'}>{inbox.healthScore}%</span>
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between mt-1">
                <span>Daily Sent:</span>
                <span className="text-white">{inbox.dailySent}/{inbox.dailyLimit}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 uppercase font-mono tracking-wider">
                {inbox.status}
              </div>
            </div>
          </div>
        ))}
        {/* Fillers for grid effect */}
        {Array.from({ length: Math.max(0, 50 - inboxes.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square rounded-md border border-slate-800 bg-slate-900/50 opacity-50"></div>
        ))}
      </div>
    </div>
  );
};

export default HealthMatrix;