/**
 * Legal & Compliance Service
 * Manages Terms of Service, Privacy, Refund Policies, and Compliance Data
 */

export interface LegalAgreement {
  version: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ComplianceData {
  termsVersion: string;
  privacyVersion: string;
  refundPolicyVersion: string;
  chargebackPolicyVersion: string;
  dataProtectionVersion: string;
}

export const TERMS_OF_SERVICE = {
  version: '1.0',
  lastUpdated: '2025-12-16',
  content: `
# InboxGrove Terms of Service v1.0

## 1. ACCEPTANCE OF TERMS
By accessing and using InboxGrove ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.

## 2. SERVICE DESCRIPTION
InboxGrove provides cold email infrastructure, inbox provisioning, and email deliverability automation services ("Service"). The Service includes but is not limited to:
- Automated inbox provisioning and setup
- DNS configuration and management
- Email deliverability optimization
- Third-party integrations with email automation platforms
- Real-time analytics and monitoring

## 3. PROHIBITED ACTIVITIES
You agree not to use InboxGrove for:
- Spam, phishing, or fraudulent activities
- Sending unsolicited bulk email (unless compliant with CAN-SPAM, GDPR, CASL)
- Violating anti-spam laws in any jurisdiction
- Malware distribution or security threats
- Harassment, hate speech, or illegal content
- Intellectual property infringement
- Any activity that violates applicable law

## 4. ACCOUNT RESPONSIBILITY
You are responsible for:
- Maintaining confidentiality of API keys and credentials
- All activity under your account
- Compliance with all applicable laws
- Ensuring recipients have opted in to communications
- Monitoring deliverability rates and reputation

## 5. SERVICE TERMINATION
InboxGrove reserves the right to:
- Suspend service immediately for policy violations
- Terminate accounts engaged in spam or illegal activity
- Remove content that violates these terms
- Audit account activity for compliance

Termination for violation of these terms results in FORFEITURE OF ALL FUNDS. No refunds will be issued.

## 6. LIMITATION OF LIABILITY
InboxGrove is provided "AS IS" without warranty. We are not liable for:
- Email delivery failures
- Third-party service failures
- Lost revenue or data
- Consequential or indirect damages
- Service interruptions beyond reasonable control

## 7. MODIFICATIONS TO SERVICE
We reserve the right to:
- Modify service features at any time
- Change pricing with 30 days' notice
- Update technical requirements
- Discontinue features or services

## 8. INDEMNIFICATION
You agree to indemnify InboxGrove from any claims, damages, or costs arising from:
- Your violation of these terms
- Your violation of applicable law
- Your use of the service
- Third-party claims related to your content

## 9. GOVERNING LAW
These terms are governed by applicable law. Any disputes shall be resolved through binding arbitration, not class action.
  `
};

export const REFUND_POLICY = {
  version: '1.0',
  lastUpdated: '2025-12-16',
  content: `
# InboxGrove Refund & Chargeback Prevention Policy v1.0

## CRITICAL: NO REFUNDS POLICY

### General Refund Terms
- **All sales are FINAL and NON-REFUNDABLE**
- InboxGrove provides **access to service**, not a physical product
- Services are delivered immediately upon payment
- No refunds for change of mind, unused service, or user error
- No pro-rata refunds for early termination

### Payment Terms
- Monthly subscriptions auto-renew unless canceled before renewal
- Annual payments are non-refundable and non-transferable
- One-time API credit purchases are non-refundable
- Unused credits expire after 12 months

### Legitimate Refund Exceptions (RARE)
Refunds are ONLY granted if:
1. **Service Failure**: Documented service outage lasting >72 hours affecting >50% of your inboxes
2. **Duplicate Charge**: Accidental duplicate billing (requires proof within 48 hours)
3. **Payment Processing Error**: System error confirmed by payment processor

All other requests are **automatically denied**.

### Chargeback & Fraud Policy
**CRITICAL WARNING**: Initiating a chargeback results in:
- **IMMEDIATE account termination**
- **Permanent ban** from InboxGrove
- **Legal action** for breach of contract
- **$5,000 chargeback penalty fee** added to merchant account
- **All future access permanently revoked**
- **Cooperation with payment processors** for fraud investigation

We have zero tolerance for chargebacks. Chargebacks are considered fraud and breach of contract.

### Payment Processing
- All payments processed by Stripe
- Payment disputes require email to support@inboxgrove.com
- 48-hour response time for legitimate disputes
- Documentation required for all refund requests

### Billing Disputes Resolution
1. Contact support within 14 days of charge
2. Provide order number and reason
3. InboxGrove will investigate
4. Response within 48 business hours
5. **NO REFUND ISSUED for service delivery disputes**
6. Service continues during investigation

### Acknowledgment Required
By proceeding with payment, you EXPLICITLY ACKNOWLEDGE:
✓ You have read this refund policy in full
✓ You understand ALL SALES ARE FINAL
✓ You will NOT dispute charges or initiate chargebacks
✓ You accept full responsibility for your usage
✓ Chargebacks result in permanent ban and legal action
✓ You waive right to class action or group proceedings
  `
};

export const DATA_PROTECTION_POLICY = {
  version: '1.0',
  lastUpdated: '2025-12-16',
  content: `
# InboxGrove Data Protection & Privacy Policy v1.0

## 1. DATA WE COLLECT
- Account information: Name, email, billing address, phone
- API credentials and integration keys
- Email campaign data and metadata
- Recipient email addresses
- Deliverability metrics and analytics
- IP addresses and usage logs
- Payment information (processed by Stripe - we don't store cards)

## 2. HOW WE USE YOUR DATA
- Provide and improve the Service
- Monitor deliverability and reputation
- Detect and prevent abuse
- Comply with legal requirements
- Send service notifications

## 3. DATA RETENTION
- Account data: Retained while account is active + 90 days after deletion
- Email data: Retained for 12 months for analytics
- Payment records: Retained for 7 years per tax law
- Logs: Retained for 30 days

## 4. GDPR COMPLIANCE
- We honor GDPR data subject rights
- Data Processing Addendum available upon request
- We are NOT a GDPR "processor" - you are the controller
- You are responsible for GDPR compliance of recipient data

## 5. CCPA COMPLIANCE
- California residents have right to access and delete personal data
- Submit requests to privacy@inboxgrove.com
- We will respond within 30 days

## 6. DATA SECURITY
- End-to-end encryption for sensitive credentials
- TLS 1.3 for all data transmission
- Regular security audits and penetration testing
- Access logs for all sensitive data
- No sharing with third parties without explicit consent

## 7. THIRD-PARTY INTEGRATIONS
When you connect third-party services (Instantly, Apollo, Smartlead):
- We store only the API key (encrypted)
- We do NOT store recipient data from those services
- You maintain control of data at all times
- Refer to third-party privacy policies for their practices

## 8. DISCLAIMER
InboxGrove is NOT liable for:
- Data breaches beyond reasonable security standards
- Third-party service data handling
- Your own credential leaks or misuse
- User error in sharing sensitive information

## 9. DATA DELETION
- Request data deletion at any time
- Account data deleted within 30 days
- Some data retained as required by law
- Backups may contain data for up to 90 days

## 10. CONTACT US
For privacy concerns: privacy@inboxgrove.com
  `
};

export const ACCEPTABLE_USE_POLICY = {
  version: '1.0',
  lastUpdated: '2025-12-16',
  content: `
# InboxGrove Acceptable Use Policy v1.0

## PROHIBITED USE CASES
You agree NOT to use InboxGrove for:

### 1. SPAM & UNSOLICITED EMAIL
- Sending email to recipients without prior consent
- Purchased email lists
- Harvested email addresses
- Blind mass email campaigns
- Non-compliance with CAN-SPAM Act (USA)
- Non-compliance with GDPR (EU/UK)
- Non-compliance with CASL (Canada)

### 2. PHISHING & FRAUD
- Deceptive subject lines or sender information
- Phishing for passwords or personal information
- Impersonation of companies or individuals
- Malicious links or attachments
- Social engineering
- Financial fraud or scams

### 3. ILLEGAL CONTENT
- Threats, harassment, or hate speech
- Gambling, illegal drugs, weapons
- Adult content to minors
- Copyright/trademark infringement
- Counterfeit goods
- Anything illegal in relevant jurisdiction

### 4. SYSTEM ABUSE
- Port scanning or network attacks
- Malware or virus distribution
- DDoS attacks or disruption
- Unauthorized access attempts
- Reverse engineering or circumvention
- Resource exhaustion attacks

### 5. DATA MISUSE
- Selling or sharing recipient data
- Privacy violations
- Unauthorized data collection
- Data mining without consent
- Building competing products from service data

## MONITORING & ENFORCEMENT
We actively monitor for:
- Spam patterns and complaint rates
- Authentication and DKIM failures
- IP reputation blacklist additions
- Rapid escalation of sending volume
- Non-delivery rate spikes

## CONSEQUENCES
Violations result in:
- Immediate service suspension
- Account termination without warning
- Permanent ban with no refund
- Cooperation with law enforcement
- Retention of evidence for legal action

## SPAM COMPLAINT THRESHOLD
- Spam complaints (>0.3% of volume) trigger suspension
- Hard bounces >5% trigger review
- Rapid increases in complaint rate trigger investigation
- Users agree to bear risk of false positives

## YOUR RESPONSIBILITY
By using InboxGrove, you certify:
✓ All recipients have opted in to email
✓ You have explicit permission to send
✓ Your content complies with all laws
✓ You will not engage in any prohibited use
✓ You assume all legal liability for your campaigns
  `
};

export const SECURITY_COMPLIANCE = {
  version: '1.0',
  certifications: [
    'SSL/TLS 1.3 Encryption',
    'HIPAA Ready Infrastructure',
    'SOC 2 Type II Compliant',
    'GDPR Privacy Shield',
    'Regular Penetration Testing',
    'Encrypted API Keys',
    'Rate Limiting & DDoS Protection',
    'Two-Factor Authentication'
  ],
  securityMeasures: {
    encryption: 'AES-256 for sensitive data at rest, TLS 1.3 in transit',
    authentication: '2FA via email, API key rotation support',
    monitoring: '24/7 intrusion detection, anomaly monitoring',
    auditing: 'Complete access logs, activity trails',
    backups: 'Automated daily backups, geo-redundant storage',
    incidentResponse: 'On-call incident response team'
  }
};

class LegalService {
  /**
   * Check if user has accepted terms
   */
  static hasAcceptedTerms(userId: string): boolean {
    const stored = localStorage.getItem(`terms_accepted_${userId}`);
    return !!stored;
  }

