import React from 'react';
import { MetricCardProps } from '../types';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, trend, icon: Icon, color }) => {
  const colorMap = {
    blue: 'text-neon-blue border-neon-blue shadow-[0_0_10px_rgba(14,165,233,0.2)]',
    green: 'text-neon-green border-neon-green shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    amber: 'text-neon-amber border-neon-amber shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    red: 'text-neon-red border-neon-red shadow-[0_0_10px_rgba(239,68,68,0.2)]',
  };

  const bgMap = {
    blue: 'bg-neon-blue/10',
    green: 'bg-neon-green/10',
    amber: 'bg-neon-amber/10',
    red: 'bg-neon-red/10',
  };

  return (
    <div className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">{label}</p>
          <h3 className="text-3xl font-bold text-white mt-1 font-mono">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${bgMap[color]} ${colorMap[color]} border border-opacity-30`}>
          <Icon size={20} />
        </div>
      </div>
      
      {change && (
        <div className="flex items-center gap-2">
          <span className={`flex items-center text-xs font-bold ${
            trend === 'up' ? 'text-neon-green' : trend === 'down' ? 'text-neon-red' : 'text-slate-400'
          }`}>
            {trend === 'up' && <ArrowUp size={12} className="mr-1" />}
            {trend === 'down' && <ArrowDown size={12} className="mr-1" />}
            {trend === 'neutral' && <Minus size={12} className="mr-1" />}
            {change}
          </span>
          <span className="text-slate-500 text-xs">vs last 24h</span>
        </div>
      )}

      {/* Background Glow */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-10 ${bgMap[color]}`} />
    </div>
  );
};

export default MetricCard;