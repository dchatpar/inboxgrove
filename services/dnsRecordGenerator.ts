// DNS record generator: SPF, DKIM, DMARC for cold email infra

export interface DkimPair {
  selector: string; // e.g., s1, s2
  publicKey: string; // base64 RSA (placeholder if not provided)
}

export interface GeneratedDns {
  domain: string;
  spf: { name: string; value: string };
  dmarc: { name: string; value: string };
  dkim: Array<{ name: string; value: string; selector: string }>;
}

function genSpf(include: string[] = []) {
  const mechanisms = [
    'v=spf1',
    ...include.map((inc) => `include:${inc}`),
    'mx',
    'a',
    '~all',
  ];
  return mechanisms.join(' ');
}

function genDmarc(policy: 'none' | 'quarantine' | 'reject' = 'none', rua?: string, ruf?: string) {
  const parts = ['v=DMARC1', `p=${policy}`, 'sp=none', 'adkim=s', 'aspf=s'];
  if (rua) parts.push(`rua=mailto:${rua}`);
  if (ruf) parts.push(`ruf=mailto:${ruf}`);
  return parts.join('; ');
}

export function generateDnsRecords(domain: string, dkimPairs: DkimPair[], options?: { spfIncludes?: string[]; dmarcPolicy?: 'none' | 'quarantine' | 'reject'; rua?: string; ruf?: string }): GeneratedDns {
  const spfValue = genSpf(options?.spfIncludes || ['_spf.inboxgrove.net']);
  const dmarcValue = genDmarc(options?.dmarcPolicy || 'none', options?.rua, options?.ruf);
  const dkim = dkimPairs.map(({ selector, publicKey }) => ({
    selector,
    name: `${selector}._domainkey`,
    value: `v=DKIM1; k=rsa; p=${publicKey || 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...'}`,
  }));

  return {
    domain,
    spf: { name: '@', value: spfValue },
    dmarc: { name: `_dmarc`, value: dmarcValue },
    dkim,
  };
}

export function toCloudflareRecords(gen: GeneratedDns) {
  // Convert to Cloudflare API record inputs
  const records = [] as Array<{ type: 'TXT' | 'MX' | 'CNAME' | 'A' | 'AAAA' | 'NS'; name: string; content: string; ttl?: number; priority?: number }>;
  records.push({ type: 'TXT', name: gen.spf.name, content: gen.spf.value, ttl: 1 });
  records.push({ type: 'TXT', name: gen.dmarc.name, content: gen.dmarc.value, ttl: 1 });
  for (const d of gen.dkim) {
    records.push({ type: 'TXT', name: d.name, content: d.value, ttl: 1 });
  }
  return records;
}

export function humanInstructions(gen: GeneratedDns, provider: 'Cloudflare' | 'GoDaddy' | 'Namecheap' | 'AWS Route 53' | 'Google Domains') {
  const lines: string[] = [];
  lines.push(`Provider: ${provider}`);
  lines.push('Add the following DNS records:');
  lines.push(`- TXT @ : ${gen.spf.value}`);
  lines.push(`- TXT _dmarc : ${gen.dmarc.value}`);
  for (const d of gen.dkim) {
    lines.push(`- TXT ${d.name} : ${d.value}`);
  }
  lines.push('Notes:');
  lines.push('- Propagation can take up to 24 hours.');
  lines.push('- DKIM selectors can be s1/s2; keep as provided.');
  lines.push('- For MX/SMTP, configure per your sending provider if needed.');
  return lines.join('\n');
}

export function toCsv(gen: GeneratedDns) {
  const rows: Array<{ host: string; type: string; value: string; ttl: string; priority?: string }> = [];
  rows.push({ host: '@', type: 'TXT', value: gen.spf.value, ttl: 'auto' });
  rows.push({ host: '_dmarc', type: 'TXT', value: gen.dmarc.value, ttl: 'auto' });
  for (const d of gen.dkim) rows.push({ host: d.name, type: 'TXT', value: d.value, ttl: 'auto' });
  const header = 'host,type,value,ttl,priority';
  const body = rows.map(r => [r.host, r.type, JSON.stringify(r.value), r.ttl, r.priority || ''].join(',')).join('\n');
  return header + '\n' + body;
}
