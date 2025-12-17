import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Rocket, UploadCloud } from 'lucide-react';
import { toCSV, downloadCSV } from '../services/csvExport';
import { integrationService } from '../services/integrationService';
import { useToast } from './ToastProvider';

interface MailboxGeneratorProps {
  domain: string;
}

const firstNames = ['alex','sam','jordan','taylor','morgan','casey','jamie','chris','pat'];

const MailboxGenerator: React.FC<MailboxGeneratorProps> = ({ domain }) => {
  const toast = useToast();
  const [count, setCount] = useState(10);
  const [prefix, setPrefix] = useState('');
  const [sendingLimit, setSendingLimit] = useState(40);
  const [rows, setRows] = useState<Array<Record<string, any>>>([]);

  const generate = () => {
    const out = Array.from({ length: count }).map((_, i) => {
      const name = firstNames[i % firstNames.length];
      const local = prefix ? `${prefix}${i+1}` : `${name}${i+1}`;
      const email = `${local}@${domain}`;
      // Dummy password; in real-world, use secure generator
      const password = Math.random().toString(36).slice(2, 10);
      return { email, password, domain, sendingLimit };
    });
    setRows(out);
    toast.success(`Generated ${out.length} inboxes`);
  };

  const exportCSV = () => {
    const csv = toCSV(rows);
    downloadCSV(`inboxes-${domain}.csv`, csv);
    toast.success('CSV exported');
  };

  const pushToInstantly = async () => {
    const instantly = integrationService.getIntegration('instantly');
    if (!instantly?.apiKey) {
      toast.error('Connect Instantly.ai first');
      return;
    }
    // Example: push each email to Instantly via a hypothetical endpoint
    // This is a placeholder; adapt to actual Instantly import API
    try {
      let success = 0;
      for (const row of rows) {
        const res = await fetch(`https://api.instantly.ai/api/v1/contacts/import`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${instantly.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: row.email })
        });
        if (res.ok) success++;
      }
      toast.success(`Pushed ${success}/${rows.length} to Instantly`);
    } catch (e: any) {
      toast.error('Failed pushing to Instantly');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Rocket className="text-primary" /> Mailbox Generator & Export
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-slate-400">Count</label>
          <input type="number" min={1} max={200} value={count} onChange={(e)=>setCount(parseInt(e.target.value))} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Prefix (optional)</label>
          <input value={prefix} onChange={(e)=>setPrefix(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Daily Sending Limit</label>
          <input type="number" min={1} max={500} value={sendingLimit} onChange={(e)=>setSendingLimit(parseInt(e.target.value))} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white" />
        </div>
        <div className="flex items-end">
          <button onClick={generate} className="w-full py-2 bg-primary text-white rounded-lg">Generate</button>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex gap-3">
            <button onClick={exportCSV} className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2">
              <FileDown size={16} /> Export CSV
            </button>
            <button onClick={pushToInstantly} className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2">
              <UploadCloud size={16} /> Push to Instantly
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            {rows.slice(0,9).map((r,i)=> (
              <div key={i} className="px-3 py-2 bg-slate-800 rounded">
                {r.email}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MailboxGenerator;