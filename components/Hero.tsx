import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Zap, Shield, TrendingUp, Users, Award, Clock, CheckCircle, Rocket, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
  const [typedText, setTypedText] = useState('');
  const fullText = 'Book 30% More Meetings.';
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 80);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-[#0a0a0a] via-[#0f0520] to-[#0a0a0a]">
      {/* Multi-layered animated gradient backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary glow */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.6, 0.4],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-violet-600/40 via-fuchsia-600/40 to-cyan-600/40 blur-[150px] rounded-full"
        />
        {/* Secondary glow */}
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
            rotate: [360, 180, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-gradient-to-l from-blue-600/30 via-purple-600/30 to-pink-600/30 blur-[120px] rounded-full"
        />
        {/* Accent glow */}
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-600/20 via-teal-600/20 to-cyan-600/20 blur-[100px] rounded-full"
        />
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
      >
        
        <motion.div variants={itemVariants} className="inline-block mb-8">
          <motion.span 
            whileHover={{ scale: 1.08, y: -2 }}
            className="relative inline-flex items-center gap-2 bg-gradient-to-r from-violet-600/30 via-fuchsia-600/30 to-cyan-600/30 backdrop-blur-xl border border-violet-500/50 font-bold px-8 py-3 rounded-full text-sm shadow-[0_0_40px_rgba(139,92,246,0.5)]"
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600/20 to-cyan-600/20"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-violet-400" />
            </motion.div>
            <span className="relative z-10 bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 text-transparent bg-clip-text font-extrabold flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
              </span>
              Rated 4.9/5 by 3,247 Sales Teams
            </span>
            <motion.div
              className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 blur-md bg-gradient-to-r from-violet-600 to-cyan-600"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.span>
        </motion.div>

        <motion.h1 
          variants={itemVariants}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.05]"
        >
          <motion.span 
            className="block bg-gradient-to-br from-white via-violet-100 to-fuchsia-200 text-transparent bg-clip-text drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            {typedText}
          </motion.span>
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-1 h-16 md:h-20 lg:h-24 bg-gradient-to-b from-violet-500 to-fuchsia-500 ml-2 align-middle shadow-[0_0_20px_rgba(139,92,246,0.8)]"
          />
          <br />
          <motion.span 
            className="block mt-4 bg-gradient-to-r from-violet-400 via-fuchsia-400 via-cyan-400 to-violet-400 bg-[length:200%_auto] text-transparent bg-clip-text drop-shadow-[0_0_50px_rgba(139,92,246,0.6)]"
            animate={{
              backgroundPosition: ['0% center', '200% center'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            Generate 50 Inboxes in 60 Seconds.
          </motion.span>
        </motion.h1>

        <motion.p 
          variants={itemVariants}
          className="mt-8 text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-4 leading-relaxed"
        >
          The <span className="text-white font-bold">fastest way</span> to scale cold email outreach. Deploy unlimited high-reputation inboxes in minutes—<span className="text-emerald-400 font-bold">not weeks</span>.
        </motion.p>
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mb-12 max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center backdrop-blur-xl">
              <Clock className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="text-2xl md:text-3xl font-black text-white">60 Sec</div>
              <div className="text-sm text-gray-400 font-medium">Setup Time</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center backdrop-blur-xl">
              <TrendingUp className="w-6 h-6 text-violet-400" />
            </div>
            <div className="text-left">
              <div className="text-2xl md:text-3xl font-black text-white">98.7%</div>
              <div className="text-sm text-gray-400 font-medium">Deliverability</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center backdrop-blur-xl">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="text-left">
              <div className="text-2xl md:text-3xl font-black text-white">$2.50</div>
              <div className="text-sm text-gray-400 font-medium">Per Inbox</div>
            </div>
          </div>
        </motion.div>        <motion.p
          variants={itemVariants}
          className="text-gray-400 text-sm mb-12 flex items-center justify-center gap-2 flex-wrap"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" /> No credit card required
          <span className="text-gray-600">•</span>
          <CheckCircle className="w-4 h-4 text-emerald-400" /> 7-day free trial
          <span className="text-gray-600">•</span>
          <CheckCircle className="w-4 h-4 text-emerald-400" /> Cancel anytime
        </motion.p>
        {/* Customer logos / Social Proof */}
        <motion.div 
          variants={itemVariants}
          className="mb-16"
        >
          <p className="text-gray-500 text-sm font-medium mb-6 uppercase tracking-wider">Trusted by high-growth teams at</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            {['TechCorp', 'GrowthLabs', 'SalesPro', 'LeadGen+', 'CloudScale'].map((company, i) => (
              <motion.div
                key={company}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 0.6, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ opacity: 1, scale: 1.05 }}
                className="text-gray-400 font-bold text-xl"
              >
                {company}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
        >
          <motion.a
            href="#pricing"
            whileHover={{ scale: 1.08, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group relative inline-flex items-center justify-center px-12 py-5 text-xl font-black text-white rounded-2xl overflow-hidden transition-all"
          >
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-200%', '200%'],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            {/* Glow effect */}
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-100"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="relative z-10 flex items-center gap-3">
              <Rocket className="w-6 h-6" />
              Deploy Your First 10 Inboxes Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.a>
          
          <motion.a
            href="#pricing"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group relative inline-flex items-center justify-center px-12 py-5 text-xl font-bold text-white bg-white/5 backdrop-blur-xl border-2 border-white/20 rounded-2xl hover:border-violet-400/50 hover:bg-white/10 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]"
          >
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <span className="relative z-10 flex items-center gap-2">
              <Play className="w-5 h-5" />
              See 2-Min Demo
            </span>
          </motion.a>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="text-xs text-gray-600 mb-16"
        >
          No credit card required • 7-day free trial • Cancel anytime
        </motion.div>

        {/* Video Placeholder with Glassmorphism */}
        <motion.div 
          variants={itemVariants}
          className="mt-12 relative max-w-6xl mx-auto group cursor-pointer"
        >
            {/* Glow effects */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-2xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />
            
            <motion.div 
              whileHover={{ y: -8, scale: 1.01 }}
              className="relative aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-xl"
              role="img" 
              aria-label="InboxGrove product demo thumbnail"
            >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                
                <img 
                    src="https://cdn.prod.website-files.com/661e47646211c5138cc16b64/684afc6c1cf037d141d836a0_yassin-thumb.webp" 
                    alt="InboxGrove Demo Thumbnail" 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
                
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="relative"
                    >
                        <div className="absolute inset-0 bg-purple-600 rounded-full blur-xl opacity-40" />
                        <div className="relative w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Floating stats */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute bottom-8 left-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-4 z-20"
                >
                  <div className="text-2xl font-bold text-white">3,000+</div>
                  <div className="text-sm text-gray-400">Active Users</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                  className="absolute bottom-8 right-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-4 z-20"
                >
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text">98.5%</div>
                  <div className="text-sm text-gray-400">Deliverability</div>
                </motion.div>
            </motion.div>
        </motion.div>

      </motion.div>
    </section>
  );
};

export default Hero;