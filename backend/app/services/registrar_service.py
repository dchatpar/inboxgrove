"""
Namecheap API Integration - Adapter pattern for domain registrar.
Handles domain registration, DNS updates, and management.
"""

import logging
import requests
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from app.config import settings

logger = logging.getLogger(__name__)


class NamecheapRegistrar:
    """Namecheap registrar adapter."""
    
    BASE_URL = "https://api.sandbox.namecheap.com/xml.response" if settings.NAMECHEAP_SANDBOX else "https://api.namecheap.com/xml.response"
    
    def __init__(self):
        """Initialize Namecheap client."""
        self.api_key = settings.NAMECHEAP_API_KEY
        self.api_user = settings.NAMECHEAP_API_USER
        self.username = settings.NAMECHEAP_API_USER
    
    def check_availability(self, domain_name: str) -> Dict[str, Any]:
        """
        Check if domain is available.
        
        Args:
            domain_name: Domain to check (e.g., "acme-corp.com")
        
        Returns:
            Dictionary with availability and pricing
        """
        try:
            params = {
                "ApiUser": self.api_user,
                "ApiKey": self.api_key,
                "Username": self.username,
                "Command": "namecheap.domains.check",
                "DomainList": domain_name,
                "ClientIp": "1.2.3.4",  # TODO: Get actual client IP
            }
            
            response = requests.get(self.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            
            # Parse XML response
            import xml.etree.ElementTree as ET
            root = ET.fromstring(response.content)
            
            # Check for command success
            status = root.find(".//ApiResponse").get("Status")
            if status != "OK":
                raise Exception(f"API error: {status}")
            
            # Extract domain availability
            domain_check = root.find(".//DomainCheckResult")
            if domain_check is None:
                raise Exception("No domain check result in response")
            
            available = domain_check.get("Available") == "true"
            price = domain_check.get("PremiumRegistrationPrice")
            
            logger.info(f"Domain {domain_name} availability: {available}, price: {price}")
            
            return {
                "domain": domain_name,
                "available": available,
                "price": float(price) if price else 8.99,  # Default price
                "currency": "USD"
            }
        
        except Exception as e:
            logger.error(f"Namecheap check_availability failed: {str(e)}")
            raise
    
    def register_domain(
        self,
        domain_name: str,
        years: int = 1,
        auto_renew: bool = True,
        registrant_email: str = "admin@inboxgrove.com"
    ) -> Dict[str, Any]:
        """
        Register a domain.
        
        Args:
            domain_name: Domain to register
            years: Registration period (1-10 years)
            auto_renew: Enable auto-renewal
            registrant_email: Registrant email
        
        Returns:
            Registration details including domain ID
        """
        try:
            # This would call Namecheap domains.create API
            # For now, return mock data
            
            logger.info(f"Registering domain {domain_name} for {years} years")
            
            return {
                "domain_id": f"namecheap_{domain_name}",
                "domain": domain_name,
                "price": 8.99,
                "registration_date": datetime.utcnow().isoformat(),
                "expiry_date": (datetime.utcnow() + timedelta(days=365*years)).isoformat(),
                "auto_renew": auto_renew,
                "status": "Active"
            }
        
        except Exception as e:
            logger.error(f"Namecheap register_domain failed: {str(e)}")
            raise
    
    def update_nameservers(self, domain_name: str, nameservers: list) -> Dict[str, Any]:
        """Update nameservers for a domain."""
        try:
            logger.info(f"Updating nameservers for {domain_name}: {nameservers}")
            
            # Namecheap API call here
            
            return {"status": "success"}
        
        except Exception as e:
            logger.error(f"Namecheap update_nameservers failed: {str(e)}")
            raise
    
    def get_domain_info(self, domain_name: str) -> Dict[str, Any]:
        """Get domain information."""
        try:
            logger.info(f"Getting domain info for {domain_name}")
            
            # Namecheap API call here
            
            return {
                "domain": domain_name,
                "status": "Active",
                "expiry_date": datetime.utcnow() + timedelta(days=365),
            }
        
        except Exception as e:
            logger.error(f"Namecheap get_domain_info failed: {str(e)}")
            raise
