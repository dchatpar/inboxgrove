"""
InboxGrove Billing & Subscription API Endpoints
Complete REST API specification for payment processing and subscription management
"""

# ============================================================================
# TRIAL & SUBSCRIPTION ENDPOINTS
# ============================================================================

"""
POST /auth/register
Register new user account (creates trial automatically)

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}

Response (201 Created):
{
  "user_id": "uuid-xxx",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "trial": {
    "trial_id": "uuid-trial-xxx",
    "starts_at": "2025-12-16T10:30:00Z",
    "expires_at": "2025-12-23T10:30:00Z",
    "days_remaining": 7,
    "status": "active",
    "tier": "professional",
    "inboxes_limit": 50,
    "domains_limit": 3
  },
  "subscription": null
}

Errors:
- 400: Invalid input
- 409: Email already exists
"""

"""
POST /billing/setup-trial
Setup trial period with payment method on file

Request:
{
  "plan_id": "pro",  # starter | pro | enterprise
  "billing_cycle": "monthly",  # monthly | yearly
  "trial_days": 7,
  "card_details": {
    "cardNumber": "4242 4242 4242 4242",
    "cardExpiry": "12/25",
    "cardCVC": "123",
    "cardholderName": "John Doe",
    "email": "john@example.com",
    "billingAddress": "123 Main St",
    "billingCity": "New York",
    "billingState": "NY",
    "billingZip": "10001",
    "billingCountry": "US"
  }
}

Response (200 OK):
{
  "trial_period": {
    "trial_id": "uuid-xxx",
    "starts_at": "2025-12-16T10:30:00Z",
    "expires_at": "2025-12-23T10:30:00Z",
    "days_remaining": 7,
    "status": "active"
  },
  "payment_method": {
    "payment_method_id": "uuid-pm-xxx",
    "card_brand": "visa",
    "card_last_four": "4242"
  },
  "subscription": {
    "subscription_id": "uuid-sub-xxx",
    "plan": "pro",
    "billing_cycle": "monthly",
    "status": "trialing",
    "current_price": 79,
    "next_billing_date": "2025-12-23T10:30:00Z"
  }
}

Errors:
- 400: Invalid payment details
- 422: Card declined
- 429: Too many attempts
"""

"""
GET /billing/trial
Get current trial status

Response (200 OK):
{
  "trial_id": "uuid-xxx",
  "status": "active",  # active | expired | converted | cancelled
  "starts_at": "2025-12-16T10:30:00Z",
  "expires_at": "2025-12-23T10:30:00Z",
  "days_remaining": 3,
  "converted_to_plan": null,
  "trial_inboxes_limit": 50,
  "trial_domains_limit": 3,
  "inboxes_created": 12,
  "domains_added": 2,
  "emails_sent": 1250
}

Errors:
- 404: No active trial
"""

"""
POST /billing/trial/extend
Request trial extension (admin only)

Request:
{
  "user_id": "uuid-xxx",
  "additional_days": 7,
  "reason": "customer_request"
}

Response (200 OK):
{
  "trial_id": "uuid-xxx",
  "new_expiry": "2025-12-30T10:30:00Z",
  "days_remaining": 14
}
"""

# ============================================================================
# SUBSCRIPTION MANAGEMENT
# ============================================================================

"""
GET /billing/subscription
Get current subscription details

Response (200 OK):
{
  "subscription_id": "uuid-xxx",
  "status": "active",  # active | trialing | paused | cancelled | past_due
  "plan": {
    "id": "pro",
    "name": "Professional",
    "monthly_price": 79,
    "yearly_price": 790,
    "max_inboxes": 250,
    "max_domains": 10,
    "features": [...]
  },
  "billing_cycle": "monthly",
  "current_price": 79,
  "currency": "USD",
  "started_at": "2025-12-16T10:30:00Z",
  "current_period_start": "2025-12-23T10:30:00Z",
  "current_period_end": "2026-01-23T10:30:00Z",
  "next_billing_date": "2026-01-23T10:30:00Z",
  "auto_renew": true,
  "cancel_at_period_end": false,
  "stripe_subscription_id": "sub_xxx"
}

Errors:
- 404: No active subscription
"""

