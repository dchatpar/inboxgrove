import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';

const Guarantee: React.FC = () => {
  return (
    <section className="py-20 bg-slate-950 border-b border-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 relative overflow-hidden text-center shadow-2xl border border-slate-800">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
             <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(99,102,241,0.2)_0%,transparent_60%)]"></div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-brand-600 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(99,102,241,0.4)] border border-brand-500/30">
               <ShieldCheck size={40} className="text-white" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
              The "Ironclad" Deliverability Guarantee
            </h2>
            
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
              We are so confident in our infrastructure that we take all the risk.
              If you don't see <strong className="text-white">95%+ deliverability</strong> or are not satisfied with the platform for any reason within the first 14 days, we will:
            </p>
            
            <ul className="text-left inline-block space-y-4 mb-10">
               <li className="flex items-center text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-green-900/40 flex items-center justify-center mr-3 border border-green-500/30">
                     <Check size={14} className="text-green-400" strokeWidth={3} />
                  </div>
                  Refund 100% of your subscription
               </li>
               <li className="flex items-center text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-green-900/40 flex items-center justify-center mr-3 border border-green-500/30">
                     <Check size={14} className="text-green-400" strokeWidth={3} />
                  </div>
                  Buy you new domains at our expense (if needed)
               </li>
               <li className="flex items-center text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-green-900/40 flex items-center justify-center mr-3 border border-green-500/30">
                     <Check size={14} className="text-green-400" strokeWidth={3} />
                  </div>
                  Let you keep the generated accounts
               </li>
            </ul>
            
            <a href="#pricing" className="px-10 py-4 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors shadow-lg transform hover:-translate-y-1">
               Claim Your Guarantee
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Guarantee;