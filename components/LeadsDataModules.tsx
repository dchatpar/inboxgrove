import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Zap, Target } from 'lucide-react';
import { integrationService } from '../services/integrationService';
import { useToast } from './ToastProvider';

const LeadsDataModules: React.FC = () => {
  const toast = useToast();
  const [smartleadCampaigns, setSmartleadCampaigns] = useState<any[]>([]);
  const [apolloAccount, setApolloAccount] = useState<any>(null);

  useEffect(() => {
    const smartlead = integrationService.getIntegration('smartlead');
    if (smartlead?.apiKey && smartlead?.accountId) {
      integrationService
        .getSmartleadCampaigns(smartlead.apiKey as string, smartlead.accountId as string)
        .then(res => {
          if (res.ok && res.data?.campaigns) setSmartleadCampaigns(res.data.campaigns);
        });
    }
    const apollo = integrationService.getIntegration('apollo');
    if (apollo?.apiKey) {
      integrationService.testApolloConnection(apollo.apiKey as string).then(res => {
        if (res.ok) setApolloAccount(res.data);
      });
    }
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Database className="text-emerald-400" /> Lead Sources (Smartlead & Apollo)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="text-yellow-400" />
            <h4 className="font-bold">Smartlead Campaigns</h4>
          </div>
          {smartleadCampaigns.length === 0 ? (
            <p className="text-slate-400 text-sm">Connect Smartlead to load campaigns.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {smartleadCampaigns.slice(0,10).map((c:any)=> (
                <li key={c.id} className="p-2 bg-slate-800 rounded">
                  {c.name} — {c.status}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="text-purple-400" />
            <h4 className="font-bold">Apollo Account</h4>
          </div>
          {!apolloAccount ? (
            <p className="text-slate-400 text-sm">Connect Apollo to view account info.</p>
          ) : (
            <div className="text-sm text-slate-300">
              <div>Account: {apolloAccount?.name || apolloAccount?.account?.name}</div>
              <div>Plan: {apolloAccount?.plan || apolloAccount?.account?.plan}</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LeadsDataModules;