"""
POST /billing/subscription/upgrade
Upgrade to higher plan

Request:
{
  "plan_id": "enterprise",  # starter | pro | enterprise
  "billing_cycle": "monthly",  # monthly | yearly (optional, keep current if not provided)
  "immediate": true  # true = charge now with proration, false = next billing date
}

Response (200 OK):
{
  "subscription_id": "uuid-xxx",
  "plan": "enterprise",
  "status": "active",
  "new_price": 299,
  "proration_charge": 48,  # Amount owed for upgrade before next billing date
  "effective_date": "2025-12-16T10:30:00Z",
  "invoice": {
    "invoice_id": "uuid-inv-xxx",
    "amount": 48,
    "status": "paid",
    "paid_date": "2025-12-16T10:35:00Z"
  }
}

Errors:
- 400: Invalid plan
- 403: Already on this plan
- 422: Card declined
"""

"""
POST /billing/subscription/downgrade
Downgrade to lower plan

Request:
{
  "plan_id": "starter",  # starter | pro
  "effective_date": "2026-01-23",  # When downgrade takes effect (optional, defaults to next billing date)
  "handle_excess_inboxes": "pause"  # pause | delete | keep (keep if plan allows)
}

Response (200 OK):
{
  "subscription_id": "uuid-xxx",
  "plan": "starter",
  "status": "active",
  "new_price": 29,
  "effective_date": "2026-01-23T10:30:00Z",
  "refund": {
    "refund_id": "uuid-ref-xxx",
    "amount": 35,
    "reason": "proration",
    "status": "processing"
  },
  "warning": {
    "message": "You have 52 inboxes but Starter plan allows only 50",
    "action_required": "pause or delete 2 inboxes"
  }
}

Errors:
- 400: Invalid plan
- 403: Already on this plan or lower
"""

"""
POST /billing/subscription/change-billing-cycle
Change between monthly and yearly billing

Request:
{
  "billing_cycle": "yearly",  # monthly | yearly
  "effective_date": "now"  # now | next_billing_date
}

Response (200 OK):
{
  "subscription_id": "uuid-xxx",
  "billing_cycle": "yearly",
  "new_price": 790,
  "old_price": 948,  # 79 * 12
  "credit": 158,
  "effective_date": "2025-12-16T10:30:00Z",
  "next_billing_date": "2026-12-23T10:30:00Z"
}

Errors:
- 400: Invalid billing cycle
- 403: Same billing cycle
"""

"""
POST /billing/subscription/cancel
Cancel subscription

Request (optional):
{
  "immediate": false,  # true = cancel now, false = cancel at period end
  "reason": "too_expensive",  # too_expensive | missing_features | switching | other
  "feedback": "optional feedback"
}

Response (200 OK):
{
  "subscription_id": "uuid-xxx",
  "status": "cancelled",
  "cancelled_at": "2025-12-16T10:30:00Z",
  "cancellation_effective_date": "2026-01-23T10:30:00Z",  # If not immediate
  "final_invoice": {
    "invoice_id": "uuid-inv-xxx",
    "amount": 0,
    "refund": 35  # Prorated refund if cancelled mid-cycle
  },
  "data_retention_until": "2026-01-22T10:30:00Z"  # 30 days retention
}

Errors:
- 404: Subscription not found
- 409: Already cancelled
"""

"""
POST /billing/subscription/reactivate
Reactivate cancelled subscription

Request (optional):
{
  "plan_id": "pro",  # Optional, use previous plan if not provided
  "trial_days": 7  # Optional trial on reactivation
}

Response (200 OK):
{
  "subscription_id": "uuid-xxx",
  "status": "active",
  "plan": "pro",
  "reactivated_at": "2025-12-16T10:30:00Z",
  "next_billing_date": "2025-12-23T10:30:00Z"
}

Errors:
- 404: Subscription not found
- 409: Not cancelled or grace period expired
"""

# ============================================================================
# PAYMENT METHODS
# ============================================================================

