import { User, ActivityLog, CreditTransaction, SystemMetrics, Organization, ApiKey, AuditLog } from '../types';

// Generate mock organizations
export const generateMockOrganizations = (count: number = 10): Organization[] => {
  const names = ['Growth Labs', 'Outbound Pro', 'LeadForge', 'ScaleOps', 'SignalPath', 'Pipeline Co', 'InboxWorks', 'Agency Hive', 'LaunchStack', 'VectorMail'];
  const tiers: Organization['planTier'][] = ['free', 'starter', 'growth', 'agency', 'enterprise'];
  return Array.from({ length: count }, (_, i) => ({
    id: `org_${i + 1}`,
    name: names[i % names.length],
    planTier: tiers[Math.floor(Math.random() * tiers.length)],
    apiLimitDaily: Math.floor(5000 + Math.random() * 50000),
    riskScore: Math.round(50 + Math.random() * 50),
  }));
};

// Generate mock users
export const generateMockUsers = (orgs: Organization[], count: number = 100): User[] => {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Emma', 'William', 'Olivia', 'Richard', 'Sophia', 'Joseph'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore'];
  const companies = ['TechCorp', 'MarketingPro', 'SalesForce Elite', 'Growth Agency', 'Startup Inc', 'Digital Solutions', 'Lead Gen Masters', 'Outreach Experts'];
  const statuses: User['status'][] = ['active', 'suspended', 'shadow_banned', 'pending', 'trial'];
  const roles: User['role'][] = ['owner', 'admin', 'viewer', 'user', 'agency'];
  const plans: User['subscriptionPlan'][] = ['free', 'starter', 'growth', 'agency', 'enterprise'];
  const subStatuses: User['subscriptionStatus'][] = ['active', 'cancelled', 'past_due', 'trialing'];

  return Array.from({ length: count }, (_, i) => {
    const org = orgs[i % orgs.length];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const createdDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    
    return {
      id: `user_${i + 1}`,
      orgId: org.id,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      firstName,
      lastName,
      company: Math.random() > 0.3 ? companies[Math.floor(Math.random() * companies.length)] : undefined,
      status,
      role,
      mfaEnabled: Math.random() > 0.4,
      credits: Math.floor(Math.random() * 5000),
      subscriptionPlan: plan,
      subscriptionStatus: subStatuses[Math.floor(Math.random() * subStatuses.length)],
      inboxCount: Math.floor(Math.random() * 100) + 1,
      emailsSentToday: Math.floor(Math.random() * 500),
      emailsSentMonth: Math.floor(Math.random() * 15000),
      createdAt: createdDate.toISOString(),
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      billingCycle: Math.random() > 0.5 ? 'monthly' : 'yearly',
      nextBillingDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      totalSpent: Math.floor(Math.random() * 10000),
      avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
    };
  });
};

// Generate mock activity logs
export const generateMockActivityLogs = (users: User[], count: number = 500): ActivityLog[] => {
  const actions = [
    { action: 'user.login', description: 'User logged in', severity: 'info' as const },
    { action: 'user.logout', description: 'User logged out', severity: 'info' as const },
    { action: 'inbox.created', description: 'Created new inbox', severity: 'success' as const },
    { action: 'inbox.deleted', description: 'Deleted inbox', severity: 'warning' as const },
    { action: 'email.sent', description: 'Sent email campaign', severity: 'success' as const },
    { action: 'domain.added', description: 'Added new domain', severity: 'success' as const },
    { action: 'domain.verified', description: 'Verified domain DNS', severity: 'success' as const },
    { action: 'subscription.upgraded', description: 'Upgraded subscription plan', severity: 'success' as const },
    { action: 'subscription.cancelled', description: 'Cancelled subscription', severity: 'warning' as const },
    { action: 'credits.purchased', description: 'Purchased credits', severity: 'success' as const },
    { action: 'api.error', description: 'API request failed', severity: 'error' as const },
    { action: 'payment.failed', description: 'Payment processing failed', severity: 'error' as const },
  ];

  return Array.from({ length: count }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const actionData = actions[Math.floor(Math.random() * actions.length)];
    
    return {
      id: `log_${i + 1}`,
      userId: user.id,
      userEmail: user.email,
      action: actionData.action,
      description: actionData.description,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      metadata: { userAgent: 'Mozilla/5.0', platform: 'web' },
      severity: actionData.severity,
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Generate mock credit transactions
export const generateMockCreditTransactions = (users: User[], count: number = 300): CreditTransaction[] => {
  const types: CreditTransaction['type'][] = ['purchase', 'usage', 'admin_adjustment'];
  const reasonCodes = {
    purchase: ['CREDIT_PACKAGE', 'ANNUAL_PLAN', 'UPGRADE_TOPUP'],
    usage: ['EMAIL_SEND', 'INBOX_PROVISION', 'API_USAGE'],
    admin_adjustment: ['SERVICE_OUTAGE_REFUND', 'SALES_BONUS', 'CHARGEBACK', 'MANUAL_CORRECTION'],
  } as const;

  return Array.from({ length: count }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const base = Math.floor(Math.random() * 900) + 100;
    const amount = type === 'usage' ? -Math.max(10, Math.floor(Math.random() * 80)) : base;
    return {
      id: `txn_${i + 1}`,
      orgId: user.orgId,
      userId: user.id,
      userEmail: user.email,
      amount,
      type,
      description: type === 'usage' ? 'Usage debited from sending activity' : 'Credit change',
      reasonCode: reasonCodes[type][Math.floor(Math.random() * reasonCodes[type].length)],
      timestamp: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Generate mock API keys
export const generateMockApiKeys = (users: User[], count: number = 40): ApiKey[] => {
  const scopes: ApiKey['scopes'] = ['send_email', 'manage_domains', 'manage_users', 'read_only'];
  return Array.from({ length: count }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const name = i % 2 === 0 ? 'Prod Server' : 'Integration Key';
    return {
      id: `key_${i + 1}`,
      orgId: user.orgId,
      userId: user.id,
      name,
      keyMasked: `sk_live_****${Math.random().toString(36).slice(-6)}`,
      scopes: scopes.slice(0, 1 + Math.floor(Math.random() * scopes.length)),
      lastUsed: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      revoked: Math.random() > 0.9,
    };
  });
};

// Generate mock audit logs
export const generateMockAuditLogs = (users: User[], count: number = 200): AuditLog[] => {
  const actions = ['REVOKED_API_KEY', 'FREEZE_ACCOUNT', 'SHADOW_BAN', 'LOGIN_AS_USER', 'ADJUST_CREDITS', 'CREATE_DOMAIN', 'VERIFY_DNS'];
  return Array.from({ length: count }, (_, i) => {
    const actor = users[Math.floor(Math.random() * users.length)];
    const target = users[Math.floor(Math.random() * users.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    return {
      id: `audit_${i + 1}`,
      actorId: actor.id,
      action,
      targetId: target.id,
      metadata: { orgId: target.orgId },
      ipAddress: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Generate system metrics
export const generateSystemMetrics = (users: User[]): SystemMetrics => {
  const activeUsers = users.filter(u => u.status === 'active').length;
  const totalInboxes = users.reduce((sum, u) => sum + u.inboxCount, 0);
  const emailsSent24h = users.reduce((sum, u) => sum + u.emailsSentToday, 0);
  const emailsSentMonth = users.reduce((sum, u) => sum + u.emailsSentMonth, 0);

  return {
    totalUsers: users.length,
    activeUsers,
    totalInboxes,
    emailsSent24h,
    emailsSentMonth,
    revenue24h: Math.floor(Math.random() * 5000) + 1000,
    revenueMonth: Math.floor(Math.random() * 150000) + 50000,
    avgHealthScore: 96.5 + Math.random() * 2,
    systemUptime: 99.9 + Math.random() * 0.09,
  };
};

// Initialize mock data
let mockOrganizations = generateMockOrganizations(10);
let mockUsers = generateMockUsers(mockOrganizations, 120);
let mockActivityLogs = generateMockActivityLogs(mockUsers, 500);
let mockCreditTransactions = generateMockCreditTransactions(mockUsers, 300);
let mockApiKeys = generateMockApiKeys(mockUsers, 40);
let mockAuditLogs = generateMockAuditLogs(mockUsers, 200);

export const getMockData = () => ({
  organizations: mockOrganizations,
  users: mockUsers,
  activityLogs: mockActivityLogs,
  creditTransactions: mockCreditTransactions,
  apiKeys: mockApiKeys,
  auditLogs: mockAuditLogs,
  systemMetrics: generateSystemMetrics(mockUsers),
});

export const updateMockUser = (userId: string, updates: Partial<User>) => {
  const index = mockUsers.findIndex(u => u.id === userId);
  if (index !== -1) {
    mockUsers[index] = { ...mockUsers[index], ...updates };
  }
};

export const deleteMockUser = (userId: string) => {
  mockUsers = mockUsers.filter(u => u.id !== userId);
};

export const addMockUser = (user: User) => {
  mockUsers.push(user);
};

export const addMockOrganization = (org: Organization) => {
  mockOrganizations.push(org);
};

export const updateMockOrganization = (orgId: string, updates: Partial<Organization>) => {
  const index = mockOrganizations.findIndex(o => o.id === orgId);
  if (index !== -1) {
    mockOrganizations[index] = { ...mockOrganizations[index], ...updates };
  }
};

export const addMockApiKey = (key: ApiKey) => {
  mockApiKeys.push(key);
};

export const revokeMockApiKey = (id: string) => {
  mockApiKeys = mockApiKeys.map(k => (k.id === id ? { ...k, revoked: true } : k));
};

export const addActivityLog = (log: Omit<ActivityLog, 'id'>) => {
  const newLog = { ...log, id: `log_${Date.now()}` };
  mockActivityLogs.unshift(newLog);
};

export const addCreditTransaction = (transaction: Omit<CreditTransaction, 'id'>) => {
  const newTransaction = { ...transaction, id: `txn_${Date.now()}` };
  mockCreditTransactions.unshift(newTransaction);
};

export const addAuditLogEntry = (log: Omit<AuditLog, 'id'>) => {
  const newLog = { ...log, id: `audit_${Date.now()}` };
  mockAuditLogs.unshift(newLog);
};
