import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Globe, KeyRound, FileDown, Cloud, Shield, ArrowRight, ArrowLeft, Loader, Check, AlertCircle } from 'lucide-react';
import cloudflareService, { CloudflareCredentials } from '../services/cloudflareService';
import { DkimPair, generateDnsRecords, toCloudflareRecords } from '../services/dnsRecordGenerator';
import { queryTxt } from '../services/dnsVerifyService';
import { generateDkimKeyPair, extractPublicKeyBase64 } from '../services/dkimService';
import kumoMtaService, { KumoCredentials } from '../services/kumoMtaService';

type WizardStep = 'domain' | 'cloudflare' | 'dkim' | 'deploy' | 'verify' | 'complete';

interface StepConfig {
  id: WizardStep;
  title: string;
  subtitle: string;
}

const steps: StepConfig[] = [
  { id: 'domain', title: 'Domain Details', subtitle: 'Enter your domain information' },
  { id: 'cloudflare', title: 'Connect Cloudflare', subtitle: 'Authenticate with your CF account' },
  { id: 'dkim', title: 'Generate DKIM Keys', subtitle: 'Create email authentication keys' },
  { id: 'deploy', title: 'Deploy Infrastructure', subtitle: 'Provision mail servers & DNS' },
  { id: 'verify', title: 'Verify Setup', subtitle: 'Confirm DNS propagation' },
  { id: 'complete', title: 'Complete', subtitle: 'Your domain is ready' },
];

