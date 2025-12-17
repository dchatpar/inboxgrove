// Stripe client-side helper to call backend payment endpoints.
// Expects your backend to expose REST endpoints that return client secrets / checkout URLs.
// No Stripe secret key is exposed here; this only calls your server.

export interface CheckoutSessionRequest {
  domain?: string;
  years?: number;
  priceId?: string; // optional if you map products server-side
  quantity?: number;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionRequest {
  priceId: string;
  trialDays?: number;
  customerEmail?: string;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.inboxgrove.com';

async function postJson<T>(path: string, body: unknown): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, error: (json as any)?.error || res.statusText };
    return { ok: true, status: res.status, data: json as T };
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message || 'Network error' };
  }
}

export const stripeService = {
  async createCheckoutSession(req: CheckoutSessionRequest) {
    return postJson<{ url: string; id: string }>('/payments/stripe/checkout', req);
  },

  async createSubscription(req: SubscriptionRequest) {
    return postJson<{ url: string; id: string }>('/payments/stripe/subscription', req);
  },

  async createSetupIntent(metadata?: Record<string, string>) {
    return postJson<{ client_secret: string }>('/payments/stripe/setup-intent', { metadata });
  },
};

export default stripeService;
