"""
Cloudflare API Integration for DNS management.
"""

import logging
import requests
from typing import Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)


class CloudflareClient:
    """Cloudflare API client for DNS management."""
    
    BASE_URL = "https://api.cloudflare.com/client/v4"
    
    def __init__(self):
        """Initialize Cloudflare client."""
        self.api_token = settings.CLOUDFLARE_API_TOKEN
        self.zone_id = settings.CLOUDFLARE_ZONE_ID
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }
    
    def create_zone(self, domain_name: str) -> Dict[str, Any]:
        """Create a Cloudflare zone for a domain."""
        try:
            url = f"{self.BASE_URL}/zones"
            payload = {
                "name": domain_name,
                "account": {"id": self.zone_id},
                "plan": {"id": "free"}
            }
            
            response = requests.post(url, json=payload, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            logger.info(f"Created Cloudflare zone for {domain_name}")
            
            return {
                "id": data["result"]["id"],
                "name": data["result"]["name"],
                "nameservers": data["result"]["name_servers"]
            }
        
        except Exception as e:
            logger.error(f"Cloudflare create_zone failed: {str(e)}")
            raise
    
    def create_a_record(self, zone_id: str, domain_name: str, ip_address: str) -> Dict[str, Any]:
        """Create an A record."""
        try:
            url = f"{self.BASE_URL}/zones/{zone_id}/dns_records"
            payload = {
                "type": "A",
                "name": domain_name,
                "content": ip_address,
                "ttl": 3600,
                "proxied": False,
            }
            
            response = requests.post(url, json=payload, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            logger.info(f"Created A record for {domain_name}")
            
            return data["result"]
        
        except Exception as e:
            logger.error(f"Cloudflare create_a_record failed: {str(e)}")
            raise
    
    def create_mx_record(self, zone_id: str, domain_name: str, priority: int, content: str) -> Dict[str, Any]:
        """Create an MX record."""
        try:
            url = f"{self.BASE_URL}/zones/{zone_id}/dns_records"
            payload = {
                "type": "MX",
                "name": domain_name,
                "content": content,
                "priority": priority,
                "ttl": 3600,
            }
            
            response = requests.post(url, json=payload, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            logger.info(f"Created MX record for {domain_name}")
            
            return data["result"]
        
        except Exception as e:
            logger.error(f"Cloudflare create_mx_record failed: {str(e)}")
            raise
    
    def create_txt_record(self, zone_id: str, domain_name: str, content: str) -> Dict[str, Any]:
        """Create a TXT record (for SPF, DKIM, DMARC)."""
        try:
            url = f"{self.BASE_URL}/zones/{zone_id}/dns_records"
            payload = {
                "type": "TXT",
                "name": domain_name,
                "content": content,
                "ttl": 3600,
            }
            
            response = requests.post(url, json=payload, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            logger.info(f"Created TXT record for {domain_name}")
            
            return data["result"]
        
        except Exception as e:
            logger.error(f"Cloudflare create_txt_record failed: {str(e)}")
            raise
    
    def get_dns_records(self, zone_id: str, record_type: str = None) -> list:
        """Get DNS records for a zone."""
        try:
            url = f"{self.BASE_URL}/zones/{zone_id}/dns_records"
            params = {}
            if record_type:
                params["type"] = record_type
            
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            return data["result"]
        
        except Exception as e:
            logger.error(f"Cloudflare get_dns_records failed: {str(e)}")
            raise
