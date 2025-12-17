export default function TrialOnboarding() {
  return null;
}
          </h1>
          <p className="mt-3 text-slate-400">No credit card required. Cancel anytime.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6">
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
              {plans.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPlan(p.key)}
                  className={`text-left p-4 rounded-lg border transition-all ${plan === p.key ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-sm text-slate-400 mt-1">{p.desc}</div>
                    </div>
                    <div className="text-white font-bold">{p.price}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3">{error}</div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 px-4 py-3 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" /> Trial started! Expires {new Date(success.expiresAt).toLocaleDateString()}.
              </div>
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
              <CreditCard size={18} /> {loading ? 'Starting Trial…' : 'Start 7‑Day Free Trial'}
            </button>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Shield size={14} className="text-slate-400" /> Secure. No charges until trial ends.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrialOnboarding;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, CheckCircle, AlertCircle, Loader, ArrowRight, Shield, Zap, TrendingUp } from 'lucide-react';

interface TrialOnboardingProps {
  onComplete: (paymentDetails: any) => void;
}

interface PricingTier {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  description: string;
  highlight?: boolean;
}

const TrialOnboarding: React.FC<TrialOnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>('pro');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    cardholderName: '',
    email: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: 'US'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const pricingTiers: PricingTier[] = [
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 29,
      yearlyPrice: 290,
      description: 'Perfect for small teams',
      features: [
        '50 email inboxes',
        '3 custom domains',
        'Basic warmup (7 days)',
        'Email support',
        '95% deliverability guarantee'
      ]
    },
    {
      id: 'pro',
      name: 'Professional',
      monthlyPrice: 79,
      yearlyPrice: 790,
      description: 'Most popular',
      highlight: true,
      features: [
        '250 email inboxes',
        '10 custom domains',
        'Advanced warmup (14 days)',
        'Priority email & chat support',
        '98% deliverability guarantee',
        'API access',
        'CSV export'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 299,
      yearlyPrice: 2990,
      description: 'For agencies',
      features: [
        'Unlimited inboxes',
        'Unlimited domains',
        'Premium warmup (21 days)',
        '24/7 phone support',
        '99% deliverability guarantee',
        'Advanced API',
        'White-label options',
        'Dedicated account manager'
      ]
    }
  ];

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    return formatted.slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardDetails({
      ...cardDetails,
      cardNumber: formatCardNumber(e.target.value)
    });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardDetails({
      ...cardDetails,
      cardExpiry: formatExpiry(e.target.value)
    });
  };

  const handleProcessPayment = async () => {
    setError(null);

    // Validation
    if (!selectedPlan) {
      setError('Please select a pricing plan');
      return;
    }

    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Please enter a valid card number');
      return;
    }

    if (!cardDetails.cardExpiry || cardDetails.cardExpiry.length !== 5) {
      setError('Please enter a valid expiry date (MM/YY)');
      return;
    }

    if (!cardDetails.cardCVC || cardDetails.cardCVC.length < 3) {
      setError('Please enter a valid CVC');
      return;
    }

    if (!cardDetails.cardholderName.trim()) {
      setError('Please enter cardholder name');
      return;
    }

    if (!cardDetails.email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent with 7-day trial
      const response = await fetch('https://api.inboxgrove.com/api/v1/billing/setup-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          plan_id: selectedPlan,
          billing_cycle: billingCycle,
          card_details: cardDetails,
          trial_days: 7
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Payment processing failed');
      }

      const data = await response.json();
      setSuccess(true);

      setTimeout(() => {
        onComplete(data);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0520] to-[#1a0a2e] py-12 px-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Start Your 7-Day <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Free Trial</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            No credit card required for the first 7 days. Full access to all features. Cancel anytime.
          </p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex justify-center gap-4 mb-12">
          {[1, 2, 3].map((step) => (
            <motion.div key={step} className="flex items-center">
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                  transition-all duration-300
                  ${currentStep >= step
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-800 text-slate-500'
                  }
                `}
              >
                {step < currentStep ? <CheckCircle size={24} /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${
                    currentStep > step ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                ></div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Content area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Step 1: Choose Plan */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="flex justify-center gap-4 mb-8">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-3 rounded-lg font-bold transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-3 rounded-lg font-bold transition-all relative ${
                    billingCycle === 'yearly'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Yearly
                  <span className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Save 20%
                  </span>
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {pricingTiers.map((tier) => (
                  <motion.div
                    key={tier.id}
                    whileHover={{ y: -8 }}
                    onClick={() => setSelectedPlan(tier.id)}
                    className={`
                      p-8 rounded-2xl cursor-pointer transition-all duration-300
                      ${selectedPlan === tier.id
                        ? tier.highlight
                          ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl shadow-purple-500/30'
                          : 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-600'
                        : `bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 hover:border-slate-600`
                      }
                    `}
                  >
                    {tier.highlight && selectedPlan === tier.id && (
                      <div className="mb-4 inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                        Most Popular
                      </div>
                    )}

                    <h3 className={`text-2xl font-bold mb-2 ${
                      selectedPlan === tier.id && tier.highlight ? 'text-white' : 'text-white'
                    }`}>
                      {tier.name}
                    </h3>
                    <p className={`text-sm mb-6 ${
                      selectedPlan === tier.id && tier.highlight ? 'text-white/80' : 'text-slate-400'
                    }`}>
                      {tier.description}
                    </p>

                    <div className="mb-6">
                      <div className={`text-4xl font-bold ${
                        selectedPlan === tier.id && tier.highlight ? 'text-white' : 'text-white'
                      }`}>
                        ${billingCycle === 'monthly' ? tier.monthlyPrice : Math.floor(tier.yearlyPrice / 12)}<span className="text-lg font-normal">/mo</span>
                      </div>
                      <p className={`text-xs mt-2 ${
                        selectedPlan === tier.id && tier.highlight ? 'text-white/70' : 'text-slate-500'
                      }`}>
                        {billingCycle === 'yearly' ? `Billed ${tier.yearlyPrice}/year` : 'Billed monthly'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <div key={idx} className={`flex items-center gap-3 text-sm ${
                          selectedPlan === tier.id && tier.highlight ? 'text-white' : 'text-slate-300'
                        }`}>
                          <CheckCircle size={16} className={
                            selectedPlan === tier.id && tier.highlight ? 'text-white' : 'text-emerald-400'
                          } />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <button className={`w-full mt-8 py-3 rounded-lg font-bold transition-all ${
                      selectedPlan === tier.id
                        ? tier.highlight
                          ? 'bg-white text-purple-600 hover:bg-slate-100'
                          : 'bg-purple-600 text-white hover:bg-purple-500'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                    }`}>
                      {selectedPlan === tier.id ? 'Selected' : 'Choose Plan'}
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  Continue to Payment <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Payment Details */}
          {currentStep === 2 && (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Payment form */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <CreditCard size={28} className="text-purple-400" />
                    Payment Information
                  </h2>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
                    >
                      <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                      <p className="text-red-300 text-sm">{error}</p>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3"
                    >
                      <CheckCircle size={20} className="text-green-400" />
                      <p className="text-green-300 font-medium">Payment successful! Setting up your trial...</p>
                    </motion.div>
                  )}

                  {/* Card number */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Card Number</label>
                    <input
                      type="text"
                      value={cardDetails.cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all font-mono"
                    />
                  </div>

                  {/* Expiry and CVC */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        value={cardDetails.cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">CVC</label>
                      <input
                        type="text"
                        value={cardDetails.cardCVC}
                        onChange={(e) => setCardDetails({ ...cardDetails, cardCVC: e.target.value.slice(0, 4) })}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Cardholder name */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardDetails.cardholderName}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  {/* Billing address section */}
                  <h3 className="text-lg font-bold text-white mb-4 mt-8 pt-8 border-t border-slate-700">Billing Address</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={cardDetails.email}
                      onChange={(e) => setCardDetails({ ...cardDetails, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Address</label>
                    <input
                      type="text"
                      value={cardDetails.billingAddress}
                      onChange={(e) => setCardDetails({ ...cardDetails, billingAddress: e.target.value })}
                      placeholder="123 Main Street"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={cardDetails.billingCity}
                      onChange={(e) => setCardDetails({ ...cardDetails, billingCity: e.target.value })}
                      placeholder="City"
                      className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all"
                    />
                    <input
                      type="text"
                      value={cardDetails.billingState}
                      onChange={(e) => setCardDetails({ ...cardDetails, billingState: e.target.value })}
                      placeholder="State"
                      maxLength={2}
                      className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={cardDetails.billingZip}
                      onChange={(e) => setCardDetails({ ...cardDetails, billingZip: e.target.value })}
                      placeholder="ZIP Code"
                      className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all"
                    />
                    <select
                      value={cardDetails.billingCountry}
                      onChange={(e) => setCardDetails({ ...cardDetails, billingCountry: e.target.value })}
                      className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all"
                    >
                      <option>US</option>
                      <option>CA</option>
                      <option>UK</option>
                      <option>AU</option>
                    </select>
                  </div>

                  <div className="mt-8 flex items-center gap-3 text-sm text-slate-400">
                    <Lock size={16} />
                    <span>Your payment information is encrypted and secure</span>
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="md:col-span-1">
                <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-8 sticky top-8">
                  <h3 className="text-lg font-bold text-white mb-6">Order Summary</h3>

                  {selectedPlan && pricingTiers.find(t => t.id === selectedPlan) && (
                    <>
                      <div className="space-y-4 mb-6 pb-6 border-b border-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-400">
                            {pricingTiers.find(t => t.id === selectedPlan)?.name} Plan
                          </span>
                          <span className="text-white font-bold">
                            ${billingCycle === 'monthly' 
                              ? pricingTiers.find(t => t.id === selectedPlan)?.monthlyPrice
                              : pricingTiers.find(t => t.id === selectedPlan)?.yearlyPrice}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Trial Period</span>
                          <span className="text-emerald-400 font-bold">-$0.00</span>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-400">Subtotal</span>
                          <span className="text-white">$0.00</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500 mb-4">
                          <span>(7 days free)</span>
                        </div>
                      </div>

                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-6">
                        <p className="text-sm text-emerald-300">
                          <strong>Billing starts</strong> after your 7-day trial ends. You can cancel anytime.
                        </p>
                      </div>

                      <div className="space-y-3 mb-8 text-sm">
                        <div className="flex items-start gap-3">
                          <Zap size={16} className="text-purple-400 flex-shrink-0 mt-1" />
                          <span className="text-slate-300">Full access to all {pricingTiers.find(t => t.id === selectedPlan)?.name} features</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <Shield size={16} className="text-purple-400 flex-shrink-0 mt-1" />
                          <span className="text-slate-300">Cancel your subscription anytime</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <TrendingUp size={16} className="text-purple-400 flex-shrink-0 mt-1" />
                          <span className="text-slate-300">No long-term commitment required</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          export default TrialOnboarding;
                          className="flex-1 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-all font-medium"
