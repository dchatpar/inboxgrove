// KumoMTA API wrapper - Full integration with live endpoints
// Base URL: http://46.21.157.216:8001
// API Version: 1.0.0

export interface KumoCredentials {
  baseUrl: string;
  apiKey: string;
}

export interface KumoDomainRequest {
  domain: string;
  selector?: string;
}

export interface KumoUserRequest {
  username: string;
  password: string;
  email: string;
}

export interface KumoDkimRequest {
  domain: string;
  selector: string;
  key_size?: number;
}

export interface KumoDnsRecord {
  record_type: 'TXT' | 'MX' | 'CNAME' | 'A' | 'AAAA' | 'NS';
  name: string;
  value: string;
  ttl: number;
  priority: number | null;
}

export interface KumoDnsResponse {
  domain: string;
  records: KumoDnsRecord[];
}

export interface KumoDkimResponse {
  domain: string;
  selector: string;
  public_key: string;
  dns_record: string;
  algorithm: string;
  key_file: string;
}

async function apiFetch<T>(url: string, creds: KumoCredentials, init?: RequestInit) {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': creds.apiKey,
        ...(init?.headers || {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, status: res.status, data: json as T };
    return { ok: false, status: res.status, error: (json as any)?.detail || (json as any)?.error || res.statusText };
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message || 'Network error' };
  }
}

export const kumoMtaService = {
  // Add domain with optional selector
  async createDomain(req: KumoDomainRequest, creds: KumoCredentials) {
    const url = `${creds.baseUrl}/api/v1/domains/`;
    return apiFetch<{ domain: string; selector: string; dkim_configured: boolean }>(url, creds, {
      method: 'POST',
      body: JSON.stringify({ domain: req.domain, selector: req.selector || 'default' })
    });
  },

  // Generate DKIM keys for domain
  async generateDkim(req: KumoDkimRequest, creds: KumoCredentials) {
    const url = `${creds.baseUrl}/api/v1/dkim/generate`;
    return apiFetch<KumoDkimResponse>(url, creds, {
      method: 'POST',
      body: JSON.stringify({ domain: req.domain, selector: req.selector, key_size: req.key_size || 2048 })
    });
  },

  // Get DNS records for domain with mail server IPs
  async getDnsRecords(domain: string, mailIps: string[], creds: KumoCredentials) {
    const url = `${creds.baseUrl}/api/v1/dns/${encodeURIComponent(domain)}/records?mail_ips=${mailIps.join(',')}`;
    return apiFetch<KumoDnsResponse>(url, creds);
  },

  // Create SMTP user
  async createUser(req: KumoUserRequest, creds: KumoCredentials) {
    const url = `${creds.baseUrl}/api/v1/users/`;
    return apiFetch<{ username: string; email: string; created_at: string | null }>(url, creds, {
      method: 'POST',
      body: JSON.stringify(req)
    });
  },

  // Reload KumoMTA configuration
  async reloadConfig(creds: KumoCredentials) {
    const url = `${creds.baseUrl}/api/v1/system/reload`;
    return apiFetch<{ success: boolean; message: string }>(url, creds, { method: 'POST' });
  },

  // Check system health
  async checkHealth(baseUrl: string) {
    try {
      const res = await fetch(`${baseUrl}/api/v1/system/health`);
      return { ok: res.ok, status: res.status };
    } catch {
      return { ok: false, status: 0 };
    }
  },

  // List all domains
  async listDomains(creds: KumoCredentials) {
    const url = `${creds.baseUrl}/api/v1/domains/`;
    return apiFetch<Array<{ domain: string; selector: string }>>(url, creds);
  },

  // List all users
  async listUsers(creds: KumoCredentials) {
    const url = `${creds.baseUrl}/api/v1/users/`;
    return apiFetch<Array<{ username: string; email: string }>>(url, creds);
  },
};

export default kumoMtaService;
