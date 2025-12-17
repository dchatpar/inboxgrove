import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
        name: "Sarah Jenkins",
        role: "Agency Founder",
        text: "Mailscale completely revolutionized our outreach. We went from spending hours setting up G-Suite accounts to spinning up 50 inboxes in minutes.",
        rating: 5
    },
    {
        name: "David Chen",
        role: "Growth Lead @ TechFlow",
        text: "The deliverability is unmatched. We saw a 15% bump in reply rates within the first week of switching our infrastructure.",
        rating: 5
    },
    {
        name: "Marcus Thorne",
        role: "B2B Consultant",
        text: "Best investment for my cold email campaigns. The cost savings alone are worth it, but the time saved is the real game changer.",
        rating: 5
    }
  ];

  return (
    <section className="py-24 bg-slate-950 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-brand-400 font-bold uppercase tracking-wider text-sm mb-2 block">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
            3000+ customers with a competitive advantage
          </h2>
          <p className="text-xl text-slate-400">
            Thousands of B2B firms (agencies, software, consultants, etc.) use these inboxes to get more clients.
            <br/><br/>
            <em className="text-slate-500">Here's what they say:</em>
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  whileHover={{ y: -6 }}
                  className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-sm hover:shadow-brand-500/10 hover:border-slate-700 transition-all"
                >
                    <div className="flex gap-1 mb-4">
                        {[...Array(t.rating)].map((_, i) => (
                            <Star key={i} size={16} className="fill-yellow-500 text-yellow-500" />
                        ))}
                    </div>
                    <p className="text-slate-300 leading-relaxed mb-6 font-medium">
                        "{t.text}"
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-900/50 flex items-center justify-center text-brand-300 font-bold text-sm border border-brand-500/20">
                            {t.name.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-white text-sm">{t.name}</div>
                            <div className="text-slate-500 text-xs">{t.role}</div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;