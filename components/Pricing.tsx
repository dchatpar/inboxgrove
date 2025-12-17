import React, { useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { PricingTier } from '../types';
import { motion } from 'framer-motion';

const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [sliderValue, setSliderValue] = useState(30);

  const getActivePlanId = (val: number) => {
      if (val <= 10) return 'solopreneur';
      if (val <= 30) return 'business';
      if (val < 100) return 'enterprise';
      return 'unlimited';
  };

  const activePlanId = getActivePlanId(sliderValue);

  const tiers: PricingTier[] = [
    {
      id: "solopreneur",
      name: "Solopreneur",
      monthlyPrice: 79,
      yearlyPrice: 63,
      description: "If you're looking to book few sales calls a month - or your target market is very small.\n\nRecommended plan to contact up to ~2,000 prospects a month.",
      features: [
        "Generate Up To 15 Email Inboxes",
        "Get Domains Easily Inside",
        "Fast & Easy 5-Minute Setup",
        "Plug Them Into Any Email Sending Tool"
      ],
      benefits: [
          "Save 4+ hours",
          "Save $29/month compared to Google/Outlook"
      ],
      ctaText: "Start 7-Day Free Trial"
    },
    {
      id: "business",
      name: "Business",
      monthlyPrice: 119,
      yearlyPrice: 95,
      description: "If you're looking to book 10-30 sales calls a month with a normal target market size.\n\nRecommended plan to contact up to ~10,000 prospects a month.",
      features: [
        "Generate Up To 50 Email Inboxes",
        "Get Domains Easily Inside",
        "Fast & Easy 5-Minute Setup",
        "Plug Them Into Any Email Sending Tool"
      ],
      benefits: [
          "Save 12+ hours",
          "Save $241/month compared to Google/Outlook"
      ],
      ctaText: "Start 7-Day Free Trial",
      highlight: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthlyPrice: 249,
      yearlyPrice: 199,
      description: "If you need to scale your offer and make it impossible not to book 30-100+ sales calls a month.\n\nRecommended plan to contact up to ~30,000 prospects a month.",
      features: [
        "Generate Up To 200 Email Inboxes",
        "Add Email Inboxes At Just $1.5/Month Each",
        "Get Domains Easily Inside",
        "Fast & Easy 5-Minute Setup",
        "Plug Them Into Any Email Sending Tool"
      ],
      benefits: [
          "Save 50+ hours",
          "Save $1191/month compared to Google/Outlook"
      ],
      ctaText: "Start 7-Day Free Trial"
    },
    {
        id: "unlimited",
        name: "Unlimited Mailboxes",
        monthlyPrice: "1000+",
        yearlyPrice: "1000+",
        description: "If you're looking to send 100,000+ emails a month while reducing costs by 80% and getting 2-3x more replies.\n\nIncludes dedicated IPs, self-healing mechanism, and dedicated deliverability specialist.\n\nExclusive to large volume senders who don't want to pay per inbox anymore and scale emails like ads.",
        features: [
          "Generate Unlimited Email Inboxes",
          "Real-Time Inbox Placement Tests",
          "Automated Self-healing Mechanism For 20-30% More Replies",
          "Dedicated Deliverability Specialist"
        ],
        benefits: [
            "Save 1000+ hours",
            "Save 6 figures compared to Google/Outlook",
            "Instantly get 20-30% more replies"
        ],
        ctaText: "Apply"
    }
  ];

  return (
    <section id="pricing" className="py-32 bg-gradient-to-b from-[#0a0a0a] via-[#0f0520] to-[#0a0a0a] text-white overflow-hidden relative">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808018_1px,transparent_1px),linear-gradient(to_bottom,#80808018_1px,transparent_1px)] bg-[size:40px_40px]"
          animate={{
            backgroundPosition: ['0px 0px', '40px 40px'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px]" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-block mb-6"
          >
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600/30 via-fuchsia-600/30 to-cyan-600/30 border border-violet-500/40 px-8 py-3 rounded-full backdrop-blur-xl text-sm font-black uppercase tracking-wider">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                💎
              </motion.div>
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 text-transparent bg-clip-text">
                Simple, Transparent Pricing
              </span>
            </span>
          </motion.div>
          <motion.h2 
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Get more replies and start{' '}
            <motion.span 
              className="inline-block bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 text-transparent bg-clip-text"
              animate={{
                backgroundPosition: ['0% center', '200% center'],
              }}
              style={{ backgroundSize: '200% auto' }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              saving money
            </motion.span>{' '}
            today
          </motion.h2>
          <motion.p 
            className="text-gray-300 text-xl md:text-2xl font-medium"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            Scale your infrastructure without the enterprise price tag.
          </motion.p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto mb-20 relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative bg-gradient-to-br from-gray-900 via-violet-950/30 to-gray-900 backdrop-blur-xl p-10 rounded-3xl border-2 border-violet-500/30 hover:border-violet-400/50 transition-all">
            <motion.h3 
              className="text-2xl font-black text-white mb-10 flex items-center justify-center gap-3"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="text-yellow-400 w-7 h-7 fill-current drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
              </motion.div>
              How many more meetings do you want to book per month?
            </motion.h3>
            
            <div className="relative max-w-xl mx-auto mb-12 px-4">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  style={{
                      backgroundImage: `linear-gradient(to right, #6366f1 0%, #6366f1 ${sliderValue}%, #334155 ${sliderValue}%, #334155 100%)`
                  }}
                />
                <div className="flex justify-between mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                    <span>Few</span>
                    <span>Many</span>
                </div>
                
                <div 
                  className="absolute -top-12 transform -translate-x-1/2 bg-brand-600 text-white font-bold py-1 px-3 rounded-lg shadow-lg text-sm transition-all duration-75 border border-brand-500"
                  style={{ left: `${sliderValue}%` }}
                >
                  {sliderValue <= 10 ? '5-10' : sliderValue <= 30 ? '10-30' : sliderValue < 100 ? '30-100' : '100+'}
                </div>
            </div>

            <div className="flex justify-center items-center gap-4">
              <span className={`text-sm font-bold transition-colors ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
              <motion.button 
                onClick={() => setIsAnnual(!isAnnual)}
                whileTap={{ scale: 0.95 }}
                className="relative w-14 h-8 bg-gray-700 rounded-full p-1 transition-colors focus:outline-none ring-offset-2 ring-offset-black focus:ring-2 focus:ring-purple-500"
              >
                <motion.div 
                  animate={{ x: isAnnual ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full shadow-lg"
                />
              </motion.button>
              <span className={`text-sm font-bold transition-colors ${isAnnual ? 'text-white' : 'text-gray-500'}`}>
                Yearly <span className="text-emerald-400 text-xs font-bold bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full ml-1">SAVE 20%</span>
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {tiers.map((tier) => {
            const isActive = activePlanId === tier.id;
            const displayPrice = isAnnual ? tier.yearlyPrice : tier.monthlyPrice;
            
            return (
            <motion.div 
                    key={tier.id} 
                    className={`relative rounded-3xl p-6 transition-all duration-300 flex flex-col h-full
                        ${isActive 
                            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-[0_0_40px_rgba(139,92,246,0.3)] scale-105 z-10 border-2 border-purple-500 ring-1 ring-purple-500/20' 
                            : 'bg-gradient-to-br from-gray-900 to-gray-800 text-slate-300 border border-white/10 hover:border-white/20'
                        }
                    `}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              whileHover={{ y: isActive ? -8 : -4 }}
                >
                    {isActive && (
                        <>
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-3xl blur opacity-75 animate-pulse" />
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-[0_0_15px_rgba(139,92,246,0.6)] border border-purple-400 z-10">
                            ⚡ Recommended
                          </div>
                        </>
                    )}
                    
                    <div className="mb-4">
                        <h4 className={`text-lg font-bold ${isActive ? 'text-white' : 'text-slate-200'}`}>{tier.name}</h4>
                    </div>

                    <div className="mb-6">
                        <span className={`text-4xl font-extrabold tracking-tight ${isActive ? 'text-white' : 'text-slate-200'}`}>
                            {typeof displayPrice === 'number' ? `$${displayPrice}` : displayPrice}
                        </span>
                        <span className={`font-medium ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>/mo</span>
                    </div>

                    <p className={`text-sm mb-8 min-h-[80px] leading-relaxed whitespace-pre-wrap ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                        {tier.description}
                    </p>

                    <motion.button 
                      whileHover={{ scale: 1.02, boxShadow: isActive ? "0 0 30px rgba(139,92,246,0.6)" : "0 10px 20px rgba(0,0,0,0.3)" }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative w-full py-3.5 px-4 rounded-xl font-bold mb-8 transition-all ${
                        isActive 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]' 
                          : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      }`}
                    >
                        {tier.ctaText}
                    </motion.button>

                    <div className={`border-t pt-6 flex-grow relative ${isActive ? 'border-white/10' : 'border-white/5'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${isActive ? 'text-gray-400' : 'text-gray-500'}`}>What's included</p>
                        <ul className="space-y-3 mb-6">
                            {tier.features.map((feature, idx) => (
                                <motion.li 
                                  key={idx} 
                                  initial={{ opacity: 0, x: -10 }}
                                  whileInView={{ opacity: 1, x: 0 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="flex items-start"
                                >
                                    <Check className={`h-4 w-4 mr-2 flex-shrink-0 mt-1 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} strokeWidth={3} />
                                    <span className={`text-sm font-medium ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>{feature}</span>
                                </motion.li>
                            ))}
                        </ul>

                        {tier.benefits && (
                            <>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${isActive ? 'text-gray-400' : 'text-gray-500'}`}>Benefits</p>
                                <ul className="space-y-3">
                                    {tier.benefits.map((benefit, idx) => (
                                        <motion.li 
                                          key={idx} 
                                          initial={{ opacity: 0, x: -10 }}
                                          whileInView={{ opacity: 1, x: 0 }}
                                          viewport={{ once: true }}
                                          transition={{ delay: (tier.features.length + idx) * 0.05 }}
                                          className="flex items-start"
                                        >
                                            <div className={`h-4 w-4 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 ${isActive ? 'bg-green-900/40' : 'bg-gray-800'}`}>
                                                <Check className="h-2.5 w-2.5 text-green-400" strokeWidth={3} />
                                            </div>
                                            <span className={`text-sm font-medium ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>{benefit}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;