"""
POST /billing/payment-methods
Add new payment method

Request:
{
  "card_number": "4242 4242 4242 4242",
  "card_expiry": "12/25",
  "card_cvc": "123",
  "cardholder_name": "John Doe",
  "billing_email": "john@example.com",
  "billing_address": "123 Main St",
  "billing_city": "New York",
  "billing_state": "NY",
  "billing_postal_code": "10001",
  "billing_country": "US",
  "set_as_default": true
}

Response (201 Created):
{
  "payment_method_id": "uuid-pm-xxx",
  "stripe_payment_method_id": "pm_xxx",
  "card_brand": "visa",
  "card_last_four": "4242",
  "card_exp_month": 12,
  "card_exp_year": 2025,
  "is_default": true,
  "is_active": true,
  "created_at": "2025-12-16T10:30:00Z"
}

Errors:
- 400: Invalid payment method details
- 422: Card declined
- 422: Invalid expiry date
"""

"""
GET /billing/payment-methods
List all payment methods

Response (200 OK):
{
  "payment_methods": [
    {
      "payment_method_id": "uuid-pm-xxx",
      "card_brand": "visa",
      "card_last_four": "4242",
      "card_exp_month": 12,
      "card_exp_year": 2025,
      "is_default": true,
      "is_active": true,
      "created_at": "2025-12-16T10:30:00Z"
    }
  ]
}
"""

"""
PATCH /billing/payment-methods/{payment_method_id}
Update payment method

Request (optional):
{
  "set_as_default": true,
  "is_active": true
}

Response (200 OK):
{
  "payment_method_id": "uuid-pm-xxx",
  "is_default": true,
  "is_active": true,
  "updated_at": "2025-12-16T10:30:00Z"
}
"""

"""
DELETE /billing/payment-methods/{payment_method_id}
Delete payment method

Response (200 OK):
{
  "payment_method_id": "uuid-pm-xxx",
  "deleted_at": "2025-12-16T10:30:00Z"
}

Errors:
- 409: Cannot delete default payment method (set another as default first)
"""

# ============================================================================
# INVOICING
# ============================================================================

"""
GET /billing/invoices
List invoices with pagination

Query Parameters:
- page: int = 1
- per_page: int = 20 (max 100)
- status: string = all | paid | pending | overdue | draft
- sort_by: string = date | amount | status

Response (200 OK):
{
  "invoices": [
    {
      "invoice_id": "uuid-inv-xxx",
      "invoice_number": "INV-2025-001234",
      "stripe_invoice_id": "in_xxx",
      "status": "paid",
      "description": "Professional Plan - Monthly",
      "amount": 79,
      "subtotal": 79,
      "tax_amount": 0,
      "total_amount": 79,
      "issue_date": "2025-12-23T10:30:00Z",
      "due_date": "2026-01-23T10:30:00Z",
      "paid_date": "2025-12-23T10:35:00Z",
      "pdf_url": "https://api.inboxgrove.com/invoices/pdf/uuid-xxx",
      "items": [
        {
          "description": "Professional Plan (Monthly)",
          "quantity": 1,
          "unit_price": 79
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 12,
    "total_pages": 1
  }
}
"""

"""
GET /billing/invoices/{invoice_id}
Get specific invoice details

Response (200 OK):
{
  "invoice_id": "uuid-inv-xxx",
  "invoice_number": "INV-2025-001234",
  "stripe_invoice_id": "in_xxx",
  "status": "paid",
  "items": [...],
  "subtotal": 79,
  "tax_rate": 0,
  "tax_amount": 0,
  "discount_amount": 0,
  "total_amount": 79,
  "issue_date": "2025-12-23T10:30:00Z",
  "due_date": "2026-01-23T10:30:00Z",
  "paid_date": "2025-12-23T10:35:00Z",
  "pdf_url": "https://...",
  "memo": "Thank you for your business"
}
"""

"""
GET /billing/invoices/{invoice_id}/download-pdf
Download invoice as PDF

Response: PDF file (application/pdf)
"""

"""
POST /billing/invoices/{invoice_id}/retry-payment
Retry failed payment on invoice

Response (200 OK):
{
  "invoice_id": "uuid-inv-xxx",
  "transaction": {
    "transaction_id": "uuid-txn-xxx",
    "status": "succeeded",
    "amount": 79,
    "paid_at": "2025-12-16T10:35:00Z"
  }
}

Errors:
- 400: Invoice already paid
- 422: Payment declined
- 429: Too many retry attempts
"""

