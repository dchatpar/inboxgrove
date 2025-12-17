/**
 * Third-Party API Integration Guide & Instructions
 * Comprehensive setup instructions for all supported services
 */

export interface APIGuide {
  serviceName: string;
  category: string;
  description: string;
  setupSteps: string[];
  documentationUrl: string;
  requiredFields: string[];
  optionalFields?: string[];
  rateLimits: string;
  supportEmail: string;
  estimatedSetupTime: string;
}

export const API_GUIDES: Record<string, APIGuide> = {
  instantly: {
    serviceName: 'Instantly.ai',
    category: 'Email Automation',
    description: 'Cold email automation platform for scale campaigns',
    setupSteps: [
      '1. Go to https://developer.instantly.ai',
      '2. Click "Sign In" or create a new account',
      '3. Navigate to Settings → API Keys',
      '4. Click "Generate New API Key"',
      '5. Name it something like "InboxGrove Integration"',
      '6. Copy the API Key (starts with "sk_live_" or "sk_test_")',
      '7. Paste the key into InboxGrove integration modal',
      '8. Click "Test Connection" to verify'
    ],
    documentationUrl: 'https://developer.instantly.ai/docs',
    requiredFields: ['API Key'],
    optionalFields: ['API Secret'],
    rateLimits: '100 requests/minute, 10,000 requests/day',
    supportEmail: 'support@instantly.ai',
    estimatedSetupTime: '5 minutes'
  },

  smartlead: {
    serviceName: 'Smartlead',
    category: 'Email Automation',
    description: 'AI-powered email outreach and lead generation',
    setupSteps: [
      '1. Go to https://app.smartlead.ai',
      '2. Log in to your account',
      '3. Click Settings in left sidebar',
      '4. Select "API" section',
      '5. Click "Generate API Key"',
      '6. Copy your API Key',
      '7. Also note your Account ID (shown in API settings)',
      '8. Paste both into InboxGrove',
      '9. Click "Test Connection"'
    ],
    documentationUrl: 'https://docs.smartlead.ai',
    requiredFields: ['API Key', 'Account ID'],
    optionalFields: [],
    rateLimits: '200 requests/minute',
    supportEmail: 'support@smartlead.io',
    estimatedSetupTime: '5 minutes'
  },

  apollo: {
    serviceName: 'Apollo',
    category: 'Sales Intelligence',
    description: 'B2B database, contact enrichment, and bulk email',
    setupSteps: [
      '1. Visit https://app.apollo.io',
      '2. Sign in with your account',
      '3. Go to Settings → Integrations',
      '4. Click "API Keys" tab',
      '5. Click "Generate API Key"',
      '6. You can name it "InboxGrove"',
      '7. Copy the generated API Key',
      '8. Paste into InboxGrove integration modal',
      '9. Test the connection'
    ],
    documentationUrl: 'https://apolloio.readme.io',
    requiredFields: ['API Key'],
    optionalFields: [],
    rateLimits: '50 requests/second',
    supportEmail: 'support@apollo.io',
    estimatedSetupTime: '5 minutes'
  },

  stripe: {
    serviceName: 'Stripe',
    category: 'Payment Processing',
    description: 'Payment processing and billing automation',
    setupSteps: [
      '1. Go to https://dashboard.stripe.com',
      '2. Sign in or create account',
      '3. Click "Developers" in top menu',
      '4. Select "API Keys"',
      '5. Copy your PUBLISHABLE KEY (pk_live_... or pk_test_...)',
      '6. Also copy SECRET KEY (sk_live_... or sk_test_...)',
      '7. Paste Publishable Key as "API Key"',
      '8. Paste Secret Key as "API Secret"',
      '9. Save and test connection'
    ],
    documentationUrl: 'https://stripe.com/docs/api',
    requiredFields: ['Publishable Key', 'Secret Key'],
    optionalFields: ['Webhook Signing Secret'],
    rateLimits: 'Unlimited API calls (rate limited after 100 req/sec)',
    supportEmail: 'support@stripe.com',
    estimatedSetupTime: '10 minutes'
  },

  cloudflare: {
    serviceName: 'Cloudflare',
    category: 'DNS & Domain Management',
    description: 'DNS automation, domain management, and security',
    setupSteps: [
      '1. Log in to https://dash.cloudflare.com',
      '2. Go to "Account Settings" (bottom left)',
      '3. Select "API Tokens"',
      '4. Click "Create Token"',
      '5. Use template "Edit zone DNS"',
      '6. Select your domain zone',
      '7. Copy the generated token',
      '8. Also get your Zone ID from domain overview',
      '9. Paste Token as "API Key", Zone ID as "API Secret"',
      '10. Test connection'
    ],
    documentationUrl: 'https://developers.cloudflare.com',
    requiredFields: ['API Token', 'Zone ID'],
    optionalFields: ['Account ID'],
    rateLimits: '1200 requests/5 minutes',
    supportEmail: 'support@cloudflare.com',
    estimatedSetupTime: '10 minutes'
  },

  namecheap: {
    serviceName: 'Namecheap',
    category: 'Domain Registration & DNS',
    description: 'Domain registration, purchase, and DNS management',
    setupSteps: [
      '1. Go to https://www.namecheap.com',
      '2. Log in to your account',
      '3. Click "Profile" → "Tools"',
      '4. Select "API Access"',
      '5. Enable API Access (if not already)',
      '6. Copy your API Key',
      '7. Also note your Username (shown in API settings)',
      '8. Paste API Key and Username into InboxGrove',
      '9. Verify IP whitelist allows InboxGrove servers',
      '10. Test connection'
    ],
    documentationUrl: 'https://www.namecheap.com/support/api',
    requiredFields: ['API Key', 'Username'],
    optionalFields: ['IP Whitelist'],
    rateLimits: '50 requests/second',
    supportEmail: 'support@namecheap.com',
    estimatedSetupTime: '10 minutes'
  },

  slack: {
    serviceName: 'Slack',
    category: 'Notifications & Communication',
    description: 'Team notifications, alerts, and bot integration',
    setupSteps: [
      '1. Go to https://api.slack.com/apps',
      '2. Click "Create New App" → "From scratch"',
      '3. Name it "InboxGrove Alerts"',
      '4. Select your workspace',
      '5. Go to "OAuth & Permissions"',
      '6. Under "Scopes", add "chat:write" and "incoming-webhook"',
      '7. Copy "Bot User OAuth Token"',
      '8. Go to "Incoming Webhooks"',
      '9. Click "Add New Webhook to Workspace"',
      '10. Select a channel (e.g., #inboxgrove)',
      '11. Copy webhook URL',
      '12. Paste Token as "API Key", Webhook as "API Secret"'
    ],
    documentationUrl: 'https://api.slack.com/docs',
    requiredFields: ['Bot Token', 'Webhook URL'],
    optionalFields: [],
    rateLimits: '60 messages/minute',
    supportEmail: 'support@slack.com',
    estimatedSetupTime: '15 minutes'
  }
};

