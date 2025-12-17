"""
Authentication API Endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
import jwt
from datetime import datetime, timedelta

from app.database.session import get_db
from app.database.models import Tenant, User, SubscriptionTier, SubscriptionStatus
from app.services.subscription_service import SubscriptionService
from app.config import settings
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    """Registration request."""
    company_name: str
    company_email: EmailStr
    company_website: Optional[str] = None
    password: str


class LoginRequest(BaseModel):
    """Login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    tenant_id: str
    subscription_tier: str


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new tenant.
    
    On signup:
    1. Create tenant account
    2. Hash password
    3. Auto-create 7-day trial
    4. Create Stripe customer
    5. Return JWT tokens
    
    Request:
    ```json
    {
        "company_name": "Acme Corp",
        "company_email": "admin@acme-corp.com",
        "company_website": "https://acme-corp.com",
        "password": "SecurePassword123!"
    }
    ```
    
    Response:
    ```json
    {
        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "token_type": "bearer",
        "tenant_id": "uuid...",
        "subscription_tier": "trial"
    }
    ```
    """
    try:
        # Check if tenant already exists
        existing = db.query(Tenant).filter(
            Tenant.company_email == request.company_email
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        # Create tenant
        tenant = Tenant(
            company_name=request.company_name,
            company_email=request.company_email,
            company_website=request.company_website,
        )
        
        db.add(tenant)
        db.flush()
        
        # Create trial
        SubscriptionService.create_trial(tenant, db)
        
        # Create JWT tokens
        access_token = _create_token(
            tenant_id=str(tenant.id),
            expires_delta=timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
        )
        
        refresh_token = _create_token(
            tenant_id=str(tenant.id),
            expires_delta=timedelta(days=settings.JWT_REFRESH_EXPIRY_DAYS),
            token_type="refresh"
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            tenant_id=str(tenant.id),
            subscription_tier=tenant.subscription_tier.value
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    
    Returns JWT tokens for authenticated requests.
    """
    try:
        # Find tenant (for now, simplified - in production use separate User table)
        tenant = db.query(Tenant).filter(
            Tenant.company_email == request.email
        ).first()
        
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Verify password (for now, accept any password - implement real auth)
        # In production: verify_password(request.password, tenant.password_hash)
        
        # Check if tenant is suspended
        if tenant.is_suspended:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account suspended"
            )
        
        # Check if trial expired (trigger payment reminder)
        SubscriptionService.check_trial_expired(tenant, db)
        
        # Create tokens
        access_token = _create_token(
            tenant_id=str(tenant.id),
            expires_delta=timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
        )
        
        refresh_token = _create_token(
            tenant_id=str(tenant.id),
            expires_delta=timedelta(days=settings.JWT_REFRESH_EXPIRY_DAYS),
            token_type="refresh"
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            tenant_id=str(tenant.id),
            subscription_tier=tenant.subscription_tier.value
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token."""
    try:
        payload = jwt.decode(
            refresh_token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        tenant_id = payload.get("tenant_id")
        if not tenant_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Verify tenant still exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        # Create new access token
        access_token = _create_token(
            tenant_id=tenant_id,
            expires_delta=timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            tenant_id=tenant_id,
            subscription_tier=tenant.subscription_tier.value
        )
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


def _create_token(
    tenant_id: str,
    expires_delta: timedelta,
    token_type: str = "access"
) -> str:
    """Create JWT token."""
    now = datetime.utcnow()
    expire = now + expires_delta
    
    payload = {
        "tenant_id": tenant_id,
        "type": token_type,
        "iat": now.timestamp(),
        "exp": expire.timestamp()
    }
    
    token = jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return token
