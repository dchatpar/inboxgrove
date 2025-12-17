import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Globe, KeyRound, FileDown, Cloud, Shield } from 'lucide-react';
import cloudflareService, { CloudflareCredentials } from '../services/cloudflareService';
import { DkimPair, generateDnsRecords, toCloudflareRecords, humanInstructions, toCsv } from '../services/dnsRecordGenerator';
import { queryTxt } from '../services/dnsVerifyService';
import { Copy } from 'lucide-react';
import { generateDkimKeyPair, extractPublicKeyBase64 } from '../services/dkimService';
import { getGuide } from '../services/providerGuides';
import kumoMtaService, { KumoCredentials } from '../services/kumoMtaService';

const DomainSetup: React.FC = () => {
  const [domain, setDomain] = useState('example.com');
  const [selector1, setSelector1] = useState('s1');
  const [selector2, setSelector2] = useState('s2');
  const [dkim1, setDkim1] = useState('');
  const [dkim2, setDkim2] = useState('');
  const [cfToken, setCfToken] = useState('');
  const [cfZoneId, setCfZoneId] = useState('');
  const [busy, setBusy] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [providerGuide, setProviderGuide] = useState('Cloudflare');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedKeys, setGeneratedKeys] = useState<{ s1?: { pub: string; priv: string }; s2?: { pub: string; priv: string } }>({});
  const [kumoBaseUrl, setKumoBaseUrl] = useState('http://46.21.157.216:8001');
  const [kumoApiKey, setKumoApiKey] = useState('14456a6f18f952990da9e2a3e5d401d8cd321a0f4c8457843eaf6d91dca15f4a');
  const [kumoMsg, setKumoMsg] = useState('');
  const [kumoWorking, setKumoWorking] = useState(false);
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

  const dkimPairs: DkimPair[] = useMemo(() => ([
    { selector: selector1 || 's1', publicKey: dkim1 },
    { selector: selector2 || 's2', publicKey: dkim2 },
  ]), [selector1, selector2, dkim1, dkim2]);

  const generated = useMemo(() => generateDnsRecords(domain, dkimPairs, {
    spfIncludes: ['_spf.inboxgrove.net'],
    dmarcPolicy: 'none',
  }), [domain, dkimPairs]);

  const cfRecords = useMemo(() => toCloudflareRecords(generated), [generated]);

  const bindZone = useMemo(() => cloudflareService.generateBindZone(domain, cfRecords as any), [domain, cfRecords]);

  const downloadCsv = () => {
    const csv = toCsv(generated);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${domain.replace(/\./g,'_')}_dns.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const [verifying, setVerifying] = useState(false);
  const [verifyResults, setVerifyResults] = useState<Record<string, { ok: boolean; values: string[] }>>({});
  const runVerification = async () => {
    setVerifying(true);
    const names = [
      `${domain}`,
      `_dmarc.${domain}`,
      `${selector1 || 's1'}._domainkey.${domain}`,
      `${selector2 || 's2'}._domainkey.${domain}`,
    ];
    const results: Record<string, { ok: boolean; values: string[] }> = {};
    for (const n of names) {
      const r = await queryTxt(n);
      results[n] = { ok: r.found, values: r.values };
    }
    setVerifyResults(results);
    setVerifying(false);
  };

  const autoCreateInCloudflare = async () => {
    const newErrors: Record<string, string> = {};
    if (!domain || !/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(domain)) newErrors.domain = 'Enter a valid domain (e.g., example.com)';
    if (!cfToken) newErrors.cfToken = 'Cloudflare API token is required for automation';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;
    setBusy(true); setResultMsg('');
    const creds: CloudflareCredentials = { apiToken: cfToken };
    let zoneId = cfZoneId;
    if (!zoneId) {
      const z = await cloudflareService.findZoneByName(domain, creds);
      if (z.ok && z.data && z.data[0]) zoneId = z.data[0].id;
      else {
        setBusy(false);
        setResultMsg(z.error || 'Zone not found. Ensure domain is added to Cloudflare.');
        return;
      }
    }
    const res = await cloudflareService.createDnsRecords(zoneId, cfRecords as any, creds);
    const failures = res.filter(r => !r.ok);
    setBusy(false);
    if (failures.length === 0) setResultMsg('All DNS records created successfully in Cloudflare.');
    else setResultMsg(`Some records failed: ${failures.map(f => `${f.input.type} ${f.input.name} (${f.error || f.status})`).join(', ')}`);
  };

  const downloadBindZone = () => {
    const blob = new Blob([bindZone], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${domain.replace(/\./g,'_')}_zone.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const manualText = useMemo(() => humanInstructions(generated, providerGuide as any), [generated, providerGuide]);

  const handleGenerateDkim = async (selector: 's1' | 's2') => {
    const pair = await generateDkimKeyPair();
    const base64Pub = extractPublicKeyBase64(pair.publicKeyPem);
    if (selector === 's1') {
      setDkim1(base64Pub);
      setGeneratedKeys(k => {
        const next = { ...k, s1: { pub: pair.publicKeyPem, priv: pair.privateKeyPem } };
        try { localStorage.setItem('inboxgrove_dkim_bundle', JSON.stringify(next)); } catch {}
        return next;
      });
    } else {
      setDkim2(base64Pub);
      setGeneratedKeys(k => {
        const next = { ...k, s2: { pub: pair.publicKeyPem, priv: pair.privateKeyPem } };
        try { localStorage.setItem('inboxgrove_dkim_bundle', JSON.stringify(next)); } catch {}
        return next;
      });
    }
  };

  const exportDkimJson = () => {
    const blob = new Blob([JSON.stringify(generatedKeys, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${domain.replace(/\./g,'_')}_dkim_bundle.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const importDkimJson = async (file: File) => {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      setGeneratedKeys(parsed);
      if (parsed?.s1?.pub) setDkim1(extractPublicKeyBase64(parsed.s1.pub));
      if (parsed?.s2?.pub) setDkim2(extractPublicKeyBase64(parsed.s2.pub));
      localStorage.setItem('inboxgrove_dkim_bundle', JSON.stringify(parsed));
    } catch {}
  };

  return (
    <section id="domain-setup" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <Globe className="text-primary" /> Domain Setup & DNS Automation
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Config */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-xl border border-border">
            <h3 className="text-lg font-bold text-white mb-4">1) Domain & DKIM</h3>
            <label className="block text-sm text-slate-400">Domain</label>
            <input value={domain} onChange={(e)=>setDomain(e.target.value)} className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-white" placeholder="example.com" />
            {errors.domain && <p className="text-red-400 text-xs mt-1">{errors.domain}</p>}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-sm text-slate-400">Selector 1</label>
                <input value={selector1} onChange={(e)=>setSelector1(e.target.value)} className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-400">Selector 2</label>
                <input value={selector2} onChange={(e)=>setSelector2(e.target.value)} className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-white" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-slate-400">DKIM Public Key (s1)</label>
              <textarea value={dkim1} onChange={(e)=>setDkim1(e.target.value)} className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-white h-20" placeholder="Paste RSA public key (optional)" />
              <div className="mt-2 flex gap-2">
                <button onClick={()=>handleGenerateDkim('s1')} className="px-3 py-2 bg-slate-800 border border-border rounded-lg text-white text-xs font-bold">Generate Key</button>
                {generatedKeys.s1 && (
                  <button onClick={()=>navigator.clipboard.writeText(generatedKeys.s1!.priv)} className="px-3 py-2 bg-slate-800 border border-border rounded-lg text-white text-xs font-bold">Copy Private Key</button>
                )}
                <button onClick={exportDkimJson} className="px-3 py-2 bg-slate-800 border border-border rounded-lg text-white text-xs font-bold">Export DKIM</button>
                <label className="px-3 py-2 bg-slate-800 border border-border rounded-lg text-white text-xs font-bold cursor-pointer">
                  Import DKIM
                  <input type="file" accept="application/json" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if (f) importDkimJson(f);}} />
                </label>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm text-slate-400">DKIM Public Key (s2)</label>
              <textarea value={dkim2} onChange={(e)=>setDkim2(e.target.value)} className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-white h-20" placeholder="Paste RSA public key (optional)" />
              <div className="mt-2 flex gap-2">
                <button onClick={()=>handleGenerateDkim('s2')} className="px-3 py-2 bg-slate-800 border border-border rounded-lg text-white text-xs font-bold">Generate Key</button>
                {generatedKeys.s2 && (
                  <button onClick={()=>navigator.clipboard.writeText(generatedKeys.s2!.priv)} className="px-3 py-2 bg-slate-800 border border-border rounded-lg text-white text-xs font-bold">Copy Private Key</button>
                )}
                <button onClick={exportDkimJson} className="px-3 py-2 bg-slate-800 border border-border rounded-lg text-white text-xs font-bold">Export DKIM</button>
                <label className="px-3 py-2 bg-slate-800 border border-border rounded-lg text-white text-xs font-bold cursor-pointer">
                  Import DKIM
                  <input type="file" accept="application/json" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if (f) importDkimJson(f);}} />
                </label>
              </div>
            </div>
            <p className="mt-4 text-slate-500 text-sm">We generate SPF, DKIM, and DMARC automatically.
            </p>
          </motion.div>

          {/* Automation via Cloudflare */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-xl border border-border">
            <h3 className="text-lg font-bold text-white mb-4">2) Auto-Create in Cloudflare</h3>
            <div className="flex items-center gap-2 text-slate-400 mb-2"><Cloud className="text-primary" /> Provide token with DNS edit permissions</div>
            <label className="block text-sm text-slate-400">API Token</label>
            <input value={cfToken} onChange={(e)=>setCfToken(e.target.value)} className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-white" placeholder="cf_token_..." />
            {errors.cfToken && <p className="text-red-400 text-xs mt-1">{errors.cfToken}</p>}
            <label className="block text-sm text-slate-400 mt-3">Zone ID (optional)</label>
            <input value={cfZoneId} onChange={(e)=>setCfZoneId(e.target.value)} className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-white" placeholder="auto-detect by domain if empty" />
            <button disabled={!cfToken || busy} onClick={autoCreateInCloudflare} className="mt-4 w-full py-3 bg-primary hover:bg-primary-glow text-white font-bold rounded-lg flex items-center justify-center gap-2">
              <Shield size={18}/> {busy ? 'Working...' : 'Create DNS Records'}
            </button>
            {resultMsg && <p className="mt-3 text-sm text-slate-300">{resultMsg}</p>}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-white mb-2">Import options</h4>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={downloadBindZone} className="px-4 py-2 bg-slate-800 border border-border rounded-lg text-white font-bold flex items-center gap-2">
                  <FileDown size={16}/> BIND Zone (Cloudflare)
                </button>
                <button onClick={downloadCsv} className="px-4 py-2 bg-slate-800 border border-border rounded-lg text-white font-bold flex items-center gap-2">
                  <FileDown size={16}/> DNS CSV
                </button>
              </div>
            </div>
          </motion.div>
          {/* KumoMTA Integration */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-xl border border-border">
            <h3 className="text-lg font-bold text-white mb-4">2.5) KumoMTA Integration</h3>
            <p className="text-slate-400 text-sm mb-3">Complete workflow: domain + DKIM + DNS + user creation</p>
            <label className="block text-sm text-slate-400">KumoMTA Base URL</label>
            <input value={kumoBaseUrl} onChange={(e)=>setKumoBaseUrl(e.target.value)} className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-white" placeholder="http://46.21.157.216:8001" />
            <label className="block text-sm text-slate-400 mt-3">KumoMTA API Key</label>
            <input value={kumoApiKey} onChange={(e)=>setKumoApiKey(e.target.value)} className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-white" placeholder="API Key" />
            <button 
              disabled={kumoWorking || !domain}
              onClick={async ()=>{
                setKumoMsg(''); setKumoWorking(true);
                const creds: KumoCredentials = { baseUrl: kumoBaseUrl, apiKey: kumoApiKey };
                
                try {
                  // 1. Add domain
                  const d = await kumoMtaService.createDomain({ domain, selector: selector1 || 'default' }, creds);
                  if (!d.ok) {
                    setKumoMsg(`❌ Domain create failed: ${d.error}`);
                    setKumoWorking(false);
                    return;
                  }
                  setKumoMsg('✅ Domain added');
                  
                  // 2. Generate DKIM
                  const dkim = await kumoMtaService.generateDkim({ domain, selector: selector1 || 'default', key_size: 2048 }, creds);
                  if (!dkim.ok) {
                    setKumoMsg(`❌ DKIM generation failed: ${dkim.error}`);
                    setKumoWorking(false);
                    return;
                  }
                  setKumoMsg('✅ DKIM generated');
                  
                  // Update DKIM field with generated key
                  if (dkim.data?.public_key) {
                    setDkim1(dkim.data.public_key);
                  }
                  
                  // 3. Get DNS records
                  const dns = await kumoMtaService.getDnsRecords(domain, mailIps, creds);
                  if (!dns.ok || !dns.data) {
                    setKumoMsg(`❌ DNS fetch failed: ${dns.error}`);
                    setKumoWorking(false);
                    return;
                  }
                  setKumoMsg('✅ DNS records fetched');
                  
                  // 4. Create user
                  const username = `user_${domain.replace(/\./g, '_')}`;
                  const password = `Pwd${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10).toUpperCase()}!`;
                  const user = await kumoMtaService.createUser({ username, password, email: `admin@${domain}` }, creds);
                  if (!user.ok) {
                    setKumoMsg(`❌ User creation failed: ${user.error}`);
                    setKumoWorking(false);
                    return;
                  }
                  setKumoMsg(`✅ User created: ${username} / ${password}`);
                  
                  // 5. Reload KumoMTA
                  const reload = await kumoMtaService.reloadConfig(creds);
                  if (!reload.ok) {
                    setKumoMsg(`⚠️ Reload failed: ${reload.error}. Changes may require manual reload.`);
                  } else {
                    setKumoMsg(`✅ Complete! User: ${username} | Pass: ${password}`);
                  }
                  
                  // 6. Apply to Cloudflare if token provided
                  if (cfToken && dns.data) {
                    const cf = { apiToken: cfToken } as CloudflareCredentials;
                    let zoneId = cfZoneId;
                    if (!zoneId) {
                      const z = await cloudflareService.findZoneByName(domain, cf);
                      if (z.ok && z.data && z.data[0]) zoneId = z.data[0].id;
                    }
                    if (zoneId) {
                      // Convert KumoMTA records to Cloudflare format
                      const cfRecords = dns.data.records.map(r => ({
                        type: r.record_type,
                        name: r.name,
                        content: r.value,
                        ttl: r.ttl || 1,
                        priority: r.priority,
                      }));
                      await cloudflareService.createDnsRecords(zoneId, cfRecords as any, cf);
                      setKumoMsg(prev => prev + ' | DNS applied to Cloudflare ✅');
                    }
                  }
                  
                } catch (e: any) {
                  setKumoMsg(`❌ Error: ${e?.message || 'Unknown error'}`);
                }
                setKumoWorking(false);
              }} 
              className="mt-4 w-full py-3 bg-neon-green hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold rounded-lg flex items-center justify-center gap-2"
            >
              <Shield size={18}/> {kumoWorking ? 'Processing...' : 'Complete Setup (KumoMTA → Cloudflare)'}
            </button>
            {kumoMsg && <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-border text-sm text-slate-300 whitespace-pre-wrap">{kumoMsg}</div>}
          </motion.div>

          {/* Manual Instructions */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-xl border border-border">
            <h3 className="text-lg font-bold text-white mb-4">3) Manual DNS Instructions</h3>
            <label className="block text-sm text-slate-400">DNS Provider</label>
            <select value={providerGuide} onChange={(e)=>setProviderGuide(e.target.value)} className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-white">
              <option>Cloudflare</option>
              <option>GoDaddy</option>
              <option>Namecheap</option>
              <option>AWS Route 53</option>
              <option>Google Domains</option>
            </select>
            <div className="mt-4 bg-background rounded-lg border border-border p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap">
              {manualText}
            </div>
            <div className="mt-3 bg-slate-900 rounded-lg border border-border p-3 text-xs">
              <div className="font-bold text-white mb-2">Provider Guide</div>
              {(() => {
                const g = getGuide(providerGuide as any);
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-slate-400 font-bold mb-1">Steps</div>
                      <ul className="list-disc list-inside space-y-1">
                        {g.steps.map((s, i) => (<li key={i}>{s}</li>))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-slate-400 font-bold mb-1">Tips</div>
                      <ul className="list-disc list-inside space-y-1">
                        {g.tips.map((t, i) => (<li key={i}>{t}</li>))}
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={runVerification} className="px-4 py-2 bg-slate-800 border border-border rounded-lg text-white font-bold">
                {verifying ? 'Verifying...' : 'Verify DNS Records'}
              </button>
              <button onClick={()=>{navigator.clipboard.writeText(manualText)}} className="px-4 py-2 bg-slate-800 border border-border rounded-lg text-white font-bold flex items-center gap-2">
                <Copy size={16}/> Copy Instructions
              </button>
            </div>
            {Object.keys(verifyResults).length > 0 && (
              <div className="mt-3 bg-slate-900 rounded-lg border border-border p-3 text-xs">
                <div className="font-bold text-white mb-2">Verification Results</div>
                {(() => {
                  const expectedMap: Record<string, string> = {
                    [domain]: generated.spf.value,
                    [`_dmarc.${domain}`]: generated.dmarc.value,
                    [`${(selector1 || 's1')}._domainkey.${domain}`]: (generated.dkim.find(d => d.selector === (selector1 || 's1'))?.value) || '',
                    [`${(selector2 || 's2')}._domainkey.${domain}`]: (generated.dkim.find(d => d.selector === (selector2 || 's2'))?.value) || '',
                  };
                  return Object.entries(verifyResults).map(([host, r]: [string, { ok: boolean; values: string[] }]) => {
                    const expected = expectedMap[host] || '';
                    const matches = r.values.some(v => v.trim().replace(/\s+/g,' ') === expected.trim().replace(/\s+/g,' '));
                    return (
                      <div key={host} className="py-3 border-b border-border/40 last:border-0">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">{host}</span>
                          <span className={(r.ok && matches) ? 'text-neon-green' : r.ok ? 'text-amber-400' : 'text-red-400'}>
                            {(r.ok && matches) ? 'MATCH' : r.ok ? 'MISMATCH' : 'NOT FOUND'}
                          </span>
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-slate-400 font-bold">Expected</div>
                            <div className="text-slate-500 break-words">{expected || '—'}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 font-bold">Actual</div>
                            <div className="text-slate-500 break-words">{r.values.length ? r.values.join(' | ') : '—'}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button onClick={()=>navigator.clipboard.writeText(expected)} className="px-3 py-1 bg-slate-800 border border-border rounded-lg text-white">Copy Expected</button>
                          {r.values.length > 0 && (
                            <button onClick={()=>navigator.clipboard.writeText(r.values.join(' '))} className="px-3 py-1 bg-slate-800 border border-border rounded-lg text-white">Copy Actual</button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
            <div className="mt-4 text-slate-500 text-xs flex items-center gap-2"><KeyRound size={14}/> Replace DKIM keys with your actual public keys for production.</div>
            <div className="mt-3 text-neon-green text-xs flex items-center gap-2"><CheckCircle size={14}/> After adding records, verify in your provider and start warmup.</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DomainSetup;
