import React, { useState, useEffect } from 'react';
import { Inbox, ViewState } from '../types';
import MetricCard from './MetricCard';
import HealthMatrix from './HealthMatrix';
import { Mail, Zap, ShieldAlert, Activity, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  onViewChange: (view: ViewState) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const [inboxes, setInboxes] = useState<Inbox[]>([]);

  useEffect(() => {
    // Generate 50 dummy inboxes
    const dummyInboxes: Inbox[] = Array.from({ length: 50 }).map((_, i) => {
      const statusRoll = Math.random();
      let status: Inbox['status'] = 'active';
      if (statusRoll > 0.85) status = 'warming';
      if (statusRoll > 0.96) status = 'blacklisted';

      return {
        id: `ibx_${i}`,
        email: `user${i + 1}@cold-outreach-${Math.floor(i / 5)}.com`,
        domain: `cold-outreach-${Math.floor(i / 5)}.com`,
        status,
        healthScore: status === 'blacklisted' ? 45 : Math.floor(90 + Math.random() * 10),
        dailySent: Math.floor(Math.random() * 30),
        dailyLimit: 40,
        region: 'US-EAST',
        provider: 'InboxGrove'
      };
    });
    setInboxes(dummyInboxes);
  }, []);

  const totalSent = inboxes.reduce((acc, curr) => acc + curr.dailySent, 0);
  const warmingCount = inboxes.filter(i => i.status === 'warming').length;
  const issuesCount = inboxes.filter(i => i.status === 'blacklisted').length;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={item}>
          <MetricCard 
            label="Total Emails Sent (24h)" 
            value={totalSent.toLocaleString()} 
            change="+12.5%" 
            trend="up" 
            icon={Mail} 
            color="blue" 
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard 
            label="Avg Health Score" 
            value="98.2%" 
            change="+0.4%" 
            trend="up" 
            icon={Activity} 
            color="green" 
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard 
            label="Inboxes Warming" 
            value={warmingCount.toString()} 
            change="-2" 
            trend="down" 
            icon={Zap} 
            color="amber" 
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard 
            label="Deliverability Issues" 
            value={issuesCount.toString()} 
            change={issuesCount > 0 ? "+1" : "0"} 
            trend={issuesCount > 0 ? "down" : "neutral"} 
            icon={ShieldAlert} 
            color="red" 
          />
        </motion.div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* Matrix Visualization */}
        <motion.div variants={item} className="lg:col-span-2 h-full">
          <HealthMatrix inboxes={inboxes} />
        </motion.div>

        {/* Live Logs / Actions */}
        <motion.div variants={item} className="glass-panel p-6 rounded-xl border border-border h-full flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <span>Live System Logs</span>
            <div className="flex gap-2">
              <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </div>
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar font-mono text-xs">
             {[...Array(8)].map((_, i) => (
               <div key={i} className="flex gap-3 items-start pb-3 border-b border-border/50 last:border-0 opacity-80 hover:opacity-100 transition-opacity">
                 <div className="text-slate-500 whitespace-nowrap">10:{45 - i}:12</div>
                 <div>
                   <span className="text-neon-blue">[INFO]</span> Rotated IP for <span className="text-slate-300">user{i+4}@agency-scale.com</span>
                 </div>
               </div>
             ))}
             <div className="flex gap-3 items-start pb-3 border-b border-border/50">
                 <div className="text-slate-500 whitespace-nowrap">10:32:01</div>
                 <div>
                   <span className="text-neon-green">[SUCCESS]</span> DKIM Verified for domain <span className="text-slate-300">try-growth.io</span>
                 </div>
             </div>
             <div className="flex gap-3 items-start pb-3 border-b border-border/50">
                 <div className="text-slate-500 whitespace-nowrap">10:30:55</div>
                 <div>
                   <span className="text-neon-amber">[WARMUP]</span> Sent reply interaction (Thread ID: #8821)
                 </div>
             </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <button 
                onClick={() => onViewChange('provisioning')}
                className="w-full py-3 bg-primary hover:bg-primary-glow text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 group"
            >
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
              Deploy New Infrastructure
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;