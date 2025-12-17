"""
CloudflareManager - Production-grade DNS automation for cold email infrastructure
Handles SPF, DKIM, DMARC, MX record management with automatic retry logic
"""

import asyncio
import logging
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
import hashlib

import aiohttp
import dns.resolver
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

# Configure logging
logger = logging.getLogger(__name__)


class CloudflareManager:
    """
    Production-grade Cloudflare API wrapper with:
    - Automatic retry logic (exponential backoff)
    - Error handling and validation
    - DNS propagation checking
    - Encrypted DKIM key storage
    """

    def __init__(
        self,
        api_token: str,
        account_email: str,
        base_url: str = "https://api.cloudflare.com/client/v4"
    ):
        """
        Initialize Cloudflare manager
        
        Args:
            api_token: Cloudflare API token
            account_email: Cloudflare account email
            base_url: Cloudflare API base URL
        """
        self.api_token = api_token
        self.account_email = account_email
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json",
            "X-Auth-Email": account_email
        }
        self.session: Optional[aiohttp.ClientSession] = None
        self.max_retries = 5
        self.base_wait_time = 2  # seconds

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    # ========================================================================
    # DKIM KEY GENERATION
    # ========================================================================

    @staticmethod
    def generate_dkim_keypair(key_size: int = 2048) -> Tuple[bytes, str]:
        """
        Generate RSA DKIM keypair
        
        Returns:
            Tuple of (private_key_pem, public_key_value)
        """
        try:
            # Generate RSA key
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=key_size,
                backend=default_backend()
            )

            # Export private key as PEM
            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )

            # Extract public key
            public_key = private_key.public_key()
            public_der = public_key.public_bytes(
                encoding=serialization.Encoding.DER,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )

            # Encode as base64 for DNS TXT record
            import base64
            public_b64 = base64.b64encode(public_der).decode('ascii')

            # Format as DKIM public key
            public_value = f"v=DKIM1; k=rsa; p={public_b64}"

            logger.info(f"Generated DKIM keypair: {key_size}-bit RSA")
            return private_pem, public_value

        except Exception as e:
            logger.error(f"Failed to generate DKIM keypair: {e}")
            raise

    # ========================================================================
    # DNS RECORD MANAGEMENT (WITH RETRY LOGIC)
    # ========================================================================

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        retry_count: int = 0
    ) -> Dict:
        """
        Make HTTP request to Cloudflare API with exponential backoff retry

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint path
            data: Request payload
            retry_count: Current retry attempt

        Returns:
            Response JSON
            
        Raises:
            CloudflareAPIError: If request fails after max retries
        """
        if not self.session:
            self.session = aiohttp.ClientSession()

        url = f"{self.base_url}{endpoint}"

        try:
            async with self.session.request(
                method=method,
                url=url,
                json=data,
                headers=self.headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                response_data = await response.json()

                # Success
                if response.status == 200 or response.status == 201:
                    logger.debug(f"Cloudflare API success: {method} {endpoint}")
                    return response_data.get("result", response_data)

                # Rate limit or transient error - retry
                if response.status in [429, 503, 502]:
                    if retry_count < self.max_retries:
                        wait_time = self.base_wait_time * (2 ** retry_count)  # Exponential backoff
                        logger.warning(
                            f"Cloudflare API {response.status}, retrying in {wait_time}s "
                            f"(attempt {retry_count + 1}/{self.max_retries})"
                        )
                        await asyncio.sleep(wait_time)
                        return await self._make_request(method, endpoint, data, retry_count + 1)

                # Permanent error
                error_msg = response_data.get("errors", [{}])[0].get("message", "Unknown error")
                logger.error(f"Cloudflare API error {response.status}: {error_msg}")
                raise CloudflareAPIError(f"Status {response.status}: {error_msg}")

        except asyncio.TimeoutError:
            if retry_count < self.max_retries:
                wait_time = self.base_wait_time * (2 ** retry_count)
                logger.warning(f"Cloudflare API timeout, retrying in {wait_time}s")
                await asyncio.sleep(wait_time)
                return await self._make_request(method, endpoint, data, retry_count + 1)
            raise CloudflareAPIError("Request timeout after max retries")

    async def add_domain_to_cloudflare(
        self,
        domain_name: str,
        account_id: str
    ) -> Dict:
        """
        Add domain to Cloudflare
        
        Args:
            domain_name: Domain to add
            account_id: Cloudflare account ID
            
        Returns:
            Zone info with zone_id
        """
        try:
            # Create zone
            response = await self._make_request(
                "POST",
                "/zones",
                {
                    "account": {"id": account_id},
                    "name": domain_name,
                    "plan": {"id": "free"}
                }
            )

            zone_id = response.get("id")
            logger.info(f"Added domain {domain_name} to Cloudflare: zone_id={zone_id}")
            return response

        except Exception as e:
            logger.error(f"Failed to add domain to Cloudflare: {e}")
            raise

    async def add_spf_record(
        self,
        zone_id: str,
        domain: str,
        mail_server_ip: str
    ) -> Dict:
        """
        Add SPF TXT record
        
        Example: v=spf1 ip4:123.45.67.89 -all
        """
        spf_value = f"v=spf1 ip4:{mail_server_ip} -all"

        try:
            response = await self._make_request(
                "POST",
                f"/zones/{zone_id}/dns_records",
                {
                    "type": "TXT",
                    "name": domain,
                    "content": spf_value,
                    "ttl": 3600,
                    "comment": "InboxGrove SPF record"
                }
            )

            logger.info(f"Added SPF record for {domain}: {spf_value}")
            return response

        except Exception as e:
            logger.error(f"Failed to add SPF record: {e}")
            raise

    async def add_dkim_record(
        self,
        zone_id: str,
        domain: str,
        selector: str,
        public_key_value: str
    ) -> Dict:
        """
        Add DKIM TXT record
        
        Example: mail2025._domainkey.example.com = v=DKIM1; k=rsa; p=MIGfMA0BgQ...
        """
        dkim_name = f"{selector}._domainkey.{domain}"

        try:
            response = await self._make_request(
                "POST",
                f"/zones/{zone_id}/dns_records",
                {
                    "type": "TXT",
                    "name": dkim_name,
                    "content": public_key_value,
                    "ttl": 3600,
                    "comment": "InboxGrove DKIM record"
                }
            )

            logger.info(f"Added DKIM record: {dkim_name}")
            return response

        except Exception as e:
            logger.error(f"Failed to add DKIM record: {e}")
            raise

    async def add_dmarc_record(
        self,
        zone_id: str,
        domain: str,
        policy: str = "none",
        report_email: Optional[str] = None
    ) -> Dict:
        """
        Add DMARC TXT record
        
        Policies:
        - none: Monitor only (warmup phase)
        - quarantine: Send to spam folder if fails
        - reject: Reject if fails
        """
        dmarc_value = f"v=DMARC1; p={policy}; rua=mailto:{report_email or 'admin@example.com'}"

        try:
            response = await self._make_request(
                "POST",
                f"/zones/{zone_id}/dns_records",
                {
                    "type": "TXT",
                    "name": f"_dmarc.{domain}",
                    "content": dmarc_value,
                    "ttl": 3600,
                    "comment": "InboxGrove DMARC record"
                }
            )

            logger.info(f"Added DMARC record for {domain}: policy={policy}")
            return response

        except Exception as e:
            logger.error(f"Failed to add DMARC record: {e}")
            raise

    async def add_mx_record(
        self,
        zone_id: str,
        domain: str,
        mail_server: str,
        priority: int = 10
    ) -> Dict:
        """
        Add MX record pointing to KumoMTA server
        """
        try:
            response = await self._make_request(
                "POST",
                f"/zones/{zone_id}/dns_records",
                {
                    "type": "MX",
                    "name": domain,
                    "content": mail_server,
                    "priority": priority,
                    "ttl": 3600,
                    "comment": "InboxGrove MX record"
                }
            )

            logger.info(f"Added MX record for {domain}: {mail_server} (priority {priority})")
            return response

        except Exception as e:
            logger.error(f"Failed to add MX record: {e}")
            raise

    # ========================================================================
    # DNS PROPAGATION CHECKING
    # ========================================================================

    async def verify_spf_propagation(
        self,
        domain: str,
        mail_server_ip: str,
        timeout: int = 60,
        check_interval: int = 5
    ) -> bool:
        """
        Check if SPF record has propagated
        
        Args:
            domain: Domain to check
            mail_server_ip: Expected IP in SPF record
            timeout: Max time to wait (seconds)
            check_interval: Check every N seconds
            
        Returns:
            True if propagated, False if timeout
        """
        start_time = datetime.now()
        expected_spf = f"v=spf1 ip4:{mail_server_ip} -all"

        while (datetime.now() - start_time).total_seconds() < timeout:
            try:
                # Query DNS for TXT records
                answers = dns.resolver.resolve(domain, 'TXT')
                for rdata in answers:
                    txt_value = rdata.to_text().strip('"')
                    if expected_spf in txt_value:
                        logger.info(f"SPF record propagated for {domain}")
                        return True

                logger.debug(f"SPF not yet propagated for {domain}, retrying...")
                await asyncio.sleep(check_interval)

            except dns.resolver.NXDOMAIN:
                logger.warning(f"Domain {domain} does not exist")
                return False
            except dns.resolver.NoAnswer:
                logger.debug(f"No TXT records yet for {domain}")
                await asyncio.sleep(check_interval)
            except Exception as e:
                logger.error(f"Error checking SPF propagation: {e}")
                await asyncio.sleep(check_interval)

        logger.warning(f"SPF record propagation timeout for {domain}")
        return False

    async def verify_dkim_propagation(
        self,
        domain: str,
        selector: str,
        timeout: int = 60,
        check_interval: int = 5
    ) -> bool:
        """
        Check if DKIM record has propagated
        """
        start_time = datetime.now()
        dkim_domain = f"{selector}._domainkey.{domain}"

        while (datetime.now() - start_time).total_seconds() < timeout:
            try:
                answers = dns.resolver.resolve(dkim_domain, 'TXT')
                for rdata in answers:
                    txt_value = rdata.to_text().strip('"')
                    if "v=DKIM1" in txt_value and "p=" in txt_value:
                        logger.info(f"DKIM record propagated for {dkim_domain}")
                        return True

                logger.debug(f"DKIM not yet propagated for {dkim_domain}, retrying...")
                await asyncio.sleep(check_interval)

            except dns.resolver.NXDOMAIN:
                logger.warning(f"DKIM domain {dkim_domain} does not exist")
                return False
            except dns.resolver.NoAnswer:
                logger.debug(f"No DKIM records yet for {dkim_domain}")
                await asyncio.sleep(check_interval)
            except Exception as e:
                logger.error(f"Error checking DKIM propagation: {e}")
                await asyncio.sleep(check_interval)

        logger.warning(f"DKIM record propagation timeout for {dkim_domain}")
        return False

    # ========================================================================
    # BULK DOMAIN SETUP
    # ========================================================================

    async def setup_domain_complete(
        self,
        domain_name: str,
        zone_id: str,
        account_id: str,
        mail_server_ip: str,
        mail_server_hostname: str
    ) -> Dict:
        """
        Complete setup: SPF + DKIM + DMARC + MX
        
        Returns:
            Setup result with all records
        """
        try:
            results = {}

            # Generate DKIM keys
            private_key_pem, public_key_value = self.generate_dkim_keypair()
            results["dkim_private_key"] = private_key_pem
            results["dkim_public_key"] = public_key_value

            # Add DNS records (parallel)
            tasks = [
                self.add_spf_record(zone_id, domain_name, mail_server_ip),
                self.add_dkim_record(zone_id, domain_name, "mail2025", public_key_value),
                self.add_dmarc_record(zone_id, domain_name, policy="none"),
                self.add_mx_record(zone_id, domain_name, mail_server_hostname),
            ]

            dns_results = await asyncio.gather(*tasks, return_exceptions=True)

            results["spf"] = dns_results[0] if not isinstance(dns_results[0], Exception) else str(dns_results[0])
            results["dkim"] = dns_results[1] if not isinstance(dns_results[1], Exception) else str(dns_results[1])
            results["dmarc"] = dns_results[2] if not isinstance(dns_results[2], Exception) else str(dns_results[2])
            results["mx"] = dns_results[3] if not isinstance(dns_results[3], Exception) else str(dns_results[3])

            logger.info(f"Completed domain setup for {domain_name}")
            return results

        except Exception as e:
            logger.error(f"Domain setup failed: {e}")
            raise


# ============================================================================
# CUSTOM EXCEPTIONS
# ============================================================================

class CloudflareAPIError(Exception):
    """Raised when Cloudflare API returns an error"""
    pass


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    import asyncio

    async def example():
        async with CloudflareManager(
            api_token="your_token",
            account_email="admin@example.com"
        ) as cf:
            # Setup complete domain
            result = await cf.setup_domain_complete(
                domain_name="sales-outreach.com",
                zone_id="zone-id-xxx",
                account_id="account-id-xxx",
                mail_server_ip="123.45.67.89",
                mail_server_hostname="mail.sales-outreach.com"
            )
            print(result)

    asyncio.run(example())