export const DOMAIN_REGISTRATION_GUIDES = {
  cloudflare: {
    serviceName: 'Cloudflare Registrar',
    description: 'Register new domains through Cloudflare',
    features: [
      'Automatic DNS configuration',
      'WHOIS privacy included',
      'Email forwarding',
      'Competitive pricing'
    ],
    setupSteps: [
      '1. Log in to Cloudflare dashboard',
      '2. Go to "Registrar" in left menu',
      '3. Click "Transfer domain" or "Register domain"',
      '4. Search for your desired domain',
      '5. Add to cart and checkout',
      '6. InboxGrove will auto-configure DNS',
      '7. SPF, DKIM, DMARC automatically added',
      '8. Domain ready in 24-48 hours'
    ],
    requiresIntegration: 'cloudflare',
    autoConfigures: ['DNS', 'SPF', 'DKIM', 'DMARC']
  },

  namecheap: {
    serviceName: 'Namecheap',
    description: 'Register new domains through Namecheap',
    features: [
      'Affordable domain registration',
      'Free WHOIS Guard',
      'Flexible DNS management',
      'Domain forwarding'
    ],
    setupSteps: [
      '1. Log in to Namecheap account',
      '2. Click "Domain List"',
      '3. Search for domain to register',
      '4. Add to cart and purchase',
      '5. Use Namecheap API for auto-DNS setup',
      '6. InboxGrove will configure all records',
      '7. Domain ready in 24-48 hours',
      '8. InboxGrove monitors health daily'
    ],
    requiresIntegration: 'namecheap',
    autoConfigures: ['DNS', 'SPF', 'DKIM', 'DMARC']
  }
};

export const DNS_AUTO_INJECTION_CONFIG = {
  recordTypes: ['SPF', 'DKIM', 'DMARC', 'MX'],
  spfTemplate: 'v=spf1 include:sendgrid.net include:mailgun.org ~all',
  dkimTemplate: {
    selector: 'default',
    recordType: 'TXT',
    keyLength: 2048
  },
  dmarcTemplate: 'v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com; ruf=mailto:forensics@yourdomain.com; fo=1',
  mxRecords: [
    { priority: 10, value: 'mail.yourdomain.com' },
    { priority: 20, value: 'mail2.yourdomain.com' }
  ]
};

export const SECURITY_RECOMMENDATIONS = {
  apiKeys: [
    'Use separate API keys for development and production',
    'Rotate API keys every 90 days',
    'Use environment variables, never hardcode keys',
    'Restrict IP access where available',
    'Monitor API usage for anomalies'
  ],
  domainSecurity: [
    'Enable DMARC enforcement (p=reject)',
    'Monitor DMARC reports daily',
    'Set up SPF record correctly',
    'Use strong DKIM keys (2048-bit minimum)',
    'Regularly audit DNS records'
  ],
  bestPractices: [
    'Enable 2FA on all service accounts',
    'Use different passwords for each service',
    'Keep API keys in secure vault/manager',
    'Audit integration logs regularly',
    'Set up alerts for failed authentications'
  ]
};

export class APIGuideService {
  static getGuide(serviceName: string): APIGuide | null {
    return API_GUIDES[serviceName.toLowerCase()] || null;
  }

  static getAllGuides(): APIGuide[] {
    return Object.values(API_GUIDES);
  }

  static getSetupSteps(serviceName: string): string[] {
    const guide = this.getGuide(serviceName);
    return guide?.setupSteps || [];
  }

  static getDocumentationUrl(serviceName: string): string {
    const guide = this.getGuide(serviceName);
    return guide?.documentationUrl || '';
  }

  static getRequiredFields(serviceName: string): string[] {
    const guide = this.getGuide(serviceName);
    return guide?.requiredFields || [];
  }

  static formatGuideAsMarkdown(serviceName: string): string {
    const guide = this.getGuide(serviceName);
    if (!guide) return 'Guide not found';

    return `
# ${guide.serviceName} Setup Guide

**Category:** ${guide.category}
**Setup Time:** ${guide.estimatedSetupTime}

## Description
${guide.description}

## Setup Steps
${guide.setupSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## Required Fields
${guide.requiredFields.map(f => `- ${f}`).join('\n')}

## Rate Limits
${guide.rateLimits}

## Support
Contact: ${guide.supportEmail}
Documentation: ${guide.documentationUrl}
    `.trim();
  }
}
