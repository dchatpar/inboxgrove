// DNS verification using DNS over HTTPS (Cloudflare)
// https://cloudflare-dns.com/dns-query

export interface DnsVerificationResult {
  name: string;
  type: 'TXT' | 'MX' | 'CNAME' | 'A' | 'AAAA' | 'NS';
  found: boolean;
  values: string[];
}

const CF_DOH = 'https://cloudflare-dns.com/dns-query';

export async function queryTxt(name: string): Promise<DnsVerificationResult> {
  // Use JSON DNS format
  const url = `${CF_DOH}?name=${encodeURIComponent(name)}&type=TXT`;
  const res = await fetch(url, { headers: { 'accept': 'application/dns-json' } });
  if (!res.ok) return { name, type: 'TXT', found: false, values: [] };
  const json = await res.json();
  const answers = (json.Answer || []) as Array<{ data: string }>;
  const cleaned = answers.map(a => a.data?.replace(/^"|"$/g, '')).filter(Boolean);
  return { name, type: 'TXT', found: cleaned.length > 0, values: cleaned };
}