const DomainSetup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('domain');
  const [domain, setDomain] = useState('');
  const [cfToken, setCfToken] = useState('');
  const [cfZoneId, setCfZoneId] = useState('');
  const [cfConnected, setCfConnected] = useState(false);
  const [selector1] = useState('s1');
  const [selector2] = useState('s2');
  const [dkim1, setDkim1] = useState('');
  const [dkim2, setDkim2] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState<{ s1?: { pub: string; priv: string }; s2?: { pub: string; priv: string } }>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [deployStatus, setDeployStatus] = useState<string[]>([]);
  const [verifyResults, setVerifyResults] = useState<Record<string, { ok: boolean; values: string[] }>>({});
  const [smtpCredentials, setSmtpCredentials] = useState<{ username: string; password: string } | null>(null);
  
  const [kumoBaseUrl] = useState('http://46.21.157.216:8001');
  const [kumoApiKey] = useState('14456a6f18f952990da9e2a3e5d401d8cd321a0f4c8457843eaf6d91dca15f4a');
  const [mailIps] = useState(['46.21.157.216', '46.21.157.209', '46.21.157.222', '46.21.159.173', '46.21.159.189']);
  
  // Load DKIM from storage on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('inboxgrove_dkim_bundle');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.s1?.pub) setDkim1(extractPublicKeyBase64(parsed.s1.pub));
        if (parsed?.s2?.pub) setDkim2(extractPublicKeyBase64(parsed.s2.pub));
        setGeneratedKeys(parsed);
      }
    } catch {}
  }, []);

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const dkimPairs: DkimPair[] = useMemo(() => ([
    { selector: selector1, publicKey: dkim1 },
    { selector: selector2, publicKey: dkim2 },
  ]), [selector1, selector2, dkim1, dkim2]);

  const generated = useMemo(() => generateDnsRecords(domain, dkimPairs, {
    spfIncludes: ['_spf.inboxgrove.net'],
    dmarcPolicy: 'none',
  }), [domain, dkimPairs]);

  const cfRecords = useMemo(() => toCloudflareRecords(generated), [generated]);

  // Validate domain step
  const validateDomain = () => {
    const newErrors: Record<string, string> = {};
    if (!domain || !/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(domain)) {
      newErrors.domain = 'Enter a valid domain (e.g., example.com)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Test Cloudflare connection
  const testCloudflareConnection = async () => {
    if (!cfToken) {
      setErrors({ cfToken: 'API token is required' });
      return;
    }
    setLoading(true);
    setErrors({});
    
    try {
      const creds: CloudflareCredentials = { apiToken: cfToken };
      const z = await cloudflareService.findZoneByName(domain, creds);
      
      if (z.ok && z.data && z.data[0]) {
        setCfZoneId(z.data[0].id);
        setCfConnected(true);
        setErrors({});
      } else {
        setErrors({ cfToken: z.error || 'Zone not found. Ensure domain is added to Cloudflare first.' });
        setCfConnected(false);
      }
    } catch (e: any) {
      setErrors({ cfToken: e?.message || 'Connection failed' });
      setCfConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Generate DKIM keys
  const handleGenerateDkim = async (selector: 's1' | 's2') => {
    setLoading(true);
    try {
      const pair = await generateDkimKeyPair();
      const base64Pub = extractPublicKeyBase64(pair.publicKeyPem);
      
      if (selector === 's1') {
        setDkim1(base64Pub);
        setGeneratedKeys(k => {
          const next = { ...k, s1: { pub: pair.publicKeyPem, priv: pair.privateKeyPem } };
          localStorage.setItem('inboxgrove_dkim_bundle', JSON.stringify(next));
          return next;
        });
      } else {
        setDkim2(base64Pub);
        setGeneratedKeys(k => {
          const next = { ...k, s2: { pub: pair.publicKeyPem, priv: pair.privateKeyPem } };
          localStorage.setItem('inboxgrove_dkim_bundle', JSON.stringify(next));
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Deploy infrastructure (KumoMTA + Cloudflare DNS)
  const deployInfrastructure = async () => {
    setLoading(true);
    setDeployStatus([]);
    const addStatus = (msg: string) => setDeployStatus(prev => [...prev, msg]);
    
    try {
      const creds: KumoCredentials = { baseUrl: kumoBaseUrl, apiKey: kumoApiKey };
      
      // 1. Add domain to KumoMTA
      addStatus('⏳ Adding domain to KumoMTA...');
      const d = await kumoMtaService.createDomain({ domain, selector: selector1 }, creds);
      if (!d.ok) {
        addStatus(`❌ Domain creation failed: ${d.error}`);
        return;
      }
      addStatus('✅ Domain added to KumoMTA');
      
      // 2. Generate DKIM via KumoMTA
      addStatus('⏳ Generating DKIM keys...');
      const dkim = await kumoMtaService.generateDkim({ domain, selector: selector1, key_size: 2048 }, creds);
      if (!dkim.ok) {
        addStatus(`❌ DKIM generation failed: ${dkim.error}`);
        return;
      }
      if (dkim.data?.public_key) {
        setDkim1(dkim.data.public_key);
      }
      addStatus('✅ DKIM keys generated');
      
      // 3. Get DNS records from KumoMTA
      addStatus('⏳ Fetching DNS records...');
      const dns = await kumoMtaService.getDnsRecords(domain, mailIps, creds);
      if (!dns.ok || !dns.data) {
        addStatus(`❌ DNS fetch failed: ${dns.error}`);
        return;
      }
      addStatus('✅ DNS records prepared');
      
      // 4. Create SMTP user
      addStatus('⏳ Creating SMTP user...');
      const username = `user_${domain.replace(/\./g, '_')}`;
      const password = `Pwd${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10).toUpperCase()}!`;
      const user = await kumoMtaService.createUser({ username, password, email: `admin@${domain}` }, creds);
      if (!user.ok) {
        addStatus(`❌ User creation failed: ${user.error}`);
        return;
      }
      setSmtpCredentials({ username, password });
      addStatus(`✅ SMTP user created: ${username}`);
      
      // 5. Apply DNS to Cloudflare
      if (cfConnected && cfZoneId && dns.data) {
        addStatus('⏳ Applying DNS records to Cloudflare...');
        const cf = { apiToken: cfToken } as CloudflareCredentials;
        const cfRecords = dns.data.records.map(r => ({
          type: r.record_type,
          name: r.name,
          content: r.value,
          ttl: r.ttl || 1,
          priority: r.priority,
        }));
        
        const results = await cloudflareService.createDnsRecords(cfZoneId, cfRecords as any, cf);
        const failures = results.filter(r => !r.ok);
        
        if (failures.length === 0) {
          addStatus('✅ All DNS records created in Cloudflare');
        } else {
          addStatus(`⚠️ Some records failed: ${failures.length}/${results.length}`);
        }
      }
      
      // 6. Reload KumoMTA
      addStatus('⏳ Reloading mail server config...');
      const reload = await kumoMtaService.reloadConfig(creds);
      if (reload.ok) {
        addStatus('✅ Mail server reloaded successfully');
      } else {
        addStatus('⚠️ Reload failed - manual reload may be required');
      }
      
      addStatus('🎉 Deployment complete!');
      
      // Auto-advance to verify step
      setTimeout(() => setCurrentStep('verify'), 2000);
      
    } catch (e: any) {
      addStatus(`❌ Error: ${e?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Verify DNS propagation
  const runVerification = async () => {
    setLoading(true);
    const names = [
      `${domain}`,
      `_dmarc.${domain}`,
      `${selector1}._domainkey.${domain}`,
      `${selector2}._domainkey.${domain}`,
    ];
    const results: Record<string, { ok: boolean; values: string[] }> = {};
    
    for (const n of names) {
      const r = await queryTxt(n);
      results[n] = { ok: r.found, values: r.values };
    }
    
    setVerifyResults(results);
    setLoading(false);
    
    // Check if all passed
    const allPassed = Object.values(results).every(r => r.ok);
    if (allPassed) {
      setTimeout(() => setCurrentStep('complete'), 1500);
    }
  };

  // Navigation
  const canProgress = () => {
    if (currentStep === 'domain') return validateDomain();
    if (currentStep === 'cloudflare') return cfConnected;
    if (currentStep === 'dkim') return dkim1 && dkim2;
    if (currentStep === 'deploy') return deployStatus.some(s => s.includes('🎉'));
    if (currentStep === 'verify') return Object.keys(verifyResults).length > 0;
    return true;
  };

  const handleNext = () => {
    if (!canProgress()) return;
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };


  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Wizard Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="text-primary w-8 h-8" />
            <h1 className="text-3xl font-bold text-white">Domain Setup Wizard</h1>
          </div>
          <p className="text-slate-400">Complete domain configuration with automated DNS and mail server provisioning</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-slate-800 -z-10">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: '0%' }}
                animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            {steps.map((step, idx) => {
              const isComplete = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              
              return (
                <div key={step.id} className="flex flex-col items-center relative">
                  <motion.div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all
                      ${isComplete ? 'bg-primary border-primary text-white' : ''}
                      ${isCurrent ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' : ''}
                      ${!isComplete && !isCurrent ? 'bg-slate-800 border-slate-700 text-slate-500' : ''}
                    `}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    {isComplete ? <Check size={18} /> : idx + 1}
                  </motion.div>
                  <div className="mt-2 text-center hidden md:block">
                    <div className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                      {step.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-panel p-8 rounded-xl border border-border mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-2">{steps[currentStepIndex].title}</h2>
          <p className="text-slate-400 mb-6">{steps[currentStepIndex].subtitle}</p>

          {/* Step 1: Domain */}
          {currentStep === 'domain' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Domain Name</label>
                <input 
                  value={domain} 
                  onChange={(e) => setDomain(e.target.value)}
                  onBlur={validateDomain}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="example.com"
                  autoFocus
                />
                {errors.domain && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle size={16} /> {errors.domain}
                  </motion.p>
                )}
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Shield size={16} className="text-primary" />
                  What we'll configure:
                </h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2"><span className="text-neon-green">✓</span> SPF (Sender Policy Framework) records</li>
                  <li className="flex items-start gap-2"><span className="text-neon-green">✓</span> DKIM (Domain Keys Identified Mail) with dual selectors</li>
                  <li className="flex items-start gap-2"><span className="text-neon-green">✓</span> DMARC (Domain Message Authentication) policy</li>
                  <li className="flex items-start gap-2"><span className="text-neon-green">✓</span> KumoMTA mail server provisioning</li>
                  <li className="flex items-start gap-2"><span className="text-neon-green">✓</span> SMTP credentials generation</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Cloudflare */}
          {currentStep === 'cloudflare' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Cloudflare API Token</label>
                <input 
                  type="password"
                  value={cfToken} 
                  onChange={(e) => setCfToken(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Enter your Cloudflare API token..."
                />
                {errors.cfToken && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle size={16} /> {errors.cfToken}
                  </motion.p>
                )}
                <p className="text-xs text-slate-500 mt-2">Need DNS edit permissions. <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Create token</a></p>
              </div>

              <button
                onClick={testCloudflareConnection}
                disabled={!cfToken || loading}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <><Loader className="animate-spin" size={18} /> Testing Connection...</>
                ) : cfConnected ? (
                  <><Check className="text-neon-green" size={18} /> Connected to Zone: {cfZoneId.slice(0, 8)}...</>
                ) : (
                  <><Cloud size={18} /> Test Connection</>
                )}
              </button>

              {cfConnected && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-neon-green font-bold mb-2">
                    <CheckCircle size={18} />
                    Connection Successful
                  </div>
                  <p className="text-sm text-slate-300">Domain found in Cloudflare. DNS records will be automatically created.</p>
                </motion.div>
              )}

              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Cloud size={16} className="text-primary" />
                  Requirements:
                </h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2"><span className="text-amber-400">→</span> Domain must already be added to your Cloudflare account</li>
                  <li className="flex items-start gap-2"><span className="text-amber-400">→</span> API token needs Zone:DNS:Edit permissions</li>
                  <li className="flex items-start gap-2"><span className="text-amber-400">→</span> We'll auto-detect your zone and create all records</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: DKIM */}
          {currentStep === 'dkim' && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-300">We'll generate two DKIM selectors for key rotation and redundancy. Click generate for each selector.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-300">DKIM Selector 1 ({selector1})</label>
                    <button
                      onClick={() => handleGenerateDkim('s1')}
                      disabled={loading}
                      className="px-4 py-2 bg-primary hover:bg-primary-glow disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-2 transition-all text-sm"
                    >
                      {loading ? <Loader className="animate-spin" size={14} /> : <KeyRound size={14} />}
                      Generate
                    </button>
                  </div>
                  <textarea 
                    value={dkim1} 
                    readOnly
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs h-24 resize-none"
                    placeholder="Public key will appear here..."
                  />
                  {dkim1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mt-2">
                      <button onClick={() => navigator.clipboard.writeText(dkim1)} className="text-xs text-primary hover:underline">Copy Public</button>
                      {generatedKeys.s1 && (
                        <button onClick={() => navigator.clipboard.writeText(generatedKeys.s1!.priv)} className="text-xs text-primary hover:underline">Copy Private</button>
                      )}
                    </motion.div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-300">DKIM Selector 2 ({selector2})</label>
                    <button
                      onClick={() => handleGenerateDkim('s2')}
                      disabled={loading}
                      className="px-4 py-2 bg-primary hover:bg-primary-glow disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-2 transition-all text-sm"
                    >
                      {loading ? <Loader className="animate-spin" size={14} /> : <KeyRound size={14} />}
                      Generate
                    </button>
                  </div>
                  <textarea 
                    value={dkim2} 
                    readOnly
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs h-24 resize-none"
                    placeholder="Public key will appear here..."
                  />
                  {dkim2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mt-2">
                      <button onClick={() => navigator.clipboard.writeText(dkim2)} className="text-xs text-primary hover:underline">Copy Public</button>
                      {generatedKeys.s2 && (
                        <button onClick={() => navigator.clipboard.writeText(generatedKeys.s2!.priv)} className="text-xs text-primary hover:underline">Copy Private</button>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Deploy */}
          {currentStep === 'deploy' && (
            <div className="space-y-4">
              {deployStatus.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Ready to Deploy</h3>
                  <p className="text-slate-400 mb-6">We'll provision your mail infrastructure and configure DNS automatically.</p>
                  <button
                    onClick={deployInfrastructure}
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] text-white font-bold rounded-lg flex items-center gap-2 mx-auto transition-all"
                  >
                    {loading ? <Loader className="animate-spin" size={20} /> : <Shield size={20} />}
                    Start Deployment
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {deployStatus.map((status, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 py-2 px-4 bg-slate-900 rounded-lg border border-slate-800"
                    >
                      <span className="text-sm font-mono">{status}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {smtpCredentials && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-6 mt-4">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="text-neon-green" size={18} />
                    SMTP Credentials Created
                  </h4>
                  <div className="space-y-2 font-mono text-sm">
                    <div><span className="text-slate-400">Username:</span> <span className="text-white">{smtpCredentials.username}</span></div>
                    <div><span className="text-slate-400">Password:</span> <span className="text-white">{smtpCredentials.password}</span></div>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(JSON.stringify(smtpCredentials, null, 2))} className="mt-3 text-xs text-primary hover:underline">Copy Credentials</button>
                </motion.div>
              )}
            </div>
          )}

          {/* Step 5: Verify */}
          {currentStep === 'verify' && (
            <div className="space-y-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-300">DNS propagation can take 5-30 minutes. We'll check if your records are publicly visible.</p>
              </div>

              <button
                onClick={runVerification}
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-glow disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <Loader className="animate-spin" size={18} /> : <Shield size={18} />}
                {Object.keys(verifyResults).length === 0 ? 'Run Verification' : 'Re-check DNS'}
              </button>

              {Object.keys(verifyResults).length > 0 && (
                <div className="space-y-3 mt-6">
                  {Object.entries(verifyResults).map(([name, result]) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border ${result.ok ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm text-white">{name}</span>
                        {result.ok ? (
                          <CheckCircle className="text-neon-green" size={18} />
                        ) : (
                          <AlertCircle className="text-red-400" size={18} />
                        )}
                      </div>
                      {result.values.length > 0 && (
                        <div className="text-xs text-slate-400 font-mono break-all">{result.values[0]}</div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 6: Complete */}
          {currentStep === 'complete' && (
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
              >
                <CheckCircle className="w-24 h-24 text-neon-green mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-3">Setup Complete! 🎉</h3>
              <p className="text-slate-400 mb-8">Your domain {domain} is now configured and ready for cold email campaigns.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <div className="text-primary font-bold mb-1">DNS Records</div>
                  <div className="text-2xl font-bold text-white">✓ Active</div>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <div className="text-primary font-bold mb-1">Mail Server</div>
                  <div className="text-2xl font-bold text-white">✓ Provisioned</div>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <div className="text-primary font-bold mb-1">DKIM Keys</div>
                  <div className="text-2xl font-bold text-white">✓ Generated</div>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <div className="text-primary font-bold mb-1">SMTP Access</div>
                  <div className="text-2xl font-bold text-white">✓ Ready</div>
                </div>
              </div>

              <button
                onClick={() => window.location.href = '/dashboard'}
                className="mt-8 px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] text-white font-bold rounded-lg flex items-center gap-2 mx-auto transition-all"
              >
                Go to Dashboard <ArrowRight size={18} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        {currentStep !== 'complete' && (
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center gap-2 transition-all"
            >
              <ArrowLeft size={18} /> Back
            </button>

            <div className="text-sm text-slate-500">
              Step {currentStepIndex + 1} of {steps.length}
            </div>

            <button
              onClick={handleNext}
              disabled={!canProgress() || loading}
              className="px-6 py-3 bg-primary hover:bg-primary-glow disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center gap-2 transition-all"
            >
              {currentStepIndex === steps.length - 2 ? 'Finish' : 'Next'} <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DomainSetup;
