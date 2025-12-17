import React from 'react';
import { motion } from 'framer-motion';

const SocialProof: React.FC = () => {
  const partners = [
    { name: "Instantly", src: "https://cdn.prod.website-files.com/661e47646211c5138cc16b64/66e5130f5c522b55b3145c77_4.png", scale: 1 },
    { name: "Smartlead.ai", src: "https://cdn.prod.website-files.com/661e47646211c5138cc16b64/66e5130fc6abb1203e0eae48_7.png", scale: 1 },
    { name: "Apollo.io", text: "Apollo.io", scale: 1.2 },
    { name: "QuickMail", src: "https://cdn.prod.website-files.com/661e47646211c5138cc16b64/67f51ead63ee74ac30e751c1_Quickmail%20Mailscale%20(1).webp", scale: 0.9 },
    { name: "lemlist", text: "lemlist", scale: 1.1 },
    { name: "Success.ai", text: "Success.ai", scale: 1 },
    { name: "Reply", src: "https://cdn.prod.website-files.com/661e47646211c5138cc16b64/66e51378ec07c3fa3fe952a4_Untitled%20design%20Reply.png", scale: 1 },
    { name: "+99 Others", text: "+99 Others", scale: 1 }
  ];

  return (
    <section className="py-12 bg-slate-950 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-10"
        >
          Plug Mailscale inboxes into any email sending tool
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 hover:opacity-100 transition-opacity duration-500"
        >
           {partners.map((partner) => (
               <div key={partner.name} className="flex items-center justify-center">
                   {partner.src ? (
                       <img 
                        src={partner.src} 
                        alt={`${partner.name} logo`} 
                        className="h-8 md:h-9 w-auto object-contain brightness-0 invert" 
                        style={{ transform: `scale(${partner.scale || 1})` }}
                       />
                   ) : (
                       <span className={`text-white font-bold text-xl md:text-2xl tracking-tight`} style={{ fontFamily: 'Inter, sans-serif' }}>
                           {partner.name === 'lemlist' && <span className="font-mono">lemlist</span>}
                           {partner.name === 'Apollo.io' && <span className="font-sans font-extrabold tracking-tighter">Apollo.io</span>}
                           {partner.name === 'Success.ai' && <span className="font-sans font-bold flex items-center gap-1"><span className="text-xl">🚀</span> Success.ai</span>}
                           {partner.name === '+99 Others' && <span className="text-slate-500 text-sm font-medium border border-slate-700 rounded-full px-3 py-1">{partner.name}</span>}
                       </span>
                   )}
               </div>
           ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;