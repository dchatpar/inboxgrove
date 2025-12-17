import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ViewState = 'dashboard' | 'provisioning' | 'inboxes' | 'connector' | 'settings' | 'pricing';

export interface Inbox {
  id: string;
  email: string;
  domain: string;
  status: 'active' | 'warming' | 'blacklisted' | 'repairing';
  healthScore: number;
  dailySent: number;
  dailyLimit: number;
  region: 'US-EAST' | 'EU-WEST' | 'APAC';
  provider: 'InboxGrove' | 'External';
}

// User Management Types
export interface User {
  id: string;
  orgId: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  status: 'active' | 'suspended' | 'shadow_banned' | 'pending' | 'trial';
  role: 'owner' | 'admin' | 'viewer' | 'user' | 'agency';
  mfaEnabled: boolean;
  credits: number;
  subscriptionPlan: 'free' | 'starter' | 'growth' | 'agency' | 'enterprise';
  subscriptionStatus: 'active' | 'cancelled' | 'past_due' | 'trialing';
  inboxCount: number;
  emailsSentToday: number;
  emailsSentMonth: number;
  createdAt: string;
  lastActive: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate?: string;
  totalSpent: number;
  avatar?: string;
}

export interface Organization {
  id: string;
  name: string;
  planTier: 'free' | 'starter' | 'growth' | 'agency' | 'enterprise';
  apiLimitDaily: number;
  riskScore?: number;
}

export interface ApiKey {
  id: string;
  orgId: string;
  userId: string;
  name: string;
  keyMasked: string;
  scopes: Array<'send_email' | 'manage_domains' | 'manage_users' | 'read_only'>;
  lastUsed?: string;
  createdAt: string;
  revoked?: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface CreditTransaction {
  id: string;
  orgId: string;
  userId: string;
  userEmail: string;
  amount: number; // positive for add, negative for deduct
  type: 'purchase' | 'usage' | 'admin_adjustment';
  description: string;
  reasonCode?: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string; // e.g., REVOKED_API_KEY
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalInboxes: number;
  emailsSent24h: number;
  emailsSentMonth: number;
  revenue24h: number;
  revenueMonth: number;
  avgHealthScore: number;
  systemUptime: number;
}

export interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'amber' | 'red';
}

export interface SetupStep {
  id: number;
  label: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
}

export interface DomainSuggestion {
  domain: string;
  price: number;
  available: boolean;
  score: number; // "Cold Friendly" score
}

export interface DnsRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS';
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
}

export interface ManagedDomain {
  id: string;
  name: string;
  provider?: 'Cloudflare' | 'GoDaddy' | 'Namecheap' | 'AWS Route 53' | 'Google Domains' | 'Other';
  records?: DnsRecord[];
  verified?: boolean;
}

export interface PricingTier {
  id: string;
  name: string;
  monthlyPrice: number | string;
  yearlyPrice: number | string;
  description: string;
  features: string[];
  benefits: string[];
  ctaText: string;
  highlight?: boolean;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export interface FeatureBlockProps {
  title: string;
  description: string | React.ReactNode;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
}

export interface AppContextState {
  currentUser: User | null;
  currentOrg: Organization | null;
  users: User[];
  organizations: Organization[];
  apiKeys: ApiKey[];
  creditLedger: CreditTransaction[];
  auditLogs: AuditLog[];
  systemMetrics: SystemMetrics | null;
  impersonationMode: boolean;
  setCurrentUser: (user: User | null) => void;
  setCurrentOrg: (org: Organization | null) => void;
  setUsers: (users: User[]) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setApiKeys: (keys: ApiKey[]) => void;
  addApiKey: (key: ApiKey) => void;
  revokeApiKey: (id: string) => void;
  addCreditTransaction: (txn: CreditTransaction) => void;
  addAuditLog: (log: AuditLog) => void;
  setSystemMetrics: (metrics: SystemMetrics | null) => void;
  setImpersonationMode: (flag: boolean) => void;
}