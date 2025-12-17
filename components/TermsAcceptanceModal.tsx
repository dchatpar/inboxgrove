import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Shield, DollarSign, Lock } from 'lucide-react';
import { LegalService, TERMS_OF_SERVICE, REFUND_POLICY, DATA_PROTECTION_POLICY, ACCEPTABLE_USE_POLICY } from '../services/legalService';
import { useToast } from './ToastProvider';

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  userId: string;
  onAccept: () => void;
  onDecline: () => void;
}

const TermsAcceptanceModal: React.FC<TermsAcceptanceModalProps> = ({ isOpen, userId, onAccept, onDecline }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'terms' | 'refund' | 'privacy' | 'aup'>('terms');
  const [agreeToAll, setAgreeToAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAUP, setAgreeAUP] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setScrolled(false);
  }, [activeTab]);

  const allAgreed = agreeTerms && agreeRefund && agreePrivacy && agreeAUP;

  const handleAccept = () => {
    if (!allAgreed) {
      toast.error('You must accept all agreements to proceed');
      return;
    }

    LegalService.recordTermsAcceptance(userId, {
      version: TERMS_OF_SERVICE.version,
      acceptedAt: new Date().toISOString()
    });

    LegalService.auditLog(userId, 'TERMS_ACCEPTED', {
      terms: agreeTerms,
      refund: agreeRefund,
      privacy: agreePrivacy,
      aup: agreeAUP
    });

    toast.success('Terms accepted! Proceeding with trial...');
    onAccept();
  };

  const handleDecline = () => {
    LegalService.auditLog(userId, 'TERMS_DECLINED', {
      timestamp: new Date().toISOString()
    });
    toast.info('You must accept the terms to use InboxGrove');
    onDecline();
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'terms':
        return TERMS_OF_SERVICE.content;
      case 'refund':
        return REFUND_POLICY.content;
      case 'privacy':
        return DATA_PROTECTION_POLICY.content;
      case 'aup':
        return ACCEPTABLE_USE_POLICY.content;
    }
  };

  const getTabs = [
    { key: 'terms', label: 'Terms of Service', icon: Shield },
    { key: 'refund', label: 'Refund & Chargeback Policy', icon: DollarSign },
    { key: 'privacy', label: 'Privacy & Data Protection', icon: Lock },
    { key: 'aup', label: 'Acceptable Use Policy', icon: AlertCircle }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={handleDecline}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-950 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Shield className="text-purple-400" size={24} />
                  InboxGrove Legal Agreement
                </h2>
                <p className="text-slate-400 text-sm mt-1">Review and accept all policies to proceed</p>
              </div>
              <button
                onClick={handleDecline}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={24} className="text-slate-400 hover:text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-slate-800 bg-slate-900/50 overflow-x-auto">
              {getTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                let isChecked = false;
                if (tab.key === 'terms') isChecked = agreeTerms;
                if (tab.key === 'refund') isChecked = agreeRefund;
                if (tab.key === 'privacy') isChecked = agreePrivacy;
                if (tab.key === 'aup') isChecked = agreeAUP;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all border ${
                      isActive
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-700'
                    } ${isChecked ? 'ring-2 ring-green-500/50' : ''}`}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium">{tab.label}</span>
                    {isChecked && <CheckCircle size={14} className="text-green-400" />}
                  </button>
                );
              })}
            </div>

            {/* Content Area */}
            <div
              className="flex-1 overflow-y-auto p-6 space-y-6"
              onScroll={(e) => {
                const element = e.target as HTMLElement;
                setScrolled(element.scrollHeight - element.scrollTop <= element.clientHeight + 10);
              }}
            >
              <div className="prose prose-invert max-w-none text-sm">
                {getTabContent()?.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={i} className="text-xl font-bold text-white mt-4 mb-2">
                        {line.replace('# ', '')}
                      </h1>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={i} className="text-lg font-bold text-purple-400 mt-3 mb-2">
                        {line.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <div key={i} className="flex gap-3 text-slate-300 mb-2">
                        <span className="text-green-400 flex-shrink-0 mt-1">✓</span>
                        <span>{line.replace('- ', '')}</span>
                      </div>
                    );
                  }
                  if (line.startsWith('✓ ')) {
                    return (
                      <div key={i} className="flex gap-3 text-slate-300 mb-2 bg-green-500/10 p-2 rounded border border-green-500/20">
                        <span className="text-green-400 flex-shrink-0 font-bold">✓</span>
                        <span>{line.replace('✓ ', '')}</span>
                      </div>
                    );
                  }
                  if (line.trim()) {
                    return (
                      <p key={i} className="text-slate-300 mb-2 leading-relaxed">
                        {line}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Scroll Indicator */}
              {!scrolled && (
                <div className="text-center text-slate-500 text-sm flex items-center justify-center gap-2 mt-4">
                  <AlertCircle size={16} />
                  Scroll to bottom to accept
                </div>
              )}
            </div>

            {/* Checkboxes */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/50 space-y-3">
              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-purple-600"
                />
                <span className="text-sm text-slate-300">
                  I accept the <span className="font-bold text-white">Terms of Service</span> and understand that InboxGrove is for cold email compliance only
                </span>
              </label>

              {/* Refund Policy Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer border border-red-500/20 bg-red-500/5">
                <input
                  type="checkbox"
                  checked={agreeRefund}
                  onChange={(e) => setAgreeRefund(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-red-600"
                />
                <div>
                  <span className="text-sm text-slate-300">
                    I ACCEPT the <span className="font-bold text-red-400">NO REFUND & CHARGEBACK POLICY</span>
                  </span>
                  <p className="text-xs text-red-400 mt-1">
                    ⚠️ All sales are FINAL. Chargebacks result in $5,000 penalty + permanent ban + legal action
                  </p>
                </div>
              </label>

              {/* Privacy Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-purple-600"
                />
                <span className="text-sm text-slate-300">
                  I accept the <span className="font-bold text-white">Privacy & Data Protection Policy</span> and understand data handling practices
                </span>
              </label>

              {/* AUP Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeAUP}
                  onChange={(e) => setAgreeAUP(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-purple-600"
                />
                <span className="text-sm text-slate-300">
                  I accept the <span className="font-bold text-white">Acceptable Use Policy</span> and will not use service for spam or illegal activity
                </span>
              </label>

              {/* Master Agree Checkbox */}
              <div className="pt-2 border-t border-slate-700">
                <label className="flex items-start gap-3 p-3 rounded-lg bg-purple-600/10 border border-purple-500/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeToAll}
                    onChange={(e) => {
                      setAgreeToAll(e.target.checked);
                      if (e.target.checked) {
                        setAgreeTerms(true);
                        setAgreeRefund(true);
                        setAgreePrivacy(true);
                        setAgreeAUP(true);
                      }
                    }}
                    className="mt-1 w-4 h-4 rounded accent-purple-600"
                  />
                  <span className="text-sm font-bold text-white">
                    I accept ALL agreements and acknowledge legal liability
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 border-t border-slate-800 bg-slate-900/50">
              <button
                onClick={handleDecline}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
              >
                Decline & Exit
              </button>
              <button
                onClick={handleAccept}
                disabled={!allAgreed || !scrolled}
                className={`flex-1 px-6 py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  allAgreed && scrolled
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <CheckCircle size={18} />
                Accept All & Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TermsAcceptanceModal;
