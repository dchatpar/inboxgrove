import React from 'react';
import { motion } from 'framer-motion';
import { FeatureBlockProps } from '../types';

const FeatureSection: React.FC<FeatureBlockProps> = ({ 
  title, 
  description, 
  imageSrc, 
  imageAlt, 
  reverse = false, 
  subtitle,
  ctaText,
  ctaHref = "#pricing"
}) => {
  return (
    <section className="py-20 lg:py-32 bg-slate-950 overflow-hidden border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
          className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 ${reverse ? 'lg:flex-row-reverse' : ''}`}
        >
          
          <motion.div className="w-full lg:w-1/2" initial={{ opacity: 0, x: reverse ? 40 : -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            {subtitle && (
                <div className="inline-block px-3 py-1 bg-brand-900/30 text-brand-300 rounded-full text-xs font-bold uppercase tracking-wide mb-6 border border-brand-500/20">
                    {subtitle}
                </div>
            )}
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-[1.1] mb-6">
              {title}
            </h2>
            <div className="text-lg text-slate-400 leading-relaxed mb-8 space-y-4">
              {description}
            </div>
            {ctaText && (
                 <a href={ctaHref} className="inline-flex justify-center items-center px-8 py-3.5 text-base font-bold rounded-lg text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-lg hover:shadow-brand-500/30 border border-brand-500/50">
                    {ctaText}
                 </a>
            )}
          </motion.div>

          <motion.div className="w-full lg:w-1/2" initial={{ opacity: 0, x: reverse ? -40 : 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <motion.div whileHover={{ y: -6 }} className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 group">
               <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
               <img 
                 src={imageSrc} 
                 alt={imageAlt} 
                 className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
               />
            </motion.div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};

export default FeatureSection;