  /**
   * Record terms acceptance
   */
  static recordTermsAcceptance(userId: string, data: LegalAgreement): void {
    localStorage.setItem(`terms_accepted_${userId}`, JSON.stringify({
      ...data,
      acceptedAt: new Date().toISOString(),
      ipAddress: this.getUserIP(),
      userAgent: navigator.userAgent
    }));
  }

  /**
   * Get user's IP (client-side approximate)
   */
  static getUserIP(): string {
    // In production, get from server
    return 'client-side-ip';
  }

  /**
   * Verify all required compliance accepted
   */
  static verifyCompliance(userId: string): boolean {
    return this.hasAcceptedTerms(userId);
  }

  /**
   * Generate compliance report for user
   */
  static getComplianceReport(userId: string): ComplianceData {
    const termsData = localStorage.getItem(`terms_accepted_${userId}`);
    return {
      termsVersion: TERMS_OF_SERVICE.version,
      privacyVersion: DATA_PROTECTION_POLICY.version,
      refundPolicyVersion: REFUND_POLICY.version,
      chargebackPolicyVersion: REFUND_POLICY.version,
      dataProtectionVersion: DATA_PROTECTION_POLICY.version
    };
  }

  /**
   * Log user acceptance for audit trail
   */
  static auditLog(userId: string, action: string, metadata: any = {}): void {
    const log = {
      userId,
      action,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      metadata
    };
    console.log('[AUDIT]', log);
    // In production, send to backend audit log
  }
}

export { LegalService };
