import React from 'react';
import { Shield, DollarSign, Zap, Server, BarChart3, Users, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const BentoFeatures: React.FC = () => {
  return (
    <section className="py-32 bg-gradient-to-b from-[#0a0a0a] via-[#0f0520] to-[#0a0a0a] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808018_1px,transparent_1px),linear-gradient(to_bottom,#80808018_1px,transparent_1px)] bg-[size:40px_40px]"
          animate={{
            backgroundPosition: ['0px 0px', '40px 40px'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px]" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-24"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-block mb-6"
          >
            <div className="relative inline-flex items-center gap-2 bg-gradient-to-r from-violet-600/30 via-fuchsia-600/30 to-cyan-600/30 border border-violet-500/40 px-8 py-3 rounded-full backdrop-blur-xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5 text-violet-400" />
              </motion.div>
              <span className="text-sm font-black bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 text-transparent bg-clip-text uppercase tracking-wider">
                Everything You Need
              </span>
            </div>
          </motion.div>
          <motion.h2 
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Enterprise features.
            <br />
            <motion.span 
              className="inline-block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-[length:200%_auto] text-transparent bg-clip-text"
              animate={{
                backgroundPosition: ['0% center', '200% center'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              Startup pricing.
            </motion.span>
          </motion.h2>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          {/* Large feature - Deliverability Guarantee */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
            whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, type: "spring" }}
            whileHover={{ y: -12, scale: 1.02 }}
            className="md:col-span-3 md:row-span-2 relative group perspective-1000"
          >
            <motion.div
              className="absolute -inset-2 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 rounded-3xl blur-2xl opacity-0 group-hover:opacity-60"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative h-full bg-gradient-to-br from-gray-900 via-emerald-950/30 to-gray-900 p-10 rounded-3xl border-2 border-emerald-500/30 hover:border-emerald-400/60 transition-all backdrop-blur-xl shadow-2xl">
              <motion.div 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-green-600/30 border-2 border-emerald-500/50 flex items-center justify-center mb-8"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Shield className="w-10 h-10 text-emerald-400" />
              </motion.div>
              <h3 className="text-4xl font-black text-white mb-6 leading-tight">
                95-100% Deliverability
                <br />
                <motion.span 
                  className="inline-block bg-gradient-to-r from-emerald-400 to-green-400 text-transparent bg-clip-text"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Guarantee
                </motion.span>
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                We guarantee your emails land in the primary inbox. If deliverability drops, we'll fix it within 7 days or refund 100% + buy new domains at our expense.
              </p>
              <div className="flex flex-wrap gap-3">
                <motion.span 
                  className="px-5 py-3 bg-gradient-to-r from-emerald-600/20 to-green-600/20 border-2 border-emerald-500/40 rounded-xl text-sm text-emerald-300 font-bold backdrop-blur-sm"
                  whileHover={{ scale: 1.05, borderColor: "rgba(16, 185, 129, 0.6)" }}
                >
                  ✅ Money-back guarantee
                </motion.span>
                <motion.span 
                  className="px-5 py-3 bg-gradient-to-r from-emerald-600/20 to-green-600/20 border-2 border-emerald-500/40 rounded-xl text-sm text-emerald-300 font-bold backdrop-blur-sm"
                  whileHover={{ scale: 1.05, borderColor: "rgba(16, 185, 129, 0.6)" }}
                >
                  🔄 Free domain replacement
                </motion.span>
              </div>
            </div>
          </motion.div>

          {/* Cost Savings */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="md:col-span-3 relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="relative h-full bg-gradient-to-br from-gray-900 via-violet-950/20 to-gray-900 p-8 rounded-3xl border-2 border-violet-500/30 hover:border-violet-400/60 transition-all backdrop-blur-xl">
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 border-2 border-violet-500/40 flex items-center justify-center mb-6"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <DollarSign className="w-8 h-8 text-violet-400" />
              </motion.div>
              <h3 className="text-3xl font-black text-white mb-4 leading-tight">
                Save{' '}
                <motion.span 
                  className="inline-block bg-gradient-to-r from-violet-400 to-fuchsia-400 text-transparent bg-clip-text"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  $1,000+
                </motion.span>
                {' '}in 3 months
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                80% cheaper than Google Workspace or Outlook. Scale to hundreds of inboxes without breaking the bank.
              </p>
            </div>
          </motion.div>

          {/* One-Click Integration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="md:col-span-3 relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="relative h-full bg-gradient-to-br from-gray-900 via-cyan-950/20 to-gray-900 p-8 rounded-3xl border-2 border-cyan-500/30 hover:border-cyan-400/60 transition-all backdrop-blur-xl">
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border-2 border-cyan-500/40 flex items-center justify-center mb-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="w-8 h-8 text-cyan-400" />
              </motion.div>
              <h3 className="text-3xl font-black text-white mb-4 leading-tight">
                One-Click <span className="text-cyan-400">Integration</span>
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Works seamlessly with Instantly, Smartlead, Apollo, Lemlist, Reply.io & more
              </p>
              {/* Logo placeholders */}
              <div className="flex flex-wrap gap-3 items-center">
                <motion.div 
                  className="px-4 py-2 bg-cyan-500/10 rounded-lg text-xs text-cyan-300 border border-cyan-500/30 font-semibold"
                  whileHover={{ scale: 1.05, borderColor: "rgba(6, 182, 212, 0.5)" }}
                >
                  Instantly
                </motion.div>
                <motion.div 
                  className="px-4 py-2 bg-cyan-500/10 rounded-lg text-xs text-cyan-300 border border-cyan-500/30 font-semibold"
                  whileHover={{ scale: 1.05, borderColor: "rgba(6, 182, 212, 0.5)" }}
                >
                  Smartlead
                </motion.div>
                <motion.div 
                  className="px-4 py-2 bg-cyan-500/10 rounded-lg text-xs text-cyan-300 border border-cyan-500/30 font-semibold"
                  whileHover={{ scale: 1.05, borderColor: "rgba(6, 182, 212, 0.5)" }}
                >
                  Apollo
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Infrastructure */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="md:col-span-2 relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-br from-orange-600 to-red-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="relative h-full bg-gradient-to-br from-gray-900 via-orange-950/20 to-gray-900 p-8 rounded-3xl border-2 border-orange-500/30 hover:border-orange-400/60 transition-all backdrop-blur-xl">
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-600/30 to-red-600/30 border-2 border-orange-500/40 flex items-center justify-center mb-6"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Server className="w-8 h-8 text-orange-400" />
              </motion.div>
              <h3 className="text-2xl font-black text-white mb-4 leading-tight">
                We <span className="text-orange-400">Own</span> the Infrastructure
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Full control of IP pools. We don't rent from Microsoft—we own everything.
              </p>
            </div>
          </motion.div>

          {/* Advanced Analytics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="md:col-span-2 relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-br from-pink-600 to-fuchsia-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="relative h-full bg-gradient-to-br from-gray-900 via-pink-950/20 to-gray-900 p-8 rounded-3xl border-2 border-pink-500/30 hover:border-pink-400/60 transition-all backdrop-blur-xl">
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600/30 to-fuchsia-600/30 border-2 border-pink-500/40 flex items-center justify-center mb-6"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <BarChart3 className="w-8 h-8 text-pink-400" />
              </motion.div>
              <h3 className="text-2xl font-black text-white mb-4 leading-tight">
                Real-Time <span className="text-pink-400">Analytics</span>
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Track deliverability, opens, replies & reputation across all accounts.
              </p>
            </div>
          </motion.div>

          {/* Team Collaboration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="md:col-span-2 relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="relative h-full bg-gradient-to-br from-gray-900 via-indigo-950/20 to-gray-900 p-8 rounded-3xl border-2 border-indigo-500/30 hover:border-indigo-400/60 transition-all backdrop-blur-xl">
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border-2 border-indigo-500/40 flex items-center justify-center mb-6"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Users className="w-8 h-8 text-indigo-400" />
              </motion.div>
              <h3 className="text-2xl font-black text-white mb-4 leading-tight">
                Team <span className="text-indigo-400">Collaboration</span>
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Invite unlimited team members. Manage campaigns together.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BentoFeatures;
