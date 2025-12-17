import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, TrendingUp, AlertCircle, Loader, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { integrationService, IntegrationConfig } from '../services/integrationService';
import { useToast } from './ToastProvider';

interface InstantlyAccount {
  account?: string;
  email?: string;
  plan?: string;
  credits?: number;
}

interface InstantlyCampaign {
  id: string;
  name: string;
  status: string;
  sent: number;
  opened: number;
  clicked: number;
  replies: number;
  bounced: number;
  failed: number;
}

interface InstantlyDashboardProps {
  integration: IntegrationConfig | null;
}

const InstantlyDashboard: React.FC<InstantlyDashboardProps> = ({ integration }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState<InstantlyAccount | null>(null);
  const [campaigns, setCampaigns] = useState<InstantlyCampaign[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Test Email from InboxGrove');
  const [sendingTest, setSendingTest] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'test'>('overview');

  const isConnected = integration?.status === 'connected' && integration?.apiKey;

  useEffect(() => {
    if (isConnected && integration?.apiKey) {
      loadInstantlyData();
    }
  }, [isConnected, integration?.apiKey]);

  const loadInstantlyData = async () => {
    if (!integration?.apiKey) return;

    setLoading(true);
    try {
      // Load account info
      const account = await integrationService.getInstantlyAccount(integration.apiKey);
      if (!account.error) {
        setAccountInfo(account);
      }

      // Load campaigns
      const campaignsData = await integrationService.getInstantlyCampaigns(integration.apiKey);
      if (!campaignsData.error && Array.isArray(campaignsData)) {
        setCampaigns(campaignsData.slice(0, 5)); // Show last 5 campaigns
      }
    } catch (error) {
      console.error('Error loading Instantly data:', error);
      toast.error('Failed to load Instantly data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!integration?.apiKey) {
      toast.error('Instantly not connected');
      return;
    }

    setSendingTest(true);
    try {
      const response = await integrationService.sendTestEmail(
        integration.apiKey,
        testEmail,
        testSubject,
        `<h2>${testSubject}</h2><p>This is a test email from InboxGrove integrated with Instantly.ai</p>`
      );

      if (response.success) {
        toast.success('Test email sent successfully!');
        setTestEmail('');
      } else {
        toast.error(response.error || 'Failed to send test email');
      }
    } catch (error) {
      toast.error('Error sending test email');
    } finally {
      setSendingTest(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Mail size={48} className="mx-auto text-slate-600 mb-4" />
        <p className="text-slate-400 mb-4">Instantly.ai is not connected</p>
        <p className="text-sm text-slate-500">Go to Integrations tab to connect your Instantly account</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            📧 Instantly.ai Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">Connected account: {accountInfo?.email || 'Loading...'}</p>
        </div>
        <button
          onClick={loadInstantlyData}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-800">
        {(['overview', 'campaigns', 'test'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-semibold transition-all border-b-2 capitalize ${
              activeTab === tab
                ? 'text-purple-400 border-purple-600'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            {tab === 'overview' && '📊 Overview'}
            {tab === 'campaigns' && '📬 Campaigns'}
            {tab === 'test' && '✉️ Send Test'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <Loader size={32} className="mx-auto text-purple-400 animate-spin" />
          <p className="text-slate-400 mt-4">Loading Instantly data...</p>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Account Stats */}
              {accountInfo && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                    <p className="text-slate-400 text-sm">Account</p>
                    <p className="text-2xl font-bold text-white mt-2">{accountInfo.account || '-'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                    <p className="text-slate-400 text-sm">Email</p>
                    <p className="text-lg font-bold text-white mt-2 truncate">{accountInfo.email || '-'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                    <p className="text-slate-400 text-sm">Plan</p>
                    <p className="text-2xl font-bold text-purple-400 mt-2">{accountInfo.plan || '-'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                    <p className="text-slate-400 text-sm">Credits</p>
                    <p className="text-2xl font-bold text-green-400 mt-2">{accountInfo.credits || '-'}</p>
                  </div>
                </div>
              )}

              {/* Connection Info */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Connected to Instantly</h3>
                    <p className="text-sm text-green-200">
                      Your Instantly.ai account is fully integrated with InboxGrove. You can now send campaigns, manage inboxes, and track performance all in one place.
                    </p>
                    <a
                      href="https://app.instantly.ai/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-4 text-sm text-purple-400 hover:text-purple-300 underline"
                    >
                      → Go to Instantly Dashboard
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {campaigns.length > 0 ? (
                <>
                  <p className="text-sm text-slate-400">Showing last {campaigns.length} campaigns</p>
                  <div className="space-y-3">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-white">{campaign.name}</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Status: <span className="text-blue-400 font-semibold">{campaign.status}</span>
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full border border-blue-500/30">
                            {campaign.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                          <div className="bg-slate-800/50 p-2 rounded">
                            <p className="text-slate-400">Sent</p>
                            <p className="font-bold text-white">{campaign.sent}</p>
                          </div>
                          <div className="bg-slate-800/50 p-2 rounded">
                            <p className="text-slate-400">Opened</p>
                            <p className="font-bold text-green-400">{campaign.opened}</p>
                          </div>
                          <div className="bg-slate-800/50 p-2 rounded">
                            <p className="text-slate-400">Clicked</p>
                            <p className="font-bold text-blue-400">{campaign.clicked}</p>
                          </div>
                          <div className="bg-slate-800/50 p-2 rounded">
                            <p className="text-slate-400">Replies</p>
                            <p className="font-bold text-purple-400">{campaign.replies}</p>
                          </div>
                          <div className="bg-slate-800/50 p-2 rounded">
                            <p className="text-slate-400">Bounced</p>
                            <p className="font-bold text-amber-400">{campaign.bounced}</p>
                          </div>
                          <div className="bg-slate-800/50 p-2 rounded">
                            <p className="text-slate-400">Failed</p>
                            <p className="font-bold text-red-400">{campaign.failed}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Mail size={32} className="mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400">No campaigns found</p>
                  <p className="text-sm text-slate-500 mt-1">Create your first campaign in Instantly</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Test Email Tab */}
          {activeTab === 'test' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">Send Test Email via Instantly</h3>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Recipient Email</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Subject</label>
                  <input
                    type="text"
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-blue-200 flex items-start gap-2">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    Test email will be sent through your connected Instantly account
                  </p>
                </div>

                <button
                  onClick={handleSendTestEmail}
                  disabled={sendingTest || !testEmail.trim()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendingTest ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Test Email
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default InstantlyDashboard;
