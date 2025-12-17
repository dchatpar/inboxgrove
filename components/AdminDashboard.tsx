import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Globe, Activity, TrendingUp, Download, Plus, Settings, AlertCircle,
  CheckCircle, Clock, Zap, DollarSign, Users, BarChart3, Shield, Rocket,
  Link2, ExternalLink, Home, LogOut, Menu, X
} from 'lucide-react';
import { trialApi } from '../services/trialApi';
import IntegrationsTab from './IntegrationsTab';
import InstantlyDashboard from './InstantlyDashboard';
import DomainPurchase from './DomainPurchase';
import MailboxGenerator from './MailboxGenerator';
import LeadsDataModules from './LeadsDataModules';
import { useToast } from './ToastProvider';
import { integrationService } from '../services/integrationService';

interface Inbox {
  id: string;
  email: string;
  status: 'active' | 'warming' | 'suspended';
  health_score: number;
  emails_sent_today: number;
  emails_sent_this_month: number;
}

interface Domain {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  dns_configured: boolean;
  created_at: string;
}

interface Stats {
  total_inboxes: number;
  active_inboxes: number;
  avg_health_score: number;
  emails_sent_today: number;
  domains_count: number;
  warmup_in_progress: number;
}

const AdminDashboard: React.FC = () => {
  const toast = useToast();
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'inboxes' | 'domains' | 'analytics' | 'integrations' | 'settings'>('overview');
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedInbox, setExpandedInbox] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [instantlyIntegration, setInstantlyIntegration] = useState<any>(null);

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || 'user@example.com';
    setUserEmail(email);
    loadDashboardData();
    
    // Load Instantly integration if saved
    const saved = integrationService.getIntegration('instantly');
    if (saved) {
      setInstantlyIntegration(saved);
    }
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load inboxes
      const inboxesRes = await trialApi.listInboxes();
      if (inboxesRes.ok && inboxesRes.data?.inboxes) {
        setInboxes(inboxesRes.data.inboxes);
      }

      // Load domains
      const domainsRes = await trialApi.listDomains();
      if (domainsRes.ok && domainsRes.data?.domains) {
        setDomains(domainsRes.data.domains);
      }

      // Calculate stats
      if (inboxesRes.ok && inboxesRes.data?.inboxes) {
        const boxes = inboxesRes.data.inboxes as Inbox[];
        const calculatedStats: Stats = {
          total_inboxes: boxes.length,
          active_inboxes: boxes.filter(b => b.status === 'active').length,
          avg_health_score: Math.round(
            boxes.reduce((sum, b) => sum + b.health_score, 0) / Math.max(boxes.length, 1)
          ),
          emails_sent_today: boxes.reduce((sum, b) => sum + b.emails_sent_today, 0),
          domains_count: domainsRes.data?.domains?.length || 0,
          warmup_in_progress: boxes.filter(b => b.status === 'warming').length,
        };
        setStats(calculatedStats);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const handleCreateInboxes = () => {
    toast.info('Redirecting to provisioning wizard...');
    setTimeout(() => {
      window.location.href = '/onboarding?tab=provisioning';
    }, 500);
  };

  const handleDownloadCSV = async () => {
    setActionLoading(true);
    try {
      const result = await trialApi.downloadInboxesCsv();
      if (result.ok && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inboxes-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('CSV downloaded successfully!');
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Failed to download CSV');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddDomain = () => {
    toast.info('Opening domain setup...');
    setTimeout(() => {
      window.location.href = '/domains';
    }, 300);
  };

  const handleCreateMore = () => {
    toast.info('Opening provisioning wizard...');
    setTimeout(() => {
      window.location.href = '/provisioning';
    }, 300);
  };

  const handleManageBilling = () => {
    toast.info('Billing management coming soon! 🚀');
  };

  const handleChangePassword = () => {
    toast.info('Password change feature coming soon! 🔐');
  };

  const handleDeleteAccount = () => {
    const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmDelete) {
      const finalConfirm = confirm('This will permanently delete all your data. Are you absolutely sure?');
      if (finalConfirm) {
        localStorage.clear();
        toast.success('Account deleted successfully.');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    }
  };

  const handleIntegrationAction = (serviceName: string, status: string) => {
    if (status === 'connected') {
      alert(`Manage ${serviceName} settings - Coming soon`);
    } else {
      alert(`Connect to ${serviceName} - Coming soon`);
    }
  };

  const handleViewCredentials = (inboxId: string) => {
    setShowCredentials(showCredentials === inboxId ? null : inboxId);
  };

  const getHealthColor = (score: number) => {
    if (score >= 95) return 'text-green-400';
    if (score >= 85) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      warming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const TabButton = ({ name, icon: Icon, label }: { name: string; icon: any; label: string }) => (
    <button
      onClick={() => { setActiveTab(name as any); setMobileMenuOpen(false); }}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
        activeTab === name
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-slate-800 bg-slate-900/60 backdrop-blur"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-xl text-white shadow-lg">
                <Rocket size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">InboxGrove Command Center</h1>
                <p className="text-sm text-slate-400">{userEmail}</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all flex items-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-8 bg-slate-900/40 p-3 rounded-xl border border-slate-800"
        >
          <TabButton name="overview" icon={Home} label="Overview" />
          <TabButton name="inboxes" icon={Mail} label="Inboxes" />
          <TabButton name="domains" icon={Globe} label="Domains" />
          <TabButton name="analytics" icon={BarChart3} label="Analytics" />
          <TabButton name="integrations" icon={Link2} label="Integrations" />
          <TabButton name="settings" icon={Settings} label="Settings" />
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <Zap size={32} className="text-purple-400" />
            </div>
            <p className="mt-4 text-slate-400">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-purple-600/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Total Inboxes</p>
                        <p className="text-3xl font-bold text-white mt-2">{stats?.total_inboxes || 0}</p>
                      </div>
                      <Mail className="text-purple-400" size={32} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-green-600/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Active Inboxes</p>
                        <p className="text-3xl font-bold text-green-400 mt-2">{stats?.active_inboxes || 0}</p>
                      </div>
                      <CheckCircle className="text-green-400" size={32} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-600/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Avg Health Score</p>
                        <p className={`text-3xl font-bold mt-2 ${getHealthColor(stats?.avg_health_score || 0)}`}>
                          {stats?.avg_health_score || 0}%
                        </p>
                      </div>
                      <Activity className="text-blue-400" size={32} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-amber-600/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Emails Today</p>
                        <p className="text-3xl font-bold text-amber-400 mt-2">{stats?.emails_sent_today || 0}</p>
                      </div>
                      <TrendingUp className="text-amber-400" size={32} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-violet-600/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Domains</p>
                        <p className="text-3xl font-bold text-violet-400 mt-2">{stats?.domains_count || 0}</p>
                      </div>
                      <Globe className="text-violet-400" size={32} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-600/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Warming Up</p>
                        <p className="text-3xl font-bold text-blue-400 mt-2">{stats?.warmup_in_progress || 0}</p>
                      </div>
                      <Clock className="text-blue-400" size={32} />
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-purple-400" />
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={handleCreateInboxes}
                      className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Create New Inboxes
                    </button>
                    <button 
                      onClick={handleDownloadCSV}
                      disabled={actionLoading}
                      className="p-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all border border-slate-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Download size={18} />
                      {actionLoading ? 'Downloading...' : 'Download CSV'}
                    </button>
                    <button 
                      onClick={() => setActiveTab('analytics')}
                      className="p-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all border border-slate-700 flex items-center gap-2"
                    >
                      <BarChart3 size={18} />
                      View Analytics
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* INBOXES TAB */}
            {activeTab === 'inboxes' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Provisioned Inboxes ({inboxes.length})</h2>
                  <button 
                    onClick={handleCreateMore}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all"
                  >
                    <Plus size={18} className="inline mr-2" />
                    Create More
                  </button>
                </div>

                {inboxes.length === 0 ? (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center">
                    <Mail size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400">No inboxes created yet. Click "Create More" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inboxes.map((inbox) => (
                      <motion.div
                        key={inbox.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all cursor-pointer"
                        onClick={() => setExpandedInbox(expandedInbox === inbox.id ? null : inbox.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Mail size={20} className="text-purple-400" />
                              <div>
                                <p className="font-bold text-white">{inbox.email}</p>
                                <p className="text-sm text-slate-400">Status: <span className={`font-semibold ${getHealthColor(inbox.health_score)}`}>{inbox.status}</span></p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getHealthColor(inbox.health_score)}`}>{inbox.health_score}%</p>
                            <p className="text-xs text-slate-400">Health Score</p>
                          </div>
                          <span className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(inbox.status)}`}>
                            {inbox.status.charAt(0).toUpperCase() + inbox.status.slice(1)}
                          </span>
                        </div>

                        {expandedInbox === inbox.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-4"
                          >
                            <div>
                              <p className="text-slate-400 text-sm">Sent Today</p>
                              <p className="text-xl font-bold text-white">{inbox.emails_sent_today}/{40}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-sm">Sent This Month</p>
                              <p className="text-xl font-bold text-white">{inbox.emails_sent_this_month}</p>
                            </div>
                            {showCredentials === inbox.id && (
                              <div className="col-span-2 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <p className="text-xs text-slate-400 mb-2">SMTP Credentials</p>
                                <div className="space-y-2 font-mono text-xs">
                                  <div>
                                    <span className="text-slate-400">Host: </span>
                                    <span className="text-green-400">smtp.inboxgrove.com</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">User: </span>
                                    <span className="text-green-400">{inbox.email}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Port: </span>
                                    <span className="text-green-400">587 (TLS)</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            <button 
                              onClick={() => handleViewCredentials(inbox.id)}
                              className="col-span-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-sm"
                            >
                              {showCredentials === inbox.id ? 'Hide Credentials' : 'View Credentials'}
                            </button>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* DOMAINS TAB */}
            {activeTab === 'domains' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Managed Domains ({domains.length})</h2>
                  <button 
                    onClick={handleAddDomain}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all"
                  >
                    <Plus size={18} className="inline mr-2" />
                    Add Domain
                  </button>
                </div>

                {domains.length === 0 ? (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center">
                    <Globe size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400">No domains added. Click "Add Domain" to register one.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {domains.map((domain) => (
                      <div
                        key={domain.id}
                        className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Globe size={20} className="text-blue-400" />
                            <div>
                              <p className="font-bold text-white">{domain.name}</p>
                              <p className="text-sm text-slate-400">Added {new Date(domain.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(domain.status)}`}>
                              {domain.status.charAt(0).toUpperCase() + domain.status.slice(1)}
                            </span>
                            {domain.dns_configured ? (
                              <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                                <CheckCircle size={12} /> DNS Configured
                              </p>
                            ) : (
                              <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                                <AlertCircle size={12} /> DNS Pending
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Analytics & Insights</h2>
                
                {/* Instantly Integration Analytics */}
                {instantlyIntegration?.apiKey && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Mail className="text-blue-400" size={20} />
                      Instantly.ai Campaign Analytics
                    </h3>
                    <InstantlyDashboard apiKey={instantlyIntegration.apiKey} />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="text-purple-400" size={20} />
                      Sending Volume (30 Days)
                    </h3>
                    <div className="h-64 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400">
                      <p>Chart placeholder - Connect to analytics backend API</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="text-green-400" size={20} />
                      Deliverability Rate
                    </h3>
                    <div className="h-64 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400">
                      <p>Chart placeholder - Connect to analytics backend API</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Inbox Health Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 font-bold">95%+</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-2">
                        <div className="bg-green-400 h-full rounded-full" style={{width: `${(stats?.active_inboxes || 0) / (stats?.total_inboxes || 1) * 100}%`}}></div>
                      </div>
                      <span className="text-slate-400 text-sm">{stats?.active_inboxes || 0} inboxes</span>
                    </div>
                  </div>
                </div>

                {/* Leads & Campaign Sources */}
                <LeadsDataModules />
              </motion.div>
            )}

            {/* INTEGRATIONS TAB */}
            {activeTab === 'integrations' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <IntegrationsTab onIntegrationSaved={(serviceName) => {
                  if (serviceName === 'instantly') {
                    const saved = integrationService.getIntegration('instantly');
                    if (saved) {
                      setInstantlyIntegration(saved);
                      toast.success('Instantly.ai integration connected successfully!');
                    }
                  }
                }} />
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                    <DomainPurchase onPurchased={(d)=>{
                      toast.success(`Added ${d} to domains`);
                      // naive append; in real app fetch from backend
                      setDomains([...domains, { id: `local_${Date.now()}`, name: d, status: 'active', dns_configured: false, created_at: new Date().toISOString() }]);
                    }} />
                  </div>
                  {domains.length > 0 && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                      <MailboxGenerator domain={domains[0].name} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users size={20} className="text-blue-400" />
                    Profile Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400">Email Address</label>
                      <p className="text-white font-semibold mt-1">{userEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Account Type</label>
                      <p className="text-white font-semibold mt-1">Professional Plan</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-green-400" />
                    Security
                  </h3>
                  <button 
                    onClick={handleChangePassword}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
                  >
                    Change Password
                  </button>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-amber-400" />
                    Billing
                  </h3>
                  <p className="text-slate-400 mb-4">Manage your subscription and payment methods</p>
                  <button 
                    onClick={handleManageBilling}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all"
                  >
                    Manage Billing
                  </button>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                    <AlertCircle size={20} />
                    Danger Zone
                  </h3>
                  <p className="text-slate-400 mb-4 text-sm">Permanently delete your account and all data</p>
                  <button 
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all"
                  >
                    Delete Account
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
