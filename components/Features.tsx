import React from 'react';
import { motion } from 'framer-motion';
import { Server, ShieldCheck, BarChart3, Zap, Globe, Users } from 'lucide-react';
import { FeatureItem } from '../types';

const features: FeatureItem[] = [
  {
    title: "Unlimited Inboxes",
    description: "Create as many email accounts as you need without extra costs. Scale your volume instantly.",
    icon: Server
  },
  {
    title: "AI Warmup",
    description: "Our AI automatically warms up your inboxes to ensure maximum deliverability and reputation.",
    icon: Zap
  },
  {
    title: "Done-For-You Setup",
    description: "We handle the DNS, SPF, DKIM, and DMARC records. You just hit send.",
    icon: ShieldCheck
  },
  {
    title: "Advanced Analytics",
    description: "Track open rates, reply rates, and bounce rates in real-time across all your campaigns.",
    icon: BarChart3
  },
  {
    title: "Dedicated IPs",
    description: "Get premium dedicated IPs to isolate your reputation and protect your deliverability.",
    icon: Globe
  },
  {
    title: "Team Collaboration",
    description: "Invite your entire team to manage campaigns, replies, and analytics from one dashboard.",
    icon: Users
  }
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-slate-950 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-brand-400 font-semibold tracking-wide uppercase text-sm">Features</h2>
          <h3 className="mt-2 text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Everything you need to send at scale
          </h3>
          <p className="mt-4 text-xl text-slate-400">
            Stop worrying about technical setup and spam filters. We handle the infrastructure so you can focus on closing deals.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              variants={item}
              key={index}
              whileHover={{ y: -4, boxShadow: '0 10px 20px rgba(99,102,241,0.12)' }}
              className="bg-slate-900 rounded-2xl p-8 transition-all border border-slate-800 hover:border-slate-700 hover:bg-slate-800"
            >
              <div className="w-12 h-12 bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-400 mb-6 border border-brand-500/20">
                <feature.icon size={24} />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;