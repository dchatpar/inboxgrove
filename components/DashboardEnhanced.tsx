import React, { useState, useEffect } from 'react';
import { Inbox, ViewState } from '../types';
import MetricCard from './MetricCard';
import HealthMatrix from './HealthMatrix';
import { Mail, Zap, ShieldAlert, Activity, RefreshCw, Menu, X } from 'lucide-react';
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

const DashboardEnhanced: React.FC<DashboardProps> = ({ onViewChange }) => {
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeMetric, setActiveMetric] = useState<number | null>(null);

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
        provider: 'ScaleMail'
      };
    });
    setInboxes(dummyInboxes);
  }, []);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSent = inboxes.reduce((acc, curr) => acc + curr.dailySent, 0);
  const warmingCount = inboxes.filter(i => i.status === 'warming').length;
  const issuesCount = inboxes.filter(i => i.status === 'blacklisted').length;

  const metrics = [
    {
      label: "Total Emails Sent (24h)",
      value: totalSent.toLocaleString(),
      change: "+12.5%",
      trend: "up" as const,
      icon: Mail,
      color: "blue" as const
    },
    {
      label: "Avg Health Score",
      value: "98.2%",
      change: "+0.4%",
      trend: "up" as const,
      icon: Activity,
      color: "green" as const
    },
    {
      label: "Inboxes Warming",
      value: warmingCount.toString(),
      change: "-2",
      trend: "down" as const,
      icon: Zap,
      color: "amber" as const
    },
    {
      label: "Deliverability Issues",
      value: issuesCount.toString(),
      change: issuesCount > 0 ? "+1" : "0",
      trend: issuesCount > 0 ? "down" : "neutral" as const,
      icon: ShieldAlert,
      color: "red" as const
    }
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-[#0a0a0a] text-white px-2 sm:px-4 md:px-6 py-4"
    >
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between mb-4 md:hidden">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      )}

      {/* Metrics Grid - Fully Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
        {metrics.map((metric, idx) => (
          <motion.div 
            key={idx}
            variants={item}
            onClick={() => isMobile && setActiveMetric(activeMetric === idx ? null : idx)}
            className={`cursor-pointer transition-all ${isMobile && activeMetric === idx ? 'ring-2 ring-primary' : ''}`}
          >
            <MetricCard 
              label={metric.label}
              value={metric.value}
              change={metric.change}
              trend={metric.trend}
              icon={metric.icon}
              color={metric.color}
            />
          </motion.div>
        ))}
      </div>

      {/* Main Content Split - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Matrix Visualization - Stacks on mobile */}
        <motion.div 
          variants={item} 
          className="lg:col-span-2 min-h-[300px] sm:min-h-[400px] md:min-h-[500px]"
        >
          <HealthMatrix inboxes={inboxes} />
        </motion.div>

        {/* Live Logs / Actions */}
        <motion.div 
          variants={item} 
          className="glass-panel p-4 sm:p-6 rounded-xl border border-border min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex flex-col"
        >
          <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center justify-between">
            <span className="truncate">Live System Logs</span>
            <div className="flex gap-2 flex-shrink-0 ml-2">
              <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </div>
          </h3>
          
          {/* Scrollable Log Container - Mobile optimized */}
          <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-2 custom-scrollbar font-mono text-xs sm:text-sm">
             {[...Array(8)].map((_, i) => (
               <div key={i} className="flex gap-2 sm:gap-3 items-start pb-2 sm:pb-3 border-b border-border/50 last:border-0 opacity-80 hover:opacity-100 transition-opacity">
                 <div className="text-slate-500 whitespace-nowrap text-xs flex-shrink-0">10:{45 - i}:12</div>
                 <div className="min-w-0">
                   <span className="text-neon-blue">[INFO]</span>
                   <span className="text-slate-300 ml-1 truncate inline-block max-w-xs">
                     Rotated IP for user{i+4}@agency...
                   </span>
                 </div>
               </div>
             ))}
             <div className="flex gap-2 sm:gap-3 items-start pb-2 sm:pb-3 border-b border-border/50">
                 <div className="text-slate-500 whitespace-nowrap text-xs flex-shrink-0">10:32:01</div>
                 <div className="min-w-0">
                   <span className="text-neon-green">[SUCCESS]</span>
                   <span className="text-slate-300 ml-1 truncate inline-block">
                     DKIM Verified for domain
                   </span>
                 </div>
             </div>
             <div className="flex gap-2 sm:gap-3 items-start pb-2 sm:pb-3 border-b border-border/50">
                 <div className="text-slate-500 whitespace-nowrap text-xs flex-shrink-0">10:30:55</div>
                 <div className="min-w-0">
                   <span className="text-neon-amber">[WARMUP]</span>
                   <span className="text-slate-300 ml-1 truncate inline-block">
                     Sent reply interaction
                   </span>
                 </div>
             </div>
          </div>

          {/* CTA Button - Full width on mobile */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
            <button 
                onClick={() => onViewChange('provisioning')}
                className="w-full py-2.5 sm:py-3 bg-primary hover:bg-primary-glow text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 group text-sm sm:text-base"
            >
              <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500 flex-shrink-0" />
              <span className="truncate">Deploy Infrastructure</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mobile Action Bottom Sheet */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] to-transparent pt-8 pb-4 px-4 border-t border-border">
          <div className="max-w-md mx-auto space-y-2">
            <button className="w-full py-3 bg-primary hover:bg-primary-glow text-white font-bold rounded-lg transition-all text-center">
              Export Inboxes
            </button>
            <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all text-center">
              View Analytics
            </button>
          </div>
        </div>
      )}

      {/* Responsive spacing adjustment */}
      {isMobile && <div className="h-24"></div>}
    </motion.div>
  );
};

export default DashboardEnhanced;
