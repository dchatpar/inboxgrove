"""
Security utilities including rate limiting, password hashing, and tenant suspension.
The "Kill Switch" for anti-abuse.
"""

import logging
import hashlib
import secrets
from functools import lru_cache
from typing import Optional, Tuple
from datetime import datetime, timedelta

import bcrypt
from fastapi import HTTPException, status, Request, Depends
from sqlalchemy.orm import Session
import jwt

from app.config import settings
from app.database.models import Tenant

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash."""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


class RateLimiter:
    """Rate limiting per tenant."""
    
    # In-memory store (use Redis in production)
    _request_counts = {}
    
    @classmethod
    def check_rate_limit(cls, tenant_id: str) -> Tuple[bool, Optional[str]]:
        """
        Check if tenant has exceeded rate limits.
        
        Returns:
            Tuple of (allowed: bool, error_message: Optional[str])
        """
        if not settings.RATE_LIMIT_ENABLED:
            return True, None
        
        now = datetime.utcnow()
        key = f"tenant_{tenant_id}"
        
        if key not in cls._request_counts:
            cls._request_counts[key] = []
        
        # Clean old requests (older than 1 hour)
        cls._request_counts[key] = [
            ts for ts in cls._request_counts[key]
            if now - ts < timedelta(hours=1)
        ]
        
        # Check minute limit
        recent_minute = sum(
            1 for ts in cls._request_counts[key]
            if now - ts < timedelta(minutes=1)
        )
        
        if recent_minute >= settings.RATE_LIMIT_REQUESTS_PER_MINUTE:
            return False, "Rate limit exceeded (per minute)"
        
        # Check hour limit
        if len(cls._request_counts[key]) >= settings.RATE_LIMIT_REQUESTS_PER_HOUR:
            return False, "Rate limit exceeded (per hour)"
        
        # Add this request
        cls._request_counts[key].append(now)
        
        return True, None


async def get_current_tenant(
    request: Request,
    db: Session = Depends(lambda: None)
) -> Tenant:
    """
    Dependency to get current authenticated tenant from JWT token.
    
    Validates token and returns tenant object.
    """
    from app.database.session import SessionLocal
    
    if not db:
        db = SessionLocal()
    
    try:
        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid authorization header"
            )
        
        token = auth_header.split(" ")[1]
        
        # Verify JWT
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        tenant_id = payload.get("tenant_id")
        if not tenant_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Get tenant from database
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        # Check if suspended
        if tenant.is_suspended:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account suspended"
            )
        
        # Check rate limits
        allowed, error = RateLimiter.check_rate_limit(str(tenant.id))
        if not allowed:
            logger.warning(f"Rate limit exceeded for tenant {tenant.id}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=error
            )
        
        return tenant
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication error"
        )
    finally:
        if db:
            db.close()


class SuspensionManager:
    """
    The "Kill Switch" for anti-abuse.
    
    When a tenant is suspended:
    1. is_suspended flag set to True
    2. All API requests rejected
    3. KumoMTA config reloaded to exclude domains
    4. Webhooks stop processing
    5. Background tasks pause
    """
    
    @staticmethod
    def should_suspend(tenant: Tenant, reason_code: str) -> Tuple[bool, str]:
        """
        Determine if tenant should be suspended based on abuse signals.
        
        Reasons:
        - "spam_complaint": Too many spam complaints from ISPs
        - "blacklisted": Domain/IP blacklisted
        - "payment_failed": Payment failed 3x
        - "manual": Admin flagged for review
        - "terms_violation": Violated terms of service
        """
        abuse_signals = {
            "spam_complaint": 10,  # Suspend after 10 complaints
            "blacklisted": 1,       # Immediate
            "payment_failed": 3,    # After 3 failed charges
            "terms_violation": 1,   # Immediate
        }
        
        if reason_code not in abuse_signals:
            return False, f"Unknown reason: {reason_code}"
        
        # Check if threshold exceeded
        # In production, query abuse tracking table
        
        return True, reason_code
    
    @staticmethod
    def log_abuse_event(
        tenant_id: str,
        event_type: str,
        details: dict,
        db: Session
    ):
        """Log abuse event for review."""
        logger.warning(
            f"Abuse event for tenant {tenant_id}: {event_type} - {details}"
        )
        
        # TODO: Save to audit log / abuse table
        # This creates a record for manual review by admins


def generate_api_key() -> str:
    """Generate a secure API key."""
    return secrets.token_urlsafe(32)


def hash_api_key(api_key: str) -> str:
    """Hash API key for storage."""
    return hashlib.sha256(api_key.encode()).hexdigest()
