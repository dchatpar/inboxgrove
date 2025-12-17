// Lightweight Cloudflare API wrapper for DNS automation
// Uses Cloudflare v4 API: https://api.cloudflare.com/client/v4/

export interface CloudflareCredentials {
  apiToken: string; // Scoped token with DNS edit permissions
  accountId?: string; // Optional; not required for zone-level operations
}

export interface CloudflareZone {
  id: string;
  name: string;
}

export interface DnsRecordInput {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS';
  name: string; // host (e.g., @, www, selector._domainkey)
  content: string; // value
  ttl?: number; // seconds; 1 = auto
  priority?: number; // for MX
}

const CF_API = 'https://api.cloudflare.com/client/v4';

async function cfFetch<T>(path: string, token: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data?: T; error?: string }>{
  try {
    const res = await fetch(`${CF_API}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });
    const json = await res.json();
    if (json.success) {
      return { ok: true, status: res.status, data: json.result };
    }
    return { ok: false, status: res.status, error: json?.errors?.[0]?.message || 'Cloudflare API error' };
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message || 'Network error' };
  }
}

export const cloudflareService = {
  async findZoneByName(domain: string, creds: CloudflareCredentials) {
    return cfFetch<CloudflareZone[]>(`/zones?name=${encodeURIComponent(domain)}`, creds.apiToken);
  },

  async createDnsRecords(zoneId: string, records: DnsRecordInput[], creds: CloudflareCredentials) {
    const results: Array<{ input: DnsRecordInput; ok: boolean; status: number; id?: string; error?: string }> = [];
    for (const r of records) {
      const resp = await cfFetch<{ id: string }>(`/zones/${zoneId}/dns_records`, creds.apiToken, {
        method: 'POST',
        body: JSON.stringify({
          type: r.type,
          name: r.name,
          content: r.content,
          ttl: r.ttl ?? 1,
          priority: r.priority,
        }),
      });
      results.push({ input: r, ok: resp.ok, status: resp.status, id: (resp.data as any)?.id, error: resp.error });
    }
    return results;
  },

  // Generate a BIND-style zone file snippet compatible with Cloudflare import
  // Cloudflare supports importing standard BIND zone files.
  generateBindZone(domain: string, records: DnsRecordInput[]) {
    const origin = domain.endsWith('.') ? domain : `${domain}.`;
    const lines: string[] = [];
    lines.push(`$ORIGIN ${origin}`);
    lines.push(`$TTL 3600`);
    for (const r of records) {
      const host = r.name === '@' ? origin : (r.name.endsWith('.') ? r.name : `${r.name}.`);
      if (r.type === 'MX') {
        lines.push(`${host} IN MX ${r.priority ?? 10} ${r.content.endsWith('.') ? r.content : r.content + '.'}`);
      } else if (r.type === 'TXT') {
        const txt = r.content.replace(/"/g, '\"');
        lines.push(`${host} IN TXT "${txt}"`);
      } else if (r.type === 'CNAME') {
        lines.push(`${host} IN CNAME ${r.content.endsWith('.') ? r.content : r.content + '.'}`);
      } else {
        lines.push(`${host} IN ${r.type} ${r.content}`);
      }
    }
    return lines.join('\n');
  },
};

export default cloudflareService;
