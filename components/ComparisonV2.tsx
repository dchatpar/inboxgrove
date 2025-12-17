import React, { useState } from 'react';
import { X, Check, Clock, Zap, Shield, TrendingUp, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const ComparisonV2: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section className="py-32 bg-gradient-to-b from-[#0a0a0a] via-[#0f0520] to-[#0a0a0a] relative overflow-hidden">
      {/* Enhanced Background with animated grid */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808018_1px,transparent_1px),linear-gradient(to_bottom,#80808018_1px,transparent_1px)] bg-[size:40px_40px]"
          animate={{
            backgroundPosition: ['0px 0px', '40px 40px'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        {/* Radial gradient overlays */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px]" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-24">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-block mb-6"
          >
            <div className="relative inline-flex items-center gap-2 bg-gradient-to-r from-red-600/20 via-orange-600/20 to-green-600/20 border border-green-500/40 px-8 py-3 rounded-full backdrop-blur-xl">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-green-400" />
              </motion.div>
              <span className="text-sm font-black bg-gradient-to-r from-red-400 via-orange-400 to-green-400 text-transparent bg-clip-text uppercase tracking-wider">
                🔥 5x cheaper • 50x faster
              </span>
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
          <motion.h2 
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Stop spending{' '}
            <motion.span 
              className="inline-block bg-gradient-to-r from-red-400 to-orange-400 text-transparent bg-clip-text"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              12+ hours
            </motion.span>
            {' '}setting up email infrastructure.{' '}
            <motion.span 
              className="block mt-2 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-[length:200%_auto] text-transparent bg-clip-text"
              animate={{
                backgroundPosition: ['0% center', '200% center'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              Deploy in 60 seconds instead.
            </motion.span>
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 font-medium"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            Traditional setup: <span className="text-red-400 font-bold line-through">$600/month</span> + weeks of work.{' '}
            <span className="block mt-2">
              MailScale: <span className="text-emerald-400 font-bold">$125/month</span> + automated in{' '}
              <span className="relative inline-block">
                <span className="text-cyan-400 font-bold">60 seconds</span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400 to-cyan-400"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                />
              </span>
            </span>
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto mb-16">
          {/* The Old Way - Pain Point Card */}
          <motion.div
            initial={{ opacity: 0, x: -50, rotateY: -10 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, type: "spring" }}
            onHoverStart={() => setHoveredCard('old')}
            onHoverEnd={() => setHoveredCard(null)}
            className="relative group perspective-1000"
          >
            <motion.div
              animate={{
                rotateY: hoveredCard === 'old' ? 2 : 0,
                z: hoveredCard === 'old' ? 30 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="relative transform-gpu"
            >
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-br from-red-600/30 to-orange-600/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500" />
              
              <div className="relative bg-gradient-to-br from-gray-900 via-red-950/20 to-gray-900 p-10 rounded-3xl border-2 border-red-500/30 hover:border-red-500/60 transition-all duration-300 shadow-2xl backdrop-blur-xl">
                {/* Warning badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="absolute -top-6 -right-6 bg-gradient-to-br from-red-600 to-orange-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg border-2 border-red-400 rotate-12"
                >
                  ⚠️ OUTDATED
                </motion.div>

                <div className="flex items-center gap-4 mb-8">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600/20 to-orange-600/20 border-2 border-red-500/40 flex items-center justify-center backdrop-blur-xl"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <X className="w-8 h-8 text-red-400" strokeWidth={3} />
                  </motion.div>
                  <div>
                    <h3 className="text-3xl font-black text-white">The Old Way</h3>
                    <p className="text-red-400 font-semibold text-sm">Manual • Slow • Expensive</p>
                  </div>
                </div>

                <p className="text-gray-300 mb-10 leading-relaxed text-lg">
                  Setting up Google Workspace or Outlook for cold email: buy domain ($12), configure DNS records manually (SPF, DKIM, DMARC), set up forwarding, manually warm each inbox for 30 days...
                  <span className="block mt-2 text-red-400 font-semibold">😓 One mistake = spam folder forever.</span>
                </p>

                <div className="space-y-5 mb-10">
                  <motion.div 
                    className="flex items-start gap-4 p-4 bg-red-950/30 border border-red-500/20 rounded-2xl backdrop-blur-sm"
                    whileHover={{ x: 5, backgroundColor: "rgba(127, 29, 29, 0.5)" }}
                  >
                    <AlertCircle className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                      <span className="block text-white font-bold text-lg">12+ Hours Per Client</span>
                      <span className="text-gray-400">Buy domains, configure DNS, set up SMTP, manually warm 50 inboxes for 4 weeks</span>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="flex items-start gap-4 p-4 bg-red-950/30 border border-red-500/20 rounded-2xl backdrop-blur-sm"
                    whileHover={{ x: 5, backgroundColor: "rgba(127, 29, 29, 0.5)" }}
                  >
                    <TrendingUp className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                      <span className="block text-white font-bold text-lg">$300-$600/month</span>
                      <span className="text-gray-400">Google Workspace ($6/inbox) + domain costs + warmup tools ($50/mo)</span>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="flex items-start gap-4 p-4 bg-red-950/30 border border-red-500/20 rounded-2xl backdrop-blur-sm"
                    whileHover={{ x: 5, backgroundColor: "rgba(127, 29, 29, 0.5)" }}
                  >
                    <Shield className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                      <span className="block text-white font-bold text-lg">High Risk of Blacklisting</span>
                      <span className="text-gray-400">Miss one DNS record? Spam folder. No reputation monitoring = flying blind.</span>
                    </div>
                  </motion.div>
                </div>

                <div className="rounded-2xl overflow-hidden border-2 border-gray-700 opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-70 transition-all duration-500">
                  <img 
                    src="https://cdn.prod.website-files.com/661e47646211c5138cc16b64/661e4a5f2a2cb05bb88b25f8_Frame%204389.webp" 
                    alt="Old manual process" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* The New Way - Solution Card */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: 10 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, type: "spring", delay: 0.1 }}
            onHoverStart={() => setHoveredCard('new')}
            onHoverEnd={() => setHoveredCard(null)}
            className="relative group perspective-1000 md:-translate-y-12"
          >
            <motion.div
              animate={{
                rotateY: hoveredCard === 'new' ? -2 : 0,
                z: hoveredCard === 'new' ? 50 : 0,
                y: hoveredCard === 'new' ? -10 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="relative transform-gpu"
            >
              {/* Multi-layer glow effect */}
              <motion.div 
                className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 rounded-3xl blur-2xl"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                  scale: [0.98, 1.02, 0.98],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 rounded-3xl blur-3xl opacity-40 group-hover:opacity-60 transition-opacity" />
              
              <div className="relative bg-gradient-to-br from-gray-900 via-violet-950/30 to-gray-900 p-10 rounded-3xl border-2 border-violet-500/60 hover:border-violet-400/80 transition-all duration-300 shadow-2xl backdrop-blur-xl">
                {/* Floating badge */}
                <motion.div
                  initial={{ y: -100, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  animate={{ y: [0, -5, 0] }}
                  style={{ transition: "transform 2s ease-in-out infinite" }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 z-10"
                >
                  <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 text-white text-sm font-black px-8 py-3 rounded-full shadow-[0_0_30px_rgba(139,92,246,0.8)] border-2 border-violet-300 backdrop-blur-xl">
                    ⚡ RECOMMENDED • BEST VALUE
                  </div>
                </motion.div>

                <div className="flex items-center gap-4 mb-8 mt-4">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-600/30 border-2 border-violet-400/50 flex items-center justify-center backdrop-blur-xl"
                    whileHover={{ rotate: 360, scale: 1.15 }}
                    transition={{ duration: 0.6 }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-violet-300" strokeWidth={3} />
                  </motion.div>
                  <div>
                    <h3 className="text-3xl font-black bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 text-transparent bg-clip-text">
                      The Mailscale Way
                    </h3>
                    <p className="text-violet-400 font-semibold text-sm">Automated • Fast • Affordable</p>
                  </div>
                </div>

                <p className="text-gray-200 mb-10 leading-relaxed text-lg font-medium">
                  Click 'Deploy'. Wait 60 seconds. Get 50 ready-to-send inboxes with domains, DNS, dedicated IPs, and automatic warmup already configured.
                  <span className="block mt-2 text-emerald-400 font-bold">✨ Zero technical knowledge required.</span>
                </p>

                <div className="space-y-5 mb-10">
                  <motion.div 
                    className="flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-950/40 to-green-950/40 border-2 border-emerald-500/40 rounded-2xl backdrop-blur-sm"
                    whileHover={{ x: 5, scale: 1.02, borderColor: "rgba(16, 185, 129, 0.6)" }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Zap className="w-6 h-6 text-emerald-400 mt-1 flex-shrink-0" />
                    </motion.div>
                    <div>
                      <span className="block text-white font-bold text-lg">60 Seconds Setup</span>
                      <span className="text-gray-300">100% automated. Deploy 50 inboxes while you grab coffee ☕</span>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="flex items-start gap-4 p-4 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border-2 border-cyan-500/40 rounded-2xl backdrop-blur-sm"
                    whileHover={{ x: 5, scale: 1.02, borderColor: "rgba(6, 182, 212, 0.6)" }}
                  >
                    <TrendingUp className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" />
                    <div>
                      <span className="block text-white font-bold text-lg">$2.50/inbox/month</span>
                      <span className="text-gray-300">75% cheaper than Google Workspace. Save $1,200+/year 💰</span>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="flex items-start gap-4 p-4 bg-gradient-to-r from-violet-950/40 to-fuchsia-950/40 border-2 border-violet-500/40 rounded-2xl backdrop-blur-sm"
                    whileHover={{ x: 5, scale: 1.02, borderColor: "rgba(139, 92, 246, 0.6)" }}
                  >
                    <Shield className="w-6 h-6 text-violet-400 mt-1 flex-shrink-0" />
                    <div>
                      <span className="block text-white font-bold text-lg">98%+ Deliverability Guaranteed</span>
                      <span className="text-gray-300">24/7 AI warmup + real-time health monitoring + auto-repair 🤖</span>
                    </div>
                  </motion.div>
                </div>

                <motion.div 
                  className="rounded-2xl overflow-hidden border-2 border-violet-500/50 shadow-[0_0_50px_rgba(139,92,246,0.4)] group-hover:shadow-[0_0_80px_rgba(139,92,246,0.6)] transition-all duration-500"
                  whileHover={{ scale: 1.02 }}
                >
                  <img 
                    src="https://cdn.prod.website-files.com/661e47646211c5138cc16b64/661e4a5f434497684b7b8c03_Group%201171275964.webp" 
                    alt="New Mailscale process" 
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-20 text-center relative"
        >
          {/* Floating particles around CTA */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-violet-400/40 rounded-full blur-sm"
              style={{
                left: `${50 + Math.cos((i / 8) * Math.PI * 2) * 40}%`,
                top: `${50 + Math.sin((i / 8) * Math.PI * 2) * 40}%`,
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
          
          <motion.a
            href="#pricing"
            whileHover={{ scale: 1.08, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="group relative inline-flex items-center justify-center px-14 py-6 text-xl font-black text-white rounded-2xl overflow-hidden transition-all shadow-[0_0_60px_rgba(139,92,246,0.5)] hover:shadow-[0_0_100px_rgba(139,92,246,0.8)]"
          >
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 via-cyan-600 to-violet-600 bg-[length:200%_auto]"
              animate={{
                backgroundPosition: ['0% center', '200% center'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            {/* Shine overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{
                x: ['-200%', '200%'],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            {/* Glow effect */}
            <motion.div
              className="absolute -inset-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 rounded-2xl blur-2xl opacity-50 group-hover:opacity-100"
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <span className="relative z-10 flex items-center gap-3">
              <motion.span
                animate={{ rotate: [0, 14, -14, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
              >
                🚀
              </motion.span>
              Start Saving 80% Today
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-2xl"
              >
                →
              </motion.span>
            </span>
          </motion.a>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-gray-400 text-sm font-medium"
          >
            🎁 <span className="text-white">7-day free trial</span> • No credit card required • Cancel anytime
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonV2;
