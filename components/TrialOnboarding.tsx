import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, Shield } from 'lucide-react';

const TrialOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const steps = [
    { number: 1, title: 'Create Account', description: 'Set up your InboxGrove account' },
    { number: 2, title: 'Add Domains', description: 'Connect your cold email domains' },
    { number: 3, title: 'Generate Inboxes', description: 'Create your first set of warm inboxes' },
    { number: 4, title: 'Start Sending', description: 'Begin your cold email campaigns' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Getting Started with InboxGrove
          </h1>
          <p className="text-slate-400 text-lg">
            Follow these steps to set up your cold email infrastructure
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {steps.map((s, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-panel p-6 rounded-xl border transition-all ${
                step === s.number
                  ? 'border-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                  : 'border-border'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s.number
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {step > s.number ? <CheckCircle size={20} /> : s.number}
                </div>
                <h3 className="font-bold text-white">{s.title}</h3>
              </div>
              <p className="text-sm text-slate-400">{s.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8 rounded-xl border border-border mb-8"
        >
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Step 1: Account Created ✅</h2>
              <p className="text-slate-300 mb-6">
                Great! Your InboxGrove account has been successfully created. You're now ready to add your first domain and start building your cold email infrastructure.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle className="text-green-400" size={20} />
                  Email verified
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle className="text-green-400" size={20} />
                  7-day trial activated
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Zap className="text-yellow-400" size={20} />
                  Ready to add domains
                </li>
              </ul>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Step 2: Add Domains</h2>
              <p className="text-slate-300 mb-6">
                Connect your cold-email-friendly domains. We'll automatically configure DNS records, DKIM, SPF, and DMARC for maximum deliverability.
              </p>
              <button
                onClick={() => navigate('/domains')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg flex items-center gap-2"
              >
                <Zap size={18} />
                Go to Domain Setup
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Step 3: Generate Inboxes</h2>
              <p className="text-slate-300 mb-6">
                Create bulk inboxes across your verified domains. Our AI warmup network will automatically condition them for optimal deliverability.
              </p>
              <button
                onClick={() => navigate('/mailboxes')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg flex items-center gap-2"
              >
                <Zap size={18} />
                Go to Mailbox Generator
              </button>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Step 4: Start Sending</h2>
              <p className="text-slate-300 mb-6">
                You're all set! Your cold email infrastructure is ready. Check your dashboard to monitor health scores, engagement, and deliverability metrics.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-2"
              >
                <Zap size={18} />
                Go to Dashboard
              </button>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-2 border border-border rounded-lg text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="flex gap-2">
            {steps.map((s) => (
              <button
                key={s.number}
                onClick={() => setStep(s.number)}
                className={`w-2 h-2 rounded-full transition-all ${
                  step === s.number ? 'bg-purple-500 w-8' : 'bg-slate-600'
                }`}
                aria-label={`Go to step ${s.number}`}
              />
            ))}
          </div>

          <button
            onClick={() => setStep(Math.min(4, step + 1))}
            disabled={step === 4}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialOnboarding;
