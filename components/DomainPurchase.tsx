import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react';
import EnomService, { EnomCredentials } from '../services/enomService';
import { useToast } from './ToastProvider';

interface DomainPurchaseProps {
  onPurchased?: (domain: string) => void;
}

const defaultCreds: EnomCredentials = {
  url: 'https://resellertest.enom.com',
  uid: 'apexbyteinc',
  apiKey: '67BMECH5AA7PUFQQUMLVZELETWA32DCBRQGOEIQF',
  password: 'password',
};

const DomainPurchase: React.FC<DomainPurchaseProps> = ({ onPurchased }) => {
  const toast = useToast();
  const [domain, setDomain] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [years, setYears] = useState('1');

  const handleCheck = async () => {
    if (!domain.includes('.')) {
      toast.error('Enter a valid domain (e.g., example.com)');
      return;
    }
    setChecking(true);
    try {
      const res = await EnomService.checkAvailability(defaultCreds, domain);
      const isAvail = res?.interface?.response?.RRPCode === '210';
      setAvailable(isAvail);
      toast[isAvail ? 'success' : 'warning'](isAvail ? 'Domain is available' : 'Domain is not available');
    } catch (e: any) {
      toast.error('Failed to check availability');
    } finally {
      setChecking(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const res = await EnomService.purchaseDomain(defaultCreds, domain, years);
      if (res.ok) {
        toast.success('Domain purchased successfully');
        onPurchased?.(domain);
      } else {
        toast.error(res.message || 'Purchase failed');
      }
    } catch (e: any) {
      toast.error('Purchase error');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Globe className="text-blue-400" /> Domain Registration (eNom Test)
      </h3>
      <div className="flex gap-3">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="yourdomain.com"
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-white"
        />
        <select value={years} onChange={(e) => setYears(e.target.value)} className="bg-surface border border-border rounded-lg px-3 text-white">
          <option value="1">1 year</option>
          <option value="2">2 years</option>
          <option value="3">3 years</option>
        </select>
        <button onClick={handleCheck} disabled={checking} className="px-4 py-3 bg-slate-800 border border-border rounded-lg text-white">Check</button>
        <button onClick={handlePurchase} disabled={!available || purchasing} className="px-4 py-3 bg-primary text-white rounded-lg flex items-center gap-2">
          <ShoppingCart size={16} /> Purchase
        </button>
      </div>
      {available !== null && (
        <div className={`p-3 rounded-lg border ${available ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <div className="flex items-center gap-2 text-sm">
            {available ? <CheckCircle className="text-green-400" /> : <AlertCircle className="text-red-400" />}
            <span>{available ? 'Domain is available' : 'Domain is not available'}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DomainPurchase;