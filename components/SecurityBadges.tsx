import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle, AlertCircle, Eye } from 'lucide-react';

interface SecurityBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const SecurityBadges: React.FC<SecurityBadgeProps> = ({ size = 'md', showDetails = false }) => {
  const sizeClasses = {
    sm: 'text-xs gap-2 px-2 py-1',
    md: 'text-sm gap-3 px-3 py-2',
    lg: 'text-base gap-4 px-4 py-3'
  };

  const iconSizes = { sm: 14, md: 16, lg: 20 };

  const badges = [
    { icon: Lock, label: 'SSL/TLS 1.3 Encrypted', color: 'blue' },
    { icon: Shield, label: 'GDPR Compliant', color: 'purple' },
    { icon: CheckCircle, label: 'SOC 2 Type II', color: 'green' },
    { icon: Eye, label: '2FA Enabled', color: 'amber' }
  ];

  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    green: 'bg-green-500/10 border-green-500/30 text-green-300',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-300'
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2"
      >
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          const colorClass = colorClasses[badge.color as keyof typeof colorClasses];
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className={`flex items-center ${sizeClasses[size]} rounded-lg border ${colorClass} transition-all`}
            >
              <Icon size={iconSizes[size]} className="flex-shrink-0" />
              <span className="font-semibold whitespace-nowrap">{badge.label}</span>
            </motion.div>
          );
        })}
      </motion.div>

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 space-y-3 text-xs text-slate-300"
        >
          <div className="flex gap-2 items-start">
            <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-1" />
            <span><strong>Encryption:</strong> All data encrypted end-to-end with AES-256</span>
          </div>
          <div className="flex gap-2 items-start">
            <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-1" />
            <span><strong>Compliance:</strong> GDPR, CCPA, and privacy shield certified</span>
          </div>
          <div className="flex gap-2 items-start">
            <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-1" />
            <span><strong>Monitoring:</strong> 24/7 intrusion detection and threat monitoring</span>
          </div>
          <div className="flex gap-2 items-start">
            <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-1" />
            <span><strong>Backups:</strong> Automated geo-redundant backups every 6 hours</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SecurityBadges;
