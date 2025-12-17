// Use trialApi.ts for all API calls
// This file is deprecated and kept for backward compatibility only
export type TrialPlan = 'starter' | 'professional' | 'enterprise';

export interface StartTrialPayload {
  email: string;
  plan: TrialPlan;
  billingCycle: 'monthly' | 'yearly';
  acceptTos: boolean;
}

export const apiClient = {};
export default apiClient;

  /**
   * Get stored authentication token
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get stored refresh token
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Store tokens in localStorage
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Clear stored tokens
   */
  public clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }

  /**
   * Build request headers with authentication
   */
  private getHeaders(contentType: string = 'application/json'): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': contentType,
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.access_token, data.refresh_token || refreshToken);
        return true;
      }

      // Token refresh failed, clear tokens and require re-login
      this.clearTokens();
      window.location.href = '/auth/login';
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout || this.timeout;
    const maxRetries = options.retry !== undefined ? options.retry : this.maxRetries;

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        headers: options.headers || this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle token expiration
      if (response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed && retryCount < 1) {
          // Retry request with new token
          return this.makeRequest<T>(endpoint, options, retryCount + 1);
        }
        return {
          error: 'Authentication failed',
          status: 401,
        };
      }

      // Handle rate limiting
      if (response.status === 429) {
        if (retryCount < maxRetries) {
          const delay = this.retryDelay * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest<T>(endpoint, options, retryCount + 1);
        }
        return {
          error: 'Rate limit exceeded',
          status: 429,
        };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.detail || data.message || 'Request failed',
          status: response.status,
        };
      }

      return {
        data: data.data || data,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        if (retryCount < maxRetries) {
          const delay = this.retryDelay * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest<T>(endpoint, options, retryCount + 1);
        }
      }

      console.error('Request error:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
      };
    }
  }

  // ==================== AUTHENTICATION ====================

  async register(email: string, password: string, companyName: string) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, company_name: companyName }),
    });
  }

  async login(email: string, password: string) {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data && typeof response.data === 'object' && 'access_token' in response.data) {
      const tokens = response.data as { access_token: string; refresh_token: string };
      this.setTokens(tokens.access_token, tokens.refresh_token);
    }

    return response;
  }

  async logout() {
    await this.makeRequest('/auth/logout', { method: 'POST' });
    this.clearTokens();
  }

  async getCurrentUser() {
    return this.makeRequest('/auth/me');
  }

  async verifyEmail(token: string) {
    return this.makeRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async forgotPassword(email: string) {
    return this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.makeRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // ==================== BILLING ====================

  async setupTrial(planId: string) {
    return this.makeRequest('/billing/setup-trial', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
  }

  async getTrial() {
    return this.makeRequest('/billing/trial');
  }

  async extendTrial(days: number) {
    return this.makeRequest('/billing/trial/extend', {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  }

  async getSubscription() {
    return this.makeRequest('/billing/subscription');
  }

  async createSubscription(planId: string, billingCycle: 'monthly' | 'yearly') {
    return this.makeRequest('/billing/subscription', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, billing_cycle: billingCycle }),
    });
  }

  async upgradeSubscription(planId: string) {
    return this.makeRequest('/billing/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
  }

  async downgradeSubscription(planId: string) {
    return this.makeRequest('/billing/subscription/downgrade', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
  }

  async changeBillingCycle(billingCycle: 'monthly' | 'yearly') {
    return this.makeRequest('/billing/subscription/change-billing-cycle', {
      method: 'POST',
      body: JSON.stringify({ billing_cycle: billingCycle }),
    });
  }

  async cancelSubscription(immediate: boolean = false) {
    return this.makeRequest('/billing/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ immediate }),
    });
  }

  async reactivateSubscription() {
    return this.makeRequest('/billing/subscription/reactivate', {
      method: 'POST',
    });
  }

  async addPaymentMethod(paymentMethodId: string, setAsDefault: boolean = true) {
    return this.makeRequest('/billing/payment-methods', {
      method: 'POST',
      body: JSON.stringify({ payment_method_id: paymentMethodId, set_as_default: setAsDefault }),
    });
  }

  async getPaymentMethods() {
    return this.makeRequest('/billing/payment-methods');
  }

  async updatePaymentMethod(paymentMethodId: string, data: Record<string, any>) {
    return this.makeRequest(`/billing/payment-methods/${paymentMethodId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePaymentMethod(paymentMethodId: string) {
    return this.makeRequest(`/billing/payment-methods/${paymentMethodId}`, {
      method: 'DELETE',
    });
  }

  async getInvoices(skip: number = 0, limit: number = 10) {
    return this.makeRequest(`/billing/invoices?skip=${skip}&limit=${limit}`);
  }

  async getInvoice(invoiceId: string) {
    return this.makeRequest(`/billing/invoices/${invoiceId}`);
  }

  async downloadInvoicePdf(invoiceId: string) {
    return fetch(`${this.baseUrl}/billing/invoices/${invoiceId}/pdf`, {
      headers: this.getHeaders(),
    });
  }

  async retryInvoicePayment(invoiceId: string) {
    return this.makeRequest(`/billing/invoices/${invoiceId}/retry-payment`, {
      method: 'POST',
    });
  }

  async getTransactions(skip: number = 0, limit: number = 10) {
    return this.makeRequest(`/billing/transactions?skip=${skip}&limit=${limit}`);
  }

  async validatePromoCode(code: string) {
    return this.makeRequest('/billing/validate-promo-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async applyPromoCode(code: string) {
    return this.makeRequest('/billing/apply-promo-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async createRefund(transactionId: string, reason: string) {
    return this.makeRequest('/billing/refunds', {
      method: 'POST',
      body: JSON.stringify({ transaction_id: transactionId, reason }),
    });
  }

  // ==================== DOMAINS ====================

  async searchDomains(query: string) {
    return this.makeRequest(`/domains/search?query=${encodeURIComponent(query)}`);
  }

  async purchaseDomain(domainName: string) {
    return this.makeRequest('/domains/purchase', {
      method: 'POST',
      body: JSON.stringify({ domain_name: domainName }),
    });
  }

  async getDomains(skip: number = 0, limit: number = 100) {
    return this.makeRequest(`/domains?skip=${skip}&limit=${limit}`);
  }

  async getDomain(domainId: string) {
    return this.makeRequest(`/domains/${domainId}`);
  }

  async updateDomain(domainId: string, data: Record<string, any>) {
    return this.makeRequest(`/domains/${domainId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDomain(domainId: string) {
    return this.makeRequest(`/domains/${domainId}`, {
      method: 'DELETE',
    });
  }

  async getDnsRecords(domainId: string) {
    return this.makeRequest(`/domains/${domainId}/dns-records`);
  }

  async verifyDns(domainId: string) {
    return this.makeRequest(`/domains/${domainId}/verify-dns`, {
      method: 'POST',
    });
  }

  async suspendDomain(domainId: string, reason: string) {
    return this.makeRequest(`/domains/${domainId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ==================== INFRASTRUCTURE ====================

  async provisionInboxes(
    domainId: string,
    count: number,
    namingConvention: string
  ) {
    return this.makeRequest('/infrastructure/provision', {
      method: 'POST',
      body: JSON.stringify({
        domain_id: domainId,
        inbox_count: count,
        naming_convention: namingConvention,
      }),
    });
  }

  async getInboxesCsv(domainId: string) {
    return fetch(`${this.baseUrl}/infrastructure/inboxes/export-csv?domain_id=${domainId}`, {
      headers: this.getHeaders(),
    });
  }

  async getInboxes(domainId?: string, skip: number = 0, limit: number = 100) {
    const query = new URLSearchParams();
    if (domainId) query.append('domain_id', domainId);
    query.append('skip', skip.toString());
    query.append('limit', limit.toString());
    return this.makeRequest(`/infrastructure/inboxes?${query.toString()}`);
  }

  async getInbox(inboxId: string) {
    return this.makeRequest(`/infrastructure/inboxes/${inboxId}`);
  }

  async getInboxCredentials(inboxId: string) {
    return this.makeRequest(`/infrastructure/inboxes/${inboxId}/credentials`);
  }

  async updateInbox(inboxId: string, data: Record<string, any>) {
    return this.makeRequest(`/infrastructure/inboxes/${inboxId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async suspendInbox(inboxId: string, reason: string) {
    return this.makeRequest(`/infrastructure/inboxes/${inboxId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async deleteInbox(inboxId: string) {
    return this.makeRequest(`/infrastructure/inboxes/${inboxId}`, {
      method: 'DELETE',
    });
  }

  // ==================== ANALYTICS ====================

  async getUsageStats() {
    return this.makeRequest('/analytics/usage');
  }

  async getUsageByDomain(domainId: string) {
    return this.makeRequest(`/analytics/usage/domains/${domainId}`);
  }

  async getUsageByInbox(inboxId: string) {
    return this.makeRequest(`/analytics/usage/inboxes/${inboxId}`);
  }

  async getBillingAnalytics() {
    return this.makeRequest('/analytics/billing-summary');
  }

  async getDeliverabilityMetrics() {
    return this.makeRequest('/analytics/deliverability');
  }

  async getDeliverabilityByDomain(domainId: string) {
    return this.makeRequest(`/analytics/deliverability/domains/${domainId}`);
  }

  async getHealthScores() {
    return this.makeRequest('/analytics/deliverability/health-scores');
  }

  // ==================== ADMIN ====================

  async getAllUsers(skip: number = 0, limit: number = 100) {
    return this.makeRequest(`/admin/users?skip=${skip}&limit=${limit}`);
  }

  async suspendUser(userId: string, reason: string) {
    return this.makeRequest(`/admin/users/${userId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unsuspendUser(userId: string) {
    return this.makeRequest(`/admin/users/${userId}/unsuspend`, {
      method: 'POST',
    });
  }

  async extendUserTrial(userId: string, days: number) {
    return this.makeRequest(`/admin/users/${userId}/extend-trial`, {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  }

  async refundUserInvoice(invoiceId: string, amount: number, reason: string) {
    return this.makeRequest(`/admin/invoices/${invoiceId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }

  // ==================== UTILITIES ====================

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };
