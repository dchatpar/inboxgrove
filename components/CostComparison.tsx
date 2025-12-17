import React from 'react';
import { Check, X, Calculator } from 'lucide-react';

const CostComparison: React.FC = () => {
  return (
    <section className="py-24 bg-slate-950 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-brand-400 font-semibold tracking-wide uppercase text-sm mb-2">
            The Math is Simple
          </h2>
          <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            Stop overpaying for G-Suite
          </h3>
          <p className="text-xl text-slate-400">
            ScaleMail isn't just faster—it's 80% cheaper than the traditional method.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl shadow-xl border border-slate-800 bg-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-3">
            
            {/* Feature Column */}
            <div className="p-8 md:col-span-1 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/50 flex flex-col justify-center">
               <h4 className="text-lg font-bold text-white mb-6">Scenario: 50 Inboxes</h4>
               <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                 You want to send 1,500 emails a day. You need 50 email accounts to do this safely.
               </p>
               <div className="flex items-center gap-2 text-brand-400 font-bold">
                 <Calculator size={20} />
                 <span>Monthly Cost Analysis</span>
               </div>
            </div>

            {/* Google / Outlook */}
            <div className="p-8 md:col-span-1 border-b md:border-b-0 md:border-r border-slate-800 relative bg-slate-900">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-700 text-slate-300 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-slate-600">
                Traditional Way
              </div>
              <h4 className="text-2xl font-bold text-white text-center mb-2">Google / Outlook</h4>
              <p className="text-slate-500 text-center text-sm mb-8">Manual Setup</p>

              <div className="space-y-6">
                 <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                    <span className="text-slate-400 font-medium">Cost Per Inbox</span>
                    <span className="text-white font-bold">$6 - $12 /mo</span>
                 </div>
                 <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                    <span className="text-slate-400 font-medium">Setup Time</span>
                    <span className="text-red-400 font-bold flex items-center gap-2">
                       <X size={16} /> 10+ Hours
                    </span>
                 </div>
                 <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                    <span className="text-slate-400 font-medium">DNS Configuration</span>
                    <span className="text-white font-bold">Manual</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Total Monthly Cost</span>
                    <span className="text-red-500 text-2xl font-extrabold">$360+</span>
                 </div>
              </div>
            </div>

            {/* MailScale */}
            <div className="p-8 md:col-span-1 bg-brand-900/20 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-brand-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg border border-brand-500">
                ScaleMail Way
              </div>
              <h4 className="text-2xl font-bold text-brand-400 text-center mb-2">ScaleMail</h4>
              <p className="text-brand-300 text-center text-sm mb-8">Automated Infrastructure</p>

              <div className="space-y-6">
                 <div className="flex justify-between items-center pb-4 border-b border-brand-500/20">
                    <span className="text-slate-300 font-medium">Cost Per Inbox</span>
                    <span className="text-brand-400 font-bold">$1.50 /mo</span>
                 </div>
                 <div className="flex justify-between items-center pb-4 border-b border-brand-500/20">
                    <span className="text-slate-300 font-medium">Setup Time</span>
                    <span className="text-green-400 font-bold flex items-center gap-2">
                       <Check size={16} /> 2 Minutes
                    </span>
                 </div>
                 <div className="flex justify-between items-center pb-4 border-b border-brand-500/20">
                    <span className="text-slate-300 font-medium">DNS Configuration</span>
                    <span className="text-brand-400 font-bold">Automated</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Total Monthly Cost</span>
                    <span className="text-brand-400 text-2xl font-extrabold">$119</span>
                 </div>
              </div>
              
              <div className="mt-8 text-center">
                 <span className="inline-block bg-green-900/30 text-green-400 px-4 py-2 rounded-lg text-sm font-bold border border-green-500/30">
                    You save $2,892 / year
                 </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CostComparison;