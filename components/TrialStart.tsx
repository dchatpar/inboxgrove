import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, CreditCard, Rocket, Shield } from 'lucide-react';
import { trialApi, StartTrialPayload, TrialPlan } from '@/services/trialApi';

type Plan = { key: TrialPlan; name: string; monthly: number; yearly?: number; desc: string };

const basePlans: Plan[] = [
  // Lower than previous pricing: 19/59/199
  { key: 'starter', name: 'Starter', monthly: 19, desc: 'For small teams getting started' },
  { key: 'professional', name: 'Professional', monthly: 59, desc: 'Most popular for growing teams' },
  { key: 'enterprise', name: 'Enterprise', monthly: 199, desc: 'Advanced controls and support' },
];

const TrialStart: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'plan' | 'payment' | 'otp' | 'success'>('plan');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [plan, setPlan] = useState<TrialPlan>('professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [acceptTos, setAcceptTos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialData, setTrialData] = useState<{ trialId: string; expiresAt: string } | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardConsent, setCardConsent] = useState(false);

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    if (!acceptTos) {
      setError('Please accept the Terms to continue');
      return;
    }
    setStep('payment');
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanedNumber = cardNumber.replace(/\D/g, '');
    const expiryMatch = cardExpiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    if (!acceptTos) {
      setError('Please accept the Terms to continue');
      return;
    }
    if (!cardName.trim()) {
      setError('Cardholder name is required');
      return;
    }
    if (cleanedNumber.length < 12 || cleanedNumber.length > 19) {
      setError('Enter a valid card number');
      return;
    }
    if (!expiryMatch) {
      setError('Enter expiry as MM/YY');
      return;
    }
    if (!/^\d{3,4}$/.test(cardCvc)) {
      setError('Enter a valid CVC');
      return;
    }
    if (!cardConsent) {
      setError('Please authorize the trial with your card');
      return;
    }

    setLoading(true);
    // Capture masked card info locally (for demo / UI continuity)
    const last4 = cleanedNumber.slice(-4);
    localStorage.setItem('trialCard', JSON.stringify({ last4, expiry: cardExpiry }));
    
    // Call backend to send OTP
    const result = await trialApi.sendOtp(email);
    setLoading(false);
    
    if (!result.ok) {
      // If backend unavailable, continue to OTP step anyway (demo mode)
      if (result.status === 0) {
        console.warn('Backend not available, running in demo mode');
        setStep('otp');
        return;
      }
      setError(result.error || 'Failed to send verification code');
      return;
    }
    
    setStep('otp');
    console.log('Verification code sent to:', email);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    
    // Call backend to verify OTP
    const result = await trialApi.verifyOtp({ email, otp });
    setLoading(false);
    
    if (!result.ok) {
      // If network error (backend not running), show demo success
      if (result.status === 0) {
        console.warn('Backend not available, running in demo mode');
        const demoExpiry = new Date();
        demoExpiry.setDate(demoExpiry.getDate() + 7);
        const demoData = { 
          trialId: 'demo_' + Math.random().toString(36).substr(2, 9), 
          expiresAt: demoExpiry.toISOString() 
        };
        setTrialData(demoData);
        localStorage.setItem('trialData', JSON.stringify(demoData));
        localStorage.setItem('userEmail', email);
        if (result.data?.access_token) {
          localStorage.setItem('access_token', result.data.access_token);
        }
        setStep('success');
        setTimeout(() => navigate('/trial/dashboard'), 2000);
        return;
      }
      setError(result.error || 'Failed to verify code');
      return;
    }
    
    // Success: store auth token and trial data
    if (result.data?.access_token) {
      localStorage.setItem('access_token', result.data.access_token);
    }
    if (result.data?.refresh_token) {
      localStorage.setItem('refresh_token', result.data.refresh_token);
    }
    setTrialData({ 
      trialId: result.data?.trialId || '', 
      expiresAt: result.data?.expiresAt || new Date(Date.now() + 7*24*60*60*1000).toISOString()
    });
    localStorage.setItem('trialData', JSON.stringify(result.data));
    localStorage.setItem('userEmail', email);
    setStep('success');
    setTimeout(() => navigate('/trial/dashboard'), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => history.back()} className="text-slate-400 hover:text-white text-sm">&larr; Back</button>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Rocket className="text-purple-500" /> Start your 7‑day free trial
          </h1>
          <p className="mt-3 text-slate-400">Credit card required for verification. You will not be charged until the trial ends on day 7.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6">
          {step === 'plan' && (
          <>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Choose a plan</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className={billingCycle === 'monthly' ? 'text-white font-semibold' : 'text-slate-400'}>Monthly</span>
                <button
                  aria-label="Toggle billing cycle"
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-700"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
                <span className={billingCycle === 'yearly' ? 'text-white font-semibold' : 'text-slate-400'}>Yearly <span className="text-emerald-400">(save 20%)</span></span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {basePlans.map(p => {
                const yearly = Math.round(p.monthly * 12 * 0.8); // 20% off yearly
                const active = plan === p.key;
                return (
                <button
                  key={p.key}
                  onClick={() => setPlan(p.key)}
                  className={`text-left p-4 rounded-lg border transition-all ${active ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-sm text-slate-400 mt-1">{p.desc}</div>
                    </div>
                    <div className="text-right">
                      {billingCycle === 'monthly' ? (
                        <div className="text-white font-bold">${p.monthly}/mo</div>
                      ) : (
                        <>
                          <div className="text-white font-bold">${yearly}/yr</div>
                          <div className="text-xs text-emerald-400">≈ ${(yearly/12).toFixed(2)}/mo</div>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );})}
            </div>
          </div>

          <form onSubmit={handleContinueToPayment} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3">{error}</div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Work email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              />
            </div>
            <div className="flex items-start gap-3">
              <input id="tos" type="checkbox" checked={acceptTos} onChange={(e) => setAcceptTos(e.target.checked)} className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-0" />
              <label htmlFor="tos" className="text-sm text-slate-300">I agree to the <a href="#" className="text-purple-400 hover:text-purple-300">Terms of Service</a> and <a href="#" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>.</label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <CreditCard size={18} /> {loading ? 'Checking…' : 'Continue to secure payment'}
            </button>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Shield size={14} className="text-slate-400" /> Card required for verification. No charges until trial ends.
            </div>
          </form>
          </>
          )}

          {step === 'payment' && (
          <form onSubmit={sendOtp} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3">{error}</div>
            )}

            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-white">Secure payment hold</h2>
              <span className="text-sm text-slate-400">Plan: <span className="text-white font-semibold uppercase">{plan}</span></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Cardholder Name</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Name on card"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Card Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, ''))}
                  placeholder="4242 4242 4242 4242"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Expiry</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value.replace(/[^\d/]/g, ''))}
                    placeholder="MM/YY"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">CVC</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                    placeholder="123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input id="cardConsent" type="checkbox" checked={cardConsent} onChange={(e) => setCardConsent(e.target.checked)} className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-0" />
              <label htmlFor="cardConsent" className="text-sm text-slate-300">
                I authorize InboxGrove to securely store my card for a 7-day free trial. <span className="text-emerald-400">No charges will occur until the trial ends</span>. I can cancel anytime before day 7 to avoid charges.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <CreditCard size={18} /> {loading ? 'Saving & sending code…' : 'Save card & send verification code'}
            </button>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Shield size={14} className="text-slate-400" /> Bank-level encryption. Charge only after trial ends.
            </div>
            <button
              type="button"
              onClick={() => setStep('plan')}
              className="w-full py-2 text-slate-400 hover:text-white text-sm"
            >
              ← Back to plan selection
            </button>
          </form>
          )}

          {step === 'otp' && (
          <form onSubmit={verifyOtp} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3">{error}</div>
            )}
            <div className="text-center mb-4">
              <div className="text-white font-bold text-lg mb-2">Check your email</div>
              <div className="text-slate-400 text-sm">We sent a 6-digit code to <span className="text-white">{email}</span></div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <CheckCircle2 size={18} /> {loading ? 'Verifying…' : 'Verify & Start Trial'}
            </button>
            <button
              type="button"
              onClick={() => setStep('plan')}
              className="w-full py-2 text-slate-400 hover:text-white text-sm"
            >
              ← Change email or plan
            </button>
          </form>
          )}

          {step === 'success' && trialData && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-emerald-400" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome aboard! 🎉</h2>
            <p className="text-slate-400 mb-6">
              Your 7-day trial is active. Redirecting to your dashboard...
            </p>
            <div className="text-sm text-slate-500">
              Trial ID: {trialData.trialId}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrialStart;
