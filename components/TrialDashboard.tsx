import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CreditCard, CheckCircle2, AlertCircle, Mail, Calendar, TrendingUp, Rocket, Server, Globe } from 'lucide-react';
import Provisioning from './Provisioning';
import AdminDashboard from './AdminDashboard';

const TrialDashboard: React.FC = () => {
  const [trialData, setTrialData] = useState<{ trialId: string; expiresAt: string } | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [daysLeft, setDaysLeft] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'provisioning' | 'admin'>('admin');
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  const handleViewChange = (view: string) => {
    if (view === 'overview' || view === 'dashboard') {
      setActiveTab('overview');
    } else if (view === 'provisioning') {
      setActiveTab('provisioning');
    }
  };

  useEffect(() => {
    const storedTrial = localStorage.getItem('trialData');
    const storedEmail = localStorage.getItem('userEmail');
    
    if (!storedTrial) {
      window.location.href = '/onboarding';
      return;
    }

    const trial = JSON.parse(storedTrial);
    setTrialData(trial);
    setUserEmail(storedEmail || '');

    const calculateDaysLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(trial.expiresAt).getTime();
      const diff = expiry - now;
      const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      setDaysLeft(days);
      
      if (days === 0) {
        setShowPayment(true);
        setIsTrialExpired(true);
        setActiveTab('overview'); // Switch to overview when expired
      } else {
        setIsTrialExpired(false);
      }
    };

    calculateDaysLeft();
    const interval = setInterval(calculateDaysLeft, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const handleUpgradeNow = () => {
    window.location.href = '/#pricing';
  };

  if (!trialData) {
    return null;
  }

  const expiryDate = new Date(trialData.expiresAt);
  const isExpired = daysLeft === 0;
  const isExpiringSoon = daysLeft <= 2 && daysLeft > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-50">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-xl text-white">
              <Mail size={20} />
            </div>
            <span className="font-bold text-xl">InboxGrove</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 font-bold rounded-lg transition-all ${
                  activeTab === 'admin'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Rocket className="inline mr-2" size={16} /> Dashboard
              </button>
              <button
                onClick={() => setActiveTab('provisioning')}
                className={`px-4 py-2 font-bold rounded-lg transition-all ${
                  activeTab === 'provisioning'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Rocket className="inline mr-2" size={16} /> Deploy
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-bold rounded-lg transition-all ${
                  activeTab === 'overview'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
            </div>
            <span className="text-sm text-slate-400">{userEmail}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Show Admin Dashboard */}
        {activeTab === 'admin' && (
          <AdminDashboard />
        )}

        {/* Show Provisioning Interface */}
        {activeTab === 'provisioning' && (
          <>
            {isTrialExpired ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
                <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
                <h3 className="text-2xl font-bold text-white mb-3">Trial Expired</h3>
                <p className="text-slate-300 mb-6">Your 7-day trial has ended. Upgrade to a paid plan to continue deploying inboxes.</p>
                <button
                  onClick={() => window.location.href = '/#pricing'}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-blue-500"
                >
                  View Pricing Plans
                </button>
              </div>
            ) : (
              <Provisioning onViewChange={handleViewChange} />
            )}
          </>
        )}

        {/* Show Overview Tab */}
        {activeTab === 'overview' && (
        <>
        {/* Trial Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-6 rounded-xl border ${
            isExpired
              ? 'bg-red-500/10 border-red-500/30'
              : isExpiringSoon
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {isExpired ? (
                <AlertCircle className="text-red-400" size={32} />
              ) : isExpiringSoon ? (
                <Clock className="text-amber-400" size={32} />
              ) : (
                <CheckCircle2 className="text-emerald-400" size={32} />
              )}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isExpired
                    ? 'Trial Expired'
                    : isExpiringSoon
                    ? 'Trial Ending Soon'
                    : 'Free Trial Active'}
                </h2>
                <p className="text-slate-300 mb-4">
                  {isExpired
                    ? 'Your trial has ended. Upgrade now to continue using InboxGrove.'
                    : `You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in your free trial.`}
                </p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-slate-400">
                      {isExpired ? 'Expired' : 'Expires'}: <span className="text-white font-semibold">{expiryDate.toLocaleDateString()}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-slate-400">
                      Trial ID: <span className="text-white font-mono text-xs">{trialData.trialId}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {(isExpired || isExpiringSoon) && (
              <button
                onClick={handleUpgradeNow}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/30 flex items-center gap-2 transition-all"
              >
                <CreditCard size={18} />
                Upgrade Now
              </button>
            )}
          </div>
        </motion.div>

        {/* Trial Countdown Progress */}
        {!isExpired && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-slate-900/60 border border-slate-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Trial Progress</h3>
              <span className="text-slate-400 text-sm">{daysLeft} of 7 days remaining</span>
            </div>
            <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((7 - daysLeft) / 7) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full ${
                  isExpiringSoon ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
                }`}
              />
            </div>
          </motion.div>
        )}

        {/* Features Available During Trial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {[
            { icon: Mail, label: 'Email Inboxes', value: '50', desc: 'Ready to deploy' },
            { icon: TrendingUp, label: 'Deliverability', value: '98%', desc: 'Guaranteed rate' },
            { icon: CheckCircle2, label: 'Features', value: 'Full Access', desc: 'All pro features' },
          ].map((item, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <item.icon className="text-purple-400" size={20} />
                </div>
                <span className="text-slate-400 text-sm font-medium">{item.label}</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{item.value}</div>
              <div className="text-sm text-slate-500">{item.desc}</div>
            </div>
          ))}
        </motion.div>

        {/* Payment Required Modal */}
        {isExpired && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center"
          >
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="text-purple-400" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Continue with InboxGrove</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Your trial has ended. Choose a plan to keep your inboxes active and maintain your deliverability.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleUpgradeNow}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/30"
              >
                View Pricing Plans
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-8 py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700"
              >
                Back to Home
              </button>
            </div>
          </motion.div>
        )}

        {/* Next Steps */}
        {!isExpired && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-6"
          >
            <h3 className="font-bold text-white mb-4">What's Next?</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-slate-300">Your trial includes full access to all Professional features</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-slate-300">Deploy up to 50 email inboxes with automated warmup</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-slate-300">After {daysLeft} days, choose a plan to continue or cancel anytime</span>
              </div>
            </div>
            <button
              onClick={handleUpgradeNow}
              className="mt-6 w-full py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-all"
            >
              View Pricing Plans
            </button>
          </motion.div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default TrialDashboard;
