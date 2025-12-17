import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Mail, Users, Award, Zap, Clock, Shield } from 'lucide-react';

const StatsAndProof: React.FC = () => {
  const stats = [
    { 
      value: '3,247+', 
      label: 'Sales Teams', 
      icon: Users,
      color: 'from-violet-500 to-fuchsia-500',
      bgColor: 'from-violet-500/10 to-fuchsia-500/10'
    },
    { 
      value: '8.2M+', 
      label: 'Emails Delivered', 
      icon: Mail,
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'from-cyan-500/10 to-blue-500/10'
    },
    { 
      value: '98.7%', 
      label: 'Avg Deliverability', 
      icon: TrendingUp,
      color: 'from-emerald-500 to-green-500',
      bgColor: 'from-emerald-500/10 to-green-500/10'
    },
    { 
      value: '$1.2M+', 
      label: 'Saved Annually', 
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-500/10 to-orange-500/10'
    }
  ];

  const testimonials = [
    {
      quote: "Cut our email infrastructure costs by 76% while actually improving deliverability. ROI was instant.",
      author: "Marcus Chen",
      role: "VP Sales @ TechFlow",
      rating: 5,
      image: "https://ui-avatars.com/api/?name=Marcus+Chen&background=8b5cf6&color=fff&size=128"
    },
    {
      quote: "Deployed 100 inboxes in under 2 minutes. This would've taken our team 3 weeks manually. Game changer.",
      author: "Sarah Mitchell",
      role: "CEO @ GrowthScale",
      rating: 5,
      image: "https://ui-avatars.com/api/?name=Sarah+Mitchell&background=d946ef&color=fff&size=128"
    },
    {
      quote: "98.9% inbox placement rate. Our cold email program went from struggling to thriving overnight.",
      author: "David Park",
      role: "Head of Growth @ SalesPro",
      rating: 5,
      image: "https://ui-avatars.com/api/?name=David+Park&background=06b6d4&color=fff&size=128"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-[#0f0520] to-[#0a0a0a] border-b border-white/5 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-l from-violet-600/20 to-fuchsia-600/20 blur-[120px] rounded-full"
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Trusted by the world's fastest growing teams
          </h2>
          <p className="text-xl text-gray-400">Real results from real customers</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="relative group"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.color} rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity`} />
                <div className={`relative bg-gradient-to-br ${stat.bgColor} backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center`}>
                  <div className="flex justify-center mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${stat.color} text-transparent bg-clip-text mb-1`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
              Rated 4.9/5 by sales leaders
            </h3>
            <p className="text-gray-400 text-lg">See why InboxGrove is the #1 choice for cold email infrastructure</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity" />
                <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed flex-grow text-lg">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-4">
                    <img 
                      src={testimonial.image}
                      alt={testimonial.author}
                      className="w-12 h-12 rounded-full border-2 border-white/20"
                    />
                    <div>
                      <div className="font-bold text-white">{testimonial.author}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-white/10 rounded-2xl p-8 backdrop-blur-xl"
        >
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm font-semibold">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center border border-violet-500/30">
                <Clock className="w-5 h-5 text-violet-400" />
              </div>
              <span className="text-sm font-semibold">99.9% Uptime SLA</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-sm font-semibold">24/7 Support</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm font-semibold">Enterprise Security</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default StatsAndProof;
