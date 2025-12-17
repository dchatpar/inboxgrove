import React from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, 
  Server, 
  Zap, 
  Link2, 
  Settings, 
  Rocket, 
  ShieldCheck,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Mission Control', icon: LayoutDashboard },
    { id: 'provisioning', label: 'Launch Pad', icon: Rocket },
    { id: 'inboxes', label: 'Inbox Matrix', icon: Server },
    { id: 'warmup', label: 'Auto-Warmup', icon: Zap },
    { id: 'repair', label: 'AI Repair', icon: ShieldCheck },
    { id: 'connector', label: 'API & Connectors', icon: Link2 },
  ];

  const bottomItems = [
    { id: 'pricing', label: 'Plans & Billing', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-full z-20">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Rocket className="text-white h-5 w-5" />
          </div>
          <span className="font-mono font-bold text-lg text-slate-100 tracking-wider">ScaleMail</span>
        </div>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as ViewState)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group ${
              currentView === item.id 
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
            }`}
          >
            <item.icon className={`h-5 w-5 ${currentView === item.id ? 'text-primary drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]' : 'group-hover:text-slate-100'}`} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Menu */}
      <div className="p-3 border-t border-border space-y-1">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as ViewState)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group ${
              currentView === item.id 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
            }`}
          >
            <item.icon className={`h-5 w-5 ${currentView === item.id ? 'text-primary' : 'group-hover:text-slate-100'}`} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;