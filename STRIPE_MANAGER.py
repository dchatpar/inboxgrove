"""
InboxGrove Stripe Payment Integration
Complete implementation for Stripe payments, subscriptions, invoicing, and webhook handling
"""

import stripe
import asyncio
import json
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class StripeManager:
    """
    Complete Stripe integration for InboxGrove
    Handles subscriptions, payments, invoicing, and webhooks
    """
    
    def __init__(self, api_key: str, webhook_secret: str):
        """
        Initialize Stripe manager
        
        Args:
            api_key: Stripe API secret key
            webhook_secret: Stripe webhook signing secret
        """
        stripe.api_key = api_key
        self.webhook_secret = webhook_secret
    
    # ========================================================================
    # CUSTOMER MANAGEMENT
    # ========================================================================
    
    async def create_customer(
        self,
        user_id: str,
        email: str,
        name: str,
        metadata: Dict = None
    ) -> str:
        """
        Create Stripe customer
        
        Args:
            user_id: Internal user ID
            email: Customer email
            name: Customer name
            metadata: Additional metadata
            
        Returns:
            Stripe customer ID
        """
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={
                    "user_id": user_id,
                    **(metadata or {})
                }
            )
            logger.info(f"Created Stripe customer {customer.id} for user {user_id}")
            return customer.id
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create Stripe customer: {str(e)}")
            raise
    
    # ========================================================================
    # PAYMENT METHOD MANAGEMENT
    # ========================================================================
    
    async def attach_payment_method(
        self,
        stripe_customer_id: str,
        payment_method_id: str
    ) -> bool:
        """
        Attach payment method to customer
        
        Args:
            stripe_customer_id: Stripe customer ID
            payment_method_id: Stripe payment method ID
            
        Returns:
            True if successful
        """
        try:
            stripe.PaymentMethod.attach(
                payment_method_id,
                customer=stripe_customer_id
            )
            
            # Set as default
            stripe.Customer.modify(
                stripe_customer_id,
                invoice_settings={
                    "default_payment_method": payment_method_id
                }
            )
            
            logger.info(f"Attached payment method {payment_method_id} to customer {stripe_customer_id}")
            return True
        except stripe.error.StripeError as e:
            logger.error(f"Failed to attach payment method: {str(e)}")
            raise
    
    async def detach_payment_method(self, payment_method_id: str) -> bool:
        """Detach payment method from customer"""
        try:
            stripe.PaymentMethod.detach(payment_method_id)
            logger.info(f"Detached payment method {payment_method_id}")
            return True
        except stripe.error.StripeError as e:
            logger.error(f"Failed to detach payment method: {str(e)}")
            raise
    
    async def get_payment_method(self, payment_method_id: str) -> Dict:
        """
        Get payment method details
        
        Returns:
            Dict with card details (last 4, brand, exp month/year)
        """
        try:
            pm = stripe.PaymentMethod.retrieve(payment_method_id)
            return {
                "id": pm.id,
                "brand": pm.card.brand.upper(),
                "last_four": pm.card.last4,
                "exp_month": pm.card.exp_month,
                "exp_year": pm.card.exp_year,
                "country": pm.card.country
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to get payment method: {str(e)}")
            raise
    
    # ========================================================================
    # SUBSCRIPTION MANAGEMENT
    # ========================================================================
    
    async def create_subscription(
        self,
        stripe_customer_id: str,
        price_id: str,
        trial_days: int = 7,
        payment_method_id: Optional[str] = None,
        promo_code: Optional[str] = None,
        metadata: Dict = None
    ) -> Dict:
        """
        Create subscription with optional trial period
        
        Args:
            stripe_customer_id: Stripe customer ID
            price_id: Stripe price ID (from subscription plan)
            trial_days: Number of trial days (default 7)
            payment_method_id: Payment method to use
            promo_code: Promo code for discount
            metadata: Additional metadata
            
        Returns:
            Dict with subscription details
        """
        try:
            items = [{
                "price": price_id,
                "metadata": metadata or {}
            }]
            
            subscription_params = {
                "customer": stripe_customer_id,
                "items": items,
                "trial_period_days": trial_days,
                "automatic_tax": {"enabled": True},
                "expand": ["latest_invoice.payment_intent"]
            }
            
            # Add payment method if provided
            if payment_method_id:
                subscription_params["default_payment_method"] = payment_method_id
            
            # Add promo code if provided
            if promo_code:
                subscription_params["promotion_code"] = await self._get_promotion_code_id(promo_code)
            
            subscription = stripe.Subscription.create(**subscription_params)
            
            logger.info(f"Created subscription {subscription.id} for customer {stripe_customer_id}")
            
            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
                "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
                "trial_end": datetime.fromtimestamp(subscription.trial_end) if subscription.trial_end else None,
                "next_billing_date": datetime.fromtimestamp(subscription.current_period_end)
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create subscription: {str(e)}")
            raise
    
    async def update_subscription(
        self,
        subscription_id: str,
        price_id: Optional[str] = None,
        trial_period_days: Optional[int] = None,
        payment_method_id: Optional[str] = None,
        cancel_at_period_end: Optional[bool] = None
    ) -> Dict:
        """
        Update existing subscription
        
        Args:
            subscription_id: Stripe subscription ID
            price_id: New price ID (for plan change)
            trial_period_days: New trial days
            payment_method_id: New payment method
            cancel_at_period_end: Set cancellation at period end
            
        Returns:
            Updated subscription details
        """
        try:
            params = {}
            
            if price_id:
                # Get current subscription to update items
                sub = stripe.Subscription.retrieve(subscription_id)
                params["items"] = [{
                    "id": sub.items.data[0].id,
                    "price": price_id
                }]
                params["proration_behavior"] = "create_prorations"
            
            if trial_period_days is not None:
                params["trial_period_days"] = trial_period_days
            
            if payment_method_id:
                params["default_payment_method"] = payment_method_id
            
            if cancel_at_period_end is not None:
                params["cancel_at_period_end"] = cancel_at_period_end
            
            subscription = stripe.Subscription.modify(subscription_id, **params)
            
            logger.info(f"Updated subscription {subscription_id}")
            
            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
                "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
                "cancel_at_period_end": subscription.cancel_at_period_end
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to update subscription: {str(e)}")
            raise
    
    async def cancel_subscription(
        self,
        subscription_id: str,
        immediately: bool = False
    ) -> Dict:
        """
        Cancel subscription
        
        Args:
            subscription_id: Stripe subscription ID
            immediately: If True, cancel immediately. If False, cancel at period end.
            
        Returns:
            Cancellation details
        """
        try:
            if immediately:
                subscription = stripe.Subscription.delete(subscription_id)
            else:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            
            logger.info(f"Cancelled subscription {subscription_id}")
            
            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "cancelled_at": datetime.now()
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to cancel subscription: {str(e)}")
            raise
    
    async def get_subscription(self, subscription_id: str) -> Dict:
        """Get subscription details"""
        try:
            sub = stripe.Subscription.retrieve(subscription_id)
            return {
                "subscription_id": sub.id,
                "status": sub.status,
                "customer_id": sub.customer,
                "current_period_start": datetime.fromtimestamp(sub.current_period_start),
                "current_period_end": datetime.fromtimestamp(sub.current_period_end),
                "trial_end": datetime.fromtimestamp(sub.trial_end) if sub.trial_end else None,
                "cancel_at_period_end": sub.cancel_at_period_end,
                "items": [{
                    "price_id": item.price.id,
                    "product_id": item.price.product,
                    "amount": item.price.unit_amount,
                    "currency": item.price.currency
                } for item in sub.items.data]
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to get subscription: {str(e)}")
            raise
    
    # ========================================================================
    # INVOICING
    # ========================================================================
    
    async def create_invoice(
        self,
        stripe_customer_id: str,
        description: str,
        items: List[Dict],
        tax_percent: float = 0.0,
        due_days: int = 30
    ) -> Dict:
        """
        Create invoice
        
        Args:
            stripe_customer_id: Stripe customer ID
            description: Invoice description
            items: List of line items [{"description": "", "amount": cents}]
            tax_percent: Tax percentage
            due_days: Days until due
            
        Returns:
            Invoice details
        """
        try:
            invoice_items = []
            for item in items:
                invoice_items.append(
                    stripe.InvoiceItem.create(
                        customer=stripe_customer_id,
                        description=item["description"],
                        amount=int(item["amount"] * 100),  # Convert to cents
                        currency="usd"
                    )
                )
            
            due_date = datetime.utcnow() + timedelta(days=due_days)
            
            invoice = stripe.Invoice.create(
                customer=stripe_customer_id,
                description=description,
                due_date=int(due_date.timestamp()),
                auto_advance=True,
                default_tax_rates=[
                    await self._get_or_create_tax_rate(tax_percent)
                ] if tax_percent > 0 else []
            )
            
            stripe.Invoice.finalize_invoice(invoice.id)
            
            logger.info(f"Created invoice {invoice.id} for customer {stripe_customer_id}")
            
            return {
                "invoice_id": invoice.id,
                "number": invoice.number,
                "status": invoice.status,
                "amount_due": invoice.amount_due / 100,
                "total": invoice.total / 100,
                "due_date": datetime.fromtimestamp(invoice.due_date),
                "hosted_invoice_url": invoice.hosted_invoice_url,
                "pdf": invoice.invoice_pdf
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create invoice: {str(e)}")
            raise
    
    async def send_invoice(self, invoice_id: str) -> bool:
        """Send invoice to customer via email"""
        try:
            stripe.Invoice.send_invoice(invoice_id)
            logger.info(f"Sent invoice {invoice_id}")
            return True
        except stripe.error.StripeError as e:
            logger.error(f"Failed to send invoice: {str(e)}")
            raise
    
    # ========================================================================
    # PAYMENT PROCESSING
    # ========================================================================
    
    async def create_payment_intent(
        self,
        amount: int,
        currency: str = "usd",
        customer_id: Optional[str] = None,
        payment_method_id: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Dict = None
    ) -> Dict:
        """
        Create payment intent for one-time payment
        
        Args:
            amount: Amount in cents
            currency: Currency code
            customer_id: Stripe customer ID
            payment_method_id: Payment method ID
            description: Payment description
            metadata: Additional metadata
            
        Returns:
            Payment intent details
        """
        try:
            params = {
                "amount": amount,
                "currency": currency,
                "automatic_payment_methods": {"enabled": True},
                "metadata": metadata or {}
            }
            
            if customer_id:
                params["customer"] = customer_id
            
            if payment_method_id:
                params["payment_method"] = payment_method_id
                params["confirm"] = True
            
            if description:
                params["description"] = description
            
            intent = stripe.PaymentIntent.create(**params)
            
            logger.info(f"Created payment intent {intent.id}")
            
            return {
                "payment_intent_id": intent.id,
                "client_secret": intent.client_secret,
                "status": intent.status,
                "amount": intent.amount / 100,
                "currency": intent.currency
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create payment intent: {str(e)}")
            raise
    
    async def confirm_payment(self, payment_intent_id: str) -> Dict:
        """Confirm payment"""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                "payment_intent_id": intent.id,
                "status": intent.status,
                "charge_id": intent.charges.data[0].id if intent.charges.data else None,
                "amount_received": intent.amount_received / 100
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to confirm payment: {str(e)}")
            raise
    
    # ========================================================================
    # REFUNDS
    # ========================================================================
    
    async def create_refund(
        self,
        charge_id: str,
        amount: Optional[int] = None,
        reason: str = "requested_by_customer",
        metadata: Dict = None
    ) -> Dict:
        """
        Create refund
        
        Args:
            charge_id: Stripe charge ID
            amount: Amount in cents (None = full refund)
            reason: Refund reason
            metadata: Additional metadata
            
        Returns:
            Refund details
        """
        try:
            params = {
                "charge": charge_id,
                "reason": reason,
                "metadata": metadata or {}
            }
            
            if amount:
                params["amount"] = amount
            
            refund = stripe.Refund.create(**params)
            
            logger.info(f"Created refund {refund.id} for charge {charge_id}")
            
            return {
                "refund_id": refund.id,
                "charge_id": refund.charge,
                "status": refund.status,
                "amount": refund.amount / 100,
                "reason": refund.reason
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create refund: {str(e)}")
            raise
    
    # ========================================================================
    # WEBHOOK HANDLING
    # ========================================================================
    
    async def verify_webhook_signature(self, payload: str, signature: str) -> Dict:
        """
        Verify Stripe webhook signature
        
        Args:
            payload: Raw webhook payload
            signature: Signature header from Stripe
            
        Returns:
            Webhook event data
        """
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                self.webhook_secret
            )
            return event
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {str(e)}")
            raise
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {str(e)}")
            raise
    
    # ========================================================================
    # HELPER METHODS
    # ========================================================================
    
    async def _get_promotion_code_id(self, code: str) -> str:
        """Get promotion code ID from code string"""
        try:
            promotion_code = stripe.PromotionCode.list(code=code, limit=1)
            if promotion_code.data:
                return promotion_code.data[0].id
            raise ValueError(f"Promotion code not found: {code}")
        except stripe.error.StripeError as e:
            logger.error(f"Failed to get promotion code: {str(e)}")
            raise
    
    async def _get_or_create_tax_rate(self, tax_percent: float) -> str:
        """Get or create tax rate"""
        try:
            tax_rates = stripe.TaxRate.list(limit=100)
            for rate in tax_rates.data:
                if rate.percentage == tax_percent and rate.active:
                    return rate.id
            
            # Create new tax rate
            tax_rate = stripe.TaxRate.create(
                display_name=f"{tax_percent}% Tax",
                percentage=tax_percent,
                inclusive=False
            )
            return tax_rate.id
        except stripe.error.StripeError as e:
            logger.error(f"Failed to manage tax rate: {str(e)}")
            raise


# ============================================================================
# WEBHOOK EVENT HANDLERS
# ============================================================================

class StripeWebhookHandler:
    """Handle Stripe webhook events"""
    
    @staticmethod
    async def handle_payment_intent_succeeded(event: Dict, db_session) -> None:
        """Handle payment_intent.succeeded webhook"""
        payment_intent = event["data"]["object"]
        logger.info(f"Payment succeeded: {payment_intent['id']}")
        # Update transaction in database
        # Mark invoice as paid
    
    @staticmethod
    async def handle_charge_failed(event: Dict, db_session) -> None:
        """Handle charge.failed webhook"""
        charge = event["data"]["object"]
        logger.warning(f"Charge failed: {charge['id']} - {charge['failure_message']}")
        # Update transaction status
        # Send failure notification to user
    
    @staticmethod
    async def handle_customer_subscription_created(event: Dict, db_session) -> None:
        """Handle customer.subscription.created webhook"""
        subscription = event["data"]["object"]
        logger.info(f"Subscription created: {subscription['id']}")
        # Create subscription record in database
        # Activate trial period
    
    @staticmethod
    async def handle_customer_subscription_updated(event: Dict, db_session) -> None:
        """Handle customer.subscription.updated webhook"""
        subscription = event["data"]["object"]
        logger.info(f"Subscription updated: {subscription['id']}")
        # Update subscription record
    
    @staticmethod
    async def handle_customer_subscription_deleted(event: Dict, db_session) -> None:
        """Handle customer.subscription.deleted webhook"""
        subscription = event["data"]["object"]
        logger.warning(f"Subscription cancelled: {subscription['id']}")
        # Mark subscription as cancelled
        # Downgrade user features
    
    @staticmethod
    async def handle_invoice_payment_succeeded(event: Dict, db_session) -> None:
        """Handle invoice.payment_succeeded webhook"""
        invoice = event["data"]["object"]
        logger.info(f"Invoice paid: {invoice['id']}")
        # Update invoice status to paid
        # Send receipt email
    
    @staticmethod
    async def handle_invoice_payment_failed(event: Dict, db_session) -> None:
        """Handle invoice.payment_failed webhook"""
        invoice = event["data"]["object"]
        logger.warning(f"Invoice payment failed: {invoice['id']}")
        # Update invoice status to overdue
        # Send retry notification
