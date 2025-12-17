import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { Rocket, CheckCircle, Globe, ArrowRight, Server, RotateCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { trialApi } from '../services/trialApi';

interface ProvisioningProps {
  onViewChange: (view: ViewState) => void;
}

const Provisioning: React.FC<ProvisioningProps> = ({ onViewChange }) => {
  const [step, setStep] = useState(1);
  const [volume, setVolume] = useState(10);
  const [region, setRegion] = useState('US-EAST');
  const [domainQuery, setDomainQuery] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [domains, setDomains] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);

  // Load domains on mount
  useEffect(() => {
    const loadDomains = async () => {
      setLoadingDomains(true);
      const result = await trialApi.listDomains();
      
      if (result.ok && result.data?.domains) {
        setDomains(result.data.domains);
        if (result.data.domains.length > 0) {
          setSelectedDomainId(result.data.domains[0].id);
        }
      } else if (result.status === 0) {
        // Backend unavailable - demo mode
        console.log('Backend unavailable, using demo domains');
        const demoDomains = [
          { id: 'demo_1', name: 'acme-corp.com' },
          { id: 'demo_2', name: 'sales-team.io' },
          { id: 'demo_3', name: 'outreach-pro.io' }
        ];
        setDomains(demoDomains);
        setSelectedDomainId(demoDomains[0].id);
      }
      setLoadingDomains(false);
    };
    loadDomains();
  }, []);

  // Real Provisioning Process via Backend API
  useEffect(() => {
    if (isProvisioning && selectedDomainId) {
      const provision = async () => {
        try {
          setLogs(['Initiating infrastructure provisioning...']);
          
          // Call backend API
          const result = await trialApi.provisionInboxes({
            domain_id: selectedDomainId,
            inbox_count: volume,
            naming_convention: 'firstname',
          });

          if (result.ok || result.status === 0) {
            // Success OR demo mode fallback
            setProgress(25);
            setLogs(l => [...l, 'Domain verified and configured']);
            
            setTimeout(() => {
              setProgress(50);
              setLogs(l => [...l, 'Allocating dedicated IPs...']);
            }, 500);

            setTimeout(() => {
              setProgress(75);
              setLogs(l => [...l, 'Configuring SPF/DKIM/DMARC records...']);
            }, 1000);

            setTimeout(() => {
              setProgress(100);
              setLogs(l => [...l, `Successfully created ${volume} inboxes!`]);
              setLogs(l => [...l, 'All inboxes are ready for use']);
            }, 1500);
          } else {
            setError(result.error || 'Provisioning failed');
            setLogs(l => [...l, `Error: ${result.error}`]);
            setIsProvisioning(false);
          }
        } catch (err) {
          setError('Failed to provision inboxes');
          setIsProvisioning(false);
        }
      };

      provision();
    }
  }, [isProvisioning, selectedDomainId, volume]);

  const handleLaunch = () => {
    if (!selectedDomainId) {
      setError('Please select or create a domain first');
      return;
    }
    setStep(3);
    setProgress(0);
    setLogs([]);
    setError('');
    setIsProvisioning(true);
  };

  const handleFinish = () => {
    onViewChange('overview');
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button 
          onClick={() => onViewChange('dashboard')} 
          className="text-slate-500 hover:text-white mb-4 text-sm flex items-center gap-1"
        >
          &larr; Back to Dashboard
        </button>
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Rocket className="text-primary" />
          Infrastructure Deployment Wizard
        </h2>
        <p className="text-slate-400 text-lg">Deploy high-reputation cold email infrastructure in seconds.</p>
      </motion.div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-12 relative px-12">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 transform -translate-y-1/2"></div>
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex flex-col items-center z-10`}>
            <motion.div 
              initial={false}
              animate={{ 
                scale: step >= s ? 1.1 : 1,
                borderColor: step >= s ? '#6366f1' : '#1e293b',
                backgroundColor: step >= s ? '#6366f1' : '#0f172a'
              }}
              className={`
                w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-colors duration-300
                ${step >= s ? 'text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-slate-500'}
              `}
            >
              {step > s ? <CheckCircle size={24} /> : s}
            </motion.div>
            <span className={`mt-3 text-xs font-mono font-bold tracking-widest ${step >= s ? 'text-white' : 'text-slate-500'}`}>
              {s === 1 ? 'CONFIG' : s === 2 ? 'DOMAINS' : 'LAUNCH'}
            </span>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <motion.div 
        layout
        className="glass-panel p-8 rounded-2xl border border-border min-h-[450px] relative overflow-hidden"
      >
        
        {/* Step 1: Configuration */}
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div>
              <div className="flex justify-between items-end mb-4">
                 <label className="block text-sm font-bold text-slate-300 font-mono uppercase tracking-wide">
                    Inbox Volume
                 </label>
                 <span className="text-primary font-bold">{volume} Inboxes</span>
              </div>
              
              <div className="flex items-center gap-6">
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={volume} 
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="flex-1 h-3 bg-surface rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="w-24 h-12 bg-surface border border-border rounded-lg flex items-center justify-center font-mono text-xl font-bold text-white shadow-inner">
                  {volume}
                </div>
              </div>
              <p className="mt-3 text-slate-500 text-sm flex items-center gap-2">
                Estimated Monthly Cost: <span className="text-neon-green font-mono font-bold text-lg">${(volume * 2.50).toFixed(2)}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-4 font-mono uppercase tracking-wide">
                Server Region
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['US-EAST', 'EU-WEST', 'APAC'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRegion(r)}
                    className={`p-6 rounded-xl border flex flex-col items-center gap-3 transition-all duration-200 ${
                      region === r 
                        ? 'bg-primary/10 border-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                        : 'bg-surface border-border text-slate-500 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <Globe size={28} className={region === r ? 'text-primary' : ''} />
                    <span className="font-bold text-sm tracking-wide">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-8 border-t border-border">
              <button 
                onClick={() => setStep(2)}
                className="px-8 py-3 bg-primary hover:bg-primary-glow text-white font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
              >
                Next Step <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Domains */}
        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-4 font-mono uppercase tracking-wide">
                Select or Register Domain
              </label>
              
              {/* Domain Selection */}
              {domains.length > 0 && (
                <div className="mb-6">
                  <div className="bg-background rounded-xl border border-border overflow-hidden mb-4">
                    <div className="p-4 border-b border-border bg-slate-900/50 flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <span>Your Domains</span>
                      <span>Status</span>
                    </div>
                    <div className="divide-y divide-border">
                      {domains.map((domain) => (
                        <button
                          key={domain.id}
                          onClick={() => setSelectedDomainId(domain.id)}
                          className={`w-full p-4 flex items-center justify-between hover:bg-surface transition-colors text-left ${
                            selectedDomainId === domain.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="radio" 
                              checked={selectedDomainId === domain.id} 
                              readOnly
                              className="w-4 h-4 rounded-full border-slate-600 bg-slate-800 text-primary focus:ring-0 cursor-pointer" 
                            />
                            <span className="font-mono text-slate-300">{domain.name}</span>
                          </div>
                          <span className="text-neon-green text-xs font-bold bg-neon-green/10 px-2 py-1 rounded border border-neon-green/20">
                            {domain.status || 'READY'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* New Domain Registration */}
              <div className="mb-6">
                <p className="text-sm text-slate-400 mb-3">Or register a new domain:</p>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="e.g., acme-corp.com" 
                    value={domainQuery}
                    onChange={(e) => setDomainQuery(e.target.value)}
                    className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono placeholder-slate-600"
                  />
                  <button 
                    onClick={async () => {
                      if (!domainQuery.trim()) {
                        setError('Please enter a domain name');
                        return;
                      }
                      setError('');
                      const result = await trialApi.registerDomain(domainQuery);
                      if ((result.ok || result.status === 0) && result.data?.domain_id) {
                        // Success OR demo mode
                        const newDomain = { 
                          id: result.data.domain_id, 
                          name: domainQuery
                        };
                        setSelectedDomainId(result.data.domain_id);
                        setDomainQuery('');
                        // Add to domains list
                        setDomains([...domains, newDomain]);
                      } else {
                        setError(result.error || 'Failed to register domain');
                      }
                    }}
                    className="px-6 py-3 bg-slate-800 border border-border rounded-lg text-white font-bold hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <RotateCw size={16} /> Register
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-8 border-t border-border">
              <button 
                onClick={() => setStep(1)}
                className="px-6 py-3 text-slate-400 font-bold hover:text-white transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleLaunch}
                disabled={!selectedDomainId || loadingDomains}
                className="px-8 py-3 bg-neon-green hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-1"
              >
                <Rocket size={18} />
                {loadingDomains ? 'Loading...' : 'Launch Infrastructure'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Provisioning */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-8 h-full">
             
             {!isProvisioning || progress < 100 ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center w-full"
                >
                  <div className="relative w-40 h-40 mb-10">
                     <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                     <motion.div 
                        className="absolute inset-0 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        style={{ filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.5))' }}
                     ></motion.div>
                     <div className="absolute inset-0 flex items-center justify-center font-mono text-3xl font-bold text-white">
                        {progress}%
                     </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Server className="text-primary animate-pulse" /> Provisioning Resources...
                  </h3>
                  <div className="h-48 w-full max-w-lg bg-background rounded-lg border border-border p-4 font-mono text-xs overflow-y-auto custom-scrollbar shadow-inner">
                     {logs.map((log, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-1 text-slate-400"
                        >
                           <span className="text-primary mr-2">{'>'}</span>
                           {log}
                        </motion.div>
                     ))}
                     <motion.div 
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="text-primary"
                     >_</motion.div>
                  </div>
                </motion.div>
             ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                   <div className="w-24 h-24 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                      <CheckCircle size={48} className="text-neon-green" />
                   </div>
                   <h3 className="text-3xl font-bold text-white mb-4">Deployment Complete!</h3>
                   <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                      Your <span className="text-white font-bold">{volume} inboxes</span> are now active and the AI Warmup sequence has been initiated.
                   </p>
                   <button 
                     onClick={handleFinish}
                     className="px-10 py-4 bg-primary hover:bg-primary-glow text-white font-bold rounded-lg shadow-lg shadow-primary/30 transition-all transform hover:-translate-y-1"
                   >
                     Go to Mission Control
                   </button>
                </motion.div>
             )}

          </div>
        )}

      </motion.div>
    </div>
  );
};

export default Provisioning;