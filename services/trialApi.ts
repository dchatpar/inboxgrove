export type TrialPlan = 'starter' | 'professional' | 'enterprise';

export interface StartTrialPayload {
  email: string;
  plan: TrialPlan;
  billingCycle: 'monthly' | 'yearly';
  acceptTos: boolean;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ProvisionInboxesPayload {
  domain_id: string;
  inbox_count: number;
  naming_convention: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
}

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}${path}`.replace(/\/$/, ''), {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(init?.headers || {}),
      },
      ...init,
    });
    const status = res.status;
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await res.json() : await res.text();
    if (!res.ok) {
      const message = isJson ? (body?.message || body?.error || body?.detail || 'Request failed') : String(body || 'Request failed');
      return { ok: false, error: message, status };
    }
    return { ok: true, data: body as T, status };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error', status: 0 };
  }
}

export const trialApi = {
  // Auth endpoints
  startTrial: (payload: StartTrialPayload) =>
    request<{ trialId: string; expiresAt: string; tenant_id: string }>(`/api/v1/auth/trial/start`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  sendOtp: (email: string) =>
    request<{ message: string }>(`/api/v1/auth/trial/send-otp`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (payload: VerifyOtpPayload) =>
    request<{ access_token: string; refresh_token: string; trialId: string; expiresAt: string }>(`/api/v1/auth/trial/verify-otp`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTrialStatus: () =>
    request<{ active: boolean; daysLeft: number; plan: TrialPlan; expiresAt: string }>(`/api/v1/trial/status`, {
      method: 'GET',
    }),

  // Domain endpoints
  listDomains: () =>
    request<{ domains: Array<{ id: string; name: string; status: string }> }>(`/api/v1/domains`, {
      method: 'GET',
    }),

  registerDomain: (domain: string) =>
    request<{ domain_id: string; domain: string; status: string }>(`/api/v1/domains/register`, {
      method: 'POST',
      body: JSON.stringify({ domain }),
    }),

  // Infrastructure/Provisioning endpoints
  provisionInboxes: (payload: ProvisionInboxesPayload) =>
    request<{ inboxes_created: number; domain: string; csv_data: string }>(`/api/v1/infrastructure/provision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  downloadInboxesCsv: () =>
    request<{ csv_data: string }>(`/api/v1/infrastructure/provision/csv`, {
      method: 'GET',
    }),

  listInboxes: () =>
    request<{ inboxes: Array<{ id: string; email: string; status: string; healthScore: number }> }>(`/api/v1/infrastructure/inboxes`, {
      method: 'GET',
    }),
};

export default trialApi;
