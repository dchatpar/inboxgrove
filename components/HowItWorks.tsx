import React from 'react';
import { motion } from 'framer-motion';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "Choose Your Volume",
      description: "Select how many inboxes you need. Start with 10, scale to 100+. Each inbox comes with a unique domain and dedicated IP."
    },
    {
      num: "02",
      title: "Click 'Deploy'",
      description: "Our system provisions everything automatically: domains registered, DNS configured (SPF/DKIM/DMARC), SMTP servers launched. Takes 60 seconds."
    },
    {
      num: "03",
      title: "We Handle Warmup",
      description: "AI warmup starts immediately. Your inboxes exchange realistic emails 24/7 to build sender reputation. Ready to send campaigns in 14 days (or start immediately if urgent)."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-slate-950 overflow-hidden border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className="text-brand-400 font-semibold tracking-wide uppercase text-sm mb-2">How It Works</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
              Launch your infrastructure in minutes, not days.
            </h3>
            <p className="text-lg text-slate-400 mb-12">
              Traditional email setup is slow and technical. InboxGrove automates the entire process so you can start prospecting immediately.
            </p>

            <div className="space-y-8">
              {steps.map((step) => (
                <div key={step.num} className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-900 border border-slate-700 text-slate-500 font-bold flex items-center justify-center text-lg group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 transition-colors">
                    {step.num}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                    <p className="text-slate-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="relative" initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }}>
             <div className="absolute inset-0 bg-gradient-to-tr from-brand-900/50 to-transparent rounded-3xl transform rotate-3 scale-105 opacity-30 blur-2xl"></div>
             <div className="relative bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-800">
                {/* Abstract Code/Config Visualization */}
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    <span className="text-xs text-slate-500 ml-2">config.json</span>
                </div>
                <div className="space-y-3 font-mono text-sm">
                    <div className="flex">
                        <span className="text-purple-400 mr-2">const</span>
                        <span className="text-blue-400">config</span>
                        <span className="text-slate-500 mx-2">=</span>
                        <span className="text-slate-500">{`{`}</span>
                    </div>
                    <div className="pl-4">
                        <span className="text-slate-500">domain:</span> <span className="text-green-400">"yourcompany.com"</span><span className="text-slate-500">,</span>
                    </div>
                    <div className="pl-4">
                        <span className="text-slate-500">inboxes:</span> <span className="text-orange-400">50</span><span className="text-slate-500">,</span>
                    </div>
                    <div className="pl-4">
                        <span className="text-slate-500">warmup:</span> <span className="text-blue-400">true</span><span className="text-slate-500">,</span>
                    </div>
                    <div className="pl-4">
                        <span className="text-slate-500">dkim:</span> <span className="text-blue-400">true</span><span className="text-slate-500">,</span>
                    </div>
                    <div className="pl-4">
                        <span className="text-slate-500">status:</span> <span className="text-green-400">"active"</span>
                    </div>
                    <div>
                        <span className="text-slate-500">{`}`}</span>
                    </div>
                    <div className="mt-6 p-3 bg-slate-950 rounded border-l-4 border-green-500 text-slate-300">
                        <span className="text-green-500 mr-2">✓</span> DNS Records Verified
                    </div>
                    <div className="p-3 bg-slate-950 rounded border-l-4 border-green-500 text-slate-300">
                        <span className="text-green-500 mr-2">✓</span> 50 Inboxes Created
                    </div>
                     <div className="p-3 bg-slate-950 rounded border-l-4 border-blue-500 text-slate-300 animate-pulse">
                        <span className="text-blue-500 mr-2">➜</span> Warmup Initiated...
                    </div>
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;