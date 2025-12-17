// Provider-specific DNS guides: concise steps and pitfalls

export type Provider = 'Cloudflare' | 'GoDaddy' | 'Namecheap' | 'AWS Route 53' | 'Google Domains';

interface Guide {
  steps: string[];
  tips: string[];
}

const guides: Record<Provider, Guide> = {
  Cloudflare: {
    steps: [
      'Open your zone in Cloudflare → DNS',
      'Add TXT @ with SPF value',
      'Add TXT _dmarc with DMARC value',
      'Add TXT s1._domainkey with DKIM (p=...)',
      'Add TXT s2._domainkey with DKIM (p=...)',
      'Wait for propagation and verify',
    ],
    tips: [
      'TTL “Auto” is fine; proxied toggle not applicable to TXT',
      'Ensure no existing conflicting SPF/DMARC TXT records',
      'Use BIND zone import for bulk adds',
    ],
  },
  GoDaddy: {
    steps: [
      'Open domain → DNS Management',
      'Add TXT @, then _dmarc, then DKIM selectors',
      'Save changes and wait for propagation',
    ],
    tips: [
      'GoDaddy may auto-append domain; set host to exact label',
      'Avoid duplicate SPF; keep a single TXT SPF record',
    ],
  },
  Namecheap: {
    steps: [
      'Domain → Advanced DNS',
      'Add TXT @, TXT _dmarc, TXT s1._domainkey, TXT s2._domainkey',
      'Save and recheck in 5–10 minutes',
    ],
    tips: [
      'Use “TXT Record” type; leave TTL default',
      'If using Namecheap email, ensure MX records are unaffected',
    ],
  },
  'AWS Route 53': {
    steps: [
      'Hosted zone → Create record',
      'Create TXT for @ and _dmarc',
      'Create TXT for DKIM selectors',
    ],
    tips: [
      'Surround TXT values in quotes in Route 53 UI',
      'Multi-value TXT creates multiple strings; prefer single combined string',
    ],
  },
  'Google Domains': {
    steps: [
      'Manage DNS → Custom records',
      'Add TXT @, TXT _dmarc, TXT s1._domainkey, TXT s2._domainkey',
    ],
    tips: [
      'Google UI may require full host names; verify label handling',
      'Propagation may take up to 1 hour',
    ],
  },
};

export function getGuide(provider: Provider): Guide {
  return guides[provider];
}
