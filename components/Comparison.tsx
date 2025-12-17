import React from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const Comparison: React.FC = () => {
  return (
    <section className="py-24 bg-slate-950 border-y border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-brand-400 font-bold uppercase tracking-wider text-sm mb-2 block">
             5x cheaper and 50x faster.
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Automatically create email inboxes that get more replies while saving up to 80% on costs
          </h2>
          <p className="mt-6 text-lg text-slate-400">
            Create 50 or 1000 email inboxes in less than 60 seconds.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Old Way */}
          <motion.div 
            className="bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-800 opacity-70 hover:opacity-100 transition-opacity"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="w-8 h-8 rounded-full bg-red-900/30 text-red-500 flex items-center justify-center mr-3 border border-red-900/50">
                    <X size={18} strokeWidth={3} />
                </span>
                The old way
            </h3>
            <p className="text-slate-400 mb-6 min-h-[48px]">
              Manually set up domains, email accounts, DMARC, DKIM, SPF, domain forwarding, email forwarding.
            </p>
            <div className="rounded-lg overflow-hidden border border-slate-800 opacity-60 grayscale">
                 <img 
                    src="https://cdn.prod.website-files.com/661e47646211c5138cc16b64/661e4a5f2a2cb05bb88b25f8_Frame%204389.webp" 
                    alt="Old manual process" 
                    className="w-full h-auto object-cover"
                 />
            </div>
          </motion.div>

          {/* New Way */}
          <motion.div 
            className="bg-slate-900 p-8 rounded-2xl shadow-2xl shadow-brand-900/20 border-2 border-brand-600 relative transform md:-translate-y-4"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            whileHover={{ y: -6 }}
          >
             <div className="absolute top-0 right-0 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-lg">
                 RECOMMENDED
             </div>
            <h3 className="text-xl font-bold text-brand-400 mb-4 flex items-center">
                <span className="w-8 h-8 rounded-full bg-brand-900/50 text-brand-400 flex items-center justify-center mr-3 border border-brand-500/30">
                    <Check size={18} strokeWidth={3} />
                </span>
                The new way
            </h3>
            <p className="text-slate-300 mb-6 min-h-[48px]">
              Use Mailscale to create inboxes, then add them to your email sending tool with a single click.
            </p>
             <div className="rounded-lg overflow-hidden border border-slate-800 shadow-xl">
                 <img 
                    src="https://cdn.prod.website-files.com/661e47646211c5138cc16b64/661e4a5f434497684b7b8c03_Group%201171275964.webp" 
                    alt="New Mailscale process" 
                    className="w-full h-auto object-cover"
                 />
            </div>
          </motion.div>
        </div>
        
        <motion.div className="mt-12 text-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}>
            <a href="#pricing" className="inline-flex justify-center items-center px-8 py-4 text-lg font-bold rounded-lg text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-lg hover:shadow-brand-500/30">
                Start for Free
            </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Comparison;