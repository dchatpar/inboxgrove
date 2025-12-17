/**
 * Enhanced Integration Service for all 7 third-party platforms
 * Handles API connections, testing, and data fetching
 */

export interface IntegrationConfig {
  id: string;
  service: 'instantly' | 'smartlead' | 'apollo' | 'stripe' | 'cloudflare' | 'namecheap' | 'slack';
  status: 'connected' | 'error' | 'pending' | 'testing';
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  accountId?: string;
  testStatus?: boolean;
  lastTestedAt?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface IntegrationResponse {
  ok?: boolean;
  success?: boolean;
  status?: number;
  message: string;
  integration?: IntegrationConfig;
  data?: Record<string, any>;
  error?: string;
}

// API Endpoints
export const API_ENDPOINTS = {
  instantly: 'https://api.instantly.ai/api/v1',
  smartlead: 'https://api.smartlead.ai/v1',
  apollo: 'https://api.apollo.io/api/v1',
  stripe: 'https://api.stripe.com/v1',
  cloudflare: 'https://api.cloudflare.com/client/v4',
  namecheap: 'https://api.namecheap.com/api',
  slack: 'https://slack.com/api'
};

// Instantly API Configuration
export const INSTANTLY_API_BASE = 'https://api.instantly.ai/api/v1';

export class EnhancedIntegrationService {
  /**
   * Get all stored integrations
   */
  static getIntegrations(): IntegrationConfig[] {
    try {
      const stored = localStorage.getItem('inboxgrove_integrations');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load integrations:', error);
      return [];
    }
  }

  /**
   * Save or update integration
   */
  static saveIntegration(config: Partial<IntegrationConfig>): IntegrationResponse {
    try {
      const integrations = this.getIntegrations();
      const id = `${config.service}_${Date.now()}`;
      const newConfig: IntegrationConfig = {
        ...config,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as IntegrationConfig;

      const existing = integrations.findIndex(i => i.service === config.service);
      if (existing >= 0) {
        integrations[existing] = { ...integrations[existing], ...newConfig, updatedAt: new Date().toISOString() };
      } else {
        integrations.push(newConfig);
      }

      localStorage.setItem('inboxgrove_integrations', JSON.stringify(integrations));
      return {
        ok: true,
        success: true,
        status: 200,
        message: 'Integration saved successfully',
        integration: newConfig,
      };
    } catch (error: any) {
      return {
        ok: false,
        success: false,
        status: 500,
        message: 'Failed to save integration',
        error: error.message,
      };
    }
  }

  /**
   * Remove integration
   */
  static removeIntegration(id: string): IntegrationResponse {
    try {
      const integrations = this.getIntegrations();
      const filtered = integrations.filter(i => i.id !== id);
      localStorage.setItem('inboxgrove_integrations', JSON.stringify(filtered));
      return {
        ok: true,
        success: true,
        status: 200,
        message: 'Integration removed successfully',
      };
    } catch (error: any) {
      return {
        ok: false,
        success: false,
        status: 500,
        message: 'Failed to remove integration',
        error: error.message,
      };
    }
  }

  /**
   * Get specific integration
   */
  static getIntegration(service: string): IntegrationConfig | null {
    const integrations = this.getIntegrations();
    return integrations.find(i => i.service === service) || null;
  }

  // ===== INSTANTLY.AI METHODS =====
  static async testInstantlyConnection(apiKey: string): Promise<IntegrationResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.instantly}/account`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          ok: false,
          success: false,
          status: response.status,
          message: 'Failed to connect to Instantly',
          error: 'Invalid API key or connection failed'
        };
      }

      const data = await response.json();
      return {
        ok: true,
        success: true,
        status: 200,
        message: 'Connected to Instantly successfully',
        data
      };
    } catch (error: any) {
      return {
        ok: false,
        success: false,
        status: 0,
        message: 'Connection error',
        error: error.message
      };
    }
  }

  static async getInstantlyAccount(apiKey: string): Promise<IntegrationResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.instantly}/account`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      return { ok: response.ok, success: response.ok, status: response.status, data, message: 'OK' };
    } catch (error: any) {
      return { ok: false, success: false, status: 0, message: 'Error', error: error.message };
    }
  }

  static async getInstantlyCampaigns(apiKey: string): Promise<IntegrationResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.instantly}/campaigns?limit=50`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      return { ok: response.ok, success: response.ok, status: response.status, data, message: 'OK' };
    } catch (error: any) {
      return { ok: false, success: false, status: 0, message: 'Error', error: error.message };
    }
  }

  static async sendInstantlyTestEmail(apiKey: string, to: string, subject: string, body: string): Promise<IntegrationResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.instantly}/email/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to, subject, body })
      });
      const data = await response.json();
      return { ok: response.ok, success: response.ok, status: response.status, data, message: 'Email sent' };
    } catch (error: any) {
      return { ok: false, success: false, status: 0, message: 'Error', error: error.message };
    }
  }

  // ===== SMARTLEAD METHODS =====
  static async testSmartleadConnection(apiKey: string, accountId: string): Promise<IntegrationResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.smartlead}/accounts/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        ok: response.ok,
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Connected to Smartlead' : 'Connection failed',
        data: await response.json()
      };
    } catch (error: any) {
      return { ok: false, success: false, status: 0, message: 'Connection error', error: error.message };
    }
  }

  static async getSmartleadCampaigns(apiKey: string, accountId: string): Promise<IntegrationResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.smartlead}/campaigns?account_id=${accountId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return { ok: response.ok, success: response.ok, status: response.status, data: await response.json(), message: 'OK' };
    } catch (error: any) {
      return { ok: false, success: false, status: 0, message: 'Error', error: error.message };
    }
  }

  // ===== APOLLO METHODS =====
  static async testApolloConnection(apiKey: string): Promise<IntegrationResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.apollo}/accounts/me`, {
        headers: { 'X-Api-Key': apiKey }
      });
      return {
        ok: response.ok,
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Connected to Apollo' : 'Connection failed',
        data: await response.json()
      };
    } catch (error: any) {
      return { ok: false, success: false, status: 0, message: 'Connection error', error: error.message };
    }
  }

  // ===== STRIPE METHODS =====
  static async testStripeConnection(apiKey: string): Promise<IntegrationResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.stripe}/account`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return {
        ok: response.ok,
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Connected to Stripe' : 'Connection failed',
        data: await response.json()
      };
    } catch (error: any) {
      return { ok: false, success: false, status: 0, message: 'Connection error', error: error.message };
    }
  }

  // ===== CLOUDFLARE METHODS =====
  static async testCloudflareConnection(zoneId: string, token: string): Promise<IntegrationResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.cloudflare}/zones/${zoneId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        ok: response.ok,
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Connected to Cloudflare' : 'Connection failed',
        data: await response.json()
      };
    } catch (error: any) {
      return { ok: false, success: false, status: 0, message: 'Connection error', error: error.message };
    }
  }

  static async createCloudflareRecord(zoneId: string, token: string, recordData: any): Promise<IntegrationResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.cloudflare}/zones/${zoneId}/dns_records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recordData)
      });
      return { ok: response.ok, success: response.ok, status: response.status, data: await response.json(), message: 'Record created' };
    } catch (error: any) {
      return { ok: false, success: false, status: 0, message: 'Error', error: error.message };
    }
  }

  // ===== NAMECHEAP METHODS =====
  static async testNamecheapConnection(apiKey: string, username: string): Promise<IntegrationResponse> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.namecheap}/users/getBalances.json?ApiUser=${username}&ApiKey=${apiKey}&UserName=${username}&ClientIp=0.0.0.0`
      );
      return {
        ok: response.ok,
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Connected to Namecheap' : 'Connection failed',
        data: await response.json()
      };
    } catch (error: any) {
      return { ok: false, success: false, status: 0, message: 'Connection error', error: error.message };
    }
  }

  // ===== SLACK METHODS =====
  static async testSlackConnection(botToken: string): Promise<IntegrationResponse> {
    try {
      const response = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${botToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const data = await response.json();
      return {
        ok: data.ok,
        success: data.ok,
        status: response.status,
        message: data.ok ? 'Connected to Slack' : data.error,
        data
      };
    } catch (error: any) {
      return { ok: false, success: false, status: 0, message: 'Connection error', error: error.message };
    }
  }

  static async sendSlackMessage(webhookUrl: string, message: string, channel?: string): Promise<IntegrationResponse> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          ...(channel && { channel })
        })
      });
      return { ok: response.ok, success: response.ok, status: response.status, message: 'Message sent', data: await response.text() };
    } catch (error: any) {
      return { ok: false, success: false, status: 0, message: 'Error', error: error.message };
    }
  }

  /**
   * Generic test method for any service
   */
  static async testConnection(service: string, credentials: Record<string, string>): Promise<IntegrationResponse> {
    switch (service) {
      case 'instantly':
        return this.testInstantlyConnection(credentials.apiKey);
      case 'smartlead':
        return this.testSmartleadConnection(credentials.apiKey, credentials.accountId);
      case 'apollo':
        return this.testApolloConnection(credentials.apiKey);
      case 'stripe':
        return this.testStripeConnection(credentials.apiKey);
      case 'cloudflare':
        return this.testCloudflareConnection(credentials.zoneId, credentials.token);
      case 'namecheap':
        return this.testNamecheapConnection(credentials.apiKey, credentials.username);
      case 'slack':
        return this.testSlackConnection(credentials.botToken);
      default:
        return { ok: false, success: false, status: 400, message: 'Unknown service', error: 'Service not supported' };
    }
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string): boolean {
    return apiKey && apiKey.trim().length > 0;
  }
}

// Export for backward compatibility
export const integrationService = EnhancedIntegrationService;
export default EnhancedIntegrationService;
