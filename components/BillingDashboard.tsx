import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, FileText, Settings, Download, Calendar, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign, Zap } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  pdfUrl: string;
}

interface Subscription {
  id: string;
  planName: string;
  status: string;
  currentPrice: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  cancelAtPeriodEnd: boolean;
}

interface PaymentMethod {
  id: string;
  cardBrand: string;
  cardLastFour: string;
  cardExpMonth: number;
  cardExpYear: number;
  isDefault: boolean;
}

const BillingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payment-methods' | 'settings'>('overview');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Load subscription
      const subResponse = await fetch('https://api.inboxgrove.com/api/v1/billing/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subData = await subResponse.json();
      setSubscription(subData.subscription);

      // Load invoices
      const invResponse = await fetch('https://api.inboxgrove.com/api/v1/billing/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const invData = await invResponse.json();
      setInvoices(invData.invoices);

      // Load payment methods
      const pmResponse = await fetch('https://api.inboxgrove.com/api/v1/billing/payment-methods', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pmData = await pmResponse.json();
      setPaymentMethods(pmData.paymentMethods);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load billing data:', error);
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://api.inboxgrove.com/api/v1/billing/subscription/cancel', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setShowCancelModal(false);
        loadBillingData();
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle size={12} /> Active</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-full flex items-center gap-1"><Clock size={12} /> Pending</span>;
      case 'overdue':
        return <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold rounded-full flex items-center gap-1"><AlertCircle size={12} /> Overdue</span>;
      case 'paid':
        return <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-full"><CheckCircle size={12} /></span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0520] to-[#1a0a2e] flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-400">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0520] to-[#1a0a2e] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Billing & Subscription</h1>
          <p className="text-slate-400">Manage your account, invoices, and payment methods</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-700">
          {['overview', 'invoices', 'payment-methods', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 font-bold transition-all border-b-2 ${
                activeTab === tab
                  ? 'border-purple-600 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'invoices' && '📄 Invoices'}
              {tab === 'payment-methods' && '💳 Payment Methods'}
              {tab === 'settings' && '⚙️ Settings'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && subscription && (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Current subscription card */}
              <motion.div
                whileHover={{ y: -4 }}
                className="md:col-span-2 bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Zap size={24} className="text-purple-400" />
                  Current Subscription
                </h2>

                <div className="space-y-6">
                  {/* Plan info */}
                  <div className="grid grid-cols-2 gap-6 p-6 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Plan</p>
                      <p className="text-2xl font-bold text-white">{subscription.planName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Status</p>
                      <div>{getStatusBadge(subscription.status)}</div>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Monthly Cost</p>
                      <p className="text-2xl font-bold text-white">
                        ${subscription.currentPrice}
                        <span className="text-sm font-normal text-slate-400">/{subscription.billingCycle}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Next Billing Date</p>
                      <p className="text-lg font-bold text-white">{new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all">
                      <TrendingUp size={18} className="inline mr-2" />
                      Upgrade Plan
                    </button>
                    {!subscription.cancelAtPeriodEnd && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="flex-1 px-6 py-3 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/50 font-bold rounded-lg transition-all"
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>

                  {subscription.cancelAtPeriodEnd && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-amber-300 text-sm">
                        <AlertCircle size={16} className="inline mr-2" />
                        Your subscription will be cancelled at the end of your current billing period.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Billing summary */}
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-8"
              >
                <h3 className="text-lg font-bold text-white mb-6">Billing Summary</h3>

                <div className="space-y-4">
                  {invoices.slice(0, 3).map((invoice, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-slate-300">{invoice.invoiceNumber}</span>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-slate-400 text-xs">{new Date(invoice.date).toLocaleDateString()}</span>
                        <span className="text-lg font-bold text-white">${invoice.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-6 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-lg transition-all text-sm">
                  View All Invoices
                </button>
              </motion.div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 overflow-hidden">
              <div className="p-8 border-b border-slate-700/30">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FileText size={24} className="text-blue-400" />
                  Invoice History
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-700/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Invoice</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice, idx) => (
                      <tr key={idx} className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{invoice.invoiceNumber}</td>
                        <td className="px-6 py-4 text-slate-400">{new Date(invoice.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-white font-bold">${invoice.amount}</td>
                        <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={invoice.pdfUrl}
                            className="text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-2"
                          >
                            <Download size={16} />
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'payment-methods' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <CreditCard size={24} className="text-green-400" />
                Payment Methods
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {paymentMethods.map((pm, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <CreditCard size={24} className="text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-400 capitalize">{pm.cardBrand}</p>
                          <p className="text-lg font-bold text-white">•••• {pm.cardLastFour}</p>
                        </div>
                      </div>
                      {pm.isDefault && (
                        <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">Default</span>
                      )}
                    </div>

                    <p className="text-slate-400 text-sm mb-4">
                      Expires {pm.cardExpMonth}/{pm.cardExpYear}
                    </p>

                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 text-slate-300 hover:text-white text-sm font-bold transition-all">
                        Edit
                      </button>
                      {!pm.isDefault && (
                        <button className="flex-1 px-4 py-2 text-slate-300 hover:text-white text-sm font-bold transition-all">
                          Set as Default
                        </button>
                      )}
                      <button className="flex-1 px-4 py-2 text-red-400 hover:text-red-300 text-sm font-bold transition-all">
                        Remove
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Add new card */}
                <motion.button
                  whileHover={{ y: -4 }}
                  className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl rounded-2xl border-2 border-dashed border-slate-700/50 hover:border-purple-600 p-6 text-center transition-all"
                >
                  <CreditCard size={32} className="mx-auto mb-4 text-slate-500" />
                  <p className="text-slate-300 font-bold">Add Payment Method</p>
                </motion.button>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Settings size={24} className="text-slate-400" />
                Billing Settings
              </h2>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Email Notifications</h3>
                      <p className="text-slate-400 text-sm">Receive invoice and payment notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Automatic Payments</h3>
                      <p className="text-slate-400 text-sm">Automatically charge default payment method</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Monthly Budget</h3>
                  <input
                    type="number"
                    placeholder="Set spending limit"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-slate-400 text-xs mt-2">You'll be notified when approaching this limit</p>
                </div>

                <button className="w-full px-6 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-lg transition-all">
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-2xl p-8 max-w-md border border-slate-800"
          >
            <h3 className="text-2xl font-bold text-white mb-4">Cancel Subscription?</h3>
            <p className="text-slate-400 mb-6">
              You'll lose access to all features at the end of your current billing period. Your data will be retained for 30 days.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-slate-700 text-slate-300 font-bold rounded-lg hover:bg-slate-800 transition-all"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BillingDashboard;