# ============================================================================
# TRANSACTIONS & REFUNDS
# ============================================================================

"""
GET /billing/transactions
List all transactions

Query Parameters:
- page: int = 1
- per_page: int = 20
- status: string = all | succeeded | failed | pending
- type: string = all | charge | refund | adjustment

Response (200 OK):
{
  "transactions": [
    {
      "transaction_id": "uuid-txn-xxx",
      "stripe_charge_id": "ch_xxx",
      "amount": 79,
      "currency": "USD",
      "type": "charge",  # charge | refund | adjustment
      "status": "succeeded",
      "description": "Professional Plan - Monthly",
      "card_brand": "visa",
      "card_last_four": "4242",
      "created_at": "2025-12-23T10:30:00Z"
    }
  ],
  "pagination": {...}
}
"""

"""
POST /billing/refunds
Create refund for transaction

Request:
{
  "transaction_id": "uuid-txn-xxx",
  "amount": 79,  # Optional, full refund if not specified
  "reason": "requested_by_customer",  # requested_by_customer | duplicate | fraudulent | other
  "notes": "Customer requested refund"
}

Response (201 Created):
{
  "refund_id": "uuid-ref-xxx",
  "transaction_id": "uuid-txn-xxx",
  "stripe_refund_id": "re_xxx",
  "amount": 79,
  "currency": "USD",
  "status": "pending",  # pending | succeeded | failed
  "reason": "requested_by_customer",
  "requested_at": "2025-12-16T10:30:00Z",
  "expected_completion": "2025-12-20T10:30:00Z"
}

Errors:
- 400: Invalid amount
- 409: Already refunded
- 422: Refund period exceeded (60 days)
"""

# ============================================================================
# PROMO CODES & DISCOUNTS
# ============================================================================

"""
POST /billing/validate-promo-code
Validate promo code before applying

Request:
{
  "promo_code": "SAVE20",
  "plan_id": "pro"  # Optional, validate for specific plan
}

Response (200 OK):
{
  "promo_code_id": "uuid-promo-xxx",
  "code": "SAVE20",
  "discount_type": "percentage",  # percentage | fixed
  "discount_value": 20,  # 20% or $20
  "is_valid": true,
  "max_uses": -1,  # -1 = unlimited
  "uses_remaining": 950,
  "valid_until": "2026-12-31T23:59:59Z",
  "applicable_tiers": ["pro", "enterprise"]
}

Errors:
- 404: Promo code not found
- 410: Promo code expired
- 409: Promo code limit reached
- 422: Not applicable to this plan
"""

"""
POST /billing/apply-promo-code
Apply promo code to subscription

Request:
{
  "promo_code": "SAVE20"
}

Response (200 OK):
{
  "subscription_id": "uuid-sub-xxx",
  "promo_code_id": "uuid-promo-xxx",
  "discount_amount": 15.8,  # 20% of $79
  "new_monthly_price": 63.20,
  "discount_until": "2026-01-23T10:30:00Z"  # Next renewal, or specific end date
}

Errors:
- 404: Promo code not found
- 409: Code already applied
- 422: Code not valid for current plan
"""

# ============================================================================
# BILLING WEBHOOKS
# ============================================================================

"""
POST /webhooks/billing (Stripe Webhook Endpoint)

Stripe sends webhook events:

1. invoice.payment_succeeded
   - Update invoice status to PAID
   - Extend subscription access
   - Send receipt email

2. invoice.payment_failed
   - Update invoice status to OVERDUE
   - Trigger retry logic
   - Send payment failure notification

3. customer.subscription.created
   - Create subscription record
   - Log audit event
   - Send welcome email

4. customer.subscription.updated
   - Update subscription details
   - Handle plan changes
   - Log changes

5. customer.subscription.deleted
   - Cancel subscription
   - Revoke feature access
   - Send cancellation confirmation

6. charge.refunded
   - Create refund record
   - Send refund confirmation
   - Update transaction status

Example Webhook Handler:
POST /webhooks/billing
Headers:
  Stripe-Signature: t=...,v1=...

{
  "id": "evt_xxx",
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "id": "in_xxx",
      "customer": "cus_xxx",
      "amount_paid": 7900,
      "status": "paid"
    }
  }
}

Response: {"status": "received"}
